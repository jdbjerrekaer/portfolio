import React, { useMemo } from "react";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import styles from "./ChannelTypeIconBadge.module.scss";
import {
  CHANNEL_PRIMARY_TYPES,
  CHANNEL_TYPE_ICON_MAP,
  CHANNEL_CATEGORY_MAP
} from "../channelConstants";

const SIZE_DIMENSIONS = {
  small: {
    dimension: "var(--size-icon-x-small)",
    strokeWidth: "1.73"
  },
  medium: {
    dimension: "var(--size-icon-small)",
    strokeWidth: "1.73"
  },
  large: {
    dimension: "var(--size-icon-medium)",
    strokeWidth: "1.73"
  }
};

export const ChannelTypeIconBadge = ({
  channelType,
  size = "medium",
  className = "",
  channelCategory = "other"
}) => {
  const IconComponent = CHANNEL_TYPE_ICON_MAP[channelType];
  const label = CHANNEL_CATEGORY_MAP[channelCategory]?.label;
  const { dimension, strokeWidth } = useMemo(() => {
    return SIZE_DIMENSIONS[size] || SIZE_DIMENSIONS.medium;
  }, [size]);

  if (!IconComponent || !CHANNEL_PRIMARY_TYPES.includes(channelType)) {
    console.warn(`Channel type "${channelType}" is not supported`);
    return null;
  }

  return (
    <Tippy content={label} delay={[300, 0]}>
      <div
        className={clsx(
          styles["channel-type-icon-badge"],
          styles[size],
          styles[`channel-type-icon-badge--${channelType}`],
          className
        )}>
        <IconComponent
          width={dimension}
          height={dimension}
          color="var(--text-body-alt)"
          strokeWidth={strokeWidth}
        />
      </div>
    </Tippy>
  );
};
