import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { Icons } from "@adtraction/ui-icons";
import { AFFILIATESITE_ADVERTPROGRAM_STATUS } from "@adtraction/util-constants";
import { ListItem } from "../../../../tokens/listItem/ListItem";
import { ListItemWrapper } from "../../../../tokens/listItem/ListItemWrapper";
import { Tag } from "../../../../tokens/tag/Tag";
import { Toaster } from "../../../../tokens/toaster/Toaster";
import { Flag, Flags } from "@adtraction/ui-flags";
import { CompressedElements } from "../../../compressedElements/CompressedElements";
import { ChannelTypeIconBadge } from "../channelType/ChannelTypeIconBadge";
import { ChannelStatusIcon } from "../channelStatusIcon/ChannelStatusIcon";
import { i18n } from "@adtraction/shared-i18n";
import { writeToClipboard } from "@adtraction/util-clipboard";
import {
  CHANNEL_CATEGORY_MAP,
  CHANNEL_PRIMARY_TYPES,
  CHANNEL_TYPE_ICON_MAP,
  CHANNEL_TYPE_LABELS,
  mapTagToChannelType
} from "../channelConstants";
import { normalizeMarketCode } from "../channelMarketUtils";
import { getOverlayPortalTarget } from "../../../../misc/overlayPortal";
import { useTruncatedText } from "../../useTruncatedText";
import styles from "./ChannelName.module.scss";
import { isTouchDevice, useLongPress } from "../../../../../utils/touch";

/**
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.channelName="Channel name"] - The display name of the channel.
 * @param {string} [props.channelUrl=""] - Optional URL for the channel. When provided, displays with an external link icon.
 * @param {string} [props.partnerName=""] - Optional partner/company name shown in the hover tooltip as a ListItem above Channel markets.
 * @param {string} props.channelType - The type/category of the channel from the backend. Can be a raw backend tag (e.g., "comparison shopping service", "css") or a valid channel type. Will be automatically mapped to a valid channel type internally.
 * @param {string|number|null} [props.channelId=null] - Optional channel ID. When provided, enables a right-click context menu to view and copy the ID.
 * @param {string} [props.className=""] - Additional CSS classes to apply to the root container.
 * @param {Object|null} [props.manager=null] - Manager information object.
 * @param {string} [props.manager.name] - Manager's name to display in tooltip.
 * @param {React.ReactNode} [props.manager.avatar] - Manager's avatar icon/component. Defaults to AdtractionOutline icon if not provided.
 * @param {string[]} [props.channelMarkets=[]] - Array of ISO country codes representing the markets where the channel operates. Used for tooltip and inline preview.
 * @param {boolean} [props.previewChannels=false] - When true, displays inline preview of channel markets next to the URL (if present).
 * @param {boolean} [props.disableTooltip=false] - When true, disables the tooltip completely. Component renders without Tippy wrapper.
 * @param {boolean} [props.tooltipInteractive=true] - When true, makes the tooltip interactive (allows mouse interaction within tooltip).
 * @param {boolean|string} [props.focused=false] - Whether the component is in a focused state. Accepts boolean or string "true"/"false".
 * @param {boolean|string} [props.active=false] - Whether the component is in an active/selected state. Accepts boolean or string "true"/"false".
 * @param {boolean|string} [props.listWrapper=false] - Whether the component is rendered within a list wrapper context. Accepts boolean or string "true"/"false".
 * @param {boolean|string} [props.hoverable=true] - Whether the component responds to hover. Accepts boolean or string "true"/"false".
 * @param {boolean|string} [props.disabled=false] - Whether the component is disabled. Accepts boolean or string "true"/"false".
 * @param {string|null} [props.preferredMarket=null] - Optional ISO country code whose flag should be prioritised in the inline preview when previewChannels is enabled.
 * @param {boolean} [props.enableBadgeTooltip=false] - When true, the ChannelTypeIconBadge can receive hover and show its own tooltip. When false (default), pointer events on the badge are suppressed. Consumed from rest and not forwarded to the root DOM element.
 * @param {boolean} [props.showStatusIcon=true] - When false, hides the inline status icon and lets market previews render even when applicationStatus is present.
 * @param {number|null} [props.applicationStatus=null] - Application status (1=Approved, 2=Pending, 0=Rejected, -9=Not Applied).
 * @param {Function} [props.onMouseEnter] - Mouse enter event handler.
 * @param {Function} [props.onMouseLeave] - Mouse leave event handler.
 * @param {Function} [props.onFocus] - Focus event handler.
 * @param {Function} [props.onBlur] - Blur event handler.
 * @param {...Object} [props.rest] - Additional props to spread onto the root container element.
 */
