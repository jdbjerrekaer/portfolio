"use client";

import { RefObject, useEffect, useRef } from "react";
import styles from "./AnchoredPopover.module.scss";

export interface AnchoredPopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  offsetY?: number;
  role?: "status" | "tooltip";
  ariaLive?: "off" | "polite" | "assertive";
}

export function AnchoredPopover({
  anchorRef,
  isOpen,
  children,
  className = "",
  offsetY = 10,
  role = "status",
  ariaLive = "polite",
}: AnchoredPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const positionPopover = () => {
    const anchorEl = anchorRef.current;
    const popoverEl = popoverRef.current;
    if (!anchorEl || !popoverEl) return;

    const rect = anchorEl.getBoundingClientRect();
    popoverEl.style.left = `${rect.left + rect.width / 2}px`;
    popoverEl.style.top = `${rect.top - offsetY}px`;
  };

  useEffect(() => {
    const popoverEl = popoverRef.current;
    if (!popoverEl) return;

    if (isOpen) {
      positionPopover();
      if (popoverEl.matches(":popover-open")) {
        popoverEl.hidePopover();
      }
      popoverEl.showPopover();

      const handleReposition = () => positionPopover();
      window.addEventListener("resize", handleReposition, { passive: true });
      window.addEventListener("scroll", handleReposition, { passive: true });

      return () => {
        window.removeEventListener("resize", handleReposition);
        window.removeEventListener("scroll", handleReposition);
        if (popoverEl.matches(":popover-open")) {
          popoverEl.hidePopover();
        }
      };
    }

    if (popoverEl.matches(":popover-open")) {
      popoverEl.hidePopover();
    }
  }, [isOpen, offsetY]);

  return (
    <div
      ref={popoverRef}
      popover="manual"
      role={role}
      aria-live={ariaLive}
      className={`tooltip-glass ${styles.popover} ${className}`}
    >
      {children}
    </div>
  );
}
