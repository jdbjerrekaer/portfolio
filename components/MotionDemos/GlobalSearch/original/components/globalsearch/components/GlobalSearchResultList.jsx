// portfolio edit: i18n is pre-initialised by the shared-i18n shim
import React, {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef
} from "react";
import { i18n } from "@adtraction/shared-i18n";
import { createPortal } from "react-dom";
import { useHistory } from "react-router-dom";
import { Icons } from "@adtraction/ui-icons";
import { writeToClipboard } from "@adtraction/util-clipboard";
import {
  ListItem,
  ListItemWrapper,
  Loader,
  PlaceholderSkeleton,
  Toaster
} from "@adtraction/ui-components";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import styles from "./GlobalSearchModal.module.scss";
import { GlobalSearchPageResultItem } from "./GlobalSearchPageResultItem";
import { GlobalSearchChannelResultItem } from "./GlobalSearchChannelResultItem";
import { GlobalSearchPartnerResultItem } from "./GlobalSearchPartnerResultItem";
import { getCommandCenterShortcutIds } from "../commandCenterShortcutIds";
import { getBrandEntityNavUrl } from "../getBrandEntityNavUrl";

/** Delay the progress bar so sub-second loads don't flash a loader. */
const LOADER_BAR_DELAY_MS = 400;
/** After this, show a calm status line while search is still in flight. */
const SLOW_HINT_DELAY_MS = 2500;
const SKELETON_ROW_COUNT = 6;

// Portal-based selection highlight that follows the selected item
const SelectionHighlight = ({ targetRect, visible }) => {
  if (!visible || !targetRect) return null;

  return createPortal(
    <div
      className={styles.selection_highlight_portal}
      style={{
        position: "fixed",
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        pointerEvents: "none",
        zIndex: 10000
      }}
    />,
    document.body
  );
};

const isBrandUser = (role) => role === "AdvertiserUser" || role === "SubAdvertiserUser";

const getResultEntityId = (result) => {
  if (!result) return "";
  return String(result.type === "channel" ? result.affiliateSiteId || result.id : result.id || "");
};

const GlobalSearchResultsLoading = ({ showLoaderBar, showSlowHint }) => (
  <div
    className={styles.results_loading}
    data-testid="global-search-results-loading"
    aria-busy="true"
    aria-live="polite">
    <div className={styles.loadingBarSlot}>
      {showLoaderBar ? (
        <div className={styles.loadingChromeEnter} data-testid="global-search-loader-bar">
          <Loader loadingBar size="default" />
        </div>
      ) : null}
    </div>
    {showSlowHint ? (
      <p
        className={clsx(styles.slowHint, styles.loadingChromeEnter)}
        data-testid="global-search-loading-slow">
        {i18n.t("platform.globalSearch.loadingSlow")}
      </p>
    ) : null}
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
      <div key={i} className={styles.loadingRow} data-testid="global-search-loading-row">
        <PlaceholderSkeleton isLoading width="14rem" initialHeight="1.5rem" />
        <div className={styles.loadingRowDetails}>
          <PlaceholderSkeleton isLoading width="4rem" initialHeight="1.25rem" />
          <PlaceholderSkeleton isLoading width="5rem" initialHeight="1.25rem" />
        </div>
        <PlaceholderSkeleton isLoading width="1rem" initialHeight="1rem" />
      </div>
    ))}
  </div>
);

