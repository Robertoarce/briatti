#!/usr/bin/env python3
"""Read a Briatti A/B experiment out of PostHog, or plan its sample size.

This uses PostHog's Query API (HogQL), not the ingestion token. Create a personal API key with
read access to the project and export:

    export POSTHOG_API_KEY=phx_...
    export POSTHOG_PROJECT_ID=12345
    export POSTHOG_APP_HOST=https://eu.posthog.com   # default

Examples:
    python3 tools/ab_report.py report --experiment hero_cta_copy --metric form_cta_click --cta-location hero
    python3 tools/ab_report.py report --experiment form_friction --metric form_submit_success --days 14
    python3 tools/ab_report.py plan --baseline 0.03 --mde 0.30 --daily-visitors 40

The report counts unique visitors (`distinct_id`), excludes preview overrides, and
compares each variant with `control` using a two-proportion z-test. It is a read-only convenience;
PostHog's own trends and funnels remain the source of truth.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

ALLOWED_METRICS = {
    "form_cta_click",
    "form_view",
    "form_start",
    "form_submit",
    "form_submit_success",
}
Z_95 = 1.959963984540054
Z_80 = 0.8416212335729143


@dataclass
class Arm:
    variant: str
    exposed: int
    converted: int

    @property
    def rate(self) -> float:
        return self.converted / self.exposed if self.exposed else 0.0


def two_sided_p(z: float) -> float:
    return math.erfc(abs(z) / math.sqrt(2.0))


def query(api_key: str, app_host: str, project_id: str, sql: str) -> list[dict[str, Any]]:
    url = f"{app_host.rstrip('/')}/api/projects/{project_id}/query/"
    body = json.dumps({"query": {"kind": "HogQLQuery", "query": sql}}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:800]
        raise SystemExit(f"PostHog answered HTTP {error.code}: {detail}") from error
    except urllib.error.URLError as error:
        raise SystemExit(f"Could not reach PostHog: {error.reason}") from error

    columns = payload.get("columns") or []
    rows = payload.get("results") or []
    if not columns:
        return [dict(zip([f"col{i}" for i in range(len(row))], row)) for row in rows]
    return [dict(zip(columns, row)) for row in rows]


def sql_for(experiment: str, days: int, site_host: str | None) -> tuple[str, str]:
    host_filter = ""
    if site_host:
        host_filter = f" AND properties.site_host = '{site_host}'"
    preview_filter = " AND (properties.ab_preview IS NULL OR properties.ab_preview = false)"
    property_name = f"ab_{experiment}"
    exposures = f"""
        SELECT properties.{property_name} AS variant,
               count(DISTINCT distinct_id) AS exposed
        FROM events
        WHERE event = 'experiment_exposed'
          AND properties.experiment = '{experiment}'
          AND properties.{property_name} IS NOT NULL
          AND timestamp >= now() - INTERVAL {days} DAY
          {preview_filter}{host_filter}
        GROUP BY variant
    """
    return exposures, property_name


def conversions_sql(
    property_name: str,
    metric: str,
    days: int,
    site_host: str | None,
    cta_location: str | None = None,
) -> str:
    host_filter = ""
    if site_host:
        host_filter = f" AND properties.site_host = '{site_host}'"
    preview_filter = " AND (properties.ab_preview IS NULL OR properties.ab_preview = false)"
    location_filter = ""
    if metric == "form_cta_click" and cta_location:
        location_filter = f" AND properties.cta_location = '{cta_location}'"
    return f"""
        SELECT properties.{property_name} AS variant,
               count(DISTINCT distinct_id) AS converted
        FROM events
        WHERE event = '{metric}'
          AND properties.{property_name} IS NOT NULL
          AND timestamp >= now() - INTERVAL {days} DAY
          {preview_filter}{host_filter}{location_filter}
        GROUP BY variant
    """


def build_arms(exposures: list[dict[str, Any]], conversions: list[dict[str, Any]]) -> list[Arm]:
    exposure_map = {str(row["variant"]): int(row["exposed"] or 0) for row in exposures if row.get("variant")}
    conversion_map = {
        str(row["variant"]): int(row["converted"] or 0) for row in conversions if row.get("variant")
    }
    variants = sorted(set(exposure_map) | set(conversion_map))
    if "control" in variants:
        variants.remove("control")
        variants.insert(0, "control")
    return [Arm(v, exposure_map.get(v, 0), conversion_map.get(v, 0)) for v in variants]


def pct(value: float) -> str:
    return f"{value * 100:.2f}%"


def pp(value: float) -> str:
    return f"{value * 100:+.2f} pp"


def report(args: argparse.Namespace) -> None:
    experiment = args.experiment
    if not experiment or not re.fullmatch(r"[A-Za-z0-9_]+", experiment):
        raise SystemExit("--experiment must contain only letters, digits and underscores")
    if args.site_host and not re.fullmatch(r"[A-Za-z0-9.:-]+", args.site_host):
        raise SystemExit("--site-host contains characters that are not a hostname")

    api_key = os.environ.get("POSTHOG_API_KEY")
    project_id = os.environ.get("POSTHOG_PROJECT_ID")
    app_host = args.host or os.environ.get("POSTHOG_APP_HOST") or "https://eu.posthog.com"
    if not api_key or not project_id:
        raise SystemExit("Set POSTHOG_API_KEY and POSTHOG_PROJECT_ID (see the top of this file).")

    exposures_sql, property_name = sql_for(experiment, args.days, args.site_host)
    if args.cta_location and not re.fullmatch(r"[A-Za-z0-9_-]+", args.cta_location):
        raise SystemExit("--cta-location must be a location slug such as hero or sticky-mobile")
    conversion_sql = conversions_sql(
        property_name, args.metric, args.days, args.site_host, args.cta_location
    )
    arms = build_arms(
        query(api_key, app_host, project_id, exposures_sql),
        query(api_key, app_host, project_id, conversion_sql),
    )

    if not arms:
        raise SystemExit(
            f"No events for {experiment} in the last {args.days} days. "
            "Is the experiment live, and is the token configured?"
        )

    control = next((arm for arm in arms if arm.variant == (args.control or "control")), None)
    if control is None:
        control = arms[0]
        print(f"warning: no '{args.control}' arm; using '{control.variant}' as control", file=sys.stderr)

    rows: list[dict[str, Any]] = []
    for arm in arms:
        row: dict[str, Any] = {
            "variant": arm.variant,
            "exposed": arm.exposed,
            "converted": arm.converted,
            "rate": arm.rate,
            "relative_lift": None,
            "absolute_lift": None,
            "ci95_absolute": None,
            "p_value": None,
            "significant": None,
        }
        if arm is not control and control.exposed and arm.exposed:
            diff = arm.rate - control.rate
            se_diff = math.sqrt(
                control.rate * (1 - control.rate) / control.exposed
                + arm.rate * (1 - arm.rate) / arm.exposed
            )
            pooled = (control.converted + arm.converted) / (control.exposed + arm.exposed)
            pooled_se = math.sqrt(pooled * (1 - pooled) * (1 / control.exposed + 1 / arm.exposed))
            if se_diff > 0:
                row["ci95_absolute"] = (diff - Z_95 * se_diff, diff + Z_95 * se_diff)
            if pooled_se > 0:
                row["p_value"] = two_sided_p(diff / pooled_se)
                row["significant"] = row["p_value"] < 0.05
            else:
                row["p_value"] = 1.0
                row["significant"] = False
            if control.rate > 0:
                row["relative_lift"] = diff / control.rate
            row["absolute_lift"] = diff
        rows.append(row)

    if args.json:
        print(json.dumps({
            "experiment": experiment,
            "metric": args.metric,
            "days": args.days,
            "control": control.variant,
            "arms": rows,
        }, indent=2))
        return

    print(f"\nExperiment: {experiment}")
    print(f"Metric:     {args.metric} (unique visitors, last {args.days} days, control = {control.variant})\n")
    print("| Variant | Exposed | Converted | Rate | Lift vs control | 95% CI (absolute) | p |")
    print("| --- | ---: | ---: | ---: | ---: | ---: | ---: |")
    for row in rows:
        if row["variant"] == control.variant:
            lift = "—"
            ci = "—"
            p_value = "—"
        else:
            lift = "—" if row["relative_lift"] is None else f"{row['relative_lift'] * 100:+.1f}%"
            ci = "—" if row["ci95_absolute"] is None else f"{pp(row['ci95_absolute'][0])} to {pp(row['ci95_absolute'][1])}"
            p_value = "—" if row["p_value"] is None else f"{row['p_value']:.3f}"
        print(
            f"| {row['variant']} | {row['exposed']:,} | {row['converted']:,} | "
            f"{pct(row['rate'])} | {lift} | {ci} | {p_value} |"
        )

    print("\nReading it:")
    for row in rows:
        if row["variant"] == control.variant:
            continue
        if row["p_value"] is None:
            print(f"- {row['variant']}: not enough data in one arm to compare.")
            continue
        verdict = "clear at 95%" if row["significant"] else "not clear at 95%"
        print(
            f"- {row['variant']}: {pct(row['rate'])} vs {pct(control.rate)} "
            f"({row['relative_lift'] * 100:+.1f}%, p = {row['p_value']:.3f}) — {verdict}."
        )
        if min(control.exposed, row["exposed"]) < 100:
            print("  Fewer than 100 visitors in an arm: treat this as a direction, not a result.")
    if args.site_host:
        print(f"\nPreview overrides are excluded and only events from {args.site_host} are counted.")
    else:
        print("\nPreview overrides are excluded; every host is included (--site-host was empty).")
    print("Do not stop a test on a p-value alone; check the guardrail and the absolute numbers too.\n")


def plan(args: argparse.Namespace) -> None:
    baseline = args.baseline
    mde = args.mde
    if not (0 < baseline < 1):
        raise SystemExit("--baseline must be a fraction between 0 and 1 (e.g. 0.03 for 3%)")
    if not (0 < mde < 5):
        raise SystemExit("--mde must be a positive relative change (e.g. 0.30 for +30%)")
    target = baseline * (1 + mde)
    if target >= 1:
        raise SystemExit("baseline * (1 + mde) must stay below 100%")

    z_alpha = Z_95 if args.alpha == 0.05 else _z_for_alpha(args.alpha)
    z_power = Z_80 if args.power == 0.8 else _z_for_power(args.power)
    numerator = (z_alpha + z_power) ** 2 * (
        baseline * (1 - baseline) + target * (1 - target)
    )
    denominator = (target - baseline) ** 2
    per_arm = math.ceil(numerator / denominator)

    print("\nSample size for a two-arm test")
    print(f"  baseline conversion: {pct(baseline)}")
    print(f"  detectable lift:     {mde * 100:.0f}% relative ({pct(target)})")
    print(f"  alpha / power:       {args.alpha:.2f} / {args.power:.2f}")
    print(f"  required per arm:    {per_arm:,} visitors")
    print(f"  total:               {per_arm * 2:,} visitors")
    print(f"  expected conversions per arm: {per_arm * baseline:,.0f}")
    if args.daily_visitors:
        days = math.ceil((per_arm * 2) / args.daily_visitors)
        print(f"  at {args.daily_visitors:,} visitors/day: about {days} days")
    print("\nRules of thumb: one primary metric, one guardrail, and no peeking-and-stopping.")
    print("If the site gets less traffic than this, test a bigger change (the offer, the form length)")
    print("and accept that the result will be directional.\n")


def _z_for_alpha(alpha: float) -> float:
    # Two-sided normal quantile without scipy: binary search on the survival function.
    target = 1 - alpha / 2
    low, high = 0.0, 10.0
    for _ in range(100):
        mid = (low + high) / 2
        cdf = 0.5 * math.erfc(-mid / math.sqrt(2))
        if cdf < target:
            low = mid
        else:
            high = mid
    return (low + high) / 2


def _z_for_power(power: float) -> float:
    # One-sided quantile: Phi^-1(power).
    low, high = 0.0, 10.0
    for _ in range(100):
        mid = (low + high) / 2
        cdf = 0.5 * math.erfc(-mid / math.sqrt(2))
        if cdf < power:
            low = mid
        else:
            high = mid
    return (low + high) / 2


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    report_parser = sub.add_parser("report", help="compute rates, lift and significance for one experiment")
    report_parser.add_argument("--experiment", required=True)
    report_parser.add_argument("--metric", default="form_cta_click", choices=sorted(ALLOWED_METRICS))
    report_parser.add_argument(
        "--cta-location",
        default=None,
        help="for form_cta_click, count only this CTA location (hero, pilot, nav, footer, sticky-mobile)",
    )
    report_parser.add_argument("--days", type=int, default=30)
    report_parser.add_argument("--control", default="control")
    report_parser.add_argument("--site-host", default="www.briatti.com", help="set to '' to include every host")
    report_parser.add_argument("--host", default=None, help="PostHog app host (default POSTHOG_APP_HOST)")
    report_parser.add_argument("--json", action="store_true")
    report_parser.set_defaults(func=report)

    plan_parser = sub.add_parser("plan", help="sample size for a two-arm test")
    plan_parser.add_argument("--baseline", type=float, default=0.03, help="current conversion rate, e.g. 0.03")
    plan_parser.add_argument("--mde", type=float, default=0.3, help="relative lift to detect, e.g. 0.3 for +30%%")
    plan_parser.add_argument("--alpha", type=float, default=0.05)
    plan_parser.add_argument("--power", type=float, default=0.8)
    plan_parser.add_argument("--daily-visitors", type=int, default=0)
    plan_parser.set_defaults(func=plan)

    args = parser.parse_args()
    if args.command == "report" and args.site_host == "":
        args.site_host = None
    args.func(args)


if __name__ == "__main__":
    main()
