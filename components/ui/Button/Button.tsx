"use client";

import { Button as HeroButton, ButtonProps as HeroButtonProps } from "@heroui/react";
import { forwardRef } from "react";
import { SFSymbol } from "../SFSymbol";
import styles from "./Button.module.scss";

export interface ButtonProps extends Omit<HeroButtonProps, "color" | "variant"> {
  variant?: "primary" | "premium" | "secondary" | "ghost";
  icon?: string;
  iconPosition?: "left" | "right";
  hoverIcon?: string;
  hoverIconFilled?: boolean;
  successIcon?: string;
  successIconFilled?: boolean;
  isSuccess?: boolean;
}

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      children,
      icon,
      iconPosition = "right",
      hoverIcon,
      hoverIconFilled = true,
      successIcon,
      successIconFilled = true,
      isSuccess,
      ...props
    },
    ref
  ) => {
    // Size-based padding - Apple-like button sizing
    const sizeStyles = {
      sm: "px-4 py-2 min-h-[36px] text-sm",
      md: "px-6 py-3 min-h-[44px] text-base",
      lg: "px-8 py-4 min-h-[52px] text-lg",
    };
    
    const iconSizes = {
      sm: 16,
      md: 18,
      lg: 20,
    };
    
    const baseStyles = `font-medium rounded-full ${sizeStyles[size || "md"]} cursor-pointer group relative overflow-hidden`;
    
    const variantStyles = {
      primary: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
      premium: "bg-[var(--color-foreground)] text-white hover:bg-[#2d2d2f] focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2",
      secondary: "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-background-secondary)] hover:border-[var(--color-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
      ghost: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
    };

    const iconSize = iconSizes[size || "md"];
    const hasIcon = Boolean(icon);
    const hasHoverIcon = Boolean(hoverIcon);

    return (
      <HeroButton
        ref={ref}
        radius="full"
        size={size}
        className={`${baseStyles} ${variantStyles[variant]} ${className} ${styles.button} ${hasIcon ? styles.hasIcon : ""} ${hasHoverIcon ? styles.hasHoverIcon : ""} ${isSuccess ? styles.hasSuccess : ""}`}
        style={{
          transition: 'background-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        } as React.CSSProperties}
        {...props}
      >
        <span className={styles.content} data-icon-position={iconPosition}>
          {hasIcon && icon && iconPosition === "left" && (
            <span className={`${styles.icon} ${styles.iconLeft}`}>
              <SFSymbol name={icon} size={iconSize} weight="medium" filled={false} className={styles.iconOutline} />
              <SFSymbol name={icon} size={iconSize} weight="medium" filled={true} className={styles.iconFilled} />
            </span>
          )}
          <span className={styles.text}>{children}</span>
          {hasIcon && icon && iconPosition === "right" && (
            <span className={`${styles.icon} ${styles.iconRight}`}>
              <SFSymbol name={icon} size={iconSize} weight="medium" filled={false} className={styles.iconOutline} />
              <SFSymbol name={icon} size={iconSize} weight="medium" filled={true} className={styles.iconFilled} />
            </span>
          )}
          {hasHoverIcon && hoverIcon && (
            <span className={`${styles.icon} ${styles.hoverIconContainer}`}>
              <span className={`${styles.hoverIconInner} ${isSuccess ? styles.hoverIconHidden : ""}`}>
                <SFSymbol
                  name={hoverIcon}
                  size={iconSize}
                  weight="medium"
                  filled={hoverIconFilled}
                  className={styles.hoverIconFilled}
                />
              </span>
              {successIcon && (
                <span className={`${styles.hoverIconInner} ${styles.successIconInner} ${isSuccess ? "" : styles.hoverIconHidden}`}>
                  <SFSymbol
                    name={successIcon}
                    size={iconSize}
                    weight="medium"
                    filled={successIconFilled}
                    className={styles.hoverIconFilled}
                  />
                </span>
              )}
            </span>
          )}
        </span>
      </HeroButton>
    );
  }
);

ButtonComponent.displayName = "Button";

export const Button = ButtonComponent;

