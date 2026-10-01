import React from "react";
import clsx from "clsx";
import { Badge, Tag } from "@adtraction/ui-components";
import { i18n } from "@adtraction/shared-i18n";
import { useTranslation } from "react-i18next";
import { isPoolLimited, poolRemaining } from "./promoCodeLimits";
import styles from "./PromoCodeLimitIndicators.module.scss";

/** Only surface pool remaining when it gets tight — higher counts are noise. */
const WARN_BELOW = 5;

const shouldShowRemaining = (remaining) => remaining != null && remaining < WARN_BELOW;

const PoolIndicator = ({ remaining, remainingKey, zeroKey, t }) => {
  if (!shouldShowRemaining(remaining)) return null;
  const content =
    remaining > 0 ? (
      <Tag size="small" text={t(remainingKey, { remaining })} />
    ) : (
      <Badge size="small" text={t(zeroKey)} className={styles.warning_badge} />
    );
  return <span className={styles.item}>{content}</span>;
};

/**
 * Compact Tag / warning-Badge strip for limited promo-code create pools.
 * Premium / unlimited pools render nothing. Each pool is gated on its own
 * remaining count — show only when that pool is below 5 (including 0).
 *
 * @param {{ classification?: string, nonExclusive?: { limit: number|null, liveCount: number }, exclusive?: { limit: number|null, liveCount: number } } | null | undefined} limits
 * @param {string} [className]
 */
export const PromoCodeLimitIndicators = ({ limits, className = "" }) => {
  const { t } = useTranslation(undefined, { i18n });
  if (!limits) return null;

  const nonExclusiveRemaining = isPoolLimited(limits.nonExclusive)
    ? poolRemaining(limits.nonExclusive)
    : null;
  const exclusiveRemaining = isPoolLimited(limits.exclusive)
    ? poolRemaining(limits.exclusive)
    : null;

  // Independent gates: e.g. 9 shared + 3 exclusive → only exclusive shows.
  const showShared = shouldShowRemaining(nonExclusiveRemaining);
  const showExclusive = shouldShowRemaining(exclusiveRemaining);

  if (!showShared && !showExclusive) {
    return null;
  }

  return (
    <div className={clsx(styles.strip, className)} aria-live="polite">
      {showShared ? (
        <PoolIndicator
          remaining={nonExclusiveRemaining}
          remainingKey="brands.myBrand.promoCodes.limit.remainingShared"
          zeroKey="brands.myBrand.promoCodes.limit.zeroShared"
          t={t}
        />
      ) : null}
      {showExclusive ? (
        <PoolIndicator
          remaining={exclusiveRemaining}
          remainingKey="brands.myBrand.promoCodes.limit.remainingExclusive"
          zeroKey="brands.myBrand.promoCodes.limit.zeroExclusive"
          t={t}
        />
      ) : null}
    </div>
  );
};

export default PromoCodeLimitIndicators;
