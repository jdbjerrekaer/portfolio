import "../../../../i18n/initialize";
import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import clsx from "clsx";
import styles from "./ProgramStatusBadge.module.scss";
import { Badge } from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";

/**
 * ProgramStatusBadge
 * A status badge for program/brand status in staff search results.
 * Accepts a single prop `stype` controlling icon, text and colors.
 * Values: draft | live-hidden | paused | archived | closed | closing
 */
export const ProgramStatusBadge = ({
  stype = "draft",
  size = "small",
  className = "",
  ...rest
}) => {
  const map = {
    draft: { text: i18n.t("platform.staffSearch.programStatus.draft") },
    live: { text: i18n.t("platform.staffSearch.programStatus.live") },
    "live-hidden": { text: i18n.t("platform.staffSearch.programStatus.liveHidden") },
    paused: { text: i18n.t("platform.staffSearch.programStatus.paused") },
    archived: { text: i18n.t("platform.staffSearch.programStatus.archived") },
    closed: { text: i18n.t("platform.staffSearch.programStatus.closed") },
    closing: { text: i18n.t("platform.staffSearch.programStatus.closing") }
  };

  const current = map[stype] || map["draft"];

  // Use native icon colors by default with maskableIcon=false.
  // For states where we want to tint via CSS (e.g., live), enable maskableIcon and pass color.
  const iconMap = {
    draft: {
      comp: Icons.Custom.Tool02Filled,
      iconProps: { maskableIcon: false }
    },
    live: {
      comp: Icons.Custom.NotificationDot,
      iconProps: { maskableIcon: true, color: "var(--ui-colors-green-600)" }
    },
    "live-hidden": {
      comp: Icons.General.EyeOff,
      iconProps: { maskableIcon: false, color: "var(--ui-colors-green-600)", strokeWidth: 2.3 }
    },
    paused: {
      comp: Icons.Custom.ClockSnoozeFill,
      iconProps: { maskableIcon: false }
    },
    archived: {
      comp: Icons.Custom.BoxFilled,
      iconProps: { maskableIcon: false }
    },
    closed: {
      comp: Icons.Custom.XSquareFilled,
      iconProps: { maskableIcon: false }
    },
    closing: {
      comp: Icons.Custom.MinusSquareAngleFilled,
      iconProps: { maskableIcon: false }
    }
  };

  const selected = iconMap[stype] || iconMap["draft"];
  const iconLeft = selected.comp ? (
    <selected.comp {...(selected.iconProps || {})} />
  ) : (
    <span className={styles.icon} data-variant={stype} aria-hidden="true" />
  );

  return (
    <Badge
      size={size}
      text={current.text}
      iconLeft={iconLeft}
      className={clsx(styles.account_status_badge, className)}
      {...rest}
    />
  );
};

export default ProgramStatusBadge;
