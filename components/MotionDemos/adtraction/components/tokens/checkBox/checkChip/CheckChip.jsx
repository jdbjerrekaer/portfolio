import React, { useState, useEffect } from "react";
import { Icons } from "@adtraction/ui-icons";
import clsx from "clsx";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./CheckChip.module.scss";

/**
 * CheckChip is a compact selectable chip with a check/uncheck interaction.
 *
 * @param {("small"|"default")} [size="default"] - Size variant.
 * @param {string} [text=""] - Chip label.
 * @param {React.ReactElement|null} [iconLeft=null] - Icon to render on the left side of the label.
 * @param {boolean} [disabled=false] - Disables interaction.
 * @param {boolean} [checked=false] - Initial checked state.
 * @param {string} [className=""] - Additional class names.
 * @param {function} [onClickCallback=() => {}] - Called with new checked state on toggle.
 * @returns {JSX.Element}
 */
export const CheckChip = ({
  size = "default",
  text = "",
  iconLeft = null,
  disabled = false,
  checked = false,
  className = "",
  onClickCallback = () => {}
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [iconSize, setIconSize] = useState("1rem");
  const [leftIconSize, setLeftIconSize] = useState("1rem");

  // Generate aria-label dynamically based on component state
  const generateAriaLabel = () => {
    const labelBase = text ? i18n.t("ui.toolkit.checkChip.optionText", { text }) : i18n.t("ui.toolkit.checkChip.option");
    const status = isChecked ? i18n.t("ui.toolkit.checkChip.selected") : i18n.t("ui.toolkit.checkChip.notSelected");
    const availability = disabled ? `, ${i18n.t("ui.toolkit.checkChip.unavailable")}` : "";
    return `${labelBase} (${status})${availability}`;
  };

  useEffect(() => {
    if (size === "small") {
      setIconSize("0.9rem");
      setLeftIconSize("0.9rem");
    } else {
      setIconSize("1rem");
      setLeftIconSize("1rem");
    }
  }, [size]);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleClick = () => {
    if (disabled) return;

    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    onClickCallback(newCheckedState);
  };

  return (
    <div
      role="checkbox"
      tabIndex={disabled ? -1 : 0}
      aria-checked={isChecked}
      aria-disabled={disabled}
      aria-label={generateAriaLabel()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={clsx(
        styles.check_chip_container,
        {
          [styles.small]: size === "small"
        },
        className
      )}
      data-disabled={disabled}
      data-checked={isChecked.toString()}
      onClick={handleClick}>
      {iconLeft !== null && (
        <div className={styles.check_chip_left_icon}>
          <iconLeft.type
            {...iconLeft.props}
            width={leftIconSize}
            height={leftIconSize}
            strokeWidth={
              iconLeft.props?.strokeWidth !== undefined
                ? iconLeft.props.strokeWidth
                : size === "small"
                  ? 1.73
                  : 1.73
            }
            color={disabled ? "var(--text-commentary-description)" : "var(--text-body-default)"}
          />
        </div>
      )}
      <p
        className={clsx(styles.check_chip_text, {
          [styles.small]: size === "small"
        })}>
        {text}
      </p>
      <div className={styles.check_chip_icon}>
        <Icons.General.XClose
          height={iconSize}
          width={iconSize}
          strokeWidth={2.3}
          color={disabled ? "var(--text-commentary-description)" : "var(--text-body-default)"}
        />
      </div>
    </div>
  );
};
