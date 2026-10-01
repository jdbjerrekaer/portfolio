import React, { useState, useEffect } from "react";
import { CheckBox } from "../../../tokens/checkBox/checkBox/CheckBox";
import styles from "./TableCells.module.scss";
import clsx from "clsx";

export const CheckBoxHeaderCell = (params) => {
  const { api } = params;
  const size = params.size || "default";
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  // Update checkbox state based on selection
  const updateCheckboxState = () => {
    if (!api) return;

    const selectedRows = api.getSelectedRows();

    // Check if we're using server-side row model by checking grid options
    let isServerSide = false;
    try {
      const gridOptions = api.getGridOption("rowModelType");
      isServerSide = gridOptions === "serverSide";
    } catch {
      // Fallback: try alternative method to detect server-side mode
      try {
        // Check if server-side datasource exists
        const datasource = api.getGridOption("serverSideDatasource");
        isServerSide = datasource != null;
      } catch {
        // Final fallback: assume client-side if we can't determine
        isServerSide = false;
      }
    }

    // For server-side row model, we can't count all rows easily
    // so we'll use a simpler logic based on selected rows
    if (isServerSide) {
      if (selectedRows.length === 0) {
        setIsChecked(false);
        setIsIndeterminate(false);
      } else {
        // For SSRM, we show indeterminate state when some rows are selected
        // since we can't easily determine if all visible rows are selected
        setIsChecked(false);
        setIsIndeterminate(true);
      }
    } else {
      // Count only non-pinned rows for client-side row model
      let visibleRowCount = 0;
      try {
        api.forEachNodeAfterFilterAndSort((node) => {
          if (!node.rowPinned && node.data) {
            visibleRowCount++;
          }
        });
      } catch {
        // If forEachNodeAfterFilterAndSort fails, try alternative method
        try {
          // Try to get displayed row count from the model
          const displayedRowCount = api.getDisplayedRowCount();
          visibleRowCount = displayedRowCount || 0;
        } catch {
          // Final fallback: assume no visible rows
          visibleRowCount = 0;
        }
      }

      if (selectedRows.length === 0) {
        setIsChecked(false);
        setIsIndeterminate(false);
      } else if (selectedRows.length === visibleRowCount && visibleRowCount > 0) {
        setIsChecked(true);
        setIsIndeterminate(false);
      } else {
        setIsChecked(false);
        setIsIndeterminate(true);
      }
    }
  };

  // Listen for selection changes
  useEffect(() => {
    if (!api) return;

    const onSelectionChanged = () => {
      updateCheckboxState();
    };

    // Use a timeout to ensure the data is loaded before calculating initial state
    const timeoutId = setTimeout(() => {
      updateCheckboxState();
    }, 100);

    // Also trigger an immediate update after a short delay to catch any missed updates
    const immediateTimeoutId = setTimeout(() => {
      updateCheckboxState();
    }, 300);

    api.addEventListener("selectionChanged", onSelectionChanged);
    api.addEventListener("rowDataChanged", onSelectionChanged);
    api.addEventListener("filterChanged", onSelectionChanged);
    api.addEventListener("sortChanged", onSelectionChanged);

    // Also listen for model updated events which happen after data changes
    api.addEventListener("modelUpdated", onSelectionChanged);

    // Initial state
    updateCheckboxState();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(immediateTimeoutId);
      api.removeEventListener("selectionChanged", onSelectionChanged);
      api.removeEventListener("rowDataChanged", onSelectionChanged);
      api.removeEventListener("filterChanged", onSelectionChanged);
      api.removeEventListener("sortChanged", onSelectionChanged);
      api.removeEventListener("modelUpdated", onSelectionChanged);
    };
  }, [api]);

  const handleHeaderCheckboxChange = (checked) => {
    if (!api) return;

    if (checked) {
      // Select all non-pinned rows
      api.forEachNodeAfterFilterAndSort((node) => {
        if (!node.rowPinned) {
          node.setSelected(true);
        }
      });
    } else {
      // Deselect all rows
      api.deselectAll();
    }
  };

  return (
    <div
      className={clsx(styles["custom-cell-container"], styles.checkbox, styles[size])}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%"
      }}>
      <CheckBox
        checked={isChecked}
        indeterminate={isIndeterminate}
        onChange={handleHeaderCheckboxChange}
        size={size}
        disabled={false}
      />
    </div>
  );
};
