"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroGrid.module.scss";

// Same 80px-pitch grid the CSS ::before drew, so the swap is invisible when
// the cursor is away. Colors replicate that layer's 40%-opacity darken blend
// over the hero's #f9f9f9 background.
const PITCH = 80;
const DOT_X0 = 80.35; // dot centers, from the old background-position
const DOT_Y0 = 79.65;
const LINE_X0 = 0.35;
const LINE_Y0 = 0.35;
const FIELD_BG = "#f8f8f8";
const BASE_RGB: [number, number, number] = [241, 241, 241]; // effective base dot/line color
const ACCENT_RGB: [number, number, number] = [0, 113, 227]; // var(--color-accent)

// Cursor halo + trail tuning.
const HEAD_RADIUS = 140; // base proximity radius (speed adds up to +80)
const TRAIL_RADIUS_FACTOR = 0.75; // trail dots use a tighter radius than the head
const TRAIL_MIN_LIFE = 300; // ms; a slow cursor leaves a short whisper
const TRAIL_MAX_BONUS = 700; // ms; fast strokes add up to this much lifetime
const TRAIL_MIN_DIST = 6; // px between recorded trail points
const TRAIL_MAX_POINTS = 48;

// Click pulse tuning.
const PULSE_DURATION = 800; // ms for the ring to expand and fade out
const PULSE_MAX_RADIUS = 280; // px ring travel
const PULSE_BAND = 55; // px ring thickness
const PULSE_MAX = 6; // simultaneous rings (rapid clicking)

const mixChannel = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const mixColor = (t: number) =>
  `rgb(${mixChannel(BASE_RGB[0], ACCENT_RGB[0], t)},${mixChannel(
    BASE_RGB[1],
    ACCENT_RGB[1],
    t,
  )},${mixChannel(BASE_RGB[2], ACCENT_RGB[2], t)})`;

interface TrailPoint {
  x: number;
  y: number;
  born: number; // performance.now() at lay-down
  life: number; // ms, scales with the cursor speed at lay-down
  heat: number; // speed energy at lay-down
}

interface Pulse {
  x: number;
  y: number;
  born: number;
}

/**
 * Cursor-reactive version of the hero dot grid. The cursor carries a small
 * proximity halo that tints dots and hairlines toward the accent; it lays
 * down a trail of fading points behind it, longer and brighter the faster it
 * moves. Falls back to the static CSS grid when reduced motion is preferred
 * or there's no fine pointer.
 */
