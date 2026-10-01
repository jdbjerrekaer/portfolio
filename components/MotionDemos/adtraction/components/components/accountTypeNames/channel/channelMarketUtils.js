export function normalizeMarketCode(market) {
  if (typeof market !== "string") return null;

  const upperCode = market.trim().toUpperCase();
  if (!upperCode) return null;
  if (upperCode === "UN" || upperCode === "UNITEDNATIONS") {
    return "UnitedNations";
  }
  if (upperCode === "EU" || upperCode === "EUROPEANUNION") {
    return "EuropeanUnion";
  }

  return upperCode;
}
