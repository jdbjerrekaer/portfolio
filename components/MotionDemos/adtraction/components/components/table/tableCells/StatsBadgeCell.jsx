import { StatsBadge } from "../../statsBadge/StatsBadge";
import styles from "./TableCells.module.scss";
import clsx from "clsx";
import { CellContextMenu } from "./CellContextMenu";

export const StatsBadgeCell = (params) => {
  const size = params.size || params.colDef.headerComponentParams?.size || "default";

  const alignmentClass =
    params.alignmentClass ||
    (params.colDef.type === "rightAligned" ? "rightAligned" : "centerAligned");

  /* -----------------------------------------------------------
     1.  Read the object/function supplied in colDef
  ----------------------------------------------------------- */
  let override = {};
  const { cellRendererParams } = params.colDef;
  if (typeof cellRendererParams === "function") {
    override = cellRendererParams(params) || {};
  } else if (cellRendererParams) {
    override = cellRendererParams;
  }

  /* -----------------------------------------------------------
     2.  Build final values.  Priority:
         override  →  params (AG Grid-merged)  →  fallback
  ----------------------------------------------------------- */
  const value =
    override.value !== undefined ? override.value : params.value !== undefined ? params.value : 0;
  const badgeSize = override.badgeSize ?? params.badgeSize ?? params.colDef.badgeSize;
  const fillWidth = override.fillWidth ?? params.fillWidth ?? params.colDef.fillWidth ?? false;

  if (value == null || value === "") {
    return null;
  }

  const tooltipDataRaw = params.tooltipData || override.tooltipData || undefined;

  const tooltipData = tooltipDataRaw
    ? {
        ...tooltipDataRaw,
        fromValue: Number(tooltipDataRaw.fromValue) || 0,
        toValue: Number(tooltipDataRaw.toValue) || 0
      }
    : undefined;

  return (
    <CellContextMenu params={params} value={value}>
      <div className={styles.cell_context_menu_target}>
        <div
          className={clsx(
            styles["custom-cell-container"],
            fillWidth && styles.fillWidth,
            styles.statsbadge,
            styles[alignmentClass],
            styles[size]
          )}>
          <StatsBadge
            value={value}
            size={badgeSize ?? (size === "small" ? "small" : "default")}
            background={override.background ?? false}
            indicator={override.indicator ?? true}
            positive={override.positive ?? 24}
            negative={override.negative ?? 20}
            hoverable={override.hoverable ?? true}
            type={override.type ?? "default"}
            showIndicatorScale={override.showIndicatorScale ?? true}
            tooltipData={tooltipData}
          />
        </div>
      </div>
    </CellContextMenu>
  );
};
