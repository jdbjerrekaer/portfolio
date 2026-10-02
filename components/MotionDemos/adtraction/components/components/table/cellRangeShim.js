// portfolio edit: community-edition stand-in for AG Grid Enterprise cell range selection; not Adtraction code.
//
// AG Grid Enterprise's CellSelectionModule cannot ship in this portfolio (no licence), so this file
// gives the community grid api the four range methods the original Table / TableWrapper call
// (getCellRanges, addCellRange, clearRangeSelection, clearCellSelection), fires the same
// rangeSelectionChanged / cellSelectionChanged events with started/finished flags, and paints the
// same ag-cell-range-* classes so the original stylesheets draw the highlight.
//
// Supported input: mouse drag across cells, shift+click to extend, cmd/ctrl+click to add a range,
// shift+arrow keys to extend, plain arrow keys collapse to the focused cell.

const SELECTED = "ag-cell-range-selected";
const EDGE_CLASSES = ["top", "right", "bottom", "left"].map((edge) => `ag-cell-range-${edge}`);
const ARROWS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function attachCellRangeShim(api, root, isEnabled = () => true) {
  if (!api || !root || api.__portfolioCellRangeShim) return;
  api.__portfolioCellRangeShim = true;

  let ranges = [];
  const endColumns = new WeakMap(); // the column the user is dragging/extending towards
  let nextId = 0;
  let dragging = false;
  let paintFrame = null;

  const columns = () => api.getAllDisplayedColumns?.() || [];
  const columnsBetween = (a, b) => {
    const all = columns();
    const [from, to] = [all.indexOf(a), all.indexOf(b)].sort((x, y) => x - y);
    return from < 0 ? [a] : all.slice(from, to + 1);
  };
  const makeRange = (startRowIndex, endRowIndex, cols, startColumn = cols[0]) => ({
    id: `portfolio-range-${nextId++}`,
    startRow: { rowIndex: startRowIndex, rowPinned: null },
    endRow: { rowIndex: endRowIndex, rowPinned: null },
    columns: cols,
    startColumn
  });

  const dispatch = (started, finished) => {
    const event = { api, context: api.getGridOption?.("context"), started, finished };
    api.dispatchEvent({ ...event, type: "cellSelectionChanged" });
    api.dispatchEvent({ ...event, type: "rangeSelectionChanged" });
  };

  // Same class contract as Enterprise's CellRangeFeature.
  const paint = () => {
    paintFrame = null;
    const order = new Map(columns().map((column, index) => [column.getColId(), index]));
    const boxes = ranges.map((range) => {
      const indexes = range.columns.map((column) => order.get(column.getColId()) ?? -1);
      return {
        top: Math.min(range.startRow.rowIndex, range.endRow.rowIndex),
        bottom: Math.max(range.startRow.rowIndex, range.endRow.rowIndex),
        left: Math.min(...indexes),
        right: Math.max(...indexes),
        ids: new Set(range.columns.map((column) => column.getColId()))
      };
    });
    const isSingleCell =
      boxes.length === 1 && boxes[0].top === boxes[0].bottom && boxes[0].ids.size === 1;

    root.querySelectorAll(".ag-row .ag-cell[col-id]").forEach((cell) => {
      const rowIndex = Number(cell.closest(".ag-row").getAttribute("row-index"));
      const colId = cell.getAttribute("col-id");
      const colIndex = order.get(colId);
      const hits = Number.isInteger(rowIndex)
        ? boxes.filter((b) => rowIndex >= b.top && rowIndex <= b.bottom && b.ids.has(colId))
        : [];
      const count = hits.length;
      const edges = [
        hits.some((b) => rowIndex === b.top),
        hits.some((b) => colIndex === b.right),
        hits.some((b) => rowIndex === b.bottom),
        hits.some((b) => colIndex === b.left)
      ];

      cell.classList.toggle(SELECTED, count > 0);
      [1, 2, 3, 4].forEach((n) => cell.classList.toggle(`${SELECTED}-${n}`, Math.min(count, 4) === n));
      cell.classList.toggle("ag-cell-range-single-cell", isSingleCell && count === 1);
      EDGE_CLASSES.forEach((name, i) => cell.classList.toggle(name, !isSingleCell && edges[i]));
    });
  };
  const schedulePaint = () => {
    if (paintFrame === null) paintFrame = requestAnimationFrame(paint);
  };
  const commit = (started, finished) => {
    paint();
    dispatch(started, finished);
  };

  // --- api surface used by Table.jsx / TableWrapper.jsx -------------------------------------
  api.getCellRanges = () => ranges.slice();
  api.addCellRange = (params = {}) => {
    const resolve = (column) => (typeof column === "string" ? api.getColumn(column) : column);
    const cols = params.columns
      ? params.columns.map(resolve).filter(Boolean)
      : params.columnStart && params.columnEnd
        ? columnsBetween(resolve(params.columnStart), resolve(params.columnEnd))
        : [];
    if (!cols.length || !Number.isInteger(params.rowStartIndex)) return;
    const rowEndIndex = Number.isInteger(params.rowEndIndex) ? params.rowEndIndex : params.rowStartIndex;
    ranges.push(makeRange(params.rowStartIndex, rowEndIndex, cols));
    commit(false, true);
  };
  api.clearCellSelection = () => {
    if (!ranges.length) return;
    ranges = [];
    commit(false, true);
  };
  api.clearRangeSelection = api.clearCellSelection;

  // --- pointer input -------------------------------------------------------------------------
  const cellAt = (target) => {
    const cell = target instanceof Element ? target.closest(".ag-cell[col-id]") : null;
    if (!cell || !root.contains(cell) || cell.closest(".ag-floating-top, .ag-floating-bottom")) return null;
    const rowIndex = Number(cell.closest(".ag-row")?.getAttribute("row-index"));
    const column = api.getColumn(cell.getAttribute("col-id"));
    return Number.isInteger(rowIndex) && column ? { rowIndex, column } : null;
  };
  const setEnd = (range, { rowIndex, column }) => {
    range.endRow = { rowIndex, rowPinned: null };
    range.columns = columnsBetween(range.startColumn, column);
    endColumns.set(range, column);
  };
  const endColumnOf = (range) => endColumns.get(range) ?? range.startColumn;

  const onMouseMove = (event) => {
    const hit = cellAt(event.target);
    const range = ranges[ranges.length - 1];
    if (!hit || !range) return;
    if (range.endRow.rowIndex === hit.rowIndex && endColumnOf(range) === hit.column) return;
    window.getSelection?.()?.removeAllRanges();
    setEnd(range, hit);
    commit(false, false);
  };
  const onMouseUp = () => {
    dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    dispatch(false, true);
  };
  // Bubble phase on the grid root: Table.jsx's handleCellMouseDown stops propagation for pinned
  // rows and field-less columns, which keeps those cells out of a range exactly as before.
  const onMouseDown = (event) => {
    if (event.button !== 0 || event.defaultPrevented || !isEnabled()) return;
    const hit = cellAt(event.target);
    if (!hit) return;

    const last = ranges[ranges.length - 1];
    if (event.shiftKey && last) {
      setEnd(last, hit);
    } else {
      const fresh = makeRange(hit.rowIndex, hit.rowIndex, [hit.column]);
      ranges = event.metaKey || event.ctrlKey ? [...ranges, fresh] : [fresh];
    }
    commit(true, false);
    dragging = true;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // --- keyboard ------------------------------------------------------------------------------
  const onKeyDown = (event) => {
    const delta = ARROWS[event.key];
    const focused = api.getFocusedCell?.();
    if (!delta || !focused || focused.rowPinned || dragging || !isEnabled()) return;

    if (!event.shiftKey) {
      // Let the grid move focus, then collapse the selection onto the new cell (Enterprise does too).
      if (!ranges.length) return;
      requestAnimationFrame(() => {
        const next = api.getFocusedCell?.();
        if (!next || next.rowPinned) return;
        ranges = [makeRange(next.rowIndex, next.rowIndex, [next.column])];
        commit(false, true);
      });
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    let range = ranges[ranges.length - 1];
    if (!range) {
      range = makeRange(focused.rowIndex, focused.rowIndex, [focused.column]);
      ranges = [range];
    }
    const all = columns();
    const lastRow = api.getDisplayedRowCount() - 1;
    const rowIndex = Math.max(0, Math.min(lastRow, range.endRow.rowIndex + delta[0]));
    const column = all[Math.max(0, Math.min(all.length - 1, all.indexOf(endColumnOf(range)) + delta[1]))];
    setEnd(range, { rowIndex, column });
    api.ensureIndexVisible?.(rowIndex);
    api.ensureColumnVisible?.(column);
    commit(false, true);
  };

  // Rows and cells are virtualised and re-used after sort / scroll, so repaint when they change.
  const observer = new MutationObserver(() => ranges.length && schedulePaint());
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["row-index"] });
  const repaintEvents = ["modelUpdated", "displayedColumnsChanged", "viewportChanged"];
  repaintEvents.forEach((type) => api.addEventListener(type, schedulePaint));

  root.addEventListener("mousedown", onMouseDown);
  root.addEventListener("keydown", onKeyDown, true);

  api.addEventListener("gridPreDestroyed", () => {
    observer.disconnect();
    if (paintFrame !== null) cancelAnimationFrame(paintFrame);
    root.removeEventListener("mousedown", onMouseDown);
    root.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  });
}
