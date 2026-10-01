import React from "react";
import clsx from "clsx";
import { Badge } from "@adtraction/ui-components";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./PromoCodeStatusPill.module.scss";

/**
 * Soft status pill used across My Brand (promo codes, channel access, etc.).
 *
 * Variants:
 * - "Active": currently on (green)
 * - "Inactive": currently off (muted gray)
 * - "Expired": past its end date (red)
 * - "Scheduled": future start (yellow). Prefer `label` / `scheduledLabel` for copy.
 *
 * @param {("Active"|"Inactive"|"Expired"|"Scheduled")} [type="Scheduled"]
 * @param {string} [label] - Optional text override for any type.
 * @param {string} [scheduledLabel] - Legacy alias for Scheduled label (still supported).
 * @param {string} [className=""]
 * @returns {JSX.Element}
 */
export const PromoCodeStatusPill = ({
  type = "Scheduled",
  label,
  scheduledLabel,
  className = ""
}) => {
  let text;
  let variantClass;
  switch (type) {
    case "Active":
      text = label || i18n.t("brands.myBrand.promoCodes.statusActive");
      variantClass = styles.active;
      break;
    case "Inactive":
      // Callers supply copy via `label` (e.g. channel access "Not active").
      text = label || i18n.t("brands.myBrand.promoCodes.statusInactive");
      variantClass = styles.inactive;
      break;
    case "Expired":
      text = label || i18n.t("brands.myBrand.promoCodes.statusExpired");
      variantClass = styles.expired;
      break;
    case "Scheduled":
    default:
      text =
        label || scheduledLabel || i18n.t("brands.myBrand.promoCodes.statusScheduled");
      variantClass = styles.scheduled;
      break;
  }

  return (
    <Badge
      size="small"
      text={text}
      className={clsx(styles.pill, variantClass, className)}
    />
  );
};

export default PromoCodeStatusPill;
