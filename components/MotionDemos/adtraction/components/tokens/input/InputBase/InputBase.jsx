import React, { useRef, useEffect, forwardRef } from "react";
import { Tag } from "../../tag/Tag";
import { Icons } from "@adtraction/ui-icons";
import clsx from "clsx";
import styles from "./InputBase.module.scss";

/**
 * InputBase is the core input component that provides shared functionality
 * for all input variants. It handles labels, descriptions, icons, tags,
 * states, and the input container structure.
 *
 * This component should not be used directly - use Input, InputPassword,
 * InputNumber, InputTextarea, InputSearch, or InputCombo instead.
 *
 * @param {string} [value=""] - Input value.
 * @param {("small"|"default")} [size="default"] - Size variant.
 * @param {("default"|"valid"|"invalid"|"disabled")} [state="default"] - Visual state.
 * @param {string} [label=""] - Field label.
 * @param {React.ReactElement|null} [labelIcon=null] - Icon next to label.
 * @param {string} [description=""] - Helper text below input.
 * @param {React.ReactElement|null} [descriptionIcon=null] - Icon for description.
 * @param {React.ReactElement|null} [iconLeft=null] - Leading icon.
 * @param {React.ReactElement|null} [iconRight=null] - Trailing icon.
 * @param {boolean} [iconRightDividerEnabled=false] - Show a divider before right icon.
 * @param {string} [caption=""] - Right side caption content.
 * @param {React.ReactElement} [leftTag=<Tag />] - Tag element shown on the left.
 * @param {boolean} [leftTagEnabled=false] - Whether to render the left tag.
 * @param {string} [placeholder=""] - Placeholder text.
 * @param {boolean} [required=false] - Shows required asterisk on the label.
 * @param {boolean} [forceFocusBorder=false] - Forces focus border styling.
 * @param {boolean} [rightTagsEnabled=false] - Render tags on the right.
 * @param {React.ReactElement[]} [rightTags=[]] - Tags to show on the right.
 * @param {("default"|"valid"|"invalid")} [descriptionState="default"] - State for description.
 * @param {number} [maxLength] - Maximum character length. Shows a counter in the label row.
 * @param {boolean} [readOnly=false] - Read-only mode.
 * @param {boolean} [autoFocus=false] - Autofocus on mount if enabled and allowed.
 * @param {string} [type="text"] - Native input type attribute.
 * @param {string} [as="input"] - The component type to render (input or textarea).
 * @param {React.ReactNode} [contentRight=null] - Custom content to render on the right side.
 * @param {React.ReactNode} [contentLeft=null] - Custom content to render on the left side (before input padding).
 * @param {React.ReactNode} [contentRightOuter=null] - Custom content to render after the input container.
 * @param {React.ReactNode} [inputContainerOverlay=null] - Overlay content rendered inside input container (e.g., loading shimmer).
 * @param {Object} [inputProps={}] - Additional props to pass to the native input element.
 * @param {function} [onChange=() => {}] - Change handler.
 * @param {function} [onBlur=() => {}] - Blur handler.
 * @param {function} [onClick=() => {}] - Click handler.
 * @param {function} [onKeyDown] - KeyDown handler.
 * @returns {JSX.Element}
 */
