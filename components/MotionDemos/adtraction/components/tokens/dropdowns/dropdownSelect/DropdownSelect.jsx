import React, {
  useState,
  useEffect,
  useRef,
  useId,
  useLayoutEffect,
  useCallback,
  useMemo
} from "react";
import { ListItem } from "../../listItem/ListItem";
import { ListItemWrapper } from "../../listItem/ListItemWrapper";
import { Icons } from "@adtraction/ui-icons";
import clsx from "clsx";
import styles from "./DropdownSelect.module.scss";
import { Badge } from "../../badge/Badge";
import Tippy from "@tippyjs/react";
import { Loader } from "../../loader/Loader";
import { InputSearch } from "../../input/InputSearch/InputSearch";
import { Modal } from "../../../components/modal/Modal";
import { i18n } from "@adtraction/shared-i18n";
import { getOverlayPortalTarget } from "../../../misc/overlayPortal";

const normalizeOptionValue = (value) => {
  if (value === null) return "__null__";
  if (typeof value === "undefined") return "__undefined__";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (error) {
      void error;
      return String(value);
    }
  }
  return String(value);
};

const DROPDOWN_CLEAR_VALUE = normalizeOptionValue("__clear__");

const mapOptionValues = (options = []) => options.map((opt) => normalizeOptionValue(opt?.value));

const areValueSetsEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const value of a) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  for (const value of b) {
    const count = counts.get(value);
    if (!count) return false;
    if (count === 1) {
      counts.delete(value);
    } else {
      counts.set(value, count - 1);
    }
  }
  return counts.size === 0;
};

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * DropdownSelect is a button-like selector that opens a popover with a selectable list.
 * Supports single and multiple selection, search, async loading, and error/empty states.
 *
 * @param {("small"|"default"|"large")} [size="default"] - Control size.
 * @param {Array<{label:string, value:any, searchText?:string, description?:string, caption?:string, icon?:React.ReactNode, iconRight?:React.ReactNode, iconRightEnabled?:boolean, disabled?:boolean}>} [options=[]]
 * @param {React.ReactNode} [iconLeft=null] - Icon to show on the left side when no option is selected.
 * @param {boolean} [iconLeftSelected=false] - Show left icon only when an option is selected.
 * @param {boolean} [search=false] - Enables search input in menu.
 * @param {function} [onChange=() => {}] - Called with the selected option(s).
 * @param {function|undefined} [onMultiSelectToggle] - Optional transformer for staged multiselect selections. Receives the pending option array and should return the selection to display/apply on close.
 * @param {boolean} [multiSelect=false] - Enables multiselect mode.
 * @param {string} [text="Placeholder"] - Placeholder when no selection.
 * @param {string|undefined} [mobileModalHeaderLabel=undefined] - Label text to display in the mobile modal header title. Falls back to `text` if not provided.
 * @param {number|null} [defaultSelectedOption=null] - Index of default selection.
 * @param {function|undefined} [onAttemptDisabledOption] - Called when a disabled option is clicked.
 * @param {("auto"|"top"|"bottom"|"left"|"right")} [preferredDirection="auto"] - Popover placement.
 * @param {Array|object|undefined} [selectedOptions=undefined] - Controlled selection (array for multi).
 * @param {boolean} [loading=false] - Loading state indicator.
 * @param {function|undefined} [loadOptions] - Async loader returning options.
 * @param {string} [emptyText="No options available"] - Empty state label.
 * @param {string} [noResultsText="No matches found. Try a different search."] - No results label.
 * @param {string|null} [error=null] - Error message to display.
 * @param {string} [defaultSearchValue=""] - Initial search input value.
 * @param {boolean} [canClear=false] - When true in single-select mode, shows a "Clear selection" item when a value is selected.
 * @param {React.ReactNode} [footnote=null] - Short note pinned below the option list, e.g. why some options are missing.
 * @param {React.ElementType|React.ReactElement|null} [optionComponent=null] - Custom option component or element. When provided, renders in place of the default `ListItem` inside the dropdown menu. Receives props like `text`, `option`, `active`, `multiselect`, `disabled`, and visual metadata from each option.
 * @returns {JSX.Element}
 */
