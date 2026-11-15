---
version: 3
name: Jonatan Portfolio Design Language
source: YADL dd51730
font: Open Runde
iconography:
  animated: Animate UI
  static: Lucide
---

# Portfolio design language

The portfolio is an editorial expression of YADL's design language. It keeps YADL's type, color, spacing and interaction feedback, but lays pages out like a printed index: big headings and content that sits on the page instead of inside cards. Whitespace does the separating — no ruled lines.

The code is the source of truth for exact values. Each row below names the file that holds them; update this file when a pattern changes, not when a number is tuned.

## Foundations

- Use Open Runde at 400, 500, and 600. Headings use 600; supporting copy uses 400.
- Wrap headings with `text-wrap: balance` and paragraphs with `text-wrap: pretty` (globals.scss sets both globally).
- Build from `#F5F5F7` canvas, white surfaces, `#F7F8FC` subtle surfaces, and `#1D1D1F` text.
- Reserve `#0071E3` for links, focus, and informative emphasis. Primary actions use near-black. Green is only for live status (availability, current role).
- Use the 4/8/12/16/20/24/32px component rhythm. Editorial sections may extend to 48/64/96px.
- Use 6/8/10/14px radii. Pills are reserved for compact controls such as the copy button and tags.

## Layout

### Page frame

| Token | Value | Where |
| --- | --- | --- |
| Content width | `--max-width: 1200px` | `styles/globals.scss` |
| Side gutter | `--space-lg` (24px), `--space-md` (16px) at 768px and below | `components/ui/Section`, page modules |
| Header height | `--header-height: 64px`; sticky intros sit `1.5rem` to `2rem` below it | `styles/globals.scss` |
| Section spacing | `clamp(4rem, 8vw, 7rem)` top and bottom; the subtle variant runs larger | `components/ui/Section`, `app/about/page.module.scss` |
| Breakpoints | 1000px (case-study list hides), 860px (splits stack), 768px (gutter, hero), 640px (phones: tab bar, single columns) | per module |

### Type scale

| Role | Size | Tracking | Where |
| --- | --- | --- | --- |
| Hero headline | `clamp(2.75rem, 7.6vw, 7rem)`, line-height 0.95 | `-0.045em` | `app/page.module.scss` |
| Page title (case study) | `clamp(2.75rem, 7vw, 6rem)` | `-0.05em` | `app/projects/[slug]/page.module.scss` |
| Statement (about) | `clamp(2.5rem, 6.4vw, 5.5rem)` | `-0.05em` | `app/about/page.module.scss` |
| Lead quote | `clamp(1.75rem, 4.2vw, 3.5rem)`, weight 500 | `-0.035em` | `components/Testimonials` |
| Next-link title | `clamp(2rem, 5vw, 4rem)` | `-0.05em` | `app/projects/[slug]/page.module.scss` |
| Section heading | `SectionHeader` h2 | global | `components/ui/SectionHeader` |
| Lede and summaries | `clamp(1.125rem, 1.6vw, 1.5rem)`, max 44 to 46ch | `-0.01em` to `-0.015em` | page modules |
| Body and row text | `0.9375rem` to `1.0625rem`, line-height 1.5 to 1.7, max 65ch | default | page modules |
| Labels, years, counts | `0.8125rem` to `0.9375rem`, tertiary, `tabular-nums` | default | page modules |

Tight tracking also shrinks word spaces; display text built from word spans adds `word-spacing: 0.1em` back.

### Structure

- No card containers for lists of content. Separate items with whitespace and typographic hierarchy only — no rules between rows.
- Section headings stand alone. Do not add a one-line description under every heading; it restates the heading and reads as generated. If a fact matters (the group is university work, the clips are bareknuckle karate), put it in the heading itself.
- Index sections use a 4fr/7fr split: a sticky intro (heading and a two-digit count) on the left, the list on the right. Below 860px it stacks and the intro stops sticking.
- The hero, page titles and statements are left-aligned: the statement on top, supporting text on the left and one action on the right, separated by whitespace alone. Never repeat the header navigation as hero buttons.
- Facts and metadata are plain `dl` columns (label in tertiary text, value below), not grey boxes, tag pills or ruled rows.
- Headings and titles use sentence case. Only proper names keep capitals (YADL, Adtraction Brands, Home Assistant, Live Activities).
- Project cards show the title, focus tags and cover only. Descriptions, years and roles are hidden for now; case study pages show Focus and Outcome.
- Every long page ends somewhere: the case study closes with a "Next case study" link, the home and about pages with the availability block.

