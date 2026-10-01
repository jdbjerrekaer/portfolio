import "../../../i18n/initialize";
import { Input, Tag } from "@adtraction/ui-components";
import { i18n } from "@adtraction/shared-i18n";
import { Icons } from "@adtraction/ui-icons";
import React from "react";
import styles from "./GlobalSearchBar.module.scss";

export function GlobalSearchBar({
  onClick,
  noFocus = false,
  disabled = false,
  showFocused = false,
  compact = false
}) {
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  return (
    <div
      className={`${styles.global_search_bar}${compact ? ` ${styles.compact}` : ""}${
        disabled ? ` ${styles.disabled}` : ""
      }`}
      onClick={handleClick}>
      <Input
        value=""
        text={i18n.t("platform.globalSearch.barPlaceholder")}
        disabled={disabled}
        readOnly={noFocus || disabled}
        forceFocusBorder={!disabled && showFocused}
        iconLeft={
          <Icons.General.SearchMd
            strokeWidth={2.73}
            width="var(--size-icon-medium)"
            height="var(--size-icon-medium)"
          />
        }
        iconRight={
          <div className={styles.global_search_bar_icon_right}>
            {navigator.userAgent.includes("Mac") ? (
              <Tag text="⌘" size="small" />
            ) : (
              <Tag text={i18n.t("platform.globalSearch.keyCtrl")} size="small" />
            )}
            <Tag text="K" size="small" />
          </div>
        }
      />
    </div>
  );
}
