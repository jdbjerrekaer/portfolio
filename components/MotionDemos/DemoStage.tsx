"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./DemoStage.module.scss";

// Shared frame for live motion demos in case studies: a stage plus an optional control row.
export function DemoStage({
  children,
  controls,
  caption,
  wide = false,
}: {
  children: ReactNode;
  controls?: ReactNode;
  caption?: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  // Wide stages start where the text starts and grow right, up to 1120px or the viewport edge
  // (minus a 16px gutter). The text column is not centred on the page, so CSS alone can't place it.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!wide || !el) return;
    const fit = () => {
      el.style.width = "";
      const left = el.getBoundingClientRect().left;
      const room = document.documentElement.clientWidth - left - 16;
      el.style.width = `${Math.max(el.offsetWidth, Math.min(1120, room))}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [wide]);

  return (
    <figure ref={ref} className={wide ? `${styles.figure} ${styles.wide}` : styles.figure}>
      <div className={styles.stage}>{children}</div>
      {controls && <div className={styles.controls}>{controls}</div>}
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

export function DemoButton({
  pressed,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return <button type="button" aria-pressed={pressed} className={styles.button} {...props} />;
}
