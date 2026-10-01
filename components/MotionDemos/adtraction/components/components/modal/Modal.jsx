import React, { useEffect, useCallback, useRef, useState, useLayoutEffect } from "react";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import clsx from "clsx";
import styles from "./Modal.module.scss";
import { createPortal } from "react-dom";
import { ScrollShadow } from "../../tokens/shadow/ScrollShadow";

const DEFAULT_Z_INDEX_SCALE = {
  modalOverlay: 10000001,
  popoverAboveModal: 10000020,
  tooltipAboveModal: 10000020,
  toast: 10000030
};

// On-screen height morph (empty → results / no-results). WAAPI avoids stacking
// broken `transition` strings (cubic-bezier commas break naive split/join).
const HEIGHT_MORPH_EASE = "cubic-bezier(0.77, 0, 0.175, 1)";
const HEIGHT_MORPH_MS_MIN = 160;
const HEIGHT_MORPH_MS_MAX = 280;
const HEIGHT_ANIMATION_ENABLE_DELAY_MS = 350;

const SIDE_PANEL_DEFAULT_WIDTH_PX = 512;
const SIDE_PANEL_MIN_WIDTH_PX = 320;
const SIDE_PANEL_MAX_WIDTH_VW = 0.8;
const SIDE_PANEL_RUBBERBAND = 0.35;
const SIDE_PANEL_KEYBOARD_STEP_PX = 16;
const SIDE_PANEL_PILL_FOLLOW_RANGE_PX = 48;
const REM_PX = 16;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

const isSmallScreen = () =>
  typeof window !== "undefined" && Boolean(window.matchMedia?.("(max-width: 768px)")?.matches);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const rubberband = (value, min, max) => {
  if (value < min) return min - (min - value) * SIDE_PANEL_RUBBERBAND;
  if (value > max) return max + (value - max) * SIDE_PANEL_RUBBERBAND;
  return value;
};

const parseCssLengthToPx = (value, viewportWidth) => {
  if (value == null || value === "") return null;
  const trimmed = String(value).trim();
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return null;
  if (trimmed.endsWith("rem")) return numeric * REM_PX;
  if (trimmed.endsWith("vw") || trimmed.endsWith("%")) return (numeric / 100) * viewportWidth;
  return numeric;
};

const getSidePanelBounds = (minWidth, maxWidth) => {
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : SIDE_PANEL_DEFAULT_WIDTH_PX;
  const minFromProp = parseCssLengthToPx(minWidth, viewportWidth);
  const maxFromProp = parseCssLengthToPx(maxWidth, viewportWidth);
  const min = Math.max(minFromProp || 0, SIDE_PANEL_MIN_WIDTH_PX);
  const max = Math.min(maxFromProp ?? viewportWidth * SIDE_PANEL_MAX_WIDTH_VW, viewportWidth);
  return { min, max: Math.max(min, max) };
};

const morphDurationMs = (fromHeight, toHeight) => {
  const delta = Math.abs(toHeight - fromHeight);
  // ~0.45ms per px keeps big empty→empty-state jumps from feeling rushed.
  return Math.min(HEIGHT_MORPH_MS_MAX, Math.max(HEIGHT_MORPH_MS_MIN, Math.round(delta * 0.45)));
};

const getZIndexScale = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return DEFAULT_Z_INDEX_SCALE;
  }

  const rootStyles = window.getComputedStyle(document.documentElement);
  const readZIndex = (variableName, fallbackValue) => {
    const parsedValue = Number.parseInt(rootStyles.getPropertyValue(variableName).trim(), 10);
    return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
  };

  return {
    modalOverlay: readZIndex("--z-index-modal-overlay", DEFAULT_Z_INDEX_SCALE.modalOverlay),
    popoverAboveModal: readZIndex(
      "--z-index-popover-above-modal",
      DEFAULT_Z_INDEX_SCALE.popoverAboveModal
    ),
    tooltipAboveModal: readZIndex(
      "--z-index-tooltip-above-modal",
      DEFAULT_Z_INDEX_SCALE.tooltipAboveModal
    ),
    toast: readZIndex("--z-index-toast", DEFAULT_Z_INDEX_SCALE.toast)
  };
};

