import React, { useState, useEffect } from "react";
import clsx from "clsx";
import styles from "./Loader.module.scss";

/**
 * Loader displays a progress indicator. It supports multiple visual variants
 * and sizes, and can optionally use a custom color.
 *
 * @param {boolean} [dotSpin=false] - Show the spinning dot loader.
 * @param {boolean} [loadingBar=false] - Show the linear loading bar.
 * @param {boolean} [barBounce=false] - Show the bouncing bars loader.
 * @param {("small"|"default"|"large")} [size="default"] - Size of the loader.
 * @param {string} [color="default"] - CSS color token or value for custom coloring.
 * @returns {JSX.Element}
 */
export const Loader = ({
  dotSpin = false,
  loadingBar = false,
  barBounce = false,
  size = "default",
  color = "default"
}) => {
  const [loaderType, setLoaderType] = useState("loading_dots");
  const [customColor, setCustomColor] = useState(false);

  useEffect(() => {
    if (color !== "default") {
      setCustomColor(true);
    }
  }, [color]);

  useEffect(() => {
    switch (true) {
      case loadingBar:
        setLoaderType("loading-bar");
        break;
      case dotSpin:
        setLoaderType("dot_spin");
        break;
      case barBounce:
        setLoaderType("bar_bounce");
        break;
      default:
        setLoaderType("loading_dots");
    }
  }, [dotSpin, loadingBar, barBounce]);

  return (
    <div
      className={clsx(
        loaderType === "loading_dots" ? "loading_dots" : styles[loaderType],
        loaderType === "loading_dots" ? size : styles[size]
      )}
      data-color={customColor}
      style={{ "--dot-color": color }}>
      {loaderType === "loading_dots" && (
        <>
          <span></span>
          <span></span>
          <span></span>
        </>
      )}
      {loaderType === "dot_spin" && (
        <>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </>
      )}
      {loaderType === "bar_bounce" && (
        <>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </>
      )}
    </div>
  );
};