## Components

- `Section`: `default`, `subtle`, `hero`; widths `wide`, `content`, `prose`.
- `SectionHeader`: `stacked`, `split`, `centered`. Title only by default.
- `ActionLink`: `inline`, `back`, `external`.
- `Button`: `primary`, `secondary`. Rarely needed now; prefer a text link with an arrow circle.
- `Reveal` (`components/Reveal`): scroll reveal wrapper; children opt in with `.reveal-item` and `stagger(i)`.
- `ProjectRowList` (`components/FeaturedWork`): big numbered case-study rows with cover reveal and cursor label, used on the home and projects pages.
- `LogoMarquee`: two linear rows of client logos, replacing the static logo grid.
- `CookieBanner`: own consent card (no third-party script). Writes the same `silktideCookieChoice_*` keys Clarity reads; `CookieSettingsButton` in the footer reopens it.
- `AnimatedLink`: client wrapper for `AnimateIcon asChild` around `next/link`. Use it in server components; wrapping `next/link` directly breaks the static build.
- `Card`, `Badge`, `ProjectCard` and `LogoGrid` remain in the codebase but no page uses them. Do not bring them back for new screens.

Do not add a variant until a real screen needs it.

## Motion

Motion follows Emil Kowalski's approach: it confirms an action, explains a change or lets content arrive. It is never there because a thing could move.

### Easing

| Token | Curve | Use |
| --- | --- | --- |
| `--ease-out-strong` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entrances, hover responses, press |
| `--ease-in-out-strong` | `cubic-bezier(0.77, 0, 0.175, 1)` | Things moving across the screen (tab indicator, cover clip) |
| `ease` | browser default | Color, background and opacity-only changes |
| `linear` | | Constant motion only (marquee) |

Never use `ease-in` for UI.

### Patterns

