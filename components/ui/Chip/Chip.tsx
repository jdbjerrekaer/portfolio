import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Chip.module.scss";

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: "default" | "accent";
  size?: "sm";
  children: ReactNode;
}

export function Chip({ variant = "default", className, children, ...props }: ChipProps) {
  return (
    <span className={cn(styles.chip, styles[variant], className)} {...props}>
      {children}
    </span>
  );
}
