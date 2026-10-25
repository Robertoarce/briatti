# DESIGN.md

The design system for briatti.com. Tokens here are the single source of truth; `index.html`
declares them once in `:root` and nothing hardcodes a colour outside that block. `legal.html` and
`404.html` reuse the same tokens (and the same self-hosted `@font-face` block) at a reduced scale,
with no site navigation of their own. Caveat is the one exception: it is declared only in
`index.html`, because the hero lead is its only user.

## Design read

A B2B services landing page for sceptical SMB operators, in an editorial trust-first language,
built with native CSS and SVG only. Dials: variance 6, motion 6, density 3. The visual layer is the
pre-redesign hero — cobalt-to-teal gradient word, three blurred colour fields, a pulse dot, a raised
gradient panel and a gradient action — over the flat, border-first sections below it.

## Palette - "Cobalt + Paper"

The brand board at `_source/img/qwenlogo.png` supplies ink `#111111`, cobalt `#1F4E79`, teal
`#164E4A` and sand `#E6E1D8`. The owner keeps `#FBFBFA` for the paper (the logo plate) and the
original cool neutrals; the board's `#FAF9F6` is not used. The page ink is the original `#11181D`;
the favicon, OG card and Organization logo keep the board's `#111111`, a deliberate one-step split.
This replaces the previous indigo `#6366f1`, which is the default accent of AI-generated landing
pages and reads as generic.

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#11181D` | Primary text and the dark band. The favicon, OG card and logo keep the asset ink `#111111` |
| `--ink-rgb` | `17,24,29` | Alpha helper for the dot grid, the blurred fields and the shadows; not a second colour |
| `--white` | `#FFFFFF` | Button and nav text, the diagram cards and the hero panel's white stop |
| `--ink-2` | `#4A5259` | Secondary text |
| `--ink-3` | `#63696F` | Labels, captions, meta. Held dark enough to clear 4.5:1 on `--paper-2`, not just on white |
| `--paper` | `#FBFBFA` | Page background (the logo plate colour) |
| `--paper-2` | `#F4F5F3` | Alternating section background |
| `--line` | `#E3E5E2` | Hairlines, borders |
| `--line-2` | `#D9DCD8` | Stronger hairline, timeline spine |
| `--line-tint` | `#D5DFE8` | Border on the audit card and the Zero-Risk Pilot |
| `--cobalt` | `#1F4E79` | Brand accent, primary action, inbound data, the pilot button |
| `--cobalt-deep` | `#16395A` | Accent hover/active |
| `--cobalt-tint` | `#EBF0F5` | The audit card and the Zero-Risk Pilot band |
| `--cobalt-on-dark` | `#8FB4D4` | Accent that stays legible on `--ink` surfaces |
| `--teal` | `#164E4A` | Secondary accent, outbound data, the chat's incoming answers |
| `--teal-tint` | `#E8EFEC` | Assistant bubbles, chat avatar, typing indicator and the faint teal wash in the hero gradient |
| `--line-teal` | `#D2E0D9` | Border on the chat's teal-tinted surfaces |
| `--aud-1` … `--aud-5` | `#1F2F16` `#235789` `#F3A712` `#610345` `#A4B0F5` | The five audience chips in the lede, one per team, in order. Owner-supplied, used nowhere else |
| `--sand` | `#E6E1D8` | Quiet rule/divider, the OG card's rule, the sand field in the hero |
| `--cobalt-rgb` / `--teal-rgb` / `--sand-rgb` / `--cobalt-deep-rgb` | `31,78,121` / `22,78,74` / `230,225,216` / `22,57,90` | Alpha helpers for the hero fields and the button shadows; not new colours |

Rules:

- Cobalt is the action accent and the pilot's button. Teal is the data accent: the assistant
  bubbles, outbound data and the faint teal wash in the restored hero gradient. The Zero-Risk
  Pilot is the one cobalt-tint band.
- The `--aud-*` chips are the one exception: five flat colours in the lede, supplied by the owner,
  used nowhere else, each paired with paper or ink text at 4.5:1 or better. They are labels, not accents.
- One deep band per page: the Readiness Ladder in `--ink`. The Zero-Risk Pilot is the one
  cobalt-tint band. No other section flips theme.
- Warning/semantic colour is separate from brand colour. `demo.html` keeps a distinct amber for
  warnings; never reuse the brand accent to mean "attention".
- Nothing outside this block hardcodes a brand colour. The alpha helpers (`--ink-rgb`,
  `--cobalt-rgb`, `--cobalt-deep-rgb`, `--teal-rgb`, `--sand-rgb`) are the same colours, not new
  ones. The `theme-color` meta value is the one literal that cannot reference a custom property.
  The ladder's paper-on-ink alphas are the `--paper` value.

