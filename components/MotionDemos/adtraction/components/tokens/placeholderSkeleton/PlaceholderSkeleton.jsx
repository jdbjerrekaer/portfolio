import React, { useState, useRef, useEffect } from "react";
import styles from "./PlaceholderSkeleton.module.scss";
import clsx from "clsx";

// Export the styles so they can be used directly
export const placeholderStyles = styles;

/**
 * PlaceholderSkeleton reserves layout space and shows a shimmering placeholder
 * while content is loading. Automatically measures child height when loaded.
 *
 * @param {boolean} [isLoading=false] - Whether to show the placeholder.
 * @param {string} [width="-webkit-fill-available"] - Placeholder width.
 * @param {string} [initialHeight="1.5rem"] - Initial placeholder height.
 * @param {React.ReactNode} children - Content to render when not loading.
 * @returns {JSX.Element}
 */
export const PlaceholderSkeleton = ({
  isLoading = false,
  width = "-webkit-fill-available",
  initialHeight = "1.5rem",
  children
}) => {
  const childRef = useRef(null);
  const [measuredHeight, setMeasuredHeight] = useState(null);

  useEffect(() => {
    if (childRef.current && !isLoading) {
      const observer = new ResizeObserver((entries) => {
        const { height } = entries[0].contentRect;
        setMeasuredHeight(`${height}px`);
      });

      observer.observe(childRef.current);
      return () => observer.disconnect();
    }
  }, [isLoading]);

  const displayHeight = isLoading ? initialHeight : measuredHeight || initialHeight;

  return isLoading ? (
    <div
      className={clsx(styles.placeholder, styles.placeholder_wave)}
      style={{ height: displayHeight, width }}
    />
  ) : (
    <div ref={childRef}>{children}</div>
  );
};