/**
 * Modal displays layered content in a portal with focus management, ESC-to-close,
 * and outside-click handling. Optionally shows a close button and supports
 * sizing constraints.
 *
 * @param {string} [id="modal"] - Root element id and base for ARIA labelling.
 * @param {string} [title=""] - Optional title; used as aria-labelledby target when provided.
 * @param {string} [ariaLabel=""] - Accessible label when the modal has no visible title.
 * @param {React.ReactNode} children - Modal content.
 * @param {boolean} [isOpen=false] - Controls visibility. When false, renders null.
 * @param {boolean} [showCloseButton=true] - Renders a circular close button.
 * @param {string} [maxWidth] - CSS max-width for the dialog.
 * @param {string} [minWidth="0px"] - CSS min-width for the dialog.
 * @param {string} [minHeight] - CSS min-height for the dialog. Defaults to 211px for centered modals.
 * @param {string} [maxHeight] - CSS max-height for the dialog (desktop only). Content scrolls if exceeded.
 * @param {("default"|"sidePanel")} [variant="default"] - Layout variant. Use sidePanel when the user is
 * working on something from the current page; use default for stop-and-decide/confirm/acknowledge flows.
 * @param {boolean} [dismissible=true] - Whether ESC and outside clicks can close the modal.
 * @param {boolean} [enableBackdropBlur=true] - Whether the overlay adds a blur effect.
 * @param {boolean} [showScrollShadow=true] - Whether to show scroll shadows when content overflows.
 * @param {boolean} [resizable=true] - Desktop sidePanel only. Drag the left-edge pill to change width.
 * @param {string} [className=""] - Additional class name for the dialog container.
 * @param {function} [onClose=() => {}] - Called when user requests close (button/ESC).
 * @param {function} [onOutsideClick=() => {}] - Called when clicking outside when dismissible.
 * @returns {JSX.Element|null}
 */