export const DropdownSelect = ({
  size = "default",
  options = [],
  iconLeft = null,
  iconLeftSelected = false,
  search = false,
  onChange = () => {},
  onMultiSelectToggle = undefined,
  multiSelect = false,
  text = i18n.t("ui.toolkit.dropdownSelect.placeholder"),
  mobileModalHeaderLabel = undefined,
  defaultSelectedOption = null,
  onAttemptDisabledOption = undefined,
  preferredDirection = "auto",
  selectedOptions = undefined,
  loading = false,
  // New generic prop for backend/API calls
  loadOptions = undefined,
  // Generic state texts
  emptyText = i18n.t("ui.toolkit.dropdownSelect.noOptions"),
  noResultsText = i18n.t("ui.toolkit.dropdownSelect.noResults"),
  error = null,
  // Utility for stories/testing no-results
  defaultSearchValue = "",
  // Whether single-select can be cleared from within the menu
  canClear = false,
  optionComponent: OptionComponentProp = null,
  disabled = false,
  forceActiveAppearance = false,
  // Callback for reporting filtered count (useful for debugging/testing)
  onFilteredCountChange = undefined,
  footnote = null
}) => {
  const [selectedOption, setSelectedOption] = useState(multiSelect ? [] : null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(defaultSearchValue || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pendingMultiSelectOptions, setPendingMultiSelectOptions] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const searchInputRef = useRef(null);
  // Width used for the dropdown menu popup sizing
  const [menuWidth, setMenuWidth] = useState(0);
  // Width used to lock the control size while loading
  const [controlWidth, setControlWidth] = useState(null);
  const controlWidthRef = useRef(null);
  const buttonRef = useRef(null);
  const badgeContentRef = useRef(null);
  const loadingRef = useRef(loading);

  // Internal async loading support
  const [internalOptions, setInternalOptions] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const uniqueId = useId();
  const wrapperId = `dropdown-wrapper-${uniqueId}`;
  const baselineAppliedValuesRef = useRef([]);

  // Mobile detection hook
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Virtualization state and refs
  const scrollContainerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const BUFFER_SIZE = 10; // items to render above/below viewport

  const resetScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, []);

  const getAppliedMultiOptions = useCallback(() => {
    if (!multiSelect) return [];
    if (typeof selectedOptions !== "undefined") {
      return Array.isArray(selectedOptions) ? selectedOptions : [];
    }
    return Array.isArray(selectedOption) ? selectedOption : [];
  }, [multiSelect, selectedOptions, selectedOption]);

  const visualSelectedMulti = useMemo(() => {
    if (!multiSelect) return [];
    if (menuIsOpen && Array.isArray(pendingMultiSelectOptions)) {
      return pendingMultiSelectOptions;
    }
    return Array.isArray(selectedOption) ? selectedOption : [];
  }, [multiSelect, menuIsOpen, pendingMultiSelectOptions, selectedOption]);

  const showBadgeUI = multiSelect && visualSelectedMulti.length > 0;

  const updateBadgeWidthVar = useCallback(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement) return;

    const badgeContentElement = badgeContentRef.current;
    const targetWidth = badgeContentElement ? badgeContentElement.scrollWidth : 0;
    buttonElement.style.setProperty("--badge-target-width", `${targetWidth}px`);
  }, []);

  useLayoutEffect(() => {
    updateBadgeWidthVar();
  }, [updateBadgeWidthVar, showBadgeUI, visualSelectedMulti.length, text, size, multiSelect]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      updateBadgeWidthVar();
    });

    const badgeContentElement = badgeContentRef.current;
    const buttonElement = buttonRef.current;

    if (badgeContentElement) {
      resizeObserver.observe(badgeContentElement);
    }

    if (buttonElement) {
      resizeObserver.observe(buttonElement);
    }

    updateBadgeWidthVar();

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateBadgeWidthVar, showBadgeUI, visualSelectedMulti.length]);

  useEffect(() => {
    setSelectedOption(multiSelect ? [] : null);
  }, [multiSelect]);

  const openMenu = useCallback(() => {
    if (multiSelect) {
      const applied = getAppliedMultiOptions();
      baselineAppliedValuesRef.current = mapOptionValues(applied);
      setPendingMultiSelectOptions(null);
    }
    setMenuIsOpen(true);
    requestAnimationFrame(resetScrollPosition);
  }, [multiSelect, getAppliedMultiOptions, resetScrollPosition]);

  useEffect(() => {
    if (!multiSelect || !menuIsOpen || typeof selectedOptions === "undefined") return;
    baselineAppliedValuesRef.current = mapOptionValues(
      Array.isArray(selectedOptions) ? selectedOptions : []
    );
  }, [multiSelect, menuIsOpen, selectedOptions]);

  // Controlled mode: sync internal state when selectedOptions prop changes
  useEffect(() => {
    if (typeof selectedOptions !== "undefined") {
      if (multiSelect) {
        setSelectedOption(Array.isArray(selectedOptions) ? selectedOptions : []);
      } else {
        setSelectedOption(selectedOptions ?? null);
      }
    }
  }, [selectedOptions, multiSelect]);

  // Load options via async loader when provided
  useEffect(() => {
    let cancelled = false;
    const hasLoader = typeof loadOptions === "function";
    if (!hasLoader) {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setInternalOptions([]);
        setInternalError(null);
        setInternalLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    const run = async () => {
      setInternalLoading(true);
      setInternalError(null);
      try {
        const result = await loadOptions();
        if (!cancelled) {
          setInternalOptions(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        if (!cancelled) setInternalError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setInternalLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [loadOptions]);

  useEffect(() => {
    setSearchValue(defaultSearchValue || "");
  }, [defaultSearchValue]);

  const effectiveOptions = typeof loadOptions === "function" ? internalOptions : options;
  const effectiveLoading = Boolean(loading || internalLoading);
  const effectiveError = (() => {
    if (error) return typeof error === "string" ? error : "Failed to load";
    if (internalError) return internalError;
    return null;
  })();

  const OptionComponent = OptionComponentProp;

  // Dynamic item height measurement
  const [measuredItemHeight, setMeasuredItemHeight] = useState(null);

  // Fallback static calculation (used until first measurement)
  const getEstimatedItemHeight = useCallback(() => {
    if (OptionComponent) return 64; // ~60px + 4px gap
    switch (size) {
      case "small":
        return 31; // ~27px + 4px gap
      case "large":
        return 52; // ~48px + 4px gap
      default:
        return 31; // ~27px + 4px gap (default size)
    }
  }, [size, OptionComponent]);

  useIsomorphicLayoutEffect(() => {
    if (!menuIsOpen) {
      setMeasuredItemHeight(null);
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const containerHeight = container.clientHeight;
    if (!containerHeight || containerHeight <= 0) {
      requestAnimationFrame(() => {
        const retryContainer = scrollContainerRef.current;
        if (!retryContainer || !menuIsOpen) return;

        const retryHeight = retryContainer.clientHeight;
        if (!retryHeight || retryHeight <= 0) return;

        const firstItem = retryContainer.querySelector(
          '[data-list-wrapper="true"]:not([data-spacer="true"])'
        );

        if (firstItem) {
          const rect = firstItem.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(firstItem);
          const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

          const totalHeight = rect.height + marginBottom;

          setMeasuredItemHeight(Math.ceil(totalHeight));
        }
      });
      return;
    }

    const firstItem = container.querySelector(
      '[data-list-wrapper="true"]:not([data-spacer="true"])'
    );

    if (firstItem) {
      const rect = firstItem.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(firstItem);
      const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

      const totalHeight = rect.height + marginBottom;

      setMeasuredItemHeight(Math.ceil(totalHeight));
    } else {
      const timeoutId = setTimeout(() => {
        const retryContainer = scrollContainerRef.current;
        if (!retryContainer || !menuIsOpen) return;

        const retryItem = retryContainer.querySelector(
          '[data-list-wrapper="true"]:not([data-spacer="true"])'
        );

        if (retryItem) {
          const rect = retryItem.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(retryItem);
          const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
          const totalHeight = rect.height + marginBottom;
          setMeasuredItemHeight(Math.ceil(totalHeight));
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [menuIsOpen, size, OptionComponent]);

  const prevEffectiveLoadingRef = useRef(effectiveLoading);
  const isVisuallyActive = Boolean(forceActiveAppearance);

  useLayoutEffect(() => {
    const element = buttonRef.current;
    const hasJustEnteredLoading = !prevEffectiveLoadingRef.current && effectiveLoading;

    if (hasJustEnteredLoading && element) {
      const measuredWidth = element.offsetWidth;
      if (Number.isFinite(measuredWidth) && measuredWidth > 0) {
        controlWidthRef.current = measuredWidth;
        setControlWidth(measuredWidth);
      }
    }

    loadingRef.current = effectiveLoading;
    prevEffectiveLoadingRef.current = effectiveLoading;
  }, [effectiveLoading]);

  useLayoutEffect(() => {
    const element = buttonRef.current;
    if (!element) return;

    const thresholdPx = 0.5;

    const syncControlWidth = () => {
      const measuredWidth = element.offsetWidth;
      if (!Number.isFinite(measuredWidth) || measuredWidth <= 0) return;

      if (!loadingRef.current) {
        const previousWidth = controlWidthRef.current;
        const hasMeaningfulChange =
          typeof previousWidth !== "number" ||
          Math.abs(previousWidth - measuredWidth) > thresholdPx;

        if (hasMeaningfulChange) {
          controlWidthRef.current = measuredWidth;
          setControlWidth(measuredWidth);
        }
      }
    };

    syncControlWidth();

    if (typeof window !== "undefined" && typeof window.ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        syncControlWidth();
      });
      resizeObserver.observe(element);

      return () => {
        resizeObserver.disconnect();
      };
    }

    let animationFrameId = window.requestAnimationFrame(function tick() {
      syncControlWidth();
      animationFrameId = window.requestAnimationFrame(tick);
    });

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [effectiveLoading, text, size, multiSelect, searchValue, selectedOption, menuIsOpen]);

  const filteredOptionsBase = effectiveOptions.filter((option) => {
    if (!search) return true;
    const query = searchValue.toLowerCase();
    if (option.label.toLowerCase().includes(query)) return true;
    // Optional bag of aliases / synonyms (e.g. "css", "sem") — not shown in the row label.
    if (option.searchText && String(option.searchText).toLowerCase().includes(query)) {
      return true;
    }
    return false;
  });

  // Inject a synthetic "clear selection" option at the top when:
  // - canClear is enabled
  // - not multiselect
  // - there is a current selection
  const CLEAR_LABEL = i18n.t("ui.toolkit.dropdownSelect.clear");
  const shouldShowClear = Boolean(
    canClear &&
      !multiSelect &&
      (typeof selectedOptions !== "undefined" ? selectedOption !== null : selectedOption !== null)
  );

  const filteredOptions = shouldShowClear
    ? [
        {
          label: CLEAR_LABEL,
          value: "__clear__",
          // Always show icon for this special entry
          __isClear: true,
          icon: (
            <Icons.General.XClose
              height="var(--size-icon-small)"
              width="var(--size-icon-small)"
              color="var(--text-body-default)"
              strokeWidth="2.73"
            />
          )
        },
        ...filteredOptionsBase
      ]
    : filteredOptionsBase;

  // Auto-detect if any option has an icon
  const hasAnyIcon = filteredOptions.some((option) => option.icon || option.__isClear);

  // Report filtered count via callback
  useEffect(() => {
    if (typeof onFilteredCountChange === "function") {
      onFilteredCountChange(filteredOptions.length);
    }
  }, [filteredOptions.length, onFilteredCountChange]);

  const ITEM_HEIGHT = measuredItemHeight || getEstimatedItemHeight();

  const virtualizedRange = useMemo(() => {
    if (!menuIsOpen) {
      return { start: 0, end: 0, offset: 0 };
    }

    const container = scrollContainerRef.current;
    if (!container) {
      const conservativeEnd = Math.min(filteredOptions.length, BUFFER_SIZE * 2);
      return { start: 0, end: conservativeEnd, offset: 0 };
    }

    const containerHeight = container.clientHeight;
    if (!containerHeight || containerHeight <= 0) {
      const conservativeEnd = Math.min(filteredOptions.length, BUFFER_SIZE * 2);
      return { start: 0, end: conservativeEnd, offset: 0 };
    }

    const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT);

    const start = Math.max(0, visibleStart - BUFFER_SIZE);
    const end = Math.min(filteredOptions.length, visibleEnd + BUFFER_SIZE);

    const offset = start * ITEM_HEIGHT;

    return { start, end, offset };
  }, [filteredOptions.length, scrollTop, ITEM_HEIGHT, BUFFER_SIZE, menuIsOpen]);

  const visibleOptions = useMemo(() => {
    const maxRangeSize = 50;
    const start = virtualizedRange.start;
    const calculatedEnd = virtualizedRange.end;
    const rangeSize = calculatedEnd - start;

    const end = rangeSize > maxRangeSize ? start + maxRangeSize : calculatedEnd;

    return filteredOptions.slice(start, end);
  }, [filteredOptions, virtualizedRange.start, virtualizedRange.end]);

  const totalHeight = filteredOptions.length * ITEM_HEIGHT;

  const handleWrapperSelection = useCallback(
    (selectedKeys) => {
      const selectedOptionObjs = filteredOptions.filter((option) =>
        selectedKeys.includes(normalizeOptionValue(option?.value))
      );

      // Synthetic clear row uses value "__clear__" (label is translated)
      if (!multiSelect && selectedKeys.includes(DROPDOWN_CLEAR_VALUE)) {
        setMenuIsOpen(false);
        setSelectedOption(null);
        onChange(null);
        return;
      }

      if (multiSelect) {
        // The list only reports rows visible under the search, so keep selections the search hides.
        const visibleValues = new Set(
          filteredOptions.map((option) => normalizeOptionValue(option?.value))
        );
        const hiddenSelected = visualSelectedMulti.filter(
          (option) => !visibleValues.has(normalizeOptionValue(option?.value))
        );
        const combinedSelection = [...hiddenSelected, ...selectedOptionObjs];
        const nextSelection =
          typeof onMultiSelectToggle === "function"
            ? onMultiSelectToggle(combinedSelection)
            : combinedSelection;
        const nextSelectionArray = Array.isArray(nextSelection) ? nextSelection : combinedSelection;
        setPendingMultiSelectOptions(nextSelectionArray);
        setSelectedOption(nextSelectionArray);
      } else {
        const chosen = selectedOptionObjs[0];
        setMenuIsOpen(false);
        setSelectedOption(chosen);
        onChange(chosen);
      }
    },
    [filteredOptions, multiSelect, onChange, onMultiSelectToggle, visualSelectedMulti]
  );

  const applyKeyboardSelection = useCallback(
    (option) => {
      if (!option || option.disabled) return;

      if (option.__isClear) {
        handleWrapperSelection([DROPDOWN_CLEAR_VALUE]);
        return;
      }

      if (multiSelect) {
        const currentKeys = visualSelectedMulti.map((opt) => normalizeOptionValue(opt?.value));
        const optionKey = normalizeOptionValue(option.value);
        const hasKey = currentKeys.includes(optionKey);
        const nextKeys = hasKey
          ? currentKeys.filter((k) => k !== optionKey)
          : [...currentKeys, optionKey];
        handleWrapperSelection(nextKeys);
        return;
      }

      handleWrapperSelection([normalizeOptionValue(option.value)]);
    },
    [handleWrapperSelection, multiSelect, visualSelectedMulti]
  );

  useEffect(() => {
    if (defaultSelectedOption !== null) {
      // effectiveOptions[defaultSelectedOption] is undefined when the index is out of
      // range (e.g. -1 from a failed lookup upstream). Normalize to null so
      // hasSelection()/getSelectedText() correctly fall back to placeholder text
      // instead of rendering a blank selected value.
      setSelectedOption(effectiveOptions[defaultSelectedOption] ?? null);
    }
  }, [defaultSelectedOption, effectiveOptions]);

  const closeMenu = useCallback(() => {
    setIsSearchFocused(false);
    if (multiSelect && pendingMultiSelectOptions !== null) {
      const pendingValues = mapOptionValues(pendingMultiSelectOptions);
      const baselineValues = baselineAppliedValuesRef.current || [];
      const hasChanged = !areValueSetsEqual(pendingValues, baselineValues);

      if (hasChanged) {
        setSelectedOption(pendingMultiSelectOptions);
        baselineAppliedValuesRef.current = pendingValues;
        onChange(pendingMultiSelectOptions);
      } else {
        setSelectedOption(getAppliedMultiOptions());
      }

      setPendingMultiSelectOptions(null);
    }
    setMenuIsOpen(false);
  }, [multiSelect, pendingMultiSelectOptions, onChange, getAppliedMultiOptions]);

  // Close menu if loading activates
  useIsomorphicLayoutEffect(() => {
    if (effectiveLoading) {
      closeMenu();
    }
  }, [effectiveLoading, closeMenu]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!menuIsOpen) return;

      switch (e.key) {
        case "Escape":
          closeMenu();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuIsOpen, closeMenu]);

  const closeMenuRef = useRef(closeMenu);
  closeMenuRef.current = closeMenu;

  const updateMenuWidth = useCallback(() => {
    if (!buttonRef.current) return;
    const width = buttonRef.current.scrollWidth;
    setMenuWidth(width);
  }, []);

  useEffect(() => {
    // Measure control scrollWidth for menu sizing when menu opens
    if (menuIsOpen) {
      updateMenuWidth();
    }
  }, [menuIsOpen, updateMenuWidth]);

  useEffect(() => {
    if (!menuIsOpen || !buttonRef.current) return;
    updateMenuWidth();

    const hasResizeObserver = typeof ResizeObserver !== "undefined";
    let resizeObserver;
    if (hasResizeObserver) {
      resizeObserver = new ResizeObserver(updateMenuWidth);
      resizeObserver.observe(buttonRef.current);
    }

    window.addEventListener("resize", updateMenuWidth);

    return () => {
      window.removeEventListener("resize", updateMenuWidth);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [menuIsOpen, updateMenuWidth]);

  // Track scroll position for virtualization
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !menuIsOpen) return;

    const handleScroll = () => {
      setScrollTop(scrollContainer.scrollTop);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [menuIsOpen]);

  const handleSearchChange = useCallback(
    (event) => {
      setSearchValue(event.target.value);
      resetScrollPosition();
    },
    [resetScrollPosition]
  );

  // Ref to prevent duplicate keyboard navigation processing
  const isNavigatingRef = useRef(false);

  // Handle keyboard navigation
  useEffect(() => {
    if (!menuIsOpen) return;

    const handleKeyDown = (e) => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      if (e.key === "Enter") {
        const focusedElement = scrollContainer.querySelector('[data-focused="true"]');
        if (!focusedElement) return;

        const focusedValue = focusedElement.getAttribute("data-option-value");
        const targetOption = focusedValue
          ? filteredOptions.find((opt) => normalizeOptionValue(opt.value) === focusedValue)
          : filteredOptions.find((opt) => {
              const label =
                focusedElement.getAttribute("data-label") || focusedElement.textContent?.trim();
              return label && opt.label === label;
            });
        if (!targetOption || targetOption.disabled) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        applyKeyboardSelection(targetOption);
        return;
      }

      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (isNavigatingRef.current) return; // Prevent duplicate handling

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      isNavigatingRef.current = true;

      // Find currently focused item
      const focusedElement = scrollContainer.querySelector('[data-focused="true"]');

      let currentIndex = -1;
      if (focusedElement) {
        const focusedValue = focusedElement.getAttribute("data-option-value");
        if (focusedValue) {
          currentIndex = filteredOptions.findIndex(
            (opt) => normalizeOptionValue(opt.value) === focusedValue
          );
        } else {
          const focusedLabel =
            focusedElement.getAttribute("data-label") || focusedElement.textContent?.trim();
          currentIndex = filteredOptions.findIndex((opt) => opt.label === focusedLabel);
        }
      }

      // Calculate next index
      const direction = e.key === "ArrowDown" ? 1 : -1;
      let nextIndex = currentIndex + direction;

      // Skip disabled items
      while (nextIndex >= 0 && nextIndex < filteredOptions.length) {
        if (!filteredOptions[nextIndex].disabled) break;
        nextIndex += direction;
      }

      // Bounds check
      if (nextIndex < 0 || nextIndex >= filteredOptions.length) {
        isNavigatingRef.current = false;
        return;
      }

      const nextOption = filteredOptions[nextIndex];
      if (!nextOption) {
        isNavigatingRef.current = false;
        return;
      }

      // Helper function to scroll item into view with padding
      const scrollItemIntoView = (element) => {
        if (!element || !scrollContainer) return;

        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();

        // Use 2 item heights as consistent padding for smooth UX
        const offset = ITEM_HEIGHT * 2;

        // Check if element is below visible area (with padding)
        if (elementRect.bottom + offset > containerRect.bottom) {
          scrollContainer.scrollTop += elementRect.bottom - containerRect.bottom + offset;
        }
        // Check if element is above visible area (with padding)
        else if (elementRect.top - offset < containerRect.top) {
          scrollContainer.scrollTop -= containerRect.top - elementRect.top + offset;
        }
      };

      // Helper to find and focus element
      const findAndFocusElement = () => {
        // Remove focus from currently focused element
        const currentFocused = scrollContainer.querySelector('[data-focused="true"]');
        if (currentFocused) {
          currentFocused.setAttribute("data-focused", "false");
        }

        const nextKey = normalizeOptionValue(nextOption.value);
        let targetElement = null;
        try {
          targetElement = scrollContainer.querySelector(
            `[data-list-wrapper="true"][data-option-value="${CSS.escape(nextKey)}"]`
          );
        } catch {
          // CSS.escape might fail on some characters, use fallback
        }

        if (!targetElement) {
          const allItems = scrollContainer.querySelectorAll('[data-list-wrapper="true"]');
          for (const item of allItems) {
            const itemKey = item.getAttribute("data-option-value");
            if (itemKey === nextKey) {
              targetElement = item;
              break;
            }
          }
        }

        if (!targetElement && nextOption.label) {
          try {
            targetElement = scrollContainer.querySelector(
              `[data-list-wrapper="true"][data-label="${CSS.escape(nextOption.label)}"]`
            );
          } catch {
            // ignore
          }
        }

        if (!targetElement && nextOption.label) {
          const allItems = scrollContainer.querySelectorAll('[data-list-wrapper="true"]');
          for (const item of allItems) {
            const itemLabel = item.getAttribute("data-label");
            if (itemLabel === nextOption.label) {
              targetElement = item;
              break;
            }
          }
        }

        if (targetElement) {
          targetElement.setAttribute("data-focused", "true");
          scrollItemIntoView(targetElement);
          return true;
        }
        return false;
      };

      // Try to focus immediately (item might already be rendered)
      const foundImmediately = findAndFocusElement();

      if (!foundImmediately) {
        // Item not in DOM yet, need to scroll to render it in virtualization buffer
        const estimatedPosition = nextIndex * ITEM_HEIGHT;
        const containerHeight = scrollContainer.clientHeight;

        // Scroll to approximate position to trigger virtualization
        if (direction === 1) {
          // Scrolling down: position item near top of viewport
          scrollContainer.scrollTop = Math.max(0, estimatedPosition - ITEM_HEIGHT);
        } else {
          // Scrolling up: position item near bottom of viewport
          scrollContainer.scrollTop = Math.max(
            0,
            estimatedPosition - containerHeight + ITEM_HEIGHT * 2
          );
        }

        // Wait for virtualization to render, then focus
        requestAnimationFrame(() => {
          findAndFocusElement();
          isNavigatingRef.current = false;
        });
      } else {
        isNavigatingRef.current = false;
      }
    };

    // Use capture phase to intercept before ListItemWrapper
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [menuIsOpen, filteredOptions, ITEM_HEIGHT, applyKeyboardSelection]);

  const widthForLoading =
    controlWidthRef.current ?? controlWidth ?? buttonRef.current?.offsetWidth ?? null;

  const getSelectedText = (option, isMulti) => {
    if (!option) return "";
    return isMulti && Array.isArray(option)
      ? option.map((opt) => opt.label).join(", ")
      : option.label;
  };

  const isOptionSelected = (option) => {
    if (multiSelect) {
      return visualSelectedMulti.some(
        (opt) => normalizeOptionValue(opt?.value) === normalizeOptionValue(option?.value)
      );
    }
    if (typeof selectedOptions !== "undefined") {
      return normalizeOptionValue(selectedOption?.value) === normalizeOptionValue(option?.value);
    }
    return selectedOption === option;
  };

  const hasSelection = () => {
    if (multiSelect) {
      return visualSelectedMulti.length > 0;
    }
    return selectedOption !== null;
  };

  const isEmpty = !effectiveLoading && !effectiveError && effectiveOptions.length === 0;

  useEffect(() => {
    if (!menuIsOpen) return;
    if (!search) return;
    const frame = requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [menuIsOpen, search]);

  const placeholderText = effectiveError ? effectiveError : isEmpty ? emptyText : text;
  const placeholderIcon =
    React.isValidElement(iconLeft) && (effectiveError || isEmpty || disabled)
      ? React.cloneElement(iconLeft, { color: "var(--grayscale-500)" })
      : iconLeft;

  const getTippyPlacement = () => {
    switch (preferredDirection) {
      case "top":
        return "top-start";
      case "bottom":
        return "bottom-start";
      case "left":
        return "left-start";
      case "right":
        return "right-start";
      case "auto":
      default:
        return "bottom-start";
    }
  };

  const renderDropdownMenu = () => {
    return (
      <div
        className={clsx(styles.dropdown_menu_list, styles.dropdown_menu_tippy, {
          [styles.menu_open]: menuIsOpen
        })}
        style={{
          width: isMobile ? "100%" : menuWidth > 0 ? `${menuWidth + 8}px` : "auto"
        }}>
        {isMobile ? (
          <div
            className={clsx(styles.mobile_header, { [styles.mobile_header_no_search]: !search })}>
            {search ? (
              <div className={styles.search_container}>
                <InputSearch
                  ref={searchInputRef}
                  value={searchValue}
                  placeholder={text}
                  onChange={handleSearchChange}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  showClearButton={true}
                />
              </div>
            ) : (
              <span className={styles.mobile_header_title}>{mobileModalHeaderLabel || text}</span>
            )}
            <button
              type="button"
              className={styles.mobile_close_button}
              onClick={closeMenu}
              aria-label="Close">
              <Icons.General.X
                width="var(--size-icon-small)"
                height="var(--size-icon-small)"
                color="var(--grayscale-900)"
              />
            </button>
          </div>
        ) : (
          search && (
            <div className={styles.search_container}>
              <InputSearch
                ref={searchInputRef}
                size="small"
                value={searchValue}
                placeholder={text}
                onChange={handleSearchChange}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                showClearButton={true}
              />
            </div>
          )
        )}
        {effectiveError ? (
          <div
            style={{
              padding: 12,
              color: "var(--grayscale-900)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
            <Icons.User.FaceFrown
              height="var(--size-icon-small)"
              width="var(--size-icon-small)"
              color="var(--grayscale-900)"
            />
            <span>{effectiveError}</span>
          </div>
        ) : filteredOptions.length === 0 ? (
          <div
            style={{
              padding: 12,
              color: "var(--grayscale-700)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
            <Icons.General.HelpCircle
              height="var(--size-icon-small)"
              width="var(--size-icon-small)"
              color="var(--grayscale-700)"
            />
            <span>{search && effectiveOptions.length > 0 ? noResultsText : emptyText}</span>
          </div>
        ) : (
          <ListItemWrapper
            ref={scrollContainerRef}
            isMultiselect={multiSelect}
            scrollShadow={menuIsOpen && filteredOptions.length > 0}
            darkShadow={false}
            footnote={footnote}
            onSelectionChange={handleWrapperSelection}
            inFocus={false}
            customClassName={clsx(
              styles.scroll_wrapper_dropdown_select,
              search && isSearchFocused && styles.scroll_wrapper_dropdown_select_search_focus
            )}
            wrapper={wrapperId}
            itemGap={OptionComponent ? "var(--size-space-200)" : undefined}
            enableAnimation={false}
            selectedKeys={
              multiSelect
                ? visualSelectedMulti.map((opt) => normalizeOptionValue(opt?.value))
                : (typeof selectedOptions !== "undefined" ? selectedOptions : selectedOption)
                  ? [
                      normalizeOptionValue(
                        (typeof selectedOptions !== "undefined" ? selectedOptions : selectedOption)
                          ?.value
                      )
                    ]
                  : []
            }
            itemKeyProp="data-option-value">
            {(() => {
              // Generate all items with spacers
              const items = [];

              // Add top spacer
              if (virtualizedRange.offset > 0) {
                items.push(
                  <div
                    key="spacer-top"
                    style={{ height: `${virtualizedRange.offset}px`, flexShrink: 0 }}
                    data-hoverable="false"
                    data-spacer="true"
                  />
                );
              }

              // Add visible items
              visibleOptions.forEach((option, virtualIndex) => {
                const actualIndex = virtualizedRange.start + virtualIndex;
                const isDisabled = Boolean(option.disabled);
                const isActive = !isDisabled && isOptionSelected(option);

                const handleDisabledClick = (event) => {
                  event.stopPropagation();
                  if (typeof onAttemptDisabledOption === "function") {
                    onAttemptDisabledOption(option);
                  }
                };

                // The clear row is synthetic and its value is a toolkit-private sentinel, so it must
                // never reach a consumer renderer that treats option.value as real data (ADTR-10328).
                if (OptionComponent && !option.__isClear) {
                  const optionProps = {
                    text: option.label,
                    option,
                    active: isActive,
                    multiselect: multiSelect,
                    iconLeft: hasAnyIcon ? option.icon : undefined,
                    description: option.description,
                    caption: option.caption,
                    iconRight: option.iconRight,
                    iconRightEnabled: option.iconRightEnabled,
                    disabled: isDisabled,
                    style: option.style,
                    listWrapper: true,
                    "data-label": option.label,
                    "data-option-value": normalizeOptionValue(option.value)
                  };

                  if (typeof OptionComponent === "function") {
                    const renderedOption = OptionComponent(optionProps);
                    // Ensure the rendered element has a key for proper React reconciliation
                    if (React.isValidElement(renderedOption)) {
                      items.push(
                        React.cloneElement(renderedOption, {
                          key: renderedOption.key || actualIndex
                        })
                      );
                    } else {
                      items.push(renderedOption);
                    }
                  } else if (React.isValidElement(OptionComponent)) {
                    items.push(
                      React.cloneElement(OptionComponent, {
                        ...optionProps,
                        key: actualIndex
                      })
                    );
                  }
                } else if (isDisabled) {
                  items.push(
                    <div
                      key={actualIndex}
                      style={option.style}
                      onClick={handleDisabledClick}
                      data-list-wrapper="true"
                      data-label={option.label}
                      data-option-value={normalizeOptionValue(option.value)}>
                      <ListItem
                        text={option.label}
                        active={false}
                        multiselect={false}
                        iconLeft={hasAnyIcon ? option.icon : undefined}
                        description={option.description}
                        caption={option.caption}
                        iconRight={option.iconRight}
                        iconRightEnabled={option.iconRightEnabled}
                        disabled={true}
                        data-list-wrapper="true"
                        data-option-value={normalizeOptionValue(option.value)}
                      />
                    </div>
                  );
                } else {
                  items.push(
                    <ListItem
                      key={actualIndex}
                      text={option.label}
                      active={isActive}
                      multiselect={false}
                      iconLeft={hasAnyIcon ? option.icon : undefined}
                      description={option.description}
                      caption={option.caption}
                      iconRight={option.iconRight}
                      iconRightEnabled={option.iconRightEnabled}
                      data-list-wrapper="true"
                      data-label={option.label}
                      data-option-value={normalizeOptionValue(option.value)}
                    />
                  );
                }
              });

              // Add bottom spacer to maintain total height (marked as non-hoverable to skip during keyboard navigation)
              const bottomSpacerHeight =
                totalHeight - virtualizedRange.offset - visibleOptions.length * ITEM_HEIGHT;
              if (bottomSpacerHeight > 0) {
                items.push(
                  <div
                    key="spacer-bottom"
                    style={{ height: `${bottomSpacerHeight}px`, flexShrink: 0 }}
                    data-hoverable="false"
                    data-spacer="true"
                  />
                );
              }

              return items;
            })()}
          </ListItemWrapper>
        )}
      </div>
    );
  };

  const renderErrorTooltip = () => {
    if (!effectiveError) return null;
    return <p>{i18n.t("ui.toolkit.dropdown.error")}</p>;
  };

  const renderSelectedItemsTooltip = () => {
    if (!multiSelect || visualSelectedMulti.length === 0) {
      return null;
    }

    const OptionComponent = OptionComponentProp;
    const hasAnyIconInSelected = visualSelectedMulti.some((option) => option.icon);

    return (
      <div className={styles.selected_items_tooltip}>
        <ListItemWrapper
          isMultiselect={false}
          scrollShadow={visualSelectedMulti.length > 5}
          darkShadow={false}
          customClassName={styles.selected_items_list_wrapper}
          itemGap={OptionComponent ? "var(--size-space-200)" : undefined}>
          {visualSelectedMulti.map((option, index) => {
            if (OptionComponent) {
              const optionProps = {
                text: option.label,
                option,
                active: false,
                multiselect: false,
                iconLeft: hasAnyIconInSelected ? option.icon : undefined,
                description: option.description,
                caption: option.caption,
                iconRight: option.iconRight,
                iconRightEnabled: option.iconRightEnabled,
                disabled: false,
                style: option.style,
                listWrapper: true
              };

              if (typeof OptionComponent === "function") {
                return OptionComponent(optionProps);
              }

              if (React.isValidElement(OptionComponent)) {
                return React.cloneElement(OptionComponent, {
                  ...optionProps,
                  key: index
                });
              }

              return null;
            }

            return (
              <ListItem
                key={index}
                text={option.label}
                active={false}
                multiselect={false}
                iconLeft={hasAnyIconInSelected ? option.icon : undefined}
                description={option.description}
                caption={option.caption}
                iconRight={option.iconRight}
                iconRightEnabled={option.iconRightEnabled}
                disabled={false}
                data-list-wrapper="true"
              />
            );
          })}
        </ListItemWrapper>
      </div>
    );
  };

  const buttonControl = (
    <div
      className={clsx(styles.dropdown_button_control, {
        [styles.selected]: hasSelection(),
        [styles.menu_open]: menuIsOpen
      })}
      data-size={size}
      ref={buttonRef}
      data-loading={effectiveLoading}
      data-disabled={effectiveError || isEmpty || disabled ? true : undefined}
      aria-disabled={effectiveError || isEmpty || disabled ? true : undefined}
      data-active-visual={isVisuallyActive ? true : undefined}
      data-clarity-unmask="true"
      style={{ "--dropdown-width": widthForLoading ? `${widthForLoading}px` : undefined }}
      onClick={() => {
        if (effectiveLoading) return;
        if (effectiveError) return;
        if (isEmpty) return;
        if (disabled) return;
        if (menuIsOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      }}>
      {effectiveLoading ? (
        <Loader size={size} />
      ) : (
        <>
          <div className={styles.dropdown_single_value}>
            {multiSelect ? (
              <>
                {!showBadgeUI && placeholderIcon}
                <div className={styles.dropdown_text_container}>
                  <p className={styles.dropdown_single_value_text}>{placeholderText}</p>
                  <div
                    className={styles.dropdown_badge_container}
                    data-visible={showBadgeUI ? "true" : undefined}
                    aria-hidden={showBadgeUI ? undefined : true}>
                    <div className={styles.dropdown_badge_content} ref={badgeContentRef}>
                      {visualSelectedMulti.length > 0 ? (
                        <Tippy
                          content={renderSelectedItemsTooltip()}
                          placement="top"
                          trigger="mouseenter focus"
                          animation="fade"
                          arrow={true}
                          delay={[300, 0]}
                          maxWidth="none"
                          appendTo={getOverlayPortalTarget}>
                          <div className={styles.dropdown_badge_trigger}>
                            <Badge
                              text={visualSelectedMulti.length}
                              size="small"
                              className={styles.dropdown_badge}
                            />
                          </div>
                        </Tippy>
                      ) : (
                        <div className={styles.dropdown_badge_trigger}>
                          <Badge
                            text={visualSelectedMulti.length}
                            size="small"
                            className={styles.dropdown_badge}
                          />
                        </div>
                      )}
                      <span className={styles.dropdown_badge_secondary_text}>
                        {i18n.t("ui.toolkit.dropdownSelect.selectedItems")}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : hasSelection() ? (
              <>
                {iconLeftSelected && selectedOption?.icon}
                <div className={styles.dropdown_text_container}>
                  <span className={styles.dropdown_text_content}>
                    {getSelectedText(selectedOption, false)}
                  </span>
                </div>
              </>
            ) : (
              <>
                {placeholderIcon}
                <p className={styles.dropdown_single_value_text}>{placeholderText}</p>
              </>
            )}
          </div>
          <div className={styles.dropdown_button_control_icon}>
            {effectiveError ? (
              <Icons.User.FaceFrown
                height="var(--size-icon-small)"
                width="var(--size-icon-small)"
                color="var(--grayscale-500)"
              />
            ) : isEmpty ? (
              <Icons.General.HelpCircle
                height="var(--size-icon-small)"
                width="var(--size-icon-small)"
                color="var(--grayscale-500)"
              />
            ) : disabled ? (
              <Icons.Arrow.ChevronDown
                height="var(--size-icon-small)"
                width="var(--size-icon-small)"
                color={"var(--text-commentary-description)"}
                strokeWidth="2.73"
              />
            ) : (
              <Icons.Arrow.ChevronDown
                height="var(--size-icon-small)"
                width="var(--size-icon-small)"
                color={
                  menuIsOpen || isVisuallyActive ? "var(--grayscale-0)" : "var(--grayscale-1000)"
                }
                strokeWidth="2.73"
              />
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <div className={styles.dropdown_select__container}>
            {effectiveError ? (
              <Tippy
                content={renderErrorTooltip()}
                placement="top"
                trigger="mouseenter"
                animation="fade"
                arrow={true}
                delay={[300, 0]}
                appendTo={getOverlayPortalTarget}>
                {buttonControl}
              </Tippy>
            ) : (
              buttonControl
            )}
          </div>
          <Modal
            isOpen={menuIsOpen && !effectiveLoading}
            onClose={closeMenu}
            dismissible={true}
            showCloseButton={false}
            onOutsideClick={closeMenu}>
            {renderDropdownMenu()}
          </Modal>
        </>
      ) : (
        <Tippy
          content={renderDropdownMenu()}
          placement={getTippyPlacement()}
          interactive={true}
          visible={menuIsOpen && !effectiveLoading}
          onClickOutside={() => closeMenu()}
          onMount={(instance) => {
            // ponytail: Tippy sets data-reference-hidden on .tippy-box when trigger vanishes
            const isRefHidden = () =>
              instance.popper.hasAttribute("data-reference-hidden") ||
              Boolean(instance.popper.querySelector("[data-reference-hidden]"));
            const obs = new MutationObserver(() => {
              if (isRefHidden()) closeMenuRef.current();
            });
            obs.observe(instance.popper, {
              attributes: true,
              subtree: true,
              attributeFilter: ["data-reference-hidden"]
            });
            instance._adtRefHiddenObs = obs;
          }}
          onHidden={(instance) => {
            instance._adtRefHiddenObs?.disconnect();
          }}
          offset={[0, 4]}
          animation="fade"
          arrow={false}
          maxWidth="none"
          appendTo={getOverlayPortalTarget}>
          <div className={styles.dropdown_select__container}>
            {effectiveError ? (
              <Tippy
                content={renderErrorTooltip()}
                placement="top"
                trigger="mouseenter"
                animation="fade"
                arrow={true}
                delay={[300, 0]}
                appendTo={getOverlayPortalTarget}>
                {buttonControl}
              </Tippy>
            ) : (
              buttonControl
            )}
          </div>
        </Tippy>
      )}
    </>
  );
};
