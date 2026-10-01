import React from "react";
import styles from "./AdtractionLogo.module.scss";
import { Icons } from "@adtraction/ui-icons";
import { TextLogo } from "./svg/TextLogo";
import { Tagline } from "./svg/Tagline";
import { i18n } from "@adtraction/shared-i18n";
import Tippy from "@tippyjs/react";

const getEnvironmentVariant = () => {
  if (typeof window === "undefined") {
    return "default";
  }

  const hostname = window.location.hostname.toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "localhost";
  } else if (hostname.includes("staging")) {
    return "staging";
  }

  return "default";
};

export const AdtractionLogo = ({
  variant,
  size = "medium",
  withTagline = false,
  showText = true,
  className,
  onClick,
  takeoverUser = null
}) => {
  const effectiveVariant = variant || getEnvironmentVariant();
  const validSize = ["small", "medium", "large"].includes(size) ? size : "medium";

  const getTooltipMessage = () => {
    if (effectiveVariant === "staging") {
      return i18n.t("ui.toolkit.adtractionLogo.stagingTooltip");
    } else if (effectiveVariant === "localhost") {
      return i18n.t("ui.toolkit.adtractionLogo.localhostTooltip");
    }
    return null;
  };

  const getTakeoverTagline = () => {
    if (takeoverUser === "AffiliateUser") {
      return i18n.t("ui.toolkit.adtractionLogo.takeoverActive");
    } else if (takeoverUser === "ClientUser") {
      return i18n.t("ui.toolkit.adtractionLogo.takeoverActive");
    }
    return null;
  };

  const getTakeoverTooltipMessage = () => {
    if (takeoverUser === "AffiliateUser") {
      return i18n.t("ui.toolkit.adtractionLogo.partnerTakeoverTooltip");
    } else if (takeoverUser === "ClientUser") {
      return i18n.t("ui.toolkit.adtractionLogo.brandTakeoverTooltip");
    }
    return null;
  };

  const getTakeoverIcon = () => {
    if (takeoverUser === "AffiliateUser") {
      return <Icons.User.Users01 className={styles.takeover_icon} strokeWidth={2} />;
    } else if (takeoverUser === "ClientUser") {
      return <Icons.Custom.Brand className={styles.takeover_icon} strokeWidth={2} />;
    }
    return null;
  };

  const takeoverTagline = getTakeoverTagline();
  const takeoverTooltip = getTakeoverTooltipMessage();
  const takeoverIcon = getTakeoverIcon();
  const environmentTooltip =
    effectiveVariant === "staging" || effectiveVariant === "localhost" ? getTooltipMessage() : null;
  const tooltipContent = takeoverTooltip || environmentTooltip;
  const shouldShowTooltip = Boolean(tooltipContent);

  const containerClasses = [
    styles.logo_container,
    styles[validSize],
    styles[`container_${effectiveVariant}`],
    withTagline ? styles.withTagline : "",
    !showText ? styles.icon_only : "",
    shouldShowTooltip ? styles.with_tooltip : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const logoClasses = [styles.logo, styles[effectiveVariant]].join(" ");

  const logoContent = (
    <div className={containerClasses} onClick={onClick}>
      <Icons.Custom.Adtraction className={logoClasses} />

      {showText && (
        <div className={styles.text_container}>
          <TextLogo className={styles.text_logo} pathClassName={styles.text_path} />

          {takeoverTagline ? (
            <div className={styles.takeover_tagline} aria-label={takeoverTagline}>
              {takeoverIcon}
              <span className={styles.takeover_text}>{takeoverTagline}</span>
            </div>
          ) : (
            withTagline && (
              <div className={styles.tagline}>
                <Tagline pathClassName={styles.text_path} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );

  if (shouldShowTooltip) {
    return (
      <Tippy
        content={tooltipContent}
        appendTo={typeof document !== "undefined" ? document.body : undefined}>
        {logoContent}
      </Tippy>
    );
  }

  return logoContent;
};

export default AdtractionLogo;
