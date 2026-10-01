// A brand id is only safe to send to a numeric BFF param if Spring can bind it to a Long.
// Sentinels like "ALL" reach these call sites from the aggregate row (ADTR-10328).
// Number("") and Number("  ") are both 0, so empty input must be rejected explicitly.
export const isNumericId = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  const str = String(value).trim();
  return str !== "" && Number.isFinite(Number(str));
};