export function HeroGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pointer state: position in canvas coords + smoothed velocity (css px/ms).
    let px = Number.NaN;
    let py = Number.NaN;
    let vx = 0;
    let vy = 0;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let hasPointer = false;
    let heat = 0; // current speed energy, fast attack / slow decay
    const trail: TrailPoint[] = [];
    const pulses: Pulse[] = [];

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const now = performance.now();
      if (hasPointer && lastT) {
        const dt = Math.max(now - lastT, 1);
        const k = 0.35;
        vx = vx * (1 - k) + ((x - lastX) / dt) * k;
        vy = vy * (1 - k) + ((y - lastY) / dt) * k;
      }
      lastX = x;
      lastY = y;
      lastT = now;
      px = x;
      py = y;
      hasPointer = true;

      const last = trail[trail.length - 1];
      if (!last || Math.hypot(x - last.x, y - last.y) >= TRAIL_MIN_DIST || now - last.born > 24) {
        trail.push({
          x,
          y,
          born: now,
          life: TRAIL_MIN_LIFE + TRAIL_MAX_BONUS * heat,
          heat,
        });
        if (trail.length > TRAIL_MAX_POINTS) trail.shift();
      }
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > w || y > h) return; // clicks outside the hero
      const now = performance.now();
      // Impact flash: a max-energy trail point that decays quickly.
      trail.push({ x, y, born: now, life: 600, heat: 1 });
      if (trail.length > TRAIL_MAX_POINTS) trail.shift();
      pulses.push({ x, y, born: now });
      if (pulses.length > PULSE_MAX) pulses.shift();
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        hasPointer = false;
        px = Number.NaN;
        py = Number.NaN;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerout", onOut);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    interface Source {
      x: number;
      y: number;
      radius: number;
      s: number; // 0..1 tint strength
      heat: number;
    }

    const draw = () => {
      const now = performance.now();

      // Heat: speed normalised to ~1.4 css px/ms, fast attack, slow decay.
      const speed = Math.min(Math.hypot(vx, vy) / 1.4, 1);
      heat += (speed - heat) * (speed > heat ? 0.4 : 0.06);
      vx *= 0.9;
      vy *= 0.9;

      // Scroll drift mirrors the old CSS scroll-timeline: 0 → -6% of the
      // canvas height across the first viewport of scrolling.
      const drift = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1) * -0.06 * h;

      ctx.fillStyle = FIELD_BG;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(0, drift);

      // Base hairlines, batched into two strokes.
      ctx.strokeStyle = mixColor(0);
      ctx.lineWidth = 0.69;
      ctx.beginPath();
      for (let x = LINE_X0; x <= w + PITCH; x += PITCH) {
        ctx.moveTo(x, -PITCH);
        ctx.lineTo(x, h + PITCH);
      }
      for (let y = LINE_Y0; y <= h + PITCH; y += PITCH) {
        ctx.moveTo(-PITCH, y);
        ctx.lineTo(w + PITCH, y);
      }
      ctx.stroke();

      // Base dots, one path.
      ctx.fillStyle = mixColor(0);
      ctx.beginPath();
      for (let x = DOT_X0; x <= w + PITCH; x += PITCH) {
        for (let y = DOT_Y0; y <= h + PITCH; y += PITCH) {
          ctx.moveTo(x + 3, y);
          ctx.arc(x, y, 3, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      // Assemble influence sources: the live head + surviving trail points.
      while (trail.length && now - trail[0].born > trail[0].life) trail.shift();
      const sources: Source[] = [];
      for (const p of trail) {
        const age = now - p.born;
        const fade = 1 - age / p.life;
        sources.push({
          x: p.x,
          y: p.y,
          radius: (HEAD_RADIUS + 80 * p.heat) * TRAIL_RADIUS_FACTOR,
          s: fade * fade * (0.12 + 0.28 * p.heat),
          heat: p.heat,
        });
      }
      if (hasPointer) {
        sources.push({
          x: px,
          y: py,
          radius: HEAD_RADIUS + 80 * heat,
          s: 0.12 + 0.28 * heat,
          heat,
        });
      }

      // Click pulses: an expanding ring that tints the grid as it passes.
      while (pulses.length && now - pulses[0].born > PULSE_DURATION) pulses.shift();
      const livePulses = pulses.map((p) => {
        const age = now - p.born;
        const pNorm = age / PULSE_DURATION;
        const ease = 1 - Math.pow(1 - pNorm, 3); // easeOutCubic expansion
        return {
          x: p.x,
          y: p.y,
          ring: ease * PULSE_MAX_RADIUS,
          fade: 1 - pNorm,
        };
      });

      if (sources.length || livePulses.length) {
        // Accumulated tint at one point from all sources (clamped).
        const tintAt = (cx: number, cy: number) => {
          let acc = 0;
          let hot = 0;
          for (const src of sources) {
            const dx = cx - src.x;
            const dy = cy - src.y;
            const r = src.radius;
            const d2 = dx * dx + dy * dy;
            if (d2 > r * r) continue;
            let t = 1 - Math.sqrt(d2) / r;
            acc += t * t * src.s;
            if (src.heat > hot) hot = src.heat;
          }
          for (const pulse of livePulses) {
            const dx = cx - pulse.x;
            const dy = cy - pulse.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const off = Math.abs(d - pulse.ring);
            if (off > PULSE_BAND) continue;
            acc += (1 - off / PULSE_BAND) * pulse.fade * 0.35;
            if (pulse.fade > hot) hot = pulse.fade;
          }
          return { t: acc > 0.6 ? 0.6 : acc, hot };
        };

        // Tinted hairline segments, colored at the cell-edge midpoint.
        ctx.lineWidth = 1.2;
        const seg = (x1: number, y1: number, x2: number, y2: number) => {
          const { t, hot } = tintAt((x1 + x2) / 2, (y1 + y2) / 2);
          if (t <= 0.003) return;
          ctx.strokeStyle = mixColor(t);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        };
        for (let x = LINE_X0; x <= w + PITCH; x += PITCH) {
          for (let y = -PITCH; y <= h + PITCH; y += PITCH) seg(x, y, x, y + PITCH);
        }
        for (let y = LINE_Y0; y <= h + PITCH; y += PITCH) {
          for (let x = -PITCH; x <= w + PITCH; x += PITCH) seg(x, y, x + PITCH, y);
        }

        // Tinted dots, grown slightly with nearby heat.
        for (let x = DOT_X0; x <= w + PITCH; x += PITCH) {
          for (let y = DOT_Y0; y <= h + PITCH; y += PITCH) {
            const { t, hot } = tintAt(x, y);
            if (t <= 0.003) continue;
            ctx.fillStyle = mixColor(t);
            ctx.beginPath();
            ctx.arc(x, y, 3 + 1.6 * hot, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    };

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || !w || !h) return;
      draw();
    };
    raf = requestAnimationFrame(loop);

    // Only now take over from the static CSS grid.
    canvas.dataset.live = "";

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);

  return <canvas ref={ref} className={styles.heroGrid} aria-hidden="true" />;
}
