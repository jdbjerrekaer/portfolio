"use client";

import { Button as HeroButton, type ButtonProps as HeroButtonProps } from "@heroui/react";
import { forwardRef } from "react";
import Link from "next/link";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import styles from "./Button.module.scss";

export interface ButtonProps extends Omit<HeroButtonProps, "as" | "color" | "radius" | "variant"> {
  variant?: "primary" | "secondary";
  href?: string;
  icon?: IconName;
  iconPosition?: "left" | "right";
  successIcon?: IconName;
  isSuccess?: boolean;
}

const sizeClasses = {
  sm: styles.small,
  md: styles.medium,
  lg: styles.large,
} as const;

const iconSizes = { sm: 16, md: 18, lg: 20 } as const;

const ButtonComponent = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      href,
      size = "md",
      className,
      children,
      icon,
      iconPosition = "right",
      successIcon,
      isSuccess = false,
      ...props
    },
    ref,
  ) => {
    const normalizedSize = size === "sm" || size === "lg" ? size : "md";
    const visibleIcon = isSuccess && successIcon ? successIcon : icon;
    const element = href?.startsWith("/") ? Link : href ? "a" : "button";

    return (
      <AnimateIcon animateOnHover asChild>
        <HeroButton
          as={element}
          href={href}
          ref={ref}
          radius="none"
          size={size}
          className={cn(
            styles.button,
            styles[variant],
            sizeClasses[normalizedSize],
            className,
          )}
          {...props}
        >
          <span className={styles.content}>
            {visibleIcon && iconPosition === "left" && (
              <Icon name={visibleIcon} size={iconSizes[normalizedSize]} animate={isSuccess || undefined} />
            )}
            <span>{children}</span>
            {visibleIcon && iconPosition === "right" && (
              <Icon name={visibleIcon} size={iconSizes[normalizedSize]} animate={isSuccess || undefined} />
            )}
          </span>
        </HeroButton>
      </AnimateIcon>
    );
  },
);

ButtonComponent.displayName = "Button";

export const Button = ButtonComponent;
