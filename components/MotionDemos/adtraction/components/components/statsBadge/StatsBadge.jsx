import React, { useEffect, useMemo, useState } from "react";
import { Icons } from "@adtraction/ui-icons";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import styles from "./StatsBadge.module.scss";
import { Tag } from "../../tokens/tag/Tag";
import { Badge as CurrencyBadge } from "../../tokens/badge/Badge";
import { i18n } from "@adtraction/shared-i18n";
import { getOverlayPortalTarget } from "../../misc/overlayPortal";
const formatTooltipNumber = (value, useSpaceThousands = false) => {
  const thousandSeparator = useSpaceThousands ? " " : ",";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: true
  })
    .format(value)
    .replace(/,/g, thousandSeparator);
};

const formatDisplayValue = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return value;
  }

  if (Math.abs(value) >= 10) {
    return Number(value.toFixed(0));
  }

  return value.toFixed(2);
};

const formatTooltipPercentage = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  const sign = value < 0 ? "-" : "";
  const formattedMagnitude = formatTooltipNumber(Math.abs(value));

  return `${sign}${formattedMagnitude}`;
};

const formatSplitTooltipValue = (value, format, currency) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return `${value ?? ""}`;
  }

  if (format === "percentage") {
    const formattedPercentage = formatTooltipPercentage(value);
    return formattedPercentage == null ? "" : `${formattedPercentage}%`;
  }

  const shouldUseSpaceThousands = format === "currency" || format === "number" || Boolean(currency);
  return formatTooltipNumber(value, shouldUseSpaceThousands);
};

/**
 * StatsBadge visualizes a numeric percentage as negative/neutral/positive with
 * optional background and tooltip. Thresholds determine the status.
 *
 * @param {("small"|"default"|"large")} [size="default"] - Size variant.
 * @param {boolean} [background=false] - Filled background variant.
 * @param {boolean} [indicator=true] - Show directional indicator icon.
 * @param {number|string} [value=0] - Percentage value shown (number or preformatted string).
 * @param {number} [positive=24] - Upper threshold; values greater are positive.
 * @param {number} [negative=20] - Lower threshold; values smaller are negative.
 * @param {boolean} [hoverable=true] - If true, shows a tooltip on hover.
 * @param {number} [displayCap=500] - Maximum absolute value to render before clamping the badge text.
 * @param {("default"|"split")} [type="default"] - Tooltip type. "default" shows value snapshot; "split" shows percent change.
 * @param {{fromValue: number, toValue?: number, fromDate?: string, toDate?: string, currency?: string, format?: "currency" | "number" | string}} [tooltipData={}] - Tooltip data.
 * @returns {JSX.Element}
 */
