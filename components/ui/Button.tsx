"use client";

import { Button as HeroButton, ButtonProps as HeroButtonProps } from "@heroui/react";
import { forwardRef } from "react";

export interface ButtonProps extends Omit<HeroButtonProps, "color" | "variant"> {
  variant?: "primary" | "premium" | "secondary" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    // Size-based padding - Apple-like button sizing
    const sizeStyles = {
      sm: "px-4 py-2 min-h-[36px] text-sm",
      md: "px-6 py-3 min-h-[44px] text-base",
      lg: "px-8 py-4 min-h-[52px] text-lg",
    };
    
    const baseStyles = `font-medium rounded-full ${sizeStyles[size || "md"]} cursor-pointer !transition-[background-color,border-color,transform,box-shadow] !duration-[250ms] !ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
    
    const variantStyles = {
      primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:scale-[0.98] active:!transition-transform active:!duration-[150ms]",
      premium: "bg-[var(--color-premium)] text-white hover:bg-[var(--color-premium-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-premium)] focus-visible:ring-offset-2 active:scale-[0.98] active:!transition-transform active:!duration-[150ms]",
      secondary: "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-background-secondary)] hover:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:scale-[0.98] active:!transition-transform active:!duration-[150ms]",
      ghost: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 active:scale-[0.98] active:!transition-transform active:!duration-[150ms]",
    };

    return (
      <HeroButton
        ref={ref}
        radius="full"
        size={size}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        style={{
          transition: 'background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transitionProperty: 'background-color, border-color, transform, box-shadow',
          transitionDuration: '250ms',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </HeroButton>
    );
  }
);

Button.displayName = "Button";

