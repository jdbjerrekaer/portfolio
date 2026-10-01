const OVERLAY_ROOT_SELECTOR = '[data-overlay-root="true"]';

export const getOverlayPortalTarget = (referenceElement) => {
  if (typeof document === "undefined") {
    return undefined;
  }

  if (referenceElement && typeof referenceElement.closest === "function") {
    const overlayRoot = referenceElement.closest(OVERLAY_ROOT_SELECTOR);
    if (overlayRoot) {
      return overlayRoot;
    }
  }

  return document.body;
};

