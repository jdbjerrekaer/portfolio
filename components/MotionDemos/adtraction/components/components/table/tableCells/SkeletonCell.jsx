import styles from "./TableCells.module.scss";
import clsx from "clsx";
import { PlaceholderSkeleton } from "../../../tokens/placeholderSkeleton/PlaceholderSkeleton";

export const SkeletonCell = (params) => {
  const size = params.size || params.colDef.headerComponentParams?.size || "default";
  const alignmentClass = params.alignmentClass || params.colDef.cellRendererParams?.alignmentClass;
  const isCheckbox = params.isCheckbox || params.colDef.cellRendererParams?.isCheckbox;

  // Fallback to old logic if no alignment class is provided
  const isRightAligned = alignmentClass === "rightAligned" || params.colDef.type === "rightAligned";
  const isCenterAligned = alignmentClass === "centerAligned" || isCheckbox;

  // Vary width slightly for a more natural loading look
  const field = params.colDef.field || "";
  const isName = field.toLowerCase().includes("name") || field.toLowerCase().includes("title");
  const isAmount = field.toLowerCase().includes("amount") || field.toLowerCase().includes("price") || field.toLowerCase().includes("count");
  
  let width = "85%";
  if (isName) width = "70%";
  if (isAmount) width = "40%";
  if (isCheckbox) width = size === "small" ? "14px" : size === "large" ? "20px" : "18px";

  let height = "100%";
  if (isCheckbox) {
    width = size === "small" ? "14px" : size === "large" ? "20px" : "18px";
    height = width;
  }

  return (
    <div
      className={clsx(
        styles["custom-cell-container"],
        styles.skeleton,
        styles.withPlaceholderSkeleton,
        isRightAligned && styles.rightAligned,
        (isCenterAligned || isCheckbox) && styles.centerAligned,
        styles[size]
      )}
    >
      <PlaceholderSkeleton isLoading={true} width={width} initialHeight={height} />
    </div>
  );
};
