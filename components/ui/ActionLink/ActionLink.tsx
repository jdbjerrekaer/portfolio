"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import styles from "./ActionLink.module.scss";

export interface ActionLinkProps {
  href: string;
  children: ReactNode;
  variant?: "inline" | "back" | "external";
  icon?: IconName;
  className?: string;
}

export function ActionLink({
  href,
  children,
  variant = "inline",
  icon,
  className,
}: ActionLinkProps) {
  const iconName = icon ?? (variant === "back" ? "arrow-left" : variant === "external" ? "arrow-up-right" : "arrow-right");
  const content = (
    <>
      {variant === "back" && <Icon name={iconName} size={16} />}
      <span>{children}</span>
      {variant !== "back" && <Icon name={iconName} size={16} />}
    </>
  );
  const classes = cn(styles.link, styles[variant], className);

  if (variant === "external") {
    return <AnimateIcon animateOnHover asChild><a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a></AnimateIcon>;
  }

  return <AnimateIcon animateOnHover asChild><Link href={href} className={classes}>{content}</Link></AnimateIcon>;
}
