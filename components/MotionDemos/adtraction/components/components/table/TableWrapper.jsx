import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Table } from "./Table";
import { Button } from "../../tokens/button/Button";
import { Chip } from "../../tokens/chip/Chip";
import { Tag } from "../../tokens/tag/Tag";
import { Icons } from "@adtraction/ui-icons";
import { formatNumber } from "@adtraction/util-number";
import { writeToClipboard } from "@adtraction/util-clipboard";
import { Toaster } from "../../tokens/toaster/Toaster";
import styles from "./Table.compiled.module.css"; // portfolio edit: see file header
import "./Table.compiled.global.css"; // portfolio edit
import { i18n } from "@adtraction/shared-i18n";
import * as XLSX from "xlsx";

const getUiComponentsVersion = () => {
  if (typeof __UI_COMPONENTS_VERSION__ !== "undefined") {
    return __UI_COMPONENTS_VERSION__;
  }

  try {
    const pkg = null; // portfolio edit: no toolkit package.json in the portfolio
    return pkg?.version || null;
  } catch {
    return null;
  }
};

import { ListItem } from "../../tokens/listItem/ListItem";
import { ListItemWrapper } from "../../tokens/listItem/ListItemWrapper";

import { CheckBox } from "../../tokens/checkBox/checkBox/CheckBox";
import { ScrollShadow } from "../../tokens/shadow/ScrollShadow";
import { Modal } from "../modal/Modal";
import { getOverlayPortalTarget } from "../../misc/overlayPortal";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { PlaceholderSkeleton } from "../../tokens/placeholderSkeleton/PlaceholderSkeleton";
import { SubscribeModal } from "./SubscribeModal";
import { TableSelectionBar } from "./TableSelectionBar";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TABLE_DRAG_OVERLAY_Z_INDEX = 10000021;
const TABLE_WARNING_EXIT_MS = 160;
const ROW_SELECTION_COLUMN_ID = "__row_selection__";

const isRangeSelectableColumn = (column) => {
  const colDef = column?.getColDef?.() || {};
  const colId = column?.getColId?.();
  return (Boolean(colDef.field) && colDef.field !== "ag-Grid-AutoColumn") || colId === ROW_SELECTION_COLUMN_ID;
};

const isRangeCountableColumn = (column) => {
  const colId = column?.getColId?.();
  return isRangeSelectableColumn(column) && colId !== ROW_SELECTION_COLUMN_ID;
};

const getManagedTableColumns = (gridApi, { validColumnIds } = {}) => {
  if (!gridApi) return [];

  const columnDefsMap = {};
  try {
    const allColumns = gridApi.getAllGridColumns?.() || [];
    (Array.isArray(allColumns) ? allColumns : []).forEach((column) => {
      const colDef = column.getColDef?.() || {};
      columnDefsMap[column.getColId()] = {
        headerName: colDef.headerName || colDef.field || column.getColId(),
        field: colDef.field,
        showInColumnChooser: colDef.showInColumnChooser !== false
      };
    });
  } catch {
    return [];
  }

  const columnState = (gridApi.getColumnState?.() || []).filter(
    (columnStateItem) =>
      !validColumnIds || validColumnIds.size === 0 || validColumnIds.has(columnStateItem.colId)
  );
  return (Array.isArray(columnState) ? columnState : [])
    .map((colState, index) => {
      const colDef = columnDefsMap[colState.colId] || {};
      return {
        colId: colState.colId,
        headerName: colDef.headerName || colState.colId,
        visible: !colState.hide,
        pinned: colState.pinned || null,
        field: colDef.field,
        showInColumnChooser: colDef.showInColumnChooser,
        originalIndex: index
      };
    })
    .filter(
      (column) =>
        (!validColumnIds || validColumnIds.size === 0 || validColumnIds.has(column.colId)) &&
        column.field &&
        column.field !== "ag-Grid-AutoColumn" &&
        column.showInColumnChooser !== false
    );
};

const getColumnsWithUpdatedPinState = (
  columns,
  colId,
  newPinned,
  { markTransition = false } = {}
) => {
  const updatedColumns = columns.map((column) =>
    column.colId === colId
      ? {
          ...column,
          pinned: newPinned,
          ...(markTransition ? { isTransitioningIn: true } : {})
        }
      : column
  );

  const columnToMove = updatedColumns.find((column) => column.colId === colId);
  if (!columnToMove) {
    return columns;
  }

  const otherColumns = updatedColumns.filter((column) => column.colId !== colId);
  const pinnedLeftColumns = otherColumns.filter((column) => column.pinned === "left");
  const unpinnedColumns = otherColumns.filter((column) => !column.pinned);
  const pinnedRightColumns = otherColumns.filter((column) => column.pinned === "right");

  if (newPinned === "left") {
    return [...pinnedLeftColumns, columnToMove, ...unpinnedColumns, ...pinnedRightColumns];
  }

  if (newPinned === "right") {
    return [...pinnedLeftColumns, ...unpinnedColumns, ...pinnedRightColumns, columnToMove];
  }

  return [...pinnedLeftColumns, columnToMove, ...unpinnedColumns, ...pinnedRightColumns];
};

const applyManagedTableColumns = (gridApi, columns) => {
  if (!gridApi || !Array.isArray(columns) || columns.length === 0) return;
  const reorderableColumns = columns.filter((column) => !column.isSynthetic);

  if (reorderableColumns.length === 0) {
    return;
  }

  const currentState = gridApi.getColumnState?.() || [];
  const sortMap = {};
  currentState.forEach((columnState) => {
    if (columnState.sort) {
      sortMap[columnState.colId] = {
        sort: columnState.sort,
        sortIndex: columnState.sortIndex
      };
    }
  });

  gridApi.applyColumnState({
    state: reorderableColumns.map((column) => ({
      colId: column.colId,
      hide: !column.visible,
      pinned: column.pinned,
      ...(sortMap[column.colId] || {})
    })),
    applyOrder: true
  });

  setTimeout(() => {
    gridApi.refreshHeader?.();
    if (typeof gridApi.setHeaderHeight === "function") {
      gridApi.setHeaderHeight(null);
    }
  }, 50);
};

const applyResponsiveFlexFromMeasuredWidths = (columnState, targetColIdSet) => {
  if (!Array.isArray(columnState) || targetColIdSet.size === 0) {
    return columnState;
  }

  return columnState.map((columnStateItem) => {
    if (!targetColIdSet.has(columnStateItem.colId) || typeof columnStateItem.width !== "number") {
      return columnStateItem;
    }

    const measuredWidth = columnStateItem.width;
    return {
      ...columnStateItem,
      // AG Grid's applyColumnState treats missing keys as "leave unchanged";
      // null explicitly drops the fixed pixel width so flex can take over.
      width: null,
      flex: Math.max(1, Math.round(measuredWidth))
    };
  });
};

const normalizeTableColumnState = (columnState, normalizeColumnState, options) => {
  if (!Array.isArray(columnState)) {
    return [];
  }

  if (typeof normalizeColumnState !== "function") {
    return columnState;
  }

  const normalizedState = normalizeColumnState(columnState, options);
  return Array.isArray(normalizedState) ? normalizedState : columnState;
};

const COMPARE_METRIC_PREFIX = "compare_";
const DELTA_METRIC_PREFIX = "delta_";
const SHARED_DELTA_COLUMN_ID = "__shared_delta_columns__";
const SHARED_DELTA_COLUMN_LABEL = "Delta";

const isDeltaMetricColumnId = (colId) =>
  typeof colId === "string" && colId.startsWith(DELTA_METRIC_PREFIX);

const getDeltaColumnIds = (gridApi) =>
  (gridApi?.getColumnState?.() || [])
    .map((columnState) => columnState.colId)
    .filter(isDeltaMetricColumnId);

const getNormalizedManagedColumnState = ({ gridApi, colDefs, normalizeColumnState }) => {
  if (!gridApi) {
    return [];
  }

  const originalPinnedColumns = {};

  if (Array.isArray(colDefs)) {
    colDefs.forEach((col) => {
      if (col.pinned) {
        originalPinnedColumns[col.field] = col.pinned;
      }
    });
  }

  let columnState = [];
  try {
    columnState = gridApi.getColumnState?.() || [];
  } catch {
    columnState = [];
  }

  const preservedPinnedState = columnState.map((columnStateItem) => {
    const isPinned = originalPinnedColumns[columnStateItem.colId];
    const nextColumnState = { ...columnStateItem };

    if (isPinned && !nextColumnState.hide) {
      nextColumnState.pinned = isPinned;
    }

    return nextColumnState;
  });

  return normalizeTableColumnState(preservedPinnedState, normalizeColumnState);
};

const buildManagedChooserColumns = ({ gridApi, columnState, colDefs, validColumnIds }) => {
  const gridColumns = getManagedTableColumns(gridApi, { validColumnIds });
  const managedGridColumnMap = Object.fromEntries(
    gridColumns.map((column) => [column.colId, column])
  );
  const columnDefsMap = {};

  gridColumns.forEach((column) => {
    columnDefsMap[column.colId] = {
      headerName: column.headerName || column.field || column.colId,
      field: column.field,
      showInColumnChooser: column.showInColumnChooser !== false
    };
  });

  if (Array.isArray(colDefs) && colDefs.length > 0) {
    colDefs.forEach((column) => {
      const colId = column.colId || column.field;
      if (!colId) {
        return;
      }

      columnDefsMap[colId] = {
        headerName: column.headerName || column.field || colId,
        field: column.field,
        showInColumnChooser: column.showInColumnChooser !== false
      };
    });
  }

  const nextColumnState = Array.isArray(columnState)
    ? columnState.filter(
        (columnStateItem) =>
          !validColumnIds || validColumnIds.size === 0 || validColumnIds.has(columnStateItem.colId)
      )
    : [];

  if (Array.isArray(colDefs) && colDefs.length > 0) {
    const stateColIds = new Set(nextColumnState.map((columnStateItem) => columnStateItem.colId));
    const colDefsOrder = colDefs.map((column) => column.colId || column.field).filter(Boolean);

    colDefs.forEach((column) => {
      const colId = column.colId || column.field;
      if (!colId || stateColIds.has(colId)) {
        return;
      }

      const colDefIndex = colDefsOrder.indexOf(colId);
      let insertIndex = nextColumnState.length;

      for (let i = colDefIndex + 1; i < colDefsOrder.length; i += 1) {
        const laterColumnIndex = nextColumnState.findIndex(
          (columnStateItem) => columnStateItem.colId === colDefsOrder[i]
        );
        if (laterColumnIndex !== -1) {
          insertIndex = laterColumnIndex;
          break;
        }
      }

      nextColumnState.splice(insertIndex, 0, {
        colId,
        hide: column.hide ?? false,
        pinned: column.pinned || null
      });
      stateColIds.add(colId);
    });
  }

  const chooserColumns = nextColumnState
    .map((columnStateItem, index) => {
      const managedGridColumn = managedGridColumnMap[columnStateItem.colId];
      const colDef = columnDefsMap[columnStateItem.colId] || {};

      return {
        ...(managedGridColumn || {}),
        colId: columnStateItem.colId,
        headerName: colDef.headerName || managedGridColumn?.headerName || columnStateItem.colId,
        visible: !columnStateItem.hide,
        pinned: columnStateItem.pinned || managedGridColumn?.pinned || null,
        field: colDef.field || managedGridColumn?.field,
        showInColumnChooser: colDef.showInColumnChooser,
        originalIndex: managedGridColumn?.originalIndex ?? index
      };
    })
    .filter(
      (column) =>
        !isDeltaMetricColumnId(column.colId) &&
        column.field &&
        column.field !== "ag-Grid-AutoColumn" &&
        column.showInColumnChooser !== false
    );

  const deltaColumnStates = nextColumnState.filter((columnStateItem) =>
    isDeltaMetricColumnId(columnStateItem.colId)
  );

  if (deltaColumnStates.length === 0) {
    return chooserColumns;
  }

  return [
    ...chooserColumns,
    {
      colId: SHARED_DELTA_COLUMN_ID,
      headerName: SHARED_DELTA_COLUMN_LABEL,
      visible: deltaColumnStates.some((columnStateItem) => !columnStateItem.hide),
      pinned: null,
      field: SHARED_DELTA_COLUMN_ID,
      showInColumnChooser: true,
      originalIndex: Number.MAX_SAFE_INTEGER,
      memberColIds: deltaColumnStates.map((columnStateItem) => columnStateItem.colId),
      disablePinning: true,
      disableReordering: true,
      isSynthetic: true
    }
  ];
};

const hideStaleManagedColumns = ({ gridApi, validColumnIds }) => {
  if (!gridApi || !validColumnIds || validColumnIds.size === 0) {
    return;
  }

  const staleFieldColumnIds = (gridApi.getAllGridColumns?.() || [])
    .filter((column) => {
      const colId = column.getColId();
      const field = column.getColDef?.()?.field;
      return field && !validColumnIds.has(colId);
    })
    .map((column) => column.getColId());

  if (staleFieldColumnIds.length > 0) {
    gridApi.setColumnsVisible(staleFieldColumnIds, false);
  }
};

const getHideTargetColumnId = (colId) => {
  if (typeof colId !== "string") {
    return colId;
  }

  return colId.startsWith(COMPARE_METRIC_PREFIX)
    ? colId.slice(COMPARE_METRIC_PREFIX.length)
    : colId;
};

const setManagedColumnVisibility = ({ gridApi, colId, colIds, visible, normalizeColumnState }) => {
  const targetColIds = Array.isArray(colIds) && colIds.length > 0 ? colIds : colId ? [colId] : [];

  if (!gridApi || targetColIds.length === 0 || typeof visible !== "boolean") {
    return false;
  }

  gridApi.setColumnsVisible(targetColIds, visible);

  const normalizedState = normalizeTableColumnState(
    gridApi.getColumnState?.() || [],
    normalizeColumnState
  );

  if (normalizedState.length > 0) {
    gridApi.applyColumnState({
      state: normalizedState,
      applyOrder: true
    });
  }

  setTimeout(() => {
    gridApi.refreshHeader?.();
    if (typeof gridApi.setHeaderHeight === "function") {
      gridApi.setHeaderHeight(null);
    }
  }, 50);

  return true;
};
// Note: pdfmake is heavy and not needed unless exporting. We lazy-load it in exportToPDF.

// SortableColumnItem component for dnd-kit
const SortableColumnItem = ({
  column,
  toggleColumnVisibility,
  toggleColumnPin,
  isOver,
  isInvalidDropTarget,
  containerId,
  isBeingDragged
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.colId,
    data: {
      type: "column",
      column,
      containerId
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isBeingDragged ? 0 : isInvalidDropTarget ? 0.3 : 1,
    pointerEvents: isBeingDragged ? "none" : "auto"
  };

  const handleColumnClick = (e) => {
    // Don't toggle if clicking on pin button or drag handle (they're in column_actions)
    if (e.target.closest(`.${styles.column_actions}`)) {
      return;
    }
    // Toggle checkbox when clicking anywhere else on the column item
    toggleColumnVisibility(column);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        styles.column_chooser_item,
        isBeingDragged && styles.dragging,
        column.pinned && styles.pinned,
        isInvalidDropTarget && styles.invalid_drop_target,
        column.isTransitioningIn && styles.transitioning_in
      )}
      onClick={handleColumnClick}>
      <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <CheckBox
          checked={column.visible}
          size="small"
          onChange={() => toggleColumnVisibility(column)}
        />
      </div>
      <div className={styles.column_content}>
        <span className={styles.column_name}>{column.headerName}</span>
      </div>
      <div className={styles.column_actions}>
        <Button
          className={clsx(column.pinned ? styles.pin_button_pinned : styles.pin_button_unpinned)}
          type="secondary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toggleColumnPin(column.colId);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          title={
            column.pinned
              ? i18n.t("ui.toolkit.table.unpinColumn")
              : i18n.t("ui.toolkit.table.pinColumn")
          }
          iconLeft={column.pinned ? <Icons.General.Pin01 /> : <Icons.General.Pin02 />}
        />
        <div
          className={styles.drag_handle}
          style={{ touchAction: "none", cursor: "grab" }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}>
          <Icons.General.Menu01 color="var(--text-commentary-description)" />
        </div>
      </div>
    </div>
  );
};

const StaticColumnItem = ({ column, toggleColumnVisibility }) => {
  const handleColumnClick = (e) => {
    if (e.target.closest(`.${styles.column_actions}`)) {
      return;
    }

    toggleColumnVisibility(column);
  };

  return (
    <div className={styles.column_chooser_item} onClick={handleColumnClick}>
      <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <CheckBox
          checked={column.visible}
          size="small"
          onChange={() => toggleColumnVisibility(column)}
        />
      </div>
      <div className={styles.column_content}>
        <span className={styles.column_name}>{column.headerName}</span>
      </div>
    </div>
  );
};

const DroppableSection = ({ id, items, children, className }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
};

