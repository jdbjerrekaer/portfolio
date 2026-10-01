import React from "react";
import { Radio } from "../radio/Radio";
import clsx from "clsx";
import styles from "../RadioButton.module.scss";

export const RadioButton = ({
  type = "pill",
  size = "default",
  active = false,
  disabled = false,
  value = "",
  iconLeft = null,
  text = "",
  description = "",
  allowLongDescription = false,
  onClick = () => {},
  items = [],
  iconColor = "var(--radio-button-default-text)",
  ariaLabel = ""
}) => {
  const hasDescription = description.trim() !== "";
  const hasItems = items.length > 0;
  const hasIcon = iconLeft !== null;
  const customAriaLabel = ariaLabel.trim() !== "" ? ariaLabel : `Radio button: ${text}`;
  const pillIconColor = disabled
    ? "var(--button-ghost-disabled-text)"
    : active
      ? "white"
      : iconColor;
  const cardIconColor = disabled ? "var(--button-ghost-disabled-text)" : iconColor;

  return type === "pill" ? (
    <button
      className={clsx(styles.radio_button_pill_container, styles[size])}
      data-active={active}
      data-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onClick(value);
        }
      }}
      type="button"
      disabled={disabled}
      role="radio"
      aria-checked={active}
      aria-disabled={disabled}
      aria-label={customAriaLabel}>
      {hasIcon && (
        <iconLeft.type
          {...iconLeft.props}
          width="1rem"
          height="1rem"
          color={pillIconColor}
        />
      )}
      <p className={styles.pill_text}>{text}</p>
    </button>
  ) : type === "card" ? (
    <button
      className={clsx(styles.radio_button_card_container, styles[size])}
      data-active={active}
      data-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onClick(value);
        }
      }}
      type="button"
      disabled={disabled}
      role="radio"
      aria-checked={active}
      aria-disabled={disabled}
      aria-label={customAriaLabel}>
      {hasIcon && (
        <div className={styles.card_icon_container}>
          <iconLeft.type
            {...iconLeft.props}
            width="var(--size-icon-small)"
            height="var(--size-icon-small)"
            color={cardIconColor}
          />
        </div>
      )}
      <div className={styles.radio_button_content_container}>
        <div className={styles.radio_button_content_row}>
          <p className={styles.card_text}>{text}</p>
          <Radio checked={active} disabled={disabled} />
        </div>
        {hasDescription && (
          <p
            className={clsx(styles.card_description, {
              [styles.long_description]: allowLongDescription
            })}>
            {description}
          </p>
        )}
        {hasItems && (
          <div className={styles.radio_tag_container}>
            {items.map((item, index) => (
              <React.Fragment key={`tag-item-${index}`}>{item}</React.Fragment>
            ))}
          </div>
        )}
      </div>
    </button>
  ) : null;
};