export const InputBase = forwardRef(
  (
    {
      value = "",
      size = "default",
      state = "default",
      label = "",
      labelIcon = null,
      description = "",
      descriptionIcon = null,
      iconLeft = null,
      iconRight = null,
      iconRightDividerEnabled = false,
      caption = "",
      leftTag = <Tag />,
      leftTagEnabled = false,
      placeholder = "",
      required = false,
      forceFocusBorder = false,
      rightTagsEnabled = false,
      rightTags = [],
      descriptionState = "default",
      maxLength,
      readOnly = false,
      autoFocus = false,
      type = "text",
      as: Component = "input",
      contentRight = null,
      contentLeft = null,
      contentRightOuter = null,
      inputContainerOverlay = null,
      inputProps = {},
      onChange = () => {},
      onBlur = () => {},
      onClick = () => {},
      onKeyDown,
      className,
      ...rest
    },
    ref
  ) => {
    const internalInputRef = useRef(null);
    const inputRef = ref || internalInputRef;

    const focusInput = () => {
      if (state === "disabled") {
        return;
      }

      if (!readOnly) {
        inputRef.current?.focus();
      }

      onClick();
    };

    const handleKeyDown = (e) => {
      if (onKeyDown) {
        onKeyDown(e);
        return;
      }
      // Only handle Enter key for regular inputs (not textarea)
      if (e.key === "Enter" && Component !== "textarea") {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.blur();
        }
        const focusableElements = document.querySelectorAll(
          'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        const currentIndex = Array.from(focusableElements).indexOf(inputRef.current);
        const nextElement = focusableElements[currentIndex + 1];
        if (nextElement) {
          nextElement.focus();
        }
      }
    };

    useEffect(() => {
      if (autoFocus && inputRef.current && state !== "disabled" && !readOnly) {
        inputRef.current.focus();
      }
    }, [autoFocus, state, readOnly]);

    const hasContentRight =
      caption !== "" || iconRight || state === "invalid" || rightTagsEnabled || contentRight;
    const isDisabled = state === "disabled";
    const disabledDisplayValue = value || placeholder;

    return (
      <div className={clsx(styles.input_container_wrapper, styles[size], className)}>
        {(label !== "" || maxLength !== undefined) && (
          <div className={styles.input_label_wrapper}>
            {label !== "" && labelIcon && (
              <labelIcon.type
                {...labelIcon.props}
                width="var(--size-icon-small)"
                height="var(--size-icon-small)"
                color={state === "disabled" ? "var(--grayscale-400)" : labelIcon.props.color}
                strokeWidth="2.73"
              />
            )}
            <div className={styles.label_container}>
              {label !== "" && <p className={styles.label_text}>{label}</p>}
              {label !== "" && required && <span className={styles.required_asterisk}>*</span>}
              {maxLength !== undefined && (
                <span className={styles.char_counter}>
                  {value?.length ?? 0}/{maxLength}
                </span>
              )}
            </div>
          </div>
        )}
        <div
          className={clsx(styles.input_container)}
          onClick={focusInput}
          data-state={state}
          data-force-focus-border={forceFocusBorder}
          data-read-only={readOnly}
          data-has-content-left={!!contentLeft}
          data-has-content-right-outer={!!contentRightOuter}
          data-is-textarea={Component === "textarea"}>
          {contentLeft}
          <div className={styles.input_padding}>
            {leftTagEnabled && leftTag.props.text && (
              <div className={styles.tag_wrapper}>{leftTag}</div>
            )}
            {iconLeft && (
              <div className={styles.icon_container}>
                <iconLeft.type
                  {...iconLeft.props}
                  width="var(--size-icon-small)"
                  height="var(--size-icon-small)"
                  color={state === "disabled" ? "var(--grayscale-400)" : iconLeft.props.color}
                  strokeWidth="2.73"
                />
              </div>
            )}
            {isDisabled ? (
              <>
                <Component
                  value={value}
                  type={Component === "input" ? type : undefined}
                  className={styles.input_field}
                  placeholder={placeholder}
                  disabled
                  ref={inputRef}
                  tabIndex={-1}
                  data-clarity-unmask="true"
                  {...inputProps}
                  {...rest}
                  style={{ display: "none" }}
                />
                <span className={styles.input_field} data-disabled-text="true">
                  {disabledDisplayValue}
                </span>
              </>
            ) : (
              <Component
                value={value}
                type={Component === "input" ? type : undefined}
                className={styles.input_field}
                placeholder={placeholder}
                disabled={isDisabled}
                ref={inputRef}
                readOnly={readOnly}
                onChange={onChange}
                onBlur={onBlur}
                onClick={onClick}
                tabIndex={readOnly ? -1 : 0}
                onKeyDown={handleKeyDown}
                data-clarity-unmask="true"
                maxLength={maxLength}
                {...inputProps}
                {...rest}
              />
            )}
            {hasContentRight && (
              <div className={styles.content_right}>
                {caption !== "" && <div className={styles.caption}>{caption}</div>}
                {iconRight && iconRightDividerEnabled && (
                  <div className={styles.icon_right_divider} />
                )}
                {state === "invalid" && (
                  <div className={styles.icon_container}>
                    <Icons.Alert.Circle
                      width="var(--size-icon-small)"
                      height="var(--size-icon-small)"
                      color="var(--ui-colors-red-600)"
                      strokeWidth="2.73"
                    />
                  </div>
                )}
                {rightTagsEnabled && rightTags.length > 0 && (
                  <div className={styles.tag_container}>
                    {rightTags.map((item, index) => (
                      <div key={index} className={styles.tag_wrapper}>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {iconRight && (
                  <iconRight.type
                    {...iconRight.props}
                    width="var(--size-icon-small)"
                    height="var(--size-icon-small)"
                    color={state === "disabled" ? "var(--grayscale-400)" : iconRight.props.color}
                    strokeWidth="2.73"
                  />
                )}
                {contentRight}
              </div>
            )}
          </div>
          {contentRightOuter}
          {inputContainerOverlay}
        </div>
        {description !== "" && (
          <div className={styles.description_container}>
            {descriptionIcon && (
              <div className={styles.icon_container}>
                <descriptionIcon.type
                  {...descriptionIcon.props}
                  width="var(--size-icon-small)"
                  height="var(--size-icon-small)"
                  color={
                    state === "disabled" ? "var(--grayscale-400)" : descriptionIcon.props.color
                  }
                  strokeWidth="2.73"
                />
              </div>
            )}
            {descriptionState === "valid" && (
              <div className={styles.icon_container}>
                <Icons.General.CheckCircleFilled
                  width="var(--size-icon-small)"
                  height="var(--size-icon-small)"
                  color="var(--component-color-input-valid)"
                />
              </div>
            )}
            {descriptionState === "invalid" && (
              <div className={styles.icon_container}>
                <Icons.Alert.TriangleFilled
                  width="var(--size-icon-small)"
                  height="var(--size-icon-small)"
                  strokeWidth="2.73"
                />
              </div>
            )}
            <p
              className={clsx(
                styles.description_text,
                descriptionState === "valid" && styles.valid,
                descriptionState === "invalid" && styles.invalid
              )}>
              {description}
            </p>
          </div>
        )}
      </div>
    );
  }
);

InputBase.displayName = "InputBase";
