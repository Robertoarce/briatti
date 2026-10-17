# PRODUCT.md

Durable product truth for briatti.com. Design decisions live in `DESIGN.md`; this file records
what the product is, who it is for, and what must not change without a deliberate decision.

## What this is

The marketing site for **Briatti**, a one-person AI and data consultancy. Static HTML served by
GitHub Pages from `main`. No build step, no framework, no package manager. Four pages:

- `index.html` - the landing page (the product)
- `demo.html` - a working, self-contained executive dashboard demo the landing page links to
- `legal.html` - who operates the site, what it does with your data, and the terms prices are on
- `404.html` - the not-found page

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

There is no form and no backend: every CTA is a `mailto:` to `roberto.arce@briatti.com`. Two
consequences are load-bearing.

- **A `mailto:` does nothing at all** on a machine with no mail handler, and gives no feedback either
  way. So the address is also printed under each CTA as plain, selectable text, and a click copies it
  to the clipboard and says so. That is progressive enhancement: with JS off the printed address is
  still there.
- **Each CTA carries its own subject**, `(hero)`, `(contact)` or `Free Pilot`, so an email says which
  button produced it. There is no analytics on the site, by design, so the subject line is the only
  measurement there is.

Each link also pre-fills a body with three prompts (what is slow, where the data lives, what to build
first). Keep them short: a long template reads like a form and defeats the point of an email.

## Voice

Direct, plain, slightly blunt. Short declarative sentences. No hype, no AI mysticism, no
"transformation" language. The founder's credibility is the asset: full-chain delivery from business
question to production system, by one accountable person.

## Hard constraints

- Static hosting. Editing an HTML file must be the whole deployment.
- Nothing is loaded from a third party. The typefaces (`fonts/`) and Chart.js (`vendor/`) are served
  from this repository, so no visitor's IP address reaches anyone except the host. Google Fonts and
  the jsDelivr CDN were removed for exactly that reason and must not come back.
- The site must work with JavaScript disabled. JS may only enhance, never gate content.
- Every page must be usable and legible from 320 px upward.
- Anything a visitor could read as a measured result must be true or labelled illustrative. Case
  study figures and product demos are examples, not client results, and the pages say so.

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

Owner-side actions that no commit can do: verify the property in Search Console, submit
`sitemap.xml`, switch the site into Search generative AI features there, and watch the Generative AI
performance report. A Google Business Profile is what surfaces the business in local answers.

## History worth knowing

The site was built, redesigned, and partially reverted through mid-2026. `main` holds a deliberately
"clean, non-AI look" pass (`8cd33ef`) that stripped particles, gradient text, glow orbs, emoji icons
and hover lifts, followed by three direct edits in the GitHub web editor. A separate branch
(`next-step`) holds a sharper diagnostic-first positioning, a process timeline, priced use-case
cards and anonymised case studies. This merge takes the substance from `next-step` and the settled
visual restraint from `main`.
