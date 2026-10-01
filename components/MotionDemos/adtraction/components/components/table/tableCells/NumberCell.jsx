import styles from "./TableCells.module.scss";
import clsx from "clsx";
import { formatNumber } from "@adtraction/util-number"; // Use existing utility
import { CellContextMenu } from "./CellContextMenu";

export const NumberCell = (params) => {
  const size = params.size || params.colDef.headerComponentParams?.size || "default";
  const alignmentClass = params.alignmentClass || "rightAligned";
  const decimals = params.decimals;
  const formatThousands = params.formatThousands !== false; // Default to true

  let displayValue = params.value;

  if (typeof params.value === "number") {
    if (typeof decimals === "number") {
      displayValue = params.value.toFixed(decimals);
    }

    if (formatThousands) {
      displayValue = formatNumber(displayValue, {
        thousandSeparator: " ",
        decimalSeparator: ".",
        decimalPlaces: typeof decimals === "number" ? decimals : 2
      });
    }
  }

  return (
    <CellContextMenu params={params} value={params.value}>
      <div className={styles.cell_context_menu_target}>
        <div
          className={clsx(
            styles["custom-cell-container"],
            styles.number,
            styles[alignmentClass],
            styles[size]
          )}>
          <p>{displayValue}</p>
        </div>
      </div>
    </CellContextMenu>
  );
};
