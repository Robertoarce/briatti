# PRODUCT.md

Durable product truth for briatti.com. Design decisions live in `DESIGN.md`; this file records
what the product is, who it is for, and what must not change without a deliberate decision.

## What this is

The marketing site for **Briatti**, an AI and data consultancy. Static HTML served by
GitHub Pages (the published content matches `site/merge` as of 2026-10-25; confirm the branch in the
Pages settings). No build step, no framework, no package manager. Four pages:

- `index.html` - the landing page (the product)
- `demo.html` - a working, self-contained executive dashboard demo the landing page links to
- `legal.html` - who operates the site, what it does with your data, and the terms prices are on
- `404.html` - the not-found page

## The brand board

The palette and icon come from the board at `_source/img/qwenlogo.png` (kept out of the published
site): ink `#111111`, cobalt `#1F4E79`, teal `#164E4A`, sand `#E6E1D8`. The owner keeps the logo
plate `#FBFBFA` for the paper and the original cool neutrals; the board's `#FAF9F6` is not used.
The page ink is the original `#11181D`; the favicon, OG card and Organization logo keep the board's
`#111111`, a deliberate one-step split. `img/favicon.svg` is the canonical icon: the nav, footer,
legal page, 404 page, OG card and `Organization` logo all use it. The bare mark survives only in the
chat avatar.

The visual layer is the pre-redesign one: the hero carries the cobalt-to-teal gradient word, three
blurred colour fields, the pulse dot, the raised 12px gradient panel and the gradient action; the
Readiness Ladder is the one dark band; the Zero-Risk Pilot is the cobalt-tint band; the chat keeps
the teal assistant bubble. The sections below the hero stay flat and border-first.

## Who it is for

Operators at small and mid-sized companies, not technical buyers:

- Operations teams
- Finance and accounting
- Commercial and sales ops
- Supply chain
- HR and knowledge teams

They arrive skeptical of AI. Many have been pitched before. What they actually have is scattered,
undocumented data and no idea which workflow is worth automating first.

## The commercial proposition

**The practice is broader than the offers.** Briatti is an AI engineering practice, and the page
frames it with three disciplines: **AI engineering** (models, pipelines, agents built to run in
production), **automation** (workflows that stop consuming hours) and **optimisation** (process,
model cost and performance, and commercial decisions). The four offers below are the way those
disciplines are bought, not the limit of what the practice does. Optimisation is spelled out that way
on purpose: it covers process, running cost and decisions, so no single reading is over-promised.

The data is never the pitch. Documents, spreadsheets and messy files are ordinary inputs; the promise
is what gets built on top of them. Copy that reduces Briatti to "we turn your PDFs into a dashboard"
is off-brand and should be rewritten, not published.

1. **AI / Data Readiness Audit** - entry offer, fixed price, 1 week. The wedge.
2. **Dashboard + AI Insights** - the volume product.
3. **File Q&A Assistant** - cited answers over company documents.
4. **Agent Automation** - tailored, largest engagements.
5. **Zero-Risk Pilot** - build the first solution at no cost; the client owes nothing if unhappy.
   This is the differentiator. It must not be silently deleted.
6. **AI Readiness Ladder** - a 6-rung maturity model (Data Chaos to Agentic Automation) used to
   let a prospect self-locate. It is the main "where am I?" device on the page.

Published prices are a commercial commitment. They live on the page and in structured data and
must stay consistent between the two. Never invent or interpolate a price.

### How a call to action works

The funnel ends in a form. Analytics records the path to it; the form is the only place a visitor's message leaves the page.

- **One address, publicly: `contact@briatti.com`.** It is what the footer, the form relay, the
  structured data and the legal page all use. `roberto.arce@briatti.com` still exists and still
  receives mail, but it is not the address the site advertises.
- **Every call to action is an anchor to `#contact`**, not a `mailto:` link: the hero says "Request
  a callback", the nav and footer say "Contact", and the pilot band says "Claim the free pilot".
  The nav is the persistent action; the dashboard demo is a normal link. A `mailto:` fails silently
  on any machine with no mail handler, which is common on desktop, so it must never be the only route.