| Pattern | Trigger | Properties | Duration | Easing | Reduced motion | Where |
| --- | --- | --- | --- | --- | --- | --- |
| Scroll reveal | Block top passes 75% down the screen (trigger `-25%`), once | opacity, translateY 18px, blur 6px | 700 to 800ms, +70ms per item | out-strong | Opacity only, 300ms | `styles/globals.scss`, `components/Reveal` |
| Hero words | Page load | opacity, translateY 0.25em, blur 8px | 800ms, +45ms per word | out-strong | None | `app/page.module.scss` |
| Lead statement words | Reveal | same as hero words | 600 to 800ms, +28 to 40ms per word | out-strong | Opacity only | `components/Testimonials`, `app/about/page.module.scss` |
| Row hover wash | Hover (fine pointer) | background opacity, scale 0.98 to 1 | 200 / 300ms | ease / out-strong | No scale | `components/WritingSection`, `app/projects/page.module.scss` |
| Arrow circle | Hover on its row or link | fill near-black, nudge 4 to 6px right | 200ms color, 300ms move | ease / out-strong | Fill only; never moves or scales | hero, guides, projects index, next case study |
| Underline draw | Hover or focus | `background-size` 0 to 100% | 300 to 450ms | out-strong | Kept (no movement) | case-study links, CTA links, email |
| Image zoom | Hover on its row | scale 1.04 to 1.06 | 700 to 900ms | out-strong | Instant (no transition) | project rows, prints, next case study |
| Cover reveal | Cover top passes 60% down the screen (trigger `-40%`), once | `clip-path` inset to 0, image scale 1.16 to 1 | 1100 / 1400ms | in-out-strong / out-strong | Shown fully, no transition | `components/FeaturedWork` |
| Cursor label | Pointer over featured rows | position, scale 0.6 to 1 | spring (stiffness 500, damping 40, mass 0.5) | spring | Hidden | `components/FeaturedWork` |
| Press | `:active` | scale 0.97 to 0.99 (whole control), 0.92 to 0.94 (arrow circles, tab icons) | 160ms | out-strong | Kept | buttons, prints, rows, tab bar |
| Label swap | State change (Copy to Copied) | opacity, blur 4px, translateY 6px in one grid cell | 200 to 250ms | ease / out-strong | Cross-fade only, no blur or move | `components/AvailabilityCTA` |
| Marquee | Always | translateX, hover slows to 0.15x | row length x 3.2s | linear | Static rows, no mask | `components/LogoMarquee` |
| Status ping | Always | ring scale 1 to 2.6, fade | 2.4s loop | out-strong | Stopped | availability dot, current role |
| Hero stage | Its visible photos have decoded (inline script, before the JS bundle) | opacity, translateY 32px, scale 0.97 | 900ms, delayed to follow the headline only on fast loads | out-strong | Appears without moving | `app/page.module.scss`, `components/PointerParallax` |
| Hero props | Always, plus pointer | idle drift 7px, pointer parallax | 7s loop | ease-in-out | Static pose | `app/page.module.scss`, `components/PointerParallax` |
| Tab bar (phones) | Load, route change | bar rises in; indicator slides | 500ms / 420ms | out-strong / in-out-strong | Opacity only | `components/SiteHeader` |
| Cookie card | First visit after 1.4s, or Cookie settings in the footer | card rises 16px from scale 0.96 and blur 4px; cookie wobbles once; hover leans or shrinks it; accept takes two bites and drops crumbs before the card leaves | 520ms in, 220ms per bite, 300ms out | out-strong | Fade only, bites shown without motion | `components/CookieBanner` |
| Case-study list marker | Section scroll | marker scaleY 0 to 1 | 300ms | out-strong | Instant | `app/projects/[slug]` |

### Do not animate

- Anything triggered from the keyboard, or anything a visitor repeats many times in a row.
- Layout properties (`width`, `height`, `margin`, `top`). Animate `transform`, `opacity`, `filter`, `clip-path` and `background-size` only.
- Rows, cards or buttons moving on hover. The decoration inside them (wash, arrow, image) responds; the thing itself stays put.
- New constant motion. The marquee, status ping and hero props are the only loops on the site.
- Above-the-fold content on scroll reveal. The hero animates on load instead.
- Hover effects without `@media (hover: hover) and (pointer: fine)`; touch screens get the press state only.
- Blur over 8px, or blur on large moving areas.

### Loading

- Never animate an image in before it has decoded; a slow connection otherwise paints it in top to bottom. The hero stage waits for `img.decode()`, run from an inline script so it does not wait for hydration.
- Above-the-fold photos are WebP with `srcset`; the hero photo gets `fetchPriority="high"`. Images hidden on phones use `loading="lazy"` so they never download there. Logos far down the page use `fetchPriority="low"`.

### Gotchas

- Inline-block word spans inherit `text-indent`; set `text-indent: 0` on them or a hanging indent shifts every word into its neighbour.
- Swapped labels share one grid cell, so the widest label sets the control's width. Keep them close in length.
- Scroll reveal only fires on scroll; content skipped by a long jump stays hidden until it is scrolled back into view.

## Phones

- Below 640px the header navigation becomes a floating bottom tab bar; the cookie button lifts above it.
- Wide strips (3D prints) become horizontal snap scrollers with `scroll-padding-inline` matching the page gutter.
- Facts drop to two columns, with long values (Outcome) spanning both.

## Evidence

- Canonical baseline: `/home/jonatan/projects/Yet-Another-Design-Linter`, `origin/main` at `dd51730`.
- Portfolio adaptation approved 2026-07-15: shared YADL language, editorial layout preserved, Animate UI and Lucide used site-wide.
- Editorial redesign 2026-11-15 (branch `redesign/home-sections`): card grids removed from home, projects, case study and about pages after Jonatan rejected them as generic. Section subtitles were removed on the same day for the same reason.
