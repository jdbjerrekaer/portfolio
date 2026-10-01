/** Matches Table.module.scss `.ag-root-wrapper-body { max-height: 600px }` for autoHeight. */
export const AUTO_HEIGHT_BODY_MAX_PX = 600;

export function getRowMetrics(size) {
  const rowHeight = size === "small" ? 26 : size === "large" ? 48 : 36;
  const headerHeight = size === "small" ? 32 : size === "large" ? 48 : 40;
  const defaultRowsBySize = size === "small" ? 19 : size === "large" ? 15 : 13;
  return { rowHeight, headerHeight, defaultRowsBySize };
}

/** Visible data-row budget for large autoHeight tables under the 600px body cap. */
export function getLargeAutoHeightRowCap() {
  const { rowHeight, headerHeight } = getRowMetrics("large");
  return Math.floor((AUTO_HEIGHT_BODY_MAX_PX - headerHeight) / rowHeight);
}

/**
 * Client-side loading container height.
 * Large + autoHeight is capped to the loaded viewport (CSS max-height 600px).
 * Pass showFooter=true only when a pinned footer will actually render during load.
 */
export function getClientLoadingHeight({
  size,
  loadingRowCount,
  useNormalLayout,
  showFooter
}) {
  const { rowHeight, headerHeight } = getRowMetrics(size);
  let cappedRows = useNormalLayout ? Math.min(loadingRowCount, 15) : loadingRowCount;
  const footerHeight = showFooter ? rowHeight : 0;

  if (size === "large" && !useNormalLayout) {
    // Keep header + rows + optional footer inside the 600px body budget.
    const maxRows = Math.floor(
      (AUTO_HEIGHT_BODY_MAX_PX - headerHeight - footerHeight) / rowHeight
    );
    cappedRows = Math.min(cappedRows, maxRows);
  }

  return headerHeight + cappedRows * rowHeight + footerHeight;
}

export function getSkeletonRowCount({ size, lastNonEmptyRowCount, reserveFooter = false }) {
  const { defaultRowsBySize, headerHeight, rowHeight } = getRowMetrics(size);
  const MAX_SKELETON_ROWS = 50;
  let count = Math.min(lastNonEmptyRowCount || defaultRowsBySize, MAX_SKELETON_ROWS);

  // Keep large skeletons inside the loaded autoHeight viewport (skip when normal-layout path).
  if (size === "large" && !(lastNonEmptyRowCount > 1000)) {
    const footerHeight = reserveFooter ? rowHeight : 0;
    const maxRows = Math.floor(
      (AUTO_HEIGHT_BODY_MAX_PX - headerHeight - footerHeight) / rowHeight
    );
    count = Math.min(count, maxRows);
  }

  return count;
}
