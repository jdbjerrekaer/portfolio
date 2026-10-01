import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./TableCells.module.scss";
import { Icons } from "@adtraction/ui-icons";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { i18n } from "@adtraction/shared-i18n";
import { writeToClipboard } from "@adtraction/util-clipboard";
import { Toaster } from "../../../tokens/toaster/Toaster";
import { CellContextMenu } from "./CellContextMenu";

const isElementTruncated = (el) => {
  if (!el) return false;
  // Sub-pixel rounding can make equal widths report as 1px apart.
  return el.scrollWidth - el.clientWidth > 1;
};

/**
 * Tippy wrapper that only shows popoverText when the measured label is ellipsized.
 */
const TruncatingTextPopover = ({ popoverText, children }) => {
  const measureRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const root = measureRef.current;
    if (!root) {
      setIsTruncated(false);
      return;
    }
    const label =
      root.querySelector(`.${styles.text_label}`) ||
      root.querySelector(`.${styles.link_text}`) ||
      root;
    setIsTruncated(isElementTruncated(label));
  }, []);

  useLayoutEffect(() => {
    checkTruncation();
  }, [popoverText, checkTruncation, children]);

  useEffect(() => {
    const root = measureRef.current;
    if (!root || typeof ResizeObserver === "undefined") return undefined;

    const ro = new ResizeObserver(() => checkTruncation());
    ro.observe(root);
    const label =
      root.querySelector(`.${styles.text_label}`) || root.querySelector(`.${styles.link_text}`);
    if (label) ro.observe(label);
    return () => ro.disconnect();
  }, [checkTruncation, popoverText]);

  return (
    <Tippy
      content={popoverText}
      placement="bottom-start"
      maxWidth={300}
      delay={[0, 0]}
      disabled={!isTruncated}>
      <div ref={measureRef} className={styles.popover_wrapper}>
        {children}
      </div>
    </Tippy>
  );
};

/**
 * @param {Object} params - Cell renderer params from ag-grid
 * @param {string} [params.text] - Text to display
 * @param {string} [params.popoverText] - Tippy content when the label is truncated
 * @param {boolean} [params.enableCopy=false] - When true, clicking the text copies it and shows a toast
 * @param {"default"|"muted"} [params.tone="default"] - Text color tone
 */
export const TextCell = (params) => {
  const history = useHistory();
  const enableCopy = Boolean(params.enableCopy);
  const size = params.size || params.colDef.headerComponentParams?.size || "default";
  const toneClass = params.tone === "muted" ? styles.text_tone_muted : null;
  const alignmentClass =
    params.alignmentClass ||
    (params.colDef.type === "rightAligned" ? "rightAligned" : "leftAligned");

  const handleCopy = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const text = params.text ?? params.value;
      const copyValue = text == null ? "" : String(text).trim();
      if (!enableCopy || !copyValue) return;

      try {
        await writeToClipboard(copyValue);
        Toaster.trigger({
          type: "info",
          title: i18n.t("ui.toolkit.textCell.copied"),
          autoDismiss: true,
          autoDismissTime: 3000
        });
      } catch {
        Toaster.trigger({
          type: "error",
          title: i18n.t("ui.toolkit.textCell.copyFailed"),
          autoDismiss: true,
          autoDismissTime: 4000
        });
      }
    },
    [enableCopy, params.text, params.value]
  );


  // For pinned bottom rows, only show if there's a text/value to display
  // Skip rendering for empty footer cells (columns without aggregate values)
  if (params.node.rowPinned === "bottom") {
    const pinnedText = params.text || params.value;
    if (pinnedText == null || pinnedText === "") {
      return null;
    }
  }

  const handleLinkClick = (e) => {
    if (params.link) {
      e.preventDefault();
      e.stopPropagation();
      history.push(params.link);
    }
  };

  const displayText = params.text || params.value;
  const copyValue = params.text ?? params.value;
  const popoverText = params.popoverText;

  const textLabel =
    enableCopy && displayText != null && displayText !== "" ? (
      <button
        type="button"
        aria-label={i18n.t("ui.toolkit.textCell.copyAria", { text: displayText })}
        className={clsx(styles.text_label, styles.text_label_copyable)}
        onClick={handleCopy}>
        {displayText}
      </button>
    ) : (
      <span aria-label={displayText} className={styles.text_label}>
        {displayText}
      </span>
    );

  const linkContent = (
    <div onClick={handleLinkClick} className={styles.link_container}>
      <span aria-label={displayText} className={styles.link_text}>
        {params.linkLabel ? params.linkLabel : displayText || params.link}
      </span>
      <div className={styles.link_icon}>
        <Icons.Arrow.NarrowUpRight
          width={size === "small" ? "var(--size-icon-x-small)" : "var(--size-icon-small)"}
          height={size === "small" ? "var(--size-icon-x-small)" : "var(--size-icon-small)"}
          color="var(--text-links-hover)"
          strokeWidth={2.3}
        />
      </div>
    </div>
  );

  const renderContent = () => (
    <>
      {displayText && params.link && (
        <div
          className={clsx(
            styles["custom-cell-container"],
            styles.text,
            styles.link,
            styles[alignmentClass],
            styles[size],
            toneClass
          )}>
          {textLabel}
          {linkContent}
        </div>
      )}

      {params.link && !params.text && (
        <div
          className={clsx(
            styles["custom-cell-container"],
            styles.link,
            styles[alignmentClass],
            styles[size],
            toneClass
          )}>
          {linkContent}
        </div>
      )}

      {displayText && !params.link && (
        <div
          className={clsx(
            styles["custom-cell-container"],
            styles.text,
            styles[alignmentClass],
            styles[size],
            toneClass
          )}>
          {textLabel}
        </div>
      )}
    </>
  );

  const content = (
    <CellContextMenu params={params} value={copyValue}>
      <div className={styles.cell_context_menu_target}>{renderContent()}</div>
    </CellContextMenu>
  );

  if (popoverText) {
    return <TruncatingTextPopover popoverText={popoverText}>{content}</TruncatingTextPopover>;
  }

  return content;
};
