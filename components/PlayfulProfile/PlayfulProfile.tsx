"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./PlayfulProfile.module.scss";

// Interaction constants — same feel as the Cramer demo avatar, retuned for a 200px photo.
const DRAG_STRETCH_PX = 14; // rubber-band max stretch
const TUG_QUIP_PX = 14; // pull farther than this and it's a "tug", not a click
const CLICK_GAP_MS = 700; // multi-click window
const SNAP_MS = 500;
const QUIP_HOLD_MS = 3400;
const THANKS_CHANCE = 0.15;
const DIZZY_CHANCE = 0.1;

const QUIPS = [
  "Yes, I also click on people's faces.",
  "That's my good side. It's the only side.",
  "Careful, I'm ticklish.",
  "This photo was taken before my coffee.",
  "You know I can see the analytics, right?",
  "If you shake me, do I not jiggle?",
  "Please don't drag me into your toolbar.",
  "I charge per click. Invoice follows.",
  "This is exactly what the consent banner is for.",
  "Try the Cramer demo next — he loves this.",
  "My therapist says I seek validation. Click again.",
  "Somewhere, a KPI just went up.",
];

const TUG_QUIPS = [
  "Put me back.",
  "I said put me BACK.",
  "Not the drag-and-drop!",
  "I get motion sick, you know.",
];

const THANKS_QUIP = "Thanks, I needed that.";
const DIZZY_QUIP = "Okay, now I'm dizzy.";

interface PlayfulProfileProps extends Omit<ImageProps, "className" | "draggable"> {
  className?: string;
}

export function PlayfulProfile({ className, alt, ...imageProps }: PlayfulProfileProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [anim, setAnim] = useState<string | null>(null);
  const [quip, setQuip] = useState<{ text: string; key: number; hold: number } | null>(null);
  const dragging = useRef(false);
  const clicks = useRef({ count: 0, at: 0 });
  const quipIndex = useRef(0);
  const tugIndex = useRef(0);
  const quipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const say = (text: string, ms = QUIP_HOLD_MS) => {
    if (quipTimer.current) clearTimeout(quipTimer.current);
    setQuip({ text, key: Date.now(), hold: ms });
    // Unmount just after the CSS fade-out (delay = hold, duration = 140ms).
    quipTimer.current = setTimeout(() => setQuip(null), ms + 180);
  };

  const restartAnim = (name: string) => {
    if (reduced.current) return;
    setAnim(null);
    // Force a style flush so the previous animation actually restarts.
    requestAnimationFrame(() => setAnim(name));
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || !(e.target instanceof Node) || !el.contains(e.target)) return;
      e.preventDefault(); // no image-drag, no text selection, no scroll-fight
      dragging.current = false;
      setSnapping(false);
      el.setPointerCapture(e.pointerId);
      const start = { x: e.clientX, y: e.clientY };
      let farthest = 0;

      const onMove = (ev: PointerEvent) => {
        const mx = ev.clientX - start.x;
        const my = ev.clientY - start.y;
        const dist = Math.hypot(mx, my);
        if (dist > 3) dragging.current = true;
        farthest = Math.max(farthest, dist);
        // Rubber band: follows freely at first, maxes out at DRAG_STRETCH_PX.
        const pull = dist ? (DRAG_STRETCH_PX * Math.tanh(dist / (DRAG_STRETCH_PX * 3))) / dist : 0;
        setDx(mx * pull);
        setDy(my * pull);
      };
      const onRelease = () => {
        el.removeEventListener("pointermove", onMove);
        if (farthest > TUG_QUIP_PX) {
          say(TUG_QUIPS[tugIndex.current++ % TUG_QUIPS.length]);
        }
        setSnapping(true);
        setDx(0);
        setDy(0);
        setTimeout(() => setSnapping(false), SNAP_MS);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onRelease, { once: true });
      el.addEventListener("pointercancel", onRelease, { once: true });
    };

    const onClick = (e: MouseEvent) => {
      if (!el.contains(e.target as Node) || dragging.current) {
        dragging.current = false;
        return;
      }
      const now = Date.now();
      clicks.current =
        now - clicks.current.at < CLICK_GAP_MS
          ? { count: clicks.current.count + 1, at: now }
          : { count: 1, at: now };
      if (clicks.current.count < 3) {
        restartAnim(clicks.current.count === 1 ? "jiggle1" : "jiggle2");
        return;
      }
      clicks.current = { count: 0, at: 0 };
      const roll = Math.random();
      if (roll < THANKS_CHANCE) {
        restartAnim("wiggle");
        return say(THANKS_QUIP);
      }
      if (roll < THANKS_CHANCE + DIZZY_CHANCE) {
        restartAnim("dizzy");
        return say(DIZZY_QUIP, 2600);
      }
      restartAnim("wiggle");
      say(QUIPS[quipIndex.current++ % QUIPS.length]);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("click", onClick);
    };
  }, []);

  const animClass =
    anim === "jiggle1"
      ? styles.jiggle1
      : anim === "jiggle2"
        ? styles.jiggle2
        : anim === "wiggle"
          ? styles.wiggle
          : anim === "dizzy"
            ? styles.dizzy
            : undefined;

  return (
    <div className={styles.wrap}>
      <div
        ref={rootRef}
        className={`${styles.playful} ${snapping ? styles.snap : ""} ${animClass ?? ""}`}
        style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as React.CSSProperties}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes through imageProps */}
        <Image {...imageProps} alt={alt} draggable={false} className={className} />
      </div>
      {quip && (
        <div
          key={quip.key}
          className={styles.quip}
          role="status"
          style={{ "--quip-hold": `${quip.hold}ms` } as React.CSSProperties}
        >
          {quip.text}
        </div>
      )}
    </div>
  );
}
