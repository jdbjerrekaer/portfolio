import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListItem } from "../../../tokens/listItem/ListItem";
import { Icons } from "@adtraction/ui-icons";
import { Flag } from "@adtraction/ui-flags";
import Tippy from "@tippyjs/react";
import clsx from "clsx";
import styles from "./BrandName.module.scss";
import { i18n } from "@adtraction/shared-i18n";
import { BRAND_CATEGORIES, SERVICE_LEVELS } from "@adtraction/util-constants";
import { cleanBrandNameValue } from "./cleanBrandName";
import { getOverlayPortalTarget } from "../../../misc/overlayPortal";
import { CompressedElements } from "../../compressedElements/CompressedElements";
import { useTruncatedText } from "../useTruncatedText";
import { isTouchDevice, openLink, useLongPress } from "../../../../utils/touch";

const EMPTY_ADDITIONAL_MARKETS = [];

export const BrandName = ({
  // Content
  brandName = "brandName",
  brandCountry = null,
  brandId = null,
  category,
  linkedBrands = [],
  additionalMarkets = EMPTY_ADDITIONAL_MARKETS,
  manager = {},
  redirectUrl = "",

  // Appearance
  size = "default",
  serviceLevel = 1,
  wrapText = false,
  containerWidth = null,

  // Behavior
  isHoverable = true,
  staff = false,
  preferredDirection = "auto",
  tooltipInteractive = true,

  // Events
  onClick = () => {},
  onLinkedBrandClick = () => {},
  onBrandHover = null,
  isLoadingDetails = false,
  focused = false,
  listWrapper = false,
  active = false,
  disabled = false,
  disableNavigation = false,
  cleanBrandName = false
}) => {
  const [serviceLevelFields, setServiceLevelFields] = useState({
    icon: <Icons.Custom.Seedling />,
    text: SERVICE_LEVELS.BASIC
  });
  const isInListWrapper = listWrapper === true || listWrapper === "true";
  const [hasLoadedCategoryOnce, setHasLoadedCategoryOnce] = useState(() => {
    if (category) return true;
    if (isLoadingDetails && !category) return false;
    if (isInListWrapper && !tooltipInteractive && !onBrandHover) return true;
    return false;
  });
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const popperHoverHandlersRef = useRef({ popper: null, onEnter: null, onLeave: null });
  const [isHovered, setIsHovered] = useState(false);

  const isActive = active === true || active === "true";
  const isDisabled = disabled === true || disabled === "true";

  // Parse brandName to extract status and date if present (e.g., "Brand Name -- [Status] YYYY-MM-DD")
  const { displayName, status, statusDate } = useMemo(() => {
    if (!brandName) {
      return { displayName: "", status: null, statusDate: null };
    }
    const statusMatch = brandName.match(
      /^(.+?)\s*--\s*(Paused|Closed|Closing)\s+(\d{4}-\d{2}-\d{2})$/
    );
    if (statusMatch) {
      const rawName = statusMatch[1];
      return {
        displayName: cleanBrandName ? cleanBrandNameValue(rawName) : rawName,
        status: statusMatch[2].toLowerCase(),
        statusDate: statusMatch[3]
      };
    }
    return {
      displayName: cleanBrandName ? cleanBrandNameValue(brandName) : brandName,
      status: null,
      statusDate: null
    };
  }, [brandName, cleanBrandName]);

  const linkedMarketElements = useMemo(() => {
    if (!Array.isArray(additionalMarkets) || additionalMarkets.length === 0) {
      return [];
    }

    const hasPrimaryMarketInAdditionalMarkets = additionalMarkets.some((market) => {
      const countryIsoCode = market?.countryIsoCode || market?.countryCode;
      return (
        countryIsoCode &&
        brandCountry &&
        String(countryIsoCode).toLowerCase() === String(brandCountry).toLowerCase()
      );
    });
    const shouldIncludePrimaryMarket =
      brandCountry && String(brandCountry).toUpperCase() !== "UN" && !hasPrimaryMarketInAdditionalMarkets;
    const markets = shouldIncludePrimaryMarket
      ? [{ countryIsoCode: brandCountry }, ...additionalMarkets]
      : additionalMarkets;
    const seenMarkets = new Set();

    const marketPriority = new Map([
      ["se", 0],
      ["dk", 1],
      ["no", 2]
    ]);

    return markets
      .filter((market) => {
        const countryIsoCode = market?.countryIsoCode || market?.countryCode;
        if (!countryIsoCode) {
          return false;
        }

        const key = String(countryIsoCode).toLowerCase();
        if (seenMarkets.has(key)) {
          return false;
        }

        seenMarkets.add(key);
        return true;
      })
      .sort((firstMarket, secondMarket) => {
        const firstCountryIsoCode = firstMarket.countryIsoCode || firstMarket.countryCode;
        const secondCountryIsoCode = secondMarket.countryIsoCode || secondMarket.countryCode;
        const firstPriority =
          marketPriority.get(String(firstCountryIsoCode).toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        const secondPriority =
          marketPriority.get(String(secondCountryIsoCode).toLowerCase()) ?? Number.MAX_SAFE_INTEGER;

        return firstPriority - secondPriority;
      })
      .map((market) => {
        const countryIsoCode = market.countryIsoCode || market.countryCode;
        const description = market.countryName || market.name || countryIsoCode;

        return {
          icon: (
            <Flag
              flag={countryIsoCode}
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
            />
          ),
          description
        };
      });
  }, [additionalMarkets, brandCountry]);

  const isPaused = status === "paused";
  const isClosed = status === "closed";
  const isClosingSoon = status === "closing";
  const hasStatus = isPaused || isClosed || isClosingSoon;
  const [isNameOverflowing, nameTextRef] = useTruncatedText(displayName);
  const isNameTruncated = isNameOverflowing && !wrapText;
  const shouldEnableTooltip = isHoverable || hasStatus || isNameTruncated;
  useEffect(() => {
    if (isDisabled) {
      setIsHovered(false);
    }
  }, [isDisabled]);

  const showLoadingPlaceholder = isLoadingDetails || (!category && !hasLoadedCategoryOnce);
  const showCategory = Boolean(category) && !isLoadingDetails;
  const shouldRenderCategoryLine = isHoverable;

  useEffect(() => {
    switch (serviceLevel) {
      case 1:
        setServiceLevelFields({
          icon: <Icons.Custom.Seedling />,
          text: i18n.t("ui.toolkit.serviceLevels.basic")
        });
        break;
      case 2:
        setServiceLevelFields({
          icon: <Icons.Custom.Flower />,
          text: i18n.t("ui.toolkit.serviceLevels.growth")
        });
        break;
      case 3:
        setServiceLevelFields({
          icon: <Icons.Custom.Tree />,
          text: i18n.t("ui.toolkit.serviceLevels.premium")
        });
        break;
      default:
        setServiceLevelFields({
          icon: <Icons.Custom.Seedling />,
          text: i18n.t("ui.toolkit.serviceLevels.basic")
        });
        break;
    }
  }, [serviceLevel]);

  useEffect(() => {
    if (category) {
      setHasLoadedCategoryOnce(true);
    }
    if (isLoadingDetails && !category) {
      setHasLoadedCategoryOnce(false);
    }
  }, [category, isLoadingDetails]);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const requestBrandDetails = useCallback(() => {
    if (!shouldEnableTooltip) return;
    if (onBrandHover && brandId) {
      onBrandHover(brandId);
    }
  }, [brandId, onBrandHover, shouldEnableTooltip]);

  const scheduleClose = useCallback(() => {
    if (!shouldEnableTooltip) return;
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      setIsOpen(false);
    }, 100);
  }, [clearCloseTimeout, shouldEnableTooltip]);

  const openTooltip = useCallback(() => {
    if (!shouldEnableTooltip) return;
    clearCloseTimeout();
    setIsOpen(true);
    requestBrandDetails();
  }, [clearCloseTimeout, requestBrandDetails, shouldEnableTooltip]);

  const closeTooltipImmediately = useCallback(() => {
    if (!shouldEnableTooltip) return;
    clearCloseTimeout();
    setIsOpen(false);
  }, [clearCloseTimeout, shouldEnableTooltip]);

  const categoryFields = useMemo(() => {
    if (!category) {
      return { icon: "", text: "" };
    }

    const categoryValue =
      typeof category === "string" && !Number.isNaN(Number(category)) ? Number(category) : category;

    switch (categoryValue) {
      case BRAND_CATEGORIES.AUTOMOTIVE:
        return {
          icon: <Icons.Brand.Automotive strokeWidth={0.2} />,
          text: i18n.t("ui.toolkit.categories.automotive")
        };
      case BRAND_CATEGORIES.ONLINE_SERVICES:
        return {
          icon: <Icons.Brand.OnlineServices />,
          text: i18n.t("ui.toolkit.categories.onlineServices")
        };
      case BRAND_CATEGORIES.FINANCE:
        return {
          icon: <Icons.Brand.Finance />,
          text: i18n.t("ui.toolkit.categories.finance")
        };
      case BRAND_CATEGORIES.OTHER:
        return {
          icon: <Icons.Brand.Other />,
          text: i18n.t("ui.toolkit.categories.other")
        };
      case BRAND_CATEGORIES.FASHION:
        return {
          icon: <Icons.Brand.Fashion strokeWidth={2} />,
          text: i18n.t("ui.toolkit.categories.fashion")
        };
      case BRAND_CATEGORIES.MARKETING:
        return { icon: <Icons.Brand.Marketing />, text: i18n.t("ui.toolkit.categories.marketing") };
      case BRAND_CATEGORIES.ELECTRONICS:
        return {
          icon: <Icons.Brand.Electronics />,
          text: i18n.t("ui.toolkit.categories.electronics")
        };
      case BRAND_CATEGORIES.FAMILY:
        return {
          icon: <Icons.Brand.Family />,
          text: i18n.t("ui.toolkit.categories.family")
        };
      case BRAND_CATEGORIES.FOOD:
        return {
          icon: <Icons.Brand.Food strokeWidth={1} />,
          text: i18n.t("ui.toolkit.categories.food")
        };
      case BRAND_CATEGORIES.HOME_AND_GARDEN:
        return {
          icon: <Icons.Brand.HomeAndGarden />,
          text: i18n.t("ui.toolkit.categories.homeAndGarden")
        };
      case BRAND_CATEGORIES.UTILITIES:
        return {
          icon: <Icons.Brand.Utilities />,
          text: i18n.t("ui.toolkit.categories.utilities")
        };
      case BRAND_CATEGORIES.HEALTH_AND_BEAUTY:
        return {
          icon: <Icons.Brand.HealthAndBeauty />,
          text: i18n.t("ui.toolkit.categories.healthAndBeauty")
        };
      case BRAND_CATEGORIES.HOBBIES_AND_GIFTS:
        return {
          icon: <Icons.Brand.HobbiesAndGifts />,
          text: i18n.t("ui.toolkit.categories.hobbiesAndGifts")
        };
      case BRAND_CATEGORIES.INSURANCE:
        return {
          icon: <Icons.Brand.Insurance />,
          text: i18n.t("ui.toolkit.categories.insurance")
        };
      case BRAND_CATEGORIES.MEDIA:
        return {
          icon: <Icons.Brand.Media />,
          text: i18n.t("ui.toolkit.categories.media")
        };
      case BRAND_CATEGORIES.SPORT_AND_OUTDOORS:
        return {
          icon: <Icons.Brand.SportsAndOutdoor />,
          text: i18n.t("ui.toolkit.categories.sportAndOutdoors")
        };
      case BRAND_CATEGORIES.TRAVEL:
        return {
          icon: <Icons.Brand.Travel />,
          text: i18n.t("ui.toolkit.categories.travel")
        };
      default:
        return { icon: <Icons.Brand.Marketing />, text: i18n.t("ui.toolkit.categories.other") };
    }
  }, [category]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
      const { popper, onEnter, onLeave } = popperHoverHandlersRef.current;
      if (popper) {
        popper.removeEventListener("mouseenter", onEnter);
        popper.removeEventListener("mouseleave", onLeave);
      }
    };
  }, [clearCloseTimeout]);

  const hoverTimeoutRef = useRef(null);

  const longPress = useLongPress(() => {
    if (isHoverable && !isDisabled) openTooltip();
  });

  const handleReferenceMouseEnter = useCallback(
    (e) => {
      if (!isHoverable || isTouchDevice()) return;
      if (!isDisabled) {
        setIsHovered(true);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (isInListWrapper) {
        if (e) {
          e.stopPropagation();
        }
        hoverTimeoutRef.current = setTimeout(() => {
          if (hoverTimeoutRef.current) {
            openTooltip();
            hoverTimeoutRef.current = null;
          }
        }, 300);
      } else {
        openTooltip();
      }
    },
    [isDisabled, openTooltip, isInListWrapper]
  );

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleReferenceMouseLeave = useCallback(
    (e) => {
      if (!isHoverable) return;
      setIsHovered(false);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (isInListWrapper && e) {
        e.stopPropagation();
      }
      scheduleClose();
    },
    [scheduleClose, isInListWrapper]
  );

  const handleReferenceFocus = useCallback(() => {
    if (!isHoverable || isTouchDevice()) return;
    if (!isDisabled) {
      setIsHovered(true);
    }
    openTooltip();
  }, [isDisabled, isHoverable, openTooltip]);

  const handleReferenceBlur = useCallback(() => {
    if (!isHoverable) return;
    setIsHovered(false);
    scheduleClose();
  }, [isHoverable, scheduleClose]);

  const handleReferenceKeyDown = useCallback(
    (event) => {
      if (!isHoverable) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        closeTooltipImmediately();
      }
    },
    [closeTooltipImmediately, isHoverable]
  );

  const handleClickOutside = useCallback(() => {
    if (isInListWrapper) {
      return;
    }
    closeTooltipImmediately();
  }, [closeTooltipImmediately, isInListWrapper]);

  const attachPopperHoverHandlers = useCallback(
    (instance) => {
      if (!shouldEnableTooltip || !tooltipInteractive || !instance?.popper) return;
      const popper = instance.popper;
      const handlePopperMouseEnter = () => {
        clearCloseTimeout();
      };
      const handlePopperMouseLeave = () => {
        scheduleClose();
      };

      popper.addEventListener("mouseenter", handlePopperMouseEnter);
      popper.addEventListener("mouseleave", handlePopperMouseLeave);

      popperHoverHandlersRef.current = {
        popper,
        onEnter: handlePopperMouseEnter,
        onLeave: handlePopperMouseLeave
      };
    },
    [clearCloseTimeout, scheduleClose, shouldEnableTooltip, tooltipInteractive]
  );

  const detachPopperHoverHandlers = useCallback(() => {
    const { popper, onEnter, onLeave } = popperHoverHandlersRef.current;
    if (!popper) return;

    popper.removeEventListener("mouseenter", onEnter);
    popper.removeEventListener("mouseleave", onLeave);
    popperHoverHandlersRef.current = { popper: null, onEnter: null, onLeave: null };
  }, []);

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

  const handleBrandClick = (event) => {
    if (isDisabled || longPress.consumeLongPress()) {
      event.preventDefault();
      return;
    }
    if (disableNavigation) {
      onClick(event);
      return;
    }
    if (brandId) {
      openLink(`/brands/${brandId}`);
    } else if (redirectUrl) {
      openLink(redirectUrl);
    }
    onClick(event);
  };

  const handleLinkedBrandClick = (brand) => {
    if (brand.redirectUrl) {
      openLink(brand.redirectUrl);
    }
    onLinkedBrandClick(brand);
  };

  const renderTooltipContent = () => {
    return (
      <div className={styles.brandname_tooltip}>
        {isNameTruncated && (
          <ListItem hoverable={false} text={displayName} size="small" />
        )}
        {staff && (
          <ListItem
            hoverable={false}
            iconLeft={manager.avatar ? manager.avatar : <Icons.Custom.AdtractionOutline />}
            text={manager.name}
            description={i18n.t("ui.toolkit.account.manager")}
            size="small"
          />
        )}
        {staff && (
          <ListItem
            hoverable={false}
            iconLeft={serviceLevelFields.icon}
            text={serviceLevelFields.text}
            description={i18n.t("ui.toolkit.brandName.serviceLevel")}
            size="small"
          />
        )}
        {shouldRenderCategoryLine && (
          <div
            className={styles.category_line}
            data-state={showLoadingPlaceholder ? "loading" : "loaded"}
            data-loaded={hasLoadedCategoryOnce}>
            <div
              className={clsx(
                styles.category_line_item,
                showLoadingPlaceholder ? styles.visible : styles.hidden
              )}>
              <ListItem hoverable={false} text={i18n.t("ui.toolkit.brandName.loading")} size="small" />
            </div>
            <div
              className={clsx(
                styles.category_line_item,
                showCategory ? styles.visible : styles.hidden
              )}>
              <ListItem
                hoverable={false}
                iconLeft={categoryFields.icon}
                text={categoryFields.text}
                size="small"
              />
            </div>
          </div>
        )}
        {isPaused && (
          <ListItem
            hoverable={false}
            iconLeft={
              <Icons.Media.PauseCircle
                width="var(--size-icon-small)"
                height="var(--size-icon-small)"
                strokeWidth={2}
              />
            }
            text={
              statusDate
                ? i18n.t("ui.toolkit.brandStatus.pausedSince", { date: statusDate })
                : i18n.t("ui.toolkit.brandStatus.paused")
            }
            size="small"
          />
        )}
        {isClosed && (
          <ListItem
            hoverable={false}
            iconLeft={
              <Icons.Custom.BrandClose
                width="var(--size-icon-small)"
                height="var(--size-icon-small)"
                strokeWidth={1.73}
              />
            }
            text={
              statusDate
                ? i18n.t("ui.toolkit.brandStatus.closedSince", { date: statusDate })
                : i18n.t("ui.toolkit.brandStatus.closed")
            }
            size="small"
          />
        )}
        {isClosingSoon && !isClosed && (
          <ListItem
            hoverable={false}
            iconLeft={
              <Icons.Time.Hourglass02
                width="var(--size-icon-small)"
                height="var(--size-icon-small)"
              />
            }
            text={i18n.t("ui.toolkit.brandStatus.closing", { date: statusDate })}
            size="small"
          />
        )}
        {linkedBrands.length > 0 && (
          <div className={styles.tooltip_linked_brands_container}>
            <p className={styles.tooltip_linked_brands_text}>{i18n.t("ui.toolkit.brandName.linkedBrands")}</p>
            <div className={styles.tooltip_linked_brands_container_inner}>
              {linkedBrands.map((brand, index) => (
                <div
                  key={`${brand.countryCode}-${brand.name}-${index}`}
                  className={clsx(styles.brandname_container, styles.linked_hover)}
                  onClick={() => handleLinkedBrandClick(brand)}>
                  <Flag
                    flag={brand.countryCode}
                    width="var(--size-icon-small)"
                    height="var(--size-icon-small)"
                  />
                  <p className={styles.brandname_text}>{brand.name}</p>
                  <div className={styles.brandname_icon}>
                    <Icons.Arrow.NarrowUpRight
                      width="var(--size-icon-small)"
                      height="var(--size-icon-small)"
                      color="var(--primary-blue-400)"
                      strokeWidth={2.73}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Tippy
      content={renderTooltipContent()}
      placement={getTippyPlacement()}
      interactive={tooltipInteractive}
      visible={shouldEnableTooltip ? isOpen : false}
      onMount={attachPopperHoverHandlers}
      onHidden={detachPopperHoverHandlers}
      onClickOutside={handleClickOutside}
      animation="fade"
      maxWidth="none"
      appendTo={(ref) => getOverlayPortalTarget(ref) || document.body}
      popperOptions={
        isInListWrapper
          ? {
              modifiers: [
                {
                  name: "preventOverflow",
                  options: {
                    boundary: "viewport"
                  }
                }
              ]
            }
          : undefined
      }>
      <div
        onClick={handleBrandClick}
        className={clsx(styles.brandname_container, styles[size], wrapText && styles.wrap)}
        style={containerWidth ? { width: containerWidth, maxWidth: "100%" } : undefined}
        data-isopen={isOpen}
        data-list-wrapper={isInListWrapper ? "true" : undefined}
        data-focused={focused === true || focused === "true" ? "true" : undefined}
        data-active={isActive ? "true" : undefined}
        data-hovered={isHovered ? "true" : undefined}
        data-disabled={isDisabled ? "true" : undefined}
        data-hoverable={isHoverable ? undefined : "false"}
        data-paused={isPaused ? "true" : undefined}
        data-closed={isClosed ? "true" : undefined}
        onMouseEnter={(e) => {
          if (isInListWrapper) {
            e.stopPropagation();
          }
          handleReferenceMouseEnter(e);
        }}
        onMouseLeave={(e) => {
          if (isInListWrapper) {
            e.stopPropagation();
          }
          handleReferenceMouseLeave(e);
        }}
        onFocus={handleReferenceFocus}
        onBlur={handleReferenceBlur}
        onKeyDown={handleReferenceKeyDown}
        {...longPress.handlers}
        tabIndex={!isInListWrapper && isHoverable ? 0 : undefined}>
        {linkedMarketElements.length > 0 ? (
          <span className={styles.brandname_linked_markets}>
            <CompressedElements
              elements={linkedMarketElements}
              maxAmountToBeShown={2}
              size="compact"
              tagSize="small"
            />
          </span>
        ) : (
          <Flag flag={brandCountry} width="var(--size-icon-small)" height="var(--size-icon-small)" />
        )}
        <p ref={nameTextRef} className={styles.brandname_text}>
          {displayName}
        </p>
        {isPaused && (
          <span
            className={clsx(styles.brandname_status_badge, styles.brandname_status_paused)}
            aria-label={i18n.t("ui.toolkit.brandStatus.paused")}
            tabIndex={!isHoverable ? 0 : undefined}
            onMouseEnter={!isHoverable ? openTooltip : undefined}
            onMouseLeave={!isHoverable ? scheduleClose : undefined}
            onFocus={!isHoverable ? openTooltip : undefined}
            onBlur={!isHoverable ? scheduleClose : undefined}
            onClick={
              !isHoverable
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                : undefined
            }>
            <Icons.Media.PauseCircle
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
              color="var(--grayscale-0)"
              strokeWidth={2.3}
            />
          </span>
        )}
        {isClosed && (
          <span
            className={clsx(styles.brandname_status_badge, styles.brandname_status_closed)}
            aria-label={i18n.t("ui.toolkit.brandStatus.closed")}
            tabIndex={!isHoverable ? 0 : undefined}
            onMouseEnter={!isHoverable ? openTooltip : undefined}
            onMouseLeave={!isHoverable ? scheduleClose : undefined}
            onFocus={!isHoverable ? openTooltip : undefined}
            onBlur={!isHoverable ? scheduleClose : undefined}
            onClick={
              !isHoverable
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                : undefined
            }>
            <Icons.Custom.BrandClose
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
              color="var(--grayscale-0)"
              strokeWidth={2.3}
            />
          </span>
        )}
        {isClosingSoon && !isClosed && (
          <span
            className={clsx(styles.brandname_status_badge, styles.brandname_status_closing_soon)}
            aria-label={i18n.t("ui.toolkit.brandStatus.closing", { date: statusDate })}
            tabIndex={!isHoverable ? 0 : undefined}
            onMouseEnter={!isHoverable ? openTooltip : undefined}
            onMouseLeave={!isHoverable ? scheduleClose : undefined}
            onFocus={!isHoverable ? openTooltip : undefined}
            onBlur={!isHoverable ? scheduleClose : undefined}
            onClick={
              !isHoverable
                ? (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                : undefined
            }>
            <Icons.Time.Hourglass02
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
              color="var(--status-text-danger-alt)"
            />
          </span>
        )}
        {size === "default" && isHoverable && (
          <div className={styles.brandname_icon}>
            <Icons.Arrow.NarrowUpRight
              width="var(--size-icon-small)"
              height="var(--size-icon-small)"
              color="var(--primary-blue-400)"
              strokeWidth={2.73}
            />
          </div>
        )}
      </div>
    </Tippy>
  );
};
