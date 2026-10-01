/** Resolve current CS snapshot for a FutureCompensationSegment row. */
export const resolvePreviousSnapshot = (fcs, currentComps) => {
  const csId = fcs.compensationsegment_id ?? fcs.compensationSegmentId;
  if (csId == null) return null;

  const current = (currentComps || []).find(
    (c) => String(c.compensationSegmentId ?? c.compensationsegment_id) === String(csId)
  );
  if (!current) return null;

  if (fcs.productCategoryId || fcs.compensationGroupId) {
    const groups = current.compensationGroups || [];
    const group = groups.find(
      (g) =>
        String(g.productCategoryId) === String(fcs.productCategoryId) ||
        String(g.compensationGroupId) === String(fcs.compensationGroupId)
    );
    return {
      name: current.compensationName ?? current.compensation_name,
      value: group?.value ?? current.value,
      percentagecompensation:
        group?.affiliatePercentage ?? current.percentagecompensation !== false,
      currencyName: current.currencyName,
      commission: current.commission,
      percentagecommission: current.percentagecommission,
      threshold: null,
      productCategoryId: group?.productCategoryId ?? fcs.productCategoryId ?? null,
      productCategoryName: group?.productCategoryName ?? fcs.productCategoryName ?? null
    };
  }

  if (fcs.threshold != null || fcs.transactionamountcompensationId) {
    const thresholds = current.transactionAmountCompensations || [];
    const row = thresholds.find(
      (t) =>
        String(t.transactionamountcompensationId ?? t.transactionAmountCompensationId) ===
          String(fcs.transactionamountcompensationId) ||
        Number(t.threshold) === Number(fcs.threshold)
    );
    return {
      name: current.compensationName ?? current.compensation_name,
      value: row?.value ?? current.value,
      percentagecompensation: current.percentagecompensation !== false,
      currencyName: current.currencyName,
      commission: current.commission,
      percentagecommission: current.percentagecommission,
      threshold: row?.threshold ?? fcs.threshold ?? null,
      productCategoryId: null,
      productCategoryName: null
    };
  }

  return {
    name: current.compensationName ?? current.compensation_name,
    value: current.value,
    percentagecompensation: current.percentagecompensation !== false,
    currencyName: current.currencyName,
    commission: current.commission,
    percentagecommission: current.percentagecommission,
    threshold: null,
    productCategoryId: null,
    productCategoryName: null
  };
};

/** ≤100 → always 2 decimals; >100 → no forced decimals. */
export const formatCommissionValue = (value) => {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return Math.abs(n) > 100 ? String(n) : n.toFixed(2);
};

export const formatScheduledAmount = (value, isPercentage, currencyName) => {
  if (value == null || value === "") return "—";
  const formatted = formatCommissionValue(value);
  const unit = isPercentage ? "%" : currencyName || "";
  return unit ? `${formatted} ${unit}`.trim() : formatted;
};

/**
 * Build Label / Current / New rows for fields present on the scheduled change.
 * Fee row only when includeFee is true (platform-fee privilege).
 */
export const buildScheduledComparisonRows = (previous, next, { includeFee, t }) => {
  const rows = [];
  const dash = "—";

  const push = (label, currentVal, newVal, { onlyIfChanged = false } = {}) => {
    const currentText = currentVal == null || currentVal === "" ? dash : String(currentVal);
    const newText = newVal == null || newVal === "" ? dash : String(newVal);
    if (onlyIfChanged && currentText === newText) return;
    if (currentText === dash && newText === dash) return;
    rows.push({ label, current: currentText, next: newText });
  };

  push(
    t("brands.myBrand.price.priceCard.scheduledPopover.name"),
    previous?.name,
    next.name,
    { onlyIfChanged: true }
  );

  if (next.threshold != null || previous?.threshold != null) {
    push(
      t("brands.myBrand.price.priceCard.scheduledPopover.threshold"),
      previous?.threshold,
      next.threshold
    );
  }

  if (next.productCategoryId || previous?.productCategoryId) {
    push(
      t("brands.myBrand.price.priceCard.scheduledPopover.categoryId"),
      previous?.productCategoryId,
      next.productCategoryId
    );
  }

  if (next.productCategoryName || previous?.productCategoryName) {
    push(
      t("brands.myBrand.price.priceCard.scheduledPopover.categoryDescription"),
      previous?.productCategoryName,
      next.productCategoryName
    );
  }

  push(
    t("brands.myBrand.price.priceCard.scheduledPopover.partnerCommission"),
    formatScheduledAmount(
      previous?.value,
      previous?.percentagecompensation !== false,
      previous?.currencyName
    ),
    formatScheduledAmount(next.value, next.percentagecompensation !== false, next.currencyName)
  );

  if (includeFee) {
    const prevFee = Number(previous?.commission);
    const nextFee = Number(next.commission);
    const hasFee =
      (Number.isFinite(prevFee) && prevFee > 0) || (Number.isFinite(nextFee) && nextFee > 0);
    if (hasFee) {
      push(
        t("brands.myBrand.price.priceCard.scheduledPopover.networkFee"),
        formatScheduledAmount(
          previous?.commission,
          Boolean(previous?.percentagecommission),
          previous?.currencyName
        ),
        formatScheduledAmount(next.commission, Boolean(next.percentagecommission), next.currencyName)
      );
    }
  }

  return rows;
};

export const getScheduledDaysUntil = (changedate) => {
  if (!changedate) return null;
  const target = new Date(changedate);
  if (Number.isNaN(target.getTime())) return null;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);
  return Math.round((startOfTarget - startOfToday) / 86400000);
};

export const formatScheduledEffectiveDate = (changedate, formattedChangeDate) => {
  if (formattedChangeDate) return formattedChangeDate;
  if (!changedate) return "";
  const d = new Date(changedate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};
