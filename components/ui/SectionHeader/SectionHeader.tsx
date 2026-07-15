import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./SectionHeader.module.scss";

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "stacked" | "split" | "centered";
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  variant = "stacked",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn(styles.header, styles[variant], className)}>
      <div className={styles.copy}>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
