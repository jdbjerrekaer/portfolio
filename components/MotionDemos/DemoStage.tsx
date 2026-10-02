"use client";

import { useRef, type ReactNode } from "react";
import { useCenteredWide } from "../useCenteredWide";
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

  useCenteredWide(ref, 1120, wide);

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
