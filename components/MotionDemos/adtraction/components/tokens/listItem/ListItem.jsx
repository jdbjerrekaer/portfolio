import React, { useState, useEffect } from "react";
import { CheckBox } from "../checkBox/checkBox/CheckBox";
import { Icons } from "@adtraction/ui-icons";
import clsx from "clsx";
import styles from "./ListItem.module.scss";

/**
 * ListItem displays a selectable row with optional icons, description and caption.
 * It supports multiselect mode, disabled/hoverable states, and action types.
 *
 * @param {("small"|"default"|"large")} [size="default"] - Size variant.
 * @param {boolean|string} [active=false] - Whether the item is active (true/"true").
 * @param {React.ReactElement|null} [iconLeft=null] - Left icon element.
 * @param {React.ReactElement|null} [iconRight=null] - Right icon element.
 * @param {string} [text=""] - Main text label.
 * @param {string} [description=""] - Secondary text line.
 * @param {React.ReactNode|string} [caption=""] - Right side caption content.
 * @param {boolean} [multiselect=false] - Enables checkbox for multiselect.
 * @param {boolean} [indeterminate=false] - Shows the multiselect checkbox as partly checked.
 * @param {boolean} [disabled=false] - Disables interaction and styles.
 * @param {("default"|"delete"|"reject"|"approve"|"pause")} [type="default"] - Action type.
 * @param {boolean|string} [focused=false] - Focused visual state (true/"true").
 * @param {boolean} [hoverable=true] - Enables hover interactions.
 * @param {boolean} [fitContent=false] - If true, item width fits content.
 * @param {function} [onClick=() => {}] - Click handler.
 * @param {string} [className=""] - Additional class names to append to the container.
 * @returns {JSX.Element}
 */
export const ListItem = ({
  size = "default",
  active = false,
  iconLeft = null,
  iconRight = null,
  text = "",
  description = "",
  caption = "",
  multiselect = false,
  indeterminate = false,
  disabled = false,
  type = "default",
  focused = false,
  hoverable = true,
  fitContent = false,
  className = "",
  onClick = () => {},
  ...rest
}) => {
  const [checkboxSize, setCheckboxSize] = useState("default");
  const [iconSize, setIconSize] = useState("default");
  const [actionIconSize, setActionIconSize] = useState("2");
  const [isHovered, setIsHovered] = useState(false);
  const [checked, setChecked] = useState(active);

  const isActive = active === true || active === "true";
  const isFocused = focused === true || focused === "true";

  useEffect(() => {
    if (size === "small" || size === "default") {
      setCheckboxSize("small");
      setIconSize("1rem");
      setActionIconSize(size === "small" ? "1.73" : "2");
    } else {
      setCheckboxSize("default");
      setIconSize("1.5rem");
      setActionIconSize("2.73");
    }
  }, [size]);

  useEffect(() => {
    setChecked(isActive);
  }, [isActive]);

  const handleClick = () => {
    if (disabled || !hoverable) {
      return;
    }

    if (multiselect) {
      setChecked(!checked);
    }

    if (type === "delete" || type === "reject" || type === "approve" || type === "pause") {
      onClick();
    } else {
      focused = false;
      onClick();
    }
  };

  const handleMouseEnter = () => {
    if (hoverable && !disabled) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isInteractive = !disabled && hoverable !== false;
  const eventProps = isInteractive
    ? {
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave
      }
    : {};

  // Filter out non-DOM props before spreading onto DOM element
  const nonDomProps = ["listWrapper", "iconLeftEnabled", "iconRightEnabled", "maskableIcon"];
  const domSafeRest = Object.fromEntries(
    Object.entries(rest).filter(([key]) => !nonDomProps.includes(key))
  );

  return (
    <div
      className={clsx("list_item_container", styles[size], className)}
      {...eventProps}
      {...domSafeRest}
      data-active={isActive}
      data-multiselect={multiselect || undefined}
      data-focused={isFocused || undefined}
      data-disabled={disabled}
      data-fit-content={fitContent || undefined}
      data-hoverable={hoverable === false ? false : undefined}
      data-hovered={isHovered}
      data-type={type !== "default" ? type : undefined}>
      {iconLeft && (
        <div className={styles.list_item_icon_container}>
          {React.isValidElement(iconLeft) ? (
            React.cloneElement(iconLeft, {
              width: iconLeft.props.width || iconSize,
              height: iconLeft.props.height || iconSize,
              color:
                disabled && !iconLeft.props.color
                  ? "var(--text-commentary-description)"
                  : iconLeft.props.color
            })
          ) : (
            <iconLeft.type
              {...iconLeft.props}
              width={iconLeft.props.width || iconSize}
              height={iconLeft.props.height || iconSize}
              color={
                disabled && !iconLeft.props.color
                  ? "var(--text-commentary-description)"
                  : iconLeft.props.color
              }
            />
          )}
        </div>
      )}
      <div className={styles.list_item_content_container}>
        <div className={styles.list_item_text_container}>
          <p className={clsx(styles.list_item_text, styles[size])}>{text}</p>
          {description !== "" && (
            <p className={clsx(styles.list_item_description, styles[size])}>{description}</p>
          )}
        </div>
      </div>
      {(iconRight ||
        caption ||
        multiselect ||
        type === "delete" ||
        type === "reject" ||
        type === "approve" ||
        type === "pause") && (
        <div className={styles.list_item_content_right_container}>
          {caption !== "" &&
            (typeof caption === "string" ? (
              <p className={clsx(styles.list_item_caption, styles[size])}>{caption}</p>
            ) : (
              <div className={clsx(styles.list_item_caption, styles[size])}>{caption}</div>
            ))}
          {iconRight && (
            <div className={styles.list_item_icon_container}>
              {React.isValidElement(iconRight) ? (
                React.cloneElement(iconRight, {
                  width: iconRight.props.width || iconSize,
                  height: iconRight.props.height || iconSize,
                  color:
                    disabled && !iconRight.props.color
                      ? "var(--text-commentary-description)"
                      : iconRight.props.color
                })
              ) : (
                <iconRight.type
                  {...iconRight.props}
                  width={iconRight.props.width || iconSize}
                  height={iconRight.props.height || iconSize}
                  color={
                    disabled && !iconRight.props.color
                      ? "var(--text-commentary-description)"
                      : iconRight.props.color
                  }
                />
              )}
            </div>
          )}
          {multiselect && (
            <CheckBox
              size={checkboxSize}
              checked={checked}
              indeterminate={indeterminate}
              disabled={disabled || !hoverable}
              onChange={handleClick}
              hovered={isHovered || isFocused}
            />
          )}
          {type === "delete" && (
            <div className={styles.list_item_delete_container}>
              <Icons.General.Trash03 strokeWidth={actionIconSize} />
            </div>
          )}
          {type === "reject" && (
            <div className={styles.list_item_reject_container}>
              <Icons.General.XClose strokeWidth={actionIconSize} />
            </div>
          )}
          {type === "approve" && (
            <div className={styles.list_item_approve_container}>
              <Icons.General.Check strokeWidth={actionIconSize} />
            </div>
          )}
          {type === "pause" && (
            <div className={styles.list_item_pause_container}>
              <Icons.Time.Hourglass02 strokeWidth={actionIconSize} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
