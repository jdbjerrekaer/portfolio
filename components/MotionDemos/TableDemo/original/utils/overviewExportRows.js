import { GROUP_COLUMN_PREFIX } from "./overviewTableCompare";

// Mirrors how TableWrapper formats a grid cell for export, so the extra rows read like the rest.
const formatExportCell = (colDef, value) => {
  if (value == null || value === "") return "";
  if (typeof colDef.valueFormatter === "function") return colDef.valueFormatter({ value, colDef });
  if (typeof value === "number") {
    if (colDef.field === "convRate") return `${value.toFixed(1)}%`;
    if (colDef.field === "epc" || colDef.field === "commission") return value.toFixed(2);
  }
  return value;
};

/**
 * Rows for TableWrapper `additionalExportRows`, keyed by colId. Each entry is
 * `{ label, values }`: the label goes in the (primary) group column, and each value is
 * written to the column whose field matches its key. Columns without a value stay blank.
 */
export const buildOverviewExportRows = (colDefs, rows) => {
  const labelColumn =
    colDefs.find((colDef) => colDef.colId?.startsWith(GROUP_COLUMN_PREFIX)) ?? colDefs[0];
  const labelColId = labelColumn?.colId ?? labelColumn?.field;

  return rows.map(({ label, values }) =>
    colDefs.reduce(
      (row, colDef) => {
        const colId = colDef.colId ?? colDef.field;
        if (colId !== labelColId && values && colDef.field in values) {
          row[colId] = formatExportCell(colDef, values[colDef.field]);
        }
        return row;
      },
      { [labelColId]: label }
    )
  );
};

/**
 * Totals row, one row per adjustment, then a "Total incl. adjustments" row. Only cost and
 * commission combine the main totals with the adjustments; ratios built on cost are left blank
 * because the adjustments have no clicks, conversions or order value to divide by.
 */
export const buildAdjustmentExportRowSpecs = ({
  totalsLabel,
  totalsRow,
  adjustments,
  inclAdjustmentsLabel,
  mainTotals,
  adjustmentTotals
}) => [
  ...(totalsRow ? [{ label: totalsLabel, values: totalsRow }] : []),
  ...adjustments.map(({ label, cost, commission }) => ({ label, values: { cost, commission } })),
  {
    label: inclAdjustmentsLabel,
    values: {
      cost: (mainTotals?.totalCost || 0) + (adjustmentTotals?.totalCostAdjustment || 0),
      commission:
        (mainTotals?.totalCommission || 0) + (adjustmentTotals?.totalCommissionAdjustment || 0)
    }
  }
];
