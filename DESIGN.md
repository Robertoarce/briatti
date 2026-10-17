# DESIGN.md

The design system for briatti.com. Tokens here are the single source of truth; `index.html`
declares them once in `:root` and nothing hardcodes a colour outside that block. `legal.html` and
`404.html` reuse the same tokens (and the same self-hosted `@font-face` block) at a reduced scale,
with no site navigation of their own. Caveat is the one exception: it is declared only in
`index.html`, because the hero lead is its only user.

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
| `--teal-tint` | `#E8EFEC` | Assistants' answers in the chat mock, and nothing else |
| `--line-teal` | `#D2E0D9` | Border on teal-tinted surfaces |
| `--aud-1` … `--aud-5` | `#1F2F16` `#235789` `#F3A712` `#610345` `#A4B0F5` | The five audience chips in the lede, one per team, in order. Owner-supplied, used nowhere else |
| `--sand` | `#E6E1D8` | Quiet rule/divider, artwork halo only |

Rules:

- One accent (`--cobalt`) used identically in every section.
- The `--aud-*` chips are the one exception: five flat colours in the lede, supplied by the owner,
  used nowhere else, each paired with paper or ink text at 4.5:1 or better. They are labels, not accents.
- Exactly one dark band per page (the Readiness Ladder). No section flips theme.
- Warning/semantic colour is separate from brand colour. `demo.html` keeps a distinct amber for
  warnings; never reuse the brand accent to mean "attention".
- Nothing outside this block hardcodes a colour. The only literal left in the file is the
  `theme-color` meta value, which cannot reference a custom property.

## Type

| Role | Family | Notes |
| --- | --- | --- |
| Display | Fraunces (`opsz` 9-144, `SOFT` 30) | `h1`, `h2`, and metric figures |
| Hand | Caveat 400-700 | the hero lead only |
| Body / UI | Inter 400-600 | everything else |
| Figures | Inter, `font-variant-numeric: tabular-nums` | counters and tables |

Scale (desktop): `h1` clamp(36px, 5.4vw, 62px) / 1.08 / -0.02em; `h2` clamp(25px, 3.1vw, 38px) /
1.12; `h3` 17px/600 Inter; body 16px/1.7; small 14px; label 11px uppercase `.1em`. Two exceptions,
both briefed: the hero proof line sits at 15px/600 in `--ink` rather than 13.5px/500 in `--ink-2`, and
the diagram's column captions sit at 13px/700 in `--ink` rather than 11px/600 in `--ink-3`.

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
- `--r: 6px` for every card, button, input and tag. Pills use full radius. `--r-bubble: 16px` is
  reserved for the message bubbles in the chat mock, which are speech, not surfaces; nothing else
  may use it. No other radius, ever.
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
- The hero assembles once, on load: pill, each headline line, supporting line, actions, proof checks,
  then the diagram panel — a 0.05 s to 1.15 s stagger in total. That is the page's one authored
  entrance; every other section only reveals on entry.
- The hero arrow draws itself as the actions land (`stroke-dashoffset` on a `pathLength="100"` path,
  0.6 s for the shaft, then 0.34 s for the head), then nudges 4 px towards the button on a 2.8 s loop.
  That loop is the one decorative cycle outside the hero diagram, kept because the button is the page's
  only commercial action. Under reduced motion the arrow is drawn at full length and stopped.
- Three blurred colour fields drift behind the hero on 22–32 s alternating cycles, with a dot grid
  fading out beneath them. Pure decoration: `prefers-reduced-motion` stops them dead.
- The headline carries two rotators — the file noun (spreadsheets, contracts, manuals, ledgers) and the
  discipline (machine learning, business intelligence, deep learning, AI engineering), both 4 words on a
  12 s cycle. A word is visible for its whole slot and leaves as the next arrives, so the sentence
  never loses its noun. Every word stays in the DOM; the rotators are `aria-hidden` and a visually
  hidden span carries the canonical phrase, and under reduced motion only the first word shows.
- The hero diagram runs a 10.5 s cycle and reads one lane at a time: the inbound rail marches, a token
  with a soft halo travels it, the agent's ring pulses, the outbound rail draws, the result pops in.
  Lanes 2 and 3 reuse the same keyframes with a different `animation-name`. Off screen, or in a hidden
  tab, every animation inside it is paused.
- The chat mock plays a transcript back when it comes into view, then rotates to the next use case two
  seconds after that conversation finishes, and loops. Every line lives in the markup, so the playback
  is decoration: with JavaScript off, or under reduced motion, and before it scrolls into view, the
  transcript renders complete and static.
- The rotation is the only thing on the page that moves without the visitor asking. It holds while
  the pointer or keyboard focus is inside the window or the window is off screen, it stops for good
  the moment the visitor chooses a use case, and it never starts under `prefers-reduced-motion`.
  The typing dots are the only other looping animation, and they run only while visible.
- The use cases are switched with native radio inputs and `:has()`, not with script, so the switcher
  works with JavaScript disabled. Panels share one grid cell, so the window never changes height when
  the conversation changes; the swap is a 300 ms cross-fade, and the outgoing panel is
  `visibility: hidden` once it has faded, so it leaves the accessibility tree.
- Under `prefers-reduced-motion: reduce`: every duration collapses, reveals render visible,
  counters land on their final value, and the hero artwork presents a fully drawn still frame.
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
`<use>`; the logo mark and the chat mock's set follow that rule. Static brand artwork lives in
`img/`. Two exceptions. The hero arrow is an annotation stroke, not an icon: 52 × 36 at 2 px, drawn
to sit beside the hand-written lead, and `aria-hidden` because the button it points at is labelled
already. And the hero diagram is inline in the page, because the page owns its loop
(pausing it off screen), its reduced-motion still frame, and its labels as real text. Below 900 px
that diagram is replaced by the same three examples as a list, because a diagram drawn on a 1000-unit
grid scaled into a phone column puts its labels under the legibility floor.

## Accessibility floor

- Body text contrast at or above 4.5:1 against its background; large text at or above 3:1.
- One `h1` per page, headings in order.
- Every interactive element reachable and visible on `:focus-visible`.
- Decorative artwork is `aria-hidden` or carries `role="img"` with a `<title>` and `<desc>`.
- Content is complete and readable with JavaScript disabled.
