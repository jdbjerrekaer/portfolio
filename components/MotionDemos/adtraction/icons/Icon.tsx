import React, { Suspense, ComponentType, SVGProps } from "react";
import styles from "./icons.module.scss";
import clsx from "clsx";

interface IconProps extends SVGProps<SVGSVGElement> {
  icon?: React.ReactElement;
  color?: string;
  secondaryColor?: string;
  roundBackground?: boolean;
  backgroundPadding?: number;
  backgroundColor?: string;
  maskableIcon?: boolean;
  className?: string;
  strokeWidth?: number;
  LazyComponent: ComponentType<SVGProps<SVGSVGElement>>;
}

export function Icon({
  color = "var(--text-body-default)",
  secondaryColor = "currentColor",
  backgroundColor = "transparent",
  roundBackground = false,
  backgroundPadding = 0,
  maskableIcon = true,
  strokeWidth = 1.73,
  height = "1rem",
  width = "1rem",
  className,
  style,
  LazyComponent,
  ...props
}: IconProps) {
  const svgStyle: React.CSSProperties = {
    width,
    height,
    strokeWidth: strokeWidth + "px",
    ...style
  };

  const containerStyle: React.CSSProperties = {};

  if (maskableIcon && color) {
    containerStyle.color = color;
  }

  return (
    <span
      className={clsx(
        styles.icon_outer_container,
        roundBackground && styles.round_background,
        className
      )}
      style={
        {
          "--icon-padding": backgroundPadding + "rem",
          "--icon-background-color": backgroundColor,
          "--icon-secondary-color": secondaryColor,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          lineHeight: 0,
          fontSize: 0,
          ...containerStyle
        } as React.CSSProperties
      }>
      <Suspense fallback={null}>
        <LazyComponent
          data-maskable-icon={maskableIcon}
          style={{ ...svgStyle, display: "block" }}
          {...props}
        />
      </Suspense>
    </span>
  );
}
