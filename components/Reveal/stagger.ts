import type { CSSProperties } from "react";

/** Stagger index for a .reveal-item. Plain module so server components can call it. */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;
