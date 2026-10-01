import { BrandName } from "../../accountTypeNames/brandName/BrandName";
import { ChannelName } from "../../accountTypeNames/channel/channelName/ChannelName";
import { PartnerName } from "../../accountTypeNames/partnerName/PartnerName";
import styles from "./TableCells.module.scss";
import clsx from "clsx";

export const AccountCell = (params) => {
  if (!params.value && params.value !== "") {
    return null;
  }
  const size = params.size || params.colDef.headerComponentParams?.size || "default";
  const alignmentClass =
    params.alignmentClass ||
    (params.colDef.type === "rightAligned" ? "rightAligned" : "leftAligned");

  // Priority 1: Object props (recommended approach)
  if (params.brand) {
    return (
      <div
        className={clsx(
          styles["custom-cell-container"],
          styles.accountname,
          styles[alignmentClass],
          styles[size]
        )}>
        <BrandName
          {...params.brand}
          containerWidth="100%"
          listWrapper={false}
          tooltipInteractive={false}
        />
      </div>
    );
  }

  if (params.channel) {
    return (
      <div
        className={clsx(
          styles["custom-cell-container"],
          styles.accountname,
          styles[alignmentClass],
          styles[size]
        )}>
        <ChannelName
          {...params.channel}
          channelId={
            params.channel.channelId ??
            params.channel.affiliateSiteId ??
            params.channelId ??
            params.affiliateSiteId ??
            null
          }
          listWrapper={false}
        />
      </div>
    );
  }

  if (params.partner) {
    return (
      <div
        className={clsx(
          styles["custom-cell-container"],
          styles.accountname,
          styles[alignmentClass],
          styles[size]
        )}
        onMouseEnter={() => {
          if (params.onPartnerHover && params.partnerId) {
            params.onPartnerHover(params.partnerId);
          }
        }}>
        <PartnerName
          {...params.partner}
          partnerId={params.partnerId ?? params.partner?.partnerId ?? null}
          containerWidth="100%"
          listWrapper={false}
          size={size}
        />
      </div>
    );
  }

  // Priority 2: Type-based with individual props (backward compatibility)
  if (params.type === "channel") {
    return (
      <div
        className={clsx(
          styles["custom-cell-container"],
          styles.accountname,
          styles[alignmentClass],
          styles[size]
        )}>
        <ChannelName
          channelName={params.channelName || params.value}
          channelUrl={params.channelUrl}
          channelType={params.channelType}
          channelId={params.channelId ?? params.affiliateSiteId ?? null}
          channelMarkets={params.channelMarkets}
          manager={params.manager}
          applicationStatus={params.applicationStatus}
          previewChannels={params.previewChannels}
          tooltipInteractive={params.tooltipInteractive}
          listWrapper={false}
        />
      </div>
    );
  }

  if (params.type === "partner") {
    return (
      <div
        className={clsx(
          styles["custom-cell-container"],
          styles.accountname,
          styles[alignmentClass],
          styles[size]
        )}
        onMouseEnter={() => {
          if (params.onPartnerHover && params.partnerId) {
            params.onPartnerHover(params.partnerId);
          }
        }}>
        <PartnerName
          partnerName={params.partnerName || params.value}
          partnerId={params.partnerId ?? null}
          activeMarkets={params.activeMarkets}
          manager={params.manager}
          profileScore={params.profileScore}
          redirectUrl={params.redirectUrl}
          showManager={params.showManager}
          showProfileScore={params.showProfileScore}
          showActiveMarketsWhenEmpty={params.showActiveMarketsWhenEmpty}
          isHoverable={params.isHoverable}
          containerWidth="100%"
          listWrapper={false}
          size={size}
        />
      </div>
    );
  }

  // Default: BrandName (backward compatible)
  return (
    <div
      className={clsx(
        styles["custom-cell-container"],
        styles.accountname,
        styles[alignmentClass],
        styles[size]
      )}>
      <BrandName
        brandName={params.brandName}
        brandCountry={params.brandCountry}
        brandId={params.brandId}
        category={params.category ?? null}
        serviceLevel={params.serviceLevel ?? null}
        containerWidth="100%"
        isLoadingDetails={params.isLoadingDetails}
        onBrandHover={params.onBrandHover}
        listWrapper={false}
        tooltipInteractive={false}
      />
    </div>
  );
};
