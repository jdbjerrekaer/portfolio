import React, { useMemo, useState, useEffect, useRef, useCallback, useId } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
// portfolio edit: AG Grid Enterprise modules and the company licence key are not shipped; community modules only.
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import clsx from "clsx";
import { i18n } from "@adtraction/shared-i18n";
import { writeToClipboard } from "@adtraction/util-clipboard";
import { Toaster } from "../../tokens/toaster/Toaster";
import { CustomHeader } from "./CustomHeader";
import NoRowsOverlay from "./NoRowsOverlay";
import { SkeletonCell } from "./tableCells/SkeletonCell";
import { SkeletonRow } from "./tableCells/SkeletonRow";
import { CheckBoxCell } from "./tableCells/CheckBoxCell";
import { CheckBoxHeaderCell } from "./tableCells/CheckBoxHeaderCell";
import { ScrollShadow } from "../../tokens/shadow/ScrollShadow";
import { isTouchDevice } from "../../../utils/touch";
import { createPortal } from "react-dom";
import {
  getClientLoadingHeight,
  getRowMetrics,
  getSkeletonRowCount
} from "./tableLoadingHeight";

ModuleRegistry.registerModules([AllCommunityModule]);

const ROW_SELECTION_COLUMN_ID = "__row_selection__";

const isRangeSelectableColumn = (column) => {
  const colDef = column?.getColDef?.() || {};
  const colId = column?.getColId?.();
  return (Boolean(colDef.field) && colDef.field !== "ag-Grid-AutoColumn") || colId === ROW_SELECTION_COLUMN_ID;
};

