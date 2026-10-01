import React, { forwardRef } from "react";
import clsx from "clsx";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./Tag.module.scss";

export const Tag = forwardRef(
  ({ size = "default", text = "", iconLeft = null, iconRight = null, className = "", ariaLabel = null }, ref) => {
    const generateAriaLabel = () => {
      if (ariaLabel) return ariaLabel;
      return text ? i18n.t("ui.toolkit.tag.tagText", { text }) : i18n.t("ui.toolkit.tag.tag");
    };

    const getIconSize = () => {
      switch (size) {
        case "small":
          return "0.625rem"; // 10px
        case "large":
          return "0.875rem"; // 14px
        default:
          return "0.75rem"; // 12px
      }
    };

    const iconSize = getIconSize();

    const renderIcon = (icon) => {
      if (!icon) return null;

      // Handle both JSX elements and component references
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon, {
          width: iconSize,
          height: iconSize,
          strokeWidth: "2.73",
          // Use the icon's existing color if provided, otherwise fallback to tag text color
          color: icon.props?.color || "var(--tag-text)"
        });
      }

      // Handle legacy format with .type and .props
      if (icon.type && icon.props) {
        return (
          <icon.type
            {...icon.props}
            width={iconSize}
            height={iconSize}
            strokeWidth="2.73"
            color={icon.props.color || "var(--tag-text)"}
          />
        );
      }

      return null;
    };

    return (
      <div
        ref={ref}
        className={clsx(styles.tag_container, styles[size], className)}
        aria-label={generateAriaLabel()}>
        {renderIcon(iconLeft)}
        {text && <p className={styles.tag_text}>{text}</p>}
        {renderIcon(iconRight)}
      </div>
    );
  }
);
