#!/usr/bin/env python3
"""Composite a new UI screenshot into the hero tablet photo.

Regenerates public/images/hero/ipad-hand-cramer.png from:
  - public/images/hero/ipad-hand.png            (licensed original, untouched)
  - public/projects/cramer-ai-assistant/before-after/after-dark.jpg

Why not just paste a rectangle: the display opening is a slightly tilted
rounded quad, and its corner radius is easy to get wrong (62px was tried and
left visible crescents of the original page; the true arc is ~36-44px and
varies per corner with perspective). Instead of guessing geometry, the mask
is DERIVED from the photo: flood-fill the original screen's solid background
color — the fill runs to the display edge and follows the rounded corners
exactly, and stops naturally where the thumb occludes the right bezel.

Run from the repo root:  python3 scripts/composite-hero-tablet.py
Requires Pillow. Output overwrites public/images/hero/ipad-hand-cramer.png.
"""

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PHOTO = ROOT / "public/images/hero/ipad-hand.png"
SCREEN = ROOT / "public/projects/cramer-ai-assistant/before-after/after-dark.jpg"
OUT = ROOT / "public/images/hero/ipad-hand-cramer.png"

# Measured display bounds (2532x1424 original), see docs/hero-tablet-composite.md.
# The coverage rect tucks ~2px under the bezel so no original pixel can show.
RECT = (596, 160, 1914, 1098)  # left, top, right, bottom
RECT_RADIUS = 40               # corner arc of the coverage rect (content islands)
DILATE = 29                    # MaxFilter size: flood region grows 14px to swallow
                               # anti-aliasing and small content near the edges

# Seeds sit on empty page background, away from the baked-in content
# (phone mockups, headline text).
SEEDS = [(1700, 850), (1000, 850), (850, 320), (1800, 300), (1500, 1050)]

# Original screen background is a solid gray, luminance ~36. Tolerance must
# exclude the bezel gradient (24-34) and the rim highlight (>100) — those two
# contaminate naive "bright pixel" edge probes.
BG_LUM = (31.0, 41.5)


def main() -> None:
    photo = Image.open(PHOTO).convert("RGBA")
    width, height = photo.size
    px = photo.load()

    def is_bg(p) -> bool:
        lum = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]
        return BG_LUM[0] <= lum <= BG_LUM[1]

    # Flood fill the contiguous background region (4-connected).
    region = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for sx, sy in SEEDS:
        if is_bg(px[sx, sy]):
            queue.append((sx, sy))
            region[sy * width + sx] = 1
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and not region[ny * width + nx] and is_bg(px[nx, ny]):
                region[ny * width + nx] = 1
                queue.append((nx, ny))

    flood_mask = Image.frombytes("L", (width, height), bytes(region)).filter(ImageFilter.MaxFilter(DILATE))

    # Coverage rect for the content islands the flood fill can't reach.
    rect_mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(rect_mask).rounded_rectangle(RECT, radius=RECT_RADIUS, fill=255)

    mask = ImageChops.lighter(flood_mask, rect_mask).filter(ImageFilter.GaussianBlur(1.2))

    # Perspective-warp the replacement screenshot onto a full-size canvas
    # (quad -> axis-aligned RECT; the display tilt is under a pixel per side).
    screen = Image.open(SCREEN).convert("RGB")
    warped = Image.new("RGB", (width, height))
    quad_w, quad_h = RECT[2] - RECT[0] + 2, RECT[3] - RECT[1] + 2
    warped.paste(
        screen.transform(
            (quad_w, quad_h),
            Image.QUAD,
            (0, 0, 0, screen.height, screen.width, screen.height, screen.width, 0),
            Image.BICUBIC,
        ),
        (RECT[0], RECT[1]),
    )

    photo.paste(warped, (0, 0), mask)
    photo.save(OUT)
    print(f"saved {OUT} (flood region {sum(region)} px)")


if __name__ == "__main__":
    main()