## Type

| Role | Family | Notes |
| --- | --- | --- |
| Display | Fraunces (`opsz` 9-144, `SOFT` 30) | `h1`, `h2`, and metric figures |
| Hand | Caveat 400-700 | the hero lead only |
| Body / UI | Inter 400-600 | everything else |
| Figures | Inter, `font-variant-numeric: tabular-nums` | prices and tables. The illustrative case figures are Fraunces display |

Scale (desktop): `h1` clamp(36px, 5.4vw, 62px) / 1.08 / -0.02em; `h2` clamp(25px, 3.1vw, 38px) /
1.12; `h3` 18px/600 Inter; body 16px/1.7; small 14px; label 11px uppercase `.1em`. Two exceptions,
both briefed: the hero proof line sits at 15px/600 in `--ink` rather than 13.5px/500 in `--ink-2`, and
the diagram's column captions sit at 13px/700 in `--ink` rather than 11px/600 in `--ink-3`.

The hero's one coloured word, `work`, is roman Fraunces in the old cobalt-to-teal gradient with a
hand-drawn underline. A forced-colors fallback restores CanvasText and the underline. Fraunces is
loaded in roman only, so no italic is requested and no synthetic slant is produced.

Fraunces is restricted to display sizes on purpose. Set below ~20px it loses the optical sizing that
makes it worth loading, and the page starts to look like every other LLM-redesigned site.

**One hand-written face, briefed by the owner:** the hero lead (`Don't know where to start?`) is
Caveat 600 at 25px in `--ink`. It is the only place on the page that speaks as the owner rather than
as the interface, which is why it is allowed to break the two-face rule. Caveat runs small for its em
and slants already, so 25px lands at roughly the optical size of 22px in Fraunces, and no italic or
`opsz` is applied. It sits at the top of the fold, i.e. inside the hero's LCP region, so it is
`font-display: swap` like the rest; the Latin subset is 75 KB and the Latin-ext subset is added only
if a page ever needs those glyphs.

**Accepted trade-off:** the Impeccable detector flags both faces as "overused" (Inter, Fraunces).
That is recorded, not ignored. They stay because Fraunces and Inter were the incumbent brand choice
made deliberately, the brief wins over a saturation default, and swapping the face would invalidate
every measurement in this file. If the site is ever rebranded, change the face here first.

## Space, shape, depth

- 8 px base. Section padding 96 px desktop / 64 px mobile. Container 1120 px.
- `--r: 6px` for cards, buttons, inputs and tags. The hero panel is the one 12px exception; pills
  use full radius. `--r-bubble: 16px` is reserved for the message bubbles in the chat mock, which
  are speech, not surfaces. No other radius.
- Below the hero, borders do the work. The hero is the exception: the raised panel, the pill, the
  primary button and the contact form carry soft ink or cobalt shadows. The sticky nav and the
  mobile menu use the same overlay shadow.
- The hero panel is the one raised card: the old cobalt-tint/teal-tint/white/paper-2 gradient,
  a 12px radius, a two-layer ink shadow and a 1s fade from 0.5s. The contact form is a paper card
  with a 1px shadow. The other sections below the hero are borders-first.
- The hero is the authored exception: gradient text on `work`, three blurred colour fields, a
  gradient action and a raised panel. The sections below the hero keep the flat, border-first rule.
- The contact form is the one input surface: fields sit on `--paper-2` inside a `--paper` card with
  the shared `--r`, a `--line-2` hairline and a 2 px `--cobalt` focus ring with 1 px offset. Labels
  stay above their field at 13 px/600; placeholders are not used, because a placeholder disappears
  the moment someone types. Its status line is `role="status"` and `aria-live="polite"`, teal on
  success, ink on failure — no new colour token is introduced for the error state.

## Motion

CSS transitions and animations only, plus one IntersectionObserver for reveals. No animation library.

| Token | Value |
| --- | --- |
| `--e-out` | `cubic-bezier(.16,1,.3,1)` |
| `--e-in-out` | `cubic-bezier(.65,0,.35,1)` |
| durations | tap 140 ms, state 240 ms, reveal 480 ms, hero cascade 1.5 s |

- Only `transform`, `opacity`, `box-shadow`, `offset-distance` and `stroke-dashoffset` animate.
- Reveals fire once, on entry, with a 60 ms stagger.
- Motivated only: hierarchy, sequence, feedback or state change. The hero's blurred fields, pulse,
  arrow, panel fade and diagram, plus the chat rotation, are the loops. Everything else reveals once.
- The hero assembles once, on load: pill, each headline line, supporting line, actions and proof
  checks, then the diagram panel fades in from 0.5 s over 1 s — a 0.05 s to 1.5 s cascade. That is
  the page's one authored entrance; every other section only reveals on entry.
