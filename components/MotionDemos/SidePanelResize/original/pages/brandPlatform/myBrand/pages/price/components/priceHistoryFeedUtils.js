import { formatCommissionValue, formatScheduledEffectiveDate } from "./scheduledChangeUtils";

const formatAmount = (value, isPercentage, currencyName) => {
  const formatted = formatCommissionValue(value);
  if (!formatted) return "—";
  if (isPercentage) return `${formatted}%`;
  return currencyName ? `${formatted} ${currencyName}` : formatted;
};

/**
 * Merge pending FutureCompensationSegment rows + applied Envers history into one feed.
 * Scheduled items come first (soonest effective date), then applied (newest first).
 */
export const buildPriceHistoryFeedItems = ({
  compensationSegmentId,
  historyEntries = [],
  futureSegments = [],
  liveValue,
  isPercentage = true,
  currencyName = "",
  t
}) => {
  const csId = String(compensationSegmentId ?? "");
  const scheduled = (futureSegments || [])
    .filter(
      (fcs) =>
        String(fcs.compensationsegment_id ?? fcs.compensationSegmentId ?? "") === csId
    )
    .map((fcs) => {
      const nextValue = fcs.value;
      const from = formatAmount(liveValue, isPercentage, currencyName);
      const to = formatAmount(
        nextValue,
        fcs.percentagecompensation !== false,
        fcs.currencyName || currencyName
      );
      const dateLabel = formatScheduledEffectiveDate(fcs.changedate, fcs.formattedChangeDate);
      const sortKey = fcs.changedate ? new Date(fcs.changedate).getTime() : Number.MAX_SAFE_INTEGER;

      return {
        kind: "scheduled",
        id: `scheduled-${fcs.futurecompensationsegment_id ?? fcs.compensationsegment_id}-${sortKey}`,
        sortKey,
        text: t("brands.myBrand.price.priceCard.historyScheduledSetting"),
        description: t("brands.myBrand.price.priceCard.historyScheduledChange", {
          from,
          to
        }),
        caption: t("brands.myBrand.price.priceCard.historyScheduledCaption", {
          date: dateLabel
        })
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);

  const applied = (historyEntries || []).map((entry, index) => {
    const change = (entry?.change || "").replace(/->/g, "→");
    const username = entry?.username || "";
    let caption = entry?.formattedDate || "";
    if (entry?.timestamp) {
      try {
        caption = new Date(entry.timestamp).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      } catch {
        // keep formattedDate
      }
    }

    return {
      kind: "applied",
      id: `applied-${entry.timestamp}-${entry.setting}-${index}`,
      sortKey: entry.timestamp != null ? -Number(entry.timestamp) : 0,
      text: entry.setting || "",
      description: change && username ? `${change} · ${username}` : change || username,
      caption
    };
  });

  // Scheduled block first, then applied (already newest-first from API sort)
  return [...scheduled, ...applied];
};
