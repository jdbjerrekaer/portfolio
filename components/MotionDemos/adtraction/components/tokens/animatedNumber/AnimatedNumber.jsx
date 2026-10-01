import { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import { SlotText } from "slot-text/react";
import "slot-text/style.css";
import { formatNumber, formatPercentage, formatCompactNumber } from "@adtraction/util-number";
import clsx from "clsx";
import styles from "./AnimatedNumber.module.scss";
import { Badge } from "../badge/Badge";

const SLOT_TEXT_DURATION_MS = 300;
const SLOT_TEXT_STAGGER_MS = 45;
const SLOT_TEXT_EXIT_OFFSET_MS = 50;
const SLOT_TEXT_SETTLE_BUFFER_MS = 120;
const MICRO_RELATIVE_THRESHOLD = 0.15;
const SNAP_SLOT_TEXT_OPTIONS = {
  duration: 0,
  stagger: 0,
  exitOffset: 0,
  colorFade: 0
};

const getSlotTextSettleMs = (text) =>
  SLOT_TEXT_DURATION_MS +
  SLOT_TEXT_EXIT_OFFSET_MS +
  Math.max(0, text.length - 1) * SLOT_TEXT_STAGGER_MS +
  SLOT_TEXT_SETTLE_BUFFER_MS;

export const AnimatedNumber = forwardRef(
  (
    {
      value = null,
      loading = false,
      decimalPlaces = 2,
      hideDecimalsAboveThreshold = 100,
      onAnimationProgress = null,
      onLoadingAnimationComplete = null,
      onAnimationComplete = null,
      className = "",
      variant = undefined, // 'currency' | 'percent' | 'plain' | 'compact'
      currency = null,
      locale = undefined,
      currencyContainer = null,
      freezeWhileLoading = false,
      roundingMode = "round",
      ...props
    },
    ref
  ) => {
    void locale;

    const hasAffixProp = Boolean(currencyContainer || currency);
    const resolvedVariant = variant ? variant : hasAffixProp ? "currency" : "plain";
    const showAffix = resolvedVariant === "currency" && hasAffixProp;

    const formatWithVariant = useCallback(
      (val) => {
        const overThreshold = val > hideDecimalsAboveThreshold;

        const formattingOptions = {
          decimalPlaces: overThreshold ? 0 : decimalPlaces,
          forceShowDecimals: !overThreshold
        };

        if (resolvedVariant === "percent") return formatPercentage(val, formattingOptions);
        if (resolvedVariant === "compact")
          return formatCompactNumber(val, { ...formattingOptions, roundingMode });
        return formatNumber(val, formattingOptions);
      },
      [decimalPlaces, hideDecimalsAboveThreshold, resolvedVariant, roundingMode]
    );

    const [displayValue, setDisplayValue] = useState(() => (value !== null ? value : 0));
    const [shouldRollValue, setShouldRollValue] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const internalRef = useRef(null);
    const widthRef = useRef(null);
    const [widthOverride, setWidthOverride] = useState(null);
    const releaseWidthTimeoutRef = useRef(null);
    const completionTimeoutRef = useRef(null);
    const prevWidthLockRef = useRef(false);
    const prevLoadingRef = useRef(loading);
    const prevValueRef = useRef(value);
    const displayValueRef = useRef(displayValue);
    const callbackCalledRef = useRef(false);

    const setCombinedRef = useCallback(
      (node) => {
        internalRef.current = node;

        if (!ref) return;

        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      },
      [ref]
    );

    const commitDisplayValue = useCallback((nextValue, shouldRoll) => {
      displayValueRef.current = nextValue;
      setShouldRollValue(shouldRoll);
      setDisplayValue(nextValue);
    }, []);

    const fireCompletionCallbacks = useCallback(
      (didFinishLoading) => {
        if (callbackCalledRef.current) {
          return;
        }

        try {
          if (didFinishLoading && onLoadingAnimationComplete) onLoadingAnimationComplete();
          if (onAnimationComplete) onAnimationComplete();
          callbackCalledRef.current = true;
        } catch (err) {
          console.error("Error executing AnimatedNumber completion callback:", err);
        }
      },
      [onAnimationComplete, onLoadingAnimationComplete]
    );

    const clearCompletionTimeout = useCallback(() => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    }, []);

    useEffect(() => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return;
      }

      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

      handleChange();
      mediaQuery.addEventListener?.("change", handleChange);

      return () => {
        mediaQuery.removeEventListener?.("change", handleChange);
      };
    }, []);

    useEffect(() => {
      const prevLoading = prevLoadingRef.current;
      const prevValue = prevValueRef.current;
      const previousDisplayValue = displayValueRef.current;
      const loadingChanged = prevLoading !== loading;
      const valueChanged = prevValue !== value || previousDisplayValue !== value;

      if (loadingChanged || valueChanged) {
        clearCompletionTimeout();
        callbackCalledRef.current = false;
      }

      if (loading) {
        if (!freezeWhileLoading && value !== null) {
          commitDisplayValue(value, false);
        }
        if (onAnimationProgress) onAnimationProgress(0);

        prevLoadingRef.current = loading;
        prevValueRef.current = value;
        return;
      }

      if (value !== null) {
        const difference = Math.abs(value - previousDisplayValue);
        const baselineMagnitude = Math.max(
          1,
          resolvedVariant === "percent" ? 100 : 1,
          Math.abs(previousDisplayValue),
          Math.abs(value)
        );
        const isMicroDelta = difference === 0 || difference / baselineMagnitude < MICRO_RELATIVE_THRESHOLD;
        const shouldRoll = difference > 0 && !isMicroDelta;

        commitDisplayValue(value, shouldRoll);

        if (shouldRoll && !prefersReducedMotion) {
          if (onAnimationProgress) onAnimationProgress(0);
          completionTimeoutRef.current = window.setTimeout(() => {
            if (onAnimationProgress) onAnimationProgress(1);
            fireCompletionCallbacks(prevLoading && !loading);
            completionTimeoutRef.current = null;
          }, getSlotTextSettleMs(formatWithVariant(value)));
        } else {
          if (onAnimationProgress) onAnimationProgress(1);
          fireCompletionCallbacks(prevLoading && !loading);
        }
      }

      prevLoadingRef.current = loading;
      prevValueRef.current = value;
    }, [
      clearCompletionTimeout,
      commitDisplayValue,
      fireCompletionCallbacks,
      formatWithVariant,
      freezeWhileLoading,
      loading,
      onAnimationProgress,
      prefersReducedMotion,
      resolvedVariant,
      value
    ]);

    useEffect(() => {
      if (!internalRef.current) {
        return;
      }

      const currentNode = internalRef.current;
      const updateWidth = () => {
        const rect = currentNode.getBoundingClientRect();
        const width = rect.width;

        if (!Number.isFinite(width) || width < 0.1) {
          return;
        }

        const prevWidth = widthRef.current;
        if (prevWidth !== null && Math.abs(prevWidth - width) < 0.35) {
          return;
        }

        widthRef.current = width;
      };

      updateWidth();

      const resizeObserver = new ResizeObserver(() => updateWidth());
      resizeObserver.observe(currentNode);

      return () => {
        resizeObserver.disconnect();
      };
    }, [displayValue, loading, resolvedVariant, currency, currencyContainer]);

    const widthLockActive = loading;

    useEffect(() => {
      const currentWidth = widthRef.current ?? null;

      if (widthLockActive && currentWidth !== null) {
        const widthString = `${currentWidth}px`;
        if (widthOverride !== widthString) {
          setWidthOverride(widthString);
        }
      } else if (!widthLockActive && prevWidthLockRef.current) {
        if (releaseWidthTimeoutRef.current) {
          clearTimeout(releaseWidthTimeoutRef.current);
        }

        const naturalWidth = internalRef.current ? internalRef.current.scrollWidth : null;
        if (naturalWidth !== null) {
          const targetWidth = `${naturalWidth}px`;
          if (widthOverride !== targetWidth) {
            setWidthOverride(targetWidth);
          }
        } else if (currentWidth !== null) {
          const fallbackWidth = `${currentWidth}px`;
          if (widthOverride !== fallbackWidth) {
            setWidthOverride(fallbackWidth);
          }
        }

        releaseWidthTimeoutRef.current = window.setTimeout(() => {
          setWidthOverride(null);
          releaseWidthTimeoutRef.current = null;
        }, 240);
      } else if (!widthLockActive && widthOverride !== null) {
        setWidthOverride(null);
      }

      prevWidthLockRef.current = widthLockActive;

      return () => {
        if (releaseWidthTimeoutRef.current) {
          clearTimeout(releaseWidthTimeoutRef.current);
          releaseWidthTimeoutRef.current = null;
        }
      };
    }, [widthLockActive, widthOverride]);

    useEffect(() => {
      return () => {
        if (releaseWidthTimeoutRef.current) {
          clearTimeout(releaseWidthTimeoutRef.current);
        }
        clearCompletionTimeout();
      };
    }, [clearCompletionTimeout]);

    const affixContent = currencyContainer ? (
      currencyContainer
    ) : currency ? (
      <Badge text={currency} size="small" />
    ) : null;
    const formattedValue = formatWithVariant(displayValue);
    const slotTextOptions =
      shouldRollValue && !prefersReducedMotion ? undefined : SNAP_SLOT_TEXT_OPTIONS;

    if (value === null && !loading) {
      if (!showAffix) {
        return (
          <span className={clsx(styles.value, styles.valueContainer)} data-testid="animated-number">
            0
          </span>
        );
      }

      return (
        <div
          className={clsx(styles.animatedNumberWithCurrency, className)}
          data-variant={resolvedVariant}
          {...props}>
          <span className={clsx(styles.value, styles.valueContainer)} data-testid="animated-number">
            0
          </span>
          {showAffix && (
            <span
              className={clsx(styles.currencyContainer, styles.affixTransition)}
              style={{ opacity: 1 }}>
              {affixContent}
            </span>
          )}
        </div>
      );
    }

    const widthStyle = { whiteSpace: "nowrap" };

    if (!showAffix) {
      const wrapperStyle = { ...(props.style || {}) };
      const { style: _style, ...restProps } = props;
      void _style;

      if (widthOverride !== null) {
        wrapperStyle.minWidth = widthOverride;
        wrapperStyle.transition = "min-width 0.24s ease-in-out";
      }

      return (
        <span
          ref={setCombinedRef}
          className={clsx(styles.valueContainer, styles.valueWrapper, className, {
            [styles.valueWrapperShimmer]: loading
          })}
          data-variant={resolvedVariant}
          {...restProps}
          style={wrapperStyle}>
          <span className={clsx(styles.value, styles.valueBase)} data-testid="animated-number">
            <SlotText text={formattedValue} options={slotTextOptions} />
          </span>
          {loading && (
            <span className={clsx(styles.valueShimmerLayer, styles.valueShimmerLayerActive)}>
              <span className={styles.value} aria-hidden="true" style={widthStyle}>
                {formattedValue}
              </span>
            </span>
          )}
        </span>
      );
    }

    const currencyWrapperStyle = {};
    if (widthOverride !== null) {
      currencyWrapperStyle.minWidth = widthOverride;
      currencyWrapperStyle.transition = "min-width 0.24s ease-in-out";
    }

    return (
      <div
        className={clsx(styles.animatedNumberWithCurrency, className)}
        data-variant={resolvedVariant}
        {...props}>
        <span
          ref={setCombinedRef}
          className={clsx(styles.valueContainer, styles.valueWrapper, {
            [styles.loadingContainer]: loading,
            [styles.valueWrapperShimmer]: loading
          })}
          style={currencyWrapperStyle}>
          <span className={clsx(styles.value, styles.valueBase)} data-testid="animated-number">
            <SlotText text={formattedValue} options={slotTextOptions} />
          </span>
          {loading && (
            <span className={clsx(styles.valueShimmerLayer, styles.valueShimmerLayerActive)}>
              <span className={styles.value} style={widthStyle} aria-hidden="true">
                {formattedValue}
              </span>
            </span>
          )}
        </span>

        {showAffix && (
          <span
            className={clsx(styles.currencyContainer, styles.affixTransition, {
              [styles.affixTransitionHidden]: loading
            })}
            style={{ opacity: loading ? 0 : 1 }}>
            {affixContent}
          </span>
        )}
      </div>
    );
  }
);

AnimatedNumber.displayName = "AnimatedNumber";

export default AnimatedNumber;
