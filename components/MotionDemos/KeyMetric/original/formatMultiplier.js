import { formatNumber } from "@adtraction/util-number";

export const MULTIPLIER_FORMAT = "multiplier";
export const MULTIPLIER_SUFFIX = "x";
export const MULTIPLIER_DECIMAL_PLACES = 1;
// Matches the unavailable-metric placeholder already used in InsightsOverviewTable.jsx.
export const EMPTY_METRIC_DISPLAY = "—";

export const hasMultiplierValue = (value) =>
  value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) !== 0;

export const toMultiplierValue = (value) => (hasMultiplierValue(value) ? Number(value) : null);

export const formatMultiplier = (value) =>
  hasMultiplierValue(value)
    ? `${formatNumber(Number(value), {
        decimalPlaces: MULTIPLIER_DECIMAL_PLACES,
        forceShowDecimals: true
      })}${MULTIPLIER_SUFFIX}`
    : EMPTY_METRIC_DISPLAY;