export const ChannelName = ({
  channelName = "Channel name",
  channelUrl = "",
  partnerName = "",
  channelType,
  channelId = null,
  className = "",
  manager = null,
  channelMarkets = [],
  previewChannels = false,
  disableTooltip = false,
  tooltipInteractive = true,
  focused = false,
  active = false,
  listWrapper = false,
  applicationStatus = null,
  ...rest
}) => {
  const {
    onMouseEnter: onMouseEnterProp,
    onMouseLeave: onMouseLeaveProp,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    onContextMenu: onContextMenuProp,
    preferredMarket = null,
    hoverable = true,
    disabled = false,
    enableBadgeTooltip = false,
    showStatusIcon = true,
    ...restProps
  } = rest;

  const isFocused = focused === true || focused === "true";
  const isActive = active === true || active === "true";
  const isInListWrapper = listWrapper === true || listWrapper === "true";
  const isDisabled = disabled === true || disabled === "true";
  const [isHovered, setIsHovered] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isHoverTippyOpen, setIsHoverTippyOpen] = useState(false);
  const [suppressHoverUntilEnter, setSuppressHoverUntilEnter] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef(null);
  const hoverOpenTimeoutRef = useRef(null);
  const hasHoverTooltipRef = useRef(false);
  const [isNameTruncated, nameTextRef] = useTruncatedText(channelName);

  const resolvedChannelId = useMemo(() => {
    if (channelId == null) {
      return "";
    }
    return String(channelId).trim();
  }, [channelId]);

  const hasContextMenu = resolvedChannelId !== "";
  // Match CellContextMenu: right-click primary; no forced tab stop in tables.
  const contextMenuEnabled = hasContextMenu && !isDisabled;

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

  const handleCopyChannelId = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      closeContextMenu();

      try {
        await writeToClipboard(resolvedChannelId);
        Toaster.trigger({
          type: "info",
          title: i18n.t("ui.toolkit.channelName.contextMenu.copied"),
          autoDismiss: true,
          autoDismissTime: 3000
        });
      } catch {
        Toaster.trigger({
          type: "error",
          title: i18n.t("ui.toolkit.channelName.contextMenu.copyFailed"),
          autoDismiss: true,
          autoDismissTime: 4000
        });
      }
    },
    [closeContextMenu, resolvedChannelId]
  );

  useEffect(() => {
    if (!isContextMenuOpen) {
      return undefined;
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        closeContextMenu();
        return;
      }

      // Single-item menu: Enter copies only when focus is on the trigger or menu.
      if (event.key === "Enter") {
        const target = event.target;
        const inTrigger = triggerRef.current?.contains?.(target);
        const inMenu =
          typeof target?.closest === "function" &&
          Boolean(target.closest(`.${styles.channelname_context_menu}`));
        if (!inTrigger && !inMenu) {
          return;
        }
        event.preventDefault();
        handleCopyChannelId(event);
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);
    window.addEventListener("scroll", closeContextMenu, true);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      window.removeEventListener("scroll", closeContextMenu, true);
    };
  }, [closeContextMenu, handleCopyChannelId, isContextMenuOpen]);

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
        className={styles.channelname_context_menu}
        role="menu"
        aria-label={i18n.t("ui.toolkit.channelName.contextMenu.ariaLabel")}
        onContextMenu={(event) => event.preventDefault()}>
        <ListItemWrapper
          customClassName={styles.channelname_context_menu_items}
          inFocus={isContextMenuOpen}
          enableAnimation={false}>
          <ListItem
            size="small"
            text={resolvedChannelId}
            description={i18n.t("ui.toolkit.channelName.contextMenu.copy")}
            iconLeft={<Icons.General.Copy01 />}
            onClick={handleCopyChannelId}
          />
        </ListItemWrapper>
      </div>
    ),
    [handleCopyChannelId, isContextMenuOpen, resolvedChannelId]
  );

  const longPress = useLongPress(() => {
    if (hasHoverTooltipRef.current && !isContextMenuOpen && !isDisabled && hoverable !== false) {
      setIsHoverTippyOpen(true);
    }
  });

  const handleMouseEnter = useCallback(
    (event) => {
      if (hoverable !== false && !isDisabled) {
        setIsHovered(true);
      }

      // After context-menu close, stay closed until the pointer leaves then re-enters.
      if (suppressHoverUntilEnter) {
        onMouseEnterProp?.(event);
        return;
      }

      if (
        hasHoverTooltipRef.current &&
        !isContextMenuOpen &&
        !isDisabled &&
        hoverable !== false &&
        !isTouchDevice()
      ) {
        clearHoverOpenTimeout();
        hoverOpenTimeoutRef.current = setTimeout(() => {
          setIsHoverTippyOpen(true);
          hoverOpenTimeoutRef.current = null;
        }, 300);
      }

      onMouseEnterProp?.(event);
    },
    [
      clearHoverOpenTimeout,
      hoverable,
      isContextMenuOpen,
      isDisabled,
      onMouseEnterProp,
      suppressHoverUntilEnter
    ]
  );

  const handleMouseLeave = useCallback(
    (event) => {
      setIsHovered(false);
      setSuppressHoverUntilEnter(false);
      clearHoverOpenTimeout();
      if (!isContextMenuOpen) {
        setIsHoverTippyOpen(false);
      }
      onMouseLeaveProp?.(event);
    },
    [clearHoverOpenTimeout, isContextMenuOpen, onMouseLeaveProp]
  );

  const handleFocus = useCallback(
    (event) => {
      if (
        hasHoverTooltipRef.current &&
        !isContextMenuOpen &&
        !isDisabled &&
        hoverable !== false &&
        !suppressHoverUntilEnter &&
        !isTouchDevice()
      ) {
        clearHoverOpenTimeout();
        hoverOpenTimeoutRef.current = setTimeout(() => {
          setIsHoverTippyOpen(true);
          hoverOpenTimeoutRef.current = null;
        }, 300);
      }
      onFocusProp?.(event);
    },
    [
      clearHoverOpenTimeout,
      hoverable,
      isContextMenuOpen,
      isDisabled,
      onFocusProp,
      suppressHoverUntilEnter
    ]
  );

  const handleBlur = useCallback(
    (event) => {
      clearHoverOpenTimeout();
      if (!isContextMenuOpen) {
        setIsHoverTippyOpen(false);
      }
      onBlurProp?.(event);
    },
    [clearHoverOpenTimeout, isContextMenuOpen, onBlurProp]
  );

  const channelConfig = useMemo(() => {
    if (!channelType) return undefined;

    // Map backend tag to valid channel type
    const mappedType = mapTagToChannelType(channelType);

    // Look up in category map first
    if (CHANNEL_CATEGORY_MAP[mappedType]) {
      return CHANNEL_CATEGORY_MAP[mappedType];
    }

    // Fallback to primary types
    if (CHANNEL_PRIMARY_TYPES.includes(mappedType)) {
      return {
        icon: CHANNEL_TYPE_ICON_MAP[mappedType],
        label: CHANNEL_TYPE_LABELS[mappedType] || mappedType,
        type: mappedType
      };
    }

    return undefined;
  }, [channelType]);

  const resolvedPrimaryType = useMemo(() => {
    if (!channelConfig?.type) {
      return undefined;
    }

    return CHANNEL_PRIMARY_TYPES.includes(channelConfig.type) ? channelConfig.type : undefined;
  }, [channelConfig?.type]);

  const isValidType = Boolean(resolvedPrimaryType);

  const normalizedStatus = applicationStatus != null ? Number(applicationStatus) : null;

  const hasStatusToShow =
    showStatusIcon &&
    (normalizedStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.APPROVED ||
      normalizedStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.PENDING ||
      normalizedStatus === AFFILIATESITE_ADVERTPROGRAM_STATUS.REJECTED);

  const normalizedPreferredMarket = useMemo(
    () => normalizeMarketCode(preferredMarket),
    [preferredMarket]
  );

  const singleMarketFlag = useMemo(() => {
    if (hasStatusToShow && previewChannels) {
      if (!Array.isArray(channelMarkets) || channelMarkets.length === 0) {
        return null;
      }

      const matchIndex = normalizedPreferredMarket
        ? channelMarkets.findIndex(
            (code) => normalizeMarketCode(code) === normalizedPreferredMarket
          )
        : -1;

      const orderedMarkets = (() => {
        if (matchIndex >= 0) {
          const matched = channelMarkets[matchIndex];
          return [matched, ...channelMarkets.filter((_, index) => index !== matchIndex)];
        }
        return channelMarkets;
      })();

      const normalizedCodes = orderedMarkets
        .map((code) => normalizeMarketCode(code))
        .filter(Boolean);

      const validCodes = normalizedCodes.filter((code) => Boolean(Flags[code]));
      const displayCodes = validCodes.length > 0 ? validCodes : normalizedCodes;

      if (displayCodes.length === 0) {
        return null;
      }

      const selectedCode = displayCodes[0];
      if (!selectedCode || !Flags[selectedCode]) {
        return null;
      }

      return <Flag flag={selectedCode} width={16} height={16} />;
    }

    return null;
  }, [channelMarkets, hasStatusToShow, normalizedPreferredMarket, previewChannels]);

  const inlinePreviewElements = useMemo(() => {
    if (hasStatusToShow) {
      return null;
    }

    if (!previewChannels || !Array.isArray(channelMarkets) || channelMarkets.length === 0) {
      return null;
    }

    const matchIndex = normalizedPreferredMarket
      ? channelMarkets.findIndex((code) => normalizeMarketCode(code) === normalizedPreferredMarket)
      : -1;

    const orderedMarkets = (() => {
      if (matchIndex > 0) {
        const matched = channelMarkets[matchIndex];
        return [matched, ...channelMarkets.filter((_, index) => index !== matchIndex)];
      }
      return channelMarkets;
    })();

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
  }, [channelMarkets, normalizedPreferredMarket, previewChannels, hasStatusToShow]);

  const hasSingleMarket = useMemo(() => {
    if (hasStatusToShow) {
      return false;
    }
    if (!previewChannels || !Array.isArray(channelMarkets) || channelMarkets.length === 0) {
      return false;
    }
    return inlinePreviewElements && inlinePreviewElements.length === 1;
  }, [inlinePreviewElements, previewChannels, channelMarkets, hasStatusToShow]);

  const singleMarketFlagElement = useMemo(() => {
    if (!hasSingleMarket || !inlinePreviewElements || inlinePreviewElements.length !== 1) {
      return null;
    }
    return inlinePreviewElements[0].icon;
  }, [hasSingleMarket, inlinePreviewElements]);

  const preferredMarketMismatch = useMemo(() => {
    if (
      !normalizedPreferredMarket ||
      !Array.isArray(channelMarkets) ||
      channelMarkets.length === 0
    ) {
      return null;
    }

    if (!Flags[normalizedPreferredMarket]) {
      return null;
    }

    const matchesPreferredMarket = channelMarkets.some((code) => {
      return normalizeMarketCode(code) === normalizedPreferredMarket;
    });

    if (matchesPreferredMarket) {
      return null;
    }

    return normalizedPreferredMarket;
  }, [channelMarkets, normalizedPreferredMarket]);

  const preferredMarketMismatchLabel = useMemo(() => {
    if (!preferredMarketMismatch) {
      return null;
    }

    if (
      preferredMarketMismatch === "UnitedNations" ||
      preferredMarketMismatch === "EuropeanUnion"
    ) {
      return "International";
    }

    return preferredMarketMismatch;
  }, [preferredMarketMismatch]);

  const tooltipContent = useMemo(() => {
    const managerName = manager?.name;
    const managerAvatar = manager?.avatar ?? (
      <Icons.Custom.AdtractionOutline
        width="var(--size-icon-small)"
        height="var(--size-icon-small)"
        color="var(--primary-blue-500)"
      />
    );

    const hasChannelDetails = Boolean(channelConfig?.label);
    const IconComponent = channelConfig?.icon || CHANNEL_TYPE_ICON_MAP[channelConfig?.type];
    const channelIcon =
      hasChannelDetails && IconComponent
        ? React.createElement(IconComponent, {
            width: "var(--size-icon-small)",
            height: "var(--size-icon-small)",
            color: "var(--text-body-default)",
            strokeWidth: "1.73"
          })
        : null;
    const hasManager = Boolean(managerName);
    const hasPartner = Boolean(partnerName);
    const hasMarkets = Array.isArray(channelMarkets) && channelMarkets.length > 0;
    const hasWarning = Boolean(preferredMarketMismatch);
    const partnerFlagCode = (() => {
      if (normalizedPreferredMarket && Flags[normalizedPreferredMarket]) {
        return normalizedPreferredMarket;
      }
      if (!hasMarkets) return null;
      const firstValid = channelMarkets
        .map((code) => normalizeMarketCode(code))
        .find((code) => code && Flags[code]);
      return firstValid || null;
    })();

    if (
      !hasManager &&
      !hasChannelDetails &&
      !hasPartner &&
      !hasMarkets &&
      !hasWarning &&
      !isNameTruncated
    ) {
      return null;
    }

    return (
      <div className={styles.channelname_tooltip_content}>
        {hasWarning && (
          <div className={styles.channelname_tooltip_warning}>
            <Icons.Alert.OctagonFilled
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
              color="var(--status-text-warning-alt)"
            />
            <span className={styles.channelname_tooltip_warning_text}>
              <span>Not approved in</span>
              <Flag flag={preferredMarketMismatch} width={16} height={16} />
              <span>{preferredMarketMismatchLabel}</span>
            </span>
          </div>
        )}
        <ListItemWrapper
          scrollShadow={false}
          darkShadow={false}
          customClassName={styles.list_wrapper}
          itemGap="var(--size-space-150)">
          {isNameTruncated && (
            <ListItem
              hoverable={false}
              size="small"
              text={channelName}
              className={styles.channelname_list_item_container}
            />
          )}
          {hasManager && (
            <ListItem
              hoverable={false}
              size="small"
              text={managerName}
              description={i18n.t("ui.toolkit.account.manager")}
              iconLeft={managerAvatar}
              className={styles.channelname_list_item_container}
            />
          )}
          {hasChannelDetails && (
            <ListItem
              hoverable={false}
              size="small"
              text={channelConfig.label}
              description={i18n.t("ui.toolkit.channelName.type")}
              iconLeft={channelIcon}
              className={styles.channelname_list_item_container}
            />
          )}
          {hasPartner && (
            <ListItem
              hoverable={false}
              size="small"
              text={partnerName}
              description={i18n.t("ui.toolkit.channelName.partner")}
              iconLeft={
                partnerFlagCode ? (
                  <Flag flag={partnerFlagCode} width={16} height={16} />
                ) : (
                  <Icons.Maps.Globe01
                    width="var(--size-icon-small)"
                    height="var(--size-icon-small)"
                    color="var(--text-body-default)"
                    strokeWidth="1.73"
                  />
                )
              }
              className={styles.channelname_list_item_container}
            />
          )}
        </ListItemWrapper>

        {hasMarkets && (
          <div className={styles.channelname_markets}>
            <span className={styles.channelname_markets_label}>
              {i18n.t("ui.toolkit.channelName.channelMarkets")}
            </span>
            <div className={styles.channelname_markets_flags}>
              {channelMarkets.map((flagCode) => (
                <Flag
                  key={flagCode}
                  flag={flagCode}
                  className={styles.channelname_flag}
                  width="1rem"
                  height="1rem"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    channelMarkets,
    channelConfig,
    manager,
    partnerName,
    normalizedPreferredMarket,
    preferredMarketMismatch,
    preferredMarketMismatchLabel,
    isNameTruncated,
    channelName
  ]);

  const domSafeProps = useMemo(() => {
    const allowed = {};
    for (const [key, value] of Object.entries(restProps)) {
      if (
        key === "style" ||
        key === "id" ||
        key === "role" ||
        key === "tabIndex"
      ) {
        allowed[key] = value;
        continue;
      }
      if (key.startsWith("data-") || key.startsWith("aria-")) {
        allowed[key] = value;
        continue;
      }
      if (key.startsWith("on") && key.length > 2 && key[2] !== "-" && typeof value === "function") {
        allowed[key] = value;
        continue;
      }
    }
    return allowed;
  }, [restProps]);

  const suppressBadgePointerEvents = !enableBadgeTooltip;
  const hasHoverTooltip = Boolean(tooltipContent) && !disableTooltip;
  hasHoverTooltipRef.current = hasHoverTooltip;

  const channelNameContent = (
    <div
      ref={triggerRef}
      className={clsx(styles.channelname_container, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...longPress.handlers}
      onClickCapture={(event) => {
        if (longPress.consumeLongPress()) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onContextMenu={contextMenuEnabled ? handleContextMenu : onContextMenuProp}
      onKeyDown={contextMenuEnabled ? handleKeyDown : undefined}
      data-context-menu={contextMenuEnabled ? "true" : undefined}
      data-list-wrapper={isInListWrapper ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      data-active={isActive ? "true" : undefined}
      data-hovered={isHovered ? "true" : undefined}
      data-disabled={isDisabled ? "true" : undefined}
      data-hoverable={hoverable === false ? "false" : undefined}
      {...domSafeProps}
      // -1: focusable for Shift+F10 after click, without adding a table tab stop.
      tabIndex={
        contextMenuEnabled ? (domSafeProps.tabIndex ?? -1) : domSafeProps.tabIndex
      }>
      {isValidType && (
        <ChannelTypeIconBadge
          channelType={resolvedPrimaryType}
          size="small"
          className={clsx(
            styles.icon,
            suppressBadgePointerEvents && styles.icon_blocksNestedTooltip
          )}
          channelCategory={
            typeof channelType === "string" && channelType.length > 0
              ? channelType.charAt(0).toLowerCase() + channelType.slice(1)
              : channelType
          }
        />
      )}

      <div className={styles.channelname_content} data-has-url={Boolean(channelUrl)}>
        {channelUrl ? (
          <>
            <span ref={nameTextRef} className={styles.channelname_text}>
              {channelName}
            </span>
            <span className={styles.channelname_meta}>
              <span className={styles.channelname_url_wrapper}>
                <span className={styles.channelname_url}>{channelUrl}</span>
                {isValidType && (
                  <Icons.Arrow.NarrowUpRight
                    width="var(--size-icon-x-small)"
                    height="var(--size-icon-x-small)"
                    color="var(--text-links-default)"
                    strokeWidth={2}
                    className={styles.channelname_meta_icon}
                  />
                )}
              </span>
            </span>
          </>
        ) : (
          <span className={styles.channelname_row}>
            <span ref={nameTextRef} className={styles.channelname_text}>
              {channelName}
            </span>
          </span>
        )}
      </div>
      {hasStatusToShow && previewChannels && singleMarketFlag && (
        <span className={styles.channelname_inline_preview} aria-hidden="true">
          {singleMarketFlag}
        </span>
      )}
      {!hasStatusToShow && hasSingleMarket && singleMarketFlagElement && (
        <span className={styles.channelname_inline_preview} aria-hidden="true">
          <span className={styles.channelname_single_flag_wrapper}>
            {singleMarketFlagElement}
            <Tag text="+1" size="small" className={styles.channelname_inline_spacer} />
          </span>
        </span>
      )}
      {!hasStatusToShow &&
        !hasSingleMarket &&
        inlinePreviewElements &&
        inlinePreviewElements.length > 0 && (
          <span className={styles.channelname_compressed_elements_wrapper}>
            <CompressedElements
              elements={inlinePreviewElements}
              maxAmountToBeShown={1}
              size="small"
              tagSize="small"
            />
          </span>
        )}
      {hasStatusToShow && <ChannelStatusIcon applicationStatus={normalizedStatus} />}
    </div>
  );

  // One controlled Tippy for context menu and hover details — no remount swap.
  if (!hasHoverTooltip && !contextMenuEnabled) {
    return channelNameContent;
  }

  const tippyVisible = isContextMenuOpen || isHoverTippyOpen;

  return (
    <Tippy
      content={isContextMenuOpen ? contextMenuContent : tooltipContent}
      visible={tippyVisible}
      interactive={isContextMenuOpen || tooltipInteractive}
      trigger="manual"
      theme={isContextMenuOpen ? "context_menu" : undefined}
      placement={isContextMenuOpen ? "bottom-start" : "bottom"}
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
      // Tippy default maxWidth is 350; context menus should hug content.
      maxWidth={isContextMenuOpen ? "none" : undefined}
      popperOptions={{
        modifiers: [
          {
            // Hover details match the ChannelName trigger width.
            // Must explicitly clear when switching to context menu — otherwise the
            // inline width sticks on the shared Tippy instance (~cell width).
            name: "sameWidth",
            enabled: !isContextMenuOpen,
            phase: "beforeWrite",
            requires: ["computeStyles"],
            fn: ({ state }) => {
              if (triggerRef.current) {
                state.styles.popper.width = `${triggerRef.current.offsetWidth}px`;
              }
            },
            effect: ({ state }) => {
              const popper = state.elements.popper;
              if (triggerRef.current) {
                popper.style.width = `${triggerRef.current.offsetWidth}px`;
              }
              return () => {
                popper.style.width = "";
              };
            }
          },
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
      {channelNameContent}
    </Tippy>
  );
};
