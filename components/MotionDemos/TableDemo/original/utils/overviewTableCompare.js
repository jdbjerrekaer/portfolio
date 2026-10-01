import { INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL } from "../constants/insightsMailSubscriptionMapping";

export const DEFAULT_COMPARABLE_METRIC_FIELDS = [
  "clicks",
  "visitors",
  "paidClicks",
  "conversions",
  "convRate",
  "epc",
  "commission",
  "orderValue",
  "aov"
];

export const COMPARE_FIELD_PREFIX = "compare_";
export const DELTA_FIELD_PREFIX = "delta_";
export const GROUP_COLUMN_PREFIX = "group_";
export const COMPARE_GROUP_COLUMN_PREFIX = "compare_group_";

export const normalizeCompareKeyPart = (value) => {
  if (value == null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue.length ? normalizedValue : null;
};

export const epiFieldForJoinKey = (value) => {
  const n = normalizeCompareKeyPart(value);
  return n == null ? "__empty__" : n;
};

export const joinCompareKeyParts = (...parts) => {
  const normalizedParts = parts.map(normalizeCompareKeyPart);

  if (normalizedParts.some((part) => part == null)) {
    return null;
  }

  return normalizedParts.join("::");
};

export const getOverviewCompareRowKey = (groupBy, row, rowIndex = null) => {
  const header = row?.header;

  if (!header) {
    return null;
  }

  switch (groupBy) {
    case "partner":
      return (
        normalizeCompareKeyPart(header.partnerId) ||
        normalizeCompareKeyPart(header.partnerName)
      );
    case "channel":
      return (
        normalizeCompareKeyPart(header.channelId) ||
        normalizeCompareKeyPart(header.channelUrl) ||
        joinCompareKeyParts(header.channelName, header.channelType)
      );
    case "epi":
      return joinCompareKeyParts(
        epiFieldForJoinKey(header.epi),
        epiFieldForJoinKey(header.epi2),
        epiFieldForJoinKey(header.epi3),
        epiFieldForJoinKey(header.epi4),
        epiFieldForJoinKey(header.epi5)
      );
    case "brandmaterial":
      return (
        normalizeCompareKeyPart(header.advertId) ||
        joinCompareKeyParts(header.advertType, header.countryCode)
      );
    case "day":
    case "week":
    case "month":
    case "hour":
      return rowIndex == null ? null : `time-index-${rowIndex}`;
    case "brand":
    default:
      return (
        normalizeCompareKeyPart(header.brandId) ||
        joinCompareKeyParts(header.brandName, header.countryCode)
      );
  }
};

export const getOverviewRowId = (groupBy, row) => {
  if (!row) {
    return null;
  }

  if (row._isSkeleton && typeof row._skeletonIndex === "number") {
    return `skeleton-${row._skeletonIndex}`;
  }

  const header = row.header;

  if (!header) {
    return row._compareKey || null;
  }

  switch (groupBy) {
    case "partner": {
      const partnerId =
        normalizeCompareKeyPart(header.partnerId) || normalizeCompareKeyPart(header.partnerName);
      return partnerId ? `partner-${partnerId}` : row._compareKey || null;
    }
    case "channel": {
      const channelId =
        normalizeCompareKeyPart(header.channelId) ||
        normalizeCompareKeyPart(header.channelUrl) ||
        joinCompareKeyParts(header.channelName, header.channelType);
      return channelId ? `channel-${channelId}` : row._compareKey || null;
    }
    case "epi":
      return (
        joinCompareKeyParts(
          "epi",
          epiFieldForJoinKey(header.epi),
          epiFieldForJoinKey(header.epi2),
          epiFieldForJoinKey(header.epi3),
          epiFieldForJoinKey(header.epi4),
          epiFieldForJoinKey(header.epi5)
        ) ||
        row._compareKey ||
        null
      );
    case "brandmaterial": {
      const materialId =
        normalizeCompareKeyPart(header.advertId) ||
        joinCompareKeyParts(header.advertType, header.countryCode);
      return materialId ? `brandmaterial-${materialId}` : row._compareKey || null;
    }
    case "day":
    case "week":
    case "month":
    case "hour":
      return normalizeCompareKeyPart(header.date)
        ? `${groupBy}-${header.date}`
        : row._compareKey || null;
    case "brand":
    default: {
      const brandId =
        normalizeCompareKeyPart(header.brandId) ||
        joinCompareKeyParts(header.brandName, header.countryCode);
      return brandId ? `brand-${brandId}` : row._compareKey || null;
    }
  }
};

export const getCompareFieldName = (field) => `${COMPARE_FIELD_PREFIX}${field}`;
export const getDeltaFieldName = (field) => `${DELTA_FIELD_PREFIX}${field}`;
export const getGroupColumnId = (field) => `${GROUP_COLUMN_PREFIX}${field}`;
export const getCompareGroupColumnId = (field) => `${COMPARE_GROUP_COLUMN_PREFIX}${field}`;

export const getDeltaColumnIds = (metricFields = DEFAULT_COMPARABLE_METRIC_FIELDS) =>
  metricFields.map((field) => getDeltaFieldName(field));

export const getPairedCompareColumns = (metricFields = DEFAULT_COMPARABLE_METRIC_FIELDS) =>
  metricFields.reduce((accumulator, field) => {
    accumulator[getCompareFieldName(field)] = field;
    accumulator[getDeltaFieldName(field)] = field;
    return accumulator;
  }, {});

export const DEFAULT_DELTA_COLUMN_IDS = getDeltaColumnIds();
export const DEFAULT_PAIRED_COMPARE_COLUMNS = getPairedCompareColumns();

export const resolveSharedDeltaColumnsHidden = (
  columnState = [],
  {
    deltaColumnIds = DEFAULT_DELTA_COLUMN_IDS,
    pairedCompareColumns = DEFAULT_PAIRED_COMPARE_COLUMNS,
    fallbackValue = false
  } = {}
) => {
  const stateById = new Map(columnState.map((state) => [state.colId, state]));

  for (const deltaColumnId of deltaColumnIds) {
    const deltaColumnState = stateById.get(deltaColumnId);
    const primaryColumnState = stateById.get(pairedCompareColumns[deltaColumnId]);

    if (!deltaColumnState || !primaryColumnState || primaryColumnState.hide) {
      continue;
    }

    return deltaColumnState.hide === true;
  }

  return fallbackValue;
};

export const calculateComparisonDelta = (primaryValue, compareValue) => {
  const numericPrimaryValue = Number(primaryValue);
  const numericCompareValue = Number(compareValue);

  if (!Number.isFinite(numericPrimaryValue) || !Number.isFinite(numericCompareValue)) {
    return null;
  }

  if (numericCompareValue === 0) {
    return numericPrimaryValue === 0 ? 0 : null;
  }

  return ((numericPrimaryValue - numericCompareValue) / Math.abs(numericCompareValue)) * 100;
};

export const getDeltaTooltipFormat = (field) => {
  if (field === "convRate" || field === "costOfSales") {
    return "percentage";
  }

  if (["epc", "commission", "orderValue", "aov", "cost"].includes(field)) {
    return "currency";
  }

  return "number";
};

export const getResponsiveColumnFlexValue = (column) => {
  if (typeof column?.flex === "number" && column.flex > 0) {
    return column.flex;
  }

  if (typeof column?.width === "string" && column.width.includes("%")) {
    return column.flex || 10;
  }

  return null;
};

const getResolvedPairedColumnWidth = ({
  primaryColId,
  compareColId,
  primaryState,
  compareState,
  resizeSourceColId
}) => {
  if (resizeSourceColId === compareColId && typeof compareState?.width === "number") {
    return compareState.width;
  }

  if (resizeSourceColId === primaryColId && typeof primaryState?.width === "number") {
    return primaryState.width;
  }

  if (typeof primaryState?.width === "number") {
    return primaryState.width;
  }

  if (typeof compareState?.width === "number") {
    return compareState.width;
  }

  return undefined;
};

export const buildPairedCompareColumnState = (
  columnState = [],
  pairedCompareColumns = DEFAULT_PAIRED_COMPARE_COLUMNS,
  { responsiveColumnFlexValues = {}, resizeSourceColId = null } = {}
) => {
  if (!Array.isArray(columnState) || columnState.length === 0) {
    return [];
  }

  const compareColumnIds = new Set(Object.keys(pairedCompareColumns));
  const responsiveColumnFlexMap = new Map(Object.entries(responsiveColumnFlexValues));
  const primaryToRelatedColumnsMap = new Map();
  const stateById = new Map(columnState.map((state) => [state.colId, state]));
  const orderedColIds = [];

  Object.entries(pairedCompareColumns).forEach(([pairedColId, primaryColId]) => {
    const existingRelatedColumns = primaryToRelatedColumnsMap.get(primaryColId) || {};

    primaryToRelatedColumnsMap.set(primaryColId, {
      ...existingRelatedColumns,
      [pairedColId.startsWith(DELTA_FIELD_PREFIX) ? "deltaColId" : "compareColId"]: pairedColId
    });
  });

  columnState.forEach((state) => {
    const colId = state.colId;

    if (compareColumnIds.has(colId)) {
      return;
    }

    const relatedColumns = primaryToRelatedColumnsMap.get(colId);

    if (!relatedColumns) {
      orderedColIds.push(colId);
      return;
    }

    if (relatedColumns.compareColId && stateById.has(relatedColumns.compareColId)) {
      orderedColIds.push(relatedColumns.compareColId);
    }

    orderedColIds.push(colId);

    if (relatedColumns.deltaColId && stateById.has(relatedColumns.deltaColId)) {
      orderedColIds.push(relatedColumns.deltaColId);
    }
  });

  return orderedColIds.map((colId) => {
    const state = stateById.get(colId);
    const compareColId = primaryToRelatedColumnsMap.get(colId)?.compareColId;

    if (!compareColumnIds.has(colId)) {
      if (!compareColId) {
        return state;
      }

      const compareState = stateById.get(compareColId);
      const responsiveFlexValue =
        responsiveColumnFlexMap.get(colId) ?? responsiveColumnFlexMap.get(compareColId);
      const primaryFlexValue =
        typeof state?.flex === "number" && state.flex > 0 ? state.flex : null;
      const sharedWidth = getResolvedPairedColumnWidth({
        primaryColId: colId,
        compareColId,
        primaryState: state,
        compareState,
        resizeSourceColId
      });

      if (!compareState) {
        return state;
      }

      if (typeof sharedWidth !== "number") {
        if (
          primaryFlexValue != null &&
          typeof responsiveFlexValue === "number" &&
          responsiveFlexValue > 0
        ) {
          return state;
        }

        return state;
      }

      return {
        ...state,
        width: sharedWidth,
        flex: null
      };
    }

    const primaryState = stateById.get(pairedCompareColumns[colId]);

    if (!primaryState) {
      return state;
    }

    const isDeltaColumn = colId.startsWith(DELTA_FIELD_PREFIX);
    const primaryFlexValue =
      typeof primaryState.flex === "number" && primaryState.flex > 0 ? primaryState.flex : null;
    const responsiveFlexValue =
      responsiveColumnFlexMap.get(colId) ??
      responsiveColumnFlexMap.get(pairedCompareColumns[colId]);
    const sharedWidth = getResolvedPairedColumnWidth({
      primaryColId: pairedCompareColumns[colId],
      compareColId: colId,
      primaryState,
      compareState: state,
      resizeSourceColId
    });

    if (
      !isDeltaColumn &&
      primaryFlexValue != null &&
      typeof responsiveFlexValue === "number" &&
      responsiveFlexValue > 0 &&
      typeof sharedWidth !== "number"
    ) {
      const nextState = {
        ...state,
        hide: primaryState.hide,
        pinned: primaryState.pinned,
        flex: responsiveFlexValue
      };

      delete nextState.width;

      return nextState;
    }

    return {
      ...state,
      hide: isDeltaColumn ? state?.hide : primaryState.hide,
      pinned: primaryState.pinned,
      width: isDeltaColumn ? state?.width : (sharedWidth ?? primaryState.width),
      flex: isDeltaColumn ? state?.flex : typeof sharedWidth === "number" ? null : primaryState.flex
    };
  });
};

export const normalizeOverviewCompareColumnState = (
  columnState = [],
  {
    pairedGroupColumns = {},
    pairedCompareColumns = DEFAULT_PAIRED_COMPARE_COLUMNS,
    pinnedGroupColumnIds = [],
    deltaColumnIds = DEFAULT_DELTA_COLUMN_IDS,
    sharedDeltaColumnsHidden = false,
    responsiveColumnFlexValues = {},
    resizeSourceColId = null
  } = {}
) => {
  const nextState = buildPairedCompareColumnState(
    columnState,
    {
      ...pairedCompareColumns,
      ...pairedGroupColumns
    },
    {
      responsiveColumnFlexValues,
      resizeSourceColId
    }
  );
  const deltaColumnIdSet = new Set(deltaColumnIds);
  const pinnedGroupColumnIdSet = new Set(pinnedGroupColumnIds);
  const stateById = new Map(nextState.map((state) => [state.colId, state]));

  return nextState.map((columnStateItem) => {
    let nextColumnState = columnStateItem;
    const responsiveFlexValue = responsiveColumnFlexValues[columnStateItem.colId];

    if (deltaColumnIdSet.has(columnStateItem.colId)) {
      const primaryColumnState = stateById.get(pairedCompareColumns[columnStateItem.colId]);

      nextColumnState = {
        ...nextColumnState,
        hide: Boolean(primaryColumnState?.hide) || sharedDeltaColumnsHidden
      };
    }

    if (pinnedGroupColumnIdSet.has(columnStateItem.colId)) {
      nextColumnState = {
        ...nextColumnState,
        pinned: "left"
      };
    }

    if (
      typeof responsiveFlexValue === "number" &&
      responsiveFlexValue > 0 &&
      typeof nextColumnState.flex === "number" &&
      nextColumnState.flex > 0
    ) {
      nextColumnState = {
        ...nextColumnState,
        flex: responsiveFlexValue
      };

      delete nextColumnState.width;
    }

    return nextColumnState;
  });
};

export const createOverviewComparisonLookup = (rows) => {
  const lookup = new Map();

  rows.forEach((row) => {
    if (row?._compareKey == null) {
      return;
    }

    const existingEntry = lookup.get(row._compareKey);

    if (!existingEntry) {
      lookup.set(row._compareKey, {
        row,
        isAmbiguous: false
      });
      return;
    }

    lookup.set(row._compareKey, {
      row: null,
      isAmbiguous: true
    });
  });

  return lookup;
};

const createEmptyCompareValues = (metricFields = DEFAULT_COMPARABLE_METRIC_FIELDS) =>
  metricFields.reduce((accumulator, field) => {
    accumulator[getCompareFieldName(field)] = null;
    accumulator[getDeltaFieldName(field)] = null;
    return accumulator;
  }, {});

const mergeOverviewRowWithCompareValues = (
  row,
  compareRow = null,
  metricFields = DEFAULT_COMPARABLE_METRIC_FIELDS
) => ({
  ...row,
  _hasCompareRow: Boolean(compareRow),
  compareHeader: compareRow?.header || null,
  ...metricFields.reduce((accumulator, field) => {
    const compareValue = compareRow ? (compareRow[field] ?? 0) : null;
    accumulator[getCompareFieldName(field)] = compareValue;
    accumulator[getDeltaFieldName(field)] =
      compareValue == null ? null : calculateComparisonDelta(row?.[field] ?? 0, compareValue);
    return accumulator;
  }, {})
});

export const mergeOverviewRows = ({
  groupBy,
  primaryRows,
  compareRows,
  showCompare,
  metricFields = DEFAULT_COMPARABLE_METRIC_FIELDS
}) => {
  if (!showCompare) {
    return primaryRows.map((row) => ({
      ...row,
      _hasCompareRow: false,
      ...createEmptyCompareValues(metricFields)
    }));
  }

  if (INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL.includes(groupBy)) {
    return primaryRows.map((row, rowIndex) =>
      mergeOverviewRowWithCompareValues(row, compareRows[rowIndex] ?? null, metricFields)
    );
  }

  const compareLookup = createOverviewComparisonLookup(compareRows);

  return primaryRows.map((row) => {
    const compareKey = row?._compareKey;
    const compareEntry = compareKey == null ? null : compareLookup.get(compareKey);
    const compareRow = compareEntry && !compareEntry.isAmbiguous ? compareEntry.row : null;
    return mergeOverviewRowWithCompareValues(row, compareRow, metricFields);
  });
};

export const calculateOverviewTotalsFromRows = (rows, fieldPrefix = "") => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const getFieldValue = (row, field, fallback = 0) => row?.[`${fieldPrefix}${field}`] ?? fallback;

  const totals = rows.reduce(
    (acc, row) => ({
      totalClicks: acc.totalClicks + getFieldValue(row, "clicks"),
      totalVisitors: acc.totalVisitors + getFieldValue(row, "visitors"),
      totalPaidClicks: acc.totalPaidClicks + getFieldValue(row, "paidClicks"),
      totalConversions: acc.totalConversions + getFieldValue(row, "conversions"),
      totalCommission: acc.totalCommission + getFieldValue(row, "commission"),
      totalCost: acc.totalCost + getFieldValue(row, "cost"),
      totalOrderValue: acc.totalOrderValue + getFieldValue(row, "orderValue")
    }),
    {
      totalClicks: 0,
      totalVisitors: 0,
      totalPaidClicks: 0,
      totalConversions: 0,
      totalCommission: 0,
      totalCost: 0,
      totalOrderValue: 0
    }
  );

  totals.totalConvRate =
    totals.totalVisitors > 0 ? (totals.totalConversions / totals.totalVisitors) * 100 : 0;
  totals.totalEpc =
    totals.totalVisitors > 0 && totals.totalCommission > 0
      ? totals.totalCommission / totals.totalVisitors
      : 0;
  totals.totalAov =
    totals.totalConversions > 0 && totals.totalOrderValue > 0
      ? totals.totalOrderValue / totals.totalConversions
      : 0;

  return totals;
};