export const StatsBadge = ({
  // Appearance
  size = "default",
  background = false,
  indicator = true,

  // Value and thresholds
  value = 0,
  positive = 24,
  negative = 20,

  // Behavior
  hoverable = true,

  // Display
  displayCap = 500,

  // Split tooltip presentation
  showIndicatorScale = true,

  // Tooltip type
  type = "default",

  // Tooltip
  tooltipData = {}
}) => {
  const [status, setStatus] = useState("neutral");
  const [color, setColor] = useState("var(--ui-colors-yellow-400)");

  const clampState = useMemo(() => {
    const hasNumericValue = typeof value === "number" && Number.isFinite(value);
    const normalisedCap =
      Number.isFinite(Number(displayCap)) && Number(displayCap) > 0
        ? Math.abs(Number(displayCap))
        : null;

    if (!hasNumericValue) {
      return {
        displayText: formatDisplayValue(value),
        tooltipValueText: null,
        isClamped: false,
        hasNumericValue: false
      };
    }

    const numericValue = value;
    const formattedValue = formatDisplayValue(numericValue);
    const tooltipValueText = formatTooltipPercentage(numericValue);

    if (!normalisedCap || Math.abs(numericValue) <= normalisedCap) {
      return {
        displayText: formattedValue,
        tooltipValueText,
        isClamped: false,
        hasNumericValue: true
      };
    }

    const magnitudeText = String(formatDisplayValue(normalisedCap));
    const prefix = numericValue < 0 ? "-" : "";

    return {
      displayText: `${prefix}${magnitudeText}+`,
      tooltipValueText,
      isClamped: true,
      hasNumericValue: true
    };
  }, [value, displayCap]);

  useEffect(() => {
    if (value < negative) {
      setStatus("negative");
      setColor("var(--ui-colors-red-600)");
    } else if (value > positive) {
      setStatus("positive");
      setColor("var(--ui-colors-green-400)");
    } else {
      setStatus("neutral");
      setColor("var(--ui-colors-yellow-400)");
    }
  }, [value, positive, negative]);

  const statsIcon = () => {
    const iconColor = background ? "var(--grayscale-0)" : color;
    const iconSize = size === "large" ? "0.875rem" : "0.75rem";
    const iconTransform =
      status === "negative" ? "rotate(180deg)" : status === "neutral" ? "rotate(90deg)" : undefined;
    return (
      <div
        className={styles.stats_badge_icon}
        aria-hidden
        style={iconTransform ? { transform: iconTransform } : undefined}>
        <Icons.Arrow.ChevronUp
          width={iconSize}
          height={iconSize}
          color={iconColor}
          strokeWidth={3.0}
        />
      </div>
    );
  };

  const actualValueTooltipRow =
    clampState.isClamped && clampState.tooltipValueText ? (
      <div className={styles.stats_badge_tooltip_actual}>
        <span className={styles.stats_badge_tooltip_actual_label}>{i18n.t("ui.toolkit.statsBadge.actual")}</span>
        <span className={styles.stats_badge_tooltip_actual_value}>
          {`${clampState.tooltipValueText}%`}
        </span>
      </div>
    ) : null;

  const tooltipContent = () => {
    // Split type: show percent change view
    if (type === "split") {
      const fromVal = Number(tooltipData?.fromValue) || 0;
      const toVal = Number(tooltipData?.toValue) || 0;
      const splitFormat = tooltipData?.format;
      const splitCurrency = tooltipData?.currency;
      const formattedFromValue = formatSplitTooltipValue(fromVal, splitFormat, splitCurrency);
      const formattedToValue = formatSplitTooltipValue(toVal, splitFormat, splitCurrency);
      const numericBadgeValue = typeof value === "number" ? value : Number(value);
      const negativeRange = 0;
      const positiveRange = 1;

      return (
        <>
          <div className={styles.stats_badge_tooltip_container_info}>
            <div className={styles.stats_badge_tooltip_percentchange_container}>
              <p className={styles.change_text}>
                {splitFormat === "percentage"
                  ? i18n.t("ui.toolkit.statsBadge.fromTo", {
                      from: formattedFromValue.replace(/%$/, ""),
                      to: formattedToValue.replace(/%$/, "")
                    })
                  : `From ${formattedFromValue} to ${formattedToValue}`}
              </p>
              {Number.isFinite(numericBadgeValue) && (
                <StatsBadge
                  value={numericBadgeValue}
                  background={false}
                  positive={positiveRange}
                  negative={negativeRange}
                  size="small"
                  hoverable={false}
                  displayCap={displayCap}
                  showIndicatorScale={false}
                  type="split"
                />
              )}
            </div>
            <p className={styles.date_change_text}>
              {i18n.t("ui.toolkit.statsBadge.comparedTo", {
                fromDate: tooltipData.fromDate,
                toDate: tooltipData.toDate
              })}
            </p>
          </div>
          {showIndicatorScale && (
            <div className={styles.indicator_container}>
              <div className={styles.indicator_inner_container}>
                <span className={clsx(styles.indicator, styles.negative)} />
                <p>&lt; {negative}%</p>
              </div>
              <div className={styles.indicator_inner_container}>
                <span className={clsx(styles.indicator, styles.neutral)} />
                <p>
                  {negative}% - {positive}%
                </p>
              </div>
              <div className={styles.indicator_inner_container}>
                <span className={clsx(styles.indicator, styles.positive)} />
                <p>&gt; {positive}%</p>
              </div>
            </div>
          )}
          {actualValueTooltipRow}
        </>
      );
    }

    // Default type: value snapshot with optional currency and date range
    const currency = tooltipData?.currency;
    const format = tooltipData?.format;
    const fromDateText = tooltipData?.fromDate;
    const toDateText = tooltipData?.toDate;

    const fromValNumeric = Number(tooltipData?.fromValue);
    // TODO: Update depending on the language selected in the sidemenu
    const shouldUseSpaceThousands =
      format === "currency" || format === "number" || Boolean(currency);
    const formattedFromValue = Number.isFinite(fromValNumeric)
      ? formatTooltipNumber(fromValNumeric, shouldUseSpaceThousands)
      : `${tooltipData?.fromValue ?? ""}`;

    const hasFrom = !!fromDateText;
    const hasTo = !!toDateText;

    return (
      <div className={styles.currency_tooltip_container}>
        <div className={styles.currency_value_row}>
          <p className={styles.currency_value_text}>{formattedFromValue}</p>
          {currency ? <CurrencyBadge size="small" text={currency} /> : null}
        </div>
        {(hasFrom || hasTo) && (
          <div className={styles.currency_date_row}>
            {hasFrom && <Tag size="small" text={fromDateText} />}
            {hasFrom && hasTo && <span className={styles.currency_date_dash}>-</span>}
            {hasTo && <Tag size="small" text={toDateText} />}
          </div>
        )}
        {actualValueTooltipRow}
      </div>
    );
  };

  const badge = (
    <div
      className={clsx(styles.stats_badge_container, styles[status], styles[size])}
      data-hoverable={hoverable}
      data-background={background}
      style={{ "--stats-color-text": color }}>
      {indicator && statsIcon()}
      <p>{`${clampState.displayText}%`}</p>
    </div>
  );

  return hoverable ? (
    <Tippy
      content={tooltipContent()}
      placement="bottom-start"
      animation="fade"
      arrow={false}
      appendTo={getOverlayPortalTarget}
      className={styles.stats_badge_tooltip}>
      {badge}
    </Tippy>
  ) : (
    badge
  );
};
