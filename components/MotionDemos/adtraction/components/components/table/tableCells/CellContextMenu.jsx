import React, { useCallback, useEffect, useMemo, useState } from "react";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import { Icons } from "@adtraction/ui-icons";
import { writeToClipboard } from "@adtraction/util-clipboard";
import { ListItem } from "../../../tokens/listItem/ListItem";
import { ListItemWrapper } from "../../../tokens/listItem/ListItemWrapper";
import { Toaster } from "../../../tokens/toaster/Toaster";
import styles from "./TableCells.module.scss";

const getColumnName = (params = {}) =>
  params.colDef?.headerName || params.column?.getColDef?.()?.headerName || params.colDef?.field || "";

const getStringValue = (value) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2)).toString();
  }

  return String(value);
};

const getColumnId = (column) => {
  if (!column) {
    return "";
  }

  return column.getColId?.() || column.colId || column.getColDef?.()?.field || "";
};

const getCellValue = ({ api, column, rowNode }) => {
  const colDef = column?.getColDef?.() || {};
  const field = colDef.field;

  if (typeof colDef.valueGetter === "function") {
    try {
      return colDef.valueGetter({
        data: rowNode?.data,
        node: rowNode,
        colDef,
        column,
        api
      });
    } catch {
      return field ? rowNode?.data?.[field] : "";
    }
  }

  return field ? rowNode?.data?.[field] : "";
};

const getCellRanges = (api) => {
  try {
    return api?.getCellRanges?.() || [];
  } catch {
    return [];
  }
};

const isMultiCellRange = (range) => {
  if (!range?.startRow || !range?.endRow || !Array.isArray(range.columns)) {
    return false;
  }

  const rowSpan = Math.abs(range.endRow.rowIndex - range.startRow.rowIndex) + 1;
  return rowSpan * range.columns.length > 1;
};

const isCellInsideRange = (params = {}) => {
  if (!Number.isInteger(params.node?.rowIndex) || params.node?.rowPinned) {
    return false;
  }

  const clickedColumnId = getColumnId(params.column);
  if (!clickedColumnId) {
    return false;
  }

  return getCellRanges(params.api).some((range) => {
    if (!isMultiCellRange(range)) {
      return false;
    }

    if (range.startRow.rowPinned || range.endRow.rowPinned) {
      return false;
    }

    const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
    const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
    const isSelectedRow =
      params.node.rowIndex >= startRowIndex && params.node.rowIndex <= endRowIndex;
    const isSelectedColumn = range.columns.some((column) => getColumnId(column) === clickedColumnId);

    return isSelectedRow && isSelectedColumn;
  });
};

const getSelectedRangeText = (api) => {
  const rows = [];

  getCellRanges(api).forEach((range) => {
    if (!range?.startRow || !range?.endRow || !Array.isArray(range.columns)) {
      return;
    }

    if (range.startRow.rowPinned || range.endRow.rowPinned) {
      return;
    }

    const startRowIndex = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
    const endRowIndex = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);
    const columns = range.columns.filter((column) => column?.getColDef?.()?.field);

    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      const rowNode = api?.getDisplayedRowAtIndex?.(rowIndex);
      if (!rowNode || rowNode.rowPinned) {
        continue;
      }

      rows.push(
        columns
          .map((column) => getStringValue(getCellValue({ api, column, rowNode })))
          .join("\t")
      );
    }
  });

  return rows.join("\n");
};

export const CellContextMenu = ({ children, params, value }) => {
  const copyValue = getStringValue(value);
  const columnName = getColumnName(params);
  const enabled = params?.colDef?.enableCopyContextMenu !== false && copyValue !== "";
  const [isOpen, setIsOpen] = useState(false);
  const [showCopySelection, setShowCopySelection] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const referenceRect = useMemo(
    () => ({
      width: 0,
      height: 0,
      x: position.x,
      y: position.y,
      top: position.y,
      bottom: position.y,
      left: position.x,
      right: position.x
    }),
    [position]
  );

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [closeMenu, isOpen]);

  const handleContextMenu = (event) => {
    if (!enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setShowCopySelection(isCellInsideRange(params));
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  const handleCopy = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    closeMenu();

    try {
      await writeToClipboard(copyValue);
      Toaster.trigger({
        type: "info",
        title: i18n.t("ui.toolkit.table.contextMenu.copied"),
        autoDismiss: true,
        autoDismissTime: 3000
      });
    } catch {
      Toaster.trigger({
        type: "error",
        title: i18n.t("ui.toolkit.table.contextMenu.copyFailed"),
        autoDismiss: true,
        autoDismissTime: 4000
      });
    }
  };

  const handleCopySelection = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    closeMenu();

    try {
      const selectedText = getSelectedRangeText(params?.api);
      if (!selectedText) {
        return;
      }

      await writeToClipboard(selectedText);
      Toaster.trigger({
        type: "info",
        title: i18n.t("ui.toolkit.table.contextMenu.copied"),
        autoDismiss: true,
        autoDismissTime: 3000
      });
    } catch {
      Toaster.trigger({
        type: "error",
        title: i18n.t("ui.toolkit.table.contextMenu.copyFailed"),
        autoDismiss: true,
        autoDismissTime: 4000
      });
    }
  };

  const content = (
    <div className={styles.cell_context_menu} onContextMenu={(event) => event.preventDefault()}>
      <ListItemWrapper
        customClassName={styles.cell_context_menu_items}
        inFocus={isOpen}
        enableAnimation={false}>
        {showCopySelection && (
          <ListItem
            size="small"
            text={i18n.t("ui.toolkit.table.copySelection")}
            iconLeft={<Icons.General.Copy01 />}
            onClick={handleCopySelection}
          />
        )}
        <ListItem
          size="small"
          text={copyValue}
          description={i18n.t("ui.toolkit.table.contextMenu.copy", { column: columnName })}
          iconLeft={<Icons.General.Copy01 />}
          onClick={handleCopy}
        />
      </ListItemWrapper>
    </div>
  );

  if (!enabled) {
    return children;
  }

  return (
    <Tippy
      content={content}
      visible={isOpen}
      interactive={true}
      trigger="manual"
      theme="context_menu"
      maxWidth="none"
      placement="bottom-start"
      appendTo={() => document.body}
      getReferenceClientRect={() => referenceRect}
      onClickOutside={closeMenu}>
      {React.cloneElement(children, {
        onContextMenu: handleContextMenu
      })}
    </Tippy>
  );
};
