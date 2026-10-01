// Metric columns of the partner Overview table, in display order. The partner adjustments table
// builds its columns from the same list so InsightsPage's column-state sync can keep the two grids
// aligned by colId (ADTR-10944). Add or reorder a metric column here, never in one table alone.
export const PARTNER_OVERVIEW_METRIC_COLUMNS = [
  { field: "clicks", headerKey: "insights.insightsPage.table.clicks", width: 100 },
  { field: "visitors", headerKey: "insights.insightsPage.table.uniqueClicks", width: 140 },
  { field: "paidClicks", headerKey: "insights.insightsPage.table.paidClicks", width: 100, hide: true },
  { field: "conversions", headerKey: "insights.insightsPage.table.conversions", width: 120 },
  { field: "convRate", headerKey: "insights.insightsPage.table.convRate", width: 100 },
  { field: "epc", headerKey: "insights.insightsPage.table.epc", width: 100 },
  { field: "commission", headerKey: "insights.insightsPage.table.commission", width: 120 },
  { field: "orderValue", headerKey: "insights.insightsPage.table.orderValue", width: 120, hide: true },
  { field: "aov", headerKey: "insights.insightsPage.table.aov", width: 120, hide: true }
];

export const PARTNER_OVERVIEW_METRIC_FIELDS = PARTNER_OVERVIEW_METRIC_COLUMNS.map(
  (column) => column.field
);
