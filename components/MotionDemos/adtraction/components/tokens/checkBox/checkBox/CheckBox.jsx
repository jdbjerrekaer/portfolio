import React, { useState, useEffect } from "react";
import clsx from "clsx";
import styles from "./CheckBox.module.scss";
// The card shares the RadioButton card layout so both kinds of card look identical.
import cardStyles from "../../radio/RadioButton.module.scss";
import { Icons } from "@adtraction/ui-icons";

/**
 * CheckBox is a stylized checkbox supporting checked and indeterminate states,
 * hover visuals, and disabled mode.
 *
 * @param {boolean} [checked=false] - Checked state.
 * @param {boolean} [indeterminate=false] - Indeterminate state.
 * @param {boolean} [disabled=false] - Disable interactions.
 * @param {("small"|"default"|"large")} [size="large"] - Size variant.
 * @param {function} [onChange=() => {}] - Called with (checked, indeterminate).
 * @param {boolean} [hovered=false] - Force hovered visuals.
 * @param {("default"|"card")} [type="default"] - "card" renders a clickable card for a single
 *   on/off option, laid out like RadioButton's card.
 * @param {React.ReactNode} [text=""] - Card label.
 * @param {string} [description=""] - Card description.
 * @param {boolean} [allowLongDescription=false] - Card description wraps to two lines.
 * @param {React.ReactNode[]} [items=[]] - Card tags rendered under the description.
 * @param {React.ReactElement|null} [iconLeft=null] - Card icon.
 * @param {string} [ariaLabel=""] - Card accessible label.
 * @returns {JSX.Element}
 */
export const CheckBox = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  size = "default",
  onChange = () => {},
  hovered = false,
  type = "default",
  text = "",
  description = "",
  allowLongDescription = false,
  items = [],
  iconLeft = null,
  ariaLabel = ""
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [isIndeterminate, setIsIndeterminate] = useState(indeterminate);
  const [selfHovered, setSelfHovered] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      // If indeterminate, clicking makes it checked
      // If checked, clicking makes it unchecked
      // If unchecked, clicking makes it checked
      let newCheckedState = false;
      let newIndeterminateState = false;

      if (isIndeterminate) {
        newCheckedState = true;
        newIndeterminateState = false;
      } else if (isChecked) {
        newCheckedState = false;
        newIndeterminateState = false;
      } else {
        newCheckedState = true;
        newIndeterminateState = false;
      }

      setIsChecked(newCheckedState);
      setIsIndeterminate(newIndeterminateState);
      onChange(newCheckedState, newIndeterminateState);
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      setSelfHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setSelfHovered(false);
  };

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  useEffect(() => {
    setIsIndeterminate(indeterminate);
  }, [indeterminate]);

  const isHovered = hovered || selfHovered;

  if (type === "card") {
    return (
      <button
        className={clsx(cardStyles.radio_button_card_container, cardStyles[size])}
        data-active={isChecked}
        data-disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsChecked(!isChecked);
          onChange(!isChecked, false);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        type="button"
        disabled={disabled}
        role="checkbox"
        aria-checked={isChecked}
        aria-disabled={disabled}
        aria-label={ariaLabel.trim() !== "" ? ariaLabel : undefined}>
        {iconLeft && (
          <div className={cardStyles.card_icon_container}>
            <iconLeft.type
              {...iconLeft.props}
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
            />
          </div>
        )}
        <div className={cardStyles.radio_button_content_container}>
          <div className={cardStyles.radio_button_content_row}>
            <p className={cardStyles.card_text}>{text}</p>
            <span className={styles.card_indicator}>
              <CheckBox checked={isChecked} disabled={disabled} size="small" hovered={isHovered} />
            </span>
          </div>
          {typeof description === "string" && description.trim() !== "" && (
            <p
              className={clsx(cardStyles.card_description, {
                [cardStyles.long_description]: allowLongDescription
              })}>
              {description}
            </p>
          )}
          {items.length > 0 && (
            <div className={cardStyles.radio_tag_container}>
              {items.map((item, index) => (
                <React.Fragment key={`card-item-${index}`}>{item}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      </button>
    );
  }
  const isCheckedOrIndeterminate = isChecked || isIndeterminate;

  return (
    <div
      className={styles.checkbox}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <div
        className={clsx(styles.form_check_input, {
          [styles.checked]: isCheckedOrIndeterminate
        })}
        data-size={size}
        data-disabled={disabled}
        data-hovered={isHovered}
        data-indeterminate={isIndeterminate}>
        {(isCheckedOrIndeterminate || (isHovered && !isCheckedOrIndeterminate && !disabled)) && (
          <div className={styles.checkmark}>
            {isIndeterminate ? (
              <Icons.General.Minus
                width="100%"
                height="100%"
                color="var(--grayscale-0)"
                strokeWidth={3}
              />
            ) : isChecked ? (
              <Icons.General.Check
                width="100%"
                height="100%"
                color="var(--grayscale-0)"
                strokeWidth={3}
              />
            ) : (
              <Icons.General.Check
                width="100%"
                height="100%"
                color="var(--primary-blue-200)"
                strokeWidth={3}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
