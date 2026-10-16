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

## History worth knowing

The site was built, redesigned, and partially reverted through mid-2026. `main` holds a deliberately
"clean, non-AI look" pass (`8cd33ef`) that stripped particles, gradient text, glow orbs, emoji icons
and hover lifts, followed by three direct edits in the GitHub web editor. A separate branch
(`next-step`) holds a sharper diagnostic-first positioning, a process timeline, priced use-case
cards and anonymised case studies. This merge takes the substance from `next-step` and the settled
visual restraint from `main`.