- **The form posts to FormSubmit** (`formsubmit.co/contact@briatti.com`), a relay that forwards the
  message by email. With JS on, the script intercepts the submit, posts to the relay's `/ajax/`
  endpoint and reports the result in the page; with JS off the plain POST still works and the visitor
  lands on the relay's confirmation page.
- **`_captcha` is `false` on purpose.** The relay's default is Google reCAPTCHA, which would load a
  third-party script — the opposite of everything else on this site. Spam is handled by the `_honey`
  honeypot field instead, plus the fact that the form has no publicly linked endpoint.
- **`source` records which button sent them** ("Request a callback", "Claim the free pilot", or
  "nav: Contact"/"footer: Contact"), set by the script on click. The analytics client records the
  same click, and the hidden `ab_variants` field carries the test variants the visitor saw into the
  relay email. With JS off, neither is set; `source` stays "contact section".
- **A plain email fallback sits under each CTA**, and a click on it copies the address and says so.
  That is progressive enhancement: with JS off the printed address is still there.

The relay is activated. Before that click it refused every submission, and the form's error state told
the visitor to email instead.

Verified 2026-10-20 against the live endpoint: `POST https://formsubmit.co/ajax/contact@briatti.com`
with `Origin` and `Referer: https://www.briatti.com/` answers `200` with
`{"success":"true","message":"The form was submitted successfully."}`, and the plain POST returns the
relay's "Thanks!" page with a return link to the site. A call that carries no `Referer` is refused with
"Make sure you open this page through a web server…" — that is the relay's origin heuristic, not a fault
at this end, and a browser always sends one. The response body is JSON even though its `Content-Type`
says `text/html`, which is why the script parses the body and not the header. Two test submissions were
accepted on that date; whether they reach the inbox is the one thing only the mailbox can show.

## Measurement and experiments

Added 2026-11-18. The site now measures itself, but only with consent. `legal.html` is the source of
truth for what is collected; this section records how the machinery works.

- **PostHog, first-party client.** `js/analytics.config.js` holds the EU project token, and
  `js/tracking.js` posts pseudonymous events to `eu.i.posthog.com/i/v0/e/` (anonymous in PostHog's sense: a random browser id, no person profile). There is no posthog-js
  bundle, no autocapture, no session replay and no cookie. The token is public and write-only.
- **Consent before any event.** The consent card stores `briatti_consent_v1` and, if allowed,
  `briatti_vid` in local storage. Decline stores only the refusal; no analytics request is made.
  Global Privacy Control and Do Not Track are treated as a refusal. **Privacy settings** in the
  footer reopens the card. Nothing about the form's contents is ever an event.
- **A/B engine.** `js/experiments.config.js` declares experiments; `js/ab.js` hashes a stable
  visitor id, sets `data-ab-<key>` on `<html>` before first paint, swaps copy and writes `ab_variants`
  into the form. Assignment is deterministic, needs no server and does not flicker.
- **No unmeasured split.** `requireAnalytics: true` means experiments do not run until a valid token
  is configured. A test that cannot be measured must not change the page.
- **Funnel.** `$pageview` -> `form_view` -> `form_start` -> `form_submit` -> `form_submit_success`,
  plus `form_cta_click` for the links that lead to the form. `tools/ab_report.py` turns those events
  into rates, lift and significance.
- **Never captured:** field values, keystrokes, session recordings, or an identity. Events are
  anonymous in PostHog's sense (`$process_person_profile: false`), and the PostHog project is set to discard client IP
  addresses.
- **Changing this requires a legal update.** A new processor, pixel, recording tool or event that
  carries personal data must be reflected in `legal.html` in the same commit.

The live experiments, the activation checklist and the statistical rules are in `AB-TESTING.md`.

## Voice

Direct, plain, slightly blunt. Short declarative sentences. No hype, no AI mysticism, no
"transformation" language. The founder's credibility is the asset: full-chain delivery from business
question to production system, by one accountable team.

The site speaks as **we**: Briatti is a company with future employees, not a solo practitioner.
The founder is named in the About note and the legal operator line, but he does not narrate the
marketing copy. The company voice is the point; the founder's accountability is still the asset.

## Hard constraints

- Static hosting. Editing a file must be the whole deployment; there is no build step.
- No third-party code is loaded. The typefaces (`fonts/`), Chart.js (`vendor/`), the A/B engine and
  the analytics client are served from this repository. Google Fonts and the jsDelivr CDN were
  removed for exactly that reason and must not come back. The only requests to another company are
  (a) the analytics event, which fires only after consent, and (b) the form POST to the FormSubmit
  relay, which fires only on submit. `legal.html` describes both.
- The site must work with JavaScript disabled. JS may only enhance, never gate content.
- Every page must be usable and legible from 320 px upward.
- Anything a visitor could read as a measured result must be true or labelled illustrative. Case
  study figures and product demos are examples, not client results; each case carries an
  "Illustrative example" flag before its figures, and the pages say so.

## Search and AI visibility

Aligned with Google's *Optimizing your website for generative AI features* guide (last updated
2026-07-10). That guide's position is that visibility in AI Overviews and AI Mode is still
rank-driven SEO, so nothing on this site is written or marked up to target AI systems specifically.

