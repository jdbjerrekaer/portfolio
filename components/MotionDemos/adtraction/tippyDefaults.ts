// @ts-nocheck -- portfolio edit: vendored toolkit file (Tippy delay-as-function typing).
import { tippy } from "@tippyjs/react";

// Track when tippies are shown to enable smart delay
let lastTippyShownTime: number | null = null;
const SMART_DELAY_WINDOW_MS = 1400; // 1 second
const DEFAULT_DELAY_MS = 600;
const DEFAULT_TOOLTIP_Z_INDEX = 10000020;

const getTooltipZIndex = (): number => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return DEFAULT_TOOLTIP_Z_INDEX;
  }

  const tooltipZIndex = Number.parseInt(
    window.getComputedStyle(document.documentElement).getPropertyValue("--z-index-tooltip-above-modal").trim(),
    10
  );

  return Number.isFinite(tooltipZIndex) ? tooltipZIndex : DEFAULT_TOOLTIP_Z_INDEX;
};

// Function to calculate dynamic delay based on recent tippy activity
const getSmartDelay = (): [number, number] => {
  const now = Date.now();

  // If a tippy was shown within the last second, use 0 delay
  if (lastTippyShownTime !== null && now - lastTippyShownTime < SMART_DELAY_WINDOW_MS) {
    return [0, 0];
  }

  // Otherwise, use the default delay
  return [DEFAULT_DELAY_MS, 0];
};

// Set global defaults for all Tippy instances
tippy.setDefaultProps({
  // Set delay as a function that will be evaluated dynamically
  // Using type assertion because TippyJS runtime may support function delays even if types don't
  delay: getSmartDelay as unknown as [number, number],
  placement: "bottom",
  arrow: false,
  zIndex: getTooltipZIndex(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreate(instance: any) {
    const nextProps = {
      delay: getSmartDelay(),
      zIndex: getTooltipZIndex()
    };

    if (typeof instance?.setProps === "function") {
      instance.setProps(nextProps);
      return;
    }

    if (instance?.props) {
      instance.props.delay = nextProps.delay;
      instance.props.zIndex = nextProps.zIndex;
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTrigger(instance: any) {
    const nextProps = {
      delay: getSmartDelay(),
      zIndex: getTooltipZIndex()
    };

    if (typeof instance?.setProps === "function") {
      instance.setProps(nextProps);
      return;
    }

    if (instance?.props) {
      instance.props.delay = nextProps.delay;
      instance.props.zIndex = nextProps.zIndex;
    }
  },
  onShow() {
    // Update the timestamp when a tippy is shown
    lastTippyShownTime = Date.now();
  }
});
