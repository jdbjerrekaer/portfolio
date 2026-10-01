import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ListItem } from "../../../tokens/listItem/ListItem";
import { ListItemWrapper } from "../../../tokens/listItem/ListItemWrapper";
import { Icons } from "@adtraction/ui-icons";
import { Flag, Flags } from "@adtraction/ui-flags";
import { Badge } from "../../../tokens/badge/Badge";
import { Toaster } from "../../../tokens/toaster/Toaster";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import styles from "./PartnerName.module.scss";
import { i18n } from "@adtraction/shared-i18n";
import { writeToClipboard } from "@adtraction/util-clipboard";
import { getOverlayPortalTarget } from "../../../misc/overlayPortal";
import { CompressedElements } from "../../compressedElements/CompressedElements";
import { normalizeMarketCode } from "../channel/channelMarketUtils";
import { useTruncatedText } from "../useTruncatedText";
import { isTouchDevice, openLink, useLongPress } from "../../../../utils/touch";

/**
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.partnerName="Partner name"] - The display name of the partner.
 * @param {string|number|null} [props.partnerId=null] - Optional partner ID. When provided, enables a right-click context menu to view and copy the ID.
 * @param {string[]} [props.activeMarkets=[]] - Active market ISO codes.
 * @param {Object} [props.manager={}] - Manager information for the hover tooltip.
 * @param {string} [props.profileScore="High"] - Profile score label.
 * @param {string} [props.redirectUrl=""] - Optional URL opened on click.
 * @param {string} [props.size="default"] - Size variant.
 * @param {boolean} [props.wrapText=false] - Allow the name to wrap.
 * @param {string|null} [props.containerWidth=null] - Optional fixed width.
 * @param {boolean} [props.previewMarkets=false] - Show inline market preview.
 * @param {string|null} [props.preferredMarket=null] - Preferred market for preview ordering.
 * @param {boolean} [props.showManager=true] - Show manager in hover tooltip.
 * @param {boolean} [props.showProfileScore=true] - Show profile score in hover tooltip.
 * @param {boolean} [props.showActiveMarketsWhenEmpty=false] - Show empty markets state in tooltip.
 * @param {boolean} [props.isHoverable=true] - Enable hover tooltip.
 * @param {string} [props.preferredDirection="auto"] - Preferred tooltip placement.
 * @param {Function} [props.onClick] - Click handler.
 * @param {boolean|string} [props.focused=false] - Focused state.
 * @param {boolean|string} [props.listWrapper=false] - List wrapper context.
 * @param {Function} [props.onContextMenu] - Optional context menu handler.
 */
