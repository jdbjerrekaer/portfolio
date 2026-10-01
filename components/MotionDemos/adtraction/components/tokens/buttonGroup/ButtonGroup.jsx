import React, { useState, useLayoutEffect, useRef, useCallback } from "react";
import { DropdownSelect } from "../dropdowns/dropdownSelect/DropdownSelect";
import { Loader } from "../loader/Loader";
import clsx from "clsx";
import styles from "./ButtonGroup.module.scss";

const MOBILE_BREAKPOINT = 768;
const RESIZE_DEBOUNCE_MS = 400;
const CONTAINER_DEBOUNCE_MS = 4;

const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
};

/**
 * ButtonGroup renders a set of selectable buttons with an animated selection
 * indicator. Automatically switches to a dropdown on small screens or overflow.
 *
 * @param {Array<{label:string,value:any,disabled?:boolean,icon?:ReactElement,style?:object}>} items - Items to render.
 * @param {number} [defaultSelectedIndex=0] - Initially selected index.
 * @param {function} [selectedCallback=() => {}] - Called with (index, item) when selection changes.
 * @param {boolean} [fitContent=false] - Buttons fit content; otherwise distribute.
 * @param {boolean} [loading=false] - Show loading indicator for selected button.
 * @param {boolean} [disabled=false] - Disable all interactions.
 * @param {("small"|"default")} [size="default"] - Size variant.
 * @param {boolean} [squircle=false] - Use rounded/squircle styling.
 * @param {boolean} [mobileCompact=true] - Enable dropdown on small screens.
 * @param {number} [mobileBreakpoint=768] - Width threshold for compact mode.
 * @param {string|undefined} [mobileModalHeaderLabel=undefined] - Label used for the mobile dropdown modal header.
 * @returns {JSX.Element}
 */
