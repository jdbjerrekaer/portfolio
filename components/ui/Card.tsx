"use client";

import { Card as HeroCard, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { forwardRef, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  isHoverable?: boolean;
  isPressable?: boolean;
  onPress?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", isHoverable = false, isPressable = false, onPress, ...props }, ref) => {
    const isInteractive = isHoverable || isPressable;
    
    return (
      <HeroCard
        ref={ref}
        shadow="none"
        radius="lg"
        isHoverable={isHoverable}
        isPressable={isPressable}
        onPress={onPress}
        className={`
          bg-[var(--color-background)]
          border border-[var(--color-border)]
          rounded-[var(--radius-lg)]
          overflow-hidden
          transition-[box-shadow,transform,border-color] duration-[var(--transition-base)] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${isInteractive ? "cursor-pointer" : ""}
          ${isHoverable ? "hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)]" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </HeroCard>
    );
  }
);

Card.displayName = "Card";

// Re-export HeroUI card parts for convenience
export { CardBody, CardFooter, CardHeader };