What is in place, and why it stays:

- **Content first.** Priced offers, the Readiness Ladder, the process timeline, anonymised worked
  examples and eight straight Q&A answers are the non-commodity material. They are the reason the
  page can be quoted, not the metadata around them.
- **Content is in the HTML**, never injected. The FAQ answers are in `<details>`, the case studies in
  `<article>`, and no text is assembled by script, so a crawler that does not run JavaScript still
  sees the whole page. JS only enhances.
- **Structured data stays** (`Organization`, `Person`, `WebSite`, `WebPage`, `OfferCatalog`,
  `FAQPage`). It is not required for AI features and there is no special AI schema; it earns its place
  through ordinary rich results. Prices in it must match the page (see above).
- **robots.txt allows** the general crawler and the named AI crawlers. Nothing here is private.
- **Freshness fields must be bumped with the copy**: `sitemap.xml` `lastmod`, plus `dateModified` on
  the `WebPage` node in the JSON-LD. A stale date is worse than no date.
- **Fonts are preloaded** (`fraunces`, `inter`, `caveat`, latin subsets) because all three paint above
  the fold; `crossorigin` is required or the preload is discarded and fetched twice.

Deliberately not done, per the same guide: no `llms.txt` or other AI text files, no content
"chunking" for machines, no rewriting copy around long-tail queries, no invented schema, and no
pursuit of third-party "mentions". Those are listed in the guide as ineffective for Google Search.

The evidence behind those choices — heading structure per page, crawler access, and the keyword demand
data with its caveats — is in `SEO.md`.

Owner-side actions that no commit can do: verify the property in Search Console, submit
`sitemap.xml`, switch the site into Search generative AI features there, and watch the Generative AI
performance report. A Google Business Profile is what surfaces the business in local answers.

## History worth knowing

The site was built, redesigned, and partially reverted through mid-2026. `main` holds a deliberately
"clean, non-AI look" pass (`8cd33ef`) that stripped particles, gradient text, glow orbs, emoji icons
and hover lifts, followed by three direct edits in the GitHub web editor. A separate branch
(`next-step`) holds a sharper diagnostic-first positioning, a process timeline, priced use-case
cards and anonymised case studies. This merge takes the substance from `next-step` and restores the
pre-redesign visual layer on the page; the fixed h1, company voice, nav form CTA and labelled proof
stay.

On 2026-10-25 the hero was first brought under restraint (the four-phrase rotator, blurred fields,
pulse, gradient word and floating panel removed; the h1 fixed; the nav CTA pointed at the form; the
proof cards labelled; the site moved to "we"). It was then restored to the pre-redesign visual layer
at the owner's direction: the blurred fields, pulse, gradient word, raised gradient panel and
gradient action are back, while the fixed h1, company voice, nav form CTA, labelled proof and footer
remain. The palette uses the board's cobalt, teal, sand and asset ink `#111111`, the page ink
`#11181D` and the owner's `#FBFBFA` paper.