export const ButtonGroup = ({
  items,
  defaultSelectedIndex = 0,
  selectedCallback = () => {},
  fitContent = false,
  loading = false,
  disabled = false,
  size = "default",
  squircle = false,
  mobileCompact = true,
  mobileBreakpoint = MOBILE_BREAKPOINT,
  mobileModalHeaderLabel = undefined
}) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [shouldUseDropdown, setShouldUseDropdown] = useState(false);

  const sliderRef = useRef(null);

  const checkShouldUseDropdown = useCallback(() => {
    if (!mobileCompact) {
      setShouldUseDropdown(false);
      return;
    }

    const isMobile = window.innerWidth <= mobileBreakpoint;
    if (isMobile) {
      setShouldUseDropdown(true);
      return;
    }

    if (!sliderRef.current || !sliderRef.current.parentElement) {
      setShouldUseDropdown(false);
      return;
    }

    const buttons = sliderRef.current.querySelectorAll(`.${styles.item}`);
    const totalButtonsWidth = Array.from(buttons).reduce((sum, el) => sum + el.offsetWidth, 0);

    const parentWidth = sliderRef.current.parentElement.clientWidth;

    const tolerance = 4;
    const hasOverflow = totalButtonsWidth > parentWidth + tolerance;

    setShouldUseDropdown(hasOverflow);
  }, [mobileCompact, mobileBreakpoint]);

  const debouncedCheck = useDebouncedCallback(checkShouldUseDropdown, RESIZE_DEBOUNCE_MS);
  const debouncedContainerCheck = useDebouncedCallback(() => {
    if (window.innerWidth > mobileBreakpoint) {
      setTimeout(checkShouldUseDropdown, 100);
    }
  }, CONTAINER_DEBOUNCE_MS);

  useLayoutEffect(() => {
    checkShouldUseDropdown();

    window.addEventListener("resize", debouncedCheck);

    return () => {
      window.removeEventListener("resize", debouncedCheck);
    };
  }, [checkShouldUseDropdown, debouncedCheck]);

  useLayoutEffect(() => {
    if (!sliderRef.current?.parentElement) return;

    const observer = new ResizeObserver(debouncedContainerCheck);
    observer.observe(sliderRef.current.parentElement);

    return () => observer.disconnect();
  }, [debouncedContainerCheck]);

  useLayoutEffect(() => {
    if (items[defaultSelectedIndex]?.disabled) {
      const firstEnabledIndex = items.findIndex((item) => !item?.disabled);
      setSelectedIndex(firstEnabledIndex >= 0 ? firstEnabledIndex : defaultSelectedIndex);
    } else {
      setSelectedIndex(defaultSelectedIndex);
    }
  }, [defaultSelectedIndex, items]);

  const updateSelectionPosition = useCallback(() => {
    if (!sliderRef.current) return;

    const buttons = sliderRef.current.querySelectorAll(
      `.${styles.button_group} > div:not(.${styles.selection_background}):not(.${styles.hover_background})`
    );
    const selectionBackground = sliderRef.current.querySelector(`.${styles.selection_background}`);
    const hoverBackground = sliderRef.current.querySelector(`.${styles.hover_background}`);

    if (!selectionBackground) return;

    const selectedButton = buttons[selectedIndex];
    if (selectedButton && !items[selectedIndex]?.disabled) {
      selectionBackground.style.width = `${selectedButton.offsetWidth}px`;
      selectionBackground.style.transform = `translateX(${selectedButton.offsetLeft}px)`;
      selectionBackground.classList.toggle(styles.active, activeIndex === selectedIndex);
      selectionBackground.classList.toggle(styles.hover, hoverIndex === selectedIndex);
      selectionBackground.classList.toggle(styles.loading, loading);
    }

    if (hoverIndex !== null && !loading && !disabled && !items[hoverIndex]?.disabled) {
      const hoverButton = buttons[hoverIndex];
      const startButton = buttons[selectedIndex];
      if (hoverButton && startButton) {
        hoverBackground.style.width = `${hoverButton.offsetWidth}px`;
        hoverBackground.style.display = "flex";
        hoverBackground.style.left = `${startButton.offsetLeft}px`;
        hoverBackground.style.transform = `translateX(${hoverButton.offsetLeft - startButton.offsetLeft}px)`;
        hoverBackground.classList.toggle(styles.active, hoverIndex === activeIndex);
      }
    } else {
      hoverBackground.style.display = "none";
      hoverBackground.style.transform = "translateX(0)";
    }
  }, [selectedIndex, hoverIndex, activeIndex, loading, disabled, items]);

  const updateSelectionPositionRef = useRef(updateSelectionPosition);
  updateSelectionPositionRef.current = updateSelectionPosition;

  useLayoutEffect(() => {
    if (shouldUseDropdown || !sliderRef.current) return;

    updateSelectionPosition();
  }, [selectedIndex, hoverIndex, activeIndex, loading, fitContent, shouldUseDropdown]);

  useLayoutEffect(() => {
    if (shouldUseDropdown || !sliderRef.current) return;

    const el = sliderRef.current;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => updateSelectionPositionRef.current?.());
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldUseDropdown]);

  useLayoutEffect(() => {
    if (shouldUseDropdown || !sliderRef.current) return;

    const selectionBackground = sliderRef.current.querySelector(`.${styles.selection_background}`);
    if (selectionBackground) {
      selectionBackground.classList.add(styles["no-transition"]);

      requestAnimationFrame(() => {
        updateSelectionPosition();
        setTimeout(() => {
          selectionBackground.classList.remove(styles["no-transition"]);
        }, 50);
      });
    }
  }, [fitContent]);

  // Handle icon loading with MutationObserver to detect when Suspense resolves
  useLayoutEffect(() => {
    if (shouldUseDropdown || !sliderRef.current) return;

    let timeoutId = null;
    const observer = new MutationObserver(() => {
      // Debounce multiple mutations
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateSelectionPosition();
      }, 0);
    });

    // Observe all button contents for icon insertions
    const buttons = sliderRef.current.querySelectorAll(`.${styles.item}`);
    buttons.forEach((button) => {
      observer.observe(button, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "width", "height"]
      });
    });

    // Initial measurement
    updateSelectionPosition();

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [items, shouldUseDropdown, updateSelectionPosition]);

  useLayoutEffect(() => {
    if (sliderRef.current && !shouldUseDropdown) {
      const observer = new ResizeObserver(debouncedContainerCheck);
      observer.observe(sliderRef.current.parentElement);
    }
  }, [shouldUseDropdown, debouncedContainerCheck]);

  const handleSelection = useCallback(
    (index, item) => {
      if (loading || disabled || item?.disabled || index === selectedIndex) return;

      setPreviousIndex(selectedIndex);
      setSelectedIndex(index);
      selectedCallback(index, item);
      setHoverIndex(null);

      setTimeout(() => setPreviousIndex(null), 150);

      if (window.innerWidth > mobileBreakpoint) {
        setTimeout(checkShouldUseDropdown, 100);
      }
    },
    [loading, disabled, selectedIndex, selectedCallback, mobileBreakpoint, checkShouldUseDropdown]
  );

  const handleDropdownSelection = useCallback(
    (option) => {
      const index = items.findIndex((item) => item.value === option.value);
      if (index === -1) return;

      setPreviousIndex(selectedIndex);
      setSelectedIndex(index);
      selectedCallback(index, items[index]);

      setTimeout(() => setPreviousIndex(null), 150);
    },
    [items, selectedIndex, selectedCallback]
  );

  return (
    <>
      {shouldUseDropdown ? (
        <DropdownSelect
          options={items}
          iconLeftEnabled={true}
          iconLeftSelected={true}
          isMulti={false}
          size={size}
          mobileModalHeaderLabel={mobileModalHeaderLabel}
          onChange={handleDropdownSelection}
          defaultSelectedOption={selectedIndex}
        />
      ) : (
        <div
          className={clsx(styles.button_group, {
            [styles.squircle]: squircle,
            [styles.flex]: !fitContent,
            [styles["fit-content"]]: fitContent,
            [styles.button_group_disabled]: disabled,
            [styles.small]: size === "small"
          })}
          ref={sliderRef}>
          <div
            className={clsx(styles.selection_background, {
              [styles.squircle]: squircle,
              [styles.disabled]: disabled
            })}></div>
          <div
            className={clsx(styles.hover_background, {
              [styles.squircle]: squircle
            })}></div>
          {items.map((item, index) => {
            const isItemDisabled = disabled || item?.disabled;
            return (
              <div
                key={index}
                className={clsx(styles.item, {
                  [styles.selected]: index === selectedIndex,
                  [styles["was-selected"]]: index === previousIndex,
                  [styles["before-selected"]]: index === selectedIndex - 1,
                  [styles["loading-state"]]: loading,
                  [styles.disabled]: isItemDisabled
                })}
                onClick={() => handleSelection(index, item)}
                onMouseEnter={() => !isItemDisabled && setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onMouseDown={() => !isItemDisabled && setActiveIndex(index)}
                onMouseUp={() => setActiveIndex(null)}
                style={
                  !fitContent
                    ? {
                        flex: "1 1 0%",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center"
                      }
                    : {}
                }>
                {index === selectedIndex && loading ? (
                  <Loader dotSpin={false} size={size} color="var(--grayscale-100)" />
                ) : (
                  <>
                    <span className={styles.content}>
                      {item.icon && item.icon}
                      {item.label}
                    </span>
                    <span
                      className={clsx(styles.selection_text, {
                        [styles.visible]: index === selectedIndex,
                        [styles.disabled]: isItemDisabled
                      })}>
                      <span className={styles.content}>
                        {item.icon && item.icon}
                        {item.label}
                      </span>
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
