import React, { useRef, useState, useEffect } from "react";
import { CheckBox } from "../../../tokens/checkBox/checkBox/CheckBox";
import styles from "./TableCells.module.scss";
import clsx from "clsx";

export const CheckBoxCell = (params) => {
  const { node, colDef } = params;
  const size = params.size || colDef.headerComponentParams?.size || "default";
  const suppressNextClickRef = useRef(false);

  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    if (!node || node.rowPinned) {
      setIsSelected(false);
      return undefined;
    }
    const sync = () => setIsSelected(node.isSelected());
    sync();
    const onRowSelected = () => sync();
    node.addEventListener("rowSelected", onRowSelected);
    return () => {
      node.removeEventListener("rowSelected", onRowSelected);
    };
  }, [node]);

  if (!node || node.rowPinned) {
    return null;
  }

  const isIndeterminate = false;

  const handleCheckboxChange = (checked) => {
    if (checked) {
      node.setSelected(true, false);
    } else {
      node.setSelected(false, false);
    }
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressNextClickRef.current = true;
    params.onSelectionDragStart?.(node, event);
  };

  const handleMouseOver = (event) => {
    event.stopPropagation();
    params.onSelectionDragEnter?.(node);
  };

  const handleClickCapture = (event) => {
    if (!suppressNextClickRef.current) {
      return;
    }

    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={clsx(styles["custom-cell-container"], styles.checkbox, styles[size])}
      onMouseDownCapture={handleMouseDown}
      onMouseOver={handleMouseOver}
      onClickCapture={handleClickCapture}
      onDragStart={(event) => event.preventDefault()}>
      <CheckBox
        checked={isSelected}
        indeterminate={isIndeterminate}
        onChange={handleCheckboxChange}
        size={size}
        disabled={false}
      />
    </div>
  );
};
