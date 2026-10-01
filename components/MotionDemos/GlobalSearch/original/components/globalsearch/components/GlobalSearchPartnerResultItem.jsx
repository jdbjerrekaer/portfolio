import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import { PartnerName } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { GlobalSearchApplicationStatusBadge } from "./GlobalSearchApplicationStatusBadge";
import styles from "./GlobalSearchPartnerResultItem.module.scss";

/**
 * Full-width partner row for brand global search (Partnerships-inspired).
 */
export const GlobalSearchPartnerResultItem = ({
  result = {},
  isSelected = false,
  onClick = () => {},
  onMouseEnter = () => {},
  onKeyDown = () => {},
  onContextMenu = () => {}
}) => {
  const partnerName = result.title || "";
  const markets = Array.isArray(result.marketIsoCodes)
    ? result.marketIsoCodes
    : [result.flag].filter(Boolean);
  const ariaLabel = i18n.t("platform.globalSearch.aria.selectItem", {
    title: partnerName || i18n.t("platform.globalSearch.fallback.partner")
  });

  return (
    <div
      className={styles.row}
      data-testid="global-search-partner-result"
      data-search-item="true"
      data-selected={isSelected}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}>
      <div className={styles.partner}>
        <span className={styles.iconWrap} aria-hidden="true">
          <Icons.User.Users01 width="var(--size-icon-small)" height="var(--size-icon-small)" strokeWidth={1.75} />
        </span>
        <PartnerName
          partnerName={partnerName}
          partnerId={result.id ?? null}
          activeMarkets={markets}
          preferredMarket={result.preferredMarketIsoCode || result.flag || null}
          previewMarkets={true}
          showManager={false}
          showProfileScore={false}
          size="small"
          isHoverable={false}
          containerWidth="100%"
        />
      </div>
      <div className={styles.details} />
      <div className={styles.status}>
        <GlobalSearchApplicationStatusBadge status={result.status} />
      </div>
      <div className={styles.chevron} aria-hidden="true">
        <Icons.Arrow.ChevronRight width="1rem" height="1rem" strokeWidth={1.75} />
      </div>
    </div>
  );
};

export default GlobalSearchPartnerResultItem;
