"use client";
import { i18n } from "@adtraction/shared-i18n";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useHistory } from "react-router-dom";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { Icons } from "@adtraction/ui-icons";

import styles from "./KeyMetric.module.scss";
import {
  Tag,
  StatsBadge,
  PlaceholderSkeleton,
  AnimatedNumber,
  Badge,
  ListItem,
  ListItemWrapper
} from "@adtraction/ui-components";
import { formatNumber } from "@adtraction/util-number";
import {
  MULTIPLIER_FORMAT,
  MULTIPLIER_SUFFIX,
  MULTIPLIER_DECIMAL_PLACES,
  EMPTY_METRIC_DISPLAY
} from "./formatMultiplier";

const HOVER_TIP_DELAY_MS = 300;

const pointerOnOwnTippy = (target) =>
  Boolean(target && typeof target.closest === "function" && target.closest("[data-metric-own-tippy]"));

const pointRect = (x, y) => ({
  width: 0,
  height: 0,
  x,
  y,
  top: y,
  bottom: y,
  left: x,
  right: x
});

const LinkedKeyMetric = ({ href, linkAriaLabel, header, onChangeTimeframe, children }) => {
  const history = useHistory();
  const hoverTimerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverTipOpen, setHoverTipOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const hideHoverTip = useCallback(() => {
    clearHoverTimer();
    setHoverTipOpen(false);
  }, [clearHoverTimer]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => () => clearHoverTimer(), [clearHoverTimer]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [closeMenu, menuOpen]);

  const scheduleHoverTip = useCallback(
    (event) => {
      if (menuOpen) {
        return;
      }
      if (pointerOnOwnTippy(event.target)) {
        hideHoverTip();
        return;
      }
      if (hoverTipOpen || hoverTimerRef.current) {
        return;
      }
      hoverTimerRef.current = setTimeout(() => {
        hoverTimerRef.current = null;
        setHoverTipOpen(true);
      }, HOVER_TIP_DELAY_MS);
    },
    [hideHoverTip, hoverTipOpen, menuOpen]
  );

  const openContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      hideHoverTip();
      setAnchor(pointRect(event.clientX, event.clientY));
      setMenuOpen(true);
    },
    [hideHoverTip]
  );

  const openHere = useCallback(() => {
    closeMenu();
    history.push(href);
  }, [closeMenu, history, href]);

  const openInNewTab = useCallback(() => {
    closeMenu();
    window.open(href, "_blank", "noopener,noreferrer");
  }, [closeMenu, href]);

  const changeTimeframe = useCallback(() => {
    closeMenu();
    onChangeTimeframe?.();
  }, [closeMenu, onChangeTimeframe]);

  const menu = (
    <div
      className={styles.menu}
      role="menu"
      aria-label={i18n.t("insights.keyMetric.contextMenu.ariaLabel")}
      onContextMenu={(event) => event.preventDefault()}>
      <ListItemWrapper customClassName={styles.menuItems} inFocus={menuOpen} enableAnimation={false}>
        <ListItem
          size="small"
          text={i18n.t("insights.keyMetric.contextMenu.open")}
          role="menuitem"
          onClick={openHere}
        />
        <ListItem
          size="small"
          text={i18n.t("insights.keyMetric.contextMenu.openNewTab")}
          role="menuitem"
          onClick={openInNewTab}
        />
        {onChangeTimeframe ? (
          <ListItem
            size="small"
            text={i18n.t("insights.keyMetric.contextMenu.changeTimeframe")}
            role="menuitem"
            onClick={changeTimeframe}
          />
        ) : null}
      </ListItemWrapper>
    </div>
  );

  const hoverTip = linkAriaLabel || i18n.t("insights.keyMetric.viewInInsights", { metric: header });

  return (
    <Tippy
      content={menuOpen ? menu : hoverTipOpen ? hoverTip : null}
      visible={menuOpen || hoverTipOpen}
      interactive={menuOpen}
      arrow={!menuOpen}
      theme={menuOpen ? "context_menu" : undefined}
      maxWidth={menuOpen ? "none" : 280}
      placement={menuOpen ? "bottom-start" : "bottom"}
      appendTo={() => document.body}
      onClickOutside={menuOpen ? closeMenu : hideHoverTip}
      {...(menuOpen && anchor ? { getReferenceClientRect: () => anchor } : {})}>
      <Link
        to={href}
        className={styles.metricLink}
        aria-label={linkAriaLabel || header}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onMouseOver={scheduleHoverTip}
        onMouseLeave={hideHoverTip}
        onContextMenu={openContextMenu}
        onKeyDown={(event) => {
          const isContextMenuKey = event.key === "ContextMenu";
          const isShiftF10 = event.key === "F10" && event.shiftKey;
          if (isContextMenuKey || isShiftF10) {
            const rect = event.currentTarget.getBoundingClientRect();
            openContextMenu({
              preventDefault: () => event.preventDefault(),
              clientX: rect.left,
              clientY: rect.bottom
            });
          }
        }}>
        {children}
      </Link>
    </Tippy>
  );
};

