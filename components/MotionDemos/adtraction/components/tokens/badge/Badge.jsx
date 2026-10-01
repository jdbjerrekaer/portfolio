import React, { useEffect, useState } from "react";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import { getOverlayPortalTarget } from "../../misc/overlayPortal";
import styles from "./Badge.module.scss";

/**
 * Badge displays short status or category labels with optional icons and an optional "ghost" appearance.
 *
 * @param {("small"|"default"|"large")} [size="default"] - Size variant of the badge.
 * @param {string} [text="Badge"] - Badge label text.
 * @param {React.ReactElement|null} [iconLeft=null] - Icon to render on the left side of the text.
 * @param {React.ReactElement|null} [iconRight=null] - Icon to render on the right side of the text.
 * @param {string} [ghostColor=""] - CSS color value; when provided, ghost styling is enabled.
 * @param {function} [onClick] - Click handler; when provided with a non-empty function, the badge becomes interactive.
 * @param {string} [className=""] - Additional class names to append to the container.
 * @param {boolean} [hideCurrencyTooltip=false] - When true, suppress the currency explanation tooltip (currency badges only).
 * @returns {JSX.Element}
 */
export const Badge = ({
  size = "default",
  text = "Badge",
  iconLeft = null,
  iconRight = null,
  ghostColor = "",
  onClick,
  className = "",
  hideCurrencyTooltip = false
}) => {
  const [iconSize, setIconSize] = useState("var(--size-icon-small)");

  // Automatically detect if badge is interactive based on onClick
  const isInteractable =
    Boolean(onClick && typeof onClick === "function") && !onClick.toString().includes("() => {}");

  const CURRENCY_OPTIONS = [
    { code: "CHF", name: "CHF", flag: "CH" },
    { code: "DKK", name: "DKK", flag: "DK" },
    { code: "EUR", name: "EUR", flag: "EuropeanUnion" },
    { code: "GBP", name: "GBP", flag: "GB" },
    { code: "NOK", name: "NOK", flag: "NO" },
    { code: "PLN", name: "PLN", flag: "PL" },
    { code: "SEK", name: "SEK", flag: "SE" },
    { code: "USD", name: "USD", flag: "US" }
  ];

  const normalizedText = typeof text === "string" ? text.trim().toUpperCase() : "";
  const isCurrency = CURRENCY_OPTIONS.some((c) => c.code === normalizedText);
  const currencyTooltipEnabled = isCurrency && !hideCurrencyTooltip;

  // Generate aria-label dynamically based on component state
  const generateAriaLabel = () => {
    if (isCurrency) {
      return i18n.t("ui.toolkit.badge.currencyAria", { text });
    }

    if (isInteractable) {
      return i18n.t("ui.toolkit.badge.interactiveAria", { text });
    } else {
      return i18n.t("ui.toolkit.badge.statusAria", { text });
    }
  };

  useEffect(() => {
    if (size != "small") {
      setIconSize("var(--size-icon-small)");
    } else {
      setIconSize("var(--size-icon-x-small)");
    }
  }, [size]);

  const handleClick = (event) => {
    if (!isInteractable) return;
    onClick(event);
  };

  // Automatically enable ghost type when ghostColor is provided
  const isGhostType = ghostColor !== "";

  const badgeContent = (
    <div
      className={clsx(styles["AT-badge"], styles[size], className)}
      data-interactable={isInteractable}
      data-ghost-type={isGhostType}
      data-currency={isCurrency}
      data-currency-tooltip={currencyTooltipEnabled ? true : undefined}
      style={{
        "--ghost-color": ghostColor
      }}
      aria-label={generateAriaLabel()}
      onClick={handleClick}>
      {iconLeft != null && <iconLeft.type {...iconLeft.props} width={iconSize} height={iconSize} />}
      <p className={styles["badge-text"]}>{text}</p>
      {iconRight != null && (
        <iconRight.type {...iconRight.props} width={iconSize} height={iconSize} />
      )}
    </div>
  );

  if (currencyTooltipEnabled) {
    return (
      <Tippy
        content={i18n.t("ui.toolkit.badge.currencyTooltip")}
        appendTo={(ref) => getOverlayPortalTarget(ref) || document.body}>
        {badgeContent}
      </Tippy>
    );
  }

  return badgeContent;
};