const CustomColumnChooser = ({
  gridApi,
  isOpen,
  onClose,
  onReset,
  onSave,
  columnStateKey,
  colDefs,
  normalizeColumnState = null,
  getPortalTarget = null
}) => {
  const [columns, setColumns] = useState([]);
  const [scrollContainerId] = useState(() => `column-chooser-scroll-${Date.now()}`);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
  const activeColumnRef = useRef(null);
  const lastDeltaRef = useRef({ x: 0, y: 0 });
  const validColumnIds = useMemo(
    () => new Set((colDefs || []).map((col) => col.colId || col.field).filter(Boolean)),
    [colDefs]
  );

  const refreshChooserColumns = useCallback(() => {
    const normalizedColumnState = getNormalizedManagedColumnState({
      gridApi,
      colDefs,
      normalizeColumnState
    });
    setColumns(
      buildManagedChooserColumns({
        gridApi,
        columnState: normalizedColumnState,
        colDefs,
        validColumnIds
      })
    );
  }, [colDefs, gridApi, normalizeColumnState, validColumnIds]);

  useEffect(() => {
    if (gridApi && isOpen) {
      refreshChooserColumns();
    }
  }, [gridApi, isOpen, columnStateKey, refreshChooserColumns]);

  const toggleColumnVisibility = (managedColumn) => {
    if (!gridApi || !managedColumn) return;

    const targetColIds =
      Array.isArray(managedColumn.memberColIds) && managedColumn.memberColIds.length > 0
        ? managedColumn.memberColIds
        : [managedColumn.colId];
    const columnState = gridApi.getColumnState?.() || [];
    const isVisible = targetColIds.some((colId) => {
      const currentColumnState = columnState.find(
        (columnStateItem) => columnStateItem.colId === colId
      );
      return currentColumnState ? !currentColumnState.hide : false;
    });
    const newVisible = !isVisible;

    const updated = setManagedColumnVisibility({
      gridApi,
      colIds: targetColIds,
      visible: newVisible,
      normalizeColumnState
    });

    if (!updated) return;

    refreshChooserColumns();
  };

  const toggleColumnPin = (colId) => {
    const column = columns.find((col) => col.colId === colId);
    if (column && !column.disablePinning) {
      const newPinned = column.pinned === null ? "left" : null;
      const newColumns = getColumnsWithUpdatedPinState(columns, colId, newPinned, {
        markTransition: true
      });

      setColumns(newColumns);
      applyManagedTableColumns(gridApi, newColumns);

      const normalizedState = normalizeTableColumnState(
        gridApi.getColumnState?.() || [],
        normalizeColumnState
      );
      if (normalizedState.length > 0) {
        gridApi.applyColumnState({
          state: normalizedState,
          applyOrder: true
        });
      }

      // 3. Clear transition in animation after it finishes (match CSS 300ms)
      setTimeout(() => {
        setColumns((prev) =>
          prev.map((col) => (col.colId === colId ? { ...col, isTransitioningIn: false } : col))
        );
      }, 300);
    }
  };

  // Configure sensors - using Mouse and Touch for maximum reliability in popovers
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 3
    }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5
    }
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  });
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    const activeColumn = columns.find((col) => col.colId === event.active.id);
    if (activeColumn) {
      activeColumnRef.current = activeColumn;
    }
    // Reset velocity tracking
    lastDeltaRef.current = { x: 0, y: 0 };
    setDragVelocity({ x: 0, y: 0 });
  };

  const handleDragMove = (event) => {
    if (event.delta) {
      // Calculate velocity (change since last frame)
      const velocityX = event.delta.x - lastDeltaRef.current.x;
      const velocityY = event.delta.y - lastDeltaRef.current.y;

      // Store current delta for next frame comparison
      lastDeltaRef.current = { x: event.delta.x, y: event.delta.y };

      // Apply smoothing: blend new velocity with previous for smoother feel
      setDragVelocity((prev) => ({
        x: prev.x * 0.7 + velocityX * 0.3,
        y: prev.y * 0.7 + velocityY * 0.3
      }));
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setOverId(null);
      return;
    }

    const activeColumn = columns.find((col) => col.colId === active.id);
    if (!activeColumn) return;

    // Check if hovering over a column or a container
    const containerIds = ["pinned-left", "pinned-right", "unpinned"];
    const isOverContainer = containerIds.includes(over.id);
    const overColumn = !isOverContainer ? columns.find((col) => col.colId === over.id) : null;

    if (!overColumn && !isOverContainer) {
      setOverId(null);
      return;
    }

    const activePinned = !!activeColumn.pinned;
    const overPinned = isOverContainer ? over.id !== "unpinned" : !!overColumn.pinned;

    // Prevent dragging between pinned and unpinned groups
    if (activePinned !== overPinned) {
      setOverId(null);
      return;
    }

    setOverId(over.id);

    // If moving between sub-sections (e.g. Left -> Right or into an empty Right section)
    const targetPinned = isOverContainer
      ? over.id === "pinned-left"
        ? "left"
        : over.id === "pinned-right"
          ? "right"
          : null
      : overColumn.pinned;

    if (activeColumn.pinned !== targetPinned) {
      setColumns((prev) => {
        const activeIndex = prev.findIndex((col) => col.colId === active.id);
        const newColumns = [...prev];

        // Update the pinning state
        newColumns[activeIndex] = { ...activeColumn, pinned: targetPinned };

        if (isOverContainer) {
          // If over a container, move to the end/start of that container group
          const samePinnedGroup = newColumns.filter(
            (c) => c.pinned === targetPinned && c.colId !== active.id
          );
          let targetIndex;

          if (targetPinned === "left") {
            targetIndex = samePinnedGroup.length;
          } else if (targetPinned === "right") {
            const leftCount = newColumns.filter((c) => c.pinned === "left").length;
            targetIndex = leftCount + samePinnedGroup.length;
          } else {
            targetIndex = prev.length - 1;
          }

          return arrayMove(newColumns, activeIndex, targetIndex);
        } else {
          // If over a column, use its index
          const overIndex = prev.findIndex((col) => col.colId === over.id);
          return arrayMove(newColumns, activeIndex, overIndex);
        }
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDragVelocity({ x: 0, y: 0 });
    activeColumnRef.current = null;
    lastDeltaRef.current = { x: 0, y: 0 };
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      handleDragCancel();
      return;
    }

    const activeColumn = columns.find((col) => col.colId === active.id);
    const containerIds = ["pinned-left", "pinned-right", "unpinned"];
    const isOverContainer = containerIds.includes(over.id);
    const overColumn = !isOverContainer ? columns.find((col) => col.colId === over.id) : null;

    if (!activeColumn) {
      handleDragCancel();
      return;
    }

    let newColumns = columns;
    if (overColumn && activeColumn.pinned === overColumn.pinned) {
      const activeIndex = columns.findIndex((col) => col.colId === active.id);
      const overIndex = columns.findIndex((col) => col.colId === over.id);
      newColumns = arrayMove(columns, activeIndex, overIndex);
      setColumns(newColumns);
    }
    const currentState = gridApi.getColumnState();
    const sortMap = {};
    currentState.forEach((cs) => {
      if (cs.sort) {
        sortMap[cs.colId] = { sort: cs.sort, sortIndex: cs.sortIndex };
      }
    });

    gridApi.applyColumnState({
      state: newColumns
        .filter((col) => !col.isSynthetic)
        .map((col) => ({
          colId: col.colId,
          hide: !col.visible,
          pinned: col.pinned,
          ...(sortMap[col.colId] || {})
        })),
      applyOrder: true
    });

    const normalizedState = normalizeTableColumnState(
      gridApi.getColumnState?.() || [],
      normalizeColumnState
    );
    if (normalizedState.length > 0) {
      gridApi.applyColumnState({
        state: normalizedState,
        applyOrder: true
      });
    }

    // Force header refresh
    setTimeout(() => {
      gridApi.refreshHeader();
      if (typeof gridApi.setHeaderHeight === "function") {
        gridApi.setHeaderHeight(null);
      }
    }, 50);

    handleDragCancel();
  };

  const handleReset = () => {
    onReset();
    hideStaleManagedColumns({ gridApi, validColumnIds });
    refreshChooserColumns();
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  // Split columns into groups for dnd contexts
  const pinnedLeftColumns = useMemo(
    () =>
      columns
        .filter((col) => col.pinned === "left" && !col.disableReordering)
        .map((col) => col.colId),
    [columns]
  );
  const unpinnedDisplayColumns = useMemo(() => {
    const unpinnedColumns = columns.filter((col) => !col.pinned);
    const deltaColumns = unpinnedColumns.filter((col) => col.colId === SHARED_DELTA_COLUMN_ID);
    const otherColumns = unpinnedColumns.filter((col) => col.colId !== SHARED_DELTA_COLUMN_ID);

    return [...deltaColumns, ...otherColumns];
  }, [columns]);
  const unpinnedColumns = useMemo(
    () =>
      unpinnedDisplayColumns
        .filter((col) => !col.pinned && !col.disableReordering)
        .map((col) => col.colId),
    [unpinnedDisplayColumns]
  );
  const pinnedRightColumns = useMemo(
    () =>
      columns
        .filter((col) => col.pinned === "right" && !col.disableReordering)
        .map((col) => col.colId),
    [columns]
  );

  const activeColumn = activeId ? columns.find((col) => col.colId === activeId) : null;
  const hasPinnedColumns = columns.some((c) => c.pinned === "left" || c.pinned === "right");

  const rotationSensitivity = 2;
  const maxRotation = 8;
  const combinedVelocity = dragVelocity.x + dragVelocity.y;
  const rotation = Math.max(
    -maxRotation,
    Math.min(maxRotation, combinedVelocity * rotationSensitivity)
  );

  const dragOverlayInnerStyle = {
    transform: `rotate(${rotation}deg)`,
    transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    width: "100%",
    pointerEvents: "none",
    willChange: "transform"
  };
  const dragOverlayPortalTarget =
    (typeof getPortalTarget === "function" && getPortalTarget()) ||
    (typeof document !== "undefined" ? document.body : null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={{
        threshold: { x: 0, y: activeColumn?.pinned ? 0.25 : 0.15 }, // Larger trigger zone for pinned columns
        acceleration: activeColumn?.pinned ? 8 : 3, // Faster scroll for pinned columns to jump sections
        interval: 15
      }}>
      <div className={styles.custom_column_chooser_content}>
        <div
          className={styles.custom_column_chooser_scroll_wrapper}
          id={`${scrollContainerId}-wrapper`}>
          <ScrollShadow
            key={`${scrollContainerId}-${columns.length}`}
            wrapper={`${scrollContainerId}-wrapper`}
            scrollContainer={scrollContainerId}
            dark={false}
            strength={12}
            direction="vertical"
            showIdleHint
          />
          <div
            className={styles.custom_column_chooser_scroll_container}
            id={scrollContainerId}
            data-visible="true">
            {/* Pinned Left Columns Section */}
            <DroppableSection
              id="pinned-left"
              items={pinnedLeftColumns}
              className={clsx(
                styles.droppable_section,
                pinnedLeftColumns.length === 0 && !activeColumn?.pinned && styles.section_empty
              )}>
              <div
                className={clsx(
                  styles.section_divider,
                  pinnedLeftColumns.length === 0 && !activeColumn?.pinned && styles.hidden
                )}>
                <div className={styles.section_divider_line}></div>
                <span className={styles.section_divider_text}>
                  {i18n.t("ui.toolkit.table.pinnedLeft")}
                </span>
                <div className={styles.section_divider_line}></div>
              </div>
              {columns
                .filter((col) => col.pinned === "left")
                .map((column) =>
                  column.disableReordering ? (
                    <StaticColumnItem
                      key={column.colId}
                      column={column}
                      toggleColumnVisibility={toggleColumnVisibility}
                    />
                  ) : (
                    <SortableColumnItem
                      key={column.colId}
                      column={column}
                      toggleColumnVisibility={toggleColumnVisibility}
                      toggleColumnPin={toggleColumnPin}
                      isOver={overId === column.colId}
                      isInvalidDropTarget={activeColumn && !activeColumn.pinned}
                      containerId="pinned-left"
                      isBeingDragged={activeId === column.colId}
                    />
                  )
                )}
              <div
                className={clsx(
                  styles.empty_drop_zone,
                  (!activeColumn?.pinned || pinnedLeftColumns.length > 0) && styles.hidden
                )}>
                {i18n.t("ui.toolkit.table.dropToPinLeft")}
              </div>
            </DroppableSection>

            {/* Pinned Right Columns Section */}
            <DroppableSection
              id="pinned-right"
              items={pinnedRightColumns}
              className={clsx(
                styles.droppable_section,
                pinnedRightColumns.length === 0 && !activeColumn?.pinned && styles.section_empty
              )}>
              <div
                className={clsx(
                  styles.section_divider,
                  pinnedRightColumns.length === 0 && !activeColumn?.pinned && styles.hidden
                )}>
                <div className={styles.section_divider_line}></div>
                <span className={styles.section_divider_text}>
                  {i18n.t("ui.toolkit.table.pinnedRight")}
                </span>
                <div className={styles.section_divider_line}></div>
              </div>
              {columns
                .filter((col) => col.pinned === "right")
                .map((column) =>
                  column.disableReordering ? (
                    <StaticColumnItem
                      key={column.colId}
                      column={column}
                      toggleColumnVisibility={toggleColumnVisibility}
                    />
                  ) : (
                    <SortableColumnItem
                      key={column.colId}
                      column={column}
                      toggleColumnVisibility={toggleColumnVisibility}
                      toggleColumnPin={toggleColumnPin}
                      isOver={overId === column.colId}
                      isInvalidDropTarget={activeColumn && !activeColumn.pinned}
                      containerId="pinned-right"
                      isBeingDragged={activeId === column.colId}
                    />
                  )
                )}
              <div
                className={clsx(
                  styles.empty_drop_zone,
                  (!activeColumn?.pinned || pinnedRightColumns.length > 0) && styles.hidden
                )}>
                {i18n.t("ui.toolkit.table.dropToPinRight")}
              </div>
            </DroppableSection>

            {/* Unpinned Columns Section */}
            <DroppableSection
              id="unpinned"
              items={unpinnedColumns}
              className={clsx(
                styles.droppable_section,
                unpinnedColumns.length === 0 && !activeColumn?.pinned && styles.section_empty
              )}>
              <div
                className={clsx(
                  styles.section_divider,
                  (!hasPinnedColumns || unpinnedColumns.length === 0) && styles.hidden
                )}>
                <div className={styles.section_divider_line}></div>
                <span className={styles.section_divider_text}>
                  {i18n.t("ui.toolkit.table.unpinned")}
                </span>
                <div className={styles.section_divider_line}></div>
              </div>
              {unpinnedDisplayColumns.map((column) =>
                column.disableReordering ? (
                  <StaticColumnItem
                    key={column.colId}
                    column={column}
                    toggleColumnVisibility={toggleColumnVisibility}
                  />
                ) : (
                  <SortableColumnItem
                    key={column.colId}
                    column={column}
                    toggleColumnVisibility={toggleColumnVisibility}
                    toggleColumnPin={toggleColumnPin}
                    isOver={overId === column.colId}
                    isInvalidDropTarget={activeColumn && !!activeColumn.pinned}
                    containerId="unpinned"
                    isBeingDragged={activeId === column.colId}
                  />
                )
              )}
            </DroppableSection>
          </div>
        </div>
        <div className={styles.custom_column_chooser_footer}>
          <div className={styles.custom_column_chooser_footer_actions}>
            <Button
              text={i18n.t("ui.toolkit.table.reset")}
              size="small"
              type="secondary"
              onClick={handleReset}
            />
          </div>
          <Button
            text={i18n.t("ui.toolkit.table.save")}
            size="small"
            type="ghost_success"
            onClick={handleSave}
          />
        </div>
      </div>
      {dragOverlayPortalTarget &&
        createPortal(
          <DragOverlay dropAnimation={null} zIndex={TABLE_DRAG_OVERLAY_Z_INDEX}>
            {activeColumn ? (
              <div style={dragOverlayInnerStyle}>
                <div
                  className={clsx(styles.column_chooser_item, styles.dragging_overlay)}
                  style={{ width: "280px" }}>
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    <CheckBox
                      checked={activeColumn.visible}
                      size="small"
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                  <div className={styles.column_content}>
                    <span className={styles.column_name}>{activeColumn.headerName}</span>
                  </div>
                  <div className={styles.column_actions}>
                    <Button
                      className={clsx(
                        activeColumn.pinned ? styles.pin_button_pinned : styles.pin_button_unpinned
                      )}
                      type="secondary"
                      size="small"
                      onClick={() => {}}
                      disabled
                      title={
                        activeColumn.pinned
                          ? i18n.t("ui.toolkit.table.unpinColumn")
                          : i18n.t("ui.toolkit.table.pinColumn")
                      }
                      iconLeft={
                        activeColumn.pinned ? <Icons.General.Pin01 /> : <Icons.General.Pin02 />
                      }
                    />
                    <div className={styles.drag_handle} style={{ cursor: "grabbing" }}>
                      <Icons.General.Menu01 color="var(--text-commentary-description)" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>,
          dragOverlayPortalTarget
        )}
    </DndContext>
  );
};

const EMPTY_SELECTION_SNAPSHOT = Object.freeze({
  rowIds: [],
  cellRanges: []
});

export const TableWrapper = ({
  rowData,
  colDefs,
  size = "default",
  title = null,
  titleItems = null,
  activeFilters = [],
  fullscreenTopContent = null,
  loading = false,
  noDataText = null,
  noRowsOverlayProps,
  showColumnHeaders = true,
  showToolbar = true,
  showFooter = true,
  showEditTableButton = true,
  showFullscreenButton = true,
  showSubscribeButton = true,
  showExportButton = true,
  // Export currency code for adding Currency column when EPC/Commission columns exist
  exportCurrencyCode = null,
  exportFileNameBase = null,
  // Subscribe modal configuration
  subscribeDateRangeConfig,
  subscribeReportName,
  subscribeDefaultRecipients,
  subscribeCurrencyCode,
  wrapperClassName,
  showRowSelection = true,
  tableId = "default",
  ariaLabel = null,
  // Optional limit threshold for automatic warning fallback
  limitThreshold,
  // Optional helper items shown next to toolbar actions
  helperItems = null,
  onActiveFilterRemove = null,
  // SSRM / Infinite scroll passthrough
  infiniteScroll = false,
  loadRows,
  pinnedBottomRowData,
  // Rows appended after the grid rows in a full CSV/XLSX/PDF export (not in selection
  // or cell-range exports). Each row maps colId -> already formatted value.
  additionalExportRows = null,
  blockSize = 100,
  maxBlocksInCache = 20,
  maxConcurrentDatasourceRequests = 2,
  blockLoadDebounceMillis = 100,
  suppressServerSideInfiniteScroll = false,
  getRowId,
  // allow parent to receive grid api (needed to register SSRM datasource)
  onGridApiReady: onGridApiReadyProp,
  // Show/hide result count tag
  showResultCount = true,
  resultCountLabel,
  // pagination (works with client-side and SSRM)
  pagination = false,
  paginationPageSize,
  paginationPageSizeSelector,
  columnStateMigrationVersion,
  normalizeColumnState = null,
  getAutoSizeColumnGroupIds = null,
  forceNormalLayout = false,
  autoSizeOnFirstRender = true,
  autoSizeColumnIdsOnFirstRender = null,
  autoSizeSkipHeaderColumnIdsOnFirstRender = null,
  autoSizeColumnMaxWidth = null,
  cellSelection = null,
  rowClassRules = null,
  onCellMouseOver,
  onCellMouseOut,
  onSubscribeSubmit = null,
  renderSelectionActions = null
}) => {
  const [gridApi, setGridApi] = useState(null);
  const [gridRowCount, setGridRowCount] = useState(null);
  const [serverRowCount, setServerRowCount] = useState(null);
  const [lastNonZeroRowCount, setLastNonZeroRowCount] = useState(null);
  const rowCountUpdateTimer = useRef(null);
  const limitVisibilityTimer = useRef(null);
  const [limitVisible, setLimitVisible] = useState(false);
  const [renderLimitWarning, setRenderLimitWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);
  const [useAutoHeight, setUseAutoHeight] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const selectedIdRef = useRef(new Set());
  const selectionSnapshotRef = useRef(EMPTY_SELECTION_SNAPSHOT);
  const selectionRestorePendingRef = useRef(false);
  const selectionRestoreInProgressRef = useRef(false);
  const selectionAnnouncementTimerRef = useRef(null);
  const previousSelectionStateRef = useRef({ active: false, kind: null });
  const [rowSelectionCount, setRowSelectionCount] = useState(0);
  const [hasCellRangeSelection, setHasCellRangeSelection] = useState(false);
  const [cellRangeSelectionCount, setCellRangeSelectionCount] = useState(0);
  const [selectedNumberCellsSum, setSelectedNumberCellsSum] = useState(null);
  const [selectedNumberCellsAverage, setSelectedNumberCellsAverage] = useState(null);
  const [selectionAnnouncement, setSelectionAnnouncement] = useState("");
  const tableContainerRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const editTableButtonRef = useRef(null);
  const overflowButtonRef = useRef(null);
  const [desktopSelectionBarBounds, setDesktopSelectionBarBounds] = useState(null);
  const wasLoadingRef = useRef(loading);
  const [appliedSize, setAppliedSize] = useState(size);
  const pendingSizeRef = useRef(null);
  const pendingSizeSawLoadingRef = useRef(false);
  const pendingSizeAwaitingCommitRef = useRef(false);
  const [sizeSyncCycle, setSizeSyncCycle] = useState(0);
  const hasUserInteractedRef = useRef(false);
  // Track which columns were explicitly resized by the user
  const userResizedColumnsRef = useRef(new Set());
  const saveColumnStateRef = useRef(null);
  const suppressColumnPersistenceUntilRef = useRef(0);
  const [fullscreenSelectionBarPortalTarget, setFullscreenSelectionBarPortalTarget] =
    useState(null);
  const hasActiveFilters = Array.isArray(activeFilters) && activeFilters.length > 0;
  const handleActiveFilterRemove = useCallback(
    (filter) => {
      if (typeof onActiveFilterRemove === "function") {
        onActiveFilterRemove(filter);
      }
    },
    [onActiveFilterRemove]
  );
  const getPopoverAppendTarget = useCallback(() => {
    if (typeof document === "undefined") return null;

    const overlayPortalTarget = getOverlayPortalTarget(tableWrapperRef.current);
    if (overlayPortalTarget) {
      return overlayPortalTarget;
    }

    if (isFullscreen) {
      return document.getElementById("table-fullscreen-modal") || document.body;
    }

    return document.body;
  }, [isFullscreen]);

  const getSelectionBarAnchorElement = useCallback(() => {
    const tableWrapper = tableWrapperRef.current;
    return tableWrapper?.closest("[data-scroll-shadow-target='true']") || tableWrapper;
  }, []);

  useEffect(() => {
    if (
      typeof document === "undefined" ||
      !isFullscreen ||
      (!hasCellRangeSelection && rowSelectionCount === 0)
    ) {
      setFullscreenSelectionBarPortalTarget(null);
      return;
    }

    setFullscreenSelectionBarPortalTarget(
      document.getElementById("table-fullscreen-modal") ||
        getOverlayPortalTarget(tableWrapperRef.current) ||
        document.body
    );
  }, [hasCellRangeSelection, isFullscreen, rowSelectionCount]);

  const closeColumnChooser = useCallback(() => {
    setIsColumnChooserOpen(false);

    const columnChooserButtonRef = isNarrowViewport ? overflowButtonRef : editTableButtonRef;
    if (columnChooserButtonRef.current) {
      const button = columnChooserButtonRef.current.querySelector("button");
      if (button) {
        button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      }
    }
  }, [isNarrowViewport]);

  const closeOverflowMenu = useCallback(() => {
    setIsOverflowOpen(false);

    if (overflowButtonRef.current) {
      const button = overflowButtonRef.current.querySelector("button");
      if (button) {
        button.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      }
    }
  }, []);

  const getIdFromNode = useCallback(
    (node) => {
      try {
        if (typeof getRowId === "function" && node?.data) {
          return String(getRowId({ data: node.data }));
        }

        return (
          (node && (node.id || node.key)) ||
          (node?.data && (node.data.id || node.data.uuid || node.data.key)) ||
          null
        );
      } catch {
        return null;
      }
    },
    [getRowId]
  );

  const getEmptySelectionSnapshot = useCallback(() => ({ rowIds: [], cellRanges: [] }), []);

  const hasSelectionSnapshot = useCallback(
    (snapshot) =>
      Array.isArray(snapshot?.rowIds) && snapshot.rowIds.length > 0
        ? true
        : Array.isArray(snapshot?.cellRanges) && snapshot.cellRanges.length > 0,
    []
  );

  const getRangeStateFromApi = useCallback((api) => {
    if (!api) {
      return {
        hasCellRangeSelection: false,
        cellRangeSelectionCount: 0
      };
    }

    try {
      const cellRanges = api.getCellRanges();
      if (!cellRanges || cellRanges.length === 0) {
        return {
          hasCellRangeSelection: false,
          cellRangeSelectionCount: 0
        };
      }

      let totalCells = 0;
      let hasMultiCellRange = false;
      const isDoubleClickRange =
        api._doubleClickCellRangeTs && Date.now() - api._doubleClickCellRangeTs < 100;

      cellRanges.forEach((range) => {
        if (
          !range.startRow ||
          !range.endRow ||
          !Array.isArray(range.columns) ||
          !Number.isInteger(range.startRow.rowIndex) ||
          !Number.isInteger(range.endRow.rowIndex)
        ) {
          return;
        }

        const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
        const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
        const validColumns = range.columns.filter(isRangeCountableColumn);

        for (let rowIdx = startRowIndex; rowIdx <= endRowIndex; rowIdx += 1) {
          const rowNode = api.getDisplayedRowAtIndex(rowIdx);
          if (rowNode && !rowNode.rowPinned) {
            totalCells += validColumns.length;
          }
        }

        const selectedCells = (endRowIndex - startRowIndex + 1) * validColumns.length;
        if (selectedCells > 1 || (isDoubleClickRange && selectedCells === 1)) {
          hasMultiCellRange = true;
        }
      });

      return {
        hasCellRangeSelection: hasMultiCellRange,
        cellRangeSelectionCount: totalCells
      };
    } catch {
      return {
        hasCellRangeSelection: false,
        cellRangeSelectionCount: 0
      };
    }
  }, []);

  const syncRangeSelectionState = useCallback(
    (api) => {
      const nextState = getRangeStateFromApi(api);
      setHasCellRangeSelection(nextState.hasCellRangeSelection);
      setCellRangeSelectionCount(nextState.cellRangeSelectionCount);
      return nextState;
    },
    [getRangeStateFromApi]
  );

  const getCellRangeSnapshot = useCallback(
    (api) => {
      if (!api) return [];

      try {
        const cellRanges = api.getCellRanges();
        if (!Array.isArray(cellRanges) || cellRanges.length === 0) {
          return [];
        }

        return cellRanges
          .map((range) => {
            if (
              !range.startRow ||
              !range.endRow ||
              !Array.isArray(range.columns) ||
              !Number.isInteger(range.startRow.rowIndex) ||
              !Number.isInteger(range.endRow.rowIndex)
            ) {
              return null;
            }

            const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
            const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
            const startNode = api.getDisplayedRowAtIndex(startRowIndex);
            const endNode = api.getDisplayedRowAtIndex(endRowIndex);
            const columnIds = range.columns
              .map((column) => {
                const colDef = column.getColDef?.();
                if (!isRangeSelectableColumn(column)) return null;
                return column.getColId?.() || colDef.field;
              })
              .filter(Boolean);

            if (columnIds.length === 0) {
              return null;
            }

            return {
              startRowId: getIdFromNode(startNode),
              endRowId: getIdFromNode(endNode),
              startRowIndex,
              endRowIndex,
              columnIds
            };
          })
          .filter(Boolean);
      } catch {
        return [];
      }
    },
    [getIdFromNode]
  );

  const captureSelectionSnapshot = useCallback(
    (api = gridApi) => {
      const nextSnapshot = {
        rowIds: Array.from(selectedIdRef.current),
        cellRanges: getCellRangeSnapshot(api)
      };

      selectionSnapshotRef.current = nextSnapshot;
      return nextSnapshot;
    },
    [getCellRangeSnapshot, gridApi]
  );

  const clearSelectionSnapshot = useCallback(() => {
    selectionSnapshotRef.current = getEmptySelectionSnapshot();
    selectionRestorePendingRef.current = false;
  }, [getEmptySelectionSnapshot]);

  const restoreSelectionSnapshot = useCallback(
    (api) => {
      if (!api || !selectionRestorePendingRef.current) {
        return true;
      }

      const snapshot = selectionSnapshotRef.current;
      if (!hasSelectionSnapshot(snapshot)) {
        selectionRestorePendingRef.current = false;
        selectionRestoreInProgressRef.current = false;
        return true;
      }

      const rowIndexById = new Map();
      api.forEachNode((node) => {
        if (node?.rowPinned || !Number.isInteger(node?.rowIndex)) {
          return;
        }

        const id = getIdFromNode(node);
        if (id) {
          rowIndexById.set(id, node.rowIndex);
        }
      });

      const unresolvedRowIds = snapshot.rowIds.filter((id) => !rowIndexById.has(id));
      const restorableRanges = [];

      for (const range of snapshot.cellRanges) {
        const startRowIndex =
          (range.startRowId && rowIndexById.get(range.startRowId)) ??
          (Number.isInteger(range.startRowIndex) ? range.startRowIndex : null);
        const endRowIndex =
          (range.endRowId && rowIndexById.get(range.endRowId)) ??
          (Number.isInteger(range.endRowIndex) ? range.endRowIndex : null);
        const columnIds = range.columnIds.filter((columnId) => {
          const column = api.getColumn?.(columnId);
          return isRangeSelectableColumn(column);
        });

        if (
          !Number.isInteger(startRowIndex) ||
          !Number.isInteger(endRowIndex) ||
          columnIds.length === 0
        ) {
          return false;
        }

        const startNode = api.getDisplayedRowAtIndex(startRowIndex);
        const endNode = api.getDisplayedRowAtIndex(endRowIndex);
        if (!startNode || !endNode || startNode.rowPinned || endNode.rowPinned) {
          return false;
        }

        restorableRanges.push({
          rowStartIndex: Math.min(startRowIndex, endRowIndex),
          rowEndIndex: Math.max(startRowIndex, endRowIndex),
          columns: columnIds
        });
      }

      if (unresolvedRowIds.length > 0) {
        return false;
      }

      selectionRestoreInProgressRef.current = true;

      try {
        api.deselectAll();
        selectedIdRef.current = new Set();

        snapshot.rowIds.forEach((rowId) => {
          const rowIndex = rowIndexById.get(rowId);
          if (!Number.isInteger(rowIndex)) return;

          const node = api.getDisplayedRowAtIndex(rowIndex);
          if (!node || node.rowPinned) return;

          node.setSelected?.(true);
        });

        api.clearRangeSelection();
        restorableRanges.forEach((range) => {
          api.addCellRange(range);
        });

        setRowSelectionCount(selectedIdRef.current.size);
        syncRangeSelectionState(api);
        captureSelectionSnapshot(api);
        selectionRestorePendingRef.current = false;
        return true;
      } finally {
        selectionRestoreInProgressRef.current = false;
      }
    },
    [captureSelectionSnapshot, getIdFromNode, hasSelectionSnapshot, syncRangeSelectionState]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const checkViewport = () => {
      const viewportWidth = window.innerWidth;
      setIsMobile(viewportWidth <= 768);
      setIsNarrowViewport(viewportWidth <= 1024);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  useEffect(() => {
    if (size === appliedSize) {
      pendingSizeRef.current = null;
      pendingSizeSawLoadingRef.current = false;
      pendingSizeAwaitingCommitRef.current = false;
      return;
    }

    if (pendingSizeRef.current === size) {
      return;
    }

    pendingSizeSawLoadingRef.current = loading;
    pendingSizeAwaitingCommitRef.current = !loading;
    if (loading) {
      pendingSizeRef.current = size;
      return;
    }

    pendingSizeRef.current = size;
    setSizeSyncCycle((cycle) => cycle + 1);
  }, [tableId, size, loading, appliedSize]);

  useEffect(() => {
    const pendingSize = pendingSizeRef.current;

    if (!pendingSize || pendingSize === appliedSize) {
      if (pendingSize === appliedSize) pendingSizeRef.current = null;
      return;
    }

    if (loading) {
      pendingSizeSawLoadingRef.current = true;
      return;
    }

    if (pendingSizeAwaitingCommitRef.current) {
      pendingSizeAwaitingCommitRef.current = false;
      setSizeSyncCycle((cycle) => cycle + 1);
      return;
    }

    setAppliedSize(pendingSize);
    pendingSizeRef.current = null;
    pendingSizeSawLoadingRef.current = false;
    pendingSizeAwaitingCommitRef.current = false;
  }, [tableId, sizeSyncCycle, loading, size, appliedSize]);

  useEffect(() => {
    const pendingSize = pendingSizeRef.current;
    if (pendingSize === appliedSize) {
      pendingSizeRef.current = null;
    }
  }, [appliedSize]);

  const effectiveTitle = title ?? i18n.t("ui.toolkit.table.title");
  const effectiveNoDataText = noDataText ?? i18n.t("ui.toolkit.table.noData");
  const effectiveAriaLabel = ariaLabel ?? i18n.t("ui.toolkit.table.ariaLabel");
  const sanitizedExportFileNameBase = useMemo(() => {
    if (typeof exportFileNameBase !== "string") {
      return "grid-export";
    }

    const normalizedBase = exportFileNameBase
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
      .toLowerCase();

    return normalizedBase || "grid-export";
  }, [exportFileNameBase]);
  const getExportFilename = useCallback(
    ({ extension, onlySelected = false } = {}) => {
      const exportBase = onlySelected
        ? `${sanitizedExportFileNameBase}-selection`
        : sanitizedExportFileNameBase;

      return `${exportBase}.${extension}`;
    },
    [sanitizedExportFileNameBase]
  );
  const getExportSheetName = useCallback(
    ({ onlySelected = false } = {}) => {
      const sheetBase = onlySelected
        ? `${sanitizedExportFileNameBase}-selection`
        : sanitizedExportFileNameBase;

      return sheetBase.replace(/[:/?*[\]\\]/g, "-").slice(0, 31) || "Export";
    },
    [sanitizedExportFileNameBase]
  );

  const rootRef = useRef(null);
  const [showHeaderExportPopover, setShowHeaderExportPopover] = useState(false);
  const [showSelectionExportPopover, setShowSelectionExportPopover] = useState(false);
  const headerExportButtonRef = useRef(null);
  const selectionExportButtonRef = useRef(null);
  const columnStateKey = `ag-grid-column-state-${tableId}`;
  const effectiveCellSelection = isMobile ? false : cellSelection;

  const refreshGridHeader = useCallback(() => {
    if (!gridApi) return;

    gridApi.refreshHeader?.();
    if (typeof gridApi.setHeaderHeight === "function") {
      gridApi.setHeaderHeight(null);
    }
  }, [gridApi]);

  const getEstimatedHeaderAutoWidth = useCallback(
    (colId) => {
      const columnDef = (colDefs || []).find((col) => (col.colId || col.field) === colId);
      if (!columnDef) return null;

      const headerLabel = String(columnDef.headerName || columnDef.field || colId || "");
      if (!headerLabel) return null;

      const horizontalPadding = 32;
      const iconAllowance = columnDef.icon ? 24 : 0;
      const sortAllowance = columnDef.sortable === false ? 0 : 16;
      const textAllowance = headerLabel.length * 8.5;

      return Math.ceil(horizontalPadding + iconAllowance + sortAllowance + textAllowance);
    },
    [colDefs]
  );

  const autoSizeColumnIds = useCallback(
    ({
      colIds = [],
      skipHeaderColIds = [],
      applyResponsiveFlex = false,
      expandToFitGroups = [],
      skipContentAutoSize = false
    } = {}) => {
      if (!gridApi) return;
      if (!skipContentAutoSize && typeof gridApi.autoSizeColumns !== "function") return;

      const targetColIds = [...new Set(colIds.filter(Boolean))];
      if (targetColIds.length === 0) return;

      if (!skipContentAutoSize) {
        const skipHeaderColIdSet = new Set(skipHeaderColIds);
        const skipHeaderTargetColIds = targetColIds.filter((colId) => skipHeaderColIdSet.has(colId));
        const includeHeaderTargetColIds = targetColIds.filter(
          (colId) => !skipHeaderColIdSet.has(colId)
        );

        if (includeHeaderTargetColIds.length > 0) {
          gridApi.autoSizeColumns(includeHeaderTargetColIds, false);
        }

        if (skipHeaderTargetColIds.length > 0) {
          gridApi.autoSizeColumns(skipHeaderTargetColIds, true);
        }
      }

      const skipHeaderColIdSet = new Set(skipHeaderColIds);

      if (
        typeof gridApi.getColumnState !== "function" ||
        typeof gridApi.applyColumnState !== "function"
      ) {
        return;
      }

      const maxAutoWidth =
        Number.isFinite(Number(autoSizeColumnMaxWidth)) && Number(autoSizeColumnMaxWidth) > 0
          ? Number(autoSizeColumnMaxWidth)
          : null;
      const targetColIdSet = new Set(targetColIds);
      const currentState = gridApi.getColumnState?.() || [];
      let hasWidthAdjustments = false;
      const nextState = currentState.map((columnState) => {
        if (!targetColIdSet.has(columnState.colId)) {
          return columnState;
        }

        const estimatedHeaderWidth = skipHeaderColIdSet.has(columnState.colId)
          ? getEstimatedHeaderAutoWidth(columnState.colId)
          : null;
        const nextWidthFromHeaderEstimate =
          typeof estimatedHeaderWidth === "number" &&
          typeof columnState.width === "number" &&
          columnState.width < estimatedHeaderWidth
            ? estimatedHeaderWidth
            : columnState.width;
        const nextWidth =
          typeof nextWidthFromHeaderEstimate === "number" &&
          maxAutoWidth != null &&
          nextWidthFromHeaderEstimate > maxAutoWidth
            ? maxAutoWidth
            : nextWidthFromHeaderEstimate;

        if (typeof nextWidth !== "number") {
          return columnState;
        }

        if (nextWidth === columnState.width) {
          return columnState;
        }

        hasWidthAdjustments = true;
        return {
          ...columnState,
          width: nextWidth
        };
      });

      if (hasWidthAdjustments) {
        gridApi.applyColumnState({
          state: nextState,
          applyOrder: true
        });
      }

      const normalizedExpandGroups = expandToFitGroups
        .map((group) => [...new Set((Array.isArray(group) ? group : []).filter(Boolean))])
        .filter((group) => group.length > 0);
      if (normalizedExpandGroups.length > 0) {
        const displayedCenterColumns = (gridApi.getAllDisplayedColumns?.() || []).filter(
          (column) => !column.getPinned?.()
        );
        const displayedCenterColIds = displayedCenterColumns
          .map((column) => column.getColId?.())
          .filter(Boolean);
        const expandableGroups = normalizedExpandGroups
          .map((group) => group.filter((colId) => displayedCenterColIds.includes(colId)))
          .filter((group) => group.length > 0);
        const expandableCenterColIds = [...new Set(expandableGroups.flat())];

        if (expandableGroups.length > 0) {
          const centerViewportWidth =
            tableContainerRef.current?.querySelector(".ag-center-cols-viewport")?.clientWidth ||
            tableContainerRef.current?.querySelector(".ag-header-viewport")?.clientWidth ||
            0;
          const sizedState = gridApi.getColumnState?.() || [];
          const stateById = new Map(
            sizedState.map((columnState) => [columnState.colId, columnState])
          );
          const totalCenterWidth = displayedCenterColumns.reduce((sum, column) => {
            const actualWidth = column.getActualWidth?.();
            if (typeof actualWidth === "number") {
              return sum + actualWidth;
            }

            const stateWidth = stateById.get(column.getColId?.())?.width;
            return typeof stateWidth === "number" ? sum + stateWidth : sum;
          }, 0);
          const currentExpandGroupWidth = expandableCenterColIds.reduce((sum, colId) => {
            const width = stateById.get(colId)?.width;
            return typeof width === "number" ? sum + width : sum;
          }, 0);
          const groupBaseWidths = expandableGroups
            .map((group) => {
              const baseWidth = group.reduce((maxWidth, colId) => {
                const width = stateById.get(colId)?.width;
                return typeof width === "number" && width > maxWidth ? width : maxWidth;
              }, 0);

              return baseWidth > 0 ? { group, baseWidth } : null;
            })
            .filter(Boolean);
          const normalizedExpandableWidth = groupBaseWidths.reduce(
            (sum, groupConfig) => sum + groupConfig.baseWidth * groupConfig.group.length,
            0
          );
          const normalizedCenterWidth =
            totalCenterWidth - currentExpandGroupWidth + normalizedExpandableWidth;
          const scaleFactor =
            normalizedCenterWidth > 0 && centerViewportWidth > normalizedCenterWidth
              ? centerViewportWidth / normalizedCenterWidth
              : 1;

          if (groupBaseWidths.length > 0) {
            const expandedWidthMap = new Map();
            groupBaseWidths.forEach(({ group, baseWidth }) => {
              const widthPerColumn = Math.max(baseWidth, Math.floor(baseWidth * scaleFactor));
              group.forEach((colId) => {
                expandedWidthMap.set(colId, widthPerColumn);
              });
            });

            const expandedState = sizedState.map((columnState) => {
              const widthPerColumn = expandedWidthMap.get(columnState.colId);
              if (typeof widthPerColumn !== "number") {
                return columnState;
              }

              return {
                ...columnState,
                width: widthPerColumn
              };
            });

            gridApi.applyColumnState({
              state: expandedState,
              applyOrder: true
            });
          }
        }
      }

      if (applyResponsiveFlex) {
        const flexState = applyResponsiveFlexFromMeasuredWidths(
          gridApi.getColumnState?.() || [],
          targetColIdSet
        );
        gridApi.applyColumnState({
          state: flexState,
          applyOrder: true
        });
      }
    },
    [autoSizeColumnMaxWidth, getEstimatedHeaderAutoWidth, gridApi]
  );

  const runInitialColumnAutoSize = useCallback(
    ({ requireTargetedColumns = false } = {}) => {
      if (!gridApi || !autoSizeOnFirstRender) return;

      try {
        const displayedColumns = gridApi.getAllDisplayedColumns?.() || [];
        if (displayedColumns.length === 0) return;

        const targetedAutoSizeColumnIds =
          Array.isArray(autoSizeColumnIdsOnFirstRender) && autoSizeColumnIdsOnFirstRender.length > 0
            ? new Set(autoSizeColumnIdsOnFirstRender)
            : null;
        const skipHeaderAutoSizeColumnIds =
          Array.isArray(autoSizeSkipHeaderColumnIdsOnFirstRender) &&
          autoSizeSkipHeaderColumnIdsOnFirstRender.length > 0
            ? new Set(autoSizeSkipHeaderColumnIdsOnFirstRender)
            : null;

        if (requireTargetedColumns && !targetedAutoSizeColumnIds) {
          return;
        }

        const responsiveCols = new Set(
          (colDefs || [])
            .filter(
              (col) =>
                (typeof col.width === "string" && col.width.includes("%")) ||
                (typeof col.flex === "number" && col.flex > 0)
            )
            .map((col) => col.colId || col.field)
            .filter(Boolean)
        );

        const colIds = displayedColumns
          .map((column) => column.getColId())
          .filter((colId) => !responsiveCols.has(colId))
          .filter((colId) => !targetedAutoSizeColumnIds || targetedAutoSizeColumnIds.has(colId));

        if (colIds.length === 0) return;

        const skipHeaderColIds = skipHeaderAutoSizeColumnIds
          ? colIds.filter((colId) => skipHeaderAutoSizeColumnIds.has(colId))
          : [];
        autoSizeColumnIds({
          colIds,
          skipHeaderColIds
        });
      } catch (error) {
        console.error("Error auto-sizing columns:", error);
      }
    },
    [
      gridApi,
      autoSizeOnFirstRender,
      autoSizeColumnIdsOnFirstRender,
      autoSizeSkipHeaderColumnIdsOnFirstRender,
      colDefs,
      autoSizeColumnIds
    ]
  );

  const handleResetColumnState = useCallback(() => {
    if (!gridApi) return;

    suppressColumnPersistenceUntilRef.current = Date.now() + 500;
    hasUserInteractedRef.current = false;
    userResizedColumnsRef.current.clear();

    localStorage.removeItem(columnStateKey);

    gridApi.resetColumnState();

    const normalizedState = normalizeTableColumnState(
      gridApi.getColumnState?.() || [],
      normalizeColumnState
    );

    if (normalizedState.length > 0) {
      gridApi.applyColumnState({
        state: normalizedState,
        applyOrder: true
      });
    }

    setTimeout(() => {
      runInitialColumnAutoSize({ requireTargetedColumns: true });
      refreshGridHeader();
    }, 0);
  }, [
    gridApi,
    columnStateKey,
    normalizeColumnState,
    runInitialColumnAutoSize,
    refreshGridHeader,
    tableId
  ]);

  const getResponsiveColumns = useCallback(() => {
    const responsiveCols = new Set();
    if (colDefs && colDefs.length > 0) {
      colDefs.forEach((col) => {
        const colId = col.colId || col.field;
        if (!colId) return;

        // Check if column has flex (responsive)
        if (typeof col.flex === "number" && col.flex > 0) {
          responsiveCols.add(colId);
        }

        // Check if column has % width (responsive) - note: these get converted to flex in Table.jsx
        // But we still track them as responsive for persistence logic
        if (typeof col.width === "string" && col.width.includes("%")) {
          responsiveCols.add(colId);
        }

        // Also check for high flex values (>= 10) which indicate converted % widths
        if (typeof col.flex === "number" && col.flex >= 10) {
          responsiveCols.add(colId);
        }
      });
    }
    return responsiveCols;
  }, [colDefs]);

  const resolveAutoSizeTargetGroups = useCallback(
    (colIds = []) => {
      const uniqueColIds = [...new Set(colIds.filter(Boolean))];
      const validColIdSet = new Set(uniqueColIds);
      const resolvedTargetColIds = new Set();
      const expandToFitGroups = [];
      const seenGroups = new Set();

      uniqueColIds.forEach((colId) => {
        const resolvedGroup =
          typeof getAutoSizeColumnGroupIds === "function"
            ? getAutoSizeColumnGroupIds(colId)
            : [colId];
        const groupColIds = [
          ...new Set((Array.isArray(resolvedGroup) ? resolvedGroup : [colId]).filter(Boolean))
        ].filter((targetColId) => validColIdSet.has(targetColId));

        if (groupColIds.length === 0) {
          return;
        }

        const groupKey = [...groupColIds].sort().join("|");
        if (seenGroups.has(groupKey)) {
          return;
        }

        seenGroups.add(groupKey);
        expandToFitGroups.push(groupColIds);
        groupColIds.forEach((targetColId) => resolvedTargetColIds.add(targetColId));
      });

      return {
        targetColIds: [...resolvedTargetColIds],
        expandToFitGroups
      };
    },
    [getAutoSizeColumnGroupIds]
  );

  // ponytail: fill leftover gap only — remasure stays on first-render / per-column menu
  const fillLeftoverTableWidth = useCallback(() => {
    if (!gridApi) return;
    if (Date.now() < suppressColumnPersistenceUntilRef.current) return;

    const displayedCenterColumns = (gridApi.getAllDisplayedColumns?.() || []).filter(
      (column) => !column.getPinned?.()
    );
    if (displayedCenterColumns.length === 0) return;

    const centerViewportWidth =
      tableContainerRef.current?.querySelector(".ag-center-cols-viewport")?.clientWidth ||
      tableContainerRef.current?.querySelector(".ag-header-viewport")?.clientWidth ||
      0;
    if (centerViewportWidth <= 0) return;

    const totalCenterWidth = displayedCenterColumns.reduce((sum, column) => {
      const actualWidth = column.getActualWidth?.();
      return typeof actualWidth === "number" ? sum + actualWidth : sum;
    }, 0);

    // Content already fills or overflows — keep pixel widths / horizontal scroll
    if (totalCenterWidth >= centerViewportWidth) return;

    const responsiveCols = getResponsiveColumns();
    const displayedTargetColIds = (gridApi.getAllDisplayedColumns?.() || [])
      .map((column) => column.getColId?.())
      .filter(Boolean)
      .filter((colId) => !responsiveCols.has(colId));
    const { targetColIds, expandToFitGroups } = resolveAutoSizeTargetGroups(displayedTargetColIds);

    if (targetColIds.length === 0) {
      return;
    }

    autoSizeColumnIds({
      colIds: targetColIds,
      expandToFitGroups,
      applyResponsiveFlex: true,
      skipContentAutoSize: true
    });

    refreshGridHeader();
  }, [
    autoSizeColumnIds,
    getResponsiveColumns,
    gridApi,
    refreshGridHeader,
    resolveAutoSizeTargetGroups
  ]);

  const saveColumnState = useCallback(
    (state) => {
      try {
        const originalPinnedColumns = {};
        if (colDefs && colDefs.length > 0) {
          colDefs.forEach((col) => {
            if (col.pinned) {
              originalPinnedColumns[col.field] = col.pinned;
            }
          });
        }

        const responsiveColumns = getResponsiveColumns();
        const userResizedColumns = userResizedColumnsRef.current;

        // Build a map of colDefs to get original flex values (with % width conversion)
        const colDefMapForFlex = {};
        if (colDefs && colDefs.length > 0) {
          colDefs.forEach((col) => {
            const colId = col.colId || col.field;
            if (colId) {
              const convertedCol = { ...col };
              if (typeof col.width === "string" && col.width.includes("%")) {
                convertedCol.flex = col.flex || 10;
                convertedCol.width = undefined;
              }
              colDefMapForFlex[colId] = convertedCol;
            }
          });
        }

        const preservedState = state.map((colState) => {
          const isPinned = originalPinnedColumns[colState.colId];
          const normalizedState = { ...colState };
          const originalColDef = colDefMapForFlex[colState.colId];

          if (responsiveColumns.has(colState.colId) && !userResizedColumns.has(colState.colId)) {
            if (typeof normalizedState.width === "number") {
              delete normalizedState.width;
            }
            if (
              originalColDef &&
              typeof originalColDef.flex === "number" &&
              originalColDef.flex > 0
            ) {
              normalizedState.flex = originalColDef.flex;
            }
          } else if (typeof normalizedState.flex === "number" && normalizedState.flex > 0) {
            if (typeof normalizedState.width === "number") {
              delete normalizedState.width;
            }
          } else if (typeof normalizedState.width === "number") {
            normalizedState.flex = null;
          }

          if (isPinned && !normalizedState.hide) {
            return { ...normalizedState, pinned: isPinned };
          }
          return normalizedState;
        });

        const normalizedState = normalizeTableColumnState(preservedState, normalizeColumnState);
        localStorage.setItem(columnStateKey, JSON.stringify(normalizedState));
      } catch (error) {
        console.error("Error saving column state:", error);
      }
    },
    [colDefs, columnStateKey, getResponsiveColumns, normalizeColumnState, tableId]
  );

  saveColumnStateRef.current = saveColumnState;

  const handleSetColumnPinned = useCallback(
    (colId, pinned) => {
      if (!gridApi || !colId) return;

      hasUserInteractedRef.current = true;
      const currentColumns = getManagedTableColumns(gridApi);
      const nextColumns = getColumnsWithUpdatedPinState(currentColumns, colId, pinned);
      applyManagedTableColumns(gridApi, nextColumns);

      const normalizedState = normalizeTableColumnState(
        gridApi.getColumnState?.() || [],
        normalizeColumnState
      );
      if (normalizedState.length > 0) {
        gridApi.applyColumnState({
          state: normalizedState,
          applyOrder: true
        });
      }
    },
    [gridApi, normalizeColumnState]
  );

  const handleAutoSizeColumn = useCallback(
    (colId) => {
      if (!gridApi || !colId) return;

      const { targetColIds, expandToFitGroups } = resolveAutoSizeTargetGroups([colId]);
      if (targetColIds.length === 0) {
        return;
      }

      hasUserInteractedRef.current = true;
      targetColIds.forEach((targetColId) => userResizedColumnsRef.current.add(targetColId));

      autoSizeColumnIds({
        colIds: targetColIds,
        skipHeaderColIds:
          Array.isArray(autoSizeSkipHeaderColumnIdsOnFirstRender) &&
          autoSizeSkipHeaderColumnIdsOnFirstRender.length > 0
            ? targetColIds.filter((targetColId) =>
                autoSizeSkipHeaderColumnIdsOnFirstRender.includes(targetColId)
              )
            : [],
        expandToFitGroups
      });

      const normalizedState = normalizeTableColumnState(
        gridApi.getColumnState?.() || [],
        normalizeColumnState,
        {
          resizeSourceColId: colId
        }
      );
      if (normalizedState.length > 0) {
        gridApi.applyColumnState({
          state: normalizedState,
          applyOrder: true
        });
      }

      const flexState = applyResponsiveFlexFromMeasuredWidths(
        gridApi.getColumnState?.() || [],
        new Set(targetColIds)
      );
      gridApi.applyColumnState({
        state: flexState,
        applyOrder: true
      });

      saveColumnStateRef.current?.(gridApi.getColumnState?.() || []);

      refreshGridHeader();
    },
    [
      autoSizeColumnIds,
      autoSizeSkipHeaderColumnIdsOnFirstRender,
      getAutoSizeColumnGroupIds,
      gridApi,
      normalizeColumnState,
      resolveAutoSizeTargetGroups,
      refreshGridHeader
    ]
  );

  const handleHideColumn = useCallback(
    (colId) => {
      if (!gridApi || !colId) return;

      const targetColIds = isDeltaMetricColumnId(colId)
        ? getDeltaColumnIds(gridApi)
        : [getHideTargetColumnId(colId)];
      const columnState = gridApi.getColumnState?.() || [];
      const hasVisibleTarget = targetColIds.some((targetColId) => {
        const targetColumnState = columnState.find(
          (columnStateItem) => columnStateItem.colId === targetColId
        );

        return targetColumnState ? !targetColumnState.hide : false;
      });

      if (!hasVisibleTarget) return;

      hasUserInteractedRef.current = true;
      setManagedColumnVisibility({
        gridApi,
        colIds: targetColIds,
        visible: false,
        normalizeColumnState
      });
    },
    [gridApi, normalizeColumnState]
  );

  // No manual position calculations needed with Tippy

  useEffect(() => {
    if (!gridApi) return;

    const migrationVersionKey = `${columnStateKey}-migration-version`;
    const uiComponentsVersion = getUiComponentsVersion();
    const CURRENT_MIGRATION_VERSION =
      columnStateMigrationVersion ||
      (typeof process !== "undefined" && process.env?.APP_VERSION) ||
      uiComponentsVersion ||
      null;

    if (!CURRENT_MIGRATION_VERSION) return;

    const lastMigrationVersion = localStorage.getItem(migrationVersionKey);

    if (lastMigrationVersion !== CURRENT_MIGRATION_VERSION) {
      localStorage.removeItem(columnStateKey);
      localStorage.setItem(migrationVersionKey, CURRENT_MIGRATION_VERSION);
    }
  }, [gridApi, columnStateKey, columnStateMigrationVersion, tableId]);

  const applySavedColumnState = useCallback(() => {
    if (!gridApi) return;
    try {
      const savedState = localStorage.getItem(columnStateKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);

        const originalPinnedColumns = {};
        if (colDefs && colDefs.length > 0) {
          colDefs.forEach((col) => {
            if (col.pinned) {
              originalPinnedColumns[col.field] = col.pinned;
            }
          });
        }

        const colDefMap = {};
        if (colDefs && colDefs.length > 0) {
          colDefs.forEach((col) => {
            const colId = col.colId || col.field;
            if (colId) {
              const convertedCol = { ...col };
              if (typeof col.width === "string" && col.width.includes("%")) {
                convertedCol.flex = col.flex || 10;
                convertedCol.width = undefined;
              }
              colDefMap[colId] = convertedCol;
            }
          });
        }

        const responsiveColumns = getResponsiveColumns();
        const userResizedColumns = userResizedColumnsRef.current;

        // Check if saved state has any sort applied
        const hasSavedSort = parsedState.some((cs) => cs.sort);

        const preservedState = parsedState.map((colState) => {
          const isPinned = originalPinnedColumns[colState.colId];
          const state = { ...colState };
          const colDef = colDefMap[colState.colId];

          if (responsiveColumns.has(colState.colId) && !userResizedColumns.has(colState.colId)) {
            if (typeof state.width === "number") {
              delete state.width;
            }
            if (colDef && typeof colDef.flex === "number" && colDef.flex > 0) {
              state.flex = colDef.flex;
            }
          } else if (typeof state.flex === "number" && state.flex > 0) {
            if (typeof state.width === "number") {
              delete state.width;
            }
          } else if (typeof state.width === "number") {
            state.flex = null;
          }

          if (isPinned && !state.hide) {
            state.pinned = isPinned;
          }

          if (!colDef) {
            return state;
          }

          return state;
        });

        const savedColIds = new Set(preservedState.map((cs) => cs.colId));
        if (colDefs && colDefs.length > 0) {
          colDefs.forEach((col) => {
            const colId = col.colId || col.field;
            if (colId && !savedColIds.has(colId)) {
              preservedState.push({
                colId,
                hide: col.hide ?? false
              });
            }
          });
        }

        const normalizedState = normalizeTableColumnState(preservedState, normalizeColumnState);

        gridApi.applyColumnState({
          state: normalizedState,
          applyOrder: true,
          defaultState: { hide: false }
        });

        setTimeout(() => {
          gridApi.refreshHeader();
        }, 300);

        // If no saved sort, apply default sort from colDefs
        if (!hasSavedSort) {
          applyDefaultSort();
        }
      } else {
        applyDefaultSort();
      }

      function applyDefaultSort() {
        if (!colDefs || colDefs.length === 0) return;
        const defaultSortCols = colDefs
          .filter((col) => col.sort)
          .map((col) => ({
            colId: col.colId || col.field,
            sort: col.sort,
            sortIndex: col.sortIndex
          }));
        if (defaultSortCols.length > 0) {
          gridApi.applyColumnState({
            state: defaultSortCols,
            defaultState: { sort: null }
          });
        }
      }
    } catch (error) {
      console.error("Error loading column state:", error);
    }
  }, [gridApi, columnStateKey, colDefs, getResponsiveColumns, normalizeColumnState, tableId]);

  useEffect(() => {
    applySavedColumnState();
  }, [applySavedColumnState]);

  useEffect(() => {
    if (!gridApi) return;
    const wasLoading = wasLoadingRef.current;
    if (wasLoading && !loading) {
      // Re-apply saved state after columns update post-loading.
      setTimeout(() => {
        applySavedColumnState();
      }, 0);
    }
    wasLoadingRef.current = loading;
  }, [gridApi, loading, applySavedColumnState]);

  useEffect(() => {
    if (!gridApi) return;
    const handleNewColumnsLoaded = () => {
      applySavedColumnState();
    };
    gridApi.addEventListener("newColumnsLoaded", handleNewColumnsLoaded);
    return () => {
      gridApi.removeEventListener("newColumnsLoaded", handleNewColumnsLoaded);
    };
  }, [gridApi, applySavedColumnState, columnStateKey, tableId]);

  useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
    };
  }, []);

  // Persist selection (IDs) independent of rendered blocks
  useEffect(() => {
    if (!gridApi) return;

    const onRowSelected = (event) => {
      const id = getIdFromNode(event.node);
      if (!id) return;

      if (event.node.isSelected && event.node.isSelected()) {
        selectedIdRef.current.add(id);
      } else {
        selectedIdRef.current.delete(id);
      }
      setRowSelectionCount(selectedIdRef.current.size);

      if (!selectionRestoreInProgressRef.current) {
        captureSelectionSnapshot(gridApi);
      }
    };

    gridApi.addEventListener("rowSelected", onRowSelected);

    if (!selectionRestorePendingRef.current) {
      try {
        const initialSelection = new Set();
        gridApi.forEachNode((node) => {
          if (node.isSelected && node.isSelected() && !node.rowPinned) {
            const id = getIdFromNode(node);
            if (id) initialSelection.add(id);
          }
        });
        selectedIdRef.current = initialSelection;
        setRowSelectionCount(initialSelection.size);
      } catch {
        /* no-op */
      }
    }

    return () => {
      gridApi.removeEventListener("rowSelected", onRowSelected);
    };
  }, [captureSelectionSnapshot, getIdFromNode, gridApi]);

  // Track displayed row count from the grid (SSRM or client-side) with a small debounce
  useEffect(() => {
    if (!gridApi) return;

    const scheduleUpdate = () => {
      try {
        const count =
          (typeof gridApi.getDisplayedRowCount === "function" && gridApi.getDisplayedRowCount()) ||
          (typeof gridApi.getModel === "function" &&
            typeof gridApi.getModel()?.getRowCount === "function" &&
            gridApi.getModel().getRowCount()) ||
          0;

        if (rowCountUpdateTimer.current) {
          clearTimeout(rowCountUpdateTimer.current);
        }
        rowCountUpdateTimer.current = setTimeout(() => {
          setGridRowCount((prev) => {
            if (prev === count) return prev;
            return count;
          });
          if (count > 0) {
            setLastNonZeroRowCount((prev) => (prev === count ? prev : count));
          }
        }, 80);
      } catch {
        /* no-op */
      }
    };

    scheduleUpdate();
    gridApi.addEventListener("modelUpdated", scheduleUpdate);
    gridApi.addEventListener("firstDataRendered", scheduleUpdate);
    gridApi.addEventListener("rowDataUpdated", scheduleUpdate);

    return () => {
      if (rowCountUpdateTimer.current) {
        clearTimeout(rowCountUpdateTimer.current);
        rowCountUpdateTimer.current = null;
      }
      gridApi.removeEventListener("modelUpdated", scheduleUpdate);
      gridApi.removeEventListener("firstDataRendered", scheduleUpdate);
      gridApi.removeEventListener("rowDataUpdated", scheduleUpdate);
    };
  }, [gridApi]);

  const handleRowCountChange = useCallback((count) => {
    if (typeof count !== "number") return;
    setServerRowCount((prev) => (prev === count ? prev : count));
    if (count > 0) {
      setLastNonZeroRowCount((prev) => (prev === count ? prev : count));
    }
  }, []);

  const handleRangeSelectionChanged = useCallback(() => {
    syncRangeSelectionState(gridApi);

    if (!selectionRestoreInProgressRef.current) {
      captureSelectionSnapshot(gridApi);
    }
  }, [captureSelectionSnapshot, gridApi, syncRangeSelectionState]);

  const announceSelectionMessage = useCallback((message) => {
    if (!message) return;

    if (selectionAnnouncementTimerRef.current) {
      clearTimeout(selectionAnnouncementTimerRef.current);
    }

    setSelectionAnnouncement("");
    selectionAnnouncementTimerRef.current = setTimeout(() => {
      setSelectionAnnouncement(message);
      selectionAnnouncementTimerRef.current = setTimeout(() => {
        setSelectionAnnouncement("");
        selectionAnnouncementTimerRef.current = null;
      }, 1500);
    }, 10);
  }, []);

  const handleRangeSelectionTrimmed = useCallback(() => {
    announceSelectionMessage(i18n.t("ui.toolkit.table.rangeSelectionTrimmed"));
  }, [announceSelectionMessage]);

  useEffect(() => {
    if (!gridApi || !selectionRestorePendingRef.current) {
      return undefined;
    }

    let active = true;
    const tryRestoreSelection = () => {
      if (!active) return;

      const restored = restoreSelectionSnapshot(gridApi);
      if (!restored) return;

      gridApi.removeEventListener("firstDataRendered", tryRestoreSelection);
      gridApi.removeEventListener("rowDataUpdated", tryRestoreSelection);
      gridApi.removeEventListener("modelUpdated", tryRestoreSelection);
    };

    gridApi.addEventListener("firstDataRendered", tryRestoreSelection);
    gridApi.addEventListener("rowDataUpdated", tryRestoreSelection);
    gridApi.addEventListener("modelUpdated", tryRestoreSelection);

    requestAnimationFrame(tryRestoreSelection);

    return () => {
      active = false;
      gridApi.removeEventListener("firstDataRendered", tryRestoreSelection);
      gridApi.removeEventListener("rowDataUpdated", tryRestoreSelection);
      gridApi.removeEventListener("modelUpdated", tryRestoreSelection);
    };
  }, [gridApi, restoreSelectionSnapshot]);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    if (gridApi && hasCellRangeSelection) {
      gridApi.clearRangeSelection();
    }

    if (
      !hasCellRangeSelection &&
      selectedNumberCellsSum === null &&
      selectedNumberCellsAverage === null
    ) {
      return;
    }

    setHasCellRangeSelection(false);
    setCellRangeSelectionCount(0);
    setSelectedNumberCellsSum(null);
    setSelectedNumberCellsAverage(null);
    setShowSelectionExportPopover(false);
    captureSelectionSnapshot(gridApi);
  }, [
    captureSelectionSnapshot,
    gridApi,
    hasCellRangeSelection,
    isMobile,
    selectedNumberCellsAverage,
    selectedNumberCellsSum
  ]);

  useEffect(() => {
    if (
      isMobile ||
      isFullscreen ||
      (!hasCellRangeSelection && rowSelectionCount === 0) ||
      typeof window === "undefined"
    ) {
      setDesktopSelectionBarBounds(null);
      return undefined;
    }

    let frameId = null;
    const tableWrapper = tableWrapperRef.current;
    const anchorElement = getSelectionBarAnchorElement();

    if (!tableWrapper || !anchorElement) {
      setDesktopSelectionBarBounds(null);
      return undefined;
    }

    const updateBounds = () => {
      frameId = null;

      const rect = anchorElement.getBoundingClientRect();
      if (rect.width <= 0) {
        setDesktopSelectionBarBounds(null);
        return;
      }

      setDesktopSelectionBarBounds((current) => {
        const next = {
          left: rect.left,
          width: rect.width
        };

        if (
          current &&
          Math.abs(current.left - next.left) < 1 &&
          Math.abs(current.width - next.width) < 1
        ) {
          return current;
        }

        return next;
      });
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateBounds);
    };

    scheduleUpdate();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleUpdate) : null;

    resizeObserver?.observe(anchorElement);
    if (anchorElement !== tableWrapper) {
      resizeObserver?.observe(tableWrapper);
    }

    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [
    getSelectionBarAnchorElement,
    hasCellRangeSelection,
    rowSelectionCount,
    isFullscreen,
    isMobile
  ]);

  // Decide whether to use autoHeight (small datasets) in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setUseAutoHeight(false);
      return;
    }
    const isClientSide = !infiniteScroll;
    const rows = Array.isArray(rowData) ? rowData.length : 0;
    const rowsForSizing = loading ? (lastNonZeroRowCount ?? rows) : rows;
    const rowHeight = appliedSize === "small" ? 26 : appliedSize === "large" ? 48 : 36;
    const headerHeight = appliedSize === "small" ? 32 : appliedSize === "large" ? 48 : 40;
    const footerHeight = showFooter ? rowHeight : 0;
    const estimatedGridHeight = headerHeight + footerHeight + rowsForSizing * rowHeight;
    const viewportMax = typeof window !== "undefined" ? Math.floor(window.innerHeight * 0.85) : 680;
    // Enable autoHeight if content fits comfortably within modal viewport
    const nextUseAutoHeight =
      isClientSide && rowsForSizing > 0 && estimatedGridHeight < viewportMax - 24;
    setUseAutoHeight(nextUseAutoHeight);
  }, [
    isFullscreen,
    rowData,
    appliedSize,
    showFooter,
    infiniteScroll,
    loading,
    lastNonZeroRowCount
  ]);

  useEffect(() => {
    if (!gridApi) return;

    let timerId;
    let fillTimerId;
    let isUiColumnResizing = false;

    const persistColumnState = () => {
      try {
        if (Date.now() < suppressColumnPersistenceUntilRef.current) return;
        if (!hasUserInteractedRef.current) return;
        const state = gridApi.getColumnState();
        if (Array.isArray(state) && state.length > 0) {
          saveColumnState(state);
        }
      } catch (error) {
        console.error("Error persisting column state:", error);
      }
    };

    const debouncedPersist = () => {
      clearTimeout(timerId);
      if (Date.now() < suppressColumnPersistenceUntilRef.current) return;
      timerId = setTimeout(persistColumnState, 200);
    };

    const debouncedFillLeftover = () => {
      clearTimeout(fillTimerId);
      if (isUiColumnResizing) return;
      if (Date.now() < suppressColumnPersistenceUntilRef.current) return;
      fillTimerId = setTimeout(() => {
        if (isUiColumnResizing) return;
        fillLeftoverTableWidth();
      }, 100);
    };

    const handleColumnResized = (event) => {
      if (event?.source === "uiColumnResized") {
        isUiColumnResizing = !event?.finished;
        hasUserInteractedRef.current = true;
        // Track which column was resized by the user
        if (event?.column?.getColId) {
          const colId = event.column.getColId();
          userResizedColumnsRef.current.add(colId);
        }
      }
      if (event?.finished) {
        isUiColumnResizing = false;
        debouncedPersist();
      }
    };

    const handleColumnMoved = (event) => {
      if (event?.source && String(event.source).includes("ui")) {
        hasUserInteractedRef.current = true;
      }
      debouncedPersist();
    };

    const handleColumnPinned = (event) => {
      if (event?.source && String(event.source).includes("ui")) {
        hasUserInteractedRef.current = true;
      }
      debouncedPersist();
    };

    const handleColumnVisible = (event) => {
      if (event?.source && String(event.source).includes("ui")) {
        hasUserInteractedRef.current = true;
      }
      debouncedFillLeftover();
      debouncedPersist();
    };

    const handleGridSizeChanged = () => {
      debouncedFillLeftover();
    };

    const handleSortChanged = (event) => {
      if (event?.source && String(event.source).includes("ui")) {
        hasUserInteractedRef.current = true;
      }
      debouncedPersist();
    };

    gridApi.addEventListener("columnResized", handleColumnResized);
    gridApi.addEventListener("columnMoved", handleColumnMoved);
    gridApi.addEventListener("columnPinned", handleColumnPinned);
    gridApi.addEventListener("columnVisible", handleColumnVisible);
    gridApi.addEventListener("gridSizeChanged", handleGridSizeChanged);
    gridApi.addEventListener("sortChanged", handleSortChanged);

    return () => {
      clearTimeout(timerId);
      clearTimeout(fillTimerId);
      gridApi.removeEventListener("columnResized", handleColumnResized);
      gridApi.removeEventListener("columnMoved", handleColumnMoved);
      gridApi.removeEventListener("columnPinned", handleColumnPinned);
      gridApi.removeEventListener("columnVisible", handleColumnVisible);
      gridApi.removeEventListener("gridSizeChanged", handleGridSizeChanged);
      gridApi.removeEventListener("sortChanged", handleSortChanged);
    };
  }, [fillLeftoverTableWidth, gridApi, saveColumnState]);

  useEffect(() => {
    if (!gridApi) return;

    let hasSavedState = false;
    try {
      hasSavedState = !!localStorage.getItem(columnStateKey);
    } catch {
      hasSavedState = false;
    }

    if (hasSavedState) return;

    const handleFirstDataRendered = () => {
      runInitialColumnAutoSize();
      gridApi.removeEventListener("firstDataRendered", handleFirstDataRendered);
    };

    gridApi.addEventListener("firstDataRendered", handleFirstDataRendered);

    const hasRenderedRows =
      typeof gridApi.getDisplayedRowCount === "function" && gridApi.getDisplayedRowCount() > 0;
    if (hasRenderedRows) {
      runInitialColumnAutoSize();
    }

    return () => {
      gridApi.removeEventListener("firstDataRendered", handleFirstDataRendered);
    };
  }, [gridApi, columnStateKey, runInitialColumnAutoSize]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showHeaderExportPopover &&
        headerExportButtonRef.current &&
        !headerExportButtonRef.current.contains(event.target) &&
        !document.getElementById("header-export-popover")?.contains(event.target)
      ) {
        setShowHeaderExportPopover(false);
      }

      if (
        showSelectionExportPopover &&
        selectionExportButtonRef.current &&
        !selectionExportButtonRef.current.contains(event.target) &&
        !document.getElementById("selection-export-popover")?.contains(event.target)
      ) {
        setShowSelectionExportPopover(false);
      }

      const columnChooserAnchorRef = isNarrowViewport ? overflowButtonRef : editTableButtonRef;
      if (
        isColumnChooserOpen &&
        !isNarrowViewport &&
        columnChooserAnchorRef.current &&
        !columnChooserAnchorRef.current.contains(event.target) &&
        !document.getElementById("column-chooser-popover")?.contains(event.target)
      ) {
        closeColumnChooser();
      }

      if (
        isOverflowOpen &&
        overflowButtonRef.current &&
        !overflowButtonRef.current.contains(event.target) &&
        !document.getElementById("table-overflow-popover")?.contains(event.target)
      ) {
        closeOverflowMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    showHeaderExportPopover,
    showSelectionExportPopover,
    isColumnChooserOpen,
    isOverflowOpen,
    isNarrowViewport,
    closeColumnChooser,
    closeOverflowMenu
  ]);

  // Close popovers when loading starts
  useEffect(() => {
    if (loading) {
      closeColumnChooser();
      closeOverflowMenu();
      setShowHeaderExportPopover(false);
      setShowSelectionExportPopover(false);
    }
  }, [loading, closeColumnChooser, closeOverflowMenu]);

  useEffect(
    () => () => {
      if (selectionAnnouncementTimerRef.current) {
        clearTimeout(selectionAnnouncementTimerRef.current);
      }
    },
    []
  );

  // ──────────────────────────────────────────────────────────────────────────────
  // Export helpers (CSV/XLSX) with SSRM support
  // ──────────────────────────────────────────────────────────────────────────────
  const getExportableColumns = (api) => {
    const columns = api.getAllDisplayedColumns();
    return columns.filter((column) => {
      const colDef = column.getColDef();
      const field = colDef.field;
      const headerName = colDef.headerName;
      // Skip selection/auto columns and columns without meaningful headers
      return field || (headerName && headerName !== "");
    });
  };

  const getDisplayNameForColumn = (column) => {
    const colDef = column.getColDef();
    const field = colDef.field;
    const headerName = colDef.headerName;
    let displayName = headerName || field || column.getColId();
    if (displayName && typeof displayName === "string") {
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    }
    return displayName || "Column";
  };

  const resolveValueFromData = (data, column, api) => {
    const colDef = column.getColDef();
    try {
      // Debug logging to help track down issues
      const field = colDef.field;
      const cellRenderer = colDef.cellRenderer;
      const cellRendererName =
        typeof cellRenderer === "function" ? cellRenderer.name : cellRenderer;

      //

      // First try valueGetter if available (handles complex logic)
      if (colDef.valueGetter && typeof colDef.valueGetter === "function") {
        const value = colDef.valueGetter({ data, colDef, column, api });
        if (value != null) return value;
      }

      // Helper to check if a cell renderer matches
      const isCellRenderer = (targetName) => {
        const selectorComponent =
          typeof colDef.cellRendererSelector === "function"
            ? colDef.cellRendererSelector({
                node: { rowPinned: false },
                data: {},
                colDef: colDef,
                column: column,
                api: api
              })?.component
            : null;

        return (
          cellRendererName === targetName ||
          cellRenderer === targetName ||
          (typeof cellRenderer === "function" && cellRenderer.name === targetName) ||
          (typeof cellRenderer === "object" && cellRenderer?.name === targetName) ||
          selectorComponent === targetName ||
          (typeof selectorComponent === "function" && selectorComponent.name === targetName) ||
          (typeof selectorComponent === "object" && selectorComponent?.name === targetName)
        );
      };

      // Special handling based on cell renderer type
      if (isCellRenderer("TextCell")) {
        // TextCell: try cellRendererParams.text first, then field
        if (typeof colDef.cellRendererParams === "function") {
          const params = colDef.cellRendererParams({ data, colDef, column, api });
          if (params?.text != null) {
            return params.text;
          }
        } else if (colDef.cellRendererParams?.text != null) {
          return colDef.cellRendererParams.text;
        }
        return field && data ? (data[field] ?? "") : "";
      }

      if (isCellRenderer("NumberCell")) {
        // NumberCell: get raw numeric value from data field or cellRendererParams
        let rawValue;
        if (field && data && data[field] != null) {
          rawValue = data[field];
        } else if (typeof colDef.cellRendererParams === "function") {
          const params = colDef.cellRendererParams({ data, colDef, column, api });
          if (typeof params?.value === "number") {
            rawValue = params.value;
          }
        } else if (typeof colDef.cellRendererParams?.value === "number") {
          rawValue = colDef.cellRendererParams.value;
        }

        if (rawValue != null && typeof rawValue === "number" && colDef.valueFormatter) {
          return colDef.valueFormatter({ value: rawValue, data, colDef, column, api });
        }

        if (rawValue != null && typeof rawValue === "number") {
          if (field === "convRate" || field === "conversionRate") {
            return `${rawValue.toFixed(1)}%`;
          }
          if (field === "epc" || field === "commission" || field === "affiliateCommission") {
            return rawValue.toFixed(2);
          }
        }

        return rawValue ?? "";
      }

      if (isCellRenderer("AccountCell")) {
        // AccountCell: use brandName from cellRendererParams or valueGetter result
        if (typeof colDef.cellRendererParams === "function") {
          const params = colDef.cellRendererParams({ data, colDef, column, api });
          if (params?.brandName != null) return params.brandName;
        } else if (colDef.cellRendererParams?.brandName != null) {
          return colDef.cellRendererParams.brandName;
        }
        // Fallback to nested data access
        return data?.account?.brandName ?? "";
      }

      if (isCellRenderer("InputCell")) {
        // InputCell: try cellRendererParams.value first, then field
        if (typeof colDef.cellRendererParams === "function") {
          const params = colDef.cellRendererParams({ data, colDef, column, api });
          if (params?.value != null) return params.value;
        } else if (colDef.cellRendererParams?.value != null) {
          return colDef.cellRendererParams.value;
        }
        return field && data ? (data[field] ?? "") : "";
      }

      if (isCellRenderer("DropdownCell")) {
        // DropdownCell: get the value and find the label in options
        let value;
        if (typeof colDef.cellRendererParams === "function") {
          const params = colDef.cellRendererParams({ data, colDef, column, api });
          value = params?.value;
          // Try to get label from options
          if (params?.options && Array.isArray(params.options)) {
            const option = params.options.find((opt) => opt.value === value);
            if (option?.label) return option.label;
          }
        } else if (colDef.cellRendererParams?.value != null) {
          value = colDef.cellRendererParams.value;
          if (
            colDef.cellRendererParams?.options &&
            Array.isArray(colDef.cellRendererParams.options)
          ) {
            const option = colDef.cellRendererParams.options.find((opt) => opt.value === value);
            if (option?.label) return option.label;
          }
        }
        if (value == null && field && data) {
          value = data[field];
        }
        return value ?? "";
      }

      if (isCellRenderer("StatsBadgeCell")) {
        // StatsBadgeCell: use the value from cellRendererParams
        if (typeof colDef.cellRendererParams === "function") {
          const params = colDef.cellRendererParams({ data, colDef, column, api });
          if (params?.value != null) {
            return field?.startsWith(DELTA_METRIC_PREFIX) && typeof params.value === "number"
              ? params.value.toFixed(2)
              : params.value;
          }
        } else if (colDef.cellRendererParams?.value != null) {
          return field?.startsWith(DELTA_METRIC_PREFIX) &&
            typeof colDef.cellRendererParams.value === "number"
            ? colDef.cellRendererParams.value.toFixed(2)
            : colDef.cellRendererParams.value;
        }
        if (field && data) {
          const value = data[field];
          return field.startsWith(DELTA_METRIC_PREFIX) && typeof value === "number"
            ? value.toFixed(2)
            : (value ?? "");
        }
        return "";
      }

      if (isCellRenderer("CustomCheckBoxCell")) {
        // CustomCheckBoxCell: return boolean as Yes/No
        const value = field && data ? data[field] : false;
        return value ? "Yes" : "No";
      }

      if (isCellRenderer("BadgeCell")) {
        // BadgeCell: typically uses field directly
        return field && data ? (data[field] ?? "") : "";
      }

      // Default: try direct field access
      if (field && data) {
        const value = data[field];

        if (value != null && typeof colDef.valueFormatter === "function") {
          return colDef.valueFormatter({ value, data, colDef, column, api });
        }

        // Field-specific number formatting
        if (value != null && typeof value === "number") {
          if (field === "convRate" || field === "conversionRate") {
            return `${value.toFixed(1)}%`;
          }
          if (field === "epc" || field === "commission" || field === "affiliateCommission") {
            return value.toFixed(2);
          }
          if (field.startsWith(DELTA_METRIC_PREFIX)) {
            return value.toFixed(2);
          }
        }

        if (value != null) return value;
      }
      return "";
    } catch (error) {
      console.warn("Error resolving value for export:", error);
      return "";
    }
  };

  const collectAllRowsForExport = async (api, { onlySelected, selectedIdSet }) => {
    // If a selected-id set is provided and non-empty, prefer it
    const effectiveSelectedSet =
      onlySelected && selectedIdSet && selectedIdSet.size > 0 ? selectedIdSet : null;

    // SSRM full fetch path
    if (infiniteScroll && typeof loadRows === "function") {
      // If onlySelected, try to limit to selected ids if getRowId is provided
      let selectedFilterSet = null;
      if (effectiveSelectedSet) {
        try {
          selectedFilterSet = new Set([...effectiveSelectedSet]);
        } catch {
          selectedFilterSet = null;
        }
      }

      const sortModel = typeof api.getSortModel === "function" ? api.getSortModel() : [];
      const filterModel = typeof api.getFilterModel === "function" ? api.getFilterModel() : {};

      const pageSize = Math.max(100, Number(blockSize) || 100);
      let startRow = 0;
      let totalRowCount;
      const all = [];
      const MAX_PAGES = 10000;
      let pageCount = 0;
      let keepFetching = true;
      while (keepFetching) {
        if (pageCount++ > MAX_PAGES) break;
        const endRow = startRow + pageSize;
        const res = await loadRows({
          startRow,
          endRow,
          sortModel,
          filterModel,
          groupKeys: [],
          rowGroupCols: [],
          valueCols: [],
          pivotCols: [],
          pivotMode: false
        });
        const rows = Array.isArray(res?.rows) ? res.rows : [];
        if (selectedFilterSet) {
          rows.forEach((r) => {
            const rid = typeof getRowId === "function" ? String(getRowId({ data: r })) : null;
            if (rid && selectedFilterSet.has(rid)) all.push(r);
          });
        } else {
          all.push(...rows);
        }
        totalRowCount = typeof res?.totalRowCount === "number" ? res.totalRowCount : totalRowCount;
        if (typeof totalRowCount === "number") {
          keepFetching =
            all.length < totalRowCount &&
            (!selectedFilterSet || all.length < selectedFilterSet.size);
        } else if (rows.length < pageSize) {
          keepFetching = false;
        } else {
          startRow = all.length;
        }
      }
      return all;
    }

    if (!infiniteScroll) {
      if (onlySelected) {
        const out = [];
        api.forEachNode((node) => {
          if (node?.isSelected && node.isSelected() && !node.rowPinned && node.data) {
            out.push(node.data);
          }
        });
        return out;
      }

      const allRows = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (!node.rowPinned && node?.data) allRows.push(node.data);
      });
      return allRows;
    }

    if (onlySelected) {
      const rows = [];
      api.forEachNode((node) => {
        if (node?.isSelected && node.isSelected() && !node.rowPinned && node?.data)
          rows.push(node.data);
      });
      return rows;
    } else {
      const rows = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (!node.rowPinned && node?.data) rows.push(node.data);
      });
      return rows;
    }
  };

  const getAdditionalExportCells = (columns, onlySelected) =>
    onlySelected || !Array.isArray(additionalExportRows)
      ? []
      : additionalExportRows.map((row) =>
          columns.map((column) => {
            const value = row?.[column.getColId()];
            return value == null ? "" : String(value);
          })
        );

  const toCsv = (rows, columns, api, extraCells = []) => {
    const escape = (val) => {
      if (val == null) return "";
      const s = String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    // Check if any column has field 'epc', 'commission', or 'affiliateCommission'
    const hasCurrencyColumn = columns.some((c) => {
      const field = c.getColDef?.()?.field;
      return field === "epc" || field === "commission" || field === "affiliateCommission";
    });

    let header = columns.map((c) => escape(getDisplayNameForColumn(c))).join(",");
    if (hasCurrencyColumn && exportCurrencyCode) {
      header += ",Currency";
    }

    const withCurrency = (line) =>
      hasCurrencyColumn && exportCurrencyCode ? `${line},${escape(exportCurrencyCode)}` : line;

    const lines = rows.map((data) =>
      withCurrency(columns.map((c) => escape(resolveValueFromData(data, c, api))).join(","))
    );
    const extraLines = extraCells.map((cells) => withCurrency(cells.map(escape).join(",")));

    return [header, ...lines, ...extraLines].join("\n");
  };

  const downloadBlob = (content, type, filename) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Collect cell range data for export
  const collectCellRangeData = (api) => {
    try {
      const cellRanges = api.getCellRanges();
      if (!cellRanges || cellRanges.length === 0) return { rows: [], columns: [] };

      // Collect unique columns from all ranges
      const columnsSet = new Map();
      const rowDataMap = new Map();

      cellRanges.forEach((range) => {
        const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
        const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
        const rangeColumns = range.columns || [];

        rangeColumns.forEach((col) => {
          const colDef = col.getColDef?.();
          if (!colDef?.field) return;
          if (!columnsSet.has(col.getColId())) {
            columnsSet.set(col.getColId(), col);
          }
        });

        // Collect row data
        for (let rowIdx = startRowIndex; rowIdx <= endRowIndex; rowIdx++) {
          const rowNode = api.getDisplayedRowAtIndex(rowIdx);
          if (rowNode && rowNode.data && !rowNode.rowPinned) {
            if (!rowDataMap.has(rowIdx)) {
              rowDataMap.set(rowIdx, { rowIndex: rowIdx, data: rowNode.data, cells: {} });
            }
            // Mark which columns are selected for this row
            rangeColumns.forEach((col) => {
              rowDataMap.get(rowIdx).cells[col.getColId()] = true;
            });
          }
        }
      });

      // Convert to arrays, sorted by row index
      const columns = Array.from(columnsSet.values());
      const rows = Array.from(rowDataMap.values()).sort((a, b) => a.rowIndex - b.rowIndex);

      return { rows, columns };
    } catch (error) {
      console.warn("Error collecting cell range data:", error);
      return { rows: [], columns: [] };
    }
  };

  // Export cell range to CSV
  const exportCellRangeToCSV = (api) => {
    const { rows, columns } = collectCellRangeData(api);
    if (rows.length === 0 || columns.length === 0) return;

    const escape = (val) => {
      if (val == null) return "";
      const s = String(val);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const header = columns.map((c) => escape(getDisplayNameForColumn(c))).join(",");
    const lines = rows.map((row) =>
      columns.map((c) => escape(resolveValueFromData(row.data, c, api))).join(",")
    );
    const csv = [header, ...lines].join("\n");
    downloadBlob(
      csv,
      "text/csv;charset=utf-8;",
      getExportFilename({ extension: "csv", onlySelected: true })
    );
  };

  // Export cell range to XLSX
  const exportCellRangeToXLSX = (api) => {
    const { rows, columns } = collectCellRangeData(api);
    if (rows.length === 0 || columns.length === 0) return;

    const headers = columns.map((c) => getDisplayNameForColumn(c));
    const dataRows = rows.map((row) =>
      columns.map((c) => {
        const val = resolveValueFromData(row.data, c, api);
        return val == null ? "" : String(val);
      })
    );

    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, getExportSheetName({ onlySelected: true }));
    XLSX.writeFile(wb, getExportFilename({ extension: "xlsx", onlySelected: true }));
  };

  // Export cell range to PDF
  const exportCellRangeToPDF = async (api) => {
    const { rows, columns } = collectCellRangeData(api);
    if (rows.length === 0 || columns.length === 0) return;

    let pdfMake;
    try {
      const pdfMakeMod = await import("pdfmake/build/pdfmake");
      const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
      pdfMake = pdfMakeMod?.default || pdfMakeMod;
      const vfsCandidate =
        pdfFontsMod?.pdfMake?.vfs ||
        pdfFontsMod?.default?.pdfMake?.vfs ||
        pdfFontsMod?.default?.vfs ||
        pdfFontsMod?.vfs;
      if (vfsCandidate) {
        pdfMake.vfs = vfsCandidate;
      }
    } catch {
      console.warn("pdfmake failed to load; PDF export unavailable.");
      return;
    }

    const headerRow = columns.map((column) => ({
      text: getDisplayNameForColumn(column),
      bold: true,
      margin: [0, 12, 0, 0]
    }));

    const rowsToExport = rows.map((row) =>
      columns.map((column) => ({
        text: String(resolveValueFromData(row.data, column, api) ?? "")
      }))
    );

    const docDefinition = {
      pageOrientation: "landscape",
      pageMargins: [10, 10, 10, 10],
      defaultStyle: { fontSize: 10 },
      content: [
        {
          table: {
            headerRows: 1,
            widths: Array(columns.length).fill("*"),
            body: [headerRow, ...rowsToExport],
            heights: (rowIndex) => (rowIndex === 0 ? 40 : 15)
          },
          layout: {
            fillColor: (rowIndex) => {
              if (rowIndex === 0) return "#f8f8f8";
              return rowIndex % 2 === 0 ? "#fcfcfc" : "#fff";
            },
            hLineColor: () => "#dde2eb",
            vLineColor: () => "#dde2eb"
          }
        }
      ]
    };

    pdfMake
      .createPdf(docDefinition)
      .download(getExportFilename({ extension: "pdf", onlySelected: true }));
  };

  const exportToCSV = async (api, { onlySelected, selectedIdSet }) => {
    // Always use our custom logic to properly handle cell renderers
    try {
      const columns = getExportableColumns(api);
      const rows = await collectAllRowsForExport(api, { onlySelected, selectedIdSet });
      console.log("CSV Export - Columns:", columns.length, "Rows:", rows.length);
      console.log("Sample row data:", rows[0]);
      const csv = toCsv(rows, columns, api, getAdditionalExportCells(columns, onlySelected));
      console.log("Generated CSV preview:", csv.substring(0, 200) + "...");
      downloadBlob(
        csv,
        "text/csv;charset=utf-8;",
        getExportFilename({ extension: "csv", onlySelected })
      );
    } catch (error) {
      console.error("CSV export failed:", error);
      // Fallback to built-in export if available; it cannot add additionalExportRows, and a
      // file silently missing them would not match the table.
      const hasAdditionalRows = !onlySelected && additionalExportRows?.length > 0;
      if (!hasAdditionalRows && typeof api.exportDataAsCsv === "function") {
        api.exportDataAsCsv({
          onlySelected,
          onlySelectedAllPages: true,
          fileName: getExportFilename({ extension: "csv", onlySelected })
        });
      }
    }
  };

  const exportToXLSX = async (api, { onlySelected, selectedIdSet }) => {
    try {
      const columns = getExportableColumns(api);
      const rows = await collectAllRowsForExport(api, { onlySelected, selectedIdSet });

      const hasCurrencyColumn = columns.some((c) => {
        const field = c.getColDef?.()?.field;
        return field === "epc" || field === "commission";
      });

      const headers = columns.map((c) => getDisplayNameForColumn(c));
      if (hasCurrencyColumn && exportCurrencyCode) {
        headers.push("Currency");
      }

      const dataRows = rows.map((data) => {
        const row = columns.map((c) => {
          const val = resolveValueFromData(data, c, api);
          return val == null ? "" : String(val);
        });
        if (hasCurrencyColumn && exportCurrencyCode) {
          row.push(exportCurrencyCode);
        }
        return row;
      });
      const extraRows = getAdditionalExportCells(columns, onlySelected).map((cells) =>
        hasCurrencyColumn && exportCurrencyCode ? [...cells, exportCurrencyCode] : cells
      );

      const wsData = [headers, ...dataRows, ...extraRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, getExportSheetName({ onlySelected }));
      XLSX.writeFile(wb, getExportFilename({ extension: "xlsx", onlySelected }));
    } catch (error) {
      console.error("XLSX export failed:", error);
      await exportToCSV(api, { onlySelected, selectedIdSet });
    }
  };

  const handleColumnChooser = () => {
    if (loading) return;
    if (!gridApi) {
      console.warn("Grid API not available");
      return;
    }

    if (isColumnChooserOpen) {
      closeColumnChooser();
      return;
    }

    // Since AG Grid Community doesn't support ColumnMenuModule, use custom chooser
    setIsColumnChooserOpen(true);

    // Apply :active state by dispatching synthetic mousedown
    const columnChooserButtonRef = isNarrowViewport ? overflowButtonRef : editTableButtonRef;
    if (columnChooserButtonRef.current) {
      const button = columnChooserButtonRef.current.querySelector("button");
      if (button) {
        button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      }
    }
  };

  const renderColumnChooser = () => (
    <div id="column-chooser-popover" className={styles.column_chooser_popover} tabIndex={-1}>
      {gridApi && (
        <CustomColumnChooser
          gridApi={gridApi}
          isOpen={isColumnChooserOpen}
          columnStateKey={columnStateKey}
          colDefs={colDefs}
          normalizeColumnState={normalizeColumnState}
          getPortalTarget={getPopoverAppendTarget}
          onClose={closeColumnChooser}
          onReset={() => {
            handleResetColumnState();
          }}
          onSave={() => {
            const columnState = gridApi.getColumnState();
            saveColumnState(columnState);
          }}
          buttonRef={isNarrowViewport ? overflowButtonRef : editTableButtonRef}
        />
      )}
    </div>
  );

  const handleHeaderExportButtonClick = () => {
    if (loading) return;
    setShowHeaderExportPopover((current) => !current);
    setShowSelectionExportPopover(false);
    setIsOverflowOpen(false);
  };

  const handleSelectionExportButtonClick = () => {
    if (loading) return;
    setShowSelectionExportPopover((current) => !current);
    setShowHeaderExportPopover(false);
  };

  const getCellRangeClipboardText = useCallback(
    (api) => {
      const { rows, columns } = collectCellRangeData(api);
      if (rows.length === 0 || columns.length === 0) {
        return "";
      }

      return rows
        .map((row) =>
          columns
            .map((column) => String(resolveValueFromData(row.data, column, api) ?? ""))
            .join("\t")
        )
        .join("\n");
    },
    [collectCellRangeData]
  );

  const getSelectedRowsClipboardText = useCallback(
    async (api) => {
      const columns = getExportableColumns(api);
      const rows = await collectAllRowsForExport(api, {
        onlySelected: true,
        selectedIdSet: selectedIdRef.current
      });

      if (rows.length === 0 || columns.length === 0) {
        return "";
      }

      return rows
        .map((row) =>
          columns.map((column) => String(resolveValueFromData(row, column, api) ?? "")).join("\t")
        )
        .join("\n");
    },
    [collectAllRowsForExport]
  );

  const handleExportSelection = (selection) => {
    if (selection) {
      if (gridApi) {
        let hasCellRange = false;
        try {
          const cellRanges = gridApi.getCellRanges();
          hasCellRange = cellRanges && cellRanges.length > 0;
        } catch {
          hasCellRange = false;
        }

        if (hasCellRange) {
          if (selection === "XLSX") {
            exportCellRangeToXLSX(gridApi);
          } else if (selection === "CSV") {
            exportCellRangeToCSV(gridApi);
          } else if (selection === "PDF") {
            exportCellRangeToPDF(gridApi);
          }
          setShowHeaderExportPopover(false);
          setShowSelectionExportPopover(false);
          return;
        }

        const freshSelection = new Set();
        try {
          gridApi.forEachNode((node) => {
            if (node.isSelected && node.isSelected() && !node.rowPinned) {
              const id = (() => {
                try {
                  if (typeof getRowId === "function" && node?.data) {
                    return String(getRowId({ data: node.data }));
                  }
                  return (
                    (node && (node.id || node.key)) ||
                    (node?.data && (node.data.id || node.data.uuid || node.data.key)) ||
                    null
                  );
                } catch {
                  return null;
                }
              })();
              if (id) freshSelection.add(id);
            }
          });
        } catch {
          /* no-op */
        }

        const currentSelection = freshSelection;
        const hasSelection = currentSelection.size > 0;

        if (selection === "XLSX") {
          exportToXLSX(gridApi, {
            onlySelected: hasSelection,
            selectedIdSet: currentSelection
          });
        } else if (selection === "CSV") {
          exportToCSV(gridApi, {
            onlySelected: hasSelection,
            selectedIdSet: currentSelection
          });
        } else if (selection === "PDF") {
          exportToPDF(gridApi, hasSelection, currentSelection);
        }
      }
      setShowHeaderExportPopover(false);
      setShowSelectionExportPopover(false);
    }
  };

  const hasRowSelection = rowSelectionCount > 0;

  const clearCurrentSelection = useCallback(() => {
    if (!gridApi) return;

    setShowHeaderExportPopover(false);
    setShowSelectionExportPopover(false);
    setSelectionAnnouncement("");

    if (selectionAnnouncementTimerRef.current) {
      clearTimeout(selectionAnnouncementTimerRef.current);
      selectionAnnouncementTimerRef.current = null;
    }

    // Always clear both cell ranges and row selection. Gating on React flags left
    // stale "2 Rows" after "Select rows" → outside click cleared ranges only.
    try {
      gridApi.clearRangeSelection();
    } catch {
      /* no-op */
    }
    setHasCellRangeSelection(false);
    setCellRangeSelectionCount(0);
    setSelectedNumberCellsSum(null);
    setSelectedNumberCellsAverage(null);

    try {
      gridApi.deselectAll();
    } catch {
      /* no-op */
    }
    selectedIdRef.current = new Set();
    setRowSelectionCount(0);

    clearSelectionSnapshot();
  }, [clearSelectionSnapshot, gridApi]);

  useEffect(() => {
    if (!gridApi) return;

    const isInsideSelectionChrome = (target) => {
      if (!(target instanceof Element)) return false;
      if (target.closest("[class*='selection_bar']")) return true;
      if (target.closest("[data-tippy-root]")) return true;
      if (document.getElementById("selection-export-popover")?.contains(target)) return true;
      if (document.getElementById("export-popover")?.contains(target)) return true;
      if (document.getElementById("column-chooser-popover")?.contains(target)) return true;
      if (document.getElementById("header-export-popover")?.contains(target)) return true;
      return false;
    };

    const isInsideTableInteractionSurface = (target) => {
      if (!(target instanceof Element)) return false;
      if (tableContainerRef.current?.contains(target)) return true;
      // Chrome outside table_container (header, limit banner, fullscreen top slot)
      // must not dismiss. Do not use the full table_wrapper — it is height:100% and
      // would treat page chrome as "inside".
      const tableWrapper = tableWrapperRef.current;
      if (!tableWrapper) return false;
      return [
        `.${styles.header}`,
        `.${styles.limit_warning_panel}`,
        "[data-table-fullscreen-top]"
      ].some((selector) => tableWrapper.querySelector(selector)?.contains(target));
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && hasCellRangeSelection) {
        clearCurrentSelection();
      }
    };

    const handleOutsideClick = (event) => {
      // Checkbox-only row selection intentionally survives outside click.
      if (!hasCellRangeSelection) return;

      const target = event.target;
      if (isInsideSelectionChrome(target)) return;
      if (isInsideTableInteractionSurface(target)) return;

      clearCurrentSelection();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [clearCurrentSelection, gridApi, hasCellRangeSelection]);

  const handleCopySelection = useCallback(async () => {
    if (!gridApi) return;

    const clipboardText = hasCellRangeSelection
      ? getCellRangeClipboardText(gridApi)
      : hasRowSelection
        ? await getSelectedRowsClipboardText(gridApi)
        : "";

    if (!clipboardText) return;

    try {
      await writeToClipboard(clipboardText);
    } catch {
      Toaster.trigger({
        type: "error",
        title: i18n.t("ui.toolkit.table.copyFailed")
      });
    }
  }, [
    getCellRangeClipboardText,
    getSelectedRowsClipboardText,
    gridApi,
    hasCellRangeSelection,
    hasRowSelection
  ]);

  const handleSwitchToRowSelection = useCallback(() => {
    if (!gridApi || !hasCellRangeSelection) return;

    const selectedRowIndexes = new Set();
    const cellRanges = gridApi.getCellRanges();
    if (!cellRanges || cellRanges.length === 0) return;

    const displayedColumnIds = (gridApi.getAllDisplayedColumns?.() || [])
      .filter(isRangeSelectableColumn)
      .map((column) => column.getColId?.())
      .filter(Boolean);

    if (displayedColumnIds.length === 0) return;

    cellRanges.forEach((range) => {
      if (
        !Number.isInteger(range?.startRow?.rowIndex) ||
        !Number.isInteger(range?.endRow?.rowIndex)
      ) {
        return;
      }

      const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
      const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);

      for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
        const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
        if (rowNode && !rowNode.rowPinned) {
          selectedRowIndexes.add(rowIndex);
        }
      }
    });

    if (selectedRowIndexes.size === 0) return;

    const sortedRowIndexes = [...selectedRowIndexes].sort((left, right) => left - right);
    const contiguousRowRanges = [];
    let rangeStart = sortedRowIndexes[0];
    let previousRowIndex = sortedRowIndexes[0];

    for (let index = 1; index < sortedRowIndexes.length; index++) {
      const rowIndex = sortedRowIndexes[index];
      if (rowIndex === previousRowIndex + 1) {
        previousRowIndex = rowIndex;
        continue;
      }

      contiguousRowRanges.push({ rowStartIndex: rangeStart, rowEndIndex: previousRowIndex });
      rangeStart = rowIndex;
      previousRowIndex = rowIndex;
    }

    contiguousRowRanges.push({ rowStartIndex: rangeStart, rowEndIndex: previousRowIndex });

    setShowHeaderExportPopover(false);
    setShowSelectionExportPopover(false);

    gridApi.deselectAll();
    const nextSelectedIds = new Set();
    sortedRowIndexes.forEach((rowIndex) => {
      const rowNode = gridApi.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode || rowNode.rowPinned) return;

      rowNode.setSelected?.(true, false);
      const rowId = getIdFromNode(rowNode);
      if (rowId) {
        nextSelectedIds.add(rowId);
      }
    });
    selectedIdRef.current = nextSelectedIds;
    setRowSelectionCount(nextSelectedIds.size);

    gridApi.clearRangeSelection();

    contiguousRowRanges.forEach((range) => {
      gridApi.addCellRange({
        rowStartIndex: range.rowStartIndex,
        rowEndIndex: range.rowEndIndex,
        columns: displayedColumnIds
      });
    });
    captureSelectionSnapshot(gridApi);
  }, [captureSelectionSnapshot, getIdFromNode, gridApi, hasCellRangeSelection]);

  const handleFullscreen = () => {
    const snapshot = captureSelectionSnapshot(gridApi);
    selectionRestorePendingRef.current = hasSelectionSnapshot(snapshot);
    setIsFullscreen(!isFullscreen);
  };

  const exportToPDF = async (gridApi, onlySelected = false, selectedIdSet = null) => {
    // Lazy-load pdfmake and fonts only when needed to avoid Storybook/Vite dynamic import issues
    let pdfMake;
    try {
      const pdfMakeMod = await import("pdfmake/build/pdfmake");
      const pdfFontsMod = await import("pdfmake/build/vfs_fonts");
      pdfMake = pdfMakeMod?.default || pdfMakeMod;

      // Handle various shapes of the fonts module across bundlers
      const vfsCandidate =
        pdfFontsMod?.pdfMake?.vfs ||
        pdfFontsMod?.default?.pdfMake?.vfs ||
        pdfFontsMod?.default?.vfs ||
        pdfFontsMod?.vfs;
      if (vfsCandidate) {
        pdfMake.vfs = vfsCandidate;
      }
    } catch {
      console.warn("pdfmake failed to load; PDF export unavailable.");
      return;
    }
    // Extract headers with proper field handling
    const columns = gridApi.getAllDisplayedColumns();

    // Filter out columns that shouldn't be exported (like selection checkboxes)
    const exportableColumns = columns.filter((column) => {
      const colDef = column.getColDef();
      const field = colDef.field;
      const headerName = colDef.headerName;

      // Skip selection columns and columns without meaningful headers
      return field || (headerName && headerName !== "");
    });

    // Check if any column has field 'epc', 'commission', or 'affiliateCommission'
    const hasCurrencyColumn = exportableColumns.some((column) => {
      const field = column.getColDef?.()?.field;
      return field === "epc" || field === "commission" || field === "affiliateCommission";
    });

    const headerRow = exportableColumns.map((column) => {
      const colDef = column.getColDef();
      const field = colDef.field;
      const headerName = colDef.headerName;

      // Use headerName if available, otherwise use field, otherwise use colId
      let displayName = headerName || field || column.getColId();

      // Format the display name
      if (displayName && typeof displayName === "string") {
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      }

      return {
        text: displayName || "Column",
        bold: true,
        margin: [0, 12, 0, 0]
      };
    });

    // Add Currency column header if needed
    if (hasCurrencyColumn && exportCurrencyCode) {
      headerRow.push({
        text: "Currency",
        bold: true,
        margin: [0, 12, 0, 0]
      });
    }

    // Determine rows to export
    let rawRows = [];

    // Use the same row collection logic as CSV/XLSX exports
    rawRows = await collectAllRowsForExport(gridApi, { onlySelected, selectedIdSet });

    // Extract cell values for export from rawRows
    const rowsToExport = rawRows.map((data) => {
      const row = exportableColumns.map((column) => {
        const value = resolveValueFromData(data, column, gridApi);
        return { text: value != null ? String(value) : "" };
      });

      // Add Currency column value if needed
      if (hasCurrencyColumn && exportCurrencyCode) {
        row.push({ text: exportCurrencyCode });
      }

      return row;
    });
    getAdditionalExportCells(exportableColumns, onlySelected).forEach((cells) => {
      const row = cells.map((text) => ({ text }));
      if (hasCurrencyColumn && exportCurrencyCode) {
        row.push({ text: exportCurrencyCode });
      }
      rowsToExport.push(row);
    });

    // Calculate column count for widths array
    const columnCount =
      exportableColumns.length + (hasCurrencyColumn && exportCurrencyCode ? 1 : 0);

    // Create PDF document definition with improved styling
    const docDefinition = {
      pageOrientation: "landscape",
      pageMargins: [10, 10, 10, 10],
      defaultStyle: {
        fontSize: 10
      },
      content: [
        {
          table: {
            headerRows: 1,
            widths: Array(columnCount).fill("*"),
            body: [headerRow, ...rowsToExport],
            heights: (rowIndex) => (rowIndex === 0 ? 40 : 15)
          },
          layout: {
            fillColor: (rowIndex) => {
              if (rowIndex === 0) return "#f8f8f8"; // Header background
              return rowIndex % 2 === 0 ? "#fcfcfc" : "#fff"; // Alternating row colors
            },
            hLineColor: () => "#dde2eb",
            vLineColor: () => "#dde2eb"
          }
        }
      ]
    };

    // Generate and download PDF
    pdfMake
      .createPdf(docDefinition)
      .download(getExportFilename({ extension: "pdf", onlySelected }));
  };

  const effectiveRowCount = useMemo(() => {
    const clientCount = Array.isArray(rowData) ? rowData.length : 0;
    const liveGrid = typeof gridRowCount === "number" ? gridRowCount : 0;
    const serverTotal = typeof serverRowCount === "number" ? serverRowCount : 0;
    const lastKnown = typeof lastNonZeroRowCount === "number" ? lastNonZeroRowCount : 0;
    if (loading) {
      const maxCount = Math.max(serverTotal, liveGrid, lastKnown, clientCount);
      return maxCount;
    }

    const maxCount = Math.max(serverTotal, liveGrid, clientCount);
    return maxCount;
  }, [rowData, gridRowCount, serverRowCount, lastNonZeroRowCount, loading]);

  const limitExceeded = useMemo(() => {
    if (typeof limitThreshold !== "number" || limitThreshold <= 0) return false;
    if (effectiveRowCount <= 0) return false;
    return effectiveRowCount >= limitThreshold;
  }, [limitThreshold, effectiveRowCount]);

  // Hysteresis for warning visibility to avoid flicker
  useEffect(() => {
    const target = limitExceeded;
    if (limitVisibilityTimer.current) {
      clearTimeout(limitVisibilityTimer.current);
    }
    limitVisibilityTimer.current = setTimeout(() => {
      setLimitVisible(target);
      limitVisibilityTimer.current = null;
    }, 120);

    return () => {
      if (limitVisibilityTimer.current) {
        clearTimeout(limitVisibilityTimer.current);
        limitVisibilityTimer.current = null;
      }
    };
  }, [limitExceeded]);

  useEffect(() => {
    if (limitVisible) {
      setRenderLimitWarning(true);
      return undefined;
    }

    if (!renderLimitWarning) {
      return undefined;
    }

    const exitDelay =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
        ? 1
        : TABLE_WARNING_EXIT_MS;

    const timeoutId = setTimeout(() => {
      setRenderLimitWarning(false);
    }, exitDelay);

    return () => clearTimeout(timeoutId);
  }, [limitVisible, renderLimitWarning]);

  const limitedRowData = useMemo(() => {
    if (limitExceeded && typeof limitThreshold === "number" && limitThreshold > 0) {
      return Array.isArray(rowData) ? rowData.slice(0, limitThreshold) : rowData;
    }
    return rowData;
  }, [rowData, limitExceeded, limitThreshold]);

  const effectiveLimitWarning = useMemo(() => {
    if (renderLimitWarning) {
      return {
        title: i18n.t("ui.toolkit.table.limitWarningTitle"),
        description: i18n.t("ui.toolkit.table.limitWarningDescription")
      };
    }
    return null;
  }, [renderLimitWarning]);
  const isLimitWarningActive = limitVisible || renderLimitWarning;

  const getExportButtonText = useCallback(() => {
    if (hasCellRangeSelection || hasRowSelection) {
      return i18n.t("ui.toolkit.table.exportSelection");
    }
    return i18n.t("ui.toolkit.table.export");
  }, [hasCellRangeSelection, hasRowSelection]);

  const hasActiveSelection = hasCellRangeSelection || hasRowSelection;

  const getSelectionCount = useCallback(() => {
    if (hasCellRangeSelection && cellRangeSelectionCount > 0) {
      return cellRangeSelectionCount;
    }

    if (hasRowSelection && rowSelectionCount > 0) {
      return rowSelectionCount;
    }

    return null;
  }, [hasCellRangeSelection, cellRangeSelectionCount, hasRowSelection, rowSelectionCount]);

  const selectionCount = getSelectionCount();

  const selectionItemsLabel = useMemo(() => {
    if (selectionCount === null) {
      return "";
    }

    return hasCellRangeSelection
      ? i18n.t(selectionCount === 1 ? "ui.toolkit.table.cell" : "ui.toolkit.table.cell_plural")
      : i18n.t(selectionCount === 1 ? "ui.toolkit.table.row" : "ui.toolkit.table.row_plural");
  }, [hasCellRangeSelection, selectionCount]);

  const selectionMetricLabel =
    selectionItemsLabel.length > 0
      ? `${selectionItemsLabel.charAt(0).toUpperCase()}${selectionItemsLabel.slice(1)}`
      : "";

  const formatSelectionValue = useCallback(
    (value, decimalPlaces = 0) =>
      formatNumber(value, {
        thousandSeparator: " ",
        decimalPlaces,
        forceShowDecimals: false
      }),
    []
  );

  const selectionMetrics = useMemo(() => {
    if (selectionCount === null) {
      return [];
    }

    const metrics = [
      {
        key: "count",
        value: formatSelectionValue(selectionCount),
        label: selectionMetricLabel,
        ariaLabel: i18n.t("ui.toolkit.table.selectedItemsCount", {
          count: formatSelectionValue(selectionCount),
          items: selectionItemsLabel
        })
      }
    ];

    if (hasCellRangeSelection && selectedNumberCellsAverage !== null) {
      metrics.push({
        key: "average",
        value: formatSelectionValue(selectedNumberCellsAverage, 2),
        label: i18n.t("ui.toolkit.table.avg")
      });
    }

    if (hasCellRangeSelection && selectedNumberCellsSum !== null) {
      metrics.push({
        key: "sum",
        value: formatSelectionValue(selectedNumberCellsSum, 2),
        label: i18n.t("ui.toolkit.table.sum")
      });
    }

    return metrics;
  }, [
    formatSelectionValue,
    hasCellRangeSelection,
    selectionCount,
    selectionMetricLabel,
    selectionItemsLabel,
    selectedNumberCellsAverage,
    selectedNumberCellsSum
  ]);

  useEffect(() => {
    const selectionKind = hasCellRangeSelection ? "cell" : hasRowSelection ? "row" : null;
    const previousSelectionState = previousSelectionStateRef.current;

    if (!hasActiveSelection || selectionCount === null || !selectionKind) {
      previousSelectionStateRef.current = { active: false, kind: null };
      return;
    }

    if (!previousSelectionState.active || previousSelectionState.kind !== selectionKind) {
      announceSelectionMessage(
        i18n.t("ui.toolkit.table.selectionBarAnnouncement", {
          count: formatSelectionValue(selectionCount),
          items: selectionItemsLabel
        })
      );
    }

    previousSelectionStateRef.current = { active: true, kind: selectionKind };
  }, [
    announceSelectionMessage,
    formatSelectionValue,
    hasActiveSelection,
    hasCellRangeSelection,
    hasRowSelection,
    selectionCount,
    selectionItemsLabel
  ]);

  const isNumericSelectionColumn = useCallback((colDef = {}) => {
    const cellRenderer = colDef.cellRenderer;
    const cellRendererName = typeof cellRenderer === "function" ? cellRenderer.name : cellRenderer;
    const columnTypes = Array.isArray(colDef.type) ? colDef.type : [colDef.type].filter(Boolean);
    const fieldName = typeof colDef.field === "string" ? colDef.field.toLowerCase() : "";
    const headerName = typeof colDef.headerName === "string" ? colDef.headerName : "";

    const isKnownNumericRenderer =
      cellRendererName === "NumberCell" ||
      cellRendererName === "NumberCurrencyCell" ||
      cellRendererName === "StatsBadgeCell" ||
      (typeof cellRenderer === "object" &&
        (cellRenderer?.name === "NumberCell" ||
          cellRenderer?.name === "NumberCurrencyCell" ||
          cellRenderer?.name === "StatsBadgeCell"));

    const hasNumericAggregation = colDef.aggFunc === "sum" || colDef.aggFunc === "avg";
    const hasNumericType =
      columnTypes.includes("rightAligned") || columnTypes.includes("numericColumn");
    const hasNumericFieldHint =
      headerName.includes("%") ||
      [
        "amount",
        "average",
        "avg",
        "click",
        "commission",
        "count",
        "ctr",
        "delta",
        "epc",
        "number",
        "price",
        "rate",
        "revenue",
        "sum",
        "total",
        "value"
      ].some((token) => fieldName.includes(token));

    return isKnownNumericRenderer || hasNumericAggregation || hasNumericType || hasNumericFieldHint;
  }, []);

  const calculateNumberCellsSum = useCallback(() => {
    if (!gridApi || !hasCellRangeSelection) {
      setSelectedNumberCellsSum(null);
      setSelectedNumberCellsAverage(null);
      return;
    }

    try {
      const cellRanges = gridApi.getCellRanges();
      if (!cellRanges || cellRanges.length === 0) {
        setSelectedNumberCellsSum(null);
        setSelectedNumberCellsAverage(null);
        return;
      }

      let sum = 0;
      let count = 0;
      let hasNumberCells = false;

      cellRanges.forEach((range) => {
        if (!range.startRow || !range.endRow || !range.columns) return;

        if (
          !Number.isInteger(range.startRow.rowIndex) ||
          !Number.isInteger(range.endRow.rowIndex) ||
          !Array.isArray(range.columns)
        ) {
          return;
        }

        const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
        const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
        const rangeColumns = range.columns || [];

        rangeColumns.forEach((column) => {
          const colDef = column.getColDef();
          if (isNumericSelectionColumn(colDef)) {
            hasNumberCells = true;

            for (let rowIdx = startRowIndex; rowIdx <= endRowIndex; rowIdx++) {
              const rowNode = gridApi.getDisplayedRowAtIndex(rowIdx);
              if (rowNode && rowNode.data && !rowNode.rowPinned) {
                const value = resolveValueFromData(rowNode.data, column, gridApi);
                const numValue = typeof value === "number" ? value : parseFloat(value);
                if (!isNaN(numValue)) {
                  sum += numValue;
                  count++;
                }
              }
            }
          }
        });
      });

      if (hasNumberCells && count > 0) {
        setSelectedNumberCellsSum(sum);
        setSelectedNumberCellsAverage(sum / count);
      } else {
        setSelectedNumberCellsSum(null);
        setSelectedNumberCellsAverage(null);
      }
    } catch (error) {
      console.warn("Error calculating number cells sum and average:", error);
      setSelectedNumberCellsSum(null);
      setSelectedNumberCellsAverage(null);
    }
  }, [gridApi, hasCellRangeSelection, isNumericSelectionColumn]);

  useEffect(() => {
    calculateNumberCellsSum();
  }, [calculateNumberCellsSum, hasCellRangeSelection, cellRangeSelectionCount]);

  const renderExportPopover = useCallback(
    ({
      buttonNode,
      visible,
      onClose,
      popoverId,
      buttonRef,
      popoverClassName = styles.export_popover,
      buttonContainerClassName = styles.export_button_container
    }) => (
      <Tippy
        animation="fade"
        maxWidth="none"
        offset={[0, 4]}
        appendTo={getPopoverAppendTarget}
        interactive={true}
        visible={visible}
        placement="bottom-end"
        onClickOutside={onClose}
        content={
          <div id={popoverId} className={popoverClassName} tabIndex={-1}>
            <ListItemWrapper
              isMultiselect={false}
              onSelectionChange={(selection) => {
                if (selection.length > 0) {
                  const selectedText = selection[0];
                  if (selectedText.includes(".XLSX") || selectedText === ".XLSX") {
                    handleExportSelection("XLSX");
                  } else if (selectedText.includes(".CSV") || selectedText === ".CSV") {
                    handleExportSelection("CSV");
                  } else if (selectedText.includes(".PDF") || selectedText === ".PDF") {
                    handleExportSelection("PDF");
                  }
                }
              }}
              inFocus={visible}
              wrapper="export-popover-wrapper">
              <ListItem
                text=".XLSX"
                size="small"
                iconColor="var(--primary-blue-400)"
                iconRight={<Icons.Files.FileDownload03 width={16} height={16} />}
                hoverable={true}
              />
              <ListItem
                text=".CSV"
                size="small"
                iconColor="var(--primary-blue-400)"
                iconRight={<Icons.Files.FileDownload03 width={16} height={16} />}
                hoverable={true}
              />
              <ListItem
                text=".PDF"
                size="small"
                iconColor="var(--primary-blue-400)"
                iconRight={<Icons.Files.FileDownload03 width={16} height={16} />}
                hoverable={true}
              />
            </ListItemWrapper>
          </div>
        }>
        <div className={buttonContainerClassName} ref={buttonRef}>
          {buttonNode}
        </div>
      </Tippy>
    ),
    [getPopoverAppendTarget, handleExportSelection]
  );

  const effectiveAutoHeight = useAutoHeight && !forceNormalLayout;
  const showOverflowMenu = isNarrowViewport && (showEditTableButton || showExportButton);

  const handleOverflowToggle = () => {
    if (loading) return;
    setShowHeaderExportPopover(false);
    setIsOverflowOpen((current) => !current);
  };

  const handleOverflowEditTable = () => {
    closeOverflowMenu();
    handleColumnChooser();
  };

  const handleOverflowExport = () => {
    closeOverflowMenu();
    handleHeaderExportButtonClick();
  };

  const renderOverflowMenuContent = () => (
    <div id="table-overflow-popover" className={styles.overflow_menu} tabIndex={-1}>
      <ListItemWrapper
        isMultiselect={false}
        inFocus={isOverflowOpen}
        customClassName="table-overflow-list-item-wrapper"
        wrapper="table-overflow-list-wrapper"
        onSelectionChange={(selection) => {
          if (!selection.length) return;

          const selectedText = selection[0];
          if (selectedText === i18n.t("ui.toolkit.table.editTable")) {
            handleOverflowEditTable();
          } else if (selectedText === i18n.t("ui.toolkit.table.export")) {
            handleOverflowExport();
          }
        }}>
        {showEditTableButton && (
          <ListItem
            text={i18n.t("ui.toolkit.table.editTable")}
            size="large"
            iconLeft={<Icons.General.Edit03 width={16} height={16} />}
            hoverable={true}
          />
        )}
        {showExportButton && (
          <ListItem
            text={i18n.t("ui.toolkit.table.export")}
            size="large"
            iconLeft={<Icons.Files.FileDownload03 width={16} height={16} />}
            hoverable={true}
          />
        )}
      </ListItemWrapper>
    </div>
  );

  const renderOverflowTriggerButton = () => (
    <Button
      text=""
      size="small"
      type="ghost"
      iconRight={<Icons.General.DotsVertical width={16} height={16} />}
      onClick={handleOverflowToggle}
      className={clsx(isOverflowOpen && "active")}
      disabled={loading}
    />
  );

  const renderOverflowToolbarActions = () => (
    <>
      {showSubscribeButton && (
        <Button
          text={i18n.t("ui.toolkit.table.subscribe")}
          size="small"
          type="peach"
          iconRight={<Icons.Communication.Mail01 width={16} height={16} />}
          onClick={() => {
            if (!loading) {
              setIsSubscribeOpen(true);
            }
          }}
          disabled={loading}
        />
      )}
      {showOverflowMenu &&
        (showHeaderExportPopover && showExportButton ? (
          renderExportPopover({
            buttonNode: renderOverflowTriggerButton(),
            visible: showHeaderExportPopover,
            onClose: () => setShowHeaderExportPopover(false),
            popoverId: "header-export-popover",
            buttonRef: overflowButtonRef,
            buttonContainerClassName: styles.overflow_button_container
          })
        ) : isMobile ? (
          <>
            <div ref={overflowButtonRef} className={styles.overflow_button_container}>
              {renderOverflowTriggerButton()}
            </div>
            <Modal
              isOpen={isOverflowOpen}
              onClose={closeOverflowMenu}
              onOutsideClick={closeOverflowMenu}
              dismissible={true}
              showCloseButton={true}
              title={i18n.t("ui.toolkit.table.moreActions")}
              className={styles.overflow_modal}>
              {renderOverflowMenuContent()}
            </Modal>
          </>
        ) : (
          <Tippy
            animation="fade"
            maxWidth="none"
            offset={[0, 4]}
            appendTo={getPopoverAppendTarget}
            interactive={true}
            visible={isOverflowOpen}
            placement="bottom-end"
            onClickOutside={closeOverflowMenu}
            content={renderOverflowMenuContent()}>
            <div ref={overflowButtonRef} className={styles.overflow_button_container}>
              {renderOverflowTriggerButton()}
            </div>
          </Tippy>
        ))}
      {showEditTableButton && isNarrowViewport && (
        <Modal
          isOpen={isColumnChooserOpen}
          onClose={closeColumnChooser}
          onOutsideClick={closeColumnChooser}
          dismissible={true}
          showCloseButton={true}
          className={styles.column_chooser_modal}>
          {renderColumnChooser()}
        </Modal>
      )}
    </>
  );

  const tableContent = (
    <>
      {effectiveLimitWarning && (
        <div
          className={styles.limit_warning_panel}
          data-state={limitVisible ? "entered" : "exiting"}>
          <div className={styles.limit_warning_icon}>
            <Icons.Alert.OctagonFilled width={24} height={24} />
          </div>
          <div className={styles.limit_warning_content}>
            <span className={styles.limit_warning_title}>{effectiveLimitWarning.title}</span>
            {effectiveLimitWarning.description && (
              <span className={styles.limit_warning_description}>
                {effectiveLimitWarning.description}
              </span>
            )}
          </div>
        </div>
      )}
      {showToolbar && (
        <div className={styles.header}>
          <div className={styles.header_title}>
            {title != null && <p>{effectiveTitle}</p>}
            {titleItems != null ? titleItems : title == null ? <p>{effectiveTitle}</p> : null}
            {hasActiveFilters && (
              <div className={styles.header_active_filters}>
                {activeFilters.map((filter) => {
                  if (!filter?.id || !filter?.text) {
                    return null;
                  }

                  if (typeof onActiveFilterRemove !== "function") {
                    return <Tag key={filter.id} text={filter.text} iconLeft={filter.iconLeft} />;
                  }

                  return (
                    <Chip
                      key={filter.id}
                      id={filter.id}
                      text={filter.text}
                      iconLeft={filter.iconLeft}
                      iconLeftFlexible={Boolean(filter.iconLeftFlexible)}
                      iconRight={filter.iconRight}
                      size={filter.size || "small"}
                      active={Boolean(filter.active)}
                      onClose={() => handleActiveFilterRemove(filter)}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div className={styles.table_helpers}>
            {showResultCount && (
              <Tippy
                disabled={!isLimitWarningActive}
                animation="fade"
                appendTo={getPopoverAppendTarget}
                content={
                  <div style={{ maxWidth: 300 }}>{i18n.t("ui.toolkit.table.limitPartialData")}</div>
                }>
                <span
                  style={{
                    display: "inline-block",
                    ...(isLimitWarningActive && { cursor: "help" })
                  }}>
                  <PlaceholderSkeleton
                    isLoading={
                      loading || (infiniteScroll && effectiveRowCount === 0 && !lastNonZeroRowCount)
                    }
                    width="80px"
                    initialHeight="1.125rem">
                    <Tag
                      text={(() => {
                        const fmt = (n) =>
                          formatNumber(n, {
                            thousandSeparator: " ",
                            decimalPlaces: 0,
                            forceShowDecimals: false
                          });
                        if (isLimitWarningActive) {
                          return resultCountLabel
                            ? `${fmt(limitThreshold)} ${resultCountLabel}`
                            : i18n.t(
                                limitThreshold === 1
                                  ? "ui.toolkit.table.resultsCount_one"
                                  : "ui.toolkit.table.resultsCount",
                                { count: fmt(limitThreshold) }
                              );
                        }
                        if (effectiveRowCount === 0) {
                          return i18n.t("ui.toolkit.table.noResults");
                        }
                        return resultCountLabel
                          ? `${fmt(effectiveRowCount)} ${resultCountLabel}`
                          : i18n.t(
                              effectiveRowCount === 1
                                ? "ui.toolkit.table.resultsCount_one"
                                : "ui.toolkit.table.resultsCount",
                              { count: fmt(effectiveRowCount) }
                            );
                      })()}
                      iconLeft={isLimitWarningActive ? <Icons.Alert.OctagonFilled /> : undefined}
                    />
                  </PlaceholderSkeleton>
                </span>
              </Tippy>
            )}
            {helperItems && <div className={styles.helper_items}>{helperItems}</div>}
            {isNarrowViewport ? (
              renderOverflowToolbarActions()
            ) : (
              <>
                {showEditTableButton && (
                  <Tippy
                    animation="fade"
                    maxWidth="none"
                    offset={[0, 4]}
                    appendTo={getPopoverAppendTarget}
                    interactive={true}
                    visible={isColumnChooserOpen}
                    placement="bottom-end"
                    onClickOutside={closeColumnChooser}
                    content={renderColumnChooser()}>
                    <div ref={editTableButtonRef} className={styles.edit_table_button_container}>
                      <Button
                        text={i18n.t("ui.toolkit.table.editTable")}
                        size="small"
                        type="ghost"
                        iconRight={<Icons.General.Edit03 width={16} height={16} />}
                        onClick={handleColumnChooser}
                        className={clsx(isColumnChooserOpen && "active")}
                        disabled={loading}
                      />
                    </div>
                  </Tippy>
                )}
                {showFullscreenButton && (
                  <Button
                    text={
                      isFullscreen
                        ? i18n.t("ui.toolkit.table.exitFullscreen")
                        : i18n.t("ui.toolkit.table.viewFullscreen")
                    }
                    size="small"
                    type="ghost"
                    iconRight={
                      isFullscreen ? (
                        <Icons.General.XClose strokeWidth="2.23" width={16} height={16} />
                      ) : (
                        <Icons.Arrow.Expand01 width={16} height={16} />
                      )
                    }
                    onClick={handleFullscreen}
                  />
                )}
                {showSubscribeButton && (
                  <Button
                    text={i18n.t("ui.toolkit.table.subscribe")}
                    size="small"
                    type="peach"
                    iconRight={<Icons.Communication.Mail01 width={16} height={16} />}
                    onClick={() => {
                      if (!loading) {
                        setIsSubscribeOpen(true);
                      }
                    }}
                    disabled={loading}
                  />
                )}
                {showExportButton &&
                  renderExportPopover({
                    buttonNode: (
                      <Button
                        text={i18n.t("ui.toolkit.table.export")}
                        size="small"
                        type="ghost"
                        iconRight={<Icons.General.DotsVertical width={16} height={16} />}
                        onClick={handleHeaderExportButtonClick}
                        className={clsx(showHeaderExportPopover && "active")}
                        disabled={loading}
                      />
                    ),
                    visible: showHeaderExportPopover,
                    onClose: () => setShowHeaderExportPopover(false),
                    popoverId: "header-export-popover",
                    buttonRef: headerExportButtonRef
                  })}
              </>
            )}
          </div>
        </div>
      )}
      <div className={styles.table_container} ref={tableContainerRef}>
        <Table
          size={appliedSize}
          rowData={limitedRowData}
          colDefs={colDefs}
          loading={loading}
          noDataText={noDataText}
          noRowsOverlayProps={noRowsOverlayProps}
          onRowCountChange={handleRowCountChange}
          onGridApiReady={(params) => {
            setGridApi(params?.api ?? null);
            if (selectionRestorePendingRef.current) {
              restoreSelectionSnapshot(params?.api ?? null);
            }
            onGridApiReadyProp?.(params);
          }}
          showFooter={showFooter}
          showColumnHeaders={showColumnHeaders}
          ariaLabel={effectiveAriaLabel}
          showRowSelection={showRowSelection}
          // SSRM props
          infiniteScroll={infiniteScroll}
          loadRows={loadRows}
          pinnedBottomRowData={pinnedBottomRowData}
          blockSize={blockSize}
          maxBlocksInCache={maxBlocksInCache}
          maxConcurrentDatasourceRequests={maxConcurrentDatasourceRequests}
          blockLoadDebounceMillis={blockLoadDebounceMillis}
          suppressServerSideInfiniteScroll={suppressServerSideInfiniteScroll}
          getRowId={getRowId}
          // pagination
          pagination={pagination}
          paginationPageSize={paginationPageSize}
          paginationPageSizeSelector={paginationPageSizeSelector}
          isFullscreen={isFullscreen}
          useAutoHeight={effectiveAutoHeight}
          forceNormalLayout={forceNormalLayout}
          onRangeSelectionChanged={handleRangeSelectionChanged}
          onRangeSelectionTrimmed={handleRangeSelectionTrimmed}
          cellSelection={effectiveCellSelection}
          rowClassRules={rowClassRules}
          onCellMouseOver={onCellMouseOver}
          onCellMouseOut={onCellMouseOut}
          onSetColumnPinned={handleSetColumnPinned}
          onHideColumn={showEditTableButton ? handleHideColumn : undefined}
          onAutoSizeColumn={handleAutoSizeColumn}
          getPopoverAppendTarget={getPopoverAppendTarget}
          tableId={tableId}
        />
      </div>
    </>
  );

  const selectionBarAriaLabel = i18n.t("ui.toolkit.table.selectedItemsCount", {
    count: formatSelectionValue(selectionCount ?? 0),
    items: selectionItemsLabel
  });

  const selectionActionsContext = useMemo(
    () => ({
      selectedRows: gridApi?.getSelectedRows?.() ?? [],
      selectedRowIds: Array.from(selectedIdRef.current ?? []),
      selectionCount: selectionCount ?? 0,
      clearSelection: clearCurrentSelection
    }),
    [gridApi, selectionCount, clearCurrentSelection]
  );

  const selectionBarContent =
    !isMobile && hasActiveSelection ? (
      <TableSelectionBar
        ariaLabel={selectionBarAriaLabel}
        metrics={selectionMetrics}
        shellStyle={
          !isFullscreen && desktopSelectionBarBounds
            ? {
                left: `${desktopSelectionBarBounds.left}px`,
                width: `${desktopSelectionBarBounds.width}px`,
                right: "auto",
                padding: 0
              }
            : undefined
        }
        renderExportButton={(selectionBarStyles) =>
          renderExportPopover({
            buttonNode: (
              <Button
                text={getExportButtonText()}
                type="primary"
                iconRight={<Icons.Files.FileDownload03 width={16} height={16} />}
                onClick={handleSelectionExportButtonClick}
                className={clsx(
                  selectionBarStyles.selection_export_button,
                  showSelectionExportPopover && "active"
                )}
                disabled={loading}
              />
            ),
            visible: showSelectionExportPopover,
            onClose: () => setShowSelectionExportPopover(false),
            popoverId: "selection-export-popover",
            buttonRef: selectionExportButtonRef,
            popoverClassName: selectionBarStyles.export_popover,
            buttonContainerClassName: selectionBarStyles.export_button_container
          })
        }
        showSwitchToRows={hasCellRangeSelection}
        onCopy={handleCopySelection}
        onSwitchToRows={handleSwitchToRowSelection}
        onClear={clearCurrentSelection}
        loading={loading}
        customActions={renderSelectionActions}
        customActionsContext={selectionActionsContext}
      />
    ) : null;

  const fullscreenSelectionBarContent =
    isFullscreen && selectionBarContent && fullscreenSelectionBarPortalTarget
      ? createPortal(selectionBarContent, fullscreenSelectionBarPortalTarget)
      : null;

  if (isFullscreen) {
    return (
      <>
        <Modal
          id="table-fullscreen-modal"
          // title={typeof title === "string" ? title : "Table Fullscreen"}
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          onOutsideClick={() => setIsFullscreen(false)}
          showCloseButton={true}
          dismissible={true}
          maxWidth="95vw"
          minWidth="95vw"
          className={clsx(
            styles.fullscreen_modal_content,
            effectiveAutoHeight && styles.fullscreen_modal_autoheight
          )}>
          <div
            className={clsx(styles.table_wrapper, wrapperClassName)}
            data-has-multi-cell-range={hasCellRangeSelection ? "true" : undefined}
            ref={tableWrapperRef}>
            <div
              className={styles.selection_status_announcement}
              role="status"
              aria-live="polite"
              aria-atomic="true">
              {selectionAnnouncement}
            </div>
            {fullscreenTopContent && (
              <div data-table-fullscreen-top style={{ display: "grid", gap: 8, marginBottom: 8 }}>
                {fullscreenTopContent}
              </div>
            )}
            {tableContent}
            <SubscribeModal
              onSubmit={onSubscribeSubmit}
              isOpen={isSubscribeOpen}
              onClose={() => setIsSubscribeOpen(false)}
              tableName={typeof title === "string" ? title : undefined}
              subscribeReportName={subscribeReportName}
              activeFilters={activeFilters}
              currencyCode={subscribeCurrencyCode}
              dateRangeConfig={subscribeDateRangeConfig}
              defaultRecipients={subscribeDefaultRecipients}
              modalVariant="default"
            />
          </div>
        </Modal>
        {fullscreenSelectionBarContent}
      </>
    );
  }

  return (
    <div
      className={clsx(styles.table_wrapper, wrapperClassName)}
      data-has-multi-cell-range={hasCellRangeSelection ? "true" : undefined}
      ref={tableWrapperRef}>
      <div
        className={styles.selection_status_announcement}
        role="status"
        aria-live="polite"
        aria-atomic="true">
        {selectionAnnouncement}
      </div>
      {tableContent}
      {selectionBarContent}
      <SubscribeModal
        onSubmit={onSubscribeSubmit}
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
        tableName={typeof title === "string" ? title : undefined}
        subscribeReportName={subscribeReportName}
        activeFilters={activeFilters}
        currencyCode={subscribeCurrencyCode}
        dateRangeConfig={subscribeDateRangeConfig}
        defaultRecipients={subscribeDefaultRecipients}
      />
    </div>
  );
};
