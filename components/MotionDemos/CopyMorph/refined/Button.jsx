// Portfolio refinement of the toolkit Button's copy -> "Copied" morph. Everything that is
// not part of the copy morph is the original file unchanged. What changed and why:
// 1. Both states render all the time, stacked in one grid cell (copy icon + CheckSquare,
//    label + "Copied"). The original swapped elements wholesale, so nothing overlapped
//    and each swap was a hard cut softened only by an entry keyframe.
// 2. CSS transitions instead of keyframes (opacity 0 -> 1, blur, scale on the toolkit
//    enter curve). The keyframes started at opacity 0.5, which read as a pop. Transitions
//    are also interruptible: a re-click mid-return reverses from where it is.
// 3. Symmetric return. The original morph-out blurred the RESTORED label/icon to 0.5 and
//    then snapped it back to normal when the class came off.
// 4. Same font size. "Copied" used to drop to the small size, a jump on every click.
// 5. Width animates. The label stack measures both labels and grows to the wider one
//    (never shrinks while copied, so the icon stays pinned and neighbours don't jump),
//    then eases back. The original hard-locked the width in px, switched the text to
//    absolute positioning and disabled every transition (hover scale included) meanwhile.
// 6. Hold 1500ms (was 800ms), long enough to actually read "Copied".
// 7. prefers-reduced-motion: opacity-only crossfade, no blur/scale/width motion.
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { Loader } from "../../adtraction/components/tokens/loader/Loader";
import styles from "./Button.module.scss";
import clsx from "clsx";
import { Icons } from "@adtraction/ui-icons";

import { i18n } from "@adtraction/shared-i18n";

// Cross-mount width cache to stabilize width when rapidly swapping different buttons
let lastStableButtonWidthPx = null;
let lastStableButtonWidthAt = 0;
const DEFAULT_WIDTH_TTL_MS = 300;

const copyIconTypes = [
  Icons.General.Copy01,
  Icons.General.Copy02,
  Icons.General.Copy03,
  Icons.General.Copy04,
  Icons.General.Copy05,
  Icons.General.Copy06
];

const isCopyIcon = (iconElement) => {
  if (!iconElement || !iconElement.type) return false;
  return copyIconTypes.includes(iconElement.type);
};

/**
 * Button is a versatile CTA component supporting multiple types, sizes, icons and loading/disabled states.
 *
 * @param {string} [text=""] - Button label text. When empty, the button is considered icon-only.
 * @param {React.ReactElement|null} [iconLeft=null] - Icon to render on the left side of the label.
 * @param {React.ReactElement|null} [iconRight=null] - Icon to render on the right side of the label.
 * @param {("primary"|"secondary"|"ghost"|"ghost_success"|"ghost_warning"|"ghost_danger"|"peach")} [type="primary"] - Visual style variant.
 * @param {("small"|"default"|"large")} [size="default"] - Size variant.
 * @param {boolean} [rounded=false] - If true, renders fully rounded corners.
 * @param {boolean} [fitContent=true] - If true, width fits content; otherwise can expand.
 * @param {boolean} [disabled=false] - Disables interaction and styles accordingly.
 * @param {boolean} [loading=false] - Shows loader and prevents interaction.
 * @param {function} [onClick=() => {}] - Click handler. Ignored when disabled or loading.
 * @param {string} [className=""] - Additional class names to append to the container.
 * @param {string} [ariaLabel=""] - Custom accessible label, useful for icon-only buttons.
 * @returns {JSX.Element}
 */
