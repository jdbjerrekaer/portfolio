// portfolio edit: i18n is pre-initialised by the shared-i18n shim
import React, { useState, useEffect, useContext } from "react";
import { UserRoleContext } from "@adtraction/util-providers";
import { GlobalSearchBar } from "./components/GlobalSearchBar";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import styles from "./GlobalSearch.module.scss";

// Centralized defaults to mirror the organization pattern used in PartnerSidemenu
export const DEFAULT_FAKE_SEARCH_DELAY = 1000;

/**
 * GlobalSearch component
 *
 * Props
 * - fakeSearchDelay: number — Delay (ms) before showing search results
 * - getCountries: function — Function to fetch countries (optional)
 * - BrandCard: React.ComponentType — BrandCard component for displaying brand results (optional)
 * - disabled: boolean — Disables the search bar when true
 * - compact: boolean — Animates the bar into a compact icon-only trigger (e.g., collapsed sidemenu)
 * - searchablePages: Array — access-filtered page registry entries from the host layout
 * - entitySearchEnabled: boolean — when false, skip remote brand/partner/channel API search
 */
export const GlobalSearch = ({
  fakeSearchDelay = DEFAULT_FAKE_SEARCH_DELAY,
  userRoleOverride,
  HighlightTag,
  getCountries = null,
  getBrandsAgent = null,
  BrandCard = null,
  searchablePages = [],
  entitySearchEnabled = true,
  disabled = false,
  compact = false,
  // portfolio edit: ⌘K is only captured while this returns true (demo hovered/focused), not page-wide
  isShortcutInScope = () => true
}) => {
  const { userInfo } = useContext(UserRoleContext);
  const [showModal, setShowModal] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const userRole = userRoleOverride || userInfo?.userRole || "partner";

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't open search modal if disabled
      if (disabled) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (!showModal && !isShortcutInScope()) return; // portfolio edit: scope ⌘K to the demo
        e.preventDefault();

        setShouldFocus(true);
        setShowModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, disabled, isShortcutInScope]); // portfolio edit: + isShortcutInScope

  // Detect mobile viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(update);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", update);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(update);
      }
    };
  }, []);

  const handleFocusConsumed = () => {
    setShouldFocus(false);
  };

  const handleShowModal = () => {
    // Don't open modal if disabled
    if (disabled) return;

    setShowModal(true);
    setShouldFocus(true);
  };

  const hideModal = () => {
    setShowModal(false);
    setShouldFocus(false);
  };

  return (
    <div className={`${styles.global_search}${disabled ? ` ${styles.disabled}` : ""}`}>
      <div className={styles.search_container}>
        {!isMobile || !showModal ? (
          <GlobalSearchBar
            onClick={handleShowModal}
            disabled={disabled}
            showFocused={showModal}
            compact={compact}
          />
        ) : null}
      </div>
      {!disabled && (
        <GlobalSearchModal
          showModal={showModal}
          onHide={hideModal}
          shouldFocus={shouldFocus}
          onFocusConsumed={handleFocusConsumed}
          fakeSearchDelay={fakeSearchDelay}
          userRole={userRole}
          HighlightTag={HighlightTag}
          getCountries={getCountries}
          getBrandsAgent={getBrandsAgent}
          BrandCard={BrandCard}
          searchablePages={searchablePages}
          entitySearchEnabled={entitySearchEnabled}
        />
      )}
    </div>
  );
};

export default GlobalSearch;
