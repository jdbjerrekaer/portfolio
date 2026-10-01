import React, { useState, useRef, forwardRef } from "react";
import { Icons } from "@adtraction/ui-icons";
import clsx from "clsx";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./Chip.module.scss";

/**
 * Chip displays compact information with optional avatar, icons and a close interaction.
 *
 * @param {string} [id=""] - Unique identifier used when invoking onClose.
 * @param {boolean} [avatarRight=true] - Whether avatar/close controls are placed on the right.
 * @param {("small"|"default"|"large")} [size="default"] - Size variant of the chip.
 * @param {string} [text=""] - Main text content.
 * @param {string} [linkTextSpan=""] - Optional hyperlink-styled trailing text.
 * @param {string} [avatar=""] - Avatar image URL.
 * @param {function} [onClose=() => {}] - Invoked when the chip is closed; receives `id`.
 * @param {React.ReactNode} [iconLeft=null] - Left icon.
 * @param {React.ReactNode} [iconRight=null] - Right icon.
 * @param {boolean} [active=false] - Active state styling.
 * @returns {JSX.Element}
 */
export const Chip = forwardRef(
  (
    {
      id = "",
      avatarRight = true,
      size = "default",
      text = "",
      linkTextSpan = "",
      avatar = "",
      onClose = () => {},
      iconLeft = null,
      iconLeftFlexible = false,
      iconRight = null,
      active = false
    },
    ref
  ) => {
    const [isClosing, setIsClosing] = useState(false);
    const internalRef = useRef(null);
    const chipRef = ref || internalRef;

    // Generate aria-label dynamically based on component state
    const generateAriaLabel = () => {
      const labelBase = text ? i18n.t("ui.toolkit.chip.chipText", { text }) : i18n.t("ui.toolkit.chip.chip");
      const linkText = linkTextSpan ? ` ${i18n.t("ui.toolkit.chip.withLink", { link: linkTextSpan })}` : "";
      const status = active ? i18n.t("ui.toolkit.chip.active") : i18n.t("ui.toolkit.chip.inactive");
      return `${labelBase}${linkText} (${status})`;
    };

    const handleClose = () => {
      if (chipRef.current) {
        const chipWidth = chipRef.current.offsetWidth;
        requestAnimationFrame(() => {
          chipRef.current.style.width = `${chipWidth}px`;
          setIsClosing(true);
        });
      }
      setTimeout(() => {
        onClose(id);
      }, 200);
    };

    const handleMainClick = () => {
      // Only handle close on main click if no hyperlink
      if (linkTextSpan === "") {
        handleClose();
      }
    };

    const closeIconComponent = () => {
      return (
        <div className={styles.chip_close_icon_container}>
          <Icons.General.XClose
            width={size === "small" ? "var(--size-icon-x-small)" : "var(--size-icon-small)"}
            height={size === "small" ? "var(--size-icon-x-small)" : "var(--size-icon-small)"}
            color="#bdbdc3"
            strokeWidth={2.73}
          />
        </div>
      );
    };

    const avatarComponent = () => {
      return <img src={avatar} alt="avatar" className={styles.chip_avatar_image} />;
    };

    const closeIconHandler = (e) => {
      e.stopPropagation();
      handleClose();
    };

    return (
      <button
        ref={chipRef}
        className={clsx(styles.chip_container, styles[size])}
        data-closing={isClosing}
        data-active={active}
        role="button"
        tabIndex={0}
        aria-pressed={active}
        aria-label={generateAriaLabel()}
        onClick={handleMainClick}>
        {/* Left side elements */}
        {!avatarRight && !linkTextSpan && (
          <div onClick={closeIconHandler}>{closeIconComponent()}</div>
        )}
        {avatar && !avatarRight && avatarComponent()}
        {iconLeft && (
          <div
            className={clsx(
              styles.chip_icon_container,
              iconLeftFlexible && styles.chip_icon_container_flexible
            )}>
            {iconLeft}
          </div>
        )}

        {/* Main content */}
        <p className={styles.chip_text}>
          {text} {linkTextSpan && <span className={styles.chip_hyperlink}>{linkTextSpan}</span>}
        </p>

        {/* Right side elements */}
        {iconRight && <div className={styles.chip_icon_container}>{iconRight}</div>}
        {avatar && avatarRight && avatarComponent()}
        {avatarRight && !linkTextSpan && (
          <div onClick={closeIconHandler}>{closeIconComponent()}</div>
        )}
      </button>
    );
  }
);