export const Table = ({
  size = "default",
  rowData,
  colDefs,
  loading,
  noDataText,
  noRowsOverlayProps,
  onGridApiReady,
  onRowCountChange,
  showFooter = true,
  showRowSelection = true,
  showColumnHeaders = true,
  ariaLabel = null,
  // Infinite scroll / SSRM
  infiniteScroll = false,
  /**
   * Async loader for SSRM. Receives an object with:
   * { startRow, endRow, sortModel, filterModel, groupKeys, rowGroupCols, valueCols, pivotCols, pivotMode }
   * Should return: { rows: any[], totalRowCount?: number }
   */
  loadRows,
  /** Optional pinned bottom row data when using SSRM (totals provided by server) */
  pinnedBottomRowData,
  /** SSRM options */
  blockSize = 100,
  maxBlocksInCache = 20,
  maxConcurrentDatasourceRequests = 2,
  blockLoadDebounceMillis = 100,
  /** Optional getRowId to preserve selection during SSRM operations */
  getRowId,
  // Pagination
  pagination = false,
  paginationPageSize,
  paginationPageSizeSelector,
  isFullscreen = false,
  useAutoHeight = false,
  forceNormalLayout = false,
  onRangeSelectionChanged,
  onRangeSelectionTrimmed,
  cellSelection = null,
  rowClassRules = null,
  onCellMouseOver,
  onCellMouseOut,
  onSetColumnPinned,
  onHideColumn,
  onAutoSizeColumn,
  getPopoverAppendTarget,
  tableId = ""
}) => {
  const effectiveAriaLabel = ariaLabel || i18n.t("ui.toolkit.table.ariaLabel");
  const generatedTableId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const scrollShadowBaseId = useMemo(
    () =>
      `table-scroll-shadow-${String(tableId || generatedTableId).replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    [generatedTableId, tableId]
  );
  const gridRef = useRef();
  const containerRef = useRef();
  const updateShadowOpacitiesRef = useRef();
  const scheduleShadowRecalcRef = useRef(null);
  const pendingShadowRecalcRef = useRef(false);
  // Compute SSRM flag early so it's available to hooks below
  const isServerSide = infiniteScroll === true;
  const [ssrmEmpty, setSsrmEmpty] = useState(false);
  const isEmptyData =
    (Array.isArray(rowData) && rowData.length === 0) || (isServerSide && ssrmEmpty);
  // Set once the loading -> empty crossfade has played out; until then the skeletons stay up.
  const [emptyFadeDone, setEmptyFadeDone] = useState(false);
  // Derived during render, never from an effect: a post-paint update would give the grid one
  // painted frame of the outgoing rows every time `loading` turns true (ADTR-10396).
  const effectiveLoading = loading || (isEmptyData && !emptyFadeDone);
  const shadowRuntimeStateRef = useRef({
    loading,
    effectiveLoading,
    rowDataLength: Array.isArray(rowData) ? rowData.length : 0
  });
  // Show custom empty overlay for crossfade
  const [showEmptyOverlay, setShowEmptyOverlay] = useState(false);
  // Loading mask to ensure visual overlap during transition
  const [showMask, setShowMask] = useState(false);
  const [maskFading, setMaskFading] = useState(false);
  // Controls when overlay container should switch to visible class (to guarantee a paint at opacity 0)
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [scrollShadowTargets, setScrollShadowTargets] = useState(null);
  const [scrollShadowRecalculateKey, setScrollShadowRecalculateKey] = useState(0);
  const [scrollShadowDisabledEdges, setScrollShadowDisabledEdges] = useState({
    left: false,
    right: false
  });
  // Preserve last non-empty row count to avoid loading layout jumps.
  const [lastNonEmptyRowCount, setLastNonEmptyRowCount] = useState(null);
  const lastVisiblePinnedBottomRowDataRef = useRef([]);
  const EMPTY_FADE_MS = 350;

  // Cache DOM elements to avoid querySelector on every scroll
  const domElementsRef = useRef({
    viewport: null,
    centerViewport: null,
    viewportElement: null,
    pinnedLeftContainer: null,
    pinnedRightContainer: null,
    shadowElements: {
      top: null,
      bottom: null,
      right: null,
      left: null,
      rightHeader: null,
      rightFooter: null,
      leftHeader: null,
      leftFooter: null
    },
    pinnedElements: {
      header: null,
      body: null,
      footer: null
    },
    pinnedRightElements: {
      header: null,
      body: null,
      footer: null
    }
  });
  // Track last resize handle to safely clear inline cursor
  const lastResizeHandleRef = useRef(null);
  const checkboxDragStateRef = useRef({
    active: false,
    selected: false,
    lastNodeId: null
  });
  // Function to cache DOM elements to avoid repeated querySelector calls
  const cacheDOMElements = useCallback(() => {
    const currentTable = containerRef.current;
    if (!currentTable) return;

    const elements = domElementsRef.current;

    // Cache main viewport elements
    elements.viewport = currentTable.querySelector(".ag-body");
    elements.centerViewport = currentTable.querySelector(".ag-center-cols-viewport");
    elements.viewportElement = currentTable.querySelector(".ag-body-viewport");
    elements.pinnedLeftContainer = currentTable.querySelector(".ag-pinned-left-cols-container");
    elements.pinnedRightContainer = currentTable.querySelector(".ag-pinned-right-cols-container");

    // Cache header/footer shadow elements. Body shadows are rendered by ScrollShadow.
    elements.shadowElements.rightHeader = currentTable.querySelector(".scroll-shadow-right-header");
    elements.shadowElements.rightFooter = currentTable.querySelector(".scroll-shadow-right-footer");
    elements.shadowElements.leftHeader = currentTable.querySelector(".scroll-shadow-left-header");
    elements.shadowElements.leftFooter = currentTable.querySelector(".scroll-shadow-left-footer");

    // Cache pinned left elements
    elements.pinnedElements.header = currentTable.querySelector(".ag-pinned-left-header");
    elements.pinnedElements.body =
      currentTable.querySelector(".ag-pinned-left-cols-container") ||
      currentTable.querySelector(".ag-body-viewport .ag-pinned-left-cols-container");
    elements.pinnedElements.footer =
      currentTable.querySelector(".ag-floating-bottom .ag-pinned-left-cols-container") ||
      currentTable.querySelector(".ag-floating-bottom-container .ag-pinned-left-cols-container") ||
      currentTable.querySelector(".ag-pinned-left-floating-bottom");

    // Cache pinned right elements
    elements.pinnedRightElements.header = currentTable.querySelector(".ag-pinned-right-header");
    elements.pinnedRightElements.body =
      currentTable.querySelector(".ag-pinned-right-cols-container") ||
      currentTable.querySelector(".ag-body-viewport .ag-pinned-right-cols-container");
    elements.pinnedRightElements.footer =
      currentTable.querySelector(".ag-floating-bottom .ag-pinned-right-cols-container") ||
      currentTable.querySelector(".ag-floating-bottom-container .ag-pinned-right-cols-container") ||
      currentTable.querySelector(".ag-pinned-right-floating-bottom");
  }, []);

  useEffect(() => {
    if (loading && isServerSide) {
      setSsrmEmpty(false);
    }

    if (!loading && isEmptyData) {
      // Start crossfade: overlay fades in, mask fades out after mount
      setShowEmptyOverlay(true);
      setShowMask(true);
      setMaskFading(false);
      // ensure mask mounts first, then trigger fade-out
      const rafId = requestAnimationFrame(() => setMaskFading(true));
      // ensure overlay gets one paint at opacity 0 before toggling to visible
      setOverlayVisible(false);
      const t0 = setTimeout(() => setOverlayVisible(true), 30);

      setEmptyFadeDone(false);
      const t1 = setTimeout(() => setEmptyFadeDone(true), EMPTY_FADE_MS);
      const t2 = setTimeout(() => {
        setShowMask(false);
        setMaskFading(false);
      }, EMPTY_FADE_MS);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // Otherwise hide the overlay and re-arm the fade, so effectiveLoading tracks `loading` alone
    setShowEmptyOverlay(false);
    setShowMask(false);
    setMaskFading(false);
    setOverlayVisible(false);
    setEmptyFadeDone(false);
  }, [loading, rowData, isEmptyData, isServerSide, ssrmEmpty]);

  // Surface row count changes for client-side tables
  useEffect(() => {
    if (isServerSide) return;
    if (typeof onRowCountChange === "function") {
      const count = Array.isArray(rowData) ? rowData.length : 0;
      onRowCountChange(count);
    }
  }, [isServerSide, rowData, onRowCountChange]);

  // Keep track of last non-empty client-side data length for stable skeleton height.
  useEffect(() => {
    if (isServerSide || loading) return;
    const count = Array.isArray(rowData) ? rowData.length : 0;
    if (count > 0) {
      setLastNonEmptyRowCount((prev) => (prev === count ? prev : count));
    }
  }, [isServerSide, loading, rowData]);

  useEffect(() => {
    shadowRuntimeStateRef.current = {
      loading,
      effectiveLoading,
      rowDataLength: Array.isArray(rowData) ? rowData.length : 0
    };
  }, [loading, effectiveLoading, rowData]);

  const resolvedPinnedBottomRowData = useMemo(() => {
    if (!showFooter) return [];

    if (Array.isArray(pinnedBottomRowData)) {
      return pinnedBottomRowData;
    }

    if (isServerSide || !Array.isArray(rowData) || !Array.isArray(colDefs)) {
      return [];
    }

    const totalsRow = {};
    colDefs.forEach((col) => {
      if (col.aggFunc === "sum" || col.aggFunc === "avg") {
        const values = rowData
          .map((row) => row[col.field])
          .filter((value) => typeof value === "number");

        if (values.length > 0) {
          if (col.aggFunc === "sum") {
            totalsRow[col.field] = values.reduce((sum, value) => sum + value, 0);
          } else if (col.aggFunc === "avg") {
            totalsRow[col.field] = Number(
              (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)
            );
          }
        } else {
          totalsRow[col.field] = null;
        }
      } else if (col.footerLabel) {
        totalsRow[col.field] = col.footerLabel;
      } else {
        totalsRow[col.field] = null;
      }
    });

    return [totalsRow];
  }, [showFooter, pinnedBottomRowData, isServerSide, rowData, colDefs]);

  useEffect(() => {
    if (!showFooter) {
      lastVisiblePinnedBottomRowDataRef.current = [];
      return;
    }

    if (loading) return;

    lastVisiblePinnedBottomRowDataRef.current = resolvedPinnedBottomRowData;
  }, [showFooter, loading, resolvedPinnedBottomRowData]);

  const defaultColDef = useMemo(() => {
    return {
      headerComponent: CustomHeader,
      headerComponentParams: {
        size: size,
        sortable: true,
        onSetColumnPinned,
        onHideColumn,
        onAutoSizeColumn,
        getPopoverAppendTarget
      },
      icons: {
        sortAscending: null,
        sortDescending: null
      },
      suppressHeaderMenuButton: true,
      sortable: true,
      loadingCellRenderer: SkeletonCell,
      loadingCellRendererParams: {
        size: size
      },
      cellRendererParams: {
        size: size
      },
      flex: 1,
      minWidth:
        typeof window !== "undefined" && window.matchMedia?.("(max-width: 768px)").matches ? 110 : 150,
      resizable: true,
      cellClass: size === "small" ? "small" : size === "large" ? "large" : "default"
    };
  }, [size, onSetColumnPinned, onHideColumn, onAutoSizeColumn, getPopoverAppendTarget]);

  // Add alignment classes to columns
  const addAlignment = useCallback((col) => {
    let alignClass = "leftAligned"; // default

    // If explicit align prop is provided, use it
    if (col.align) {
      alignClass =
        col.align === "right"
          ? "rightAligned"
          : col.align === "center"
            ? "centerAligned"
            : "leftAligned";
    } else {
      // Auto-detect alignment based on content type
      // RIGHT: Numbers, currency, percentages, stats badges
      if (
        col.type === "rightAligned" ||
        col.cellRenderer === "NumberCell" ||
        col.cellRenderer?.name === "NumberCell" ||
        col.cellRenderer === "StatsBadgeCell" ||
        col.cellRenderer?.name === "StatsBadgeCell" ||
        col.field?.includes("amount") ||
        col.field?.includes("number") ||
        col.headerName?.includes("%")
      ) {
        alignClass = "rightAligned";
      }
      // CENTER: Status badges, buttons, actions, checkboxes
      else if (
        col.cellRenderer === "BadgeCell" ||
        col.cellRenderer?.name === "BadgeCell" ||
        col.cellRenderer === "ButtonCell" ||
        col.cellRenderer?.name === "ButtonCell" ||
        col.cellRenderer === "CustomCheckBoxCell" ||
        col.cellRenderer?.name === "CustomCheckBoxCell" ||
        col.field?.includes("status") ||
        col.field?.includes("action") ||
        col.field?.includes("enabled") ||
        col.field?.includes("premium") ||
        col.field?.includes("verified") ||
        col.field?.includes("flag") ||
        col.field?.includes("active")
      ) {
        alignClass = "centerAligned";
      }
    }

    // Remove custom properties that AG Grid doesn't recognize
    const cleanCol = { ...col };
    delete cleanCol.align;

    // Normalize percentage width strings to flex values
    // AG Grid doesn't support width: "100%" - convert to high flex value
    let normalizedWidth = cleanCol.width;
    let normalizedFlex = cleanCol.flex;

    if (typeof cleanCol.width === "string" && cleanCol.width.includes("%")) {
      // Remove the percentage width string
      delete cleanCol.width;
      normalizedWidth = undefined;
      // Set a high flex value to make column take up available space
      // Default flex is 1, so 10+ will make this column dominate
      normalizedFlex = cleanCol.flex || 10;
    }

    return {
      ...cleanCol,
      ...(normalizedWidth !== undefined && { width: normalizedWidth }),
      ...(normalizedFlex !== undefined && { flex: normalizedFlex }),
      cellClass: clsx(col.cellClass, alignClass),
      headerClass: clsx(col.headerClass, alignClass),
      cellRendererParams:
        typeof col.cellRendererParams === "function"
          ? (params) => ({
              ...col.cellRendererParams(params),
              alignmentClass: alignClass
            })
          : {
              ...col.cellRendererParams,
              alignmentClass: alignClass
            },
      headerComponentParams:
        typeof col.headerComponentParams === "function"
          ? (params) => ({
              ...col.headerComponentParams(params),
              alignmentClass: alignClass
            })
          : {
              ...col.headerComponentParams,
              alignmentClass: alignClass
            }
    };
  }, []);

  const getCheckboxDragNodeId = useCallback((node) => {
    if (!node || node.rowPinned) {
      return null;
    }

    return node.id ?? node.rowIndex ?? null;
  }, []);

  const applyCheckboxDragSelection = useCallback(
    (node) => {
      const dragState = checkboxDragStateRef.current;
      const nodeId = getCheckboxDragNodeId(node);

      if (!dragState.active || nodeId == null || dragState.lastNodeId === nodeId) {
        return;
      }

      dragState.lastNodeId = nodeId;
      node.setSelected(dragState.selected, false);
    },
    [getCheckboxDragNodeId]
  );

  const handleCheckboxSelectionDragStart = useCallback(
    (node, event) => {
      if (!node || node.rowPinned) {
        return;
      }

      const nextSelected = !node.isSelected();
      const nodeId = getCheckboxDragNodeId(node);
      checkboxDragStateRef.current = {
        active: true,
        selected: nextSelected,
        lastNodeId: nodeId
      };

      event?.preventDefault?.();
      event?.stopPropagation?.();
      node.setSelected(nextSelected, false);
    },
    [getCheckboxDragNodeId]
  );

  const handleCheckboxSelectionDragEnter = useCallback(
    (node) => {
      applyCheckboxDragSelection(node);
    },
    [applyCheckboxDragSelection]
  );

  useEffect(() => {
    const stopCheckboxDragSelection = () => {
      checkboxDragStateRef.current = {
        active: false,
        selected: false,
        lastNodeId: null
      };
    };

    document.addEventListener("mouseup", stopCheckboxDragSelection);
    return () => document.removeEventListener("mouseup", stopCheckboxDragSelection);
  }, []);

  // Selection column definition
  const selectionColumnDef = useMemo(() => {
    return {
      colId: ROW_SELECTION_COLUMN_ID,
      width: 48,
      minWidth: 48,
      maxWidth: 48,
      pinned: "left",
      lockPosition: "left",
      lockPinned: true,
      cellRenderer: CheckBoxCell,
      cellRendererParams: {
        size: size,
        onSelectionDragStart: handleCheckboxSelectionDragStart,
        onSelectionDragEnter: handleCheckboxSelectionDragEnter
      },
      loadingCellRendererParams: {
        size: size,
        isCheckbox: true
      },
      headerComponent: CheckBoxHeaderCell,
      headerComponentParams: {
        size: size
      },
      suppressHeaderMenuButton: true,
      sortable: false,
      resizable: false,
      suppressMovable: true,
      showInColumnChooser: false,
      cellClass: "centerAligned",
      headerClass: "centerAligned"
    };
  }, [handleCheckboxSelectionDragEnter, handleCheckboxSelectionDragStart, size]);

  const modifiedColDefs = useMemo(() => {
    if (!colDefs || colDefs.length === 0) {
      return colDefs;
    }

    // Apply alignment classes to all columns first
    let processedColDefs = colDefs.map(addAlignment);

    // Inject selection column if needed (for both SSRM and client-side)
    if (showRowSelection) {
      processedColDefs = [selectionColumnDef, ...processedColDefs];
    }

    // For client-side: handle loading state with full-width skeleton rows
    if (!isServerSide && loading && !infiniteScroll) {
      return processedColDefs.map((col) => {
        return {
          ...col,
          cellRenderer: () => null,
          cellRendererParams:
            typeof col.cellRendererParams === "function"
              ? (params) => ({
                  ...col.cellRendererParams(params),
                  size
                })
              : {
                  ...col.cellRendererParams,
                  size
                }
        };
      });
    }

    return processedColDefs;
  }, [
    colDefs,
    isServerSide,
    showRowSelection,
    selectionColumnDef,
    loading,
    infiniteScroll,
    size,
    addAlignment
  ]);

  const rowSelection = useMemo(() => {
    return showRowSelection ? "multiple" : false;
  }, [showRowSelection]);

  const noRowsOverlayComponentParams = {
    noDataText: noDataText,
    ...noRowsOverlayProps
  };

  // Generate skeleton data based on size.
  // Capped to avoid creating thousands of DOM nodes when the previous dataset was very large
  // (e.g. 20K rows). With autoHeight domLayout, every skeleton row becomes a real DOM element.
  // Large autoHeight also caps to the loaded viewport (CSS max-height 600px).
  // Mirror the pinned-footer effect: keep last-visible footer on reload, else use resolved rows.
  const getLoadingFooterRows = () =>
    lastVisiblePinnedBottomRowDataRef.current.length > 0
      ? lastVisiblePinnedBottomRowDataRef.current
      : resolvedPinnedBottomRowData;

  const getSkeletonData = () => {
    const reserveFooter =
      showFooter &&
      size === "large" &&
      !(lastNonEmptyRowCount > 1000) &&
      getLoadingFooterRows().length > 0;
    const skeletonRowCount = getSkeletonRowCount({
      size,
      lastNonEmptyRowCount,
      reserveFooter
    });
    return Array.from({ length: skeletonRowCount }, (_, index) => ({
      _skeletonIndex: index,
      _isSkeleton: true
    }));
  };

  const onGridReady = (params) => {
    onGridApiReady?.(params);

    // Header refresh logic for client-side tables
    if (!isServerSide) {
      setTimeout(() => {
        params.api.refreshHeader();
      }, 100);
    }

    // If SSRM is enabled and loadRows is provided, set up the datasource
    // If loadRows is not provided, let the parent component handle datasource setup via onGridApiReady
    if (infiniteScroll && loadRows) {
      const datasource = {
        getRows: async (getRowsParams) => {
          try {
            const request = {
              startRow: getRowsParams.request.startRow,
              endRow: getRowsParams.request.endRow,
              sortModel: getRowsParams.request.sortModel,
              filterModel: getRowsParams.request.filterModel,
              groupKeys: getRowsParams.request.groupKeys,
              rowGroupCols: getRowsParams.request.rowGroupCols,
              valueCols: getRowsParams.request.valueCols,
              pivotCols: getRowsParams.request.pivotCols,
              pivotMode: getRowsParams.request.pivotMode
            };

            const result = await loadRows?.(request);
            const rows = result?.rows || [];
            const totalRowCount = result?.totalRowCount;

            const hasNoData = rows.length === 0 && (!totalRowCount || totalRowCount === 0);
            setSsrmEmpty(hasNoData);

            if (typeof onRowCountChange === "function") {
              const countForConsumer =
                typeof totalRowCount === "number" ? totalRowCount : rows.length;
              onRowCountChange(countForConsumer);
            }

            if (typeof totalRowCount === "number") {
              getRowsParams.success({ rowData: rows, rowCount: totalRowCount });
            } else {
              getRowsParams.success({ rowData: rows });
            }

            if (hasNoData) {
              params.api.showNoRowsOverlay();
            } else {
              params.api.hideOverlay();
            }
          } catch (e) {
            console.error("SSRM getRows failed", e);
            getRowsParams.fail?.();
          }
        }
      };

      // Set the datasource (these properties must be set at grid initialization, not via setGridOption)
      params.api.setGridOption("serverSideDatasource", datasource);
    }

    // Create table shadow affordances for both client-side and SSRM tables
    {
      // Scope selectors to current table
      const currentTable = containerRef.current;
      const body = currentTable ? currentTable.querySelector(".ag-body") : null;
      const header = currentTable ? currentTable.querySelector(".ag-header") : null;
      const bodyViewport = currentTable ? currentTable.querySelector(".ag-body-viewport") : null;
      const centerViewport = currentTable ? currentTable.querySelector(".ag-center-cols-viewport") : null;

      if (body && header) {
        if (bodyViewport && centerViewport) {
          if (!body.id) body.id = `${scrollShadowBaseId}-body`;
          if (!bodyViewport.id) bodyViewport.id = `${scrollShadowBaseId}-body-viewport`;
          if (!centerViewport.id) centerViewport.id = `${scrollShadowBaseId}-center-viewport`;

          setScrollShadowTargets({
            wrapper: body.id,
            verticalScrollContainer: bodyViewport.id,
            horizontalScrollContainer: centerViewport.id,
            portalTarget: body
          });
        }

        // Create header shadows
        if (!header.querySelector(".scroll-shadow-right-header")) {
          const shadowRightHeaderDiv = document.createElement("div");
          shadowRightHeaderDiv.className = "scroll-shadow-right-header";
          header.appendChild(shadowRightHeaderDiv);
        }

        if (!header.querySelector(".scroll-shadow-left-header")) {
          const shadowLeftHeaderDiv = document.createElement("div");
          shadowLeftHeaderDiv.className = "scroll-shadow-left-header";
          header.appendChild(shadowLeftHeaderDiv);
        }

        // Create footer shadows if footer exists
        const footer = currentTable ? currentTable.querySelector(".ag-floating-bottom") : null;
        if (footer) {
          if (!footer.querySelector(".scroll-shadow-right-footer")) {
            const shadowRightFooterDiv = document.createElement("div");
            shadowRightFooterDiv.className = "scroll-shadow-right-footer";
            footer.appendChild(shadowRightFooterDiv);
          }

          if (!footer.querySelector(".scroll-shadow-left-footer")) {
            const shadowLeftFooterDiv = document.createElement("div");
            shadowLeftFooterDiv.className = "scroll-shadow-left-footer";
            footer.appendChild(shadowLeftFooterDiv);
          }
        }
      }

      let shadowRafId = null;
      const runShadowRecalc = () => {
        cacheDOMElements();
        const viewportElement = domElementsRef.current.viewportElement;
        const centerViewport = domElementsRef.current.centerViewport;
        const pinnedLeftContainer = domElementsRef.current.pinnedLeftContainer;
        const pinnedRightContainer = domElementsRef.current.pinnedRightContainer;
        const nextDisabledEdges = {
          left: Boolean(pinnedLeftContainer && pinnedLeftContainer.offsetWidth > 0),
          right: Boolean(pinnedRightContainer && pinnedRightContainer.offsetWidth > 0)
        };
        setScrollShadowDisabledEdges((currentEdges) =>
          currentEdges.left === nextDisabledEdges.left &&
          currentEdges.right === nextDisabledEdges.right
            ? currentEdges
            : nextDisabledEdges
        );
        if (!viewportElement || !centerViewport || !updateShadowOpacitiesRef.current) return;
        updateShadowOpacitiesRef.current(
          viewportElement.scrollTop || 0,
          centerViewport.scrollLeft || 0
        );
      };

      const scheduleShadowRecalc = () => {
        const state = shadowRuntimeStateRef.current;
        if (!isServerSide && state.effectiveLoading) return;
        if (shadowRafId !== null) {
          pendingShadowRecalcRef.current = true;
          return;
        }
        shadowRafId = requestAnimationFrame(() => {
          shadowRafId = null;
          runShadowRecalc();
          if (pendingShadowRecalcRef.current) {
            pendingShadowRecalcRef.current = false;
            scheduleShadowRecalc();
          }
        });
      };
      scheduleShadowRecalcRef.current = scheduleShadowRecalc;

      // AG Grid event-driven updates for data/model/layout changes.
      const handleGridChanged = () => {
        scheduleShadowRecalc();
        setScrollShadowRecalculateKey((key) => key + 1);
      };

      params.api.addEventListener("firstDataRendered", handleGridChanged);
      params.api.addEventListener("rowDataUpdated", handleGridChanged);
      params.api.addEventListener("modelUpdated", handleGridChanged);
      params.api.addEventListener("gridSizeChanged", handleGridChanged);
      params.api.addEventListener("displayedColumnsChanged", handleGridChanged);
      params.api.addEventListener("columnPinned", handleGridChanged);
      params.api.addEventListener("columnMoved", handleGridChanged);
      params.api.addEventListener("columnResized", handleGridChanged);

      // DOM-settle updates: react to viewport/container size changes.
      let shadowResizeObserver = null;
      if (typeof ResizeObserver !== "undefined") {
        shadowResizeObserver = new ResizeObserver(() => scheduleShadowRecalc());
        cacheDOMElements();
        const { viewportElement, centerViewport } = domElementsRef.current;
        if (viewportElement) shadowResizeObserver.observe(viewportElement);
        if (centerViewport && centerViewport !== viewportElement) {
          shadowResizeObserver.observe(centerViewport);
        }
        if (currentTable) shadowResizeObserver.observe(currentTable);
      }

      // Prime once after mount.
      scheduleShadowRecalc();

      // Add column resize hover functionality with event delegation for better performance
      const handleResizeHover = (event) => {
        const resizeHandle = event.target.closest(".ag-header-cell-resize");
        if (!resizeHandle) return;

        const cell = resizeHandle.closest(".ag-header-cell");
        if (!cell) return;

        if (event.type === "mouseenter") {
          cell.classList.add("ag-header-cell-resize-hover");
        } else if (event.type === "mouseleave") {
          cell.classList.remove("ag-header-cell-resize-hover");
        }
      };

      if (currentTable) {
        currentTable.addEventListener("mouseenter", handleResizeHover, true);
        currentTable.addEventListener("mouseleave", handleResizeHover, true);

        // Cursor override for column resize handle using event delegation
        const handleResizeCursor = (event) => {
          const handle = event.target.closest(".ag-header-cell-resize");
          // If the event is a mouseup or mouseleave anywhere, clear previous handle cursor
          if (!handle) {
            if (event.type === "mouseup" || event.type === "mouseleave") {
              if (lastResizeHandleRef.current) {
                lastResizeHandleRef.current.style.removeProperty("cursor");
                lastResizeHandleRef.current = null;
              }
            }
            return;
          }

          // Remember this handle so we can clear later
          lastResizeHandleRef.current = handle;

          if (event.type === "mouseenter" || event.type === "mousemove") {
            handle.style.cursor = "grab";
          } else if (event.type === "mousedown") {
            handle.style.cursor = "grabbing";
          } else if (event.type === "mouseup" || event.type === "mouseleave") {
            handle.style.removeProperty("cursor");
          }
        };

        currentTable.addEventListener("mouseenter", handleResizeCursor, true);
        currentTable.addEventListener("mousemove", handleResizeCursor, true);
        currentTable.addEventListener("mousedown", handleResizeCursor, true);
        currentTable.addEventListener("mouseup", handleResizeCursor, true);
        currentTable.addEventListener("mouseleave", handleResizeCursor, true);

        // Store cleanup function
        const cleanup = () => {
          if (shadowRafId !== null) {
            cancelAnimationFrame(shadowRafId);
            shadowRafId = null;
          }
          pendingShadowRecalcRef.current = false;
          scheduleShadowRecalcRef.current = null;
          shadowResizeObserver?.disconnect();
          params.api.removeEventListener("firstDataRendered", handleGridChanged);
          params.api.removeEventListener("columnResized", handleGridChanged);
          params.api.removeEventListener("rowDataUpdated", handleGridChanged);
          params.api.removeEventListener("modelUpdated", handleGridChanged);
          params.api.removeEventListener("gridSizeChanged", handleGridChanged);
          params.api.removeEventListener("displayedColumnsChanged", handleGridChanged);
          params.api.removeEventListener("columnPinned", handleGridChanged);
          params.api.removeEventListener("columnMoved", handleGridChanged);
          currentTable.removeEventListener("mouseenter", handleResizeHover, true);
          currentTable.removeEventListener("mouseleave", handleResizeHover, true);
          currentTable.removeEventListener("mouseenter", handleResizeCursor, true);
          currentTable.removeEventListener("mousemove", handleResizeCursor, true);
          currentTable.removeEventListener("mousedown", handleResizeCursor, true);
          currentTable.removeEventListener("mouseup", handleResizeCursor, true);
          currentTable.removeEventListener("mouseleave", handleResizeCursor, true);
          if (lastResizeHandleRef.current) {
            lastResizeHandleRef.current.style.removeProperty("cursor");
            lastResizeHandleRef.current = null;
          }
        };

        // Store cleanup for later use
        params.api._tableCleanup = cleanup;
      }
    }
  };

  const onColumnMoved = () => {
    if (!isServerSide) {
      // Refresh header after column move to update any styling
      setTimeout(() => {
        if (gridRef.current?.api) {
          gridRef.current.api.refreshHeader();
        }
      }, 50);
    }
  };

  // Helper function to calculate and update shadow opacities
  const updateShadowOpacities = useCallback(
    (scrollTop = 0, scrollLeft = 0) => {
      void scrollTop;
      const elements = domElementsRef.current;

      // Use cached elements instead of querySelector
      const centerViewport = elements.centerViewport;
      const viewportElement = elements.viewportElement;

      if (!viewportElement || !centerViewport || (!isServerSide && effectiveLoading)) {
        return;
      }

      // Horizontal header/footer and pinned-column shadows still need AG Grid-specific sync.
      const viewportWidth = centerViewport.clientWidth;
      const scrollWidth = centerViewport.scrollWidth;
      const maxScrollX = scrollWidth - viewportWidth;
      const SCROLL_THRESHOLD = 2;

      const hasHorizontalOverflow = maxScrollX > SCROLL_THRESHOLD;

      const scrollXFraction = hasHorizontalOverflow ? scrollLeft / maxScrollX : 0;

      // Check if there are actual visible pinned left columns using cached element
      const pinnedLeftContainer = elements.pinnedLeftContainer;
      const hasPinnedLeftColumns = pinnedLeftContainer && pinnedLeftContainer.offsetWidth > 0;

      // Check if there are actual visible pinned right columns using cached element
      const pinnedRightContainer = elements.pinnedRightContainer;
      const hasPinnedRightColumns = pinnedRightContainer && pinnedRightContainer.offsetWidth > 0;

      // Left shadow should only appear when there are NO pinned columns and we've scrolled right
      const leftOpacity =
        !hasHorizontalOverflow || scrollLeft === 0 || hasPinnedLeftColumns
          ? 0
          : Math.min(1, Math.max(scrollXFraction, 0));

      // Right shadow should only appear when there are NO pinned right columns and we haven't scrolled all the way right
      const rightShadowOpacity =
        !hasHorizontalOverflow || scrollLeft >= maxScrollX || hasPinnedRightColumns
          ? 0
          : Math.min(1, Math.max(1 - scrollXFraction, 0));

      // Header/footer shadows still follow the horizontal scroll state. Body shadows are
      // handled by the shared ScrollShadow component so they can show the idle hint too.
      const shadowElements = elements.shadowElements;

      if (shadowElements.rightHeader) shadowElements.rightHeader.style.opacity = rightShadowOpacity;
      if (shadowElements.rightFooter) shadowElements.rightFooter.style.opacity = rightShadowOpacity;
      if (shadowElements.leftHeader) shadowElements.leftHeader.style.opacity = leftOpacity;
      if (shadowElements.leftFooter) shadowElements.leftFooter.style.opacity = leftOpacity;

      // Handle pinned column shadows using cached elements
      const pinnedElements = elements.pinnedElements;
      const pinnedRightElements = elements.pinnedRightElements;

      // Pinned left columns should show shadow when there's horizontal overflow and we've scrolled
      const pinnedLeftOpacity =
        hasHorizontalOverflow && scrollLeft > 0 ? Math.min(1, Math.max(scrollXFraction, 0)) : 0;

      // Pinned right columns should show shadow when there's horizontal overflow and we haven't scrolled all the way right
      const pinnedRightOpacity =
        hasHorizontalOverflow && scrollLeft < maxScrollX
          ? Math.min(1, Math.max(1 - scrollXFraction, 0))
          : 0;

      if (pinnedElements.header)
        pinnedElements.header.style.setProperty("--left-shadow-opacity", pinnedLeftOpacity);
      if (pinnedElements.body)
        pinnedElements.body.style.setProperty("--left-shadow-opacity", pinnedLeftOpacity);
      if (pinnedElements.footer)
        pinnedElements.footer.style.setProperty("--left-shadow-opacity", pinnedLeftOpacity);

      if (pinnedRightElements.header)
        pinnedRightElements.header.style.setProperty("--right-shadow-opacity", pinnedRightOpacity);
      if (pinnedRightElements.body)
        pinnedRightElements.body.style.setProperty("--right-shadow-opacity", pinnedRightOpacity);
      if (pinnedRightElements.footer)
        pinnedRightElements.footer.style.setProperty("--right-shadow-opacity", pinnedRightOpacity);
    },
    [isServerSide, effectiveLoading]
  );

  useEffect(() => {
    updateShadowOpacitiesRef.current = updateShadowOpacities;
  }, [updateShadowOpacities]);

  // Ensure one deterministic recalculation after loading -> loaded transitions.
  useEffect(() => {
    if (isServerSide || loading || effectiveLoading) return;
    const schedule = scheduleShadowRecalcRef.current;
    if (!schedule) return;
    schedule();
  }, [isServerSide, loading, effectiveLoading]);

  const onGridScroll = (event) => {
    updateShadowOpacities(event.top, event.left);
  };

  const handleInternalRangeSelectionChanged = useCallback(
    (event) => {
      const api = event.api;
      if (!api) {
        onRangeSelectionChanged?.(event);
        return;
      }

      try {
        const cellRanges = api.getCellRanges();
        if (!cellRanges || cellRanges.length === 0) {
          onRangeSelectionChanged?.(event);
          return;
        }

        let hasInvalidSelection = false;
        const newRanges = [];

        cellRanges.forEach((range) => {
          if (
            !range.startRow ||
            !range.endRow ||
            !Array.isArray(range.columns) ||
            !Number.isInteger(range.startRow.rowIndex) ||
            !Number.isInteger(range.endRow.rowIndex)
          ) {
            hasInvalidSelection = true;
            return;
          }

          if (range.startRow.rowPinned || range.endRow.rowPinned) {
            hasInvalidSelection = true;
          }

          const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
          const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);

          let validStartRow = null;
          let validEndRow = null;

          for (let rowIdx = startRowIndex; rowIdx <= endRowIndex; rowIdx++) {
            const rowNode = api.getDisplayedRowAtIndex(rowIdx);
            if (rowNode && !rowNode.rowPinned) {
              if (validStartRow === null) validStartRow = rowIdx;
              validEndRow = rowIdx;
            } else if (rowNode?.rowPinned) {
              hasInvalidSelection = true;
            }
          }

          const validColumns = range.columns.filter((col) => {
            if (!isRangeSelectableColumn(col)) {
              hasInvalidSelection = true;
              return false;
            }
            return true;
          });

          if (validStartRow !== null && validEndRow !== null && validColumns.length > 0) {
            newRanges.push({
              startRowIndex: validStartRow,
              endRowIndex: validEndRow,
              columns: validColumns
            });
          }
        });

        if (hasInvalidSelection) {
          api.clearRangeSelection();

          newRanges.forEach((rangeInfo) => {
            if (rangeInfo.startRowIndex <= rangeInfo.endRowIndex && rangeInfo.columns.length > 0) {
              const columnIds = rangeInfo.columns
                .map((col) => col.getColId?.())
                .filter(Boolean);
              if (columnIds.length === 0) return;

              api.addCellRange({
                rowStartIndex: rangeInfo.startRowIndex,
                rowEndIndex: rangeInfo.endRowIndex,
                columns: columnIds
              });
            }
          });

          onRangeSelectionTrimmed?.();
        }
      } catch (error) {
        console.warn("Error handling range selection:", error);
      }

      onRangeSelectionChanged?.(event);
    },
    [onRangeSelectionChanged, onRangeSelectionTrimmed]
  );

  const handleCellMouseDown = useCallback((event) => {
    if (event.node?.rowPinned) {
      event.event?.preventDefault?.();
      event.event?.stopPropagation?.();
      return;
    }

    const colDef = event.column?.getColDef?.();
    if (colDef && !colDef.field) {
      event.event?.preventDefault?.();
      event.event?.stopPropagation?.();
      return;
    }
  }, []);

  const handleCellDoubleClicked = useCallback((event) => {
    const api = gridRef.current?.api;
    if (!api) return;

    if (event.node?.rowPinned) {
      return;
    }

    const colDef = event.column?.getColDef?.();
    if (colDef && !colDef.field) {
      return;
    }

    const rowIndex = event.node.rowIndex;
    const column = event.column;

    if (rowIndex != null && column) {
      api._doubleClickCellRangeTs = Date.now();
      api.clearRangeSelection();
      api.addCellRange({
        rowStartIndex: rowIndex,
        rowEndIndex: rowIndex,
        columns: [column.getColId()]
      });
    }
  }, []);

  // Handle copy keyboard shortcut (Cmd+C / Ctrl+C) for selected cell ranges
  useEffect(() => {
    const handleCopyKeyDown = (event) => {
      const isCopy =
        (event.metaKey || event.ctrlKey) && event.key === "c" && !event.shiftKey && !event.altKey;
      if (!isCopy) return;

      const container = containerRef.current;
      if (!container) return;

      const active = document.activeElement;
      if (!active || !container.contains(active)) return;

      const api = gridRef.current?.api;
      if (!api) return;

      const cellRanges = api.getCellRanges();
      if (!cellRanges || cellRanges.length === 0) return;

      event.preventDefault();
      event.stopPropagation();

      try {
        const copyRows = [];

        cellRanges.forEach((range) => {
          if (!range.startRow || !range.endRow || !range.columns) return;
          if (range.startRow.rowPinned || range.endRow.rowPinned) return;

          const startIdx = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
          const endIdx = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);

          const cols = range.columns.filter((col) => col.getColDef?.()?.field);
          if (cols.length === 0) return;

          for (let rowIdx = startIdx; rowIdx <= endIdx; rowIdx++) {
            const rowNode = api.getDisplayedRowAtIndex(rowIdx);
            if (!rowNode || rowNode.rowPinned) continue;

            const vals = cols.map((col) => {
              const colDef = col.getColDef();
              const field = colDef.field;
              let value;
              if (typeof colDef.valueGetter === "function") {
                try { value = colDef.valueGetter({ data: rowNode.data, node: rowNode, colDef, column: col, api }); } catch { value = rowNode.data?.[field]; }
              } else {
                value = rowNode.data?.[field];
              }
              return value != null ? String(value) : "";
            });
            copyRows.push(vals.join("\t"));
          }
        });

        if (copyRows.length > 0) {
          writeToClipboard(copyRows.join("\n")).catch(() => {
            Toaster.trigger({
              type: "error",
              title: i18n.t("ui.toolkit.table.copyFailed")
            });
          });
        }
      } catch {
        // no-op
      }
    };

    document.addEventListener("keydown", handleCopyKeyDown);
    return () => document.removeEventListener("keydown", handleCopyKeyDown);
  }, []);

  // Get current scroll position for shadow updates
  const getCurrentScrollPosition = useCallback(() => {
    const elements = domElementsRef.current;
    const viewportElement = elements.viewportElement;
    if (!viewportElement) return { scrollTop: 0, scrollLeft: 0 };

    return {
      scrollTop: viewportElement.scrollTop,
      scrollLeft: viewportElement.scrollLeft
    };
  }, []);

  // Handle grid resize events
  const onGridSizeChanged = useCallback(() => {
    // Re-cache DOM elements in case layout changed
    cacheDOMElements();
    const { scrollTop, scrollLeft } = getCurrentScrollPosition();
    updateShadowOpacities(scrollTop, scrollLeft);
  }, [cacheDOMElements, getCurrentScrollPosition, updateShadowOpacities]);

  // Handle column resize events
  const onColumnResized = useCallback(
    (params) => {
      // Re-cache pinned containers in case columns were resized
      const currentTable = containerRef.current;
      if (currentTable) {
        const pinnedLeftContainer = currentTable.querySelector(".ag-pinned-left-cols-container");
        domElementsRef.current.pinnedLeftContainer = pinnedLeftContainer;
        const pinnedRightContainer = currentTable.querySelector(".ag-pinned-right-cols-container");
        domElementsRef.current.pinnedRightContainer = pinnedRightContainer;
      }

      // Auto-scroll to keep last column visible during resize
      const api = gridRef.current?.api;
      if (api && params?.source === "uiColumnResized") {
        const displayedColumns = api.getAllDisplayedColumns();
        if (displayedColumns.length > 0) {
          const lastColumn = displayedColumns[displayedColumns.length - 1];
          const resizedColumn = params.column;

          // Check if the resized column is the last visible column
          if (resizedColumn && lastColumn && resizedColumn.getColId() === lastColumn.getColId()) {
            const centerViewport = domElementsRef.current.centerViewport;

            if (centerViewport) {
              // Scroll all the way to the right to keep the column's right edge visible
              requestAnimationFrame(() => {
                const maxScrollLeft = centerViewport.scrollWidth - centerViewport.clientWidth;
                if (maxScrollLeft > 0) {
                  centerViewport.scrollLeft = maxScrollLeft;
                }
              });
            }
          }
        }
      }

      const { scrollTop, scrollLeft } = getCurrentScrollPosition();
      updateShadowOpacities(scrollTop, scrollLeft);
    },
    [getCurrentScrollPosition, updateShadowOpacities]
  );

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api) return;

    const pinnedFooterRows =
      loading && lastVisiblePinnedBottomRowDataRef.current.length > 0
        ? lastVisiblePinnedBottomRowDataRef.current
        : resolvedPinnedBottomRowData;

    if (!showFooter) {
      api.setGridOption("pinnedBottomRowData", []);
      return;
    }

    api.setGridOption("pinnedBottomRowData", pinnedFooterRows);
  }, [
    showFooter,
    loading,
    resolvedPinnedBottomRowData,
    gridRef.current?.api
  ]);

  // Add window resize listener to update shadows when viewport changes
  useEffect(() => {
    let resizeTimeout;
    const handleWindowResize = () => {
      // Debounce resize events to avoid excessive calls
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Re-cache DOM elements in case layout changed
        cacheDOMElements();
        const { scrollTop, scrollLeft } = getCurrentScrollPosition();
        updateShadowOpacities(scrollTop, scrollLeft);
      }, 150);
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [cacheDOMElements, getCurrentScrollPosition, updateShadowOpacities]);

  useEffect(() => {
    if (!gridRef.current?.api) return;

    const container = containerRef.current;
    if (!container) return;

    let isSelecting = false;
    let autoScrollInterval = null;
    const SCROLL_ZONE = 50;
    const SCROLL_SPEED = 10;
    const SCROLL_INTERVAL = 16;

    const getViewportBounds = () => {
      const viewportElement = domElementsRef.current.viewportElement;
      const centerViewport = domElementsRef.current.centerViewport;
      if (!viewportElement) return null;

      const verticalRect = viewportElement.getBoundingClientRect();
      // Use centerViewport for horizontal bounds if available (handles pinned columns)
      const horizontalRect = centerViewport ? centerViewport.getBoundingClientRect() : verticalRect;

      return {
        top: verticalRect.top,
        bottom: verticalRect.bottom,
        left: horizontalRect.left,
        right: horizontalRect.right,
        width: horizontalRect.width,
        height: verticalRect.height
      };
    };

    const shouldScroll = (mouseX, mouseY, bounds) => {
      if (!bounds) return { vertical: 0, horizontal: 0 };

      let vertical = 0;
      let horizontal = 0;

      // Scroll up: mouse is above viewport OR within SCROLL_ZONE from top edge
      if (mouseY < bounds.top + SCROLL_ZONE) {
        vertical = -1;
      }
      // Scroll down: mouse is below viewport OR within SCROLL_ZONE from bottom edge
      else if (mouseY > bounds.bottom - SCROLL_ZONE) {
        vertical = 1;
      }

      // Scroll left: mouse is left of viewport OR within SCROLL_ZONE from left edge
      if (mouseX < bounds.left + SCROLL_ZONE) {
        horizontal = -1;
      }
      // Scroll right: mouse is right of viewport OR within SCROLL_ZONE from right edge
      else if (mouseX > bounds.right - SCROLL_ZONE) {
        horizontal = 1;
      }

      return { vertical, horizontal };
    };

    const performAutoScroll = (direction) => {
      const viewportElement = domElementsRef.current.viewportElement;
      const centerViewport = domElementsRef.current.centerViewport;

      // Vertical scrolling uses the main viewport element
      if (direction.vertical !== 0 && viewportElement) {
        const currentScrollTop = viewportElement.scrollTop || 0;
        const newScrollTop = currentScrollTop + direction.vertical * SCROLL_SPEED;
        const maxScrollTop = viewportElement.scrollHeight - viewportElement.clientHeight;
        viewportElement.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
      }

      // Horizontal scrolling uses the center viewport (AG Grid's horizontal scroll container)
      if (direction.horizontal !== 0 && centerViewport) {
        const currentScrollLeft = centerViewport.scrollLeft || 0;
        const newScrollLeft = currentScrollLeft + direction.horizontal * SCROLL_SPEED;
        const maxScrollLeft = centerViewport.scrollWidth - centerViewport.clientWidth;
        centerViewport.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScrollLeft));
      }
    };

    const handleMouseDown = (event) => {
      const target = event.target;
      const isCell = target.closest(".ag-cell");
      if (isCell && !target.closest(".ag-header") && !target.closest(".ag-row-pinned")) {
        isSelecting = true;
      }
    };

    const handleMouseMove = (event) => {
      if (!isSelecting) return;

      const bounds = getViewportBounds();
      const direction = shouldScroll(event.clientX, event.clientY, bounds);

      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }

      if (direction.vertical !== 0 || direction.horizontal !== 0) {
        autoScrollInterval = setInterval(() => {
          performAutoScroll(direction);
        }, SCROLL_INTERVAL);
      }
    };

    const handleMouseUp = () => {
      isSelecting = false;
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, []);

  // Handle fullscreen mode changes
  useEffect(() => {
    if (isFullscreen && gridRef.current?.api) {
      // Force grid to recalculate size when entering fullscreen
      setTimeout(() => {
        gridRef.current.api.sizeColumnsToFit();
        gridRef.current.api.redrawRows();
      }, 100);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const api = gridRef.current?.api;
    if (!api || !isServerSide) return;

    if (ssrmEmpty) {
      api.showNoRowsOverlay();
    } else {
      api.hideOverlay();
    }
  }, [ssrmEmpty, isServerSide]);

  // Cleanup effect for event listeners
  useEffect(() => {
    return () => {
      // Cleanup any stored event listeners
      const api = gridRef.current?.api;
      if (api?._tableCleanup) {
        api._tableCleanup();
      }
    };
  }, []);

  const isCrossfading = showEmptyOverlay && effectiveLoading;
  const isEmptyFinal = !effectiveLoading && isEmptyData;

  // Determine if we have a large dataset that requires normal layout for virtualization.
  // Also consider the lastNonEmptyRowCount during loading, because skeleton data
  // is sized to match it — rendering thousands of skeleton rows in autoHeight mode freezes the page.
  const hasLargeDataset =
    (Array.isArray(rowData) && rowData.length > 1000) ||
    (effectiveLoading && lastNonEmptyRowCount !== null && lastNonEmptyRowCount > 1000);
  const shouldForceNormalLayout = forceNormalLayout === true;
  const useNormalLayout = shouldForceNormalLayout || hasLargeDataset;

  const getAdaptiveEmptyHeight = (useDefaultRows = false) => {
    const { rowHeight, headerHeight, defaultRowsBySize } = getRowMetrics(size);
    const baseRows = useDefaultRows
      ? defaultRowsBySize
      : (lastNonEmptyRowCount ?? defaultRowsBySize);
    const rowsForHeight = useDefaultRows ? defaultRowsBySize : Math.max(4, Math.min(baseRows, 10));
    return headerHeight + rowsForHeight * rowHeight + 20; // +20 for scrollbar/padding
  };

  // Calculate dynamic height for normal layout based on dataset size
  const getNormalLayoutHeight = () => {
    if (isFullscreen) return "100%";
    const { rowHeight, headerHeight, defaultRowsBySize } = getRowMetrics(size);

    if (!loading && isEmptyData) return getAdaptiveEmptyHeight(true);
    if (isCrossfading) return getAdaptiveEmptyHeight();
    if (isEmptyFinal) return getAdaptiveEmptyHeight(true);
    if (effectiveLoading && !isServerSide) {
      const loadingRowCount = lastNonEmptyRowCount || defaultRowsBySize;
      // Large autoHeight: match loaded CSS max-height 600px (not 15 rows + footer = 816).
      // Normal layout: still cap at 15 so a prior 20K-row dataset cannot explode height.
      // Reserve footer only when the pinned footer will still render during load.
      const reserveFooter =
        showFooter &&
        (useNormalLayout || size !== "large" || getLoadingFooterRows().length > 0);
      return getClientLoadingHeight({
        size,
        loadingRowCount,
        useNormalLayout,
        showFooter: reserveFooter
      });
    }
    if (useNormalLayout) {
      // Set a reasonable max height for large datasets (e.g., ~15 rows visible)
      const visibleRows = 15;
      const footerHeight = showFooter ? rowHeight : 0;
      return headerHeight + visibleRows * rowHeight + footerHeight;
    }
    return "100%";
  };

  const resolvedHeight =
    useAutoHeight && !shouldForceNormalLayout ? "auto" : getNormalLayoutHeight();
  const resolvedDomLayout =
    useAutoHeight && !shouldForceNormalLayout
      ? "autoHeight"
      : isServerSide || isFullscreen
        ? "normal"
        : isCrossfading || isEmptyFinal || (!loading && isEmptyData)
          ? "normal"
          : useNormalLayout
            ? "normal"
            : "autoHeight";

  useEffect(() => {
    if (!effectiveLoading) return;
    const viewportEl = containerRef.current?.querySelector(".ag-body-viewport");
    if (!viewportEl) return;
    viewportEl.scrollTop = 0;
  }, [effectiveLoading]);

  return (
    <div
      ref={containerRef}
      className={`ag-theme-alpine ${isCrossfading ? "table-crossfading" : ""} ${effectiveLoading ? "table-loading" : ""}`}
      style={{
        position: "relative",
        height: resolvedHeight,
        width: "100%",
        "--table-empty-overlay-min-height": `${getAdaptiveEmptyHeight()}px`,
        // Ensure a pleasant height for overlays when empty
        ...(isServerSide ? { minHeight: 300 } : {}),
        borderRadius: "var(--size-radius-200)",
        overflow: isServerSide ? "visible" : "hidden"
      }}>
      <AgGridReact
        ref={gridRef}
        theme="legacy"
        ariaLabel={effectiveAriaLabel}
        rowData={isServerSide ? undefined : effectiveLoading ? getSkeletonData() : rowData}
        columnDefs={modifiedColDefs}
        defaultColDef={defaultColDef}
        rowModelType={isServerSide ? "serverSide" : "clientSide"}
        cacheBlockSize={isServerSide ? blockSize : undefined}
        maxBlocksInCache={isServerSide ? maxBlocksInCache : undefined}
        maxConcurrentDatasourceRequests={isServerSide ? maxConcurrentDatasourceRequests : undefined}
        blockLoadDebounceMillis={isServerSide ? blockLoadDebounceMillis : undefined}
        getRowId={
          getRowId ||
          ((params) => {
            const data = params?.data;
            if (!data) {
              return `row-${Math.random().toString(36).slice(2)}`;
            }

            if (data._isSkeleton) {
              return `skeleton-${data._skeletonIndex}`;
            }

            const explicitId = data.id || data.uuid || data.key || data._id || data.uniqueId;
            if (explicitId != null) return String(explicitId);

            // Stable hash based on deterministic JSON of the data object
            const stableStringify = (obj) => {
              try {
                const keys = Object.keys(obj).sort();
                const parts = keys.map(
                  (k) =>
                    `${k}:${typeof obj[k] === "object" ? JSON.stringify(obj[k]) : String(obj[k])}`
                );
                return parts.join("|");
              } catch {
                return String(obj);
              }
            };
            const source = stableStringify(data);
            let hashValue = 0;
            for (let i = 0; i < source.length; i++) {
              const ch = source.charCodeAt(i);
              hashValue = (hashValue << 5) - hashValue + ch;
              hashValue |= 0; // 32-bit
            }
            return `hash-${Math.abs(hashValue)}`;
          })
        }
        rowSelection={rowSelection}
        rowMultiSelectWithClick={true}
        suppressRowDeselection={false}
        suppressRowClickSelection={true}
        suppressCellFocus={false}
        cellSelection={false} // portfolio edit: CellSelectionModule is AG Grid Enterprise (not licensed here)
        onRangeSelectionChanged={handleInternalRangeSelectionChanged}
        onCellMouseDown={handleCellMouseDown}
        onCellDoubleClicked={handleCellDoubleClicked}
        onCellMouseOver={onCellMouseOver}
        onCellMouseOut={onCellMouseOut}
        onBodyScroll={onGridScroll}
        onGridReady={onGridReady}
        onColumnMoved={isServerSide ? undefined : onColumnMoved}
        onGridSizeChanged={onGridSizeChanged}
        onColumnResized={onColumnResized}
        suppressContextMenu={true}
        noRowsOverlayComponent={NoRowsOverlay}
        noRowsOverlayComponentParams={{
          ...noRowsOverlayComponentParams
        }}
        suppressRowHoverHighlight={false}
        rowHeight={size === "small" ? 26 : size === "large" ? 48 : 36}
        headerHeight={showColumnHeaders ? (size === "small" ? 32 : size === "large" ? 48 : 40) : 0}
        rowClassRules={rowClassRules}
        fullWidthCellRenderer={
          !isServerSide && effectiveLoading && !infiniteScroll ? SkeletonRow : undefined
        }
        fullWidthCellRendererParams={
          !isServerSide && effectiveLoading && !infiniteScroll
            ? {
                size: size
              }
            : undefined
        }
        isFullWidthRow={(params) => {
          return params.rowNode?.data?._isSkeleton === true;
        }}
        getRowHeight={(params) => {
          if (params.node?.rowPinned) {
            return size === "small" ? 26 : size === "large" ? 48 : 36;
          }
          if (params.data?._isSkeleton) {
            return size === "small" ? 26 : size === "large" ? 48 : 36;
          }
          return undefined;
        }}
        domLayout={resolvedDomLayout}
        suppressDragLeaveHidesColumns={true}
        suppressMoveWhenColumnDragging={false}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
      />
      {showMask && (
        <div
          className={`loading-mask${maskFading ? " fade-out" : ""}`}
          style={{ position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none" }}
        />
      )}
      {showEmptyOverlay && (
        <div
          className={`ag-overlay-no-rows-wrapper custom-no-rows ${overlayVisible ? "visible" : ""}`}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 40
          }}>
          <NoRowsOverlay noDataText={noDataText} />
        </div>
      )}
      {scrollShadowTargets?.portalTarget &&
        !effectiveLoading &&
        !isEmptyData &&
        createPortal(
          <>
            <ScrollShadow
              key={`${scrollShadowTargets.verticalScrollContainer}-vertical`}
              wrapper={scrollShadowTargets.wrapper}
              scrollContainer={scrollShadowTargets.verticalScrollContainer}
              dark
              strength={10}
              blur="0.125rem"
              direction="vertical"
              recalculateKey={scrollShadowRecalculateKey}
              showIdleHint={!isTouchDevice()}
            />
            <ScrollShadow
              key={`${scrollShadowTargets.horizontalScrollContainer}-horizontal`}
              wrapper={scrollShadowTargets.wrapper}
              scrollContainer={scrollShadowTargets.horizontalScrollContainer}
              dark
              strength={6}
              blur="0.125rem"
              direction="horizontal"
              disabledShadowEdges={scrollShadowDisabledEdges}
              recalculateKey={scrollShadowRecalculateKey}
              showIdleHint={!isTouchDevice()}
            />
          </>,
          scrollShadowTargets.portalTarget
        )}
    </div>
  );
};
