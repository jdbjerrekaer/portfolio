import React, { useState, useEffect, useId, useRef, forwardRef } from "react";
import { ScrollShadow } from "../shadow/ScrollShadow";
import styles from "./ListItem.module.scss";
import clsx from "clsx";

const LIST_WRAPPER_ATTR = "data-list-wrapper";

/**
 * ListItemWrapper manages keyboard navigation and selection state for a list of
 * `ListItem` children. Supports controlled selection via `selectedKeys`.
 *
 * Multiselect lists are paintable: pressing a row and dragging across others sets every row the
 * mouse crosses to the state the first row switched to. Touch keeps its native scroll.
 *
 * @param {React.ReactNode} children - List of items to render.
 * @param {boolean} [isMultiselect=false] - Enables multi-selection behavior.
 * @param {boolean} [scrollShadow=false] - Shows scroll shadows while scrolling.
 * @param {boolean} [darkShadow=true] - Use dark variant for shadows.
 * @param {function} [onSelectionChange=() => {}] - Called with selected keys array.
 * @param {boolean} [inFocus=false] - Enables keyboard navigation when true.
 * @param {string} [customClassName=""] - Extra class for wrapper.
 * @param {string} [wrapper="listItemWrapperId"] - Base id used for scroll wrapper.
 * @param {function|null} [onFocusChange=null] - Callback with focused index or -1.
 * @param {string[]|string|undefined} [selectedKeys] - Controlled selected keys.
 * @param {string} [itemKeyProp="text"] - Which child prop represents its selection key.
 * @param {React.ReactNode} [footnote=null] - A rule or consequence pinned below the list, outside
 *   the scroll area. Must be a prop rather than a child: children are treated as list items and
 *   receive selection, focus and keyboard navigation. The list and its scroll shadows are then
 *   wrapped in their own positioned element, so the bottom fade ends at the list, not the footnote.
 * @returns {JSX.Element}
 */