- The hero arrow draws itself as the actions land (`stroke-dashoffset` on a `pathLength="100"` path,
  0.6 s for the shaft, then 0.34 s for the head), then nudges 4 px towards the button on a 2.8 s loop.
  That loop is kept because the button is the page's only commercial action. Under reduced motion the
  arrow is drawn at full length and stopped.
- The three blurred fields drift on 22–32 s alternating cycles and the eyebrow pulse rings every
  2.2 s. Both stop under reduced motion.
- The headline is fixed: `We put AI engineering / to work on the business / you already run.` The one
  coloured word, `work`, carries the cobalt-to-teal gradient and a hand-drawn underline that draws
  once after the line lands (1.1 s, 0.9 s delay) and does not loop. There is no rotating noun, no
  hidden canonical copy and no second phrase for a crawler to concatenate.
- The hero diagram runs a 10.5 s cycle and reads one lane at a time: the inbound rail marches, a token
  with a soft halo travels it, the agent's ring pulses, the outbound rail draws, the result pops in.
  Lanes 2 and 3 reuse the same keyframes with a different `animation-name`. Off screen, or in a hidden
  tab, every animation inside it is paused.
- The chat mock plays a transcript back when it comes into view, then rotates to the next use case two
  seconds after that conversation finishes, and loops. Every line lives in the markup, so the playback
  is decoration: with JavaScript off, or under reduced motion, and before it scrolls into view, the
  transcript renders complete and static.
- The blurred fields, the pulse, the arrow nudge, the hero diagram and the chat rotation are the
  loops that move without the visitor asking. The use-case rotation holds while the pointer or
  keyboard focus is inside the window or the window is off screen, it stops for good the moment the
  visitor chooses a use case, and it never starts under `prefers-reduced-motion`. The typing dots run
  only while visible.
- The use cases are switched with native radio inputs and `:has()`, not with script, so the switcher
  works with JavaScript disabled. Panels share one grid cell, so the window never changes height when
  the conversation changes; the swap is a 300 ms cross-fade, and the outgoing panel is
  `visibility: hidden` once it has faded, so it leaves the accessibility tree.
- The primary button and the dashboard screenshot lift 2 px on hover; the button keeps its gradient
  at rest and goes cobalt-deep on hover. The hero pill, the panel and the form carry their shadows at
  rest.
- Under `prefers-reduced-motion: reduce`: every duration collapses, reveals render visible, the
  blurred fields and the pulse stop, the panel is visible, the accent underline is drawn at full
  length, and the hero artwork presents a fully drawn still frame.
- `window.addEventListener('scroll', ...)` is banned. Use IntersectionObserver.

## Disclosure

- Expanding something uses native `<details>` / `<summary>`. No script, keyboard support for free,
  and the hidden text stays in the DOM for search and for visitors with JavaScript off.
- The `<summary>` carries the whole header row: rung number, title, one-line description, chevron.
- The chevron rotating 180° is the only motion a disclosure has: `details[open] > summary .chev`.
- The Readiness Ladder's six rungs are one exclusive accordion (`name="rung"`), so opening a rung
  closes the previous one where the browser supports it, and allows more than one where it does not.
- What opens under a rung is always the same three things: what it looks like, what staying there
  costs, and the named next step with its published price.

## Iconography

Inline SVG icons only, drawn on a 24 px grid at 1.6 stroke, sized 20 px in body copy. No emoji
anywhere: they render differently on every OS and read as filler. An icon used more than once is
defined as a `<symbol>` in the existing defs block at the top of `<body>` and referenced with
`<use>`; the chat mock's set follows that rule. The favicon (`img/favicon.svg`) is the canonical
brand icon: the nav, footer, legal page, 404 page, OG card and `Organization` logo use it. The bare
`#mark` symbol survives only in the chat avatar. Static brand artwork lives in `img/`. Two exceptions.
The hero arrow is an annotation stroke, not an icon: 52 × 36 at 2 px, drawn to sit beside the
hand-written lead, and `aria-hidden` because the button it points at is labelled already. And the
hero diagram is inline in the page, because the page owns its loop (pausing it off screen), its
reduced-motion still frame, and its labels as real text. Below 1024 px that diagram is replaced by
the same three examples as a list, because a diagram drawn on a 1000-unit grid scaled into a narrow
column puts its labels under the legibility floor.

## Accessibility floor

- Body text contrast at or above 4.5:1 against its background; large text at or above 3:1.
- One `h1` per page, headings in order.
- Every interactive element reachable and visible on `:focus-visible`.
- Decorative artwork is `aria-hidden` or carries `role="img"` with a `<title>` and `<desc>`.
- Content is complete and readable with JavaScript disabled.
