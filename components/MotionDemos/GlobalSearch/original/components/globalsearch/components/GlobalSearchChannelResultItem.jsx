import React, { useContext } from "react";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import { Badge, ChannelBadgeType, ChannelName, Tag } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import { CLIENT_PRIVILEGES } from "@adtraction/util-constants";
import { UserRoleContext } from "@adtraction/util-providers";
import { GlobalSearchApplicationStatusBadge } from "./GlobalSearchApplicationStatusBadge";
import styles from "./GlobalSearchChannelResultItem.module.scss";

/**
 * Full-width channel row for brand global search (Partnerships-inspired).
 */
export const GlobalSearchChannelResultItem = ({
  result = {},
  isSelected = false,
  onClick = () => {},
  onMouseEnter = () => {},
  onKeyDown = () => {},
  onContextMenu = () => {}
}) => {
  const { privileges = [] } = useContext(UserRoleContext) || {};
  // Read privilege — same gate as Partnerships `canViewCommission` / Price view.
  // Write privilege (`showCommissions`) is unused here: search has no segment-edit actions.
  const canViewSegment = privileges.includes(CLIENT_PRIVILEGES.SHOW_SEGMENT_INFO_AFFILIATES);
  const isApproved = result.status === "APPROVED";
  const showSegment =
    canViewSegment && isApproved && (Boolean(result.hasSegment) || Boolean(result.segmentName));
  const segmentName =
    result.segmentName || i18n.t("platform.globalSearch.segment.fallback");
  // Separate badges — segment names often include numbers (e.g. "Influencer 5 %").
  const commissionText = result.segmentCommission || "";
  const showCommission = showSegment && Boolean(commissionText);

  const channelName = result.title || "";
  const partnerName = result.affiliateName || result.subtitle || "";
  const markets = Array.isArray(result.marketIsoCodes)
    ? result.marketIsoCodes
    : [result.flag].filter(Boolean);
  const ariaLabel = i18n.t("platform.globalSearch.aria.selectItem", {
    title: channelName || i18n.t("platform.globalSearch.fallback.channel")
  });

  return (
    <div
      className={styles.row}
      data-testid="global-search-channel-result"
      data-search-item="true"
      data-selected={isSelected}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}>
      <div className={styles.channel}>
        <ChannelName
          channelName={channelName}
          partnerName={partnerName}
          channelId={result.affiliateSiteId || result.id}
          channelMarkets={markets}
          channelType={result.channelType || ""}
          preferredMarket={result.preferredMarketIsoCode || result.flag || ""}
          previewChannels={true}
          showStatusIcon={false}
          size="small"
        />
      </div>
      <div className={styles.details}>
        {result.channelType ? (
          <ChannelBadgeType channelType={result.channelType} size="small" showIcon={false} />
        ) : null}
        {showSegment ? (
          <Tippy
            content={i18n.t("platform.globalSearch.segment.tooltip")}
            placement="top"
            delay={[150, 0]}
            animation="fade"
            arrow={false}>
            <span className={styles.segmentBadgeWrap} data-testid="global-search-segment-badge">
              <Badge
                size="small"
                text={segmentName}
                iconLeft={
                  <Icons.Layout.LayersThree01
                    color="var(--badge-text)"
                    strokeWidth={1.75}
                  />
                }
                className={styles.segmentBadge}
              />
            </span>
          </Tippy>
        ) : null}
        {showCommission ? (
          <Tippy
            content={i18n.t("platform.globalSearch.commission.tooltip")}
            placement="top"
            delay={[150, 0]}
            animation="fade"
            arrow={false}>
            <span className={styles.commissionTag} data-testid="global-search-commission-tag">
              <Tag text={commissionText} size="large" iconLeft={<Icons.Finance.BankNote01 />} />
            </span>
          </Tippy>
        ) : null}
      </div>
      <div className={styles.status}>
        <GlobalSearchApplicationStatusBadge status={result.status} />
      </div>
      <div className={styles.chevron} aria-hidden="true">
        <Icons.Arrow.ChevronRight width="1rem" height="1rem" strokeWidth={1.75} />
      </div>
    </div>
  );
};

export default GlobalSearchChannelResultItem;
