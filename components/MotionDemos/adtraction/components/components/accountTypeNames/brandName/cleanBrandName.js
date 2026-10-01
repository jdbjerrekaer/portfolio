const BRAND_COUNTRY_CODES = new Set([
  "UK",
  "SE",
  "FI",
  "NO",
  "DK",
  "ES",
  "PL",
  "DE",
  "NL",
  "FR",
  "IT",
  "BE",
  "MX",
  "AT",
  "BG",
  "HR",
  "CY",
  "CZ",
  "EE",
  "GR",
  "HU",
  "IE",
  "LV",
  "LT",
  "LU",
  "MT",
  "PT",
  "RO",
  "SK",
  "SI"
]);
const TRAILING_PAREN_CODES_PATTERN = /\s*\((.*?)\)\s*$/;
const TRAILING_CODES_PATTERN =
  /\s*(?:[-\u2013\u2014]\s*)?([A-Za-z]{2,3}(?:\s*(?:&|\/|,|\s)\s*[A-Za-z]{2,3})*)\s*$/;

const isAllCodes = (value) => {
  if (!value) {
    return false;
  }
  const normalized = value
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\u2007/g, " ")
    .replace(/\u2009/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "")
    .replace(/[()]/g, "")
    .replace(/[&/,-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return false;
  }
  const tokens = normalized.split(" ");
  if (!tokens.length) {
    return false;
  }
  for (const token of tokens) {
    if (!BRAND_COUNTRY_CODES.has(token)) {
      return false;
    }
  }
  return true;
};

const stripTrailingCodesByTailScan = (value) => {
  if (!value) {
    return value;
  }
  const input = value
    .replace(/\u200B/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "");
  const chars = Array.from(input);
  let i = chars.length;
  let consumedAny = false;
  let cutIndex = i;

  const isUpperLetter = (char) =>
    char && char.toUpperCase() === char && char.toLowerCase() !== char;

  while (i > 0) {
    while (i > 0 && /\s/.test(chars[i - 1])) {
      i -= 1;
    }
    const end = i;
    let start = end;
    while (start > 0 && isUpperLetter(chars[start - 1])) {
      start -= 1;
      if (end - start > 3) {
        break;
      }
    }
    const tokenLen = end - start;
    if (tokenLen >= 2 && tokenLen <= 3) {
      const token = input.substring(start, end);
      if (BRAND_COUNTRY_CODES.has(token)) {
        consumedAny = true;
        cutIndex = start;
        while (start > 0) {
          const c = chars[start - 1];
          if (
            /\s/.test(c) ||
            c === "&" ||
            c === "/" ||
            c === "," ||
            c === "-" ||
            c === "\u2013" ||
            c === "\u2014"
          ) {
            start -= 1;
          } else {
            break;
          }
        }
        i = start;
        continue;
      }
    }
    break;
  }
  if (consumedAny) {
    return input.substring(0, cutIndex).trim();
  }
  return value;
};

export const cleanBrandNameValue = (name) => {
  if (name == null) {
    return null;
  }
  let cleaned = String(name).trim();
  cleaned = cleaned
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\u2007/g, " ")
    .replace(/\u2009/g, " ");
  cleaned = cleaned
    .replace(/\u200B/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200E/g, "")
    .replace(/\u200F/g, "");

  const parenMatch = cleaned.match(TRAILING_PAREN_CODES_PATTERN);
  if (parenMatch && isAllCodes(parenMatch[1])) {
    cleaned = cleaned.slice(0, parenMatch.index).trim();
  }

  const trailingMatch = cleaned.match(TRAILING_CODES_PATTERN);
  if (trailingMatch && isAllCodes(trailingMatch[1])) {
    cleaned = cleaned.slice(0, trailingMatch.index).trim();
  }

  const scanned = stripTrailingCodesByTailScan(cleaned);
  if (scanned !== cleaned) {
    cleaned = scanned;
  }

  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
};
