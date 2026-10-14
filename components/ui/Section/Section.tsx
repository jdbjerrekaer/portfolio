import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Section.module.scss";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "subtle" | "hero";
  width?: "wide" | "content" | "prose";
  innerClassName?: string;
  /** Rendered as a direct child of the <section>, before the inner wrapper —
   * for full-bleed layers (e.g. the hero dot-grid canvas) that must not be
   * constrained to the content width. */
  prepend?: ReactNode;
  children: ReactNode;
}

export function Section({
  variant = "default",
  width = "wide",
  className,
  innerClassName,
  prepend,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(styles.section, styles[variant], className)} {...props}>
      {prepend}
      <div className={cn(styles.inner, styles[width], innerClassName)}>{children}</div>
    </section>
  );
}
