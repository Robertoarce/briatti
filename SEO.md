# SEO.md

Search-facing facts for briatti.com: heading structure, crawler access, and what people actually
search for. Product truth lives in `PRODUCT.md`, the design system in `DESIGN.md`. This file records
evidence and the reasoning behind it, not intentions.

## Heading structure

Verified 2026-10-25 by extracting every `h1`–`h6` from the four pages, ignoring comments, scripts,
styles and SVG.

| Page | h1 | h2 | h3 | Verdict |
| --- | --- | --- | --- | --- |
| `index.html` | 1 | 9 | 14 | Clean: one h1, no skipped level, no empty or hidden heading |
| `demo.html` | 1 | 8 | 9 | Fixed on this date; see below |
| `legal.html` | 1 | 7 | 0 | Clean |
| `404.html` | 1 | 0 | 0 | Clean |

`demo.html` used to jump straight from its h1 to h3: the chart and insight cards were `h3` and their
sub-items `h4`. The tags are now promoted in one pass (`h3` → `h2`, `h4` → `h3`), and the four CSS
selectors that were bound to the old levels moved with them: `.chart-hdr`, `.insights-hdr`,
`.diag-side-card`, `.report-card`. Rendering was checked in the browser afterwards and is unchanged —
14px/600 in both headers, 12px in the side card, 14px in the report cards.

Two caveats recorded rather than acted on:

- **The hero h1 is fixed.** The four-phrase rotator was removed on 2026-10-25. The h1 now reads
  "We put AI engineering to work on the business you already run." once, so a crawler no longer
  concatenates four phrases and the page has one stable title. The h1 still carries the primary
  discipline (AI engineering); automation, optimisation and data engineering remain in the services
  copy and the body.
- **`demo.html` has a UI-shaped h1.** Its `h1` is the mock app's page title (`Dashboard`, rewritten by
  script as sections change), while the page's own title is in `<title>`. That is reasonable for a
  demo and is not worth diverging from the design.

## Crawler access

Verified 2026-10-25. `https://www.briatti.com/robots.txt` answers HTTP 200 and is byte-identical to
the copy in this repository.

- **No `Disallow` anywhere.** `User-agent: *` with `Allow: /` already admits Googlebot, Bingbot and
  everything else; the named groups (Google-Extended, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
  PerplexityBot, CCBot) restate the same permission for AI crawlers.
- The sitemap is declared at the bottom of the file.
- Nothing needed changing. Adding an explicit `Googlebot` group would be redundant with `*`.

## Keyword research

Method, 2026-10-25: Google Autocomplete (`gl=fr`, `hl=en`) on 18 seeds, 124 suggestions returned.
These are real queries people type into Google. **They are not volumes** — no free source gives
volumes, and both credible ones need credentials the site does not have yet (see the last section).

### What the data says

**1. "AI readiness audit" / "AI readiness assessment" — the strongest fit.** Suggestions run deep:
`ai readiness audit`, `ai readiness audit tool`, `ai readiness assessment`, `… framework`,
`… tool`, `… methodology`, `… template`, `… pdf`, plus vendor-shaped variants
(`… servicenow`, `… microsoft`). Vendor names in the tail mean buyers are comparing providers, not
reading for fun. The site already uses this name for its entry offer and anchors it at `#offer-audit`.
Keep the name as it is.

**2. "AI data readiness" — commercial intent, same family.** `ai data readiness services`,
`… assessment`, `… checklist`, `… framework`, `… inspector`, plus consultancy names (mckinsey) in the
tail. "Data readiness" is the phrase buyers pair with *services*, which is exactly what
"AI / Data Readiness Audit" already says.

**3. "AI consultant for small business" — the biggest gap, and a wording one.** The cluster is
buyer-level and specific: `ai consultant for small business`, `… near me`,
`ai implementation consultant for small business`, `ai automation consultant for small businesses`,
`ai consulting services for small business`, `best ai consulting for small businesses`,
`ai consulting rates`. The site uses "consultant" exactly once, and in the other direction — the about
section contrasts Briatti with "most AI consultants". A buyer searching "AI consultant for small
business" would not find that vocabulary on the page. Changing it is a copy decision under
`PRODUCT.md`'s voice rules, not a mechanical edit; the honest option is to let the phrase appear once
where it is true, for instance in the about or hero copy.

