import React, { forwardRef } from "react";
import { InputBase } from "../InputBase";
import { Icons } from "@adtraction/ui-icons";
import clsx from "clsx";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./InputSearch.module.scss";

/**
 * InputSearch is a specialized input for search functionality.
 * It includes a search icon, clear button, and optional loading state.
 *
 * @param {string} [value=""] - Input value.
 * @param {("small"|"default")} [size="default"] - Size variant.
 * @param {("default"|"valid"|"invalid"|"disabled")} [state="default"] - Visual state.
 * @param {string} [placeholder="Search..."] - Placeholder text.
 * @param {boolean} [isLoading=false] - Show shimmer loading overlay (input remains functional).
 * @param {boolean} [showClearButton=true] - Show clear button when value is not empty.
 * @param {function} [onClear] - Callback when clear button is clicked.
 * @param {function} [onSearch] - Callback when Enter is pressed.
 * @param {function} [onChange=() => {}] - Change handler.
 * @param {function} [onBlur=() => {}] - Blur handler.
 * @param {function} [onClick=() => {}] - Click handler.
 * @param {React.ReactNode} [contentRight=null] - Additional content to render on the right side (will be combined with clear button).
 * @returns {JSX.Element}
 */
export const InputSearch = forwardRef(
  (
    {
      value = "",
      size = "default",
      state = "default",
      placeholder = null,
      isLoading = false,
      showClearButton = true,
      onClear,
      onSearch,
      onChange = () => {},
      contentRight: additionalContentRight = null,
      className,
      ...props
    },
    ref
  ) => {
    const effectivePlaceholder = placeholder || i18n.t("ui.toolkit.inputSearch.placeholder");
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && onSearch) {
        e.preventDefault();
        onSearch(value);
      }
    };

    const handleClear = (e) => {
      e.stopPropagation();
      if (state === "disabled") return;

      onChange({ target: { value: "" } });

      if (onClear) {
        onClear();
      }
    };

    const searchIcon = (
      <Icons.General.SearchMd
        width="var(--size-icon-small)"
        height="var(--size-icon-small)"
        color={state === "disabled" ? "var(--grayscale-400)" : "var(--text-label-default)"}
        strokeWidth="2.73"
      />
    );

    const clearButton =
      showClearButton && value !== "" && state !== "disabled" ? (
        <button
          type="button"
          className={clsx(styles.clear_button, size === "small" && styles.small, styles.animate_in)}
          onClick={handleClear}
          tabIndex={-1}
          aria-label={i18n.t("ui.toolkit.inputSearch.clear")}>
          <Icons.General.XClose
            width="var(--size-icon-small)"
            height="var(--size-icon-small)"
            color="currentColor"
            strokeWidth="2.73"
          />
        </button>
      ) : null;

    // Combine additional right content with clear button
    const combinedContentRight = (
      <>
        {additionalContentRight}
        {clearButton}
      </>
    );

    const shimmerOverlay = isLoading ? (
      <div className={styles.shimmer_overlay} aria-hidden="true" />
    ) : null;

    return (
      <InputBase
        ref={ref}
        value={value}
        size={size}
        state={state}
        placeholder={effectivePlaceholder}
        iconLeft={<span className={styles.search_icon}>{searchIcon}</span>}
        contentRight={combinedContentRight}
        inputContainerOverlay={shimmerOverlay}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={clsx(isLoading && styles.loading, className)}
        {...props}
      />
    );
  }
);

InputSearch.displayName = "InputSearch";
