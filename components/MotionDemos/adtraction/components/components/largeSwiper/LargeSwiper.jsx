import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback
} from "react";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { LargeSwiperStates } from "./LargeSwiperStates";
import { Toaster } from "../../tokens/toaster/Toaster";
import styles from "./LargeSwiper.module.scss";
import { placeholderStyles } from "../../tokens/placeholderSkeleton/PlaceholderSkeleton";
import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";
import { writeToClipboard } from "@adtraction/util-clipboard";

export const LargeSwiper = forwardRef(
  (
    {
      // Content
      text = null,

      // States
      initialState = LargeSwiperStates.APPLY,
      unlockedState = LargeSwiperStates.APPLICATION_SENT,
      isUnlocked = false,

      // Interaction
      disabled = false,
      loading = false,
      onUnlock = () => {},
      onClick = () => {},

      // Automatic transitions
      autoTransition = false,
      reviewerType = "unknown", // "manager", "brand", or "unknown"
      onStateChange = () => {}, // Callback when state automatically changes

      // Styling
      className = "",

      // Behavior controls
      paused = false
    },
    ref
  ) => {
    const swiperRef = useRef(null);
    const thumbRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(0);
    const [hasStartedHoldingThumb, setHasStartedHoldingThumb] = useState(false);
    const [currentUnlockedState, setCurrentUnlockedState] = useState(unlockedState);

    const effectiveText = text ?? i18n.t("ui.toolkit.swiper.unlock");

    const [transitionText, setTransitionText] = useState(effectiveText);
    const [displayText, setDisplayText] = useState(effectiveText);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isCopyAnimating, setIsCopyAnimating] = useState(false);
    const [isMorphingOut, setIsMorphingOut] = useState(false);
    const dragThreshold = 0.5;
    const pausedRef = useRef(paused);
    const copyAnimationTimeoutRef = useRef(null);
    const morphOutTimeoutRef = useRef(null);
    const animationFrameRef = useRef(null);

    useEffect(() => {
      pausedRef.current = paused;
    }, [paused]);

    // Automatically detect if swiper is interactive based on callbacks
    const isInteractable =
      (Boolean(onUnlock && typeof onUnlock === "function") &&
        !onUnlock.toString().includes("() => {}")) ||
      (Boolean(onClick && typeof onClick === "function") &&
        !onClick.toString().includes("() => {}"));

    const isLoading = loading;
    const isDisabled = disabled;
    const isCopyLinkState = currentUnlockedState.isLink === true;
    const shouldShowCopiedText = isCopyLinkState && isCopyAnimating;

    // Generate aria-label dynamically based on component state and current unlocked state
    const generateAriaLabel = () => {
      if (isLoading) {
        return i18n.t("ui.toolkit.swiper.loading");
      }
      if (isDisabled) {
        return i18n.t("ui.toolkit.swiper.disabled", { text: transitionText });
      } else if (isUnlocked) {
        // Different messages based on the current unlocked state
        switch (currentUnlockedState.id) {
          case "application-sent":
            return i18n.t("ui.toolkit.swiper.applicationSentAria", { text: transitionText });
          case "processing-application":
          case "processing-application-manager":
          case "processing-application-brand":
            return i18n.t("ui.toolkit.swiper.processingAria", { text: transitionText });
          case "rejected":
            return i18n.t("ui.toolkit.swiper.rejectedAria", { text: transitionText });
          case "copy-link":
            return i18n.t("ui.toolkit.swiper.linkAria", { text: transitionText });
          default:
            if (currentUnlockedState.isLink) {
              return i18n.t("ui.toolkit.swiper.linkAria", { text: transitionText });
            } else if (currentUnlockedState.cursor === "wait") {
              return i18n.t("ui.toolkit.swiper.processingAria", { text: transitionText });
            } else {
              return i18n.t("ui.toolkit.swiper.statusAria", { text: transitionText });
            }
        }
      } else if (isInteractable) {
        return i18n.t("ui.toolkit.swiper.interactiveAria", { text: transitionText });
      } else {
        return i18n.t("ui.toolkit.swiper.basicAria", { text: transitionText });
      }
    };

    const [dimensions, setDimensions] = useState({
      thumbWidth: 0,
      swiperWidth: 0,
      swiperInnerWidth: 0
    });

    useEffect(() => {
      const el = swiperRef.current;
      const thumb = thumbRef.current;
      if (!(el instanceof Element) || !(thumb instanceof Element)) return;

      const updateDimensions = () => {
        // Guard against RO firing after unmount or ref changes
        if (!(el instanceof Element) || !(thumb instanceof Element)) return;
        const computedStyle = window.getComputedStyle(el);
        const newDimensions = {
          thumbWidth: thumb.offsetWidth,
          swiperWidth: el.offsetWidth - thumb.offsetWidth,
          swiperInnerWidth:
            el.offsetWidth -
            thumb.offsetWidth -
            parseFloat(computedStyle.paddingLeft) -
            parseFloat(computedStyle.paddingRight)
        };
        setDimensions(newDimensions);

        if (isUnlocked) {
          setPosition(newDimensions.swiperInnerWidth);
        }
      };

      updateDimensions();

      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(el);

      return () => {
        resizeObserver.disconnect();
      };
    }, [isUnlocked]);

    const getEventCoordinates = (e) => {
      const touch = e?.touches?.[0] ?? e?.changedTouches?.[0];
      return {
        clientX: touch?.clientX ?? e?.clientX ?? 0,
        clientY: touch?.clientY ?? e?.clientY ?? 0
      };
    };

    const calculatePosition = (e) => {
      const el = swiperRef.current;
      if (!(el instanceof Element)) return 0;
      const swiperRect = el.getBoundingClientRect();
      const { clientX } = getEventCoordinates(e);
      let newPosition = clientX - swiperRect.left - dimensions.thumbWidth / 2;

      newPosition = Math.max(0, Math.min(newPosition, dimensions.swiperInnerWidth));
      return newPosition;
    };

    const isEventInsideSwiper = (e) => {
      const el = swiperRef.current;
      if (!(el instanceof Element)) return false;
      const swiperRect = el.getBoundingClientRect();
      const { clientX, clientY } = getEventCoordinates(e);

      return (
        clientX >= swiperRect.left &&
        clientX <= swiperRect.right &&
        clientY >= swiperRect.top &&
        clientY <= swiperRect.bottom
      );
    };

    const cancelPositionAnimation = useCallback(() => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }, []);

    const animateToPosition = useCallback(
      (targetPosition) => {
        const target = Math.max(0, Math.min(targetPosition, dimensions.swiperInnerWidth));

        cancelPositionAnimation();

        const step = () => {
          animationFrameRef.current = null;

          setPosition((prev) => {
            if (pausedRef.current) {
              return prev;
            }

            const direction = target > prev ? 1 : -1;
            const nextPosition = prev + direction * 6;
            const hasReachedTarget =
              direction > 0 ? nextPosition >= target : nextPosition <= target;

            if (prev === target || hasReachedTarget) {
              return target;
            }

            animationFrameRef.current = requestAnimationFrame(step);
            return nextPosition;
          });
        };

        animationFrameRef.current = requestAnimationFrame(step);
      },
      [cancelPositionAnimation, dimensions.swiperInnerWidth]
    );

    const animateToStart = useCallback(() => {
      animateToPosition(0);
    }, [animateToPosition]);

    const animateToEnd = useCallback(() => {
      animateToPosition(dimensions.swiperInnerWidth);
    }, [animateToPosition, dimensions.swiperInnerWidth]);

    const handleDragStart = (e) => {
      if (isLoading) return;
      if (pausedRef.current) return;
      if (isUnlocked) return;
      if (!isEventInsideSwiper(e)) return;

      cancelPositionAnimation();
      setIsDragging(false);

      const { clientX: startX } = getEventCoordinates(e);

      const handleMouseMove = (moveEvent) => {
        const { clientX: currentX } = getEventCoordinates(moveEvent);
        if (Math.abs(currentX - startX) > 5) {
          setIsDragging(true);
          setHasStartedHoldingThumb(true);

          const newPosition = calculatePosition(moveEvent);
          setPosition(newPosition);
        }
      };

      const handleMouseUp = (upEvent) => {
        handleDragEnd(upEvent);

        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("touchmove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchend", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);
    };

    const handleDragEnd = (e) => {
      if (isLoading) return;
      if (pausedRef.current) return;
      setIsDragging(false);
      const newPosition = calculatePosition(e);

      if (newPosition >= dimensions.swiperInnerWidth * dragThreshold) {
        animateToEnd();
        onUnlock();
      } else {
        animateToStart();
      }
    };

    const handleSwiperThumbClick = () => {
      if (isDragging) return;
      if (isLoading) return;
      if (pausedRef.current) return;
      // Handle click-to-unlock in APPLY state (not unlocked, at start position, no drag movement)
      if (!isUnlocked && position === 0 && !hasStartedHoldingThumb) {
        animateToEnd();
        onUnlock();
      }
      // Handle actions in unlocked states
      else if (isUnlocked) {
        if (currentUnlockedState.isLink) {
          copyToClipboard();
        }
        onClick();
      }

      setHasStartedHoldingThumb(false);
    };

    const copyToClipboard = async () => {
      if (isCopyLinkState && !isCopyAnimating) {
        if (copyAnimationTimeoutRef.current) {
          clearTimeout(copyAnimationTimeoutRef.current);
        }
        if (morphOutTimeoutRef.current) {
          clearTimeout(morphOutTimeoutRef.current);
        }

        setIsMorphingOut(false);
        setDisplayText(i18n.t("ui.toolkit.swiper.copied"));
        setIsCopyAnimating(true);

        copyAnimationTimeoutRef.current = window.setTimeout(() => {
          setIsCopyAnimating(false);
          setIsMorphingOut(true);
          copyAnimationTimeoutRef.current = null;

          setDisplayText(transitionText);

          morphOutTimeoutRef.current = window.setTimeout(() => {
            setIsMorphingOut(false);
            morphOutTimeoutRef.current = null;
          }, 300);
        }, 800);
      }

      try {
        await writeToClipboard(transitionText);
        Toaster.trigger({
          type: "success",
          title: i18n.t("ui.toolkit.editTrackingLinkModal.linkCopied"),
          description: i18n.t("ui.toolkit.editTrackingLinkModal.linkCopiedDescription"),
          autoDismiss: true,
          autoDismissTime: 3000
        });
      } catch {
        Toaster.trigger({
          type: "error",
          title: i18n.t("ui.toolkit.editTrackingLinkModal.copyFailed"),
          description: i18n.t("ui.toolkit.editTrackingLinkModal.copyFailedDescription"),
          autoDismiss: true,
          autoDismissTime: 4000
        });
      }
    };

    // Generate tooltip messages for waiting states
    const getTooltipMessage = () => {
      switch (currentUnlockedState.id) {
        case "application-sent":
          return i18n.t("ui.toolkit.swiper.tooltipSent");
        case "processing-application-manager":
          return i18n.t("ui.toolkit.swiper.tooltipManager");
        case "processing-application-brand":
          return i18n.t("ui.toolkit.swiper.tooltipBrand");
        case "processing-application":
          return i18n.t("ui.toolkit.swiper.tooltipProcessing");
        case "rejected":
          return i18n.t("ui.toolkit.swiper.tooltipRejected");
        default:
          return null;
      }
    };

    // Check if current state should show tooltip
    const shouldShowTooltip = () => {
      const tooltipStates = [
        "application-sent",
        "processing-application-manager",
        "processing-application-brand",
        "processing-application",
        "rejected"
      ];
      return isUnlocked && tooltipStates.includes(currentUnlockedState.id);
    };

    const handleDrag = (e) => {
      if (isLoading) return;
      if (pausedRef.current) return;
      if (!isDragging || isUnlocked) return;
      e.preventDefault();

      const newPosition = calculatePosition(e);
      setPosition(newPosition);
    };

    useEffect(() => {
      const handleDragGlobal = (e) => {
        if (isDragging) {
          handleDrag(e);
        }
      };

      const handleDragEndGlobal = (e) => {
        if (isDragging) {
          handleDragEnd(e);
        }
      };

      document.addEventListener("mousemove", handleDragGlobal);
      document.addEventListener("touchmove", handleDragGlobal);
      document.addEventListener("mouseup", handleDragEndGlobal);
      document.addEventListener("touchend", handleDragEndGlobal);

      return () => {
        document.removeEventListener("mousemove", handleDragGlobal);
        document.removeEventListener("touchmove", handleDragGlobal);
        document.removeEventListener("mouseup", handleDragEndGlobal);
        document.removeEventListener("touchend", handleDragEndGlobal);
      };
    }, [isDragging]);

    useEffect(() => {
      if (isLoading) {
        animateToStart();
      } else if (!pausedRef.current && isUnlocked && dimensions.swiperInnerWidth) {
        // When unlocking after being paused (e.g., after modal confirmation),
        // we need to ensure the position reaches the end for proper visual transitions.
        // Use setPosition callback to check current position and decide whether to snap or animate.
        setPosition((currentPos) => {
          if (currentPos < dimensions.swiperInnerWidth * 0.5) {
            // Position is below threshold (click-to-unlock case where animation was paused)
            // Snap to end immediately for proper visual transition
            return dimensions.swiperInnerWidth;
          }
          // Position is already past threshold - let animateToEnd handle it
          return currentPos;
        });
        // Still call animateToEnd to handle cases where position is past threshold but not at end
        animateToEnd();
      } else if (!isUnlocked && !isDragging) {
        animateToStart();
      }
    }, [
      isUnlocked,
      dimensions.swiperInnerWidth,
      isLoading,
      paused,
      isDragging,
      animateToStart,
      animateToEnd
    ]);

    // Automatic transition from APPLICATION_SENT to PROCESSING state
    useEffect(() => {
      if (!autoTransition || !isUnlocked || currentUnlockedState.id !== "application-sent") {
        return;
      }

      const transitionDelay = 2000; // 2 seconds to show "Application sent" message

      const timer = setTimeout(() => {
        // Start the morphing transition
        setIsTransitioning(true);

        // Determine which processing state based on reviewer type
        let newProcessingState;
        let newText;

        if (reviewerType === "manager") {
          newProcessingState = LargeSwiperStates.PROCESSING_APPLICATION_MANAGER;
          newText = i18n.t("ui.toolkit.swiper.pendingApproval");
        } else if (reviewerType === "brand") {
          newProcessingState = LargeSwiperStates.PROCESSING_APPLICATION_BRAND;
          newText = i18n.t("ui.toolkit.swiper.pendingApproval");
        } else {
          newProcessingState = LargeSwiperStates.PROCESSING_APPLICATION;
          newText = i18n.t("ui.toolkit.swiper.pendingApproval");
        }

        // Smooth transition: First fade out text, then change state, then fade in new text
        setTimeout(() => {
          setTransitionText(newText);
        }, 300); // Change text halfway through transition

        setTimeout(() => {
          setCurrentUnlockedState(newProcessingState);
          setIsTransitioning(false);

          // Notify parent component of state change
          onStateChange({
            newState: newProcessingState,
            reviewerType,
            text: newText
          });
        }, 600); // Complete transition
      }, transitionDelay);

      return () => clearTimeout(timer);
    }, [isUnlocked, currentUnlockedState, autoTransition, reviewerType, onStateChange]);

    // Update states when props change
    useEffect(() => {
      setCurrentUnlockedState(unlockedState);
      setTransitionText(effectiveText);
      setDisplayText(effectiveText);
    }, [unlockedState, effectiveText]);

    useEffect(() => {
      if (!isCopyAnimating && !isMorphingOut) {
        setDisplayText(transitionText);
      }
    }, [transitionText, isCopyAnimating, isMorphingOut]);

    useEffect(() => {
      return () => {
        cancelPositionAnimation();
        if (copyAnimationTimeoutRef.current) {
          clearTimeout(copyAnimationTimeoutRef.current);
        }
        if (morphOutTimeoutRef.current) {
          clearTimeout(morphOutTimeoutRef.current);
        }
      };
    }, [cancelPositionAnimation]);

    useEffect(() => {
      if ((disabled || loading) && (isCopyAnimating || isMorphingOut)) {
        setIsCopyAnimating(false);
        setIsMorphingOut(false);
        setDisplayText(transitionText);
        if (copyAnimationTimeoutRef.current) {
          clearTimeout(copyAnimationTimeoutRef.current);
        }
        if (morphOutTimeoutRef.current) {
          clearTimeout(morphOutTimeoutRef.current);
        }
      }
    }, [disabled, loading, isCopyAnimating, isMorphingOut, transitionText]);

    // Update text immediately when unlocking to APPLICATION_SENT state
    useEffect(() => {
      if (isUnlocked && currentUnlockedState.id === "application-sent" && !isTransitioning) {
        // Only update if we're using the original text and not a custom text
        if (transitionText === effectiveText) {
          setTransitionText(i18n.t("ui.toolkit.swiper.applicationSent"));
        }
      }
    }, [isUnlocked, currentUnlockedState.id, isTransitioning, effectiveText, transitionText]);

    // Default processing states text to "Pending approval" if no custom text provided
    useEffect(() => {
      const processingStateIds = [
        "processing-application-manager",
        "processing-application-brand",
        "processing-application"
      ];

      if (isUnlocked && processingStateIds.includes(currentUnlockedState.id) && !isTransitioning) {
        if (transitionText === effectiveText) {
          const defaultProcessingText = currentUnlockedState.defaultText || i18n.t("ui.toolkit.swiper.pendingApproval");
          if (transitionText !== defaultProcessingText) {
            setTransitionText(defaultProcessingText);
          }
        }
      }
    }, [
      isUnlocked,
      currentUnlockedState.id,
      currentUnlockedState.defaultText,
      isTransitioning,
      effectiveText,
      transitionText
    ]);

    useEffect(() => {
      if (!isUnlocked) {
        setCurrentUnlockedState(unlockedState);
        setTransitionText(effectiveText);
        setDisplayText(effectiveText);
        setIsTransitioning(false);
        setIsCopyAnimating(false);
        setIsMorphingOut(false);
        if (copyAnimationTimeoutRef.current) {
          clearTimeout(copyAnimationTimeoutRef.current);
        }
        if (morphOutTimeoutRef.current) {
          clearTimeout(morphOutTimeoutRef.current);
        }
      }
    }, [isUnlocked, unlockedState, text]);

    useImperativeHandle(
      ref,
      () => ({
        animateToStart,
        animateToEnd
      }),
      [animateToStart, animateToEnd]
    );

    return (
      <Tippy
        content={getTooltipMessage()}
        disabled={!shouldShowTooltip()}
        duration={[200, 150]}
        arrow={true}
        animation="fade"
        className={styles["swiper-tooltip"]}
        maxWidth="none"
        popperOptions={{
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                boundary: "viewport"
              }
            },
            {
              name: "flip",
              options: {
                fallbackPlacements: ["top", "bottom"]
              }
            },
            {
              name: "sameWidth",
              enabled: true,
              phase: "beforeWrite",
              requires: ["computeStyles"],
              fn: ({ state }) => {
                state.styles.popper.width = `${state.rects.reference.width}px`;
              },
              effect: ({ state }) => {
                state.elements.popper.style.width = `${state.elements.reference.offsetWidth}px`;
              }
            }
          ]
        }}>
        <div
          className={clsx(styles["swiper-container-wrapper"], className, {
            [styles.disabled]: disabled
          })}
          style={{ position: "relative", cursor: loading ? "progress" : undefined }}
          data-interactable={isInteractable && !isDisabled && !isLoading}
          data-disabled={disabled}
          data-unlocked={isUnlocked}
          data-unlocked-state={isUnlocked ? currentUnlockedState.id : null}
          data-transitioning={isTransitioning}
          data-paused={paused}
          data-loading={loading}
          aria-busy={loading}>
          {loading && (
            <div
              className={clsx(placeholderStyles.placeholder, placeholderStyles.placeholder_wave)}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "9999px",
                zIndex: 2,
                pointerEvents: "none"
              }}
            />
          )}
          <div
            className={clsx(styles["swiper-container"], { [styles.disabled]: disabled })}
            ref={swiperRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            aria-label={shouldShowTooltip() ? generateAriaLabel() : undefined}
            role={isInteractable && !isDisabled && !isLoading ? "slider" : "presentation"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              dimensions.swiperInnerWidth
                ? Math.round((position / dimensions.swiperInnerWidth) * 100)
                : 0
            }
            tabIndex={isInteractable && !isDisabled && !isLoading ? 0 : -1}
            style={{
              backgroundColor: loading
                ? "var(--grayscale-200)"
                : isUnlocked
                  ? "transparent"
                  : initialState.backgroundColor,
              cursor: loading ? "progress" : undefined
            }}>
            {disabled && <span className={styles["swiper-disabled-text"]}>{transitionText}</span>}
            <div
              className={clsx(styles["swiper-overlay"])}
              style={{
                opacity: dimensions.swiperInnerWidth ? position / dimensions.swiperInnerWidth : 0,
                backgroundColor: currentUnlockedState.backgroundColor,
                background: currentUnlockedState.backgroundColor
              }}
            />
            <div
              className={clsx(styles["swiper-thumb-container"])}
              onClick={handleSwiperThumbClick}
              style={{
                transform: `translateX(${position}px)`,
                cursor: loading
                  ? "progress"
                  : isUnlocked
                    ? "default"
                    : isDragging
                      ? "grabbing"
                      : "grab"
              }}>
              <div
                className={clsx(styles["swiper-text"], styles["swiper-text-before"])}
                style={{
                  cursor: currentUnlockedState.isLink ? "pointer" : "default",
                  color: loading
                    ? "var(--text-commentary-description)"
                    : currentUnlockedState.textColor
                }}>
                <div className={styles["swiper-text-before-container"]}>
                  <span
                    className={clsx(
                      styles["swiper-text-before-text"],
                      shouldShowCopiedText && styles["swiper-text-copied"]
                    )}
                    data-copy-animating={isCopyAnimating || isMorphingOut}>
                    {isDragging ? i18n.t("ui.toolkit.swiper.release") : displayText}
                  </span>
                </div>
              </div>
              <div
                className={clsx(styles["swiper-thumb"])}
                ref={thumbRef}
                style={{
                  cursor: loading
                    ? "progress"
                    : isUnlocked
                      ? currentUnlockedState.cursor
                        ? currentUnlockedState.cursor
                        : "pointer"
                      : isDragging
                        ? "grabbing"
                        : "grab",
                  backgroundColor: loading
                    ? "var(--grayscale-400)"
                    : initialState.iconBackgroundColor,
                  border: loading ? "1px solid var(--grayscale-400)" : "none"
                }}>
                {!loading && initialState.icon !== "" && (
                  <div
                    style={{
                      opacity: dimensions.swiperInnerWidth
                        ? 1 - position / dimensions.swiperInnerWidth
                        : 1
                    }}>
                    <initialState.icon.type
                      {...initialState.icon.props}
                      className={styles["thumb_icon"]}
                      width="var(--size-icon-medium)"
                      height="var(--size-icon-medium)"
                      color={initialState.iconColor}
                    />
                  </div>
                )}
                {!loading && currentUnlockedState.icon !== "" && (
                  <div
                    className={clsx(
                      styles["thumb-overlay"],
                      isCopyLinkState && isCopyAnimating && styles["icon_morphing"],
                      isCopyLinkState && isMorphingOut && styles["icon_morphing_out"]
                    )}
                    style={{
                      opacity: dimensions.swiperInnerWidth
                        ? position / dimensions.swiperInnerWidth
                        : 0,
                      backgroundColor: currentUnlockedState.iconBackgroundColor
                    }}>
                    {isCopyLinkState && isCopyAnimating ? (
                      <Icons.General.CheckSquare
                        {...currentUnlockedState.icon.props}
                        className={styles["thumb_icon"]}
                        width="var(--size-icon-medium)"
                        height="var(--size-icon-medium)"
                        color={currentUnlockedState.iconColor}
                      />
                    ) : (
                      <currentUnlockedState.icon.type
                        {...currentUnlockedState.icon.props}
                        className={styles["thumb_icon"]}
                        width="var(--size-icon-medium)"
                        height="var(--size-icon-medium)"
                        color={currentUnlockedState.iconColor}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className={clsx(styles["swiper-text"], styles["swiper-text-after"])}>
                <div className={styles["swiper-text-after-container"]}>
                  <span
                    className={clsx(
                      styles["swiper-text-after-text"],
                      shouldShowCopiedText && styles["swiper-text-copied"]
                    )}
                    data-copy-animating={isCopyAnimating || isMorphingOut}
                    style={{
                      color: loading ? "var(--text-commentary-description)" : initialState.textColor
                    }}>
                    {displayText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tippy>
    );
  }
);