export const Button = ({
  // Content props
  text = "",
  iconLeft = null,
  iconRight = null,

  // Appearance props
  type = "primary",
  size = "default",
  rounded = false,
  fitContent = true,

  // State props
  disabled = false,
  loading = false,

  // Event handlers
  onClick = () => {},

  // Hidden props
  className = "",
  ariaLabel = "",

  // Performance/UX props
  // When > 0, transiently locks button min-width after rapid content changes to avoid flicker
  debounceContentMs = 0
}) => {
  const [iconSize, setIconSize] = useState("var(--size-icon-small)");
  const [buttonWidth, setButtonWidth] = useState(null);
  const [iconOnly, setIconOnly] = useState(true);
  const [isCopyAnimating, setIsCopyAnimating] = useState(false);
  const [isMorphingOut, setIsMorphingOut] = useState(false);
  const buttonRef = useRef(null);
  const buttonWidthRef = useRef(null);
  const loadingRef = useRef(loading);
  const [lockedMinWidthPx, setLockedMinWidthPx] = useState(null);
  const prevWidthRef = useRef(null);
  const widthUnlockTimerRef = useRef(null);
  const copyAnimationTimeoutRef = useRef(null);
  const morphOutTimeoutRef = useRef(null);
  const labelStackRef = useRef(null);
  const labelRef = useRef(null);
  const copiedLabelRef = useRef(null);

  // Generate aria-label dynamically based on component state
  const generateAriaLabel = () => {
    if (loading) {
      return i18n.t("ui.toolkit.button.loading");
    } else if (text) {
      return i18n.t("ui.toolkit.button.ariaLabel", { text });
    } else {
      return i18n.t("ui.toolkit.button.button");
    }
  };

  useEffect(() => {
    if (size === "small" || size === "default") {
      setIconSize("var(--size-icon-small)");
    } else {
      setIconSize("var(--size-icon-medium)");
    }
  }, [size]);

  useEffect(() => {
    if (text === "") {
      setIconOnly(true);
    } else {
      setIconOnly(false);
    }
  }, [text]);

  const hasCopyIconLeft = useMemo(() => isCopyIcon(iconLeft), [iconLeft]);
  const hasCopyIconRight = useMemo(() => isCopyIcon(iconRight), [iconRight]);
  const hasCopyIcon = hasCopyIconLeft || hasCopyIconRight;

  useLayoutEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    return () => {
      if (copyAnimationTimeoutRef.current) {
        clearTimeout(copyAnimationTimeoutRef.current);
      }
      if (morphOutTimeoutRef.current) {
        clearTimeout(morphOutTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if ((disabled || loading) && (isCopyAnimating || isMorphingOut)) {
      setIsCopyAnimating(false);
      setIsMorphingOut(false);
      if (copyAnimationTimeoutRef.current) {
        clearTimeout(copyAnimationTimeoutRef.current);
      }
      if (morphOutTimeoutRef.current) {
        clearTimeout(morphOutTimeoutRef.current);
      }
    }
  }, [disabled, loading, isCopyAnimating, isMorphingOut]);

  // Width follows the label stack: px from the current label, then to the wider of the two
  // while copied, back to the label on return, and auto again at rest (font loads, text
  // changes). Inline px because CSS can't transition to or from auto.
  useLayoutEffect(() => {
    const stack = labelStackRef.current;
    if (!stack || !labelRef.current || !copiedLabelRef.current) return;
    const labelWidth = labelRef.current.offsetWidth;
    if (isCopyAnimating) {
      if (!stack.style.width) {
        stack.style.width = `${labelWidth}px`;
        stack.getBoundingClientRect(); // commit the start width so the next one transitions
      }
      stack.style.width = `${Math.max(labelWidth, copiedLabelRef.current.offsetWidth)}px`;
    } else if (isMorphingOut) {
      stack.style.width = `${labelWidth}px`;
    } else {
      stack.style.width = "";
    }
  }, [isCopyAnimating, isMorphingOut]);

  // If another button was just visible, borrow its last width to avoid initial shrink on mount
  useLayoutEffect(() => {
    if (
      debounceContentMs > 0 &&
      typeof lastStableButtonWidthPx === "number" &&
      Date.now() - lastStableButtonWidthAt < (debounceContentMs || DEFAULT_WIDTH_TTL_MS)
    ) {
      setLockedMinWidthPx(lastStableButtonWidthPx);
    }
  }, [debounceContentMs]);

  // Observe width changes and stabilize during rapid content swaps
  useLayoutEffect(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement) return;

    const thresholdPx = 0.5;

    const clearWidthUnlockTimer = () => {
      if (!widthUnlockTimerRef.current) return;
      clearTimeout(widthUnlockTimerRef.current);
      widthUnlockTimerRef.current = null;
    };

    const lockMinWidthIfNeeded = (nextWidth) => {
      if (debounceContentMs <= 0 || typeof prevWidthRef.current !== "number") return;
      if (Math.abs(prevWidthRef.current - nextWidth) <= thresholdPx) return;

      const targetMinWidth = Math.max(prevWidthRef.current, nextWidth);
      setLockedMinWidthPx(targetMinWidth);

      clearWidthUnlockTimer();
      widthUnlockTimerRef.current = window.setTimeout(() => {
        setLockedMinWidthPx(null);
        widthUnlockTimerRef.current = null;
      }, debounceContentMs);
    };

    const syncButtonWidth = () => {
      const { width } = buttonElement.getBoundingClientRect();
      if (!Number.isFinite(width) || width <= 0) return;

      if (!loadingRef.current) {
        const previousWidth = buttonWidthRef.current;
        const hasMeaningfulChange =
          typeof previousWidth !== "number" || Math.abs(previousWidth - width) > thresholdPx;

        if (hasMeaningfulChange) {
          buttonWidthRef.current = width;
          setButtonWidth(width);
          lastStableButtonWidthPx = width;
          lastStableButtonWidthAt = Date.now();
        }
      }

      lockMinWidthIfNeeded(width);
      prevWidthRef.current = width;
    };

    syncButtonWidth();

    if (typeof window !== "undefined" && typeof window.ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(syncButtonWidth);
      resizeObserver.observe(buttonElement);

      return () => {
        resizeObserver.disconnect();
        clearWidthUnlockTimer();
      };
    }

    let animationFrameId = window.requestAnimationFrame(function tick() {
      syncButtonWidth();
      animationFrameId = window.requestAnimationFrame(tick);
    });

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      clearWidthUnlockTimer();
    };
  }, [debounceContentMs]);

  const handleClick = (event) => {
    if (disabled || loading) return;

    if ((hasCopyIconLeft || hasCopyIconRight) && !isCopyAnimating) {
      if (copyAnimationTimeoutRef.current) {
        clearTimeout(copyAnimationTimeoutRef.current);
      }
      if (morphOutTimeoutRef.current) {
        clearTimeout(morphOutTimeoutRef.current);
      }

      setIsMorphingOut(false);
      setIsCopyAnimating(true);

      copyAnimationTimeoutRef.current = window.setTimeout(() => {
        setIsCopyAnimating(false);
        setIsMorphingOut(true);
        copyAnimationTimeoutRef.current = null;

        morphOutTimeoutRef.current = window.setTimeout(() => {
          setIsMorphingOut(false);
          morphOutTimeoutRef.current = null;
        }, 250);
      }, 1500);
    }

    onClick(event);
  };

  const widthForLoading = buttonWidthRef.current ?? buttonWidth ?? null;

  return (
    <button
      className={clsx(styles.button_container, styles[size], styles[type], className)}
      ref={buttonRef}
      data-fit-content={fitContent}
      data-rounded={rounded}
      data-disabled={disabled}
      data-icon-only={iconOnly}
      data-loading={loading}
      data-copied={isCopyAnimating}
      data-copy-icon-side={
        hasCopyIconLeft && hasCopyIconRight
          ? "both"
          : hasCopyIconLeft
            ? "left"
            : hasCopyIconRight
              ? "right"
              : undefined
      }
      onClick={handleClick}
      aria-label={ariaLabel || generateAriaLabel()}
      style={
        loading
          ? {
              "--button-width": widthForLoading ? `${widthForLoading}px` : undefined,
              minWidth: lockedMinWidthPx ? `${lockedMinWidthPx}px` : undefined
            }
          : {
              minWidth: lockedMinWidthPx ? `${lockedMinWidthPx}px` : undefined
            }
      }>
      {loading ? (
        <Loader size={size} />
      ) : (
        <>
          {iconLeft !== null &&
            (hasCopyIconLeft ? (
              <span className={styles.morph_stack}>
                <span className={styles.morph_from}>
                  <iconLeft.type {...iconLeft.props} width={iconSize} height={iconSize} />
                </span>
                <span className={styles.morph_to}>
                  <Icons.General.CheckSquare {...iconLeft.props} width={iconSize} height={iconSize} />
                </span>
              </span>
            ) : (
              <div className={styles.icon_animation_wrapper}>
                <iconLeft.type {...iconLeft.props} width={iconSize} height={iconSize} />
              </div>
            ))}
          {!iconOnly &&
            (hasCopyIcon ? (
              <span className={styles.morph_stack} ref={labelStackRef}>
                <span ref={labelRef} className={clsx(styles.button_text, styles.morph_from)}>
                  {text}
                </span>
                <span
                  ref={copiedLabelRef}
                  className={clsx(styles.button_text, styles.morph_to)}
                  aria-hidden="true">
                  {i18n.t("ui.toolkit.button.copied")}
                </span>
              </span>
            ) : (
              <p className={styles.button_text}>{text}</p>
            ))}
          {iconRight !== null &&
            (hasCopyIconRight ? (
              <span className={styles.morph_stack}>
                <span className={styles.morph_from}>
                  <iconRight.type {...iconRight.props} width={iconSize} height={iconSize} />
                </span>
                <span className={styles.morph_to}>
                  <Icons.General.CheckSquare {...iconRight.props} width={iconSize} height={iconSize} />
                </span>
              </span>
            ) : (
              <div className={styles.icon_animation_wrapper}>
                <iconRight.type {...iconRight.props} width={iconSize} height={iconSize} />
              </div>
            ))}
        </>
      )}
    </button>
  );
};
