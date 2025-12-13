"use client";

import { Chip as HeroChip, ChipProps as HeroChipProps } from "@heroui/react";
import { forwardRef } from "react";

export interface ChipProps extends Omit<HeroChipProps, "color" | "variant"> {
  variant?: "default" | "accent";
}

export const Chip = forwardRef<HTMLDivElement, ChipProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]",
      accent: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
    };

    return (
      <HeroChip
        ref={ref}
        radius="full"
        size="sm"
        className={`
          ${variantStyles[variant]}
          w-fit
          whitespace-nowrap
          px-3
          py-1
          select-none
          ${className}
        `}
        {...props}
      >
        {children}
      </HeroChip>
    );
  }
);

Chip.displayName = "Chip";