**4. Document Q&A — demand exists, but it is software shopping.** `chat with your documents`,
`chat with a document ai`, `document q&a`, `document q&a system`, `document q&a chatbot`,
`document qa / rag`, `file q&a`, `ask questions to pdf ai`, `ask about pdf ai`,
`ask questions from pdf ai free`. The searcher wants a product, and the results are products. The site
sells a service ("File Q&A Assistant"). Ranking here is a product-page fight, not a services fight —
not worth chasing.

**5. Top of funnel.** `what is ai readiness`, `what is ai readiness assessment`,
`what is ai readiness audit`, `what is ai ready data`. The Readiness Ladder already answers this in
substance; nothing needs to be added until there is query data showing the page is close to ranking.

### Terms not to adopt

- **"ai automation agency"** — high volume, wrong intent. The suggestions are dominated by people
  trying to *start* an agency: `… course`, `… course free`, `… reddit`, `… hub`, `… in india`,
  `… in pakistan`, `… website`. The site sells "Agent Automation"; adopting "agency" would attract
  competitors rather than buyers.
- **"ai pilot"** — Microsoft Copilot, a fighter-jet programme, and MSFS 2024. "Zero-Risk Pilot" is
  good language for a human reader and invisible to search; it should not be forced into query
  language.
- **"ai readiness index"** — country and education indices (UNESCO, Singapore, Oxford). Not the offer.
- **"business intelligence dashboard small business"** and **"data audit small business"** — both
  returned *no* suggestions at all. That phrasing is not how anyone searches. Do not build pages
  around it.

### What this does and does not license

`PRODUCT.md` is explicit that copy is not rewritten around long-tail queries, and that stays true.
This file records demand. Any change to the site's language is a deliberate decision that has to keep
the voice rules and the published-price commitments.

## What would make this measurable

- **Volumes and competition:** Google Ads Keyword Planner, through the Ads API. Needs an Ads account
  and an approved developer token.
- **What the site already surfaces for:** Search Console Search Analytics (queries, impressions,
  position). Needs the OAuth client described in `PRODUCT.md`'s owner-side actions.
- **Index state per URL:** Search Console URL Inspection.

Until at least one of those exists, everything above is demand evidence without a scoreboard.

## Baseline, recorded 2026-10-25

Taken the day the property was created, so it is the starting line rather than a result.

- **Property:** `https://www.briatti.com/` (URL prefix), verified 2026-10-25 through the HTML-file
  method. The file is `google58cdbe91304840da.html` at the site root, committed as `51dc901`, and it
  must stay in place or verification lapses. Owner account: `titorimus@gmail.com`.
- **Sitemap:** `https://www.briatti.com/sitemap.xml` submitted 2026-10-25 10:11Z. Listed with
  `errors: 0`, `warnings: 0`, `isPending: true`.
- **Coverage at verification**, from URL Inspection:
  - `/` — *Submitted and indexed*, last crawled 2026-10-18, `robotsTxtState: ALLOWED`,
    Google-selected canonical equals the user-declared one.
  - `/demo.html` — *Discovered, currently not indexed*.
  - `/legal.html` — *URL is unknown to Google*.
  Both unindexed pages were put into the priority crawl queue through *Request indexing* on the same
  day, so their next state is Google's to decide, not ours.
- **Performance:** Search Analytics for 2026-09-27 → 2026-10-24 returned **no rows** — the response
  contained only `responseAggregationType: byProperty`. That is expected: Search Console only
  accumulates data from the moment a property exists, and the UI still said "processing data, please
  check again in a day or so".

What to compare next time: clicks, impressions, average position and the query list for
`https://www.briatti.com/`, plus whether `/demo.html` and `/legal.html` moved out of their current
coverage states. Until roughly 2026-10-28 there is nothing meaningful to read.
