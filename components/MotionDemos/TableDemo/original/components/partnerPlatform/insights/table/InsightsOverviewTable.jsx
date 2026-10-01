import React, { useEffect, useState, useRef, useCallback, memo, useMemo, useContext } from "react";
import clsx from "clsx";
import {
  TableWrapper,
  AccountCell,
  TextCell,
  Badge,
  NumberCell,
  StatsBadgeCell,
  ChannelName,
  CompressedElements,
  CheckChip,
  InputSearch
} from "@adtraction/ui-components";
import { Flag } from "@adtraction/ui-flags";
import { Icons } from "@adtraction/ui-icons";
import { formatNumber } from "@adtraction/util-number";
import insightsAgent from "../../../../superagent/insightsAgent";
import {
  INSIGHTS_OVERVIEW_GROUP_BY,
  INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL,
  insightsOverviewGroupByToMailGroupByPeriod,
  getInsightsOverviewGroupByLabel,
  isInsightsOverviewIntervalGroupBy
} from "../../../../constants/insightsMailSubscriptionMapping";
import {
  MAIL_REPORT_TYPE_TREND,
  MAIL_REPORT_TYPE_CHANNEL,
  MAIL_REPORT_TYPE_PROGRAM
} from "../../../../constants/mailSubscriptionOptions";
import { toLocalYmd } from "../../../../utils/insightsMailDateRangePreset";
import { isNumericId } from "../../../../utils/isNumericId";
import { i18n } from "@adtraction/shared-i18n";
import { UserRoleContext } from "@adtraction/util-providers";
import { SUBAFFILIATE_ROLE, SUBPARTNER_PRIVILEGES } from "@adtraction/util-constants";
import { CONVERSION_STATUS_OPTIONS } from "../../../../constants/statusOptions";
import "../../../../i18n/initialize";
import { PARTNER_OVERVIEW_METRIC_FIELDS } from "../../../../constants/partnerOverviewMetricColumns";
import {
  buildAdjustmentExportRowSpecs,
  buildOverviewExportRows
} from "../../../../utils/overviewExportRows";
import styles from "./InsightsOverviewTable.module.scss";

const COMPARABLE_METRIC_FIELDS = PARTNER_OVERVIEW_METRIC_FIELDS;

const COMPARE_FIELD_PREFIX = "compare_";
const DELTA_FIELD_PREFIX = "delta_";
const GROUP_COLUMN_PREFIX = "group_";
const COMPARE_GROUP_COLUMN_PREFIX = "compare_group_";
const FILTER_CHIP_ICON_SIZE = 12;
const COMPARE_HIGHLIGHT_WRAPPER_CLASS = "insights-overview-compare-soft";
const DELTA_COLUMN_MIN_WIDTH = 96;
const DELTA_COLUMN_MAX_AUTO_WIDTH = 150;
const COMMISSION_FILTER_CLICK_DERIVED_FIELDS = new Set([
  "clicks",
  "visitors",
  "paidClicks",
  "convRate",
  "epc"
]);
const COMMISSION_FILTER_WARNING_EXIT_MS = 160;

const formatLocalDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getSemanticPeriodLabel = (role, label) => {
  const normalizedLabel = typeof label === "string" ? label.trim() : "";
  return normalizedLabel ? `${role}: ${normalizedLabel}` : role;
};

const normalizeFilterChipIcon = (icon) => {
  if (!React.isValidElement(icon)) {
    return icon;
  }

  return React.cloneElement(icon, {
    width: FILTER_CHIP_ICON_SIZE,
    height: FILTER_CHIP_ICON_SIZE
  });
};

const normalizeCompareKeyPart = (value) => {
  if (value == null) {
    return null;
  }

  const normalizedValue = String(value).trim();
  return normalizedValue.length ? normalizedValue : null;
};

const epiFieldForJoinKey = (value) => {
  const n = normalizeCompareKeyPart(value);
  return n == null ? "__empty__" : n;
};

const joinCompareKeyParts = (...parts) => {
  const normalizedParts = parts.map(normalizeCompareKeyPart);

  if (normalizedParts.some((part) => part == null)) {
    return null;
  }

  return normalizedParts.join("::");
};

