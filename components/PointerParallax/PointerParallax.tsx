"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Publishes the cursor position as --mx / --my (each -1..1, relative to this
 * element's box) so hero props can drift at different depths. Updates are
 * rAF-batched; leaving the window eases everything back to rest.
 */
export function PointerParallax({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pointer: { x: number; y: number } | null = null;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    // Layout is read once per frame, not once per pointer event.
    const apply = () => {
      raf = 0;
      let mx = 0;
      let my = 0;
      const r = el.getBoundingClientRect();
      if (pointer && r.width && r.height) {
        // Clamp so props settle once the cursor is well past the stage.
        mx = clamp(((pointer.x - r.left) / r.width) * 2 - 1);
        my = clamp(((pointer.y - r.top) / r.height) * 2 - 1);
      }
      el.style.setProperty("--mx", mx.toFixed(3));
      el.style.setProperty("--my", my.toFixed(3));
    };
    const schedule = (next: typeof pointer) => {
      pointer = next;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (e: PointerEvent) => schedule({ x: e.clientX, y: e.clientY });
    // window never fires pointerleave; a pointerout with no target means the
    // pointer left the document.
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) schedule(null);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {children}
    </div>
  );
}
