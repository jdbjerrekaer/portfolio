import { useLayoutEffect, useRef } from "react";

/** Emil: on-screen movement uses ease-in-out; keep UI motion under 300ms. */
const MOVE_EASE = "cubic-bezier(0.77, 0, 0.175, 1)";
const ENTER_EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const MOVE_MS = 220;
const ENTER_MS = 200;
const ENTER_STAGGER_MS = 32;
const ENTER_STAGGER_CAP_MS = 128;

/**
 * FLIP list motion for children marked with `data-flip-id`.
 * Moved items slide; new items ease in. Skips first paint and reduced-motion.
 */
export function useFlipList(dependencyKey) {
  const containerRef = useRef(null);
  const prevRectsRef = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const items = Array.from(container.querySelectorAll("[data-flip-id]"));
    const nextRects = new Map();
    items.forEach((el) => {
      nextRects.set(el.getAttribute("data-flip-id"), el.getBoundingClientRect());
    });

    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion && prevRectsRef.current.size > 0) {
      items.forEach((el, index) => {
        if (typeof el.animate !== "function") {
          return;
        }
        if (typeof el.getAnimations === "function") {
          el.getAnimations().forEach((animation) => animation.cancel());
        }

        const id = el.getAttribute("data-flip-id");
        const prev = prevRectsRef.current.get(id);
        const next = nextRects.get(id);

        if (!prev || !next) {
          // Never enter from scale(0); ease-out + short stagger for list swaps.
          el.animate(
            [
              { transform: "translateY(6px) scale(0.96)", opacity: 0 },
              { transform: "translateY(0) scale(1)", opacity: 1 }
            ],
            {
              duration: ENTER_MS,
              delay: Math.min(index * ENTER_STAGGER_MS, ENTER_STAGGER_CAP_MS),
              easing: ENTER_EASE,
              fill: "backwards"
            }
          );
          return;
        }

        const dy = prev.top - next.top;
        if (Math.abs(dy) < 1) return;

        el.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], {
          duration: MOVE_MS,
          easing: MOVE_EASE
        });
      });
    }

    prevRectsRef.current = nextRects;
    return undefined;
  }, [dependencyKey]);

  return containerRef;
}