const getOverviewCompareRowKey = (groupBy, row, rowIndex = null) => {
  const header = row?.header;

  if (!header) {
    return null;
  }

  switch (groupBy) {
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
      return joinCompareKeyParts(header.advertType, header.countryCode);
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

const getOverviewRowId = (groupBy, row) => {
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
    case "brandmaterial":
      return (
        joinCompareKeyParts("brandmaterial", header.advertType, header.countryCode) ||
        row._compareKey ||
        null
      );
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

const getCompareFieldName = (field) => `${COMPARE_FIELD_PREFIX}${field}`;
const getDeltaFieldName = (field) => `${DELTA_FIELD_PREFIX}${field}`;
const getGroupColumnId = (field) => `${GROUP_COLUMN_PREFIX}${field}`;
const getCompareGroupColumnId = (field) => `${COMPARE_GROUP_COLUMN_PREFIX}${field}`;
const DEFAULT_MAIL_SUBSCRIPTION_SORT = Object.freeze({
  sortColumn: "commission",
  sortDirection: "desc"
});
const DELTA_COLUMN_IDS = COMPARABLE_METRIC_FIELDS.map((field) => getDeltaFieldName(field));
const DEFAULT_PAIRED_COMPARE_COLUMNS = COMPARABLE_METRIC_FIELDS.reduce((accumulator, field) => {
  accumulator[getCompareFieldName(field)] = field;
  accumulator[getDeltaFieldName(field)] = field;
  return accumulator;
}, {});

const normalizeMailSubscriptionSortDirection = (sortDirection) =>
  String(sortDirection || "").toLowerCase() === "asc" ? "asc" : "desc";

const mapOverviewColumnIdToMailSubscriptionSortColumn = (colId) => {
  if (!colId) {
    return null;
  }

  let normalizedColId = String(colId);
  if (normalizedColId.startsWith(COMPARE_GROUP_COLUMN_PREFIX)) {
    normalizedColId = `${GROUP_COLUMN_PREFIX}${normalizedColId.slice(COMPARE_GROUP_COLUMN_PREFIX.length)}`;
  }
  if (normalizedColId.startsWith(COMPARE_FIELD_PREFIX)) {
    normalizedColId = normalizedColId.slice(COMPARE_FIELD_PREFIX.length);
  }
  if (normalizedColId.startsWith(DELTA_FIELD_PREFIX)) {
    normalizedColId = normalizedColId.slice(DELTA_FIELD_PREFIX.length);
  }

  if (normalizedColId.startsWith(GROUP_COLUMN_PREFIX)) {
    const groupColumn = normalizedColId.slice(GROUP_COLUMN_PREFIX.length);
    if (INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL.includes(groupColumn)) {
      return "date";
    }
    return groupColumn;
  }

  return normalizedColId;
};

export const getMailSubscriptionSortFromColumnState = (columnState = []) => {
  if (!Array.isArray(columnState)) {
    return DEFAULT_MAIL_SUBSCRIPTION_SORT;
  }

  const activeSort = columnState
    .filter((column) => column?.sort)
    .sort((left, right) => {
      const leftIndex = Number.isFinite(left.sortIndex) ? left.sortIndex : Number.MAX_SAFE_INTEGER;
      const rightIndex = Number.isFinite(right.sortIndex) ? right.sortIndex : Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    })[0];

  const sortColumn = mapOverviewColumnIdToMailSubscriptionSortColumn(activeSort?.colId);
  if (!sortColumn) {
    return DEFAULT_MAIL_SUBSCRIPTION_SORT;
  }

  return {
    sortColumn,
    sortDirection: normalizeMailSubscriptionSortDirection(activeSort.sort)
  };
};

const resolveSharedDeltaColumnsHidden = (
  columnState = [],
  {
    deltaColumnIds = DELTA_COLUMN_IDS,
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

const calculateComparisonDelta = (primaryValue, compareValue) => {
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

const getDeltaTooltipFormat = (field) => {
  if (field === "convRate") {
    return "percentage";
  }

  if (["epc", "commission", "orderValue", "aov"].includes(field)) {
    return "currency";
  }

  return "number";
};

const getResponsiveColumnFlexValue = (column) => {
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

export const normalizeOverviewCompareColumnState = (
  columnState = [],
  {
    pairedGroupColumns = {},
    pinnedGroupColumnIds = [],
    deltaColumnIds = DELTA_COLUMN_IDS,
    sharedDeltaColumnsHidden = false,
    responsiveColumnFlexValues = {},
    resizeSourceColId = null
  } = {}
) => {
  const nextState = buildPairedCompareColumnState(
    columnState,
    {
      ...DEFAULT_PAIRED_COMPARE_COLUMNS,
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
      const primaryColumnState = stateById.get(
        DEFAULT_PAIRED_COMPARE_COLUMNS[columnStateItem.colId]
      );

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

const createEmptyCompareValues = () =>
  COMPARABLE_METRIC_FIELDS.reduce((accumulator, field) => {
    accumulator[getCompareFieldName(field)] = null;
    accumulator[getDeltaFieldName(field)] = null;
    return accumulator;
  }, {});

const mergeOverviewRowWithCompareValues = (row, compareRow = null) => ({
  ...row,
  _hasCompareRow: Boolean(compareRow),
  compareHeader: compareRow?.header || null,
  ...COMPARABLE_METRIC_FIELDS.reduce((accumulator, field) => {
    const compareValue = compareRow ? (compareRow[field] ?? 0) : null;
    accumulator[getCompareFieldName(field)] = compareValue;
    accumulator[getDeltaFieldName(field)] =
      compareValue == null ? null : calculateComparisonDelta(row?.[field] ?? 0, compareValue);
    return accumulator;
  }, {})
});

export const mergeOverviewRows = ({ groupBy, primaryRows, compareRows, showCompare }) => {
  if (!showCompare) {
    return primaryRows.map((row) => ({
      ...row,
      _hasCompareRow: false,
      ...createEmptyCompareValues()
    }));
  }

  if (INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL.includes(groupBy)) {
    return primaryRows.map((row, rowIndex) =>
      mergeOverviewRowWithCompareValues(row, compareRows[rowIndex] ?? null)
    );
  }

  const compareLookup = createOverviewComparisonLookup(compareRows);

  return primaryRows.map((row) => {
    const compareKey = row?._compareKey;
    const compareEntry = compareKey == null ? null : compareLookup.get(compareKey);
    const compareRow = compareEntry && !compareEntry.isAmbiguous ? compareEntry.row : null;
    return mergeOverviewRowWithCompareValues(row, compareRow);
  });
};

const EPI_SEARCH_HEADER_FIELDS = ["epi", "epi2", "epi3", "epi4", "epi5"];

export const epiOverviewRowMatchesSearch = (row, searchText) => {
  const query = typeof searchText === "string" ? searchText.trim() : "";
  if (!query) {
    return true;
  }

  const header = row?.header;
  if (!header) {
    return false;
  }

  const terms = query
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const fieldValues = EPI_SEARCH_HEADER_FIELDS.map((field) =>
    String(header[field] ?? "").toLowerCase()
  );

  return terms.some((term) => fieldValues.some((value) => value.includes(term)));
};

export const filterEpiOverviewRows = (rows, searchText) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  const query = typeof searchText === "string" ? searchText.trim() : "";
  if (!query) {
    return rows;
  }

  return rows.filter((row) => epiOverviewRowMatchesSearch(row, searchText));
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
      totalOrderValue: acc.totalOrderValue + getFieldValue(row, "orderValue")
    }),
    {
      totalClicks: 0,
      totalVisitors: 0,
      totalPaidClicks: 0,
      totalConversions: 0,
      totalCommission: 0,
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

const getDefaultPinnedOverviewGroupColumnIds = (groupBy) => {
  switch (groupBy) {
    case "channel":
      return ["channel"];
    case "epi":
      return ["epi"];
    case "day":
      return ["date"];
    case "week":
      return ["week"];
    case "month":
      return ["month"];
    case "hour":
      return ["hour"];
    case "brand":
    default:
      return ["brand"];
  }
};

export const buildOverviewGroupColumnDefinitions = ({
  groupBy,
  showCompare,
  compareColumnLabel,
  primaryColumnLabel,
  countryId,
  epiColumns,
  fetchBrandDetails,
  brandDetailsLoadingRef,
  brandDetailsCacheRef
}) => {
  const defaultPinnedGroupColumnIds = new Set(getDefaultPinnedOverviewGroupColumnIds(groupBy));
  const duplicateGroupColumnsForCompare =
    showCompare && INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL.includes(groupBy);
  const withHeaderVariant = (params, variant = "primary") => ({
    ...params,
    data: {
      ...params.data,
      header: variant === "compare" ? params.data?.compareHeader : params.data?.header
    }
  });

  const createGroupColumn = (column, variant = "primary") => ({
    ...column,
    colId: variant === "compare" ? getCompareGroupColumnId(column.id) : getGroupColumnId(column.id),
    field: variant === "compare" ? "compareHeader" : column.field,
    pinned:
      showCompare || defaultPinnedGroupColumnIds.has(column.id) ? "left" : (column.pinned ?? null),
    subHeaderText: duplicateGroupColumnsForCompare
      ? variant === "compare"
        ? compareColumnLabel
        : primaryColumnLabel
      : null,
    showInColumnChooser: variant === "compare" ? false : column.showInColumnChooser,
    cellRenderer:
      column.renderWithHeaderVariant && typeof column.cellRenderer === "function"
        ? (params) => column.cellRenderer(withHeaderVariant(params, variant))
        : column.cellRenderer,
    valueGetter: column.valueGetter
      ? (params) => column.valueGetter(withHeaderVariant(params, variant))
      : undefined,
    comparator: column.comparator
      ? (valueA, valueB, nodeA, nodeB) =>
          column.comparator(
            valueA,
            valueB,
            {
              data: {
                ...nodeA.data,
                header: variant === "compare" ? nodeA.data?.compareHeader : nodeA.data?.header
              }
            },
            {
              data: {
                ...nodeB.data,
                header: variant === "compare" ? nodeB.data?.compareHeader : nodeB.data?.header
              }
            }
          )
      : undefined,
    cellRendererParams: column.cellRendererParams
      ? (params) => column.cellRendererParams(withHeaderVariant(params, variant))
      : undefined
  });

  const groupColumns = [];

  switch (groupBy) {
    case "channel":
      groupColumns.push({
        id: "channel",
        field: "header",
        headerName: i18n.t("insights.insightsPage.table.channel"),
        align: "left",
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250,
        renderWithHeaderVariant: true,
        valueGetter: (params) => params.data?.header?.channelName,
        cellRenderer: (params) => {
          if (!params.data?.header?.channelName) return null;
          return (
            <div className={styles.insightsChannelCell}>
              <ChannelName
                channelName={params.data?.header?.channelName}
                channelUrl={params.data?.header?.channelUrl}
                channelId={params.data?.header?.channelId}
                previewChannels={true}
                channelMarkets={params.data?.header?.channelMarkets || []}
                channelType={params.data?.header?.channelType?.toLowerCase() || ""}
                preferredMarket={countryId}
                tooltipInteractive={false}
              />
            </div>
          );
        }
      });
      break;
    case "epi":
      groupColumns.push({
        id: "epi",
        field: "header",
        headerName: i18n.t("insights.insightsPage.table.epi"),
        align: "left",
        cellRenderer: TextCell,
        valueGetter: (params) => params.data?.header?.epi,
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });

      if (epiColumns.epi2) {
        groupColumns.push({
          id: "epi2",
          field: "header",
          headerName: i18n.t("insights.insightsPage.table.epi2"),
          align: "left",
          cellRenderer: TextCell,
          valueGetter: (params) => params.data?.header?.epi2,
          sortable: true,
          suppressMovable: true,
          lockPosition: true,
          flex: 1,
          minWidth: 120
        });
      }

      if (epiColumns.epi3) {
        groupColumns.push({
          id: "epi3",
          field: "header",
          headerName: i18n.t("insights.insightsPage.table.epi3"),
          align: "left",
          cellRenderer: TextCell,
          valueGetter: (params) => params.data?.header?.epi3,
          sortable: true,
          suppressMovable: true,
          lockPosition: true,
          flex: 1,
          minWidth: 120
        });
      }

      if (epiColumns.epi4) {
        groupColumns.push({
          id: "epi4",
          field: "header",
          headerName: i18n.t("insights.insightsPage.table.epi4"),
          align: "left",
          cellRenderer: TextCell,
          valueGetter: (params) => params.data?.header?.epi4,
          sortable: true,
          suppressMovable: true,
          lockPosition: true,
          flex: 1,
          minWidth: 120
        });
      }

      if (epiColumns.epi5) {
        groupColumns.push({
          id: "epi5",
          field: "header",
          headerName: i18n.t("insights.insightsPage.table.epi5"),
          align: "left",
          cellRenderer: TextCell,
          valueGetter: (params) => params.data?.header?.epi5,
          sortable: true,
          suppressMovable: true,
          lockPosition: true,
          flex: 1,
          minWidth: 120
        });
      }
      break;
    case "brandmaterial":
      groupColumns.push({
        id: "brandmaterial",
        field: "header",
        headerName: i18n.t("insights.insightsPage.table.brandMaterial"),
        align: "left",
        cellRenderer: TextCell,
        valueGetter: (params) => params.data?.header?.advertType,
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });
      break;
    case "day":
      groupColumns.push({
        id: "date",
        field: "date",
        headerName: i18n.t("insights.insightsPage.table.date"),
        align: "left",
        sort: ["hour", "day", "week", "month"].includes(groupBy) ? "asc" : null,
        cellRenderer: TextCell,
        valueGetter: (params) => {
          const dateStr = params.data?.header?.date;
          if (!dateStr) return "";
          const date = new Date(dateStr);
          return date.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long"
          });
        },
        comparator: (valueA, valueB, nodeA, nodeB) => {
          const dateA = new Date(nodeA.data?.header?.date);
          const dateB = new Date(nodeB.data?.header?.date);
          return dateA - dateB;
        },
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });
      break;
    case "week":
      groupColumns.push({
        id: "week",
        field: "date",
        headerName: i18n.t("insights.insightsPage.table.week"),
        align: "left",
        sort: ["hour", "day", "week", "month"].includes(groupBy) ? "asc" : null,
        cellRenderer: TextCell,
        valueGetter: (params) => {
          const weekStr = params.data?.header?.date;
          if (!weekStr) return "";
          if (weekStr.includes("-W")) {
            const [year, week] = weekStr.split("-W");
            return `Week ${parseInt(week)}, ${year}`;
          }
          return weekStr;
        },
        comparator: (valueA, valueB, nodeA, nodeB) => {
          const weekA = nodeA.data?.header?.date;
          const weekB = nodeB.data?.header?.date;
          if (!weekA || !weekB) return 0;
          return weekA.localeCompare(weekB);
        },
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });
      break;
    case "month":
      groupColumns.push({
        id: "month",
        field: "date",
        headerName: i18n.t("insights.insightsPage.table.month"),
        align: "left",
        sort: ["hour", "day", "week", "month"].includes(groupBy) ? "asc" : null,
        cellRenderer: TextCell,
        valueGetter: (params) => {
          const dateStr = params.data?.header?.date;
          if (!dateStr) return "";
          const date = new Date(dateStr);
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long"
          });
        },
        comparator: (valueA, valueB, nodeA, nodeB) => {
          const dateA = new Date(nodeA.data?.header?.date);
          const dateB = new Date(nodeB.data?.header?.date);
          return dateA - dateB;
        },
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });
      break;
    case "hour":
      groupColumns.push({
        id: "hour",
        field: "date",
        headerName: i18n.t("insights.insightsPage.table.hour"),
        align: "left",
        sort: ["hour", "day", "week", "month"].includes(groupBy) ? "asc" : null,
        cellRenderer: TextCell,
        valueGetter: (params) => {
          const hourStr = params.data?.header?.date;
          if (!hourStr) return "";
          return hourStr.includes(":") ? hourStr : `${hourStr}:00`;
        },
        comparator: (valueA, valueB, nodeA, nodeB) => {
          const dateA = new Date(nodeA.data?.header?.date);
          const dateB = new Date(nodeB.data?.header?.date);
          return dateA - dateB;
        },
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });
      break;
    case "brand":
    default:
      groupColumns.push({
        id: "brand",
        field: "header",
        headerName: i18n.t("insights.insightsPage.table.brand"),
        align: "left",
        valueGetter: (params) => params.data?.header?.brandName,
        cellRenderer: AccountCell,
        cellRendererParams: (params) => {
          const brandIdValue = params.data?.header?.brandId;
          const cached =
            brandIdValue != null ? brandDetailsCacheRef?.current?.get(brandIdValue) : null;
          const category = cached?.category ?? params.data?.header?.category ?? null;
          const serviceLevel = cached?.serviceLevel ?? params.data?.header?.serviceLevel ?? null;
          const brandDetailsLoaded =
            cached?.brandDetailsLoaded ?? params.data?.header?.brandDetailsLoaded ?? false;
          const isLoadingDetails =
            isNumericId(brandIdValue) &&
            (category == null ||
              !brandDetailsLoaded ||
              brandDetailsLoadingRef.current.get(brandIdValue) === true);

          return {
            brand: {
              brandName: params.data?.header?.brandName,
              brandCountry: params.data?.header?.countryCode,
              brandId: brandIdValue,
              category,
              serviceLevel,
              isLoadingDetails,
              onBrandHover: fetchBrandDetails
            },
            brandName: params.data?.header?.brandName,
            brandCountry: params.data?.header?.countryCode,
            brandId: brandIdValue,
            category,
            serviceLevel,
            isLoadingDetails,
            onBrandHover: fetchBrandDetails
          };
        },
        sortable: true,
        suppressMovable: true,
        lockPosition: true,
        flex: 1,
        minWidth: 250
      });
      break;
  }

  if (!showCompare) {
    return groupColumns.map((column) => createGroupColumn(column, "primary"));
  }

  if (!duplicateGroupColumnsForCompare) {
    return groupColumns.map((column) => createGroupColumn(column, "primary"));
  }

  return groupColumns.flatMap((column) => [
    createGroupColumn(column, "compare"),
    createGroupColumn(column, "primary")
  ]);
};

const InsightsOverviewTable = memo(
  ({
    countryId = null,
    channelId = null,
    brandId = null,
    startDate = null,
    endDate = null,
    compareStartDate = null,
    compareEndDate = null,
    showCompare = false,
    canShowCompare = false,
    onShowCompareChange = null,
    primaryColumnLabel = i18n.t("insights.overviewTable.primaryPeriod"),
    compareColumnLabel = i18n.t("insights.overviewTable.comparePeriod"),
    groupBy = INSIGHTS_OVERVIEW_GROUP_BY.BRAND,
    currencyCode = null,
    availableCountries = [],
    availableChannels = [],
    compensationId = null,
    compensationName = null,
    isInitialized = false,
    includeEmptyRows = false,
    selectedConversionStatus,
    fullscreenTopContent = null,
    tableId = "insightsOverviewTable",
    title = null,
    onRemoveActiveFilter = null,
    onGridApiReady = null,
    onRowDataChange = null,
    includeAdjustments = false,
    onAdjustmentsChange = null,
    adjustmentsExport = null,
    onTotalsLoaded = null
  }) => {
    const [channelName, setChannelName] = useState("");
    const [channelType, setChannelType] = useState(null);
    const [advertiserName, setAdvertiserName] = useState("");
    const [advertiserCountry, setAdvertiserCountry] = useState("");
    const [channelCountry, setChannelCountry] = useState("");
    const [totalRowCount, setTotalRowCount] = useState(0);
    const [limitExceeded, setLimitExceeded] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [apiTotals, setApiTotals] = useState(null);
    const [compareApiTotals, setCompareApiTotals] = useState(null);
    const currentTooltipLabel = getSemanticPeriodLabel(i18n.t("insights.overviewTable.tooltipCurrent"), primaryColumnLabel);
    const baselineTooltipLabel = getSemanticPeriodLabel(i18n.t("insights.overviewTable.tooltipBaseline"), compareColumnLabel);
    const [rowData, setRowData] = useState([]);
    const isCommissionFiltered = compensationId != null && String(compensationId).trim() !== "";
    const [renderCommissionFilterWarning, setRenderCommissionFilterWarning] =
      useState(isCommissionFiltered);

    // Memoize the default selectedConversionStatus to prevent infinite loops
    const stableSelectedConversionStatus = useMemo(
      () => selectedConversionStatus || [],
      [selectedConversionStatus]
    );

    useEffect(() => {
      if (isCommissionFiltered) {
        setRenderCommissionFilterWarning(true);
        return undefined;
      }

      if (!renderCommissionFilterWarning) {
        return undefined;
      }

      const timeoutId = setTimeout(() => {
        setRenderCommissionFilterWarning(false);
      }, COMMISSION_FILTER_WARNING_EXIT_MS);

      return () => clearTimeout(timeoutId);
    }, [isCommissionFiltered, renderCommissionFilterWarning]);

    const mailSubscriptionCountryId = useMemo(() => {
      if (!countryId) return null;
      const country = availableCountries.find(
        (c) => c.value == countryId || c.isocode === countryId || c.countryCode === countryId
      );
      if (country && (country.value != null || country.id != null)) {
        return Number(country.value ?? country.id);
      }
      return null;
    }, [countryId, availableCountries]);

    const groupByLabel = useMemo(() => getInsightsOverviewGroupByLabel(groupBy), [groupBy]);

    const userRoleContext = useContext(UserRoleContext);
    const privileges = userRoleContext?.privileges ?? [];
    const isSubAffiliateUser = userRoleContext?.user === SUBAFFILIATE_ROLE;
    const canSubscribeToMailReports =
      !isSubAffiliateUser || privileges.includes(SUBPARTNER_PRIVILEGES.ALLOW_SUB_AFFILIATE_REPORTS);
    const currentUserEmail =
      userRoleContext?.userInfo?.sessionEmail || userRoleContext?.userInfo?.email || "";

    const [isLoading, setIsLoading] = useState(true);
    const [brandDetailsCache, setBrandDetailsCache] = useState(new Map());
    const brandDetailsCacheRef = useRef(new Map());
    const [epiColumns, setEpiColumns] = useState({
      epi: true,
      epi2: false,
      epi3: false,
      epi4: false,
      epi5: false
    });
    const [epiSearchText, setEpiSearchText] = useState("");
    // Only use ref for loading state to avoid re-renders - loading state is tracked in rowData.header.brandDetailsLoaded
    const brandDetailsLoadingRef = useRef(new Map());

    const defaultStartDate = useMemo(() => {
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return oneWeekAgo;
    }, []);

    const defaultEndDate = useMemo(() => new Date(), []);
    const effectiveStartDate = startDate || defaultStartDate;
    const effectiveEndDate = endDate || defaultEndDate;

    const gridApiRef = useRef(null);
    const isSyncingCompareColumnsRef = useRef(false);
    const lastLoadParamsRef = useRef(null);
    const loadTimeoutRef = useRef(null);
    // Request version counter to handle race conditions - discard responses from stale requests
    const requestVersionRef = useRef(0);
    const shouldLoadCompareData = showCompare && compareStartDate && compareEndDate;

    useEffect(() => {
      onRowDataChange?.(rowData);
    }, [onRowDataChange, rowData]);

    useEffect(() => {
      onTotalsLoaded?.(apiTotals);
    }, [onTotalsLoaded, apiTotals]);

    const generateMissingRows = useCallback((existingRows, startDate, currentGroupBy) => {
      // Only generate missing rows for time-based groupBy values
      if (!INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL.includes(currentGroupBy)) {
        return existingRows;
      }

      // Generate 7 consecutive days starting from startDate
      const allDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        allDays.push(formatLocalDate(date));
      }

      // Create a map of existing data by date
      const existingDataMap = new Map();
      existingRows.forEach((row) => {
        existingDataMap.set(row.header.date, row);
      });

      // Fill missing days with zero data
      return allDays.map((day) => {
        if (existingDataMap.has(day)) {
          return existingDataMap.get(day);
        }

        return {
          header: { date: day },
          clicks: 0,
          visitors: 0,
          conversions: 0,
          convRate: 0,
          epc: 0,
          commission: 0
        };
      });
    }, []);

    const formatApiTotals = useCallback((totals, compareTotals = null) => {
      if (!totals) return null;

      const primaryTotalsMap = {
        clicks: totals.totalClicks || 0,
        visitors: totals.totalVisitors || 0,
        paidClicks: totals.totalPaidClicks || 0,
        conversions: totals.totalConversions || 0,
        convRate: totals.totalConvRate ?? 0,
        epc: totals.totalEpc ?? 0,
        commission: totals.totalCommission || 0,
        orderValue: totals.totalOrderValue ?? 0,
        aov: totals.totalAov ?? 0
      };

      const compareTotalsMap = {
        clicks: compareTotals?.totalClicks,
        visitors: compareTotals?.totalVisitors,
        paidClicks: compareTotals?.totalPaidClicks,
        conversions: compareTotals?.totalConversions,
        convRate: compareTotals?.totalConvRate,
        epc: compareTotals?.totalEpc,
        commission: compareTotals?.totalCommission,
        orderValue: compareTotals?.totalOrderValue,
        aov: compareTotals?.totalAov
      };

      const formattedTotals = {
        ...primaryTotalsMap,
        ...COMPARABLE_METRIC_FIELDS.reduce((accumulator, field) => {
          const compareValue = compareTotals == null ? null : (compareTotalsMap[field] ?? 0);
          accumulator[getCompareFieldName(field)] = compareValue;
          accumulator[getDeltaFieldName(field)] =
            compareValue == null
              ? null
              : calculateComparisonDelta(primaryTotalsMap[field], compareValue);
          return accumulator;
        }, {}),
        _hasCompareRow: Boolean(compareTotals)
      };

      if (isCommissionFiltered) {
        COMMISSION_FILTER_CLICK_DERIVED_FIELDS.forEach((field) => {
          formattedTotals[field] = null;
          formattedTotals[getCompareFieldName(field)] = null;
          formattedTotals[getDeltaFieldName(field)] = null;
        });
      }

      return formattedTotals;
    }, [isCommissionFiltered]);

    const mapOverviewItemToRow = useCallback((item, currentGroupBy) => {
      switch (currentGroupBy) {
        case "brand": {
          const cachedDetails = brandDetailsCacheRef.current.get(item.accountBrandId);
          return {
            header: {
              brandName: item.accountBrandName,
              countryCode: item.accountCountryCode,
              brandId: item.accountBrandId,
              category: cachedDetails?.category,
              serviceLevel: cachedDetails?.serviceLevel,
              brandDetailsLoaded: cachedDetails?.brandDetailsLoaded ?? false
            },
            clicks: item.clicks || 0,
            visitors: item.visitors || 0,
            paidClicks: item.paidClicks ?? 0,
            conversions: item.conversions || 0,
            convRate: item.convRate || 0,
            epc: item.epc || 0,
            commission: item.commission || 0,
            orderValue: item.orderValue ?? 0,
            aov: item.aov ?? 0
          };
        }
        case "channel":
          return {
            header: {
              channelId: item.channelId,
              channelName: item.channelName,
              channelUrl: item.channelUrl,
              channelMarkets: item.channelMarkets || [],
              channelType: item.channelType || ""
            },
            clicks: item.clicks || 0,
            visitors: item.visitors || 0,
            paidClicks: item.paidClicks ?? 0,
            conversions: item.conversions || 0,
            convRate: item.convRate || 0,
            epc: item.epc || 0,
            commission: item.commission || 0,
            orderValue: item.orderValue ?? 0,
            aov: item.aov ?? 0
          };
        case "epi":
          return {
            header: {
              epi: item.epi || "",
              epi2: item.epi2 || "",
              epi3: item.epi3 || "",
              epi4: item.epi4 || "",
              epi5: item.epi5 || ""
            },
            clicks: item.clicks || 0,
            visitors: item.visitors || 0,
            paidClicks: item.paidClicks ?? 0,
            conversions: item.conversions || 0,
            convRate: item.convRate || 0,
            epc: item.epc || 0,
            commission: item.commission || 0,
            orderValue: item.orderValue ?? 0,
            aov: item.aov ?? 0
          };
        case "brandmaterial":
          return {
            header: {
              advertType: item.advertType,
              countryCode: item.accountCountryCode
            },
            clicks: item.clicks || 0,
            visitors: item.visitors || 0,
            paidClicks: item.paidClicks ?? 0,
            conversions: item.conversions || 0,
            convRate: item.convRate || 0,
            epc: item.epc || 0,
            commission: item.commission || 0,
            orderValue: item.orderValue ?? 0,
            aov: item.aov ?? 0
          };
        case "day":
        case "week":
        case "month":
        case "hour":
          return {
            header: { date: item.date },
            clicks: item.clicks || 0,
            visitors: item.visitors || 0,
            paidClicks: item.paidClicks ?? 0,
            conversions: item.conversions || 0,
            convRate: item.convRate || 0,
            epc: item.epc || 0,
            commission: item.commission || 0,
            orderValue: item.orderValue ?? 0,
            aov: item.aov ?? 0
          };
        default: {
          const cachedDetails = brandDetailsCacheRef.current.get(item.accountBrandId);
          return {
            header: {
              brandName: item.accountBrandName,
              countryCode: item.accountCountryCode,
              brandId: item.accountBrandId,
              category: cachedDetails?.category,
              serviceLevel: cachedDetails?.serviceLevel,
              brandDetailsLoaded: cachedDetails?.brandDetailsLoaded ?? false
            },
            clicks: item.clicks || 0,
            visitors: item.visitors || 0,
            paidClicks: item.paidClicks ?? 0,
            conversions: item.conversions || 0,
            convRate: item.convRate || 0,
            epc: item.epc || 0,
            commission: item.commission || 0,
            orderValue: item.orderValue ?? 0,
            aov: item.aov ?? 0
          };
        }
      }
    }, []);

    const mapOverviewRows = useCallback(
      (response, rangeStartDate = effectiveStartDate) => {
        const rows = (response?.data || []).map((item) => mapOverviewItemToRow(item, groupBy));
        const filledRows =
          includeEmptyRows && rangeStartDate
            ? generateMissingRows(rows, rangeStartDate, groupBy)
            : rows;

        return filledRows.map((row, rowIndex) => ({
          ...row,
          _compareKey: getOverviewCompareRowKey(groupBy, row, rowIndex)
        }));
      },
      [effectiveStartDate, generateMissingRows, groupBy, includeEmptyRows, mapOverviewItemToRow]
    );

    const buildEpiColumnsState = useCallback(
      (primaryResponse, compareResponse) => {
        if (groupBy !== "epi") {
          return {
            epi: true,
            epi2: false,
            epi3: false,
            epi4: false,
            epi5: false
          };
        }

        const primaryEpiColumns = primaryResponse?.epiColumns || {};
        const compareEpiColumns = compareResponse?.epiColumns || {};

        return {
          epi: true,
          epi2: Boolean(primaryEpiColumns.epi2 || compareEpiColumns.epi2),
          epi3: Boolean(primaryEpiColumns.epi3 || compareEpiColumns.epi3),
          epi4: Boolean(primaryEpiColumns.epi4 || compareEpiColumns.epi4),
          epi5: Boolean(primaryEpiColumns.epi5 || compareEpiColumns.epi5)
        };
      },
      [groupBy]
    );

    useEffect(() => {
      brandDetailsCacheRef.current = brandDetailsCache;
    }, [brandDetailsCache]);

    const refreshBrandCellsForBrandId = useCallback((brandIdToRefresh) => {
      if (!gridApiRef.current) return;
      const rowNodesToRefresh = [];
      gridApiRef.current.forEachNode((node) => {
        if (
          node.data?.header?.brandId === brandIdToRefresh ||
          node.data?.compareHeader?.brandId === brandIdToRefresh
        ) {
          rowNodesToRefresh.push(node);
        }
      });
      if (rowNodesToRefresh.length > 0) {
        gridApiRef.current.refreshCells({
          rowNodes: rowNodesToRefresh,
          columns: [getGroupColumnId("brand"), getCompareGroupColumnId("brand")],
          force: true
        });
      }
    }, []);

    const fetchBrandDetails = useCallback(
      async (brandIdToFetch) => {
        if (!isNumericId(brandIdToFetch)) {
          return;
        }

        // Check cache first using ref to avoid dependency on state
        if (brandDetailsCacheRef.current.has(brandIdToFetch)) {
          const cached = brandDetailsCacheRef.current.get(brandIdToFetch);
          if (!cached?.brandDetailsLoaded) {
            // still pending resolution, fall through to trigger fetch
          } else {
            return cached;
          }
        }

        // Check if already loading (using ref only, no state update)
        if (brandDetailsLoadingRef.current.get(brandIdToFetch)) {
          return;
        }

        // Mark as loading in ref only
        brandDetailsLoadingRef.current.set(brandIdToFetch, true);

        try {
          const result = await insightsAgent.insights_getBrandDetails(brandIdToFetch);

          // Cache the result
          setBrandDetailsCache((prev) => {
            const newCache = new Map(prev);
            newCache.set(brandIdToFetch, {
              ...result,
              brandDetailsLoaded: true
            });
            brandDetailsCacheRef.current = newCache;
            return newCache;
          });

          // Mark as not loading in ref only
          brandDetailsLoadingRef.current.set(brandIdToFetch, false);

          // Update existing row data with the new details
          setRowData((prevRowData) => {
            return prevRowData.map((row) => {
              const matchesPrimaryHeader = row.header?.brandId === brandIdToFetch;
              const matchesCompareHeader = row.compareHeader?.brandId === brandIdToFetch;

              if (matchesPrimaryHeader || matchesCompareHeader) {
                return {
                  ...row,
                  header: matchesPrimaryHeader
                    ? {
                        ...row.header,
                        category: result.category,
                        serviceLevel: result.serviceLevel,
                        brandDetailsLoaded: true
                      }
                    : row.header,
                  compareHeader: matchesCompareHeader
                    ? {
                        ...row.compareHeader,
                        category: result.category,
                        serviceLevel: result.serviceLevel,
                        brandDetailsLoaded: true
                      }
                    : row.compareHeader
                };
              }
              return row;
            });
          });

          refreshBrandCellsForBrandId(brandIdToFetch);

          return result;
        } catch (error) {
          console.warn("Failed to fetch brand details:", error);

          // Return fallback values
          const fallback = {
            category: "Marketing",
            serviceLevel: 1
          };

          // Cache the fallback to avoid repeated failures
          setBrandDetailsCache((prev) => {
            const newCache = new Map(prev);
            newCache.set(brandIdToFetch, { ...fallback, brandDetailsLoaded: true });
            brandDetailsCacheRef.current = newCache;
            return newCache;
          });

          // Mark as not loading in ref only
          brandDetailsLoadingRef.current.set(brandIdToFetch, false);

          setRowData((prevRowData) => {
            return prevRowData.map((row) => {
              const matchesPrimaryHeader = row.header?.brandId === brandIdToFetch;
              const matchesCompareHeader = row.compareHeader?.brandId === brandIdToFetch;

              if (matchesPrimaryHeader || matchesCompareHeader) {
                return {
                  ...row,
                  header: matchesPrimaryHeader
                    ? {
                        ...row.header,
                        category: fallback.category,
                        serviceLevel: fallback.serviceLevel,
                        brandDetailsLoaded: true
                      }
                    : row.header,
                  compareHeader: matchesCompareHeader
                    ? {
                        ...row.compareHeader,
                        category: fallback.category,
                        serviceLevel: fallback.serviceLevel,
                        brandDetailsLoaded: true
                      }
                    : row.compareHeader
                };
              }
              return row;
            });
          });

          refreshBrandCellsForBrandId(brandIdToFetch);

          return fallback;
        }
      },
      [refreshBrandCellsForBrandId]
    );

    const getDefaultSortForGroupBy = (groupBy) => {
      switch (groupBy) {
        case "hour":
        case "day":
        case "week":
        case "month":
          return "date:asc";
        case "epi":
        case "brand":
        case "channel":
        case "brandmaterial":
        default:
          return "commission:desc";
      }
    };

    useEffect(() => {
      const currentParams = {
        countryId,
        channelId,
        brandId,
        effectiveStartDate: formatLocalDate(effectiveStartDate),
        effectiveEndDate: formatLocalDate(effectiveEndDate),
        compareStartDate: compareStartDate ? formatLocalDate(compareStartDate) : null,
        compareEndDate: compareEndDate ? formatLocalDate(compareEndDate) : null,
        shouldLoadCompareData,
        currentGroupBy: groupBy,
        currencyCode,
        includeEmptyRows,
        stableSelectedConversionStatus,
        compensationId
      };

      if (checkParamsChanged(currentParams)) {
        setIsLoading(true);
        setRowData([]);
        setTotalRowCount(0);
        setLimitExceeded(false);
        setLoadError(null);
        setApiTotals(null);
        setCompareApiTotals(null);
      }

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      loadTimeoutRef.current = setTimeout(() => {
        if (checkParamsChanged(currentParams)) {
          setIsLoading(true);
        }
      }, 10);

      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }, [
      groupBy,
      countryId,
      channelId,
      brandId,
      effectiveStartDate,
      effectiveEndDate,
      compareStartDate,
      compareEndDate,
      shouldLoadCompareData,
      currencyCode,
      includeEmptyRows,
      stableSelectedConversionStatus,
      compensationId
    ]);

    const checkParamsChanged = (currentParams) => {
      const lastParams = lastLoadParamsRef.current;
      return !lastParams || JSON.stringify(currentParams) !== JSON.stringify(lastParams);
    };

    const loadAllData = useCallback(async () => {
      const currentParams = {
        countryId,
        channelId,
        brandId,
        effectiveStartDate: formatLocalDate(effectiveStartDate),
        effectiveEndDate: formatLocalDate(effectiveEndDate),
        compareStartDate: compareStartDate ? formatLocalDate(compareStartDate) : null,
        compareEndDate: compareEndDate ? formatLocalDate(compareEndDate) : null,
        shouldLoadCompareData,
        currentGroupBy: groupBy,
        currencyCode,
        includeEmptyRows,
        stableSelectedConversionStatus,
        compensationId
      };

      if (
        lastLoadParamsRef.current &&
        JSON.stringify(lastLoadParamsRef.current) === JSON.stringify(currentParams)
      ) {
        return;
      }
      lastLoadParamsRef.current = currentParams;

      // Increment request version and capture it for this request
      requestVersionRef.current += 1;
      const thisRequestVersion = requestVersionRef.current;

      try {
        setIsLoading(true);
        setLoadError(null);
        setLimitExceeded(false);

        const sort = getDefaultSortForGroupBy(groupBy);

        const [primaryResponse, compareResponse] = await Promise.all([
          insightsAgent.insights_getOverviewTable({
            countryId,
            channelId,
            brandId,
            startDate: formatLocalDate(effectiveStartDate),
            endDate: formatLocalDate(effectiveEndDate),
            groupBy,
            sort,
            currencyCode,
            status: stableSelectedConversionStatus,
            compensationId
          }),
          shouldLoadCompareData
            ? insightsAgent.insights_getOverviewTable({
                countryId,
                channelId,
                brandId,
                startDate: formatLocalDate(compareStartDate),
                endDate: formatLocalDate(compareEndDate),
                groupBy,
                sort,
                currencyCode,
                status: stableSelectedConversionStatus,
                compensationId
              })
            : Promise.resolve(null)
        ]);

        if (thisRequestVersion !== requestVersionRef.current) {
          return;
        }

        const primaryRows = mapOverviewRows(primaryResponse, effectiveStartDate);
        const compareRows = shouldLoadCompareData
          ? mapOverviewRows(compareResponse, compareStartDate)
          : [];

        setChannelName(primaryResponse.channel || null);
        setChannelCountry(primaryResponse.channelCountry || null);
        setChannelType(primaryResponse.channelType || null);
        setAdvertiserName(primaryResponse.advertiserName || null);
        setAdvertiserCountry(primaryResponse.advertiserCountry || null);
        setTotalRowCount(primaryRows.length);
        setLimitExceeded(
          Boolean(primaryResponse.limitExceeded || compareResponse?.limitExceeded)
        );
        setApiTotals(primaryResponse.totals || null);
        setCompareApiTotals(compareResponse?.totals || null);
        setEpiColumns(buildEpiColumnsState(primaryResponse, compareResponse));
        setRowData(
          mergeOverviewRows({
            groupBy,
            primaryRows,
            compareRows,
            showCompare: shouldLoadCompareData
          })
        );
      } catch (e) {
        if (thisRequestVersion === requestVersionRef.current) {
          console.error("Failed to load data", e);
          setRowData([]);
          setTotalRowCount(0);
          setLimitExceeded(false);
          setLoadError(i18n.t("insights.overviewTable.loadError"));
          setApiTotals(null);
          setCompareApiTotals(null);
        }
      } finally {
        if (thisRequestVersion === requestVersionRef.current) {
          setIsLoading(false);
        }
      }
    }, [
      countryId,
      channelId,
      brandId,
      effectiveStartDate,
      effectiveEndDate,
      compareStartDate,
      compareEndDate,
      shouldLoadCompareData,
      groupBy,
      currencyCode,
      includeEmptyRows,
      buildEpiColumnsState,
      mapOverviewRows,
      stableSelectedConversionStatus,
      compensationId
    ]);

    useEffect(() => {
      if (!isInitialized || !isLoading) {
        return;
      }

      setRowData([]);
      setTotalRowCount(0);
      setLimitExceeded(false);
      setLoadError(null);
      setApiTotals(null);
      setCompareApiTotals(null);
      loadAllData();
    }, [isLoading, loadAllData, isInitialized]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }, []);

    const getPairedGroupColumnDefinitions = useCallback(
      () =>
        buildOverviewGroupColumnDefinitions({
          groupBy,
          showCompare,
          compareColumnLabel,
          primaryColumnLabel,
          countryId,
          epiColumns,
          fetchBrandDetails,
          brandDetailsLoadingRef,
          brandDetailsCacheRef
        }),
      [
        compareColumnLabel,
        countryId,
        epiColumns,
        fetchBrandDetails,
        groupBy,
        primaryColumnLabel,
        showCompare
      ]
    );

    const getComparisonState = useCallback(
      (params, field, variant = "primary") => {
        if (
          !showCompare ||
          !COMPARABLE_METRIC_FIELDS.includes(field) ||
          params.node?.rowPinned === "bottom"
        ) {
          return null;
        }

        if (!params.data?._hasCompareRow) {
          return null;
        }

        const primaryValue = Number(params.data?.[field] ?? 0);
        const compareValue = params.data?.[getCompareFieldName(field)];

        if (compareValue == null) {
          return null;
        }

        const numericCompareValue = Number(compareValue);
        if (primaryValue === numericCompareValue) {
          return null;
        }

        const primaryState = primaryValue > numericCompareValue ? "success" : "danger";
        return variant === "compare"
          ? primaryState === "success"
            ? "danger"
            : "success"
          : primaryState;
      },
      [showCompare]
    );

    const getComparisonCellClassRules = useCallback(
      (field, variant = "primary") => ({
        success: (params) => getComparisonState(params, field, variant) === "success",
        danger: (params) => getComparisonState(params, field, variant) === "danger"
      }),
      [getComparisonState]
    );

    const getDeltaCellClassRules = useCallback(
      (field) => ({
        success: (params) => {
          if (params.node?.rowPinned === "bottom") {
            return false;
          }
          const deltaValue = Number(params.data?.[getDeltaFieldName(field)]);
          return Number.isFinite(deltaValue) && deltaValue > 0;
        },
        danger: (params) => {
          if (params.node?.rowPinned === "bottom") {
            return false;
          }
          const deltaValue = Number(params.data?.[getDeltaFieldName(field)]);
          return Number.isFinite(deltaValue) && deltaValue < 0;
        }
      }),
      []
    );

    const getDeltaCellRendererParams = useCallback(
      (field) => (params) => {
        const deltaValue = params.data?.[getDeltaFieldName(field)] ?? null;
        const compareValue = params.data?.[getCompareFieldName(field)];

        if (deltaValue == null || compareValue == null) {
          return {
            value: null,
            hoverable: false
          };
        }

        return {
          value: deltaValue,
          badgeSize: "large",
          hoverable: true,
          numericAligned: true,
          positive: 0,
          negative: 0,
          type: "split",
          showIndicatorScale: false,
          tooltipData: {
            fromValue: Number(compareValue) || 0,
            toValue: Number(params.data?.[field] ?? 0) || 0,
            fromDate: baselineTooltipLabel,
            toDate: currentTooltipLabel,
            format: getDeltaTooltipFormat(field),
            currency: getDeltaTooltipFormat(field) === "currency" ? currencyCode : undefined
          }
        };
      },
      [baselineTooltipLabel, currencyCode, currentTooltipLabel]
    );

    const getCompareColumnNormalizationConfig = useCallback(() => {
      const pairedGroupColumnDefinitions = getPairedGroupColumnDefinitions();
      const pairedGroupColumns = pairedGroupColumnDefinitions.reduce((accumulator, column) => {
        if (column.colId?.startsWith(COMPARE_GROUP_COLUMN_PREFIX)) {
          accumulator[column.colId] = column.colId.replace(
            COMPARE_GROUP_COLUMN_PREFIX,
            GROUP_COLUMN_PREFIX
          );
        }
        return accumulator;
      }, {});

      const pinnedGroupColumnIds = pairedGroupColumnDefinitions
        .map((column) => column.colId)
        .filter(
          (colId) =>
            colId?.startsWith(GROUP_COLUMN_PREFIX) || colId?.startsWith(COMPARE_GROUP_COLUMN_PREFIX)
        );
      const responsiveColumnFlexValues = pairedGroupColumnDefinitions.reduce(
        (accumulator, column) => {
          const colId = column.colId || column.field;
          const responsiveFlexValue = getResponsiveColumnFlexValue(column);

          if (colId && responsiveFlexValue != null) {
            accumulator[colId] = responsiveFlexValue;
          }

          return accumulator;
        },
        {}
      );

      return {
        pairedGroupColumns,
        pinnedGroupColumnIds,
        responsiveColumnFlexValues
      };
    }, [getPairedGroupColumnDefinitions]);

    const getAutoSizeColumnGroupIds = useCallback(
      (colId) => {
        if (!colId || !showCompare || colId.startsWith(DELTA_FIELD_PREFIX)) {
          return [colId];
        }

        const { pairedGroupColumns } = getCompareColumnNormalizationConfig();
        const pairedColumns = Object.entries({
          ...DEFAULT_PAIRED_COMPARE_COLUMNS,
          ...pairedGroupColumns
        }).filter(([compareColId]) => !compareColId.startsWith(DELTA_FIELD_PREFIX));

        const pairedColumnGroup = pairedColumns.find(
          ([compareColId, primaryColId]) => compareColId === colId || primaryColId === colId
        );
        if (pairedColumnGroup) {
          return [pairedColumnGroup[0], pairedColumnGroup[1]];
        }

        return [colId];
      },
      [getCompareColumnNormalizationConfig, showCompare]
    );

    const sharedDeltaColumnsHiddenRef = useRef(false);
    const compareResizeSourceColIdRef = useRef(null);
    const pairedComparisonResizeColumnIds = useMemo(() => {
      const nextResizeColumnIds = new Set();
      const { pairedGroupColumns } = getCompareColumnNormalizationConfig();

      Object.entries({
        ...DEFAULT_PAIRED_COMPARE_COLUMNS,
        ...pairedGroupColumns
      }).forEach(([compareColId, primaryColId]) => {
        if (compareColId.startsWith(DELTA_FIELD_PREFIX)) {
          return;
        }

        nextResizeColumnIds.add(compareColId);
        nextResizeColumnIds.add(primaryColId);
      });

      return nextResizeColumnIds;
    }, [getCompareColumnNormalizationConfig]);

    const normalizeCompareColumnState = useCallback(
      (columnState = [], { resizeSourceColId = null } = {}) => {
        if (!showCompare) {
          sharedDeltaColumnsHiddenRef.current = false;
          compareResizeSourceColIdRef.current = null;
          return columnState;
        }

        const sharedDeltaColumnsHidden = resolveSharedDeltaColumnsHidden(columnState, {
          fallbackValue: sharedDeltaColumnsHiddenRef.current
        });
        sharedDeltaColumnsHiddenRef.current = sharedDeltaColumnsHidden;

        return normalizeOverviewCompareColumnState(columnState, {
          ...getCompareColumnNormalizationConfig(),
          sharedDeltaColumnsHidden,
          resizeSourceColId: resizeSourceColId ?? compareResizeSourceColIdRef.current
        });
      },
      [getCompareColumnNormalizationConfig, showCompare]
    );

    const syncCompareColumnState = useCallback(() => {
      const api = gridApiRef.current;
      if (!api || !showCompare) {
        return;
      }

      const currentState = api.getColumnState?.() || [];
      if (!Array.isArray(currentState) || currentState.length === 0) {
        compareResizeSourceColIdRef.current = null;
        return;
      }
      const nextState = normalizeCompareColumnState(currentState);
      compareResizeSourceColIdRef.current = null;

      const hasChanges =
        currentState.length !== nextState.length ||
        nextState.some((columnState, index) => {
          const currentColumnState = currentState[index];
          if (!currentColumnState || currentColumnState.colId !== columnState.colId) {
            return true;
          }

          return (
            currentColumnState.hide !== columnState.hide ||
            currentColumnState.pinned !== columnState.pinned ||
            currentColumnState.width !== columnState.width ||
            currentColumnState.flex !== columnState.flex
          );
        });

      if (!hasChanges) {
        return;
      }

      isSyncingCompareColumnsRef.current = true;

      api.applyColumnState({
        state: nextState,
        applyOrder: true
      });

      setTimeout(() => {
        isSyncingCompareColumnsRef.current = false;
      }, 0);
    }, [normalizeCompareColumnState, showCompare]);

    useEffect(() => {
      const api = gridApiRef.current;
      if (!api || !showCompare) {
        return;
      }

      syncCompareColumnState();

      const handleColumnStateChange = (event) => {
        if (isSyncingCompareColumnsRef.current) {
          return;
        }

        if (event?.type === "columnResized" && event.finished === false) {
          return;
        }

        compareResizeSourceColIdRef.current = null;
        if (event?.type === "columnResized") {
          const resizedColId = event?.column?.getColId?.();
          if (resizedColId && pairedComparisonResizeColumnIds.has(resizedColId)) {
            compareResizeSourceColIdRef.current = resizedColId;
          }
        }

        syncCompareColumnState();
      };

      api.addEventListener("columnResized", handleColumnStateChange);
      api.addEventListener("columnMoved", handleColumnStateChange);
      api.addEventListener("columnVisible", handleColumnStateChange);
      api.addEventListener("columnPinned", handleColumnStateChange);

      return () => {
        api.removeEventListener("columnResized", handleColumnStateChange);
        api.removeEventListener("columnMoved", handleColumnStateChange);
        api.removeEventListener("columnVisible", handleColumnStateChange);
        api.removeEventListener("columnPinned", handleColumnStateChange);
      };
    }, [pairedComparisonResizeColumnIds, showCompare, syncCompareColumnState]);

    const renderUnavailableMetricCell = useCallback(
      (params) => <NumberCell {...params} value="—" />,
      []
    );

    const getCommissionFilteredMetricColumn = useCallback(
      (column) => ({
        ...column,
        headerTooltip: i18n.t("insights.overviewTable.commissionFilter.unavailableMetricTooltip"),
        cellClass: clsx(column.cellClass, styles.commissionFilteredMetric),
        cellRenderer: renderUnavailableMetricCell,
        cellRendererParams: undefined,
        valueFormatter: () => "—",
        comparator: () => 0
      }),
      [renderUnavailableMetricCell]
    );

    const getColumnDefinitions = useCallback(() => {
      const groupByColumns = getPairedGroupColumnDefinitions();

      const metricColumns = [
        {
          field: "clicks",
          headerName: i18n.t("insights.insightsPage.table.clicks"),
          type: "rightAligned",
          sortable: true,
          width: 100,
          cellRenderer: NumberCell
        },
        {
          field: "visitors",
          headerName: i18n.t("insights.insightsPage.table.uniqueClicks"),
          type: "rightAligned",
          sortable: true,
          width: 140,
          cellRenderer: NumberCell
        },
        {
          field: "paidClicks",
          headerName: i18n.t("insights.insightsPage.table.paidClicks"),
          type: "rightAligned",
          sortable: true,
          width: 100,
          cellRenderer: NumberCell,
          hide: true
        },
        {
          field: "conversions",
          headerName: i18n.t("insights.insightsPage.table.conversions"),
          type: "rightAligned",
          sortable: true,
          width: 120,
          cellRenderer: NumberCell
        },
        {
          field: "convRate",
          headerName: i18n.t("insights.insightsPage.table.convRate"),
          type: "rightAligned",
          sortable: true,
          width: 100,
          cellRenderer: NumberCell,
          cellRendererParams: (params) => {
            return {
              value:
                params.value != null && typeof params.value === "number"
                  ? `${params.value.toFixed(1)}%`
                  : "",
              decimals: 1,
              size: params.size
            };
          },
          valueFormatter: (params) => {
            if (params.value != null && typeof params.value === "number") {
              return `${params.value.toFixed(1)}%`;
            }
            return "";
          }
        },
        {
          field: "epc",
          headerName: i18n.t("insights.insightsPage.table.epc"),
          type: "rightAligned",
          sortable: true,
          width: 100,
          cellRenderer: NumberCell,
          cellRendererParams: (params) => {
            const numValue = params.value;
            if (numValue != null && typeof numValue === "number") {
              const formatted = formatNumber(numValue, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
              return {
                value: formatted,
                size: params.size
              };
            }
            return {
              value: "0.00",
              size: params.size
            };
          },
          valueFormatter: (params) => {
            if (params.value != null && typeof params.value === "number") {
              return formatNumber(params.value, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
            }
            return "0.00";
          }
        },
        {
          field: "commission",
          headerName: i18n.t("insights.insightsPage.table.commission"),
          type: "rightAligned",
          sortable: true,
          width: 120,
          sort: ["hour", "day", "week", "month"].includes(groupBy) ? null : "desc",
          cellRenderer: NumberCell,
          cellRendererParams: (params) => {
            const numValue = params.value;
            if (numValue != null && typeof numValue === "number") {
              const formatted = formatNumber(numValue, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
              return {
                value: formatted,
                size: params.size
              };
            }
            return {
              value: "0.00",
              size: params.size
            };
          },
          valueFormatter: (params) => {
            if (params.value != null && typeof params.value === "number") {
              return formatNumber(params.value, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
            }
            return "0.00";
          }
        },
        {
          field: "orderValue",
          headerName: i18n.t("insights.insightsPage.table.orderValue"),
          type: "rightAligned",
          sortable: true,
          width: 120,
          cellRenderer: NumberCell,
          cellRendererParams: (params) => {
            const numValue = params.value;
            if (numValue != null && typeof numValue === "number") {
              const formatted = formatNumber(numValue, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
              return {
                value: formatted,
                size: params.size
              };
            }
            return {
              value: "0.00",
              size: params.size
            };
          },
          valueFormatter: (params) => {
            if (params.value != null && typeof params.value === "number") {
              return formatNumber(params.value, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
            }
            return "0.00";
          },
          hide: true
        },
        {
          field: "aov",
          headerName: i18n.t("insights.insightsPage.table.aov"),
          type: "rightAligned",
          sortable: true,
          width: 120,
          cellRenderer: NumberCell,
          cellRendererParams: (params) => {
            const numValue = params.value;
            if (numValue != null && typeof numValue === "number") {
              const formatted = formatNumber(numValue, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
              return {
                value: formatted,
                size: params.size
              };
            }
            return {
              value: "0.00",
              size: params.size
            };
          },
          valueFormatter: (params) => {
            if (params.value != null && typeof params.value === "number") {
              return formatNumber(params.value, {
                thousandSeparator: " ",
                decimalSeparator: ".",
                decimalPlaces: 2,
                forceShowDecimals: true
              });
            }
            return "0.00";
          },
          hide: true
        }
      ];

      const pairedMetricColumns = metricColumns.flatMap((column) => {
        const isCommissionUnavailableMetric =
          isCommissionFiltered && COMMISSION_FILTER_CLICK_DERIVED_FIELDS.has(column.field);
        const effectiveColumn = isCommissionUnavailableMetric
          ? getCommissionFilteredMetricColumn(column)
          : column;
        const primaryColumn = {
          ...effectiveColumn,
          subHeaderText: showCompare ? primaryColumnLabel : null,
          cellClassRules: showCompare && !isCommissionUnavailableMetric
            ? getComparisonCellClassRules(effectiveColumn.field, "primary")
            : undefined
        };

        if (!showCompare) {
          return [primaryColumn];
        }

        const compareColumn = {
          ...effectiveColumn,
          field: getCompareFieldName(effectiveColumn.field),
          colId: getCompareFieldName(effectiveColumn.field),
          showInColumnChooser: false,
          subHeaderText: compareColumnLabel,
          sort: null,
          cellClassRules: isCommissionUnavailableMetric
            ? undefined
            : getComparisonCellClassRules(effectiveColumn.field, "compare")
        };

        return [
          compareColumn,
          primaryColumn,
          {
            field: getDeltaFieldName(effectiveColumn.field),
            colId: getDeltaFieldName(effectiveColumn.field),
            headerName: effectiveColumn.headerName,
            icon: <Icons.Finance.Scales01 width={16} height={16} />,
            inlineHeaderIconWithText: true,
            type: "rightAligned",
            sortable: true,
            minWidth: DELTA_COLUMN_MIN_WIDTH,
            flex: 0,
            hide: effectiveColumn.hide,
            cellClass: clsx(
              "compare-delta-cell",
              isCommissionUnavailableMetric && styles.commissionFilteredMetric
            ),
            cellClassRules: isCommissionUnavailableMetric
              ? undefined
              : getDeltaCellClassRules(effectiveColumn.field),
            showInColumnChooser: false,
            cellRenderer: isCommissionUnavailableMetric ? renderUnavailableMetricCell : StatsBadgeCell,
            cellRendererParams: isCommissionUnavailableMetric
              ? undefined
              : getDeltaCellRendererParams(effectiveColumn.field),
            valueFormatter: isCommissionUnavailableMetric ? () => "—" : undefined,
            comparator: isCommissionUnavailableMetric ? () => 0 : undefined
          }
        ];
      });

      return [...groupByColumns, ...pairedMetricColumns];
    }, [
      compareColumnLabel,
      getDeltaCellRendererParams,
      getDeltaCellClassRules,
      getComparisonCellClassRules,
      getCommissionFilteredMetricColumn,
      getPairedGroupColumnDefinitions,
      groupBy,
      isCommissionFiltered,
      primaryColumnLabel,
      renderUnavailableMetricCell,
      showCompare
    ]);

    const tableTitle = useMemo(
      () => (
        <div className={styles.insightsTableTitle}>
          <Badge color="primary" text={currencyCode} size="small" />
        </div>
      ),
      [currencyCode]
    );
    const activeFilters = useMemo(() => {
      const nextFilters = [];

      if (countryId) {
        const country = availableCountries.find((c) => c.countryCode === countryId);
        nextFilters.push({
          id: "country",
          type: "country",
          value: countryId,
          text: country?.countryName || countryId,
          iconLeft: country?.countryCode ? (
            <Flag
              flag={country.countryCode}
              width={FILTER_CHIP_ICON_SIZE}
              height={FILTER_CHIP_ICON_SIZE}
            />
          ) : null
        });
      }

      if (channelName && channelId) {
        const channel = availableChannels.find((c) => c.value === channelId);
        const markets = channel?.countries || [];
        nextFilters.push({
          id: "channel",
          type: "channel",
          value: channelId,
          text: channelName,
          iconLeftFlexible: true,
          iconLeft:
            markets.length > 0 ? (
              <CompressedElements
                size="small"
                maxAmountToBeShown={1}
                elements={markets.map((market) => ({
                  icon: (
                    <Flag
                      flag={market.isocode}
                      width={FILTER_CHIP_ICON_SIZE}
                      height={FILTER_CHIP_ICON_SIZE}
                    />
                  ),
                  description: market.name
                }))}
              />
            ) : null
        });
      }

      if (advertiserName && brandId) {
        nextFilters.push({
          id: "brand",
          type: "brand",
          value: brandId,
          text: advertiserName,
          iconLeft: advertiserCountry ? (
            <Flag
              flag={advertiserCountry}
              width={FILTER_CHIP_ICON_SIZE}
              height={FILTER_CHIP_ICON_SIZE}
            />
          ) : null
        });
      }

      if (
        Array.isArray(stableSelectedConversionStatus) &&
        stableSelectedConversionStatus.length > 0
      ) {
        stableSelectedConversionStatus.forEach((status) => {
          const statusOption = CONVERSION_STATUS_OPTIONS.find((option) => option.value === status);
          nextFilters.push({
            id: `status-${status}`,
            type: "status",
            value: status,
            text: i18n.t(statusOption?.translationKey ?? "") || status,
            iconLeft: normalizeFilterChipIcon(statusOption?.icon || null)
          });
        });
      }

      if (compensationId != null) {
        nextFilters.push({
          id: "compensation",
          type: "compensation",
          value: compensationId,
          text: compensationName || i18n.t("insights.insightsPage.filter.commissionType"),
          iconLeft: (
            <Icons.Finance.CoinsHand
              width={FILTER_CHIP_ICON_SIZE}
              height={FILTER_CHIP_ICON_SIZE}
            />
          )
        });
      }

      const trimmedEpiSearch = epiSearchText.trim();
      if (groupBy === INSIGHTS_OVERVIEW_GROUP_BY.EPI && trimmedEpiSearch) {
        nextFilters.push({
          id: "epi-search",
          type: "epiSearch",
          value: trimmedEpiSearch,
          text: i18n.t("insights.overviewTable.epiSearch.activeFilter", {
            query: trimmedEpiSearch
          })
        });
      }

      return nextFilters;
    }, [
      countryId,
      availableCountries,
      availableChannels,
      channelName,
      channelId,
      advertiserName,
      brandId,
      advertiserCountry,
      stableSelectedConversionStatus,
      compensationId,
      compensationName,
      groupBy,
      epiSearchText
    ]);

    const handleActiveFilterRemove = useCallback(
      (filter) => {
        if (filter?.id === "epi-search" || filter?.type === "epiSearch") {
          setEpiSearchText("");
          return;
        }
        if (typeof onRemoveActiveFilter === "function") {
          onRemoveActiveFilter(filter);
        }
      },
      [onRemoveActiveFilter]
    );

    const filteredRowData = useMemo(() => {
      if (groupBy !== INSIGHTS_OVERVIEW_GROUP_BY.EPI) {
        return rowData;
      }
      return filterEpiOverviewRows(rowData, epiSearchText);
    }, [rowData, groupBy, epiSearchText]);

    const effectiveRowCount = filteredRowData.length;
    const isEpiSearchActive =
      groupBy === INSIGHTS_OVERVIEW_GROUP_BY.EPI && epiSearchText.trim().length > 0;

    const pinnedBottomRowData = useMemo(() => {
      if (effectiveRowCount === 0) {
        return [];
      }

      if (isEpiSearchActive) {
        const filteredTotals = calculateOverviewTotalsFromRows(filteredRowData);
        const filteredCompareTotals = showCompare
          ? calculateOverviewTotalsFromRows(filteredRowData, COMPARE_FIELD_PREFIX)
          : null;
        if (!filteredTotals) {
          return [];
        }
        return [formatApiTotals(filteredTotals, filteredCompareTotals)];
      }

      if (apiTotals) {
        return [formatApiTotals(apiTotals, showCompare ? compareApiTotals : null)];
      }

      return [];
    }, [
      effectiveRowCount,
      isEpiSearchActive,
      filteredRowData,
      apiTotals,
      compareApiTotals,
      showCompare,
      formatApiTotals
    ]);

    const helperItems = useMemo(() => {
      const items = [];

      if (groupBy === INSIGHTS_OVERVIEW_GROUP_BY.EPI) {
        items.push(
          <div
            key="epi-search"
            className={clsx(styles.epiSearchWrapper, isLoading && styles.epiSearchWrapperLoading)}>
            <InputSearch
              size="small"
              value={epiSearchText}
              onChange={(event) => setEpiSearchText(event.target.value)}
              onClear={() => setEpiSearchText("")}
              placeholder={i18n.t("insights.overviewTable.epiSearch.placeholder")}
              isLoading={isLoading}
              readOnly={isLoading}
              aria-busy={isLoading}
              aria-label={i18n.t("insights.overviewTable.epiSearch.label")}
            />
          </div>
        );
      }

      if (canShowCompare && typeof onShowCompareChange === "function") {
        items.push(
          <CheckChip
            key="show-comparison"
            size="small"
            text={i18n.t("insights.overviewTable.showComparison")}
            checked={showCompare}
            disabled={isLoading}
            onClickCallback={onShowCompareChange}
          />
        );
      }

      if (typeof onAdjustmentsChange === "function") {
        items.push(
          <CheckChip
            key="adjustments"
            size="small"
            text={i18n.t("insights.overviewTable.adjustments.chip")}
            checked={includeAdjustments}
            onClickCallback={onAdjustmentsChange}
          />
        );
      }

      if (items.length === 0) {
        return null;
      }

      return <div className={styles.helperItemsRow}>{items}</div>;
    }, [
      groupBy,
      epiSearchText,
      isLoading,
      canShowCompare,
      onShowCompareChange,
      showCompare,
      onAdjustmentsChange,
      includeAdjustments
    ]);

    const columnDefinitions = useMemo(() => {
      return getColumnDefinitions();
    }, [getColumnDefinitions]);
    const additionalExportRows = useMemo(() => {
      if (!includeAdjustments || !adjustmentsExport || channelId != null || isCommissionFiltered) {
        return null;
      }
      return buildOverviewExportRows(
        columnDefinitions,
        buildAdjustmentExportRowSpecs({
          totalsLabel: i18n.t("insights.insightsPage.table.total"),
          totalsRow: pinnedBottomRowData[0] ?? null,
          adjustments: adjustmentsExport.rows,
          inclAdjustmentsLabel: i18n.t("insights.brand.table.totalInclAdjustments"),
          mainTotals: apiTotals,
          adjustmentTotals: adjustmentsExport.totals
        })
      );
    }, [
      includeAdjustments,
      adjustmentsExport,
      channelId,
      isCommissionFiltered,
      columnDefinitions,
      pinnedBottomRowData,
      apiTotals
    ]);
    const effectiveTableId = useMemo(
      () => `${tableId}-${showCompare ? "compare" : "default"}`,
      [showCompare, tableId]
    );
    const exportFileNameBase = useMemo(() => {
      const normalizedGroupBy = (groupBy || INSIGHTS_OVERVIEW_GROUP_BY.BRAND).toLowerCase();
      return `overview-by-${normalizedGroupBy}${showCompare ? "-compare" : ""}`;
    }, [groupBy, showCompare]);
    const getTableRowId = useCallback(
      (params) => {
        return getOverviewRowId(groupBy, params?.data);
      },
      [groupBy]
    );
    const showResultCount = !isInsightsOverviewIntervalGroupBy(groupBy);

    const subscribeReportName = useMemo(() => {
      const key = String(groupBy || "").toLowerCase();
      const candidate = i18n.t(`insights.overview.subscribe.reportName.${key}`);
      if (candidate && !candidate.includes("insights.overview.subscribe.reportName.")) {
        return candidate;
      }
      return i18n.t("insights.overview.subscribe.reportName.default");
    }, [groupBy]);

    const subscribeDateRangeConfig = useMemo(() => {
      if (!effectiveStartDate || !effectiveEndDate) return undefined;
      const startDate = toLocalYmd(effectiveStartDate);
      const endDate = toLocalYmd(effectiveEndDate);
      if (!startDate || !endDate) return undefined;
      return {
        mode: "custom",
        startDate,
        endDate
      };
    }, [effectiveStartDate, effectiveEndDate]);

    const handleSubscribeSubmit = useCallback(
      async (payload) => {
        if (!canSubscribeToMailReports) {
          throw new Error(i18n.t("insights.overview.subscribe.notAllowed"));
        }
        const gb = String(groupBy).toLowerCase();
        const isChannelMonolithReport = gb === INSIGHTS_OVERVIEW_GROUP_BY.CHANNEL;
        const isProgramMonolithReport = gb === INSIGHTS_OVERVIEW_GROUP_BY.BRAND;
        const reportType = isChannelMonolithReport
          ? MAIL_REPORT_TYPE_CHANNEL
          : isProgramMonolithReport
            ? MAIL_REPORT_TYPE_PROGRAM
            : MAIL_REPORT_TYPE_TREND;
        const subscriptionSort = getMailSubscriptionSortFromColumnState(
          gridApiRef.current?.getColumnState?.()
        );
        const body = {
          ...payload,
          reportType,
          ...subscriptionSort,
          transactionStatuses: [...stableSelectedConversionStatus],
          insightsOverviewGroupBy: groupBy,
          groupByPeriod:
            isChannelMonolithReport || isProgramMonolithReport
              ? null
              : insightsOverviewGroupByToMailGroupByPeriod(groupBy),
          countryId: mailSubscriptionCountryId,
          currencyCode: currencyCode || null,
          affiliateSiteId: channelId != null ? Number(channelId) : null,
          advertProgramId: brandId != null ? Number(brandId) : null,
          // Adjustments are not tied to a channel or commission type, so a scoped report never carries them.
          includeCostAdjustments:
            includeAdjustments && channelId == null && !isCommissionFiltered ? true : undefined
        };
        const data = await insightsAgent.insights_saveMailSubscription(body);
        if (data && data.success === false) {
          throw new Error(data.error || data.message || i18n.t("insights.overviewTable.subscriptionFailed"));
        }
        return {
          success: true
        };
      },
      [
        stableSelectedConversionStatus,
        groupBy,
        mailSubscriptionCountryId,
        currencyCode,
        channelId,
        brandId,
        canSubscribeToMailReports,
        includeAdjustments,
        isCommissionFiltered
      ]
    );

    return (
      <div className={styles.insightsOverviewTableContainer}>
        {renderCommissionFilterWarning && (
          <section
            className={styles.commissionFilterDisclaimer}
            data-state={isCommissionFiltered ? "entered" : "exiting"}
            role="region"
            aria-live="polite"
            aria-label={i18n.t("insights.overviewTable.commissionFilter.disclaimerAria")}>
            <div className={styles.commissionFilterDisclaimerIcon}>
              <Icons.Alert.OctagonFilled width={24} height={24} />
            </div>
            <div className={styles.commissionFilterDisclaimerContent}>
              <span className={styles.commissionFilterDisclaimerTitle}>
                {i18n.t("insights.overviewTable.commissionFilter.disclaimerTitle")}
              </span>
              <span className={styles.commissionFilterDisclaimerDescription}>
                {i18n.t("insights.overviewTable.commissionFilter.disclaimer")}
              </span>
            </div>
          </section>
        )}
        <TableWrapper
          tableId={effectiveTableId}
          title={title}
          titleItems={tableTitle}
          wrapperClassName={showCompare ? COMPARE_HIGHLIGHT_WRAPPER_CLASS : null}
          activeFilters={activeFilters}
          onActiveFilterRemove={handleActiveFilterRemove}
          rowData={filteredRowData}
          colDefs={columnDefinitions}
          getRowId={getTableRowId}
          showFooter={true}
          infiniteScroll={false}
          loading={isLoading}
          limitThreshold={limitExceeded ? totalRowCount : undefined}
          exportFileNameBase={exportFileNameBase}
          pinnedBottomRowData={pinnedBottomRowData}
          additionalExportRows={additionalExportRows}
          onGridApiReady={({ api }) => {
            gridApiRef.current = api;
            if (showCompare) {
              setTimeout(() => {
                syncCompareColumnState();
              }, 0);
            }
            onGridApiReady?.({ api });
          }}
          showEditTableButton={true}
          showRowSelection={false}
          showSubscribeButton={canSubscribeToMailReports}
          subscribeDateRangeConfig={
            canSubscribeToMailReports ? subscribeDateRangeConfig : undefined
          }
          subscribeReportName={canSubscribeToMailReports ? subscribeReportName : undefined}
          subscribeDefaultRecipients={
            canSubscribeToMailReports ? currentUserEmail : undefined
          }
          subscribeCurrencyCode={canSubscribeToMailReports ? currencyCode : undefined}
          onSubscribeSubmit={canSubscribeToMailReports ? handleSubscribeSubmit : undefined}
          showResultCount={showResultCount}
          noDataText={loadError || null}
          size={groupBy === INSIGHTS_OVERVIEW_GROUP_BY.CHANNEL ? "large" : "default"}
          fullscreenTopContent={fullscreenTopContent}
          exportCurrencyCode={currencyCode}
          helperItems={helperItems}
          normalizeColumnState={normalizeCompareColumnState}
          getAutoSizeColumnGroupIds={getAutoSizeColumnGroupIds}
          autoSizeColumnIdsOnFirstRender={showCompare ? DELTA_COLUMN_IDS : null}
          autoSizeSkipHeaderColumnIdsOnFirstRender={showCompare ? DELTA_COLUMN_IDS : null}
          autoSizeColumnMaxWidth={DELTA_COLUMN_MAX_AUTO_WIDTH}
        />
      </div>
    );
  }
);

export default InsightsOverviewTable;
