import React from "react";
import clsx from "clsx";
import { Icons } from "@adtraction/ui-icons";
import styles from "./ChannelStatusIcon.module.scss";
import { AFFILIATESITE_ADVERTPROGRAM_STATUS } from "@adtraction/util-constants";

/**
 * @component
 * @param {Object} props - Component props
 * @param {number|null} props.applicationStatus - Application status (1=Approved, 2=Pending, 0=Rejected). Returns null for other values.
 */
export const ChannelStatusIcon = ({ applicationStatus = null }) => {
  // Only show status badge for Approved (1), Pending (2), or Rejected (0)
  const hasStatusToShow =
    applicationStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.APPROVED ||
    applicationStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.PENDING ||
    applicationStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.REJECTED;

  if (!hasStatusToShow) {
    return null;
  }

  let StatusIcon;
  let statusClass;

  if (applicationStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.APPROVED) {
    // Approved
    StatusIcon = Icons.General.Check;
    statusClass = styles.channelstatusicon_approved;
  } else if (applicationStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.PENDING) {
    // Pending
    StatusIcon = Icons.Time.Hourglass02;
    statusClass = styles.channelstatusicon_pending;
  } else if (applicationStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.REJECTED) {
    // Rejected
    StatusIcon = Icons.General.XClose;
    statusClass = styles.channelstatusicon_rejected;
  } else {
    return null;
  }

  return (
    <span className={clsx(styles.channelstatusicon_badge, statusClass)} aria-hidden="true">
      <StatusIcon
        width="var(--size-icon-small)"
        height="var(--size-icon-small)"
        color="var(--grayscale-0)"
        strokeWidth={2.3}
      />
    </span>
  );
};
