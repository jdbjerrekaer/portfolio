import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import styles from "./InfoCard.module.scss";

export interface InfoCardProps {
  title: ReactNode;
  icon: IconName;
  children: ReactNode;
  metadata?: ReactNode;
  badge?: ReactNode;
  variant?: "default" | "highlighted" | "media";
  className?: string;
}

export function InfoCard({
  title,
  icon,
  children,
  metadata,
  badge,
  variant = "default",
  className,
}: InfoCardProps) {
  return (
    <li className={styles.item}>
      <Card
        variant={variant === "highlighted" ? "surface" : "interactive"}
        className={cn(styles.card, styles[variant], className)}
      >
        <Icon name={icon} size={24} className={styles.icon} animateOnHover />
        <div className={styles.content}>
          <div className={styles.heading}>
            <strong>{title}</strong>
            {badge}
            {metadata && <span className={styles.metadata}>{metadata}</span>}
          </div>
          {children}
        </div>
      </Card>
    </li>
  );
}

export function InfoCardGrid({ children }: { children: ReactNode }) {
  return <ul className={styles.grid}>{children}</ul>;
}
