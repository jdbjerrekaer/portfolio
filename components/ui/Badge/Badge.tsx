import type { HTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import styles from "./Badge.module.scss";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  label: ReactNode;
  tone?: "neutral" | "success" | "muted";
  icon?: IconName;
  dot?: boolean;
}

export function Badge({
  label,
  tone = "neutral",
  icon,
  dot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[tone], className)} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {icon && <Icon name={icon} size={13} />}
      {label}
    </span>
  );
}