export const ListItemWrapper = forwardRef(
  (
    {
      children,
      isMultiselect = false,
      scrollShadow = false,
      darkShadow = true,
      onSelectionChange = () => {},
      inFocus = false,
      customClassName = "",
      wrapper = "listItemWrapperId",
      onFocusChange = null,
      itemGap = "var(--size-space-100)",
      // Controlled selection API
      // selectedKeys: pass the set of keys that should be selected. Keys must match the
      // value of the prop indicated by itemKeyProp on each child (defaults to "text").
      // Prefer stable identifiers like "value"/"id" over labels to avoid visual/locale coupling.
      // Example: <ListItem text="Apple" value="apple" /> → selectedKeys={["apple"]} itemKeyProp="value"
      selectedKeys = undefined,
      itemKeyProp = "text",
      enableAnimation = true,
      footnote = null
    },
    ref
  ) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [isContentVisible, setIsContentVisible] = useState(false);
    const generatedId = useId();
    // Ensure unique ids across multiple mounted instances (e.g., Storybook autodocs)
    const resolvedWrapperId =
      !wrapper || wrapper === "listItemWrapperId" ? `listItemWrapperId-${generatedId}` : wrapper;
    const scrollContainerId = `${resolvedWrapperId}-content`;
    const isControlled = typeof selectedKeys !== "undefined" && selectedKeys !== null;
    const controlledSelected = Array.isArray(selectedKeys)
      ? selectedKeys
      : typeof selectedKeys === "string" && selectedKeys.length > 0
        ? [selectedKeys]
        : [];
    const currentSelectedItems = isControlled ? controlledSelected : selectedItems;
    // A fast paint stroke can fire twice before the parent re-renders, so each step builds on
    // the last selection it emitted rather than on possibly stale props.
    const selectionRef = useRef(currentSelectedItems);
    selectionRef.current = currentSelectedItems;
    const paintRef = useRef(null);
    const suppressClickRef = useRef(false);
    const paintableKeys = [];

    useEffect(() => {
      // Trigger a mount-time fade-in with a slight delay
      let timeoutId;
      const rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => setIsContentVisible(true), 30);
      });
      return () => {
        cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, []);

    useEffect(() => {
      // Re-trigger fade when focus (e.g. dropdown open) toggles
      if (inFocus) {
        setIsContentVisible(false);
        const timerId = setTimeout(() => setIsContentVisible(true), 30);
        return () => clearTimeout(timerId);
      } else {
        setIsContentVisible(false);
      }
    }, [inFocus]);

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!inFocus) return;
        const childrenArray = React.Children.toArray(children);

        const scrollWithOffset = (element, container) => {
          if (!element || !container) return;

          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const offset = elementRect.height + elementRect.height + 4; // Offset by approximately two item heights plus the gap between items

          if (elementRect.bottom + offset > containerRect.bottom) {
            container.scrollTop += elementRect.bottom - containerRect.bottom + offset;
          } else if (elementRect.top - offset < containerRect.top) {
            container.scrollTop -= containerRect.top - elementRect.top + offset;
          }
        };

        const findNextEnabledIndex = (startIndex, direction) => {
          const increment = direction === "down" ? 1 : -1;
          let currentIndex = startIndex + increment;

          // Check bounds first
          if (currentIndex < 0 || currentIndex >= childrenArray.length) {
            return startIndex; // Stay at current position if out of bounds
          }

          // Look for the next enabled item
          while (currentIndex >= 0 && currentIndex < childrenArray.length) {
            const child = childrenArray[currentIndex];

            // Check if this child is a wrapper div containing a disabled ListItem
            const isWrapperDiv =
              child.type === "div" &&
              child.props.children &&
              React.isValidElement(child.props.children) &&
              (child.props.children.props.disabled === true ||
                child.props.children.props.disabled === "true");

            // Check disabled state on the child itself or its wrapped ListItem
            const actualChild = isWrapperDiv ? child.props.children : child;
            const isDisabled =
              actualChild.props.disabled === true || actualChild.props.disabled === "true";
            const isHoverable =
              actualChild.props.hoverable !== false && actualChild.props.hoverable !== "false";

            if (!isDisabled && isHoverable) {
              return currentIndex;
            }

            currentIndex += increment;
          }

          return startIndex; // Stay at current position if no enabled items found
        };

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setFocusedIndex((prev) => {
              const newIndex = findNextEnabledIndex(prev, "down");
              setTimeout(() => {
                const container = document.getElementById(scrollContainerId);
                const element = container?.querySelector(`[data-focused="true"]`);
                scrollWithOffset(element, container);
              }, 0);
              return newIndex;
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setFocusedIndex((prev) => {
              const newIndex = findNextEnabledIndex(prev, "up");
              setTimeout(() => {
                const container = document.getElementById(scrollContainerId);
                const element = container?.querySelector(`[data-focused="true"]`);
                scrollWithOffset(element, container);
              }, 0);
              return newIndex;
            });
            break;
          case "Enter":
            if (focusedIndex >= 0) {
              const focusedChild = childrenArray[focusedIndex];

              // Check if this child is a wrapper div containing a disabled ListItem
              const isWrapperDiv =
                focusedChild.type === "div" &&
                focusedChild.props.children &&
                React.isValidElement(focusedChild.props.children) &&
                (focusedChild.props.children.props.disabled === true ||
                  focusedChild.props.children.props.disabled === "true");

              // Check disabled state on the child itself or its wrapped ListItem
              const actualChild = isWrapperDiv ? focusedChild.props.children : focusedChild;
              const isDisabled =
                actualChild.props.disabled === true || actualChild.props.disabled === "true";
              const isHoverable =
                actualChild.props.hoverable !== false && actualChild.props.hoverable !== "false";

              // Only handle selection if the item is not disabled and is hoverable
              if (!isDisabled && isHoverable) {
                const selectionKey =
                  actualChild.props[itemKeyProp] !== undefined &&
                  actualChild.props[itemKeyProp] !== null
                    ? actualChild.props[itemKeyProp]
                    : actualChild.props.text;
                handleSelection(selectionKey);
              }
            }
            break;
          default:
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [children, focusedIndex, inFocus]);

    // Keep internal state in sync when controlled
    useEffect(() => {
      if (isControlled) {
        setSelectedItems(controlledSelected);
      }
    }, [isControlled, controlledSelected.join("||")]);

    const handleSelection = (text) => {
      const base = selectionRef.current;
      let newSelection;
      if (isMultiselect) {
        if (base.includes(text)) {
          newSelection = base.filter((item) => item !== text);
        } else {
          newSelection = [...base, text];
        }
      } else {
        newSelection = [text];
      }
      selectionRef.current = newSelection;
      if (!isControlled) {
        setSelectedItems(newSelection);
      }
      onSelectionChange(newSelection);
    };

    const applyPaint = (keys, select) => {
      const base = selectionRef.current;
      const next = select
        ? [...base, ...keys.filter((key) => !base.includes(key))]
        : base.filter((key) => !keys.includes(key));
      if (next.length === base.length) return;
      selectionRef.current = next;
      if (!isControlled) {
        setSelectedItems(next);
      }
      onSelectionChange(next);
    };

    const detachStroke = () => {
      const stroke = paintRef.current;
      if (!stroke) return;
      window.removeEventListener("pointerup", stroke.stop);
      window.removeEventListener("pointercancel", stroke.stop);
      paintRef.current = null;
    };

    const endPaint = () => {
      const stroke = paintRef.current;
      if (!stroke) return;
      suppressClickRef.current = stroke.moved;
      detachStroke();
    };

    const startPaint = (event, key) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const stop = () => endPaint();
      paintRef.current = {
        select: !selectionRef.current.includes(key),
        fromKey: key,
        moved: false,
        stop
      };
      // pointerup on the list misses a release outside it, which would leave the stroke open.
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
    };

    const continuePaint = (event, index, key) => {
      const stroke = paintRef.current;
      if (!stroke || key === stroke.fromKey) return;
      if ((event.buttons & 1) === 0) {
        endPaint();
        return;
      }
      // Fill the whole range, since a fast drag skips the rows it crosses within one frame. The
      // previous row is found by key: a virtualized list re-indexes its children as it scrolls.
      const fromIndex = paintableKeys.indexOf(stroke.fromKey);
      const keys =
        // ponytail: a row that has scrolled out of a virtualized window is not in paintableKeys,
        // so only the two endpoints get painted. Upgrade: take the full ordered key list from the parent.
        fromIndex === -1
          ? [stroke.fromKey, key]
          : paintableKeys
              .slice(Math.min(fromIndex, index), Math.max(fromIndex, index) + 1)
              .filter((rowKey) => rowKey != null);
      stroke.fromKey = key;
      stroke.moved = true;
      applyPaint(keys, stroke.select);
    };

    // Rows are already painted by the stroke; the click that follows it must not toggle one back.
    const handleClickCapture = (event) => {
      if (!suppressClickRef.current) return;
      suppressClickRef.current = false;
      event.stopPropagation();
    };

    const handlePointerDownCapture = () => {
      detachStroke();
      suppressClickRef.current = false;
    };

    const handleMouseEnterContainer = () => {
      // Reset focus when mouse enters the container
      if (focusedIndex !== -1) {
        setFocusedIndex(-1);
        if (onFocusChange) {
          onFocusChange(-1);
        }
      }
    };

    const childrenWithProps = React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        // Check if this child is a wrapper div containing a disabled ListItem
        const isWrapperDiv =
          child.type === "div" &&
          child.props.children &&
          React.isValidElement(child.props.children) &&
          (child.props.children.props.disabled === true ||
            child.props.children.props.disabled === "true");

        // Check disabled state on the child itself or its wrapped ListItem
        const actualChild = isWrapperDiv ? child.props.children : child;
        const isDisabled =
          actualChild.props.disabled === true || actualChild.props.disabled === "true";
        const isHoverable =
          actualChild.props.hoverable !== false && actualChild.props.hoverable !== "false";

        // Resolve key for the item using itemKeyProp or a provided getter via prop spread
        const itemKey = actualChild.props[itemKeyProp];

        const ensureListWrapperAttr = (element, additionalProps = {}) => {
          if (!React.isValidElement(element)) return element;
          const hasAttr =
            element.props && Object.prototype.hasOwnProperty.call(element.props, LIST_WRAPPER_ATTR);
          const shouldAddListWrapperProp =
            typeof element.type !== "string" &&
            !(element.props && Object.prototype.hasOwnProperty.call(element.props, "listWrapper"));
          const baseAttrProps = hasAttr ? {} : { [LIST_WRAPPER_ATTR]: "true" };
          const baseListWrapperProp = shouldAddListWrapperProp ? { listWrapper: true } : {};
          return React.cloneElement(element, {
            ...baseAttrProps,
            ...baseListWrapperProp,
            ...additionalProps
          });
        };

        const onClickHandler = (event) => {
          if (typeof child.props.onClick === "function") {
            child.props.onClick(event);
          }
          const propagationStopped =
            typeof event?.isPropagationStopped === "function" && event.isPropagationStopped();
          if (propagationStopped || event?.defaultPrevented) {
            return;
          }
          if (!isDisabled && isHoverable) {
            handleSelection(itemKey);
          }
        };

        const baseAdditionalProps = {
          onClick: onClickHandler
        };

        const isPaintable = isMultiselect && !isDisabled && isHoverable && itemKey != null;
        paintableKeys[index] = isPaintable ? itemKey : null;
        if (isPaintable) {
          Object.assign(baseAdditionalProps, {
            onPointerDown: (event) => {
              child.props.onPointerDown?.(event);
              startPaint(event, itemKey);
            },
            onPointerEnter: (event) => {
              child.props.onPointerEnter?.(event);
              continuePaint(event, index, itemKey);
            }
          });
        }

        if (child.type !== "div") {
          Object.assign(baseAdditionalProps, {
            active: currentSelectedItems.includes(itemKey) ? "true" : undefined,
            multiselect: isMultiselect ? "true" : undefined,
            focused: focusedIndex === index ? "true" : undefined
          });
        }

        if (isWrapperDiv) {
          return ensureListWrapperAttr(child, {
            ...baseAdditionalProps,
            children: ensureListWrapperAttr(child.props.children, {
              active: currentSelectedItems.includes(itemKey) ? "true" : undefined,
              multiselect: isMultiselect ? "true" : undefined,
              focused: focusedIndex === index ? "true" : undefined
            })
          });
        }

        return ensureListWrapperAttr(child, baseAdditionalProps);
      }
      return child;
    });

    const scrollArea = (
      <>
        <div
          ref={ref}
          className={styles.list_item_wrapper}
          id={scrollContainerId}
          data-visible={isContentVisible ? "true" : undefined}
          data-animation-enabled={enableAnimation ? "true" : undefined}
          style={{ "--list-item-gap": itemGap }}>
          {childrenWithProps}
        </div>
        {scrollShadow && (
          <ScrollShadow
            wrapper={resolvedWrapperId}
            scrollContainer={scrollContainerId}
            dark={darkShadow}
            strength={8}
            direction="vertical"
          />
        )}
      </>
    );

    return (
      <div
        className={clsx(styles.list_item_wrapper_container, customClassName)}
        data-list-wrapper="true"
        data-has-footnote={footnote ? "true" : undefined}
        id={resolvedWrapperId}
        onMouseEnter={handleMouseEnterContainer}
        onPointerDownCapture={handlePointerDownCapture}
        onPointerUp={endPaint}
        onClickCapture={handleClickCapture}>
        {footnote ? (
          <div className={styles.list_item_scroll_area}>{scrollArea}</div>
        ) : (
          scrollArea
        )}
        {footnote ? <div className={styles.list_item_footnote}>{footnote}</div> : null}
      </div>
    );
  }
);

ListItemWrapper.displayName = "ListItemWrapper";
