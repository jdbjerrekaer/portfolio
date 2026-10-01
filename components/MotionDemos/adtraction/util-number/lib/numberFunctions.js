import { DEFAULT_LOCALE } from "./numberConstants";

/**
 * Format a number with thousand separators and proper decimal places
 * @param {number} value - The number to format
 * @param {object} options - Formatting options
 * @param {string} options.thousandSeparator - Character to use as thousand separator
 * @param {string} options.decimalSeparator - Character to use as decimal separator
 * @param {number} options.decimalPlaces - Number of decimal places to show
 * @returns {string} Formatted number string
 */
export function formatNumber(value, options = {}) {
  // Return empty string for null or undefined values
  if (value === null || value === undefined) {
    return "";
  }

  // Ensure we're working with a number
  const numberValue = Number(value);

  // Return empty string for NaN
  if (isNaN(numberValue)) {
    return "";
  }

  // Use default locale if no options provided
  const {
    thousandSeparator = DEFAULT_LOCALE.thousandSeparator,
    decimalSeparator = DEFAULT_LOCALE.decimalSeparator,
    decimalPlaces = DEFAULT_LOCALE.decimalPlaces,
    forceShowDecimals = false
  } = options;

  // Format the number to the specified decimal places
  const parts = numberValue.toFixed(decimalPlaces).split(".");

  // Format integer part with thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  // Check if decimal part is all zeros
  const isDecimalAllZeros = !parts[1] || parts[1].split("").every((char) => char === "0");

  // Show decimals only if:
  // 1. decimalPlaces > 0 AND
  // 2. Either forceShowDecimals is true OR there are non-zero digits in decimal part
  const showDecimals = decimalPlaces > 0 && (forceShowDecimals || !isDecimalAllZeros);

  // Construct the final formatted number
  return showDecimals
    ? `${parts[0]}${decimalSeparator}${parts[1] || "0".repeat(decimalPlaces)}`
    : parts[0];
}

/**
 * Format a number as currency
 * @param {number} value - The number to format
 * @param {string} currencyCode - Currency code (e.g., 'EUR', 'USD')
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currencyCode = "EUR", options = {}) {
  const formattedNumber = formatNumber(value, {
    ...options,
    decimalPlaces: options.decimalPlaces !== undefined ? options.decimalPlaces : 2
  });

  if (!formattedNumber) {
    return "";
  }

  return `${formattedNumber} ${currencyCode}`;
}

/**
 * Format a number as percentage
 * @param {number} value - The number to format (e.g., 0.25 for 25%)
 * @param {object} options - Formatting options
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, options = {}) {
  // Default to 1 decimal place for percentages
  const decimalPlaces = options.decimalPlaces !== undefined ? options.decimalPlaces : 1;

  const formattedNumber = formatNumber(value, {
    ...options,
    decimalPlaces
  });

  if (!formattedNumber) {
    return "";
  }

  return `${formattedNumber}%`;
}

/**
 * Compact large numbers to K, M, B format
 * @param {number} value - The number to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted compact number
 */
export function formatCompactNumber(value, options = {}) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "";
  }

  const numberValue = Number(value);
  const absValue = Math.abs(numberValue);

  let divider = 1;
  let suffix = "";

  if (absValue >= 1_000_000_000) {
    divider = 1_000_000_000;
    suffix = "B";
  } else if (absValue >= 1_000_000) {
    divider = 1_000_000;
    suffix = "M";
  } else if (absValue >= 1_000) {
    divider = 1_000;
    suffix = "K";
  }

  let compactValue = numberValue / divider;

  const {
    roundingMode = "round",
    decimalPlaces: decimalPlacesOption,
    ...formattingOverrides
  } = options;

  // Use 1 decimal place for K/M/B formats unless specified
  const decimalPlaces =
    decimalPlacesOption !== undefined
      ? decimalPlacesOption
      : suffix
        ? 1
        : DEFAULT_LOCALE.decimalPlaces;

  if (roundingMode === "floor" && decimalPlaces >= 0) {
    const factor = 10 ** decimalPlaces;

    if (factor === 0 || !Number.isFinite(factor)) {
      compactValue = compactValue >= 0 ? Math.floor(compactValue) : Math.ceil(compactValue);
    } else {
      compactValue =
        compactValue >= 0
          ? Math.floor(compactValue * factor) / factor
          : Math.ceil(compactValue * factor) / factor;
    }
  }

  const formattedNumber = formatNumber(compactValue, {
    ...formattingOverrides,
    decimalPlaces
  });

  return `${formattedNumber}${suffix}`;
}
