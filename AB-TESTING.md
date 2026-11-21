# A/B testing Briatti's contact funnel

The goal is narrow: **more of the right visitors open and submit the contact form.** This document
covers the system that serves the variants, how the measurement works, how to launch a test, and how
to read the result honestly.

Added 2026-11-18. The privacy description lives in [legal.html](legal.html#analytics); if the two
disagree, the legal page wins and this page is wrong.

## The pieces

| File | What it does |
| --- | --- |
| `js/experiments.config.js` | The experiments: keys, status, pages, traffic, hypotheses, variants, copy. |
| `js/ab.js` | Assignment engine. Loaded in `<head>` before the body, writes variants to `<html>`, swaps copy, fills the hidden form field, offers QA overrides. |
| `js/analytics.config.js` | PostHog project token, EU hosts, consent version. |
| `js/tracking.js` | Consent card and a ~10 KB first-party PostHog capture client. No posthog-js. |
| `css/experiments.css` | Variant CSS, the consent card, the mobile sticky CTA and the QA panel. |
| `tools/ab_report.py` | Reads PostHog with HogQL and computes rates, lift, 95% CI, p-values and sample sizes. |
| `legal.html#analytics` | What is collected, why, for how long and how to withdraw. |

No build step, no package manager, no third-party script. Deploying is still "edit the files and
push".

## One-time activation checklist

Nothing is measured and no experiment runs until step 1 is done: `requireAnalytics: true` makes the
engine stand down when the token is still the placeholder.

1. **Paste the project token.** In [js/analytics.config.js](js/analytics.config.js), replace
   `phc_REPLACE_WITH_EU_PROJECT_TOKEN` with the token from PostHog → Project settings. The token is
   public and write-only; it is not a personal API key. If the project is in the US region, change
   `ingestHost` to `https://us.i.posthog.com` and `appHost` to `https://us.posthog.com`, and update
   the region sentence in `legal.html`.
2. **Discard client IPs.** PostHog → Project settings → "Discard client IP data" = on. This is what
   the privacy notice promises.
3. **Set retention to 12 months.** PostHog → Project settings → data retention.
4. **Disable session recording and autocapture.** They are not part of this client, but the project
   settings should agree with the notice. If you ever enable them, update `legal.html` first.
5. **Verify an event.** Load the site with `?ab_debug=1`, allow analytics, submit the form, and check
   PostHog → Activity → Live events for `form_submit_success` with `ab_*` properties.
6. **Build the dashboard.** Add a Trends insight for `form_cta_click` and `form_submit_success`,
   broken down by `ab_hero_cta_copy` / `ab_form_button_copy` / `ab_form_friction`, plus a funnel
   `form_view → form_start → form_submit → form_submit_success`. Filter out `ab_preview = true` and
   any non-production `site_host`.
7. **Create the report credentials.** For `tools/ab_report.py`, create a personal API key with read
   access and set `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, and optionally `POSTHOG_APP_HOST`.
8. **Check the legal claim about IPs.** If step 2 cannot be verified in the live project, change the
   "IP addresses" paragraph in `legal.html` before deploying the banner.

## How assignment works

- Every visitor gets a random UUID. It is stored in `localStorage` under `briatti_vid` **only after
  analytics consent**; otherwise it lives in memory for the page view and disappears with the tab.
- For each experiment, the engine hashes `experiment.key + "|variant|" + visitorId` (FNV-1a, then a
  bucket from 0 to 100,000) and walks the variant weights. The result is deterministic: the same
  visitor gets the same variant on every page and every reload, with no server and no flag fetch.
- Traffic allocation uses a second hash (`|traffic|`) so turning an experiment from 100% to 50%
  does not reshuffle the variant of everyone already enrolled.
- `data-ab-<experiment-key>="<variant>"` is written to `<html>` while the head is parsed, before
  first paint. Structural changes are plain CSS selectors on that attribute, so there is no flash of
  the control. Above-the-fold copy is covered by `html.ab-copy-pending` for at most 1.2 s while it is
  swapped.
- The variant is also written into the hidden `ab_variants` field of the form, so every FormSubmit
  email says which versions the sender saw. This keeps the funnel readable even when analytics was
  declined. The value looks like
  `hero_cta_copy=pilot; form_button_copy=reply; form_friction=lean`.
- Preview overrides are stored under `briatti_ab_override` in the tester's own browser and tagged
  `ab_preview: true`, which the report excludes. A visit with `?ab_debug=1` is tagged the same way,
  so QA clicks never land in the experiment data.

### Why not PostHog feature flags?

Client-side flags need `posthog-js`, which has to load before the flag is known. On a static page that
means either a visible flicker of the control or a blocking request to a third party — both against
the constraints in `PRODUCT.md`. The assignment here is local and pre-paint. PostHog is used for
measurement, which is the part it is good at.

## Consent, and what it does to the numbers

The consent card appears on first visit (once a token is configured). **Allow** stores the choice
and the visitor id and starts sending events. **No thanks** stores only the refusal; no analytics
request is made and the stored id is deleted. Global Privacy Control and Do Not Track are treated as
refusals and suppress the card.

Consequences to keep in mind when reading results:

- **Only consenting visitors are measured.** Everyone sees a variant so the page does not flip
  between versions, but declined visitors are invisible to the experiment. If consenting visitors
  differ from the rest (they usually do), the result generalises to consenters, not to all traffic.
- **Ad blockers** block `*.posthog.com` for a minority of consenting visitors; they disappear from
  both arms, which is less harmful than disappearing from one.
- **Bots and previews** are filtered in the report by `ab_preview` and `site_host`, but not perfectly.
  Check PostHog's live events if a number looks impossible.
- Withdrawing consent stops future collection; it cannot un-send what was already sent. The notice
  says so.

## Funnel and events

| Event | When | Useful properties |
| --- | --- | --- |
| `$pageview` | Page load, after consent | `$current_url`, `$referrer`, `$session_id`, `ab_*` |
| `experiment_exposed` | Once per experiment per page load | `experiment`, `variant`, `experiment_name` |
| `form_cta_click` | Any link whose hash is `#contact` | `cta_location`, `cta_label` |
| `form_view` | Form is 35% in the viewport | `form_id` |
| `form_start` | First focus or input in the form | `first_field` (the field's name, never its value) |
| `form_submit` | Submit pressed, honeypot empty | `ms_since_start` |
| `form_submit_success` | FormSubmit returned success | `ms_since_start` |
| `form_submit_error` | Relay refused or network failed | — |
| `form_optional_revealed` | "Add company and phone" opened | — |
| `email_click` | A `mailto:` link | `cta_location` |
| `demo_open` | Link to `demo.html` | `cta_location` |

`cta_location` is one of `hero`, `nav`, `pilot`, `ladder`, `footer`, `contact`, `sticky-mobile`,
`other`.

Every event carries `ab_<experiment>` for every active experiment, plus `ab_preview` and
`ab_config_version`. That is what makes a conversion attributable without a join on the server.

### Which metric is primary

- **Click rate into the form:** `form_cta_click` ÷ visitors exposed. This is the user's "clickrate"
  and the primary metric for the hero and pilot tests. It moves first and needs the least traffic.
  For a test that changes one button, filter the event to that button's `cta_location`
  (`hero`, `pilot`, `sticky-mobile`) — clicks on the nav are not caused by the hero copy.
- **Form completion:** `form_submit_success` ÷ visitors exposed. This is the business outcome and
  the guardrail for every test. A change that lifts clicks but loses submissions is not a win.
- **Friction:** `form_start` and `form_submit` for the form-length test, with success as the guardrail.

Do not optimize `form_submit` (the attempt) without checking `form_submit_success`; a broken relay or
a slow network can lift attempts and destroy completions.

## The experiments in the box

| Key | Status | Change | Primary | Hypothesis |
| --- | --- | --- | --- | --- |
| `hero_cta_copy` | live | "Request a callback" → "Get a free pilot build" | `form_cta_click` | Naming the zero-risk offer removes the fear of a sales call. |
| `form_button_copy` | live | "Request a callback" → "Send — reply within a day" | `form_submit_success` | A reply window reduces the uncertainty of pressing send. |
| `form_friction` | live | Hides Company and Phone behind one disclosure and disables the hidden inputs | `form_start` | Optional fields still read as work; less visible work, more starts. |
| `pilot_cta_copy` | draft | "Claim the free pilot" → "Start with a free pilot build" | `form_cta_click` | "Start" describes a first step; "claim" asks for a transaction. |
| `sticky_mobile_cta` | draft | Adds a bottom bar on mobile after 700 px | `form_cta_click` | Phones need a persistent route back to the form. |

The three click-rate rows are counted only for their own button (`primaryFilter.cta_location` in the
config): a hero test should not be credited with nav clicks it did not cause. Three live tests at
50/50 split traffic three ways. That is only sensible if the site has enough
traffic; see the sample-size section. If it does not, pause two and run the highest-leverage change
(the hero CTA) alone. The config makes that a one-word edit.

## Adding an experiment

1. **Pick one change and one primary metric.** Write the hypothesis in the config; if you cannot
   state what behaviour changes and why, it is not ready.
2. **Add the experiment** to `js/experiments.config.js`:

```js
{
  key: 'form_headline',            // stable, snake_case, never reused
  name: 'Contact heading: outcome, not greeting',
  status: 'draft',                 // 'draft' until QA and the token are ready
  pages: ['index'],
  traffic: 100,                    // percent of eligible visitors
  primaryMetric: 'form_start',
  guardrail: 'form_submit_success',
  hypothesis: '...',
  variants: {
    control: { weight: 50 },
    outcome: { weight: 50, copy: { 'form.heading': 'What should we fix first?' } }
  }
}
```

3. **Add the hook to the markup** for a copy change:
   `data-ab-copy="form.heading"` on the element that holds the text. Keep the control text in the
   HTML — it is what a visitor with JS off sees, and it is the fallback if the engine fails.
4. **Or add CSS** for a structural change, keyed off the attribute:
   `html[data-ab-form_headline="outcome"] .some-element { ... }`. Never hide content with JS after
   paint; set the attribute pre-paint and let CSS do the work.
5. **Keep the variants truthful.** No invented scarcity, no discount that does not exist, no claim
   that would fail the "measured result" rule in `PRODUCT.md`.
6. **Do not touch a live experiment.** Editing its key, variants or weights reassigns visitors and
   merges two different tests into one data set. Archive it (`status: 'draft'`), add a new key.
7. **Run the QA checklist below**, then change `status` to `'live'`.

### Copy keys currently available

| Key | Element |
| --- | --- |
| `hero.cta` | Hero primary button |
| `pilot.cta` | Pilot band button |
| `form.submit` | Form submit button |

The key must match `data-ab-copy="..."` in the page. Two live experiments must not use the same key;
the engine does not stop you, so check the table before launching.

## QA checklist

Use a fresh profile or clear site data so the consent card and hashes are realistic.

1. `?ab=preview` shows the panel. Select each variant. The page reloads with the override and the
   copy/CSS changes. "View control" shows the original page.
2. `?ab=off` shows the control; `?ab=on` returns to normal; `?ab=reset` clears overrides.
3. With `?ab_debug=1` (and the real token absent or present), check `window.__briattiEvents` after
   allowing analytics. The pageview, exposure and form events should carry `ab_*` properties.
4. Submit the form once and confirm the FormSubmit email shows `ab_variants`. Delete the test
   submission from the mailbox if it is not wanted.
5. Keyboard-only pass on the consent card: Tab reaches both buttons, Enter activates, focus is
   visible, Escape is not required (a choice is required).
6. 320 px wide: the card fits, the mobile sticky CTA does not cover the form or the consent card, and
   the form's two columns stack.
7. JS off: the page is the control, the form posts normally, no consent card (nothing to consent to).
8. Reduced motion: the card and sticky CTA appear without animation.
9. Check `legal.html#analytics` links from the card and that the footer "Privacy settings" reopens it.

## Reading the result

### The quick way

```bash
export POSTHOG_API_KEY=phx_...        # personal key, read access only
export POSTHOG_PROJECT_ID=12345
export POSTHOG_APP_HOST=https://eu.posthog.com

python3 tools/ab_report.py report --experiment hero_cta_copy --metric form_cta_click --cta-location hero --days 30
python3 tools/ab_report.py report --experiment form_button_copy --metric form_submit_success --days 30
```

The report prints exposures, conversions, rates, relative lift, a 95% confidence interval for the
absolute difference and a two-sided p-value against control. It excludes `ab_preview` and every host
other than `www.briatti.com` by default (`--site-host ''` to include all). Use `--cta-location` to
count only clicks on the button a test actually changed.

### In PostHog

- **Trends:** event `form_cta_click`, "Unique users", breakdown by `ab_hero_cta_copy`, filtered to
  `ab_preview = false` and `site_host = www.briatti.com`.
- **Funnel:** `form_view → form_start → form_submit → form_submit_success`, conversion window 1 day,
  breakdown by the experiment property.
- **Experiment exposure** is `experiment_exposed`, not a pageview. Use it as the denominator when you
  build a manual ratio; the report does this for you.

### Statistical discipline

- **Set the sample size before looking.** `plan` gives it:

```bash
python3 tools/ab_report.py plan --baseline 0.10 --mde 0.25 --daily-visitors 60
```

  At a 10% CTA-click baseline, detecting +25% needs roughly 1,500 visitors per arm. At a 3%
  submission baseline, detecting +30% needs about 6,500 per arm — and at 40 visitors a day that is
  most of a year. The honest response to low traffic is to test bigger changes (the offer, the
  number of fields, a persistent mobile CTA), not to declare a winner on 40 clicks.
- **One primary metric and one guardrail per test.** The rest are diagnostics.
- **Do not stop the moment p < 0.05.** Repeated looks inflate false positives. Decide the sample or
  the end date in advance, or use a sequential/Bayesian method that is designed for peeking.
- **Three concurrent tests multiply the chance of a false positive.** If you need a strict family-wise
  error rate, use α = 0.05/3 ≈ 0.017, or treat the two secondary tests as exploratory. The report's
  default is 0.05; pass judgement with the multiple-comparison caveat in mind.
- **Practical significance beats p-values.** A +4% lift on 20 conversions is not a reason to rewrite
  the page. Check the absolute numbers, the confidence interval and the guardrail.
- **Wait for a full week or two.** Weekday traffic, launches and seasonality are real.
- **Do not change the page mid-test.** Any unrelated fix becomes another difference between arms.

### When there is a winner

1. Copy the winning variant's markup/copy into the control (the HTML), not into a new experiment.
2. Set the old experiment to `status: 'draft'` and keep the config for the record.
3. Start a new experiment with a new key for the next change. Never reuse the key.
4. Deploy, then confirm the new control page in `?ab=off`.

### When a test loses or is flat

- A flat result on a copy change is information: the button label is not the constraint. Move to the
  offer, the form length, or the traffic source.
- A guardrail regression (clicks up, submissions down) is a loss, not a win.
- If a variant is worse and traffic is expensive, stop it early. That is not optional stopping in the
  hypothesis-testing sense — you are limiting harm, and you should say the result is inconclusive.

## Fail-safes

- No valid PostHog token → no experiment runs (`requireAnalytics: true`), so the site cannot split
  traffic it cannot measure.
- `ab.js` missing or broken → the page renders the control, because the control copy is in the HTML.
- `ab.js` fails after adding `ab-copy-pending` → a 1.2 s timer removes the cover, so the hero button
  is never invisible for longer than that.
- Consent denied → no analytics request, and the stored visitor id is removed.
- Consent card blocked by an extension → the page still works; no analytics is sent; the footer
  control is a normal button.
- PostHog unreachable → events are lost (there is no local queue), but the page and the form are
  unaffected. This is a measurement outage, not a site outage.

## Deploying a change

- The site is static GitHub Pages. Push the branch settings already use; there is no build.
- When `js/` or `css/` changes, bump the `?v=20261118` query on the five asset tags in all four pages.
  GitHub Pages caches for about ten minutes, and a stale `ab.js` paired with a new config is the one
  way to get a confusing variant. The page HTML is not versioned.
- The PostHog project token in `js/analytics.config.js` is public by design. A **personal** API key
  (for `tools/ab_report.py`) is not: keep it in your shell or a password manager, never in this repo.
- After deploying, open the live site with `?ab=preview`, confirm one variant, then delete the
  `briatti_ab_override` entry (the "Clear overrides" button) so your own visit is not counted.

## Known limits

- The report is frequentist and does not correct for multiple comparisons or sequential looks.
- Consent bias is real. Track the consent rate on the consent card itself if it becomes a concern;
  the card is a UI component, not a research participant.
- `form_submit_success` depends on FormSubmit's response. If the relay changes its JSON shape, the
  site shows an error and the event will not fire; check the relay before blaming the test.
- The visitor id is per browser and per storage. Clearing storage or using a private window creates
  a new visitor; a person who uses two devices counts twice.
- The report uses exposures as the denominator and attributes a conversion by the event's `ab_*`
  property. If an exposure request is lost but the conversion gets through, that arm's rate is
  slightly overstated; there is no server-side join to correct it.
- One page load sends one `$pageview` and one exposure per experiment. A visitor who reloads ten
  times still counts once in the report because it counts unique `distinct_id`s, but the raw event
  counts in PostHog are higher.
