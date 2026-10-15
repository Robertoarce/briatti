# DESIGN.md

The design system for briatti.com. Tokens here are the single source of truth; `index.html`
declares them once in `:root` and nothing hardcodes a colour outside that block.

## Design read

A B2B services landing page for sceptical SMB operators, in an editorial trust-first language,
built with native CSS and SVG only. Dials: variance 6, motion 6, density 3.

## Palette - "Cobalt + Paper"

Derived from the two brand assets that already existed: the logo mark (ink `#11181D` on `#FBFBFA`)
and the data-flow artwork (cobalt / teal). This replaces the previous indigo `#6366f1`, which is the
default accent of AI-generated landing pages and reads as generic.

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#11181D` | Primary text, logo, dark band background |
| `--ink-2` | `#4A5259` | Secondary text |
| `--ink-3` | `#63696F` | Labels, captions, meta. Held dark enough to clear 4.5:1 on `--paper-2`, not just on white |
| `--paper` | `#FBFBFA` | Page background (the logo plate colour) |
| `--paper-2` | `#F4F5F3` | Alternating section background |
| `--line` | `#E3E5E2` | Hairlines, borders |
| `--line-2` | `#D9DCD8` | Stronger hairline, timeline spine |
| `--line-tint` | `#D5DFE8` | Border on cobalt-tinted surfaces |
| `--cobalt` | `#1F4E79` | Brand accent, primary action, inbound data |
| `--cobalt-deep` | `#16395A` | Accent hover/active |
| `--cobalt-tint` | `#EBF0F5` | Accent-tinted surface |
| `--cobalt-on-dark` | `#8FB4D4` | Accent that stays legible on `--ink` surfaces |
| `--teal` | `#164E4A` | Secondary accent, outbound data |
| `--sand` | `#E6E1D8` | Quiet rule/divider, artwork halo only |

Rules:

- One accent (`--cobalt`) used identically in every section.
- Exactly one dark band per page (the Readiness Ladder). No section flips theme.
- Warning/semantic colour is separate from brand colour. `demo.html` keeps a distinct amber for
  warnings; never reuse the brand accent to mean "attention".
- Nothing outside this block hardcodes a colour. The only literal left in the file is the
  `theme-color` meta value, which cannot reference a custom property.

## Type

| Role | Family | Notes |
| --- | --- | --- |
| Display | Fraunces (`opsz` 9-144, `SOFT` 30) | `h1`, `h2`, and metric figures only |
| Body / UI | Inter 400-600 | everything else |
| Figures | Inter, `font-variant-numeric: tabular-nums` | counters and tables |

Scale (desktop): `h1` clamp(34px, 5.2vw, 58px) / 1.06 / -0.02em; `h2` clamp(26px, 3.2vw, 38px) /
1.12; `h3` 17px/600 Inter; body 16px/1.7; small 14px; label 11px uppercase `.1em`.

Fraunces is restricted to display sizes on purpose. Set below ~20px it loses the optical sizing that
makes it worth loading, and the page starts to look like every other LLM-redesigned site.

**Accepted trade-off:** the Impeccable detector flags both faces as "overused" (Inter, Fraunces).
That is recorded, not ignored. They stay because Fraunces and Inter were the incumbent brand choice
made deliberately, the brief wins over a saturation default, and swapping the face would invalidate
every measurement in this file. If the site is ever rebranded, change the face here first.

## Space, shape, depth

- 8 px base. Section padding 96 px desktop / 64 px mobile. Container 1120 px.
- `--r: 6px` for every card, button, input and tag. Pills use full radius. No third radius, ever.
- Borders do the work; shadows are a single soft, ink-tinted value used only for overlays.
- No glow, no gradient text, no coloured blobs, no drop-shadow on cards at rest.

## Motion

CSS transitions and animations only, plus one IntersectionObserver for reveals. No animation library.

| Token | Value |
| --- | --- |
| `--e-out` | `cubic-bezier(.16,1,.3,1)` |
| `--e-in-out` | `cubic-bezier(.65,0,.35,1)` |
| durations | tap 140 ms, state 240 ms, reveal 480 ms, hero cascade 800 ms |

- Only `transform`, `opacity`, `offset-distance` and `stroke-dashoffset` animate.
- Reveals fire once, on entry, with a 60 ms stagger.
- Motivated only: hierarchy, sequence, feedback or state change. No decorative loops outside the
  hero artwork.
- Under `prefers-reduced-motion: reduce`: every duration collapses, reveals render visible,
  counters land on their final value, and the hero artwork presents a fully drawn still frame.
- `window.addEventListener('scroll', ...)` is banned. Use IntersectionObserver.

## Iconography

Inline SVG icons only, drawn on a 24 px grid at 1.6 stroke, sized 20 px in body copy. No emoji
anywhere: they render differently on every OS and read as filler. Artwork geometry that is part of
the brand (the logo, the data-flow) is exempt and lives in `img/`.

## Accessibility floor

- Body text contrast at or above 4.5:1 against its background; large text at or above 3:1.
- One `h1` per page, headings in order.
- Every interactive element reachable and visible on `:focus-visible`.
- Decorative artwork is `aria-hidden` or carries `role="img"` with a `<title>` and `<desc>`.
- Content is complete and readable with JavaScript disabled.
