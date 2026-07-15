import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./Card.module.scss";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "subtle" | "interactive";
}

export function Card({ variant = "surface", className, ...props }: CardProps) {
  return <div className={cn(styles.card, styles[variant], className)} {...props} />;
}
