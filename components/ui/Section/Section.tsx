import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Section.module.scss";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "subtle" | "hero";
  width?: "wide" | "content" | "prose";
  innerClassName?: string;
  children: ReactNode;
}

export function Section({
  variant = "default",
  width = "wide",
  className,
  innerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(styles.section, styles[variant], className)} {...props}>
      <div className={cn(styles.inner, styles[width], innerClassName)}>{children}</div>
    </section>
  );
}
