"use client";

import { useRef, type HTMLAttributes } from "react";
import { useInView } from "motion/react";

type RevealElement = HTMLDivElement & HTMLLIElement & HTMLOListElement & HTMLUListElement;

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "li" | "ol" | "ul" | "figure";
}

/** Flips data-reveal to "in" once the block scrolls into view. CSS does the animating. */
export function Reveal({ as: Tag = "div", ...props }: RevealProps) {
  const ref = useRef<RevealElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  return <Tag ref={ref} data-reveal={inView ? "in" : "out"} {...props} />;
}
