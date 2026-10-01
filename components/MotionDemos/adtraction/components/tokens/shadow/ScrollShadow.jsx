import React, { useCallback, useEffect, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import styles from "./ScrollShadow.module.scss";
import { debounceResizeCallback } from "../../../utils/debounceResizeObserver";
import clsx from "clsx";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import { getOverlayPortalTarget } from "../../misc/overlayPortal";

const VERTICAL_SCROLL_NOISE_THRESHOLD = 4;
const DEFAULT_IDLE_HINT_DELAY = 4000;
const EMPTY_HINT_EDGES = {
  top: false,
  bottom: false,
  left: false,
  right: false
};
const HINT_EDGE_ORDER = ["top", "right", "bottom", "left"];

const getHintPlacement = (edge) => {
  if (edge === "top") {
    return "bottom";
  }
  if (edge === "left") {
    return "right";
  }
  if (edge === "right") {
    return "left";
  }
  return "top";
};

const getHintIcon = (edge) => {
  if (edge === "top") {
    return <Icons.Arrow.NarrowUp aria-hidden="true" />;
  }
  if (edge === "left") {
    return <Icons.Arrow.NarrowLeft aria-hidden="true" />;
  }
  if (edge === "right") {
    return <Icons.Arrow.NarrowRight aria-hidden="true" />;
  }
  return <Icons.Arrow.NarrowDown aria-hidden="true" />;
};

const areHintEdgesEqual = (first, second) =>
  first.top === second.top &&
  first.bottom === second.bottom &&
  first.left === second.left &&
  first.right === second.right;

const didScrollTowardHint = (hintEdges, deltaTop, deltaLeft, direction) =>
  ((direction === "auto" || direction === "vertical") &&
    ((hintEdges.top && deltaTop < 0) || (hintEdges.bottom && deltaTop > 0))) ||
  ((direction === "auto" || direction === "horizontal") &&
    ((hintEdges.left && deltaLeft < 0) || (hintEdges.right && deltaLeft > 0)));

/**
 * ScrollShadow renders gradient shadows at the edges of a scroll container to
 * indicate overflow. It attaches listeners to the provided wrapper and scroll
 * container ids and updates shadow opacity on scroll and resize.
 *
 * @param {string} [wrapper=""] - The id of the wrapper element.
 * @param {string} [scrollContainer=""] - The id of the scrolling element.
 * @param {boolean} [dark=false] - Use dark shadow theme.
 * @param {boolean} [hideScrollBar=false] - Hide native scrollbars inside container.
 * @param {number} [strength=5] - Shadow intensity (CSS variable value).
 * @param {string} [blur="0.1875rem"] - Backdrop blur amount for the shadow fade.
 * @param {("auto"|"vertical"|"horizontal")} [direction="auto"] - Shadow orientation.
 * @param {boolean} [desktopOnly=false] - Render only when viewport is desktop width.
 * @param {string} [alignToSelector=""] - Optional selector used to align vertical shadows.
 * @param {boolean} [showIdleHint=false] - Show a small motion hint after scroll has been idle.
 * @param {boolean} [showTooltip=false] - Show tooltip copy on the hint affordance.
 * @param {string} [tooltipText=""] - Optional tooltip text override.
 * @param {number} [idleHintDelay=4000] - Delay before the idle hint appears.
 * @param {number} [recalculateKey=0] - External signal for layout recalculation.
 * @param {{top?: boolean, bottom?: boolean, left?: boolean, right?: boolean}} [disabledEdges] - Hide specific shadow and hint edges.
 * @param {{top?: boolean, bottom?: boolean, left?: boolean, right?: boolean}} [disabledShadowEdges] - Hide specific shadow edges while keeping hint affordances.
 * @returns {JSX.Element}
 */
export const ScrollShadow = ({
  wrapper = "",
  scrollContainer = "",
  dark = false,
  hideScrollBar = false,
  strength = 5,
  blur = "0.1875rem",
  direction = "auto",
  desktopOnly = false,
  alignToSelector = "",
  showIdleHint = false,
  showTooltip = false,
  tooltipText = "",
  idleHintDelay = DEFAULT_IDLE_HINT_DELAY,
  recalculateKey = 0,
  disabledEdges = EMPTY_HINT_EDGES,
  disabledShadowEdges = EMPTY_HINT_EDGES
}) => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (!desktopOnly || typeof window === "undefined") {
      return true;
    }
    return window.matchMedia("(min-width: 769px)").matches;
  });
  const shadowTopRef = useRef(null);
  const shadowBottomRef = useRef(null);
  const shadowLeftRef = useRef(null);
  const shadowRightRef = useRef(null);
  // keeps ids of any time-outs we set up for deferred initialisation
  const initTimeoutsRef = useRef([]);
  // rAF batching to avoid ResizeObserver feedback loops
  const rafIdRef = useRef(null);
  const idleHintTimeoutRef = useRef(null);
  const hintEdgesRef = useRef(EMPTY_HINT_EDGES);
  const scrollPositionRef = useRef({ top: 0, left: 0 });
  const isIdleHintVisibleRef = useRef(false);
  const scheduleUpdateRef = useRef(null);
  const [hintEdges, setHintEdges] = useState(EMPTY_HINT_EDGES);
  const [isIdleHintVisible, setIsIdleHintVisible] = useState(false);
  const [horizontalHintInset, setHorizontalHintInset] = useState({ left: 0, right: 0 });

  const setIdleHintVisible = useCallback((visible) => {
    isIdleHintVisibleRef.current = visible;
    setIsIdleHintVisible(visible);
  }, []);

  useEffect(() => {
    if (!desktopOnly || typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 769px)");
    const handleViewportChange = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, [desktopOnly]);

  useEffect(() => {
    if (desktopOnly && !isDesktop) {
      return;
    }

    if (!wrapper || !scrollContainer) {
      return;
    }

    const tryInitialize = () => {
      const ownNode =
        shadowTopRef.current ||
        shadowBottomRef.current ||
        shadowLeftRef.current ||
        shadowRightRef.current;
      const parentEl = ownNode ? ownNode.parentElement : null;
      const wrapperElement =
        document.getElementById(wrapper) || (parentEl?.id === wrapper ? parentEl : null);
      const scrollContainerElement =
        document.getElementById(scrollContainer) ||
        (wrapperElement
          ? Array.from(wrapperElement.querySelectorAll("[id]")).find(
              (element) => element.id === scrollContainer
            )
          : null) ||
        null;

      if (!scrollContainerElement || !wrapperElement) {
        return false; // Elements not ready yet
      }

      const updateShadows = () => {
        const nextHintEdges = { ...EMPTY_HINT_EDGES };
        const getAlignedElement = () => {
          if (!alignToSelector) {
            return null;
          }
          return wrapperElement.querySelector(alignToSelector);
        };

        const applyVerticalAlignment = () => {
          if (!(direction === "auto" || direction === "vertical")) {
            return;
          }

          if (!alignToSelector) {
            if (shadowTopRef.current && shadowBottomRef.current) {
              shadowTopRef.current.style.left = "0px";
              shadowTopRef.current.style.width = "100%";
              shadowBottomRef.current.style.left = "0px";
              shadowBottomRef.current.style.width = "100%";
            }
            return;
          }

          const alignElement = getAlignedElement();
          if (!alignElement) {
            if (shadowTopRef.current && shadowBottomRef.current) {
              shadowTopRef.current.style.left = "0px";
              shadowTopRef.current.style.width = "100%";
              shadowBottomRef.current.style.left = "0px";
              shadowBottomRef.current.style.width = "100%";
              shadowTopRef.current.style.setProperty("--scroll-opacity", 0);
              shadowBottomRef.current.style.setProperty("--scroll-opacity", 0);
            }
            return;
          }

          const wrapperRect = wrapperElement.getBoundingClientRect();
          const alignRect = alignElement.getBoundingClientRect();
          const leftOffset = Math.max(0, alignRect.left - wrapperRect.left);
          const width = Math.max(0, alignRect.width);

          if (shadowTopRef.current && shadowBottomRef.current) {
            shadowTopRef.current.style.left = `${leftOffset}px`;
            shadowTopRef.current.style.width = `${width}px`;
            shadowBottomRef.current.style.left = `${leftOffset}px`;
            shadowBottomRef.current.style.width = `${width}px`;
          }
        };

        const applyHorizontalAlignment = () => {
          if (!(direction === "auto" || direction === "horizontal")) {
            return;
          }

          if (!shadowLeftRef.current || !shadowRightRef.current) {
            return;
          }

          const wrapperRect = wrapperElement.getBoundingClientRect();
          const scrollContainerRect = scrollContainerElement.getBoundingClientRect();
          const leftOffset = Math.max(0, scrollContainerRect.left - wrapperRect.left);
          const rightOffset = Math.max(0, wrapperRect.right - scrollContainerRect.right);

          shadowLeftRef.current.style.left = `${leftOffset}px`;
          shadowRightRef.current.style.right = `${rightOffset}px`;
          setHorizontalHintInset((currentInset) => {
            if (currentInset.left === leftOffset && currentInset.right === rightOffset) {
              return currentInset;
            }
            return { left: leftOffset, right: rightOffset };
          });
        };

        // Handle vertical shadows (top/bottom)
        if (direction === "auto" || direction === "vertical") {
          const alignElement = getAlignedElement();

          if (alignElement) {
            // When aligning to a specific container, show shadows only if that container
            // is clipped by the scroll viewport (not merely when main has scrolled).
            const maxScrollTop =
              scrollContainerElement.scrollHeight - scrollContainerElement.clientHeight;
            const viewportRect = scrollContainerElement.getBoundingClientRect();
            const targetRect = alignElement.getBoundingClientRect();
            const epsilon = 1;
            const hasVerticalOverflow = maxScrollTop > VERTICAL_SCROLL_NOISE_THRESHOLD;
            const opacityTop =
              hasVerticalOverflow && targetRect.top < viewportRect.top - epsilon ? 1 : 0;
            const opacityBottom =
              hasVerticalOverflow && targetRect.bottom > viewportRect.bottom + epsilon ? 1 : 0;

            if (shadowTopRef.current && shadowBottomRef.current) {
              shadowTopRef.current.style.setProperty(
                "--scroll-opacity",
                disabledEdges.top || disabledShadowEdges.top ? 0 : opacityTop
              );
              shadowBottomRef.current.style.setProperty(
                "--scroll-opacity",
                disabledEdges.bottom || disabledShadowEdges.bottom ? 0 : opacityBottom
              );
            }

            nextHintEdges.top = !disabledEdges.top && Boolean(opacityTop);
            nextHintEdges.bottom = !disabledEdges.bottom && Boolean(opacityBottom);
          } else {
            const scrollTop = scrollContainerElement.scrollTop;
            const maxScrollTop =
              scrollContainerElement.scrollHeight - scrollContainerElement.clientHeight;

            if (maxScrollTop > VERTICAL_SCROLL_NOISE_THRESHOLD) {
              // Top shadow: visible when scrolled down (scrollTop > 0)
              // Bottom shadow: visible when not at bottom (scrollTop < maxScrollTop)
              // Ignore tiny layout noise from modal sizing/rounding before showing affordances.
              const boundaryEpsilon = 1;
              const opacityTop = scrollTop > boundaryEpsilon ? 1 : 0;
              const opacityBottom = scrollTop < maxScrollTop - boundaryEpsilon ? 1 : 0;

              if (shadowTopRef.current && shadowBottomRef.current) {
                shadowTopRef.current.style.setProperty(
                  "--scroll-opacity",
                  disabledEdges.top || disabledShadowEdges.top ? 0 : opacityTop
                );
                shadowBottomRef.current.style.setProperty(
                  "--scroll-opacity",
                  disabledEdges.bottom || disabledShadowEdges.bottom ? 0 : opacityBottom
                );
              }

              nextHintEdges.top = !disabledEdges.top && Boolean(opacityTop);
              nextHintEdges.bottom = !disabledEdges.bottom && Boolean(opacityBottom);
            } else {
              if (shadowTopRef.current && shadowBottomRef.current) {
                shadowTopRef.current.style.setProperty("--scroll-opacity", 0);
                shadowBottomRef.current.style.setProperty("--scroll-opacity", 0);
              }
            }
          }
        }

        applyVerticalAlignment();
        if (alignToSelector && !getAlignedElement()) {
          nextHintEdges.top = false;
          nextHintEdges.bottom = false;
        }
        applyHorizontalAlignment();

        // Handle horizontal shadows (left/right)
        if (direction === "auto" || direction === "horizontal") {
          const scrollLeft = scrollContainerElement.scrollLeft;
          const maxScrollLeft =
            scrollContainerElement.scrollWidth - scrollContainerElement.clientWidth;

          if (maxScrollLeft > 0) {
            // Left shadow: visible when scrolled right (scrollLeft > 0)
            // Right shadow: visible when not at right edge (scrollLeft < maxScrollLeft)
            const boundaryEpsilon = 1;
            const opacityLeft = scrollLeft > boundaryEpsilon ? 1 : 0;
            const opacityRight = scrollLeft < maxScrollLeft - boundaryEpsilon ? 1 : 0;

            if (shadowLeftRef.current && shadowRightRef.current) {
              shadowLeftRef.current.style.setProperty(
                "--scroll-opacity",
                disabledEdges.left || disabledShadowEdges.left ? 0 : opacityLeft
              );
              shadowRightRef.current.style.setProperty(
                "--scroll-opacity",
                disabledEdges.right || disabledShadowEdges.right ? 0 : opacityRight
              );
            }

            nextHintEdges.left = !disabledEdges.left && Boolean(opacityLeft);
            nextHintEdges.right = !disabledEdges.right && Boolean(opacityRight);
          } else {
            if (shadowLeftRef.current && shadowRightRef.current) {
              shadowLeftRef.current.style.setProperty("--scroll-opacity", 0);
              shadowRightRef.current.style.setProperty("--scroll-opacity", 0);
            }
          }
        }

        if (!(showIdleHint || showTooltip)) {
          return;
        }

        if (!areHintEdgesEqual(hintEdgesRef.current, nextHintEdges)) {
          hintEdgesRef.current = nextHintEdges;
          setHintEdges(nextHintEdges);
        }

        const hasAvailableScroll = Object.values(nextHintEdges).some(Boolean);
        if (!hasAvailableScroll) {
          if (idleHintTimeoutRef.current != null) {
            clearTimeout(idleHintTimeoutRef.current);
            idleHintTimeoutRef.current = null;
          }
          setIdleHintVisible(false);
          return;
        }

        if (
          (showIdleHint || showTooltip) &&
          !isIdleHintVisibleRef.current &&
          idleHintTimeoutRef.current == null
        ) {
          idleHintTimeoutRef.current = setTimeout(() => {
            idleHintTimeoutRef.current = null;
            setIdleHintVisible(true);
          }, idleHintDelay);
        }
      };

      const scheduleUpdate = () => {
        if (rafIdRef.current != null) return;
        // Double RAF ensures we run after browser has painted (layout complete)
        rafIdRef.current = window.requestAnimationFrame(() => {
          rafIdRef.current = window.requestAnimationFrame(() => {
            rafIdRef.current = null;
            updateShadows();
          });
        });
      };
      scheduleUpdateRef.current = scheduleUpdate;

      // Accordion/open panels often grow via style/class without changing the
      // scroll box size — ResizeObserver alone misses that scrollHeight change.
      const contentObserver = new MutationObserver(scheduleUpdate);
      contentObserver.observe(scrollContainerElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["style", "class", "data-open"]
      });

      scheduleUpdate(); // ➊ immediate calculation (batched)

      // extra retries so shadows appear even if content inflates later
      // includes longer delays for popovers/modals that may have animation delays
      const delays = [16, 50, 100, 200, 350];
      const retryTimeouts = delays.map((t) => setTimeout(scheduleUpdate, t));
      initTimeoutsRef.current.push(...retryTimeouts);

      // ➊ observe wrapper (keeps old behaviour) - with debounced callback
      const debouncedScheduleUpdate = debounceResizeCallback(scheduleUpdate);
      const wrapperObserver = new ResizeObserver(debouncedScheduleUpdate);
      wrapperObserver.observe(wrapperElement);

      // ➋ NEW — observe the scroll container itself - with debounced callback
      const containerResizeObserver = new ResizeObserver(debouncedScheduleUpdate);
      containerResizeObserver.observe(scrollContainerElement);

      if (hideScrollBar) {
        scrollContainerElement.classList.add(styles["hide_scrollbar"]);
      } else {
        scrollContainerElement.classList.remove(styles["hide_scrollbar"]);
      }

      scrollPositionRef.current = {
        top: scrollContainerElement.scrollTop,
        left: scrollContainerElement.scrollLeft
      };

      const handleScroll = () => {
        const previousPosition = scrollPositionRef.current;
        const nextPosition = {
          top: scrollContainerElement.scrollTop,
          left: scrollContainerElement.scrollLeft
        };
        const deltaTop = nextPosition.top - previousPosition.top;
        const deltaLeft = nextPosition.left - previousPosition.left;
        scrollPositionRef.current = nextPosition;

        if (didScrollTowardHint(hintEdgesRef.current, deltaTop, deltaLeft, direction)) {
          if (idleHintTimeoutRef.current != null) {
            clearTimeout(idleHintTimeoutRef.current);
            idleHintTimeoutRef.current = null;
          }
          setIdleHintVisible(false);
        }

        scheduleUpdate();
      };

      scrollContainerElement.addEventListener("scroll", handleScroll, { passive: true });

      // Store cleanup function
      const cleanup = () => {
        scrollContainerElement.removeEventListener("scroll", handleScroll);
        wrapperObserver.disconnect();
        containerResizeObserver.disconnect(); // ➌ NEW
        contentObserver.disconnect();
        if (rafIdRef.current != null) {
          const cancelFrame = window.cancelAnimationFrame || window.clearTimeout;
          cancelFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (idleHintTimeoutRef.current != null) {
          clearTimeout(idleHintTimeoutRef.current);
          idleHintTimeoutRef.current = null;
        }
        if (scheduleUpdateRef.current === scheduleUpdate) {
          scheduleUpdateRef.current = null;
        }
      };

      return cleanup;
    };

    // Try to initialize immediately, then keep retrying if elements aren't ready
    let cleanup = tryInitialize();

    if (!cleanup) {
      // Elements not ready, set up retry attempts
      // Includes longer delays for elements in portals (Tippy, modals) which may render asynchronously
      const retryDelays = [10, 25, 50, 100, 200, 350, 500];
      const retryTimeouts = retryDelays.map((delay) =>
        setTimeout(() => {
          if (!cleanup) {
            cleanup = tryInitialize();
          }
        }, delay)
      );
      initTimeoutsRef.current.push(...retryTimeouts);
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
      // clear pending time-outs
      initTimeoutsRef.current.forEach(clearTimeout);
      initTimeoutsRef.current = [];
      if (idleHintTimeoutRef.current != null) {
        clearTimeout(idleHintTimeoutRef.current);
        idleHintTimeoutRef.current = null;
      }
    };
  }, [
    wrapper,
    scrollContainer,
    hideScrollBar,
    strength,
    direction,
    desktopOnly,
    isDesktop,
    alignToSelector,
    showIdleHint,
    showTooltip,
    idleHintDelay,
    setIdleHintVisible,
    disabledEdges.top,
    disabledEdges.bottom,
    disabledEdges.left,
    disabledEdges.right,
    disabledShadowEdges.top,
    disabledShadowEdges.bottom,
    disabledShadowEdges.left,
    disabledShadowEdges.right
  ]);

  useEffect(() => {
    scheduleUpdateRef.current?.();
  }, [recalculateKey]);

  if (desktopOnly && !isDesktop) {
    return null;
  }

  const visibleHintEdges = HINT_EDGE_ORDER.filter((edge) => hintEdges[edge]);
  const shouldRenderHints = visibleHintEdges.length > 0 && (showIdleHint || showTooltip);
  const effectiveTooltipText = tooltipText || i18n.t("ui.toolkit.scrollShadow.tooltip");
  const interactiveHintEdge = showTooltip ? visibleHintEdges[0] : null;

  const renderHint = (edge) => {
    const isInteractive = edge === interactiveHintEdge && isIdleHintVisible;
    const hintStyle = {
      zIndex: 1000,
      ...(edge === "left"
        ? { left: `calc(${horizontalHintInset.left}px + var(--size-space-200))` }
        : {}),
      ...(edge === "right"
        ? { right: `calc(${horizontalHintInset.right}px + var(--size-space-200))` }
        : {})
    };

    return (
      <button
        type="button"
        key={edge}
        className={styles.scroll_hint}
        data-edge={edge}
        data-idle={showIdleHint && isIdleHintVisible ? "true" : undefined}
        data-tooltip={showTooltip ? "true" : undefined}
        data-visible={isIdleHintVisible ? "true" : undefined}
        style={hintStyle}
        tabIndex={isInteractive ? 0 : -1}
        aria-label={isInteractive ? effectiveTooltipText : undefined}
        aria-hidden={!isInteractive}>
        {getHintIcon(edge)}
      </button>
    );
  };

  const hintAffordances = shouldRenderHints
    ? visibleHintEdges.map((edge) => {
        const hint = renderHint(edge);

        if (!showTooltip) {
          return hint;
        }

        return (
          <Tippy
            key={edge}
            content={effectiveTooltipText}
            placement={getHintPlacement(edge)}
            appendTo={getOverlayPortalTarget}>
            {hint}
          </Tippy>
        );
      })
    : null;

  return (
    <>
      {(direction === "auto" || direction === "vertical") && (
        <>
          <div
            className={clsx(styles["scroll-shadow"], styles["shadow--top"])}
            data-dark={dark ? "true" : undefined}
            style={{ "--shadow-strength": strength, "--shadow-blur": blur, zIndex: 999 }}
            ref={shadowTopRef}></div>
          <div
            className={clsx(styles["scroll-shadow"], styles["shadow--bottom"])}
            data-dark={dark ? "true" : undefined}
            style={{ "--shadow-strength": strength, "--shadow-blur": blur, zIndex: 999 }}
            ref={shadowBottomRef}></div>
        </>
      )}
      {(direction === "auto" || direction === "horizontal") && (
        <>
          <div
            className={clsx(styles["scroll-shadow"], styles["shadow--left"])}
            data-dark={dark ? "true" : undefined}
            style={{ "--shadow-strength": strength, "--shadow-blur": blur, zIndex: 999 }}
            ref={shadowLeftRef}></div>
          <div
            className={clsx(styles["scroll-shadow"], styles["shadow--right"])}
            data-dark={dark ? "true" : undefined}
            style={{ "--shadow-strength": strength, "--shadow-blur": blur, zIndex: 999 }}
            ref={shadowRightRef}></div>
        </>
      )}
      {hintAffordances}
    </>
  );
};
