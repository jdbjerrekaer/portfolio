import React, { forwardRef } from "react";
import { InputBase } from "./InputBase";

/**
 * Input is a text input component for single-line text entry.
 * For other input types, use the specialized components:
 * - InputPassword for password fields
 * - InputNumber for numeric inputs
 * - InputTextarea for multi-line text
 * - InputSearch for search fields
 * - InputCombo for inputs with combo sections
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
 * @param {React.ReactElement} [leftTag] - Tag element shown on the left.
 * @param {boolean} [leftTagEnabled=false] - Whether to render the left tag.
 * @param {string} [placeholder=""] - Placeholder text.
 * @param {string} [text=""] - Placeholder text (deprecated, use placeholder instead).
 * @param {boolean} [required=false] - Shows required asterisk on the label.
 * @param {boolean} [forceFocusBorder=false] - Forces focus border styling.
 * @param {boolean} [rightTagsEnabled=false] - Render tags on the right.
 * @param {React.ReactElement[]} [rightTags=[]] - Tags to show on the right.
 * @param {("default"|"valid"|"invalid")} [descriptionState="default"] - State for description.
 * @param {boolean} [readOnly=false] - Read-only mode.
 * @param {boolean} [autoFocus=false] - Autofocus on mount if enabled and allowed.
 * @param {function} [onChange=() => {}] - Change handler.
 * @param {function} [onBlur=() => {}] - Blur handler.
 * @param {function} [onClick=() => {}] - Click handler.
 * @returns {JSX.Element}
 */
export const Input = forwardRef(
  (
    {
      text,
      placeholder,
      ...props
    },
    ref
  ) => {
    const placeholderValue = placeholder ?? text ?? "";

    return <InputBase ref={ref} type="text" placeholder={placeholderValue} {...props} />;
  }
);

Input.displayName = "Input";
