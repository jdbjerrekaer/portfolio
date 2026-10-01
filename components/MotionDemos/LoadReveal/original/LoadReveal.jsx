"use client";
import React, { useLayoutEffect, useRef, useState } from "react";
import { PlaceholderSkeleton } from "@adtraction/ui-components";
import styles from "./LoadReveal.module.scss";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const DURATION_MS = 280;

/**
 * Crossfades skeleton → content while animating height so layout does not jump.
 * Height is driven imperatively (reflow + CSS transition) so the browser always
 * paints the from→to pair — React setState alone often skipped the start frame.
 */
export const LoadReveal = ({
  isLoading,
  initialHeight = "6rem",
  width = "100%",
  skeleton = null,
  children,
  "data-testid": testId
}) => {
  const shellRef = useRef(null);
  const contentRef = useRef(null);
  const wasLoadingRef = useRef(isLoading);
  const [skeletonVisible, setSkeletonVisible] = useState(isLoading);
  const [contentVisible, setContentVisible] = useState(!isLoading);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell) return undefined;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = isLoading;

    if (isLoading) {
      setSkeletonVisible(true);
      setContentVisible(false);
      shell.style.transition = "none";
      shell.style.height = initialHeight;
      return undefined;
    }

    const nextPx = content?.scrollHeight ?? 0;

    if (!wasLoading) {
      setSkeletonVisible(false);
      setContentVisible(true);
      shell.style.transition = "none";
      shell.style.height = nextPx === 0 ? "0px" : "auto";
      return undefined;
    }

    if (reduceMotion) {
      setSkeletonVisible(false);
      setContentVisible(true);
      shell.style.transition = "none";
      shell.style.height = nextPx === 0 ? "0px" : "auto";
      return undefined;
    }

    // Imperative from→to so the transition always runs.
    setSkeletonVisible(true);
    setContentVisible(false);
    shell.style.transition = "none";
    shell.style.height = initialHeight;
    void shell.offsetHeight;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setSkeletonVisible(false);
        setContentVisible(true);
        shell.style.transition = `height ${DURATION_MS}ms ${EASE_OUT}`;
        shell.style.height = `${nextPx}px`;
      });
    });

    const onEnd = (event) => {
      if (event.target !== shell || event.propertyName !== "height") return;
      shell.style.height = "auto";
      shell.style.transition = "none";
      shell.removeEventListener("transitionend", onEnd);
    };
    shell.addEventListener("transitionend", onEnd);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      shell.removeEventListener("transitionend", onEnd);
    };
  }, [isLoading, initialHeight]);

  return (
    <div
      ref={shellRef}
      className={styles.shell}
      data-testid={testId}
      data-loading={isLoading ? "true" : "false"}
      style={{ width }}>
      <div
        className={styles.skeleton}
        data-visible={skeletonVisible ? "true" : "false"}
        aria-hidden={skeletonVisible ? undefined : "true"}>
        {skeleton || (
          <PlaceholderSkeleton isLoading width="100%" initialHeight={initialHeight} />
        )}
      </div>
      <div
        ref={contentRef}
        className={styles.content}
        data-visible={contentVisible ? "true" : "false"}
        aria-hidden={isLoading ? "true" : undefined}>
        {isLoading ? null : children}
      </div>
    </div>
  );
};