export const PartnerName = ({
  // Content
  partnerName = "Partner name",
  partnerId = null,
  activeMarkets = [],
  manager = {},
  profileScore = "High",
  redirectUrl = "",

  // Appearance
  size = "default",
  wrapText = false,
  containerWidth = null,
  previewMarkets = false,
  preferredMarket = null,

  // Visibility
  showManager = true,
  showProfileScore = true,
  showActiveMarketsWhenEmpty = false,

  // Behavior
  isHoverable = true,
  preferredDirection = "auto",

  // Events
  onClick = () => {},
  onContextMenu: onContextMenuProp,
  focused = false,
  listWrapper = false
}) => {
  const isFocused = focused === true || focused === "true";
  const isInListWrapper = listWrapper === true || listWrapper === "true";
  const hasTooltipContent =
    showManager ||
    activeMarkets.length > 0 ||
    showActiveMarketsWhenEmpty ||
    showProfileScore;

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isHoverTippyOpen, setIsHoverTippyOpen] = useState(false);
  const [suppressHoverUntilEnter, setSuppressHoverUntilEnter] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const hoverOpenTimeoutRef = useRef(null);
  const hasHoverTooltipRef = useRef(false);
  const [isNameTruncated, nameTextRef] = useTruncatedText(partnerName);

  const resolvedPartnerId = useMemo(() => {
    if (partnerId == null) {
      return "";
    }
    return String(partnerId).trim();
  }, [partnerId]);

  const hasContextMenu = resolvedPartnerId !== "";
  const contextMenuEnabled = hasContextMenu;

  const clearHoverOpenTimeout = useCallback(() => {
    if (hoverOpenTimeoutRef.current != null) {
      clearTimeout(hoverOpenTimeoutRef.current);
      hoverOpenTimeoutRef.current = null;
    }
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsContextMenuOpen(false);
    setIsHoverTippyOpen(false);
    setSuppressHoverUntilEnter(true);
    clearHoverOpenTimeout();
    triggerRef.current?.blur?.();
  }, [clearHoverOpenTimeout]);

  const openContextMenuAt = useCallback(
    (x, y) => {
      if (!contextMenuEnabled) {
        return;
      }
      clearHoverOpenTimeout();
      setIsHoverTippyOpen(false);
      setContextMenuPosition({ x, y });
      setIsContextMenuOpen(true);
    },
    [clearHoverOpenTimeout, contextMenuEnabled]
  );

  const handleContextMenu = useCallback(
    (event) => {
      onContextMenuProp?.(event);
      if (!contextMenuEnabled || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openContextMenuAt(event.clientX, event.clientY);
    },
    [contextMenuEnabled, onContextMenuProp, openContextMenuAt]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (!contextMenuEnabled) {
        return;
      }

      const isContextMenuKey = event.key === "ContextMenu";
      const isShiftF10 = event.key === "F10" && event.shiftKey;
      if (!isContextMenuKey && !isShiftF10) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = triggerRef.current?.getBoundingClientRect?.();
      if (rect) {
        openContextMenuAt(rect.left + rect.width / 2, rect.bottom);
        return;
      }

      openContextMenuAt(0, 0);
    },
    [contextMenuEnabled, openContextMenuAt]
  );

  const handleCopyPartnerId = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      closeContextMenu();

      try {
        await writeToClipboard(resolvedPartnerId);
        Toaster.trigger({
          type: "info",
          title: i18n.t("ui.toolkit.partnerName.contextMenu.copied"),
          autoDismiss: true,
          autoDismissTime: 3000
        });
      } catch {
        Toaster.trigger({
          type: "error",
          title: i18n.t("ui.toolkit.partnerName.contextMenu.copyFailed"),
          autoDismiss: true,
          autoDismissTime: 4000
        });
      }
    },
    [closeContextMenu, resolvedPartnerId]
  );

  useEffect(() => {
    if (!isContextMenuOpen && !isHoverTippyOpen) {
      return undefined;
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        if (isContextMenuOpen) {
          closeContextMenu();
        } else {
          clearHoverOpenTimeout();
          setIsHoverTippyOpen(false);
        }
        return;
      }

      if (!isContextMenuOpen) {
        return;
      }

      if (event.key === "Enter") {
        const target = event.target;
        const inTrigger = triggerRef.current?.contains?.(target);
        const inMenu =
          typeof target?.closest === "function" &&
          Boolean(target.closest(`.${styles.partnername_context_menu}`));
        if (!inTrigger && !inMenu) {
          return;
        }
        event.preventDefault();
        handleCopyPartnerId(event);
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);
    if (isContextMenuOpen) {
      window.addEventListener("scroll", closeContextMenu, true);
    }

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      window.removeEventListener("scroll", closeContextMenu, true);
    };
  }, [
    clearHoverOpenTimeout,
    closeContextMenu,
    handleCopyPartnerId,
    isContextMenuOpen,
    isHoverTippyOpen
  ]);

  useEffect(() => () => clearHoverOpenTimeout(), [clearHoverOpenTimeout]);

  const contextMenuReferenceRect = useMemo(
    () => ({
      width: 0,
      height: 0,
      x: contextMenuPosition.x,
      y: contextMenuPosition.y,
      top: contextMenuPosition.y,
      bottom: contextMenuPosition.y,
      left: contextMenuPosition.x,
      right: contextMenuPosition.x
    }),
    [contextMenuPosition]
  );

  const contextMenuContent = useMemo(
    () => (
      <div
        className={styles.partnername_context_menu}
        role="menu"
        aria-label={i18n.t("ui.toolkit.partnerName.contextMenu.ariaLabel")}
        onContextMenu={(event) => event.preventDefault()}>
        <ListItemWrapper
          customClassName={styles.partnername_context_menu_items}
          inFocus={isContextMenuOpen}
          enableAnimation={false}>
          <ListItem
            size="small"
            text={resolvedPartnerId}
            description={i18n.t("ui.toolkit.partnerName.contextMenu.copy")}
            iconLeft={<Icons.General.Copy01 />}
            onClick={handleCopyPartnerId}
          />
        </ListItemWrapper>
      </div>
    ),
    [handleCopyPartnerId, isContextMenuOpen, resolvedPartnerId]
  );

  const normalizedPreferredMarket = useMemo(
    () => normalizeMarketCode(preferredMarket),
    [preferredMarket]
  );

  const inlinePreviewElements = useMemo(() => {
    if (!previewMarkets || !Array.isArray(activeMarkets) || activeMarkets.length === 0) {
      return null;
    }

    const matchIndex = normalizedPreferredMarket
      ? activeMarkets.findIndex((code) => normalizeMarketCode(code) === normalizedPreferredMarket)
      : -1;

    const orderedMarkets =
      matchIndex >= 0
        ? [
            activeMarkets[matchIndex],
            ...activeMarkets.filter((_, index) => index !== matchIndex)
          ]
        : activeMarkets;

    const normalizedCodes = orderedMarkets.map((code) => normalizeMarketCode(code)).filter(Boolean);
    const validCodes = normalizedCodes.filter((code) => Boolean(Flags[code]));
    const displayCodes = validCodes.length > 0 ? validCodes : normalizedCodes;

    if (displayCodes.length === 0) {
      return null;
    }

    return displayCodes.map((code) => ({
      icon: <Flag flag={code} width={16} height={16} />,
      description: code
    }));
  }, [activeMarkets, normalizedPreferredMarket, previewMarkets]);

  const hasSingleMarket = useMemo(() => {
    if (!previewMarkets || !inlinePreviewElements) {
      return false;
    }

    return inlinePreviewElements.length === 1;
  }, [inlinePreviewElements, previewMarkets]);

  const singleMarketFlagElement = useMemo(() => {
    if (!hasSingleMarket || !inlinePreviewElements || inlinePreviewElements.length !== 1) {
      return null;
    }

    return inlinePreviewElements[0].icon;
  }, [hasSingleMarket, inlinePreviewElements]);

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

  const longPress = useLongPress(() => {
    if (hasHoverTooltipRef.current && !isContextMenuOpen) setIsHoverTippyOpen(true);
  });

  const handlePartnerClick = (event) => {
    if (longPress.consumeLongPress()) {
      event?.preventDefault();
      return;
    }
    if (redirectUrl) {
      openLink(redirectUrl);
    }
    onClick();
  };

  const getProfileScoreColor = () => {
    switch (profileScore?.toLowerCase()) {
      case "high":
        return "var(--ui-colors-green-600)";
      case "medium":
        return "var(--ui-colors-yellow-600)";
      case "low":
        return "var(--ui-colors-red-600)";
      default:
        return "var(--ui-colors-green-600)";
    }
  };

  const getProfileScoreIcon = () => {
    const iconColor = getProfileScoreColor();
    switch (profileScore?.toLowerCase()) {
      case "high":
        return <Icons.Arrow.ChevronUp color={iconColor} strokeWidth={2.73} />;
      case "medium":
        return <Icons.General.Minus color={iconColor} strokeWidth={2.73} />;
      case "low":
        return <Icons.Arrow.ChevronDown color={iconColor} strokeWidth={2.73} />;
      default:
        return <Icons.Arrow.ChevronUp color={iconColor} strokeWidth={2.73} />;
    }
  };

  const profileScoreColor = getProfileScoreColor();
  const profileScoreIcon = getProfileScoreIcon();

  const tooltipContent =
    hasTooltipContent || isNameTruncated ? (
      <div className={styles.partnername_tooltip}>
        {isNameTruncated && <ListItem hoverable={false} text={partnerName} size="small" />}
        {showManager && (
          <ListItem
            hoverable={false}
            iconLeft={manager.avatar ? manager.avatar : <Icons.Custom.AdtractionOutline />}
            text={manager.name || i18n.t("ui.toolkit.account.manager")}
            description={i18n.t("ui.toolkit.account.manager")}
            size="small"
          />
        )}

        {(activeMarkets.length > 0 || showActiveMarketsWhenEmpty) && (
          <div className={styles.tooltip_active_markets_container}>
            <p className={styles.tooltip_active_markets_text}>
              {i18n.t("ui.toolkit.partnerName.activeMarkets")}
            </p>
            {activeMarkets.length > 0 ? (
              <div className={styles.tooltip_active_markets_flags}>
                {activeMarkets.map((countryCode, index) => (
                  <div key={`${countryCode}-${index}`} className={styles.flag_container}>
                    <Flag
                      flag={countryCode}
                      width="var(--size-icon-small)"
                      height="var(--size-icon-small)"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.tooltip_active_markets_none}>
                {i18n.t("ui.toolkit.partnerName.none")}
              </p>
            )}
          </div>
        )}

        {showProfileScore && (
          <div className={styles.tooltip_profile_score_container}>
            <p className={styles.tooltip_profile_score_text}>
              {i18n.t("ui.toolkit.partnerName.profileScore")}
            </p>
            <Badge
              iconLeft={profileScoreIcon}
              text={profileScore}
              ghostColor={profileScoreColor}
              size="small"
            />
          </div>
        )}
      </div>
    ) : null;

  const hasHoverTooltip = Boolean(tooltipContent) && isHoverable !== false;
  hasHoverTooltipRef.current = hasHoverTooltip;

  const handleMouseEnter = useCallback(() => {
    if (suppressHoverUntilEnter || isTouchDevice()) {
      return;
    }

    if (hasHoverTooltipRef.current && !isContextMenuOpen) {
      clearHoverOpenTimeout();
      hoverOpenTimeoutRef.current = setTimeout(() => {
        setIsHoverTippyOpen(true);
        hoverOpenTimeoutRef.current = null;
      }, 300);
    }
  }, [clearHoverOpenTimeout, isContextMenuOpen, suppressHoverUntilEnter]);

  const handleMouseLeave = useCallback(() => {
    setSuppressHoverUntilEnter(false);
    clearHoverOpenTimeout();
    if (!isContextMenuOpen) {
      setIsHoverTippyOpen(false);
    }
  }, [clearHoverOpenTimeout, isContextMenuOpen]);

  const handleFocus = useCallback(() => {
    if (isTouchDevice()) return;
    if (hasHoverTooltipRef.current && !isContextMenuOpen && !suppressHoverUntilEnter) {
      clearHoverOpenTimeout();
      hoverOpenTimeoutRef.current = setTimeout(() => {
        setIsHoverTippyOpen(true);
        hoverOpenTimeoutRef.current = null;
      }, 300);
    }
  }, [clearHoverOpenTimeout, isContextMenuOpen, suppressHoverUntilEnter]);

  const handleBlur = useCallback(() => {
    clearHoverOpenTimeout();
    if (!isContextMenuOpen) {
      setIsHoverTippyOpen(false);
    }
  }, [clearHoverOpenTimeout, isContextMenuOpen]);

  const partnerNameContent = (
    <div
      ref={triggerRef}
      onClick={handlePartnerClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...longPress.handlers}
      onContextMenu={contextMenuEnabled ? handleContextMenu : onContextMenuProp}
      onKeyDown={contextMenuEnabled ? handleKeyDown : undefined}
      className={clsx(styles.partnername_container, styles[size], wrapText && styles.wrap)}
      style={containerWidth ? { width: containerWidth, maxWidth: "100%" } : undefined}
      data-context-menu={contextMenuEnabled ? "true" : undefined}
      data-isopen={isHoverTippyOpen || isContextMenuOpen}
      data-list-wrapper={isInListWrapper ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      tabIndex={contextMenuEnabled ? -1 : undefined}>
      <p ref={nameTextRef} className={styles.partnername_text}>
        {partnerName}
      </p>
      {previewMarkets && hasSingleMarket && singleMarketFlagElement && (
        <span className={styles.partnername_inline_preview} aria-hidden="true">
          {singleMarketFlagElement}
        </span>
      )}
      {previewMarkets && !hasSingleMarket && inlinePreviewElements?.length > 0 && (
        <span className={styles.partnername_compressed_elements_wrapper}>
          <CompressedElements
            elements={inlinePreviewElements}
            maxAmountToBeShown={1}
            size="small"
            tagSize="small"
          />
        </span>
      )}
      {size === "default" && (
        <div className={styles.partnername_icon}>
          <Icons.Arrow.NarrowUpRight
            width="var(--size-icon-small)"
            height="var(--size-icon-small)"
            color="var(--primary-blue-400)"
            strokeWidth={2.73}
          />
        </div>
      )}
    </div>
  );

  if (!hasHoverTooltip && !contextMenuEnabled) {
    return partnerNameContent;
  }

  const tippyVisible = isContextMenuOpen || isHoverTippyOpen;

  return (
    <Tippy
      content={isContextMenuOpen ? contextMenuContent : tooltipContent}
      visible={tippyVisible}
      interactive={true}
      trigger="manual"
      theme={isContextMenuOpen ? "context_menu" : undefined}
      placement={isContextMenuOpen ? "bottom-start" : getTippyPlacement()}
      appendTo={(ref) =>
        isContextMenuOpen ? document.body : getOverlayPortalTarget(ref) || document.body
      }
      getReferenceClientRect={() => {
        if (isContextMenuOpen) {
          return contextMenuReferenceRect;
        }
        if (triggerRef.current) {
          return triggerRef.current.getBoundingClientRect();
        }
        return null;
      }}
      onClickOutside={() => {
        if (isContextMenuOpen) {
          closeContextMenu();
        }
      }}
      offset={[0, 4]}
      animation="fade"
      arrow={false}
      maxWidth="none"
      popperOptions={{
        modifiers: [
          {
            name: "contextMenuHugContent",
            enabled: isContextMenuOpen,
            phase: "beforeWrite",
            fn: ({ state }) => {
              state.styles.popper.width = "max-content";
            },
            effect: ({ state }) => {
              state.elements.popper.style.width = "max-content";
            }
          }
        ]
      }}>
      {partnerNameContent}
    </Tippy>
  );
};
