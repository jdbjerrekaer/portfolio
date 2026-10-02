"use client";

import { useLayoutEffect, type RefObject } from "react";

// Centres a block on the viewport, up to maxWidth and keeping a 16px gutter. Case study text sits
// left of centre on the page, so CSS relative to the text column can't centre wider blocks.
// Margins, not transform, so fixed-position descendants (fullscreen, modals) still anchor to the viewport.
export function useCenteredWide(ref: RefObject<HTMLElement | null>, maxWidth: number, enabled = true) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const fit = () => {
      el.style.width = "";
      el.style.marginLeft = "";
      const viewport = document.documentElement.clientWidth;
      const width = Math.min(maxWidth, viewport - 32);
      const left = el.getBoundingClientRect().left;
      el.style.width = `${width}px`;
      el.style.marginLeft = `${(viewport - width) / 2 - left}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref, maxWidth, enabled]);
}
