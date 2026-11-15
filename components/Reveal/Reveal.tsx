"use client";

import { useRef, type HTMLAttributes } from "react";
import { useInView } from "motion/react";

type RevealElement = HTMLDivElement & HTMLLIElement & HTMLOListElement & HTMLUListElement;

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "li" | "ol" | "ul" | "figure";
  /** Viewport inset for the trigger; more negative bottom = later. */
  margin?: `${number}px ${number}px ${number}% ${number}px`;
}

/** Flips data-reveal to "in" once the block scrolls into view. CSS does the animating. */
export function Reveal({ as: Tag = "div", margin = "0px 0px -25% 0px", ...props }: RevealProps) {
  const ref = useRef<RevealElement>(null);
  const inView = useInView(ref, { once: true, margin });
  return <Tag ref={ref} data-reveal={inView ? "in" : "out"} {...props} />;
}
