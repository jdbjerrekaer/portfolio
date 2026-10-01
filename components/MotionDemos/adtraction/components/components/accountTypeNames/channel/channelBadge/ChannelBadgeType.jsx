import React, { useMemo } from "react";
import clsx from "clsx";
import { Badge } from "../../../../tokens/badge/Badge";
import styles from "./ChannelBadgeType.module.scss";
import {
  CHANNEL_CATEGORY_MAP,
  CHANNEL_PRIMARY_TYPES,
  mapTagToChannelType
} from "../channelConstants";

const SIZE_MAPPINGS = {
  small: { badgeSize: "small", strokeWidth: "1.73" },
  medium: { badgeSize: "default", strokeWidth: "1.73" },
  large: { badgeSize: "large", strokeWidth: "2.73" },
  default: { badgeSize: "default", strokeWidth: "2" }
};

export const ChannelBadgeType = ({
  channelType = "other",
  type,
  hasAlert = false,
  size = "default",
  showIcon = true,
  className = "",
  onClick
}) => {
  const config = CHANNEL_CATEGORY_MAP[mapTagToChannelType(channelType)];

  if (!config || !CHANNEL_PRIMARY_TYPES.includes(config.type)) {
    console.warn(`Channel type "${channelType}" is not supported`);
    return null;
  }

  const sizeConfig = SIZE_MAPPINGS[size] || SIZE_MAPPINGS.default;
  const channelTypeClass = type || config.type;

  const iconLeft = useMemo(
    () =>
      showIcon
        ? {
            type: config.icon,
            props: {
              color: "var(--text-body-alt)",
              strokeWidth: sizeConfig.strokeWidth
            }
          }
        : undefined,
    [showIcon, config.icon, sizeConfig.strokeWidth]
  );

  return (
    <div className={clsx(styles["channel-badge-wrapper"], hasAlert && styles["has-alert"])}>
      {hasAlert && (
        <div className={styles["alert-icon"]}>
          <config.icon
            width="var(--size-icon-x-small)"
            height="var(--size-icon-x-small)"
            color="var(--grayscale-0)"
          />
        </div>
      )}
      <Badge
        size={sizeConfig.badgeSize}
        text={config.label}
        iconLeft={iconLeft}
        onClick={
          onClick
            ? (event) => {
                // Nested in clickable rows/cards — don't trigger the parent select.
                event?.stopPropagation?.();
                onClick(event);
              }
            : undefined
        }
        className={clsx(
          styles["channel-badge-type"],
          styles[`channel-badge-type--${channelTypeClass}`],
          className
        )}
      />
    </div>
  );
};
