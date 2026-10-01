import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import { Icons } from "@adtraction/ui-icons";
import { getGlobalSearchPageIcon } from "../getGlobalSearchPageIcon";
import styles from "./GlobalSearchPageResultItem.module.scss";

const ICON_SIZE = "1.125rem";

/**
 * Full-width page/subpage row for global search (Partnerships-style row + search selection).
 */
export const GlobalSearchPageResultItem = ({
  result = {},
  isSelected = false,
  onClick = () => {},
  onMouseEnter = () => {},
  onKeyDown = () => {}
}) => {
  const Icon = getGlobalSearchPageIcon(result.route);
  const title = result.title || "";
  const parentTitle = result.parentTitle || "";
  const ariaLabel = i18n.t("platform.globalSearch.aria.selectItem", {
    title: title || i18n.t("platform.globalSearch.fallback.page")
  });

  return (
    <div
      className={styles.row}
      data-testid="global-search-page-result"
      data-search-item="true"
      data-selected={isSelected}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}>
      <div className={styles.iconWrap} aria-hidden="true">
        <Icon width={ICON_SIZE} height={ICON_SIZE} strokeWidth={1.75} />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {parentTitle ? <p className={styles.meta}>{parentTitle}</p> : null}
      </div>
      <div className={styles.chevron} aria-hidden="true">
        <Icons.Arrow.ChevronRight width="1rem" height="1rem" strokeWidth={1.75} />
      </div>
    </div>
  );
};

export default GlobalSearchPageResultItem;