export const Modal = ({
  id = "modal",
  title = "",
  ariaLabel = "",
  children,
  isOpen = false,
  showCloseButton = true,
  maxWidth,
  minWidth = "0px",
  minHeight,
  maxHeight,
  variant = "default",
  dismissible = true,
  enableBackdropBlur = true,
  showScrollShadow = true,
  resizable = true,
  className = "",
  onClose = () => {},
  onOutsideClick = () => {}
}) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const contentRef = useRef(null);
  const enableHeightAnimationRef = useRef(false);
  const lockedHeightRef = useRef(null);
  const isSyncingHeightRef = useRef(false);
  const heightAnimationRef = useRef(null);
  const heightSyncRafRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const overlayRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const resizeDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startWidth: 0,
    liveWidth: 0
  });
  const sidePanelStackSignatureRef = useRef("");
  const [stackIndex, setStackIndex] = useState(0);
  const [nestedSidePanelWidth, setNestedSidePanelWidth] = useState(null);
  const [hasNestedSidePanel, setHasNestedSidePanel] = useState(false);
  const [sidePanelWidthPx, setSidePanelWidthPx] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  // Calculate stack index for automatic z-index stacking based on DOM order
  useLayoutEffect(() => {
    if (!isOpen || !overlayRef.current) {
      return;
    }

    let pendingFrame = null;
    let pendingForceMeasure = false;

    const updateStackIndex = (forceMeasure = false) => {
      if (!overlayRef.current) return;
      const overlayElement = overlayRef.current;
      const allOverlays = Array.from(document.querySelectorAll('[data-overlay-root="true"]'));
      const currentIndex = allOverlays.indexOf(overlayElement);
      const stackSignature = `${currentIndex}:${allOverlays
        .map((overlay) => overlay.getAttribute("data-variant"))
        .join("|")}`;
      const stackChanged = stackSignature !== sidePanelStackSignatureRef.current;

      if (!forceMeasure && !stackChanged) {
        return;
      }

      sidePanelStackSignatureRef.current = stackSignature;
      setStackIndex(Math.max(0, currentIndex));

      if (currentIndex < 0) {
        setNestedSidePanelWidth(null);
        setHasNestedSidePanel(false);
        return;
      }

      if (variant !== "sidePanel") {
        setNestedSidePanelWidth(null);
        setHasNestedSidePanel(false);
        return;
      }

      const previousSidePanelOverlay =
        currentIndex > 0
          ? allOverlays
              .slice(0, currentIndex)
              .reverse()
              .find((overlay) => overlay.getAttribute("data-variant") === "sidePanel")
          : null;

      const previousSidePanel = previousSidePanelOverlay?.querySelector(
        '[role="dialog"][data-variant="sidePanel"]'
      );
      const parentWidth = previousSidePanel?.getBoundingClientRect().width;

      setNestedSidePanelWidth(parentWidth ? `${Math.max(parentWidth, 0)}px` : null);
      setHasNestedSidePanel(
        allOverlays
          .slice(currentIndex + 1)
          .some((overlay) => overlay.getAttribute("data-variant") === "sidePanel")
      );
    };

    const scheduleStackIndexUpdate = (forceMeasure = false) => {
      pendingForceMeasure = pendingForceMeasure || forceMeasure;

      if (pendingFrame !== null) {
        return;
      }

      const requestFrame = window.requestAnimationFrame
        ? window.requestAnimationFrame.bind(window)
        : window.setTimeout.bind(window);
      pendingFrame = requestFrame(() => {
        pendingFrame = null;
        updateStackIndex(pendingForceMeasure);
        pendingForceMeasure = false;
      });
    };
    const handleResize = () => scheduleStackIndexUpdate(true);

    // Calculate immediately after DOM update
    updateStackIndex(true);

    // Watch for changes in modal stack (when other modals open/close)
    const observer = new MutationObserver(() => {
      scheduleStackIndexUpdate();
    });

    if (typeof document !== "undefined") {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      window.addEventListener("resize", handleResize);
    }

    return () => {
      observer.disconnect();
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
        if (pendingFrame !== null) {
          const cancelFrame = window.cancelAnimationFrame
            ? window.cancelAnimationFrame.bind(window)
            : window.clearTimeout.bind(window);
          cancelFrame(pendingFrame);
        }
      }
    };
  }, [isOpen, variant]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && dismissible) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, dismissible, handleClose]);

  // Smoothly morph height when content resizes (desktop centered modals only).
  // Height stays locked after open so shrinks (e.g. empty → no-results) still have a from-value.
  useEffect(() => {
    if (!isOpen) return;
    if (variant === "sidePanel") return;

    const modalEl = modalRef.current;
    const contentEl = contentRef.current;
    if (!modalEl || !contentEl) return;

    const isSmallScreen =
      typeof window !== "undefined" &&
      window.matchMedia?.("(max-width: 768px)")?.matches;
    if (isSmallScreen) {
      return;
    }

    const cancelHeightAnimation = () => {
      const active = heightAnimationRef.current;
      if (!active) return;
      heightAnimationRef.current = null;
      try {
        active.cancel();
      } catch {
        // Animation may already be finished.
      }
    };

    const lockHeight = (heightPx) => {
      lockedHeightRef.current = heightPx;
      modalEl.style.height = `${heightPx}px`;
    };

    const syncModalHeight = () => {
      if (!enableHeightAnimationRef.current || isSyncingHeightRef.current) return;
      if (typeof modalEl.animate !== "function") {
        // ponytail: rare no-WAAPI engines — snap. Upgrade: CSS height transition without comma-split.
        modalEl.style.height = "";
        lockHeight(modalEl.getBoundingClientRect().height);
        return;
      }

      isSyncingHeightRef.current = true;
      try {
        // Interrupt in-flight morph; continue from the visible height.
        const fromHeight = modalEl.getBoundingClientRect().height;
        cancelHeightAnimation();
        modalEl.style.transition = "";

        // Clear instead of "auto": a className height (fullscreen table's 85vh) must stay the target.
        modalEl.style.height = "";
        const toHeight = modalEl.getBoundingClientRect().height;
        modalEl.style.height = `${fromHeight}px`;
        void modalEl.offsetHeight;

        if (Math.abs(toHeight - fromHeight) < 1) {
          lockHeight(toHeight);
          return;
        }

        if (prefersReducedMotion()) {
          lockHeight(toHeight);
          return;
        }

        const duration = morphDurationMs(fromHeight, toHeight);
        const animation = modalEl.animate(
          [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
          {
            duration,
            easing: HEIGHT_MORPH_EASE,
            fill: "forwards"
          }
        );
        heightAnimationRef.current = animation;
        lockedHeightRef.current = toHeight;

        animation.finished
          .then(() => {
            if (heightAnimationRef.current !== animation) return;
            heightAnimationRef.current = null;
            lockHeight(toHeight);
            animation.cancel();
          })
          .catch(() => {
            // Superseded by a newer morph.
          });
      } finally {
        isSyncingHeightRef.current = false;
      }
    };

    const scheduleHeightSync = () => {
      if (heightSyncRafRef.current != null) {
        cancelAnimationFrame(heightSyncRafRef.current);
      }
      // Double rAF: wait until React's commit + browser layout settle.
      heightSyncRafRef.current = requestAnimationFrame(() => {
        heightSyncRafRef.current = requestAnimationFrame(() => {
          heightSyncRafRef.current = null;
          syncModalHeight();
        });
      });
    };

    const timerId = setTimeout(() => {
      cancelHeightAnimation();
      modalEl.style.transition = "";
      const currentHeight = modalEl.getBoundingClientRect().height;
      if (currentHeight > 0) {
        lockHeight(currentHeight);
      }
      enableHeightAnimationRef.current = true;
    }, HEIGHT_ANIMATION_ENABLE_DELAY_MS);

    // Content is flex-grown inside a locked modal, so child shrinks often don't resize contentEl.
    // Observe children too, and watch mutations for React swaps (empty ↔ no-results).
    const resizeObserver = new ResizeObserver(scheduleHeightSync);
    const observeResizeTargets = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(contentEl);
      Array.from(contentEl.children).forEach((child) => {
        resizeObserver.observe(child);
      });
    };
    observeResizeTargets();
    resizeObserverRef.current = resizeObserver;

    const mutationObserver = new MutationObserver(() => {
      observeResizeTargets();
      scheduleHeightSync();
    });
    mutationObserver.observe(contentEl, { childList: true, subtree: true });

    return () => {
      clearTimeout(timerId);
      enableHeightAnimationRef.current = false;
      lockedHeightRef.current = null;
      if (heightSyncRafRef.current != null) {
        cancelAnimationFrame(heightSyncRafRef.current);
        heightSyncRafRef.current = null;
      }
      cancelHeightAnimation();
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      modalEl.style.transition = "";
      modalEl.style.height = "";
    };
  }, [isOpen, variant]);

  const bounceCloseButton = useCallback(() => {
    if (!showCloseButton) return;
    const buttonElement = closeButtonRef.current;
    if (!buttonElement) return;

    const bounceClassName = styles.modal_close_circle_bounce;
    // Restart the animation if it was already applied
    buttonElement.classList.remove(bounceClassName);
    // Force reflow to allow re-adding the class to retrigger animation
    buttonElement.getBoundingClientRect();
    buttonElement.classList.add(bounceClassName);

    const handleAnimationEnd = () => {
      buttonElement.classList.remove(bounceClassName);
      buttonElement.removeEventListener("animationend", handleAnimationEnd);
    };
    buttonElement.addEventListener("animationend", handleAnimationEnd);
  }, [showCloseButton]);

  const handleOutsideClick = () => {
    if (dismissible) {
      onOutsideClick();
    } else {
      bounceCloseButton();
    }
  };

  const isSidePanel = variant === "sidePanel";
  const showResizeHandle = isSidePanel && resizable && !hasNestedSidePanel;
  const sidePanelBounds = getSidePanelBounds(minWidth, maxWidth);

  const clearResizeCursor = useCallback(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const setPillOffset = useCallback((offsetPx) => {
    const handleElement = resizeHandleRef.current;
    if (!handleElement) return;
    handleElement.style.setProperty("--pill-offset", `${offsetPx}px`);
  }, []);

  const followPointerY = useCallback(
    (clientY) => {
      if (prefersReducedMotion()) {
        setPillOffset(0);
        return;
      }
      const handleElement = resizeHandleRef.current;
      if (!handleElement) return;
      const rect = handleElement.getBoundingClientRect();
      const offset = clamp(
        clientY - (rect.top + rect.height / 2),
        -SIDE_PANEL_PILL_FOLLOW_RANGE_PX,
        SIDE_PANEL_PILL_FOLLOW_RANGE_PX
      );
      setPillOffset(offset);
    },
    [setPillOffset]
  );

  const applySidePanelWidth = useCallback((widthPx) => {
    const { min, max } = getSidePanelBounds(minWidth, maxWidth);
    setSidePanelWidthPx(clamp(widthPx, min, max));
  }, [maxWidth, minWidth]);

  const sidePanelWidthPxRef = useRef(sidePanelWidthPx);
  sidePanelWidthPxRef.current = sidePanelWidthPx;

  useEffect(() => {
    if (!isSidePanel) return undefined;

    const reclampStoredWidth = () => {
      const storedWidth = sidePanelWidthPxRef.current;
      if (storedWidth == null) return;
      applySidePanelWidth(storedWidth);
    };

    window.addEventListener("resize", reclampStoredWidth);
    return () => window.removeEventListener("resize", reclampStoredWidth);
  }, [applySidePanelWidth, isSidePanel]);

  const handleResizePointerMoveRef = useRef(null);
  const endResizeRef = useRef(null);

  const onWindowPointerMove = useCallback((event) => {
    handleResizePointerMoveRef.current?.(event);
  }, []);

  const onWindowPointerUp = useCallback((event) => {
    endResizeRef.current?.(event);
  }, []);

  const detachWindowResizeListeners = useCallback(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("mousemove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
    window.removeEventListener("mouseup", onWindowPointerUp);
    window.removeEventListener("pointercancel", onWindowPointerUp);
  }, [onWindowPointerMove, onWindowPointerUp]);

  const attachWindowResizeListeners = useCallback(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("mousemove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("mouseup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
  }, [onWindowPointerMove, onWindowPointerUp]);

  const endResize = useCallback(
    (event) => {
      const drag = resizeDragRef.current;
      if (!drag.active) return;
      if (event?.pointerId && drag.pointerId && event.pointerId !== drag.pointerId) return;

      const handleElement = resizeHandleRef.current;
      if (handleElement && drag.pointerId != null && handleElement.hasPointerCapture?.(drag.pointerId)) {
        handleElement.releasePointerCapture(drag.pointerId);
      }

      const { min, max } = getSidePanelBounds(minWidth, maxWidth);
      setSidePanelWidthPx(clamp(drag.liveWidth || sidePanelWidthPx || SIDE_PANEL_DEFAULT_WIDTH_PX, min, max));
      drag.active = false;
      drag.pointerId = null;
      detachWindowResizeListeners();
      setIsResizing(false);
      clearResizeCursor();
    },
    [clearResizeCursor, detachWindowResizeListeners, maxWidth, minWidth, sidePanelWidthPx]
  );

  const handleResizePointerDown = useCallback(
    (event) => {
      if (event.button > 0) return;
      if (isSmallScreen()) return;

      event.preventDefault();
      event.stopPropagation();

      const modalEl = modalRef.current;
      const handleElement = event.currentTarget;
      if (!modalEl) return;

      const startWidth = modalEl.getBoundingClientRect().width;
      resizeDragRef.current = {
        active: true,
        pointerId: event.pointerId ?? 0,
        startX: event.clientX,
        startWidth,
        liveWidth: startWidth
      };
      setSidePanelWidthPx(startWidth);
      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      handleElement.setPointerCapture?.(event.pointerId);
      attachWindowResizeListeners();
      followPointerY(event.clientY);
    },
    [attachWindowResizeListeners, followPointerY]
  );

  const handleResizePointerMove = useCallback(
    (event) => {
      followPointerY(event.clientY);

      const drag = resizeDragRef.current;
      if (!drag.active) return;
      if (event.pointerId && drag.pointerId && event.pointerId !== drag.pointerId) return;

      const { min, max } = getSidePanelBounds(minWidth, maxWidth);
      const nextWidth = rubberband(drag.startWidth + (drag.startX - event.clientX), min, max);
      drag.liveWidth = nextWidth;
      setSidePanelWidthPx(nextWidth);
    },
    [followPointerY, maxWidth, minWidth]
  );

  handleResizePointerMoveRef.current = handleResizePointerMove;
  endResizeRef.current = endResize;

  const handleResizePointerLeave = useCallback(() => {
    if (resizeDragRef.current.active) return;
    setPillOffset(0);
  }, [setPillOffset]);

  const handleResizeDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      applySidePanelWidth(SIDE_PANEL_DEFAULT_WIDTH_PX);
    },
    [applySidePanelWidth]
  );

  const handleResizeKeyDown = useCallback(
    (event) => {
      if (isSmallScreen()) return;

      const currentWidth =
        sidePanelWidthPx ?? modalRef.current?.getBoundingClientRect().width ?? SIDE_PANEL_DEFAULT_WIDTH_PX;
      const { min, max } = getSidePanelBounds(minWidth, maxWidth);

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        applySidePanelWidth(currentWidth + SIDE_PANEL_KEYBOARD_STEP_PX);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        applySidePanelWidth(currentWidth - SIDE_PANEL_KEYBOARD_STEP_PX);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        applySidePanelWidth(min);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        applySidePanelWidth(max);
      }
    },
    [applySidePanelWidth, maxWidth, minWidth, sidePanelWidthPx]
  );

  useEffect(() => () => {
    detachWindowResizeListeners();
    clearResizeCursor();
  }, [clearResizeCursor, detachWindowResizeListeners]);

  if (!isOpen) return null;

  const announcedSidePanelWidth = Math.round(
    clamp(sidePanelWidthPx ?? SIDE_PANEL_DEFAULT_WIDTH_PX, sidePanelBounds.min, sidePanelBounds.max)
  );
  const modalStyle = {
    ...(maxWidth && sidePanelWidthPx == null && { maxWidth }),
    ...(maxHeight && { maxHeight }),
    ...(isSidePanel
      ? {
          ...(minWidth && minWidth !== "0px" && { minWidth }),
          ...(sidePanelWidthPx != null && {
            width: `${sidePanelWidthPx}px`,
            maxWidth: `${sidePanelWidthPx}px`
          })
        }
      : { minWidth }),
    ...(minHeight && { minHeight }),
    ...(!minHeight && !isSidePanel && { minHeight: "211px" })
  };

  const zIndexScale = getZIndexScale();
  const overlayStyle = {
    "--z-index-modal-overlay": zIndexScale.modalOverlay + stackIndex,
    "--z-index-popover-above-modal": zIndexScale.popoverAboveModal + stackIndex,
    "--z-index-tooltip-above-modal": zIndexScale.tooltipAboveModal + stackIndex,
    "--z-index-toast": zIndexScale.toast + stackIndex,
    ...(nestedSidePanelWidth && { "--modal-nested-side-panel-width": nestedSidePanelWidth })
  };

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  return createPortal(
    <div
      ref={overlayRef}
      id={id}
      className={clsx(styles.modal_overlay, enableBackdropBlur && styles.modal_overlay_blur)}
      onClick={handleOutsideClick}
      role="presentation"
      data-overlay-root="true"
      data-variant={variant}
      data-nested-side-panel={nestedSidePanelWidth ? "true" : undefined}
      style={overlayStyle}>
      <div
        ref={modalRef}
        className={clsx(styles.modal, className)}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
        tabIndex={-1}
        role="dialog"
        data-variant={variant}
        data-nested-side-panel={nestedSidePanelWidth ? "true" : undefined}
        data-has-nested-side-panel={hasNestedSidePanel ? "true" : undefined}
        aria-modal="true"
        aria-label={!title && ariaLabel ? ariaLabel : undefined}
        aria-labelledby={title ? `${id}-title` : undefined}>
        {showResizeHandle && (
          <button
            ref={resizeHandleRef}
            type="button"
            className={styles.resize_handle}
            data-dragging={isResizing ? "true" : undefined}
            role="separator"
            aria-orientation="vertical"
            aria-label={i18n.t("ui.toolkit.modal.resizeHandle")}
            aria-valuemin={Math.round(sidePanelBounds.min)}
            aria-valuemax={Math.round(sidePanelBounds.max)}
            aria-valuenow={announcedSidePanelWidth}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onPointerLeave={handleResizePointerLeave}
            onDoubleClick={handleResizeDoubleClick}
            onKeyDown={handleResizeKeyDown}
            onClick={(event) => event.stopPropagation()}>
            <span className={styles.resize_pill} aria-hidden="true" />
          </button>
        )}
        {showCloseButton && (
          <button ref={closeButtonRef} className={styles.modal_close_circle} onClick={handleClose}>
            <Icons.General.XClose
              height={"var(--size-icon-medium)"}
              width={"var(--size-icon-medium)"}
              color={"currentColor"}
              strokeWidth="1.73"
            />
          </button>
        )}
        {title && (
          <h2 id={`${id}-title`} className={styles.modal_title}>
            {title}
          </h2>
        )}
        <div id={`${id}-content-wrapper`} className={styles.modal_content_wrapper}>
          {showScrollShadow && (
            <ScrollShadow
              wrapper={`${id}-content-wrapper`}
              scrollContainer={`${id}-content`}
              direction="vertical"
            />
          )}
          <div ref={contentRef} id={`${id}-content`} className={clsx(styles.modal_content)}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
};
