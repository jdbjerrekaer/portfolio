/** @typedef {{ limit: number|null, liveCount: number }} PromoCodePoolLimit */
/** @typedef {{ classification?: string, nonExclusive?: PromoCodePoolLimit, exclusive?: PromoCodePoolLimit }} PromoCodeLimits */

export const isPoolFull = (pool) =>
  pool != null && pool.limit != null && Number(pool.liveCount) >= Number(pool.limit);

export const isPoolLimited = (pool) => pool != null && pool.limit != null;

/** @returns {number|null} remaining slots, or null when the pool is unlimited / missing */
export const poolRemaining = (pool) => {
  if (!isPoolLimited(pool)) return null;
  return Math.max(0, Number(pool.limit) - Number(pool.liveCount || 0));
};

export const areBothPoolsFull = (limits) =>
  isPoolFull(limits?.nonExclusive) && isPoolFull(limits?.exclusive);

/**
 * Resolve i18n key for a save reject / blocked selection.
 * @returns {{ key: string, limit?: number } | null}
 */
export const limitMessageForSelection = (limits, exclusive) => {
  if (!limits) return null;
  const pool = exclusive ? limits.exclusive : limits.nonExclusive;
  if (!isPoolFull(pool)) return null;
  return {
    key: exclusive
      ? "brands.myBrand.promoCodes.limit.exclusiveReached"
      : "brands.myBrand.promoCodes.limit.nonExclusiveReached",
    limit: pool.limit
  };
};
