import React from "react";
import clsx from "clsx";
import { Badge } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import {
  getApplicationStatusLabel,
  getApplicationStatusTone
} from "./globalSearchApplicationStatus";
import styles from "./GlobalSearchApplicationStatusBadge.module.scss";

const TONE_ICON = {
  approved: Icons.Custom.NotificationDot,
  pending: Icons.Custom.HourGlass02Filled,
  rejected: Icons.General.XClose,
  invited: Icons.Communication.Send01
};

/**
 * Colored application-status Badge matching brands ApplicationStatus tokens.
 */
export const GlobalSearchApplicationStatusBadge = ({ status }) => {
  const label = getApplicationStatusLabel(status);
  const tone = getApplicationStatusTone(status);
  if (!label || !tone) return null;

  const Icon = TONE_ICON[tone];

  return (
    <Badge
      size="small"
      text={label}
      iconLeft={Icon ? <Icon strokeWidth={tone === "pending" ? "0.3" : undefined} /> : null}
      className={clsx(styles.statusBadge, styles[`tone_${tone}`])}
    />
  );
};

export default GlobalSearchApplicationStatusBadge;
