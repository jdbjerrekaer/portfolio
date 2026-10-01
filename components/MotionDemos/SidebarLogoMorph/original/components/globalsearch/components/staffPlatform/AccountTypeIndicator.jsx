import "../../../../i18n/initialize";
import React from "react";
import { i18n } from "@adtraction/shared-i18n";
import clsx from "clsx";
import styles from "./AccountTypeIndicator.module.scss";

/**
 * AccountTypeIndicator
 * A lightweight outline badge to label resource types (Program, Channel, Partner, Agency, Invoice, Product)
 * for staff search results.
 * - Uses CSS variables for colors and sizing
 * - Variants map to platform color tokens
 */
export const AccountTypeIndicator = ({
  text = "",
  variant = "program", // program | channel | partner | agency | invoice | product
  size = "default", // default | small
  className = "",
  "data-state": dataState = "Default",
  ...rest
}) => {
  const displayText = text || i18n.t("platform.staffSearch.badgeDefault");

  return (
    <div
      className={clsx(styles.account_type_indicator, className)}
      data-size={size}
      data-variant={variant}
      data-state={dataState}
      {...rest}>
      <span className={styles.account_type_indicator_text}>{displayText}</span>
    </div>
  );
};

export default AccountTypeIndicator;
