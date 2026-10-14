# Hero tablet composite

`public/images/hero/ipad-hand-cramer.png` — the hero scene photo with the Cramer
dark-mode UI on the tablet screen, replacing the IRIZ landing page that ships
baked into the licensed photo.

- **Source photo**: `public/images/hero/ipad-hand.png` (licensed, never edit).
- **Replacement screen**: `public/projects/cramer-ai-assistant/before-after/after-dark.jpg`.
- **Regenerate**: `python3 scripts/composite-hero-tablet.py` (Pillow, run from repo root).

## Why it's a composite and not a CSS overlay

The tablet photo is a single licensed image; its screen content can't be
swapped with markup because the hand and Pencil overlap the bezel, and the
display sits at a slight tilt with a specular rim light. The replacement has
to be perspective-mapped into the photo's own pixels.

## Procedure (what the script does)

1. **Flood-fill the original screen's background** (solid gray, luminance ≈36,
   tolerance 31–41.5) from several empty-area seeds. The fill runs to the
   display edge, follows the rounded corners exactly, and stops where the
   thumb occludes the right bezel.
2. **Dilate the region 14 px** (`MaxFilter(29)`) so anti-aliased edges and
   small content near the borders are covered.
3. **Union with a coverage rectangle** `(596,160)-(1914,1098)`, corner radius
   40, tucked ~2 px under the bezel — this reaches the content islands
   (phone mockups, headline) the flood fill can't touch.
4. **Perspective-warp** the replacement screenshot onto that rectangle
   (QUAD transform; the display tilt is under a pixel per side) and paste with
   the union mask, feathered 1.2 px.

## Measured constants (2532×1424 original)

| Quantity | Value |
|---|---|
| Display left / right edge (mid-scan) | x ≈ 598 / 1912 |
| Display top / bottom edge (mid-scan) | y ≈ 161 / 1096 |
| Corner arc radius | ≈ 36–44 px (varies per corner, perspective) |
| Display background luminance | 36 (solid `#242424`) |
| Bezel gradient luminance | 24–34 (do NOT confuse with the display) |
| Rim highlight luminance | >100 (above the bezel, outside the display) |

## Pitfalls that already cost one iteration each

- **Naive edge probes lie.** Scanning for "bright pixel" catches the bezel
  gradient (24–34) before the display (36); scanning for "any non-black"
  catches the metal rim highlight. Distinguish the three layers by
  luminance band, or skip probing entirely and flood-fill.
- **Don't guess the corner radius.** An assumed 62 px arc vs. the true
  ~36–44 px left visible crescents of the old screen at the corners. Derive
  the contour from the photo instead of fitting geometry.
- **Inset pastes leave rings.** Insetting the paste "to be safe" leaves a
  border of the original screen visible; tuck 2 px *under* the bezel.
- **Verify at 2× zoom on all four corners**, and scan for the old
  background color (lum 33–39) to catch leftovers — remember some hits are
  legitimate dark UI panels, so confirm visually.

## Swapping the screen content later

Point `SCREEN` in the script at any screenshot. Prefer dark UIs: the display
bezel and photo lighting are dark, and a light screen reads as a glow slab.
Keep the replacement's aspect close to 1800×1125 (the warp tolerates ±10%
without visible distortion).