export const GlobalSearchResultList = memo(
  forwardRef(
    (
      {
        searchResults,
        currentQuery,
        isLoadingLocal,
        updateRecentSearches,
        recentSearches = [],
        BrandItemComponent,
        onSuggestionClick,
        userRole = "partner",
        onItemSelected = () => {},
        HighlightTag,
        BrandCard = null
      },
      ref
    ) => {
      const [showLoaderBar, setShowLoaderBar] = useState(false);
      const [showSlowHint, setShowSlowHint] = useState(false);

      useEffect(() => {
        if (!isLoadingLocal) {
          setShowLoaderBar(false);
          setShowSlowHint(false);
          return undefined;
        }

        const barTimer = window.setTimeout(() => setShowLoaderBar(true), LOADER_BAR_DELAY_MS);
        const hintTimer = window.setTimeout(() => setShowSlowHint(true), SLOW_HINT_DELAY_MS);

        return () => {
          window.clearTimeout(barTimer);
          window.clearTimeout(hintTimer);
        };
      }, [isLoadingLocal]);

      const resolveApplicationStatus = (status) => {
        if (status === "APPLIED") return i18n.t("platform.globalSearch.application.waiting");
        if (status === "APPROVED") return i18n.t("platform.globalSearch.application.approved");
        if (status === "REJECTED") return i18n.t("platform.globalSearch.application.rejected");
        return undefined;
      };

      const mapResultToBrandCardProps = (result) => {
        if (!result) return null;

        const highlightType =
          Array.isArray(result.highlights) && result.highlights.length > 0
            ? result.highlights[0]
            : null;

        return {
          size: "small",
          brandName: result.title || "",
          country: result.flag || "",
          logoImage: result.logo || "",
          programID: result.id,
          category: result.category || "",
          categories: result.categories || [],
          backgroundImage: result.backgroundImage || "",
          highlightType: highlightType,
          applicationStatus: resolveApplicationStatus(result.status)
        };
      };

      const selectItemAria = (title, fallbackKey) =>
        i18n.t("platform.globalSearch.aria.selectItem", {
          title: title || i18n.t(fallbackKey)
        });

      const showSearchResults = searchResults !== null || isLoadingLocal;
      const [selectedIndex, setSelectedIndex] = useState(-1);
      const [mouseIsMoved, setMouseIsMoved] = useState(false);
      const [selectedRect, setSelectedRect] = useState(null);
      const resultsContainerRef = useRef(null);
      const logoCacheRef = useRef(new Set());
      const contextMenuWrapperRef = useRef(null);
      const copyToastIdRef = useRef(null);
      const [overscanPx, setOverscanPx] = useState(0);
      const [contextMenu, setContextMenu] = useState(null);
      const history = useHistory();

      const MAX_DISPLAYED_RESULTS = 15;
      const MAX_DISPLAYED_PAGES = 2;
      const safeSearchResults = Array.isArray(searchResults)
        ? searchResults.slice(0, MAX_DISPLAYED_RESULTS)
        : [];
      const safeRecentSearches = Array.isArray(recentSearches) ? recentSearches : [];

      const useCardLayout = BrandCard && userRole === "partner";
      const useBrandEntityRows = isBrandUser(userRole);
      const ItemComp = BrandItemComponent;

      // Shortcut cards already surface these pages — don't duplicate them under Recents.
      const shortcutPageIds = new Set(getCommandCenterShortcutIds(userRole));

      // Only count recents that this role/layout can actually render (avoids orphan "Recents" header).
      const visibleRecentSearches = safeRecentSearches.filter((search) => {
        if (!search?.type) return false;
        if (search.type === "page") {
          if (!search.route || shortcutPageIds.has(search.id)) return false;
          return true;
        }
        if (search.type === "brand") return Boolean(useCardLayout || ItemComp);
        if (search.type === "channel" || search.type === "partner") return useBrandEntityRows;
        return false;
      });

      // Partner Recents: max 2 page rows, then brand cards (flat index order for keyboard).
      const partnerRecentPages = useCardLayout
        ? visibleRecentSearches
            .filter((search) => search.type === "page")
            .slice(0, MAX_DISPLAYED_PAGES)
        : [];
      const partnerRecentBrands = useCardLayout
        ? visibleRecentSearches.filter((search) => search.type === "brand")
        : [];
      const partnerRecentFlat = useCardLayout
        ? [...partnerRecentPages, ...partnerRecentBrands]
        : [];
      const recentPageEntries = partnerRecentPages.map((result, index) => ({ result, index }));
      const recentBrandEntries = partnerRecentBrands.map((result, brandIndex) => ({
        result,
        index: partnerRecentPages.length + brandIndex
      }));

      // Search results: cap page rows so entity cards stay visible below.
      const searchPageResults = [];
      const searchEntityResults = [];
      safeSearchResults.forEach((result) => {
        if (!result) return;
        if (result.type === "page") {
          if (searchPageResults.length < MAX_DISPLAYED_PAGES) {
            searchPageResults.push(result);
          }
        } else {
          searchEntityResults.push(result);
        }
      });
      const cappedSearchResults = [...searchPageResults, ...searchEntityResults];

      const resultsToRender = showSearchResults
        ? cappedSearchResults
        : useCardLayout
          ? partnerRecentFlat
          : visibleRecentSearches;

      // Keep flat index order (pages then entities) for keyboard/portal selection.
      const pageResultEntries = searchPageResults.map((result, index) => ({ result, index }));
      const entityResultEntries = searchEntityResults.map((result, index) => ({
        result,
        index: searchPageResults.length + index
      }));

      useEffect(() => {
        setSelectedIndex(-1);
        setSelectedRect(null);
      }, [searchResults, recentSearches]);

      // Update selected rect for portal highlight
      const updateSelectedRect = useCallback(() => {
        if (selectedIndex >= 0 && !mouseIsMoved && resultsContainerRef.current) {
          const container = resultsContainerRef.current;
          const items = container.querySelectorAll('[data-search-item="true"]');

          if (items[selectedIndex]) {
            const itemElement = items[selectedIndex];
            const rect = itemElement.getBoundingClientRect();
            setSelectedRect({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            });
          } else {
            setSelectedRect(null);
          }
        } else {
          setSelectedRect(null);
        }
      }, [selectedIndex, mouseIsMoved]);

      useEffect(() => {
        if (selectedIndex >= 0 && !mouseIsMoved && resultsContainerRef.current) {
          const container = resultsContainerRef.current;
          const items = container.querySelectorAll('[data-search-item="true"]');

          if (items[selectedIndex]) {
            const itemElement = items[selectedIndex];
            const containerRect = container.getBoundingClientRect();
            const itemRect = itemElement.getBoundingClientRect();

            if (itemRect.top < containerRect.top) {
              container.scrollTop += itemRect.top - containerRect.top - 8;
            } else if (itemRect.bottom > containerRect.bottom) {
              container.scrollTop += itemRect.bottom - containerRect.bottom + 8;
            }
          }
        }
        // Update the portal rect after scroll adjustment
        requestAnimationFrame(updateSelectedRect);
      }, [selectedIndex, mouseIsMoved, showSearchResults, updateSelectedRect]);

      // Clear selection rect when mouse moves
      useEffect(() => {
        if (mouseIsMoved) {
          setSelectedRect(null);
        }
      }, [mouseIsMoved]);

      useEffect(() => {
        const handleMouseMove = () => {
          if (!mouseIsMoved) {
            setMouseIsMoved(true);
          }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
        };
      }, [mouseIsMoved]);

      // Measure one item to compute overscan (5 items worth)
      useEffect(() => {
        const c = resultsContainerRef.current;
        if (!c) return;
        const item = c.querySelector('[data-search-item="true"]');
        if (!item) return;
        const rect = item.getBoundingClientRect();
        const height = rect && rect.height ? rect.height : 64;
        setOverscanPx(Math.max(0, Math.round(height * 5)));
      }, [showSearchResults, safeSearchResults.length, visibleRecentSearches.length]);

      const handleResultSelection = useCallback(
        (result) => {
          if (result && !isLoadingLocal && result.id && result.type) {
            updateRecentSearches(result);
            try {
              onItemSelected(result);
            } finally {
              if (result.type === "page") {
                if (result.route) {
                  history.push(result.route);
                }
              } else if (result.type === "channel" || result.type === "partner") {
                history.push(getBrandEntityNavUrl(result));
              } else {
                history.push(`/brands/${result.id}`);
              }
            }
          }
        },
        [isLoadingLocal, updateRecentSearches, history, onItemSelected]
      );

      const closeContextMenu = useCallback(() => {
        setContextMenu(null);
      }, []);

      const openContextMenu = useCallback((event, result) => {
        if (!result || (result.type !== "channel" && result.type !== "partner")) return;

        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
          result,
          x: event.clientX,
          y: event.clientY
        });
      }, []);

      const openKeyboardContextMenu = useCallback((event, result) => {
        if (!result || (result.type !== "channel" && result.type !== "partner")) return;

        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setContextMenu({
          result,
          x: rect.left + 16,
          y: rect.top + 16
        });
      }, []);

      const handleCopyId = useCallback(async () => {
        const entityId = getResultEntityId(contextMenu?.result);
        closeContextMenu();
        if (!entityId) return;
        if (copyToastIdRef.current) {
          Toaster.dismiss(copyToastIdRef.current);
        }
        try {
          await writeToClipboard(entityId);
          copyToastIdRef.current = Toaster.trigger({
            type: "info",
            title: i18n.t("platform.globalSearch.toast.idCopied"),
            description: i18n.t("platform.sidemenu.toast.copiedValueToClipboard", {
              value: entityId
            }),
            icon: true,
            autoDismiss: true
          });
        } catch {
          copyToastIdRef.current = Toaster.trigger({
            type: "error",
            title: i18n.t("platform.globalSearch.toast.copyFailed"),
            icon: true,
            autoDismiss: true
          });
        }
      }, [contextMenu, closeContextMenu]);

      const handleOpenInNewTab = useCallback(() => {
        const url = getBrandEntityNavUrl(contextMenu?.result);
        closeContextMenu();
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }, [contextMenu, closeContextMenu]);

      const handleMenuItemKeyDown = useCallback(
        (event, action) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            action();
          } else if (event.key === "Escape") {
            closeContextMenu();
          }
        },
        [closeContextMenu]
      );

      const handleResultCardKeyDown = useCallback(
        (event, result) => {
          if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
            openKeyboardContextMenu(event, result);
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleResultSelection(result);
          }
        },
        [handleResultSelection, openKeyboardContextMenu]
      );

      useEffect(() => {
        if (!contextMenu) return;

        const handleKeyDown = (event) => {
          if (event.key === "Escape") {
            closeContextMenu();
          }
        };
        const handleViewportChange = () => closeContextMenu();

        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("resize", handleViewportChange);
        window.addEventListener("scroll", handleViewportChange, true);

        return () => {
          document.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("resize", handleViewportChange);
          window.removeEventListener("scroll", handleViewportChange, true);
        };
      }, [contextMenu, closeContextMenu]);

      useEffect(() => {
        if (!contextMenu) return;

        const rafId = requestAnimationFrame(() => {
          const firstItem = contextMenuWrapperRef.current?.querySelector(
            '[data-context-menu-item="true"]'
          );
          firstItem?.focus?.();
        });

        return () => cancelAnimationFrame(rafId);
      }, [contextMenu]);

      // Calculate number of columns in the grid by measuring items
      const getColumnsCount = useCallback(() => {
        if (!resultsContainerRef.current) return 1;
        const items = resultsContainerRef.current.querySelectorAll('[data-search-item="true"]');
        if (items.length < 2) return 1;

        const firstRect = items[0].getBoundingClientRect();
        let columns = 1;
        for (let i = 1; i < items.length; i++) {
          const rect = items[i].getBoundingClientRect();
          // If the item is on the same row (same top position), increment columns
          if (Math.abs(rect.top - firstRect.top) < 5) {
            columns++;
          } else {
            break;
          }
        }
        return columns;
      }, []);

      // Navigate function that can be called from parent via ref
      const navigate = useCallback(
        (direction) => {
          if (isLoadingLocal || resultsToRender.length === 0) return;

          setMouseIsMoved(false);
          const columns = getColumnsCount();

          if (direction === "right") {
            setSelectedIndex((prevIndex) => {
              if (prevIndex === -1) return 0;
              return prevIndex < resultsToRender.length - 1 ? prevIndex + 1 : 0;
            });
          } else if (direction === "left") {
            setSelectedIndex((prevIndex) => {
              if (prevIndex === -1) return resultsToRender.length - 1;
              return prevIndex > 0 ? prevIndex - 1 : resultsToRender.length - 1;
            });
          } else if (direction === "down") {
            setSelectedIndex((prevIndex) => {
              if (prevIndex === -1) return 0;
              const nextIndex = prevIndex + columns;
              return nextIndex < resultsToRender.length ? nextIndex : prevIndex;
            });
          } else if (direction === "up") {
            setSelectedIndex((prevIndex) => {
              if (prevIndex === -1) return resultsToRender.length - 1;
              const nextIndex = prevIndex - columns;
              return nextIndex >= 0 ? nextIndex : prevIndex;
            });
          }
        },
        [isLoadingLocal, resultsToRender.length, getColumnsCount]
      );

      // Expose navigate function to parent via ref
      useImperativeHandle(
        ref,
        () => ({
          navigate,
          hasResults: resultsToRender.length > 0
        }),
        [navigate, resultsToRender.length]
      );

      // Command center (empty query) keyboard is owned by GlobalSearchModal so shortcuts +
      // nav rows can join the same arrow list. ResultList only handles active search results.
      useEffect(() => {
        if (!showSearchResults) return undefined;

        const handleKeyDown = (event) => {
          if (isLoadingLocal || resultsToRender.length === 0) return;

          switch (event.key) {
            case "ArrowUp":
              event.preventDefault();
              navigate("up");
              break;
            case "ArrowDown":
              event.preventDefault();
              navigate("down");
              break;
            case "ArrowLeft":
              // Only navigate left if already in results (selectedIndex >= 0)
              if (selectedIndex >= 0) {
                event.preventDefault();
                navigate("left");
              }
              break;
            case "ArrowRight":
              // Only navigate right if already in results (selectedIndex >= 0)
              if (selectedIndex >= 0) {
                event.preventDefault();
                navigate("right");
              }
              break;
            case "Enter":
              if (selectedIndex >= 0 && selectedIndex < resultsToRender.length) {
                const selectedResult = resultsToRender[selectedIndex];
                if (selectedResult) {
                  handleResultSelection(selectedResult);
                }
              }
              break;
            default:
              break;
          }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
          window.removeEventListener("keydown", handleKeyDown);
        };
      }, [
        showSearchResults,
        selectedIndex,
        resultsToRender,
        isLoadingLocal,
        handleResultSelection,
        navigate
      ]);

      return (
        <div
          className={
            showSearchResults ? styles.search_results_wrapper : styles.recent_results_root
          }
          data-testid={showSearchResults ? undefined : "global-search-recents-root"}>
          <SelectionHighlight
            targetRect={selectedRect}
            visible={showSearchResults && selectedIndex >= 0 && !mouseIsMoved}
          />
          <Tippy
            visible={Boolean(contextMenu)}
            trigger="manual"
            interactive={true}
            placement="bottom-start"
            className={styles.context_menu_tippy}
            appendTo={document.body}
            onClickOutside={closeContextMenu}
            content={
              <div
                ref={contextMenuWrapperRef}
                className={styles.context_menu_wrapper}
                role="menu"
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.preventDefault()}>
                <ListItemWrapper
                  inFocus={Boolean(contextMenu)}
                  itemGap="0"
                  customClassName={styles.context_menu_list}>
                  <ListItem
                    size="small"
                    text={i18n.t("platform.globalSearch.contextMenu.copyId")}
                    iconRight={<Icons.General.Copy01 width="1rem" height="1rem" />}
                    role="menuitem"
                    tabIndex={0}
                    data-context-menu-item="true"
                    onClick={handleCopyId}
                    onKeyDown={(event) => handleMenuItemKeyDown(event, handleCopyId)}
                  />
                  <ListItem
                    size="small"
                    text={i18n.t("platform.globalSearch.contextMenu.openInNewTab")}
                    iconRight={<Icons.Arrow.NarrowUpRight width="1rem" height="1rem" />}
                    role="menuitem"
                    tabIndex={0}
                    data-context-menu-item="true"
                    onClick={handleOpenInNewTab}
                    onKeyDown={(event) => handleMenuItemKeyDown(event, handleOpenInNewTab)}
                  />
                </ListItemWrapper>
              </div>
            }
            getReferenceClientRect={() => ({
              width: 0,
              height: 0,
              top: contextMenu?.y || 0,
              bottom: contextMenu?.y || 0,
              left: contextMenu?.x || 0,
              right: contextMenu?.x || 0
            })}>
            <span style={{ display: "none" }} />
          </Tippy>
          {showSearchResults && (
            <p className={styles.search_results_header}>
              {i18n.t("platform.globalSearch.resultsHeader")}
            </p>
          )}
          <div className={styles.search_scroll_outer_wrapper}>
            {showSearchResults && (
              <div id="search_results_scroll_wrapper">
                <div
                  className={styles.search_results_container}
                  id="search_results_container"
                  ref={resultsContainerRef}>
                  {isLoadingLocal ? (
                    <GlobalSearchResultsLoading
                      showLoaderBar={showLoaderBar}
                      showSlowHint={showSlowHint}
                    />
                  ) : safeSearchResults.length === 0 ? (
                    <div className={styles.search_results_empty}>
                      <Icons.Files.FileX02
                        strokeWidth={1.73}
                        className={styles.search_results_icon}
                      />
                      <p>
                        {i18n.t("platform.globalSearch.noResults", {
                          query: currentQuery || ""
                        })}
                      </p>
                    </div>
                  ) : (
                    <>
                      {pageResultEntries.length > 0 && (
                        <div className={styles.page_results_list}>
                          {pageResultEntries.map(({ result, index }) => (
                            <GlobalSearchPageResultItem
                              key={`${result.type}-${result.id}-${index}`}
                              result={result}
                              isSelected={index === selectedIndex}
                              onMouseEnter={() => {
                                if (mouseIsMoved) {
                                  setSelectedIndex(index);
                                }
                              }}
                              onClick={() => handleResultSelection(result)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  handleResultSelection(result);
                                }
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {entityResultEntries.length > 0 && (
                        <div
                          className={clsx(
                            styles.entity_results_list,
                            useCardLayout && styles.search_results_grid
                          )}>
                          {entityResultEntries.map(({ result, index }) => {
                            if (result.type === "brand" && useCardLayout) {
                              const cardProps = mapResultToBrandCardProps(result);
                              const isSelected = index === selectedIndex;
                              return (
                                <div
                                  key={`${result.type}-${result.id}-${index}`}
                                  className={styles.search_card_item}
                                  data-search-item="true"
                                  data-selected={isSelected}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={selectItemAria(
                                    result.title,
                                    "platform.globalSearch.fallback.brand"
                                  )}
                                  onMouseEnter={() => {
                                    if (mouseIsMoved) {
                                      setSelectedIndex(index);
                                    }
                                  }}
                                  onClick={() => handleResultSelection(result)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleResultSelection(result);
                                    }
                                  }}>
                                  <React.Suspense
                                    fallback={<div className={styles.card_loading_skeleton} />}>
                                    <BrandCard {...cardProps} />
                                  </React.Suspense>
                                </div>
                              );
                            }

                            if (result.type === "brand" && ItemComp) {
                              return (
                                <ItemComp
                                  key={`${result.type}-${result.id}-${index}`}
                                  result={result}
                                  updateRecentSearches={updateRecentSearches}
                                  isLoadingLocal={isLoadingLocal}
                                  isSelected={index === selectedIndex}
                                  lazyRoot={resultsContainerRef}
                                  logoCacheRef={logoCacheRef}
                                  overscanPx={overscanPx}
                                  HighlightTag={HighlightTag}
                                  onMouseEnter={() => {
                                    if (mouseIsMoved) {
                                      setSelectedIndex(index);
                                    }
                                  }}
                                  onClick={() => handleResultSelection(result)}
                                />
                              );
                            }

                            if (result.type === "channel" && useBrandEntityRows) {
                              return (
                                <GlobalSearchChannelResultItem
                                  key={`${result.type}-${result.id}-${index}`}
                                  result={result}
                                  isSelected={index === selectedIndex}
                                  onMouseEnter={() => {
                                    if (mouseIsMoved) {
                                      setSelectedIndex(index);
                                    }
                                  }}
                                  onContextMenu={(event) => openContextMenu(event, result)}
                                  onClick={() => handleResultSelection(result)}
                                  onKeyDown={(event) => handleResultCardKeyDown(event, result)}
                                />
                              );
                            }

                            if (result.type === "partner" && useBrandEntityRows) {
                              return (
                                <GlobalSearchPartnerResultItem
                                  key={`${result.type}-${result.id}-${index}`}
                                  result={result}
                                  isSelected={index === selectedIndex}
                                  onMouseEnter={() => {
                                    if (mouseIsMoved) {
                                      setSelectedIndex(index);
                                    }
                                  }}
                                  onContextMenu={(event) => openContextMenu(event, result)}
                                  onClick={() => handleResultSelection(result)}
                                  onKeyDown={(event) => handleResultCardKeyDown(event, result)}
                                />
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {!showSearchResults &&
              (useCardLayout ? partnerRecentFlat.length > 0 : visibleRecentSearches.length > 0) && (
              <div
                className={styles.recent_search_section}
                data-testid="global-search-recents-section">
                <p className={styles.search_results_header}>
                  {i18n.t("platform.globalSearch.recentsHeader")}
                </p>
                <div className={styles.recent_search_container} ref={resultsContainerRef}>
                  {useCardLayout ? (
                    <>
                      {recentPageEntries.length > 0 && (
                        <div className={styles.page_results_list}>
                          {recentPageEntries.map(({ result, index }) => (
                            <GlobalSearchPageResultItem
                              key={`${result.type}-${result.id}-${index}`}
                              result={result}
                              isSelected={false}
                              onClick={() => handleResultSelection(result)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  handleResultSelection(result);
                                }
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {recentBrandEntries.length > 0 && (
                        <div
                          className={clsx(styles.entity_results_list, styles.search_results_grid)}
                          data-testid="global-search-recents-brand-grid">
                          {recentBrandEntries.map(({ result, index }) => {
                            const cardProps = mapResultToBrandCardProps(result);
                            return (
                              <div
                                key={`${result.type}-${result.id}-${index}`}
                                className={styles.search_card_item}
                                data-search-item="true"
                                data-selected={false}
                                role="button"
                                tabIndex={0}
                                aria-label={selectItemAria(
                                  result.title,
                                  "platform.globalSearch.fallback.brand"
                                )}
                                onClick={() => handleResultSelection(result)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleResultSelection(result);
                                  }
                                }}>
                                <React.Suspense
                                  fallback={<div className={styles.card_loading_skeleton} />}>
                                  <BrandCard {...cardProps} />
                                </React.Suspense>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    visibleRecentSearches.map((search, index) => {
                      if (search.type === "page") {
                        return (
                          <GlobalSearchPageResultItem
                            key={`${search.type}-${search.id}-${index}`}
                            result={search}
                            isSelected={false}
                            onClick={() => handleResultSelection(search)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleResultSelection(search);
                              }
                            }}
                          />
                        );
                      }

                      if (search.type === "brand" && ItemComp) {
                        return (
                          <ItemComp
                            key={`${search.type}-${search.id}-${index}`}
                            result={search}
                            updateRecentSearches={updateRecentSearches}
                            isLoadingLocal={isLoadingLocal}
                            variant="recent"
                            isSelected={false}
                            lazyRoot={resultsContainerRef}
                            logoCacheRef={logoCacheRef}
                            overscanPx={overscanPx}
                            HighlightTag={HighlightTag}
                            onClick={() => handleResultSelection(search)}
                          />
                        );
                      }

                      if (search.type === "channel" && useBrandEntityRows) {
                        return (
                          <GlobalSearchChannelResultItem
                            key={`${search.type}-${search.id}-${index}`}
                            result={search}
                            isSelected={false}
                            onContextMenu={(event) => openContextMenu(event, search)}
                            onClick={() => handleResultSelection(search)}
                            onKeyDown={(event) => handleResultCardKeyDown(event, search)}
                          />
                        );
                      }

                      if (search.type === "partner" && useBrandEntityRows) {
                        return (
                          <GlobalSearchPartnerResultItem
                            key={`${search.type}-${search.id}-${index}`}
                            result={search}
                            isSelected={false}
                            onContextMenu={(event) => openContextMenu(event, search)}
                            onClick={() => handleResultSelection(search)}
                            onKeyDown={(event) => handleResultCardKeyDown(event, search)}
                          />
                        );
                      }

                      return null;
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  )
);
