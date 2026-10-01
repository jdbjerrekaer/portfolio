// Thousand separators for different locales
export const THOUSAND_SEPARATOR = {
  SPACE: " ",
  COMMA: ",",
  DOT: ".",
  NONE: ""
};

// Decimal separators for different locales
export const DECIMAL_SEPARATOR = {
  DOT: ".",
  COMMA: ","
};

// Default formatting locale - space as thousand separator and comma as decimal separator
export const DEFAULT_LOCALE = {
  thousandSeparator: THOUSAND_SEPARATOR.SPACE,
  decimalSeparator: DECIMAL_SEPARATOR.DOT,
  decimalPlaces: 2
};
