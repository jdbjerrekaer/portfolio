---
version: 2
name: Jonatan Portfolio Design Language
source: YADL dd51730
font: Open Runde
iconography:
  animated: Animate UI
  static: Lucide
---

# Portfolio design language

The portfolio is an editorial expression of YADL's design language. It keeps YADL's type, color, spacing and interaction feedback, but lays pages out like a printed index: ruled lines, big headings and content that sits on the page instead of inside cards.

## Foundations

- Use Open Runde at 400, 500, and 600. Headings use 600; supporting copy uses 400.
- Wrap headings with `text-wrap: balance` and paragraphs with `text-wrap: pretty` (globals.scss sets both globally).
- Build from `#F5F5F7` canvas, white surfaces, `#F7F8FC` subtle surfaces, and `#1D1D1F` text.
- Reserve `#0071E3` for links, focus, and informative emphasis. Primary actions use near-black. Green is only for live status (availability, current role).
- Use the 4/8/12/16/20/24/32px component rhythm. Editorial sections may extend to 48/64/96px.
- Use 6/8/10/14px radii. Pills are reserved for compact controls such as the copy button and tags.

## Layout

- No card containers for lists of content. Separate items with a 1px rule (`--color-border-strong` above a group, `--color-border` between rows) and whitespace.
- Display headings are large and tight: weight 600, letter-spacing around `-0.05em`, line-height under 1. Body copy stays around 46 to 65ch.
- Index sections use a 4fr/7fr split: a sticky intro (heading, count, one-line description) on the left, the list on the right. Below 860px it stacks and the intro stops sticking.
- Facts and metadata are ruled `dl` columns (label in tertiary text, value below), not grey boxes or tag pills.
- Large tight headings built from inline-block word spans need `text-indent: 0` on the spans; the paragraph's indent is inherited and shifts every word.
- Every long page ends somewhere: the case study closes with a "Next case study" link, the home and about pages with the availability block.

## Components

- `Section`: `default`, `subtle`, `hero`; widths `wide`, `content`, `prose`.
- `SectionHeader`: `stacked`, `split`, `centered`.
- `ActionLink`: `inline`, `back`, `external`.
- `Button`: `primary`, `secondary`.
- `Reveal` (`components/Reveal`): scroll reveal wrapper; children opt in with `.reveal-item` and `stagger(i)`.
- `ProjectRowList` (`components/FeaturedWork`): big numbered case-study rows with cover reveal and cursor label, used on the home and projects pages.
- `LogoMarquee`: two linear rows of client logos, replacing the static logo grid.
- `AnimatedLink`: client wrapper for `AnimateIcon asChild` around `next/link`. Use it in server components; wrapping `next/link` directly breaks the static build.
- `Card`, `Badge`, `ProjectCard` and `LogoGrid` remain in the codebase but no page uses them. Do not bring them back for new screens.

Do not add a variant until a real screen needs it.

## Icons and motion

- Use Animate UI icons for interaction feedback and Lucide for static gaps. Animate on hover, activation, success, or progress, not merely because an icon exists.
- Easing: `--ease-out-strong` (`cubic-bezier(0.23, 1, 0.32, 1)`) for entrances and hover responses, `--ease-in-out-strong` for on-screen movement, `linear` only for constant motion (marquee).
- Scroll reveal: items fade up 18px from a 6px blur over 700 to 800ms, staggered by `--i`, triggered once when 12% into the viewport. It is gated on `scripting: enabled` so readers without JavaScript see everything.
- Lead statements (about hero, lead testimonial) blur in word by word with a 28 to 40ms per-word delay so the sentence reads as one gesture.
- Hover: rows get a soft background wash that settles from `scale(0.98)`; arrow circles fill near-black and may nudge a few pixels; text links draw an underline in from the left; images zoom to about 1.04 to 1.06 over 700 to 900ms. Rows and controls themselves do not move.
- Press: pressable controls scale to `0.97` to `0.99` on `:active`.
- State swaps (Copy to Copied) cross-fade labels in one grid cell with a small blur. Keep the swapped labels close in length so the control does not size itself for a label the user rarely sees.
- Hover effects sit behind `@media (hover: hover) and (pointer: fine)`.
- Respect `prefers-reduced-motion`: drop transforms and blur, keep a short opacity fade, stop pulsing dots.

## Phones

- Below 640px the header navigation becomes a floating bottom tab bar; the cookie button lifts above it.
- Wide strips (3D prints) become horizontal snap scrollers with `scroll-padding-inline` matching the page gutter.
- Facts drop to two columns, with long values (Outcome) spanning both.

## Evidence

- Canonical baseline: `/home/jonatan/projects/Yet-Another-Design-Linter`, `origin/main` at `dd51730`.
- Portfolio adaptation approved 2026-07-15: shared YADL language, editorial layout preserved, Animate UI and Lucide used site-wide.
- Editorial redesign 2026-11-15 (commit `5c029fa`, branch `redesign/home-sections`): card grids removed from home, projects, case study and about pages after Jonatan rejected them as generic; motion follows Emil Kowalski's restrained approach.
