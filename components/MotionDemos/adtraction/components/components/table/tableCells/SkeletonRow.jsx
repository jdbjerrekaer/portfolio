import styles from "./TableCells.module.scss";
import clsx from "clsx";
import { PlaceholderSkeleton } from "../../../tokens/placeholderSkeleton/PlaceholderSkeleton";

export const SkeletonRow = (params) => {
  // Get size from params (passed via fullWidthCellRendererParams) or default
  const size = params?.size || params?.colDef?.headerComponentParams?.size || "default";

  // Full-width skeleton bar for the entire row
  const rowHeight = size === "small" ? 26 : size === "large" ? 48 : 36;

  return (
    <div
      className={clsx(
        styles["custom-cell-container"],
        styles.skeleton,
        styles.skeletonRow,
        styles[size]
      )}
      style={{
        width: "100%",
        height: `${rowHeight}px`,
        padding: "0 12px",
        display: "flex",
        alignItems: "center"
      }}>
      <PlaceholderSkeleton isLoading={true} width="100%" initialHeight={`${rowHeight - 8}px`} />
    </div>
  );
};
