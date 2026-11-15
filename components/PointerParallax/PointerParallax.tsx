"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Runs while the HTML is still parsing, so the stage can appear as soon as its photos decode
// instead of waiting for the JavaScript bundle (seconds on a slow phone). Mirrors revealWhenDecoded.
const INLINE_REVEAL = `(function(s){if(!s)return;var i=[].filter.call(s.querySelectorAll("img"),function(m){return m.getClientRects().length});Promise.all(i.map(function(m){return m.decode?m.decode().catch(function(){}):0})).then(function(){s.style.setProperty("--stage-delay",Math.max(0,450-performance.now())+"ms");s.setAttribute("data-ready","")})})(document.currentScript&&document.currentScript.previousElementSibling)`;

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

  // Reveal the stage once its visible photos have decoded, so a slow connection never
  // paints a half-loaded image. Fast loads keep the short delay after the headline.
  useEffect(() => {
    const el = ref.current;
    // Already revealed by the inline script on first load; this path covers client-side navigation.
    if (!el || el.hasAttribute("data-ready")) return;
    let cancelled = false;
    const visible = Array.from(el.querySelectorAll("img")).filter((img) => img.getClientRects().length > 0);
    Promise.all(visible.map((img) => img.decode().catch(() => undefined))).then(() => {
      if (cancelled) return;
      el.style.setProperty("--stage-delay", `${Math.max(0, 450 - performance.now())}ms`);
      el.dataset.ready = "";
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <>
      <div ref={ref} className={className} suppressHydrationWarning>
        {children}
      </div>
      <script dangerouslySetInnerHTML={{ __html: INLINE_REVEAL }} />
    </>
  );
}
