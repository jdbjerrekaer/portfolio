import React, { useState, useEffect, useMemo } from "react";
import Tippy from "@tippyjs/react";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import { ListItem } from "../../tokens/listItem/ListItem";
import { ListItemWrapper } from "../../tokens/listItem/ListItemWrapper";
import styles from "./CustomHeader.module.scss";

export const CustomHeader = (props) => {
  const COMPARE_METRIC_PREFIX = "compare_";
  const DELTA_METRIC_PREFIX = "delta_";
  const COMPARE_HEADER_FIELD = "compareHeader";
  // Keep behavior and visuals aligned: if sortable is disabled, header must not trigger sorting.
  const sortable =
    (props.sortable ?? props.enableSorting) !== false &&
    props.column.getColDef().sortable !== false;
  const showSortIcon = sortable;
  const size = props.size || "default";
  const alignmentClass = props.alignmentClass || "leftAligned";

  const [ascSort, setAscSort] = useState("inactive");
  const [descSort, setDescSort] = useState("inactive");
  const [isHovered, setIsHovered] = useState(false);
  const [currentSortState, setCurrentSortState] = useState(props.column.getSort());
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const colDef = props.column.getColDef();
  const colId = props.column.getColId?.();
  const currentPinned = props.column.getPinned?.() || null;
  const isComparePairColumn =
    typeof colId === "string" &&
    colId.startsWith(COMPARE_METRIC_PREFIX) &&
    (colDef.field === colId || colDef.field === COMPARE_HEADER_FIELD);
  const isDeltaPairColumn = typeof colId === "string" && colId.startsWith(DELTA_METRIC_PREFIX);
  const canPinColumn =
    typeof props.onSetColumnPinned === "function" &&
    typeof props.column.getColId === "function" &&
    !isDeltaPairColumn;
  const canHideColumn =
    typeof props.onHideColumn === "function" &&
    Boolean(colDef.field) &&
    colDef.field !== "ag-Grid-AutoColumn" &&
    (colDef.showInColumnChooser !== false || isComparePairColumn || isDeltaPairColumn);
  const canAutoSizeColumn =
    typeof props.onAutoSizeColumn === "function" &&
    typeof props.column.getColId === "function" &&
    colDef.resizable !== false &&
    colId !== "ag-Grid-AutoColumn";
  const canOpenContextMenu = canPinColumn || canHideColumn || canAutoSizeColumn;

  props.column.addEventListener("columnHeaderClicked", function () {
    // get sort state from column
    onSortChanged();
  });

  const onSortChanged = () => {
    const sort = props.column.getSort();
    setCurrentSortState(sort);
    setAscSort(sort === "asc" ? "active" : "inactive");
    setDescSort(sort === "desc" ? "active" : "inactive");
  };

  const onSortRequested = (order, event) => {
    if (!sortable) return;
    event.stopPropagation();
    props.setSort(order, event.shiftKey);
  };

  const getTranslatedLabel = (key) => {
    const translation = i18n.t(key, { name: props.displayName });
    if (!translation.includes(props.displayName)) {
      return translation;
    }
    const parts = translation.split(props.displayName);
    return (
      <>
        {parts[0]}
        <span className={styles.tooltipDisplayName}>{props.displayName}</span>
        {parts[1]}
      </>
    );
  };

  const getSortTooltip = () => {
    return (
      <span className={`${styles.tooltipContent} ${styles.tooltipAnimated}`} key={currentSortState}>
        {currentSortState === "asc" && (
          <span className={styles.tooltipRow}>
            <Icons.Arrow.ArrowsDown height="0.875rem" width="0.875rem" color="currentColor" />
            <span>{getTranslatedLabel("ui.toolkit.table.sortDescending")}</span>
          </span>
        )}
        {currentSortState === "desc" && (
          <span className={styles.tooltipRow}>
            <Icons.General.X height="0.875rem" width="0.875rem" color="currentColor" />
            <span>{getTranslatedLabel("ui.toolkit.table.clearSort")}</span>
          </span>
        )}
        {!currentSortState && (
          <span className={styles.tooltipRow}>
            <Icons.Arrow.ArrowsUp height="0.875rem" width="0.875rem" color="currentColor" />
            <span>{getTranslatedLabel("ui.toolkit.table.sortAscending")}</span>
          </span>
        )}
      </span>
    );
  };

  useEffect(() => {
    props.column.addEventListener("sortChanged", onSortChanged);
    onSortChanged();

    return () => {
      props.column.removeEventListener("sortChanged", onSortChanged);
    };
  }, []);

  useEffect(() => {
    if (!isContextMenuOpen || typeof document === "undefined") {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsContextMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isContextMenuOpen]);

  const closeContextMenu = () => {
    setIsContextMenuOpen(false);
  };

  const resolvePopoverAppendTarget =
    props.getPopoverAppendTarget ||
    (() => (typeof document !== "undefined" ? document.body : undefined));

  const handleSetPinned = (pinned) => {
    props.onSetColumnPinned?.(props.column.getColId(), pinned || null);
    closeContextMenu();
  };

  const handleHideColumn = () => {
    props.onHideColumn?.(props.column.getColId());
    closeContextMenu();
  };

  const handleAutoSizeColumn = () => {
    props.onAutoSizeColumn?.(props.column.getColId());
    closeContextMenu();
  };

  const contextMenuItems = useMemo(() => {
    const columnSpecificItems = [];
    const genericItems = [];

    if (canHideColumn) {
      columnSpecificItems.push({
        key: "hide-column",
        label: isDeltaPairColumn
          ? "Hide delta columns"
          : props.displayName
            ? `Hide ${props.displayName}`
            : "Hide column",
        icon: <Icons.General.EyeOff />,
        action: "hide"
      });
    }

    if (canAutoSizeColumn) {
      genericItems.push({
        key: "auto-size-column",
        label: "Auto size column",
        icon: <Icons.Arrow.Expand01 />,
        action: "auto-size"
      });
    }

    if (canPinColumn) {
      if (currentPinned === "left") {
        genericItems.push(
          {
            key: "unpin",
            label: "Unpin column",
            icon: <Icons.General.Pin01 />
          },
          {
            key: "pin-right",
            label: "Pin right",
            icon: <Icons.General.Pin02 />,
            pinned: "right"
          }
        );
      } else if (currentPinned === "right") {
        genericItems.push(
          {
            key: "pin-left",
            label: "Pin left",
            icon: <Icons.General.Pin02 />,
            pinned: "left"
          },
          {
            key: "unpin",
            label: "Unpin column",
            icon: <Icons.General.Pin01 />
          }
        );
      } else {
        genericItems.push(
          {
            key: "pin-left",
            label: "Pin left",
            icon: <Icons.General.Pin02 />,
            pinned: "left"
          },
          {
            key: "pin-right",
            label: "Pin right",
            icon: <Icons.General.Pin02 />,
            pinned: "right"
          }
        );
      }
    }

    return [...columnSpecificItems, ...genericItems];
  }, [
    canAutoSizeColumn,
    canHideColumn,
    canPinColumn,
    currentPinned,
    isDeltaPairColumn,
    props.displayName
  ]);

  const handleContextMenuItemClick = (item) => {
    if (item.action === "auto-size") {
      handleAutoSizeColumn();
      return;
    }

    if (item.action === "hide") {
      handleHideColumn();
      return;
    }

    handleSetPinned(item.pinned);
  };

  // Enhanced sort icon rendering with hover hints
  const renderSortIcon = () => {
    if (!showSortIcon) return null;

    const currentSort = props.column.getSort();

    // Show ascending arrow hint on hover if not currently sorted
    const shouldShowHoverHint = isHovered && !currentSort;
    const ascendingOpacity = currentSort === "asc" ? 1 : shouldShowHoverHint ? 0.8 : 0;
    const descendingOpacity = currentSort === "desc" ? 1 : 0;

    return (
      <div className="sort-icon-container">
        {/* Ascending sort arrow - show on hover (unsorted) or when actively sorted ascending */}
        {(shouldShowHoverHint || currentSort === "asc") && (
          <div
            onClick={(event) => onSortRequested("asc", event)}
            onTouchEnd={(event) => onSortRequested("asc", event)}
            className={`customSortDownLabel ${ascSort}`}
            style={{
              position: "absolute",
              top: "50%",
              right: "4px",
              transform: "translateY(-50%)",
              opacity: ascendingOpacity,
              transition: "opacity 0.2s ease",
              cursor: "pointer",
              display: "block",
              zIndex: 10
            }}>
            <svg
              width="5"
              height="8"
              viewBox="0 0 5 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g id="Sorting-selector">
                <path
                  id="Vector"
                  opacity="0.5"
                  d="M2.14685 7.55943L0.147687 5.68521C0.00399733 5.5505 -0.0381726 5.3499 0.0399198 5.17419C0.118012 4.99849 0.299187 4.88428 0.502227 4.88428H4.499C4.70048 4.88428 4.88321 4.99849 4.96131 5.17419C5.0394 5.3499 4.99567 5.5505 4.85354 5.68521L2.85437 7.55943C2.65914 7.74246 2.34208 7.74246 2.14685 7.55943Z"
                  fill="#666666"
                />
                <path
                  id="Vector_2"
                  d="M2.14685 0.440495C2.34208 0.257465 2.65914 0.257465 2.85437 0.440495L4.85353 2.31471C4.99722 2.44942 5.03939 2.65002 4.9613 2.82573C4.88321 3.00144 4.70203 3.11565 4.49899 3.11565H0.500661C0.299183 3.11565 0.116446 3.00144 0.0383538 2.82573C-0.0397386 2.65002 0.00399317 2.44942 0.146121 2.31471L2.14529 0.440495H2.14685Z"
                  fill="#666666"
                />
              </g>
            </svg>
          </div>
        )}

        {/* Descending sort arrow - only show when actively sorted descending */}
        {currentSort === "desc" && (
          <div
            onClick={(event) => onSortRequested("desc", event)}
            onTouchEnd={(event) => onSortRequested("desc", event)}
            className={`customSortUpLabel ${descSort}`}
            style={{
              position: "absolute",
              top: "50%",
              right: "4px",
              transform: "translateY(-50%)",
              opacity: descendingOpacity,
              transition: "opacity 0.2s ease",
              cursor: "pointer",
              display: "block",
              zIndex: 10
            }}>
            <svg
              width="5"
              height="8"
              viewBox="0 0 5 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g id="Sorting-selector">
                <path
                  id="Vector"
                  d="M2.14685 7.55943L0.147687 5.68521C0.00399733 5.5505 -0.0381726 5.3499 0.0399198 5.17419C0.118012 4.99849 0.299187 4.88428 0.502227 4.88428H4.499C4.70048 4.88428 4.88321 4.99849 4.96131 5.17419C5.0394 5.3499 4.99567 5.5505 4.85354 5.68521L2.85437 7.55943C2.65914 7.74246 2.34208 7.74246 2.14685 7.55943Z"
                  fill="#666666"
                />
                <path
                  id="Vector_2"
                  opacity="0.5"
                  d="M2.14685 0.440495C2.34208 0.257465 2.65914 0.257465 2.85437 0.440495L4.85353 2.31471C4.99722 2.44942 5.03939 2.65002 4.9613 2.82573C4.88321 3.00144 4.70203 3.11565 4.49899 3.11565H0.500661C0.299183 3.11565 0.116446 3.00144 0.0383538 2.82573C-0.0397386 2.65002 0.00399317 2.44942 0.146121 2.31471L2.14529 0.440495H2.14685Z"
                  fill="#666666"
                />
              </g>
            </svg>
          </div>
        )}
      </div>
    );
  };

  const onHeaderClicked = (event) => {
    if (isContextMenuOpen) {
      closeContextMenu();
    }

    if (!sortable) return;

    // If click was on sort icon, let that handle it
    if (event.target.closest(".sort-icon") || event.target.closest(".sort-icon-container")) {
      return;
    }

    // Otherwise, cycle through sort states: none -> asc -> desc -> none
    const currentSort = props.column.getSort();
    let nextSort = "asc";
    if (currentSort === "asc") {
      nextSort = "desc";
    } else if (currentSort === "desc") {
      nextSort = null;
    }

    props.setSort(nextSort, event.shiftKey);
  };

  const onHeaderContextMenu = (event) => {
    if (!canOpenContextMenu) return;

    event.preventDefault();
    event.stopPropagation();
    setIsContextMenuOpen(true);
  };

  const contextMenuContent = (
    <div className="table-header-context-menu" onContextMenu={(event) => event.preventDefault()}>
      <ListItemWrapper
        customClassName="table-header-context-menu-items"
        inFocus={isContextMenuOpen}
        enableAnimation={false}>
        {contextMenuItems.map((item) => (
          <ListItem
            key={item.key}
            size="small"
            text={item.label}
            iconLeft={item.icon}
            onClick={() => handleContextMenuItemClick(item)}
          />
        ))}
      </ListItemWrapper>
    </div>
  );

  const renderHeaderIcon = () => {
    if (!props.column.getColDef().icon) return null;

    return <div className="icon-container">{props.column.getColDef().icon}</div>;
  };

  const inlineHeaderIconWithText = Boolean(props.column.getColDef().inlineHeaderIconWithText);

  const headerContent = (
    <div
      className={[
        "custom-header",
        size,
        alignmentClass,
        inlineHeaderIconWithText ? "inline-header-icon-with-text" : null
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onHeaderClicked}
      onContextMenu={onHeaderContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: showSortIcon ? "pointer" : "default" }}>
      {!inlineHeaderIconWithText && renderHeaderIcon()}
      <div className="header-text-container">
        <div className="header-text-with-sort">
          {inlineHeaderIconWithText && renderHeaderIcon()}
          <span className="header-text">{props.displayName}</span>
        </div>
        {props.column.getColDef().subHeaderText && (
          <span className="note">{props.column.getColDef().subHeaderText}</span>
        )}
      </div>
      {showSortIcon && <div className="sort-icon">{renderSortIcon()}</div>}
    </div>
  );

  const headerWithTooltip = showSortIcon ? (
    <Tippy
      content={getSortTooltip()}
      trigger="mouseenter"
      hideOnClick={false}
      disabled={isContextMenuOpen}
      appendTo={resolvePopoverAppendTarget}>
      {headerContent}
    </Tippy>
  ) : (
    headerContent
  );

  return (
    <Tippy
      content={contextMenuContent}
      visible={canOpenContextMenu && isContextMenuOpen}
      interactive={true}
      trigger="manual"
      placement="bottom-start"
      appendTo={resolvePopoverAppendTarget}
      onClickOutside={closeContextMenu}
      offset={[0, 6]}>
      <div className={styles.contextMenuReference}>{headerWithTooltip}</div>
    </Tippy>
  );
};