export const KeyMetric = ({
  header = "",
  value = null,
  currency = null,
  timeFrame = "",
  loading = false,
  isPercentValue = false,
  statsBadge = false,
  hideDecimalsAboveThreshold = 100,
  noDataTooltip = null,
  valueFormat = null,
  href = null,
  linkAriaLabel = null,
  onChangeTimeframe = null
}) => {
  const isMultiplier = valueFormat === MULTIPLIER_FORMAT;
  const [badgeOpacity, setBadgeOpacity] = useState(0);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const [shouldRenderAnimated, setShouldRenderAnimated] = useState(value !== null || loading);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef(null);

  const handleAnimationComplete = useCallback(() => {
    setFinishedLoading(true);
    setBadgeOpacity(1);
  }, []);

  const stableAnimationCompleteRef = useRef(handleAnimationComplete);
  useEffect(() => {
    stableAnimationCompleteRef.current = handleAnimationComplete;
  }, [handleAnimationComplete]);

  const stableAnimationComplete = useCallback(() => {
    stableAnimationCompleteRef.current();
  }, []);

  // Reset local completion whenever inputs change; AnimatedNumber will signal completion via callbacks
  useEffect(() => {
    if (loading) {
      setFinishedLoading(false);
      setBadgeOpacity(0);
    }
  }, [loading]);

  // If loading has finished and there is no value to animate, mark as finished
  useEffect(() => {
    if (!loading && value === null) {
      setFinishedLoading(true);
      setBadgeOpacity(1);
    }
  }, [loading, value]);

  // Track last non-null value for exit animation
  useEffect(() => {
    if (value !== null) {
      setLastValue(value);
    }
  }, [value]);

  // Manage presence for exit animation: keep number mounted briefly to blur/fade out
  useEffect(() => {
    const isVisibleNow = value !== null || loading;

    // Clear any previous timeout
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (isVisibleNow) {
      setIsExiting(false);
      setShouldRenderAnimated(true);
      return;
    }

    // Was visible previously and now not: trigger exit
    setIsExiting(true);
    setShouldRenderAnimated(true);
    exitTimeoutRef.current = setTimeout(() => {
      setShouldRenderAnimated(false);
      setIsExiting(false);
    }, 200); // match CSS duration

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [value, loading]);

  // Normalize statsBadge to object
  const statsBadgeConfig = (() => {
    // If statsBadge is an object, use it directly
    if (typeof statsBadge === "object" && statsBadge !== null) {
      return statsBadge;
    }

    // If statsBadge is false/null/undefined, no stats badge
    if (!statsBadge) {
      return null;
    }

    // Default config for statsBadge === true
    return {
      value: 0,
      positive: 0,
      negative: 0,
      compare: 0,
      timeFrame: "",
      compareDecimalPlaces: 0
    };
  })();

  const hasBaselineValue = lastValue !== null;
  const isReloading = loading && hasBaselineValue;

  const resolvedValue = useMemo(() => {
    if (value !== null) return value;
    if (loading && lastValue !== null) return lastValue;
    return lastValue;
  }, [value, loading, lastValue]);

  const shouldShowStatsBadge =
    statsBadgeConfig !== null && !(resolvedValue === 0 && statsBadgeConfig.value === 0);

  const integerDigitCount = useMemo(() => {
    if (resolvedValue === null || resolvedValue === undefined) return 0;
    const absoluteValue = Math.abs(Math.trunc(Number(resolvedValue)));
    return absoluteValue === 0 ? 1 : absoluteValue.toString().length;
  }, [resolvedValue]);

  const shouldCompact = useMemo(
    () => !isPercentValue && resolvedValue !== null && integerDigitCount >= 6,
    [integerDigitCount, isPercentValue, resolvedValue]
  );

  const resolvedDecimalPlaces = useMemo(() => {
    if (resolvedValue === null) return 2;
    if (isMultiplier) return MULTIPLIER_DECIMAL_PLACES;
    const absValue = Math.abs(Number(resolvedValue));
    if (absValue >= 100_000) {
      return 1;
    }
    // Threshold 0 means never show decimals (e.g. tenancy counts, including 0).
    if (hideDecimalsAboveThreshold === 0) {
      return 0;
    }
    if (hideDecimalsAboveThreshold > 0 && absValue > hideDecimalsAboveThreshold) {
      return 0;
    }
    return 2;
  }, [resolvedValue, hideDecimalsAboveThreshold, isMultiplier]);

  useEffect(() => {
    if (shouldCompact && !loading && resolvedValue !== null) {
      setFinishedLoading(true);
      setBadgeOpacity(1);
    }
  }, [shouldCompact, loading, resolvedValue]);

  const fullDisplayValue = useMemo(() => {
    if (resolvedValue === null) return "";
    return formatNumber(resolvedValue, {
      decimalPlaces: resolvedDecimalPlaces,
      forceShowDecimals: resolvedDecimalPlaces > 0 && !shouldCompact
    });
  }, [resolvedValue, resolvedDecimalPlaces, shouldCompact]);

  const compactValueNode = useMemo(() => {
    if (!shouldCompact || resolvedValue === null) {
      return null;
    }

    const compactDecimalPlaces = (() => {
      if (resolvedValue === null) return 1;

      const absValue = Math.abs(resolvedValue);

      let divider = 1;
      if (absValue >= 1_000_000_000) {
        divider = 1_000_000_000;
      } else if (absValue >= 1_000_000) {
        divider = 1_000_000;
      } else if (absValue >= 1_000) {
        divider = 1_000;
      }

      let basePrecision = 2;
      if (absValue >= 100_000) {
        basePrecision = 1;
      }
      if (absValue >= 1_000_000) {
        basePrecision = 1;
      }

      const factor = 10 ** basePrecision;
      const flooredCompact =
        resolvedValue >= 0
          ? Math.floor((resolvedValue / divider) * factor) / factor
          : Math.ceil((resolvedValue / divider) * factor) / factor;

      const hasFraction = Math.abs(flooredCompact - Math.trunc(flooredCompact)) > Number.EPSILON;

      if (!hasFraction) {
        return 0;
      }

      return basePrecision;
    })();

    const valueNode = (
      <div
        className={clsx(styles.compactWrapper, {
          [styles.valueLoading]: loading && !isExiting,
          [styles.valueExiting]: isExiting
        })}
        data-hoverable={!loading ? "true" : undefined}
        data-metric-own-tippy="">
        <AnimatedNumber
          className={styles.valueCompactAnimated}
          value={resolvedValue}
          loading={isExiting ? false : loading}
          freezeWhileLoading={isReloading}
          decimalPlaces={Math.max(0, compactDecimalPlaces)}
          hideDecimalsAboveThreshold={Number.POSITIVE_INFINITY}
          variant="compact"
          roundingMode="floor"
          onAnimationComplete={stableAnimationComplete}
          onLoadingAnimationComplete={stableAnimationComplete}
        />
        {currency && <Badge size="small" text={currency} className={styles.compactCurrencyBadge} />}
      </div>
    );

    return (
      <Tippy
        content={
          <div className={styles.compactTooltipContent}>
            <span className={styles.compactTooltipValue}>{fullDisplayValue}</span>
            {currency && <Badge size="small" text={currency} />}
          </div>
        }
        placement="bottom-start"
        animation="fade"
        arrow={false}
        disabled={loading}>
        {valueNode}
      </Tippy>
    );
  }, [
    shouldCompact,
    resolvedValue,
    loading,
    isExiting,
    isReloading,
    currency,
    fullDisplayValue,
    stableAnimationComplete
  ]);

  const noDataText = isMultiplier
    ? EMPTY_METRIC_DISPLAY
    : i18n.t("insights.keyMetric.notEnoughData");

  const metric = (
    <div className={styles.metric}>
      <div className={clsx(styles.label, href && styles.labelWithLink)}>
        {header}
        {href ? (
          <Icons.Arrow.ChevronRight
            className={styles.linkChevron}
            width={16}
            height={16}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className={styles.valueContainer}>
        {shouldRenderAnimated ? (
          <>
            {shouldCompact ? (
              compactValueNode
            ) : isMultiplier ? (
              <span className={clsx(styles.multiplierValue, isExiting && styles.valueExiting)}>
                <AnimatedNumber
                  className={styles.value}
                  value={value !== null ? value : lastValue}
                  loading={isExiting ? false : loading}
                  freezeWhileLoading={isReloading}
                  decimalPlaces={resolvedDecimalPlaces}
                  hideDecimalsAboveThreshold={Number.POSITIVE_INFINITY}
                  onAnimationComplete={stableAnimationComplete}
                  onLoadingAnimationComplete={stableAnimationComplete}
                />
                {resolvedValue !== null && (
                  <span
                    className={clsx(
                      styles.valueSuffix,
                      loading && !isExiting && styles.valueSuffixLoading
                    )}>
                    <span className={styles.valueSuffixBase}>{MULTIPLIER_SUFFIX}</span>
                    <span className={styles.valueSuffixShimmer} aria-hidden="true">
                      {MULTIPLIER_SUFFIX}
                    </span>
                  </span>
                )}
              </span>
            ) : (
              <AnimatedNumber
                className={`${styles.value} ${isExiting ? styles.valueExiting : ""} ${
                  isPercentValue ? styles.valuePercent : ""
                } ${loading && !isExiting ? styles.valueLoading : ""}`}
                value={value !== null ? value : lastValue}
                loading={isExiting ? false : loading}
                freezeWhileLoading={isReloading}
                decimalPlaces={resolvedDecimalPlaces}
                hideDecimalsAboveThreshold={hideDecimalsAboveThreshold}
                onAnimationComplete={stableAnimationComplete}
                onLoadingAnimationComplete={stableAnimationComplete}
                variant={isPercentValue ? "percent" : undefined}
                currency={!isPercentValue ? currency : null}
              />
            )}
            {!isExiting && shouldShowStatsBadge && lastValue !== null && (
              <div
                className={`${styles.statsBadgeContainer} ${isReloading ? styles.loading : ""}`}
                data-metric-own-tippy=""
                style={{
                  opacity: badgeOpacity
                }}>
                <StatsBadge
                  size={statsBadgeConfig.size ?? "small"}
                  value={statsBadgeConfig.value ?? 0}
                  positive={statsBadgeConfig.positive ?? 0}
                  negative={statsBadgeConfig.negative ?? 0}
                  background={statsBadgeConfig.background ?? false}
                  indicator={statsBadgeConfig.indicator ?? true}
                  hoverable={true}
                  tooltipData={{
                    fromValue: statsBadgeConfig.compare ?? 0,
                    toValue: statsBadgeConfig.value ?? 0,
                    fromDate: statsBadgeConfig.fromDate ?? "",
                    toDate: statsBadgeConfig.toDate ?? "",
                    currency: statsBadgeConfig.currency ?? currency ?? null,
                    format: statsBadgeConfig.format ?? (currency ? "currency" : "number")
                  }}
                />
              </div>
            )}
          </>
        ) : noDataTooltip ? (
          <Tippy
            content={<div>{noDataTooltip}</div>}
            placement="bottom"
            delay={[300, 0]}
            className={styles.tippy_fade}>
            <span className={styles.valueNoData} data-metric-own-tippy="">
              {noDataText}
            </span>
          </Tippy>
        ) : (
          <span className={styles.valueNoData}>{noDataText}</span>
        )}
      </div>

      {timeFrame !== "" && (
        <PlaceholderSkeleton isLoading={!finishedLoading} width="84px" initialHeight="1.125rem">
          <div className={styles.timeFrameContainer} data-metric-own-tippy="">
            <Tag text={timeFrame} />
          </div>
        </PlaceholderSkeleton>
      )}
    </div>
  );

  if (!href) {
    return metric;
  }

  return (
    <LinkedKeyMetric
      href={href}
      linkAriaLabel={linkAriaLabel}
      header={header}
      onChangeTimeframe={onChangeTimeframe}>
      {metric}
    </LinkedKeyMetric>
  );
};
