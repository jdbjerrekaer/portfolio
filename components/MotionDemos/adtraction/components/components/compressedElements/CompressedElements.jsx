import React from "react";
import clsx from "clsx";
import { Tag } from "../../tokens/tag/Tag";
import { ListItem } from "../../tokens/listItem/ListItem";
import { ListItemWrapper } from "../../tokens/listItem/ListItemWrapper";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import styles from "./CompressedElements.module.scss";
import { getOverlayPortalTarget } from "../../misc/overlayPortal";

/**
 * CompressedElements shows a compact row of element icons and, when truncated,
 * a "+N more" tag with a hover popover listing all items.
 *
 * @param {Array<{icon: React.ReactNode, description: string}>} [elements=[]] - Items to display.
 * @param {number} [maxAmountToBeShown=2] - Max number of items to show inline.
 * @param {("small"|"default"|"large")} [tagSize="default"] - Size for the "+N more" tag.
 * @param {("default"|"small"|"compact")} [size="default"] - Controls overall compactness and layout.
 * @returns {JSX.Element}
 */
export const CompressedElements = ({
  elements = [],
  maxAmountToBeShown = 2,
  tagSize = "default",
  size = "default"
}) => {
  const safeElements = Array.isArray(elements) ? elements : [];
  const totalItems = safeElements.length;

  const normalizedSize = ["default", "small", "compact"].includes(size) ? size : "default";
  const normalizedMax = Number.isFinite(maxAmountToBeShown)
    ? Math.max(0, Math.floor(maxAmountToBeShown))
    : 0;

  let computedMax;
  if (normalizedSize === "small") {
    const fallback = normalizedMax > 0 ? normalizedMax : 1;
    computedMax = Math.min(Math.max(1, fallback), totalItems || 1);
  } else if (normalizedSize === "compact") {
    const fallback = normalizedMax > 0 ? normalizedMax : Math.min(3, totalItems || 3);
    computedMax = Math.min(fallback, totalItems);
  } else {
    computedMax = Math.min(normalizedMax, totalItems);
  }

  if (!Number.isFinite(computedMax) || computedMax < 0) {
    computedMax = 0;
  }

  const visibleItems = computedMax > 0 ? safeElements.slice(0, computedMax) : [];
  const remainderCount = Math.max(totalItems - visibleItems.length, 0);
  const hasOverflow = remainderCount > 0;
  const shouldShowTag = normalizedSize !== "compact" && hasOverflow;
  const shouldShowCompactOverflow = normalizedSize === "compact" && hasOverflow;
  const tagLabel =
    normalizedSize === "small"
      ? `+${remainderCount}`
      : i18n.t("ui.toolkit.compressedElements.more", { count: remainderCount });

  return (
    <Tippy
      content={
        hasOverflow ? (
          <ListItemWrapper
            scrollShadow={true}
            darkShadow={false}
            enableAnimation={false}
            customClassName={styles["compressed-elements-popover-container"]}>
            {safeElements.map((element, index) => (
              <ListItem
                text={element.description}
                iconLeft={element.icon}
                size="small"
                hoverable={false}
                key={index}
              />
            ))}
          </ListItemWrapper>
        ) : null
      }
      placement="bottom-start"
      arrow={false}
      interactive={true}
      interactiveBorder={8}
      delay={[0, 100]}
      appendTo={(ref) => getOverlayPortalTarget(ref) || document.body}
      className={styles["compressed-elements-tippy"]}
      disabled={!hasOverflow}>
      <div
        className={clsx(styles["compressed-elements"])}
        data-help={hasOverflow}
        data-size={normalizedSize}>
        <div className={styles["compressed-elements-items"]}>
          {visibleItems.map((element, index) => (
            <span className={styles["compressed-elements-item"]} key={index}>
              {element.icon}
            </span>
          ))}
        </div>
        {shouldShowTag && (
          <div className={styles["compressed-elements-tag-container"]}>
            <Tag text={tagLabel} size={tagSize} />
          </div>
        )}
        {shouldShowCompactOverflow && (
          <span className={styles["compressed-elements-compact-overflow"]}>+{remainderCount}</span>
        )}
      </div>
    </Tippy>
  );
};
