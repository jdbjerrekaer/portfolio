---
version: 1
name: Jonatan Portfolio Design Language
source: YADL dd51730
font: Open Runde
iconography:
  animated: Animate UI
  static: Lucide
---

# Portfolio design language

The portfolio is an editorial expression of YADL's design language. It keeps generous storytelling layouts while inheriting YADL's precise spacing, rounded geometry, restrained color, clear hierarchy, and purposeful interaction feedback.

## Foundations

- Use Open Runde at 400, 500, and 600. Headings use 600; supporting copy uses 400.
- Build from `#F5F5F7` canvas, white surfaces, `#F7F8FC` subtle surfaces, and `#1D1D1F` text.
- Reserve `#0071E3` for links, focus, and informative emphasis. Primary actions use near-black.
- Use the 4/8/12/16/20/24/32px component rhythm. Editorial sections may extend to 48/64/96px.
- Use 6/8/10/14px radii. Pills are reserved for compact badges and tags.
- Prefer tonal separation, fine borders, and `0 1px 4px rgba(0,0,0,.06)` shadows.

## Components

- `Section`: `default`, `subtle`, `hero`; widths `wide`, `content`, `prose`.
- `SectionHeader`: `stacked`, `split`, `centered`.
- `Card`: `surface`, `subtle`, `interactive`.
- `InfoCard`: `default`, `highlighted`, `media`.
- `Badge`: `neutral`, `success`, `muted`.
- `ActionLink`: `inline`, `back`, `external`.
- `ProjectCard`: `featured`, `catalog`.
- `Button`: `primary`, `secondary`.

Do not add a variant until a real screen needs it.

## Icons and motion

- Use Animate UI icons for interaction feedback and Lucide for static gaps.
- Animate on hover, activation, success, or progress—not merely because an icon exists.
- Keep transitions around 150-250ms. Never translate controls on hover: buttons and interactive cards scale to `1.01`, and pressable controls scale to `.98`.
- Interactive cards are flat by default; hover adds elevation while the card scales to `1.01` and its image zooms slightly.
- Inline `ActionLink` hover fills expand from the center without moving the link. Compact metadata chips use a filled pill treatment.
- Respect `prefers-reduced-motion` and retain an obvious static state.

## Editorial adaptation

- Preserve large headings, generous page rhythm, 1200px wide compositions, and readable prose around 65ch.
- Keep navigation, calls to action, project cards, metadata, and status feedback visually related to YADL.
- Let project media remain the visual focus; avoid decorative gradients, heavy glass, and oversized shadows.

## Evidence

- Canonical baseline: `/home/jonatan/projects/Yet-Another-Design-Linter`, `origin/main` at `dd51730`.
- Portfolio adaptation approved 2026-07-15: shared YADL language, editorial layout preserved, Animate UI and Lucide used site-wide.
