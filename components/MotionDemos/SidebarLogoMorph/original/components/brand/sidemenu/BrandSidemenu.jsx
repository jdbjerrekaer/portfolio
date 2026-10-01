import "../../../i18n/initialize";
import React, { useState, useEffect, useRef, useContext } from "react";
import { i18n } from "@adtraction/shared-i18n";
import { Link, useLocation, useHistory } from "react-router-dom";
import { Icons } from "@adtraction/ui-icons";
import {
  AdtractionLogo,
  Toaster,
  ButtonGroup,
  ListItem,
  ListItemWrapper,
  Modal,
  openLink
} from "@adtraction/ui-components";
import { Flag } from "@adtraction/ui-flags";
import { useCurrency, UserRoleContext } from "@adtraction/util-providers";
import { writeToClipboard } from "@adtraction/util-clipboard";
// Use PartnerSidemenu styles directly to ensure CSS Module class names match MenuItem component
import styles from "../../partner/sidemenu/PartnerSidemenu.module.scss";
import brandStyles from "./BrandSidemenu.module.scss";
import GlobalSearch from "../../globalsearch/GlobalSearch";
import MenuItem from "../../partner/sidemenu/components/MenuItem";
import Tippy from "@tippyjs/react";
import platformAgent from "../../../superagent/platformAgent";
import { getErrorCodeFromClientError } from "../../../utils/apiError";
import {
  applyThemePreference,
  getThemePreference,
  saveThemePreference,
  THEME_PREFERENCES
} from "../../../utils/themePreference";
import {
  getPartnerSidemenuUserCollapsed,
  setPartnerSidemenuUserCollapsed,
  syncPartnerSidemenuCollapsedAttribute
} from "../../../utils/partnerSidemenuPreference";
import { schedulePartnerMainLayoutChange } from "../../../utils/partnerSidemenuLayout";
import ManagerCard from "../../managercard/ManagerCard";

const offsetFunction = ({ placement, reference, popper }) => {
  if (placement === "right") {
    return [reference.height / 2 - popper.height / 2, 10];
  }
  return [];
};

export default function BrandSidemenu({
  userID,
  menuItems = [],
  userEmail = "default@adtraction.com",
  programName,
  status = {
    description: i18n.t("platform.sidemenu.defaultStatusDescription"),
    indicator: "none"
  },
  mainPlatformUrl = "https://adtraction.com",
  takeoverUser = null,
  PartnerCard = null,
  ChannelCard = null,
  searchablePages = [],
  entitySearchEnabled = true
}) {
  const location = useLocation();
  const history = useHistory();
  const pathname = location.pathname;
  const menuDisplayName = programName || userEmail;
  const userRoleContext = useContext(UserRoleContext);
  const isTakeoverSession = userRoleContext?.isTakeoverSession || false;
  const adminUserId = userRoleContext?.userInfo?.adminUserId;
  const adminEmail = userRoleContext?.userInfo?.adminEmail;
  const isSubAdvertiser = userRoleContext?.user === "SubAdvertiserUser";
  const canSwitchAccount = !isSubAdvertiser ||
    (userRoleContext?.privileges || []).includes("switchParentAdvertiserAccount");

  const [currentCurrency, setCurrentCurrency] = useCurrency();
  const [isCurrencyLoaded, setIsCurrencyLoaded] = useState(false);
  const [isCurrencyPopoverOpen, setIsCurrencyPopoverOpen] = useState(false);
  const [isAccountPopoverOpen, setIsAccountPopoverOpen] = useState(false);
  const [isMobileAccountModalOpen, setIsMobileAccountModalOpen] = useState(false);
  const [isMobileCurrencyModalOpen, setIsMobileCurrencyModalOpen] = useState(false);
  const currencyToastIdRef = useRef(null);
  const comingSoonToastIdRef = useRef(null);
  const accountIdCopyToastIdRef = useRef(null);
  const mobileSheetRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const mobileNavBarRef = useRef(null);
  const [mobileDragOffset, setMobileDragOffset] = useState(0);
  const mobileDragOffsetRef = useRef(0);
  const dragStartYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isViewportCompactDesktop, setIsViewportCompactDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const compact = window.matchMedia("(max-width: 980px)").matches;
    return compact && !mobile;
  });
  const [isUserCollapsedDesktop, setIsUserCollapsedDesktop] = useState(() =>
    getPartnerSidemenuUserCollapsed()
  );
  const isCollapsedDesktop = isViewportCompactDesktop || isUserCollapsedDesktop;
  const [isInitialMount, setIsInitialMount] = useState(true);
  const sidemenuRef = useRef(null);
  const stableViewportOffsetRef = useRef(0);
  const [accountManager, setAccountManager] = useState(null);

  const [themePreference, setThemePreference] = useState(getThemePreference);
  const [isSystemDarkMode, setIsSystemDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  let statusDescription = "";
  let statusIndicatorColor = styles.green;

  if (typeof status === "string") {
    statusDescription = status;
  } else if (status && typeof status === "object") {
    statusDescription = status.description || "";

    if (status.indicator === "critical" || status.indicator === "major") {
      statusIndicatorColor = styles.red;
    } else if (status.indicator === "minor") {
      statusIndicatorColor = styles.yellow;
    }
  }

  useEffect(() => {
    const fetchAccountManager = async () => {
      try {
        const data = await platformAgent.getAccountManager();
        setAccountManager(data);
      } catch (error) {
        console.error("Failed to fetch account manager:", error);
      }
    };
    fetchAccountManager();
  }, []);

  // Detect PWA mode (standalone display mode)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");
    document.documentElement.setAttribute("data-pwa", isPWA ? "true" : "false");
    return () => {
      document.documentElement.removeAttribute("data-pwa");
    };
  }, []);

  // Track iOS Safari dynamic toolbar (visual viewport) and expose as CSS var
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const setBottomOffsetVar = () => {
      try {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const isOverscrolling = scrollY < 0;

        if (isOverscrolling) {
          document.documentElement.style.setProperty(
            "--viewport-bottom-offset",
            `${stableViewportOffsetRef.current}px`
          );
          return;
        }

        const vv = window.visualViewport;
        const calculatedOffset = Math.max(
          0,
          Math.round(window.innerHeight - vv.height - vv.offsetTop)
        );

        if (calculatedOffset >= 0 && calculatedOffset < window.innerHeight) {
          stableViewportOffsetRef.current = calculatedOffset;
          document.documentElement.style.setProperty(
            "--viewport-bottom-offset",
            `${calculatedOffset}px`
          );
        } else {
          document.documentElement.style.setProperty(
            "--viewport-bottom-offset",
            `${stableViewportOffsetRef.current}px`
          );
        }
      } catch {}
    };
    setBottomOffsetVar();
    const vv = window.visualViewport;
    vv.addEventListener("resize", setBottomOffsetVar);
    vv.addEventListener("scroll", setBottomOffsetVar);
    window.addEventListener("orientationchange", setBottomOffsetVar);
    return () => {
      try {
        vv.removeEventListener("resize", setBottomOffsetVar);
        vv.removeEventListener("scroll", setBottomOffsetVar);
      } catch {}
      window.removeEventListener("orientationchange", setBottomOffsetVar);
      document.documentElement.style.removeProperty("--viewport-bottom-offset");
    };
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIsInitialMount(false);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleUserCollapsedDesktop = () => {
    const next = !isUserCollapsedDesktop;
    setIsUserCollapsedDesktop(next);
    setPartnerSidemenuUserCollapsed(next);
    syncPartnerSidemenuCollapsedAttribute(next);
    schedulePartnerMainLayoutChange();
  };

  useEffect(() => {
    syncPartnerSidemenuCollapsedAttribute(isUserCollapsedDesktop);
  }, [isUserCollapsedDesktop, isViewportCompactDesktop]);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    const el = sidemenuRef.current;
    if (!el) return;

    const onTransitionEnd = (event) => {
      if (event.target !== el) return;
      if (event.propertyName !== "width" && event.propertyName !== "padding") return;
      schedulePartnerMainLayoutChange();
    };

    el.addEventListener("transitionend", onTransitionEnd);
    return () => {
      el.removeEventListener("transitionend", onTransitionEnd);
    };
  }, [isMobile]);

  // Detect compact desktop viewport
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 980px)");
    const update = () => setIsViewportCompactDesktop(mediaQuery.matches && !isMobile);
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
  }, [isMobile]);

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

  // Forward wheel scroll from desktop sidemenu to main content when the sidemenu can't scroll
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobile) return;
    const el = sidemenuRef.current;
    if (!el) return;

    const canElementScroll = (node) => {
      try {
        return (node.scrollHeight || 0) > (node.clientHeight || 0);
      } catch {
        return false;
      }
    };

    const atTop = (node) => {
      try {
        return (node.scrollTop || 0) <= 0;
      } catch {
        return true;
      }
    };

    const atBottom = (node) => {
      try {
        const scrollTop = node.scrollTop || 0;
        const clientHeight = node.clientHeight || 0;
        const scrollHeight = node.scrollHeight || 0;
        return scrollTop + clientHeight >= scrollHeight - 1;
      } catch {
        return true;
      }
    };

    const forwardToMain = (deltaY, deltaX) => {
      try {
        const mainEl = document.querySelector('[data-scroll-root="main"]');
        if (mainEl && typeof mainEl.scrollBy === "function") {
          mainEl.scrollBy({ top: deltaY, left: deltaX || 0, behavior: "auto" });
        } else {
          window.scrollBy(0, deltaY);
        }
      } catch {}
    };

    const onWheel = (event) => {
      const hasOverflow = canElementScroll(el);
      if (!hasOverflow) {
        forwardToMain(event.deltaY, event.deltaX);
        if (event.cancelable) event.preventDefault();
        return;
      }

      if (event.deltaY < 0 && atTop(el)) {
        forwardToMain(event.deltaY, event.deltaX);
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (event.deltaY > 0 && atBottom(el)) {
        forwardToMain(event.deltaY, event.deltaX);
        if (event.cancelable) event.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [isMobile]);

  // Prevent background scroll when mobile sheet is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    // the page scrolls inside the main scroll root, not the body
    const mainScrollRoot = document.getElementById("platform-main-scroll-root");
    const overflow = isMobileSheetOpen ? "hidden" : "";
    document.body.style.overflow = overflow;
    if (mainScrollRoot) mainScrollRoot.style.overflow = overflow;
    return () => {
      document.body.style.overflow = "";
      if (mainScrollRoot) mainScrollRoot.style.overflow = "";
    };
  }, [isMobileSheetOpen]);

  // When switching between mobile/desktop, close any open overlays to avoid duplicates
  useEffect(() => {
    setIsCurrencyPopoverOpen(false);
    setIsAccountPopoverOpen(false);
    setIsMobileAccountModalOpen(false);
    setIsMobileCurrencyModalOpen(false);
    if (!isMobile) {
      setIsMobileSheetOpen(false);
    }
  }, [isMobile]);

  // Apply classes to mobile nav bar based on visibility of external components
  useEffect(() => {
    if (!isMobile || !mobileNavBarRef.current) return;

    const updateMobileNavChrome = () => {
      const hasBrandAction = document.querySelector("[data-brand-action-visible]");
      if (hasBrandAction) {
        mobileNavBarRef.current.classList.add(styles.no_shadow);
      } else {
        mobileNavBarRef.current.classList.remove(styles.no_shadow);
      }

      const hasSaveBar = document.querySelector("[data-save-bar-visible]");
      if (hasSaveBar) {
        mobileNavBarRef.current.classList.add(styles.save_bar_visible);
      } else {
        mobileNavBarRef.current.classList.remove(styles.save_bar_visible);
      }
    };

    updateMobileNavChrome();

    const observer = new MutationObserver(updateMobileNavChrome);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-brand-action-visible", "data-save-bar-visible"]
    });

    return () => {
      observer.disconnect();
    };
  }, [isMobile]);

  // Drag to close logic for mobile sheet
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isDraggingRef.current) return;
      const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY);
      if (typeof clientY !== "number") return;
      const delta = clientY - dragStartYRef.current;
      if (delta > 0) {
        mobileDragOffsetRef.current = delta;
        setMobileDragOffset(delta);
      } else {
        mobileDragOffsetRef.current = 0;
        setMobileDragOffset(0);
      }
      if (event.cancelable) event.preventDefault();
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      const sheetHeight = mobileSheetRef.current?.offsetHeight ?? 0;
      const threshold = Math.max(80, Math.floor(sheetHeight * 0.25));
      if (mobileDragOffsetRef.current > threshold) {
        setIsMobileSheetOpen(false);
      }
      mobileDragOffsetRef.current = 0;
      setMobileDragOffset(0);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };

    const startDrag = (startY) => {
      if (!isMobileSheetOpen) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartYRef.current = startY;
      mobileDragOffsetRef.current = 0;
      setMobileDragOffset(0);
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("touchend", handlePointerUp);
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
    };

    const grabberEl = document.getElementById("mobile-sheet-grabber");
    if (!grabberEl) return;

    const onPointerDown = (event) => {
      const startY = event.clientY ?? (event.touches && event.touches[0]?.clientY);
      if (typeof startY === "number") {
        startDrag(startY);
        if (event.cancelable) event.preventDefault();
      }
    };

    const onTouchStart = (event) => {
      const startY = event.touches && event.touches[0]?.clientY;
      if (typeof startY === "number") {
        startDrag(startY);
        if (event.cancelable) event.preventDefault();
      }
    };

    const onMouseDown = (event) => {
      startDrag(event.clientY);
      if (event.cancelable) event.preventDefault();
    };

    grabberEl.addEventListener("pointerdown", onPointerDown);
    grabberEl.addEventListener("touchstart", onTouchStart, { passive: false });
    grabberEl.addEventListener("mousedown", onMouseDown);

    return () => {
      grabberEl.removeEventListener("pointerdown", onPointerDown);
      grabberEl.removeEventListener("touchstart", onTouchStart);
      grabberEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [isMobileSheetOpen]);

  const closeSheetViaClick = () => setIsMobileSheetOpen(false);

  const openMobileSearch = () => {
    setIsMobileSheetOpen(true);
    setTimeout(() => {
      try {
        const input = mobileSearchContainerRef.current?.querySelector("input");
        if (input) input.focus();
      } catch {}
    }, 50);
  };

  // Close mobile sheet automatically after route changes
  useEffect(() => {
    if (isMobile && isMobileSheetOpen) {
      setIsMobileSheetOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Detect system dark mode preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setIsSystemDarkMode(mediaQuery.matches);
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", update);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(update);
      }
    };
  }, []);

  useEffect(() => {
    applyThemePreference(themePreference);
  }, [themePreference]);

  const customTippyOptions = {
    interactive: true,
    appendTo: typeof document !== "undefined" ? () => document.body : undefined,
    hideOnClick: false,
    popperOptions: {
      modifiers: [
        {
          name: "offset",
          options: { offset: offsetFunction }
        }
      ]
    },
    className: styles.tippy_fade
  };

  const [currencyOptions, setCurrencyOptions] = useState([]);

  // Fetch currencies from backend
  useEffect(() => {
    let isMounted = true;
    platformAgent
      .getSelectCurrencies("AdvertiserUser")
      .then((raw) => {
        try {
          const source = Array.isArray(raw) ? raw : [];
          const mapped = source.map((d) => {
            const cc = d.currencycode || d.code;
            return {
              code: cc,
              flag: d.flag || (cc === "EUR" ? "EuropeanUnion" : "SE")
            };
          });
          if (isMounted && mapped.length > 0) {
            setCurrencyOptions(mapped);
          }
        } catch {}
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Load persisted display currency from backend
  useEffect(() => {
    let isMounted = true;
    platformAgent
      .getDisplayCurrency()
      .then((result) => {
        if (isMounted) {
          if (result?.displayCurrencyCode) {
            setCurrentCurrency(result.displayCurrencyCode);
          }
          setIsCurrencyLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsCurrencyLoaded(true);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrencyFlag = (code) => {
    try {
      const match = (currencyOptions || []).find((c) => c.code === code);
      return (match && match.flag) || "SE";
    } catch {
      return "SE";
    }
  };

  const getCurrencyName = (code) => {
    try {
      return i18n.t("platform.currency." + code);
    } catch {
      return code;
    }
  };

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  const handleDisabledClick = () => {
    if (comingSoonToastIdRef.current) {
      Toaster.dismiss(comingSoonToastIdRef.current);
    }
    const newToastId = Toaster.trigger({
      type: "info",
      title: i18n.t("platform.globalSearch.comingSoonTitle"),
      description: i18n.t("platform.globalSearch.comingSoonDescription"),
      icon: true,
      autoDismiss: true,
      autoDismissTime: 3000
    });
    comingSoonToastIdRef.current = newToastId;
  };

  const handleOpenAccountSettings = () => {
    history.push("/settings");
    setIsAccountPopoverOpen(false);
    setIsMobileAccountModalOpen(false);
  };

  const handleCurrencyChange = (currCode) => {
    if (currCode === currentCurrency) {
      setIsCurrencyPopoverOpen(false);
      setIsMobileCurrencyModalOpen(false);
      return;
    }

    setCurrentCurrency(currCode);
    setIsCurrencyPopoverOpen(false);
    setIsMobileCurrencyModalOpen(false);

    platformAgent.saveDisplayCurrency(currCode).catch(() => {});

    if (currencyToastIdRef.current) {
      Toaster.dismiss(currencyToastIdRef.current);
    }
    const newToastId = Toaster.trigger({
      type: "info",
      title: i18n.t("platform.sidemenu.toast.currencySet", { code: currCode }),
      description: i18n.t("platform.sidemenu.toast.appliedAcrossPlatform"),
      icon: true,
      autoDismiss: true,
      autoDismissTime: 3000
    });
    currencyToastIdRef.current = newToastId;
  };

  const toggleCurrencyPopover = () => {
    setIsAccountPopoverOpen(false);
    setIsCurrencyPopoverOpen(!isCurrencyPopoverOpen);
  };

  const toggleAccountPopover = () => {
    setIsCurrencyPopoverOpen(false);
    setIsAccountPopoverOpen(!isAccountPopoverOpen);
  };

  const handleLogout = () => {
    const logoutEvent = new CustomEvent("adtraction-logout", {
      detail: { timestamp: Date.now() },
      cancelable: true
    });
    const handled = !window.dispatchEvent(logoutEvent);

    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn("Failed to clear storage:", e);
    }

    if (!handled) {
      console.warn(
        "adtraction-logout event was not handled by any listener; performing fallback navigation."
      );
      window.location.assign("/login");
    }
  };

  const persistThemePreference = (preference) => {
    setThemePreference(preference);
    try {
      saveThemePreference(preference);
    } catch (e) {
      console.warn("Failed to save dark mode preference:", e);
    }
  };

  const handleThemePreferenceSelect = (preference) => {
    if (preference === themePreference) {
      return;
    }

    persistThemePreference(preference);
  };

  const showCopyFailedToast = () => {
    if (accountIdCopyToastIdRef.current) {
      Toaster.dismiss(accountIdCopyToastIdRef.current);
    }
    accountIdCopyToastIdRef.current = Toaster.trigger({
      type: "error",
      title: i18n.t("platform.sidemenu.toast.copyFailed"),
      icon: true,
      autoDismiss: true,
      autoDismissTime: 2000
    });
  };

  const handleCopyAccountId = async () => {
    if (!userID) return;
    try {
      await writeToClipboard(String(userID));
      if (accountIdCopyToastIdRef.current) {
        Toaster.dismiss(accountIdCopyToastIdRef.current);
      }
      const newToastId = Toaster.trigger({
        type: "info",
        title: i18n.t("platform.sidemenu.toast.accountIdCopied"),
        description: i18n.t("platform.sidemenu.toast.copiedValueToClipboard", { value: userID }),
        icon: true,
        autoDismiss: true,
        autoDismissTime: 2000
      });
      accountIdCopyToastIdRef.current = newToastId;
    } catch {
      showCopyFailedToast();
    }
  };

  const copyManagerDetail = async ({ value, title }) => {
    if (!value) return;
    try {
      await writeToClipboard(String(value));
      if (accountIdCopyToastIdRef.current) {
        Toaster.dismiss(accountIdCopyToastIdRef.current);
      }
      const newToastId = Toaster.trigger({
        type: "info",
        title,
        description: i18n.t("platform.sidemenu.toast.copiedValueToClipboard", { value }),
        icon: true,
        autoDismiss: true,
        autoDismissTime: 2000
      });
      accountIdCopyToastIdRef.current = newToastId;
    } catch {
      showCopyFailedToast();
    }
  };

  const [linkedBrands, setLinkedBrands] = useState([]);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const currentLinkedBrand = linkedBrands.find((brand) => brand.current);
  const switchableLinkedBrands = linkedBrands.filter((brand) => !brand.current);
  const currentAccountFlag = currentLinkedBrand?.countryCode?.toUpperCase();
  const showCurrentAccountFlag = switchableLinkedBrands.length > 0 && currentAccountFlag;

  useEffect(() => {
    if (!canSwitchAccount) return;

    const fetchLinkedBrands = async () => {
      try {
        const data = await platformAgent.getLinkedBrands();
        if (Array.isArray(data)) {
          setLinkedBrands(data);
        }
      } catch (error) {
        console.error("Failed to fetch linked brands:", error);
      }
    };
    fetchLinkedBrands();
  }, [canSwitchAccount]);

  const handleSwitchAccount = async (userId) => {
    if (isSwitchingAccount) return;

    setIsSwitchingAccount(true);
    try {
      const response = await platformAgent.switchAdvertiserAccount(userId);
      if (response.success && response.redirectUrl) {
        // Navigate through the host handoff route (/takeover-login) so every microfrontend
        // re-establishes its session for the target account, not just platform-api.
        window.location.href = response.redirectUrl;
      } else if (response.errorCode || response.errorMessage) {
        const description = response.errorCode ? i18n.t(response.errorCode) : response.errorMessage;
        Toaster.trigger({
          type: "error",
          title: i18n.t("platform.sidemenu.toast.switchAccountFailed"),
          description,
          icon: true,
          autoDismiss: true,
          autoDismissTime: 5000
        });
        setIsSwitchingAccount(false);
      }
    } catch (error) {
      console.error("Failed to switch account:", error);
      const code = getErrorCodeFromClientError(error);
      Toaster.trigger({
        type: "error",
        title: i18n.t("platform.sidemenu.toast.switchAccountFailed"),
        description: code
          ? i18n.t(code)
          : i18n.t("platform.sidemenu.toast.switchAccountUnexpected"),
        icon: true,
        autoDismiss: true,
        autoDismissTime: 5000
      });
      setIsSwitchingAccount(false);
    }
  };

  const renderCurrencyPopover = () => (
    <div
      className={`${styles.sidemenu_popover_wrapper} ${styles.currency_popover} ${
        isMobile ? styles.mobile_sheet_popover : ""
      }`}>
      <ListItemWrapper
        wrapper="currency-popover"
        inFocus={isCurrencyPopoverOpen}
        selectedKeys={[currentCurrency]}
        itemKeyProp="value"
        onSelectionChange={(selected) => {
          const selectedCode = selected[0];
          if (selectedCode) handleCurrencyChange(selectedCode);
        }}>
        {currencyOptions.map((curr) => (
          <ListItem
            key={curr.code}
            value={curr.code}
            text={curr.code}
            size="default"
            iconLeft={<Flag flag={curr.flag} width="1.25rem" height="1.25rem" />}
          />
        ))}
      </ListItemWrapper>
    </div>
  );

  const renderAccountPopover = () => (
    <div
      className={`${styles.sidemenu_popover_wrapper} ${styles.account_settings_popover} ${
        isMobile ? styles.mobile_sheet_popover : ""
      }`}>
      <ListItemWrapper
        wrapper="account-popover"
        inFocus={isAccountPopoverOpen}
        itemGap={isMobile ? "var(--size-space-300)" : "var(--size-space-100)"}>
        {isTakeoverSession && adminUserId && adminEmail && (
          <div className={styles.account_settings_popover_link}>
            <ListItem
              text={adminEmail}
              size="default"
              iconLeft={<Icons.Custom.Adtraction color="var(--primary-blue-500---primary)" />}
              onClick={() => {
                const redirectUrl = mainPlatformUrl + "/admin/admin.htm";
                const logoutEvent = new CustomEvent("adtraction-logout", {
                  detail: { redirectUrl },
                  cancelable: true
                });
                const handled = !window.dispatchEvent(logoutEvent);
                if (!handled) {
                  console.warn(
                    "adtraction-logout event was not handled by any listener; performing fallback navigation."
                  );
                  window.location.assign(redirectUrl);
                }
              }}
            />
          </div>
        )}
        <div className={styles.account_settings_popover_link}>
          <ListItem
            hoverable={true}
            text={i18n.t("platform.sidemenu.account.accountId")}
            caption={userID}
            size="large"
            onClick={handleCopyAccountId}
            aria-label={i18n.t("platform.sidemenu.account.copyAccountIdAria", { id: userID })}
          />
        </div>
        <div className={styles.account_settings_popover_link}>
          <ListItem
            hoverable={true}
            text={i18n.t("platform.sidemenu.account.email")}
            caption={userEmail}
            size="large"
            onClick={() =>
              copyManagerDetail({
                value: userEmail,
                title: i18n.t("platform.sidemenu.account.email")
              })
            }
            aria-label={i18n.t("platform.sidemenu.account.copyAccountEmailAria", { email: userEmail })}
          />
        </div>

        {/* Change account section */}
        {switchableLinkedBrands.length > 0 && (
          <div className={brandStyles.change_account_container}>
            <span className={brandStyles.change_account_label}>
              {i18n.t("platform.sidemenu.brand.changeAccount")}
            </span>
            <ListItemWrapper
              wrapper="change-account-list"
              itemKeyProp="value"
              enableAnimation={false}>
              {switchableLinkedBrands.map((brand) => (
                <ListItem
                  key={brand.userId}
                  value={brand.userId.toString()}
                  text={brand.name}
                  size="small"
                  hoverable={true}
                  iconLeft={
                    <Flag flag={brand.countryCode.toUpperCase()} width="1rem" height="1rem" />
                  }
                  iconRight={
                    <Icons.Arrow.NarrowUpRight strokeWidth={2.73} color="var(--primary-blue-400)" />
                  }
                  onClick={() => handleSwitchAccount(brand.userId)}
                />
              ))}
            </ListItemWrapper>
          </div>
        )}

        <div className={styles.account_settings_popover_link}>
          <ListItem
            hoverable={true}
            text={i18n.t("platform.quickActions.accountSettings")}
            size="default"
            iconLeft={<Icons.General.Settings01 />}
            onClick={handleOpenAccountSettings}
          />
        </div>
        <div className={styles.dark_mode_toggle_container}>
          <div className={styles.dark_mode_toggle_row}>
            <div className={styles.dark_mode_toggle_label}>
              {themePreference === THEME_PREFERENCES.ON ||
              (themePreference === THEME_PREFERENCES.AUTO && isSystemDarkMode) ? (
                <Icons.Weather.CloudMoon />
              ) : (
                <Icons.Weather.Sun />
              )}
              <span>{i18n.t("platform.sidemenu.darkMode.title")}</span>
            </div>
          </div>
          <div
            className={styles.dark_mode_option_group}
            aria-label={i18n.t("platform.sidemenu.darkMode.preferenceAria")}>
            <ButtonGroup
              items={[
                { value: THEME_PREFERENCES.OFF, label: i18n.t("platform.sidemenu.darkMode.offLabel") },
                { value: THEME_PREFERENCES.AUTO, label: i18n.t("platform.sidemenu.darkMode.autoLabel") },
                { value: THEME_PREFERENCES.ON, label: i18n.t("platform.sidemenu.darkMode.onLabel") }
              ]}
              defaultSelectedIndex={[
                THEME_PREFERENCES.OFF,
                THEME_PREFERENCES.AUTO,
                THEME_PREFERENCES.ON
              ].indexOf(themePreference)}
              selectedCallback={(_, item) => handleThemePreferenceSelect(item.value)}
              fitContent={false}
              mobileCompact={false}
              size="small"
            />
          </div>
          <p className={styles.dark_mode_toggle_description}>
            {themePreference === THEME_PREFERENCES.ON
              ? i18n.t("platform.sidemenu.darkMode.darkModeEnforced")
              : themePreference === THEME_PREFERENCES.AUTO
                ? i18n.t("platform.sidemenu.darkMode.systemThemeApplied")
                : i18n.t("platform.sidemenu.darkMode.lightModeEnforced")}
          </p>
        </div>
        <div className={styles.account_settings_popover_link}>
          <ListItem
            hoverable={true}
            text={statusDescription}
            size="default"
            iconLeft={<Icons.General.CheckCircle className={statusIndicatorColor} />}
            onClick={() => {
              openLink("https://status.adtraction.com/");
            }}
          />
        </div>
        <div className={styles.account_settings_popover_link}>
          <ListItem
            hoverable={true}
            text={i18n.t("platform.sidemenu.links.oldPlatform")}
            size="default"
            iconRight={<Icons.General.LinkExternal01 />}
            onClick={() => {
              openLink(
                mainPlatformUrl +
                  (isTakeoverSession
                    ? "/admin/admin.htm?adtv=old"
                    : "/client/client.htm?return_feedback=brand&adtv=old")
              );
            }}
          />
        </div>
        <div className={styles.account_settings_popover_link}>
          <ListItem
            text={i18n.t("platform.sidemenu.actions.logout")}
            size="default"
            iconLeft={<Icons.General.LogOut03 />}
            onClick={handleLogout}
          />
        </div>
      </ListItemWrapper>
    </div>
  );

  const renderManagerCard = (size) => {
    if (!accountManager) return null;

    const profileImage = accountManager.image
      ? `data:image/jpeg;base64,${accountManager.image}`
      : undefined;

    return (
      <div
        className={`${brandStyles.manager_container} ${
          size === "small" ? brandStyles.manager_container_mobile : ""
        }`}>
        <ManagerCard
          size={size}
          title={i18n.t("platform.sidemenu.brand.accountManagerTitle")}
          name={accountManager.name}
          profileImage={profileImage}
          className={size === "small" ? brandStyles.manager_card_mobile : ""}
          onNameClick={() =>
            copyManagerDetail({
              value: accountManager.name,
              title: i18n.t("platform.sidemenu.toast.managerNameCopied")
            })
          }
          nameAriaLabel={i18n.t("platform.sidemenu.brand.copyManagerNameAria", {
            name: accountManager.name
          })}>
          {accountManager.mobile && (
            <Tippy content={accountManager.mobile} arrow={false} placement="top">
              <a href={`tel:${accountManager.mobile}`} className={brandStyles.manager_contact_link}>
                <Icons.Communication.Phone />
              </a>
            </Tippy>
          )}
          {accountManager.email && (
            <Tippy content={accountManager.email} arrow={false} placement="top">
              <button
                type="button"
                className={brandStyles.manager_contact_link}
                onClick={() =>
                  copyManagerDetail({
                    value: accountManager.email,
                    title: i18n.t("platform.sidemenu.toast.emailCopied")
                  })
                }
                aria-label={i18n.t("platform.sidemenu.brand.copyManagerEmailAria", {
                  email: accountManager.email
                })}>
                <Icons.Communication.Mail01 />
              </button>
            </Tippy>
          )}
        </ManagerCard>
      </div>
    );
  };

  const renderDesktopCollapseToggle = () => (
    <Tippy
      content={
        isUserCollapsedDesktop
          ? i18n.t("platform.sidemenu.aria.expandMenu")
          : i18n.t("platform.sidemenu.aria.collapseMenu")
      }
      arrow={false}
      theme="light"
      placement="right"
      {...customTippyOptions}
      hideOnClick={true}>
      <span className={styles.collapse_toggle_host}>
        <button
          type="button"
          className={styles.collapse_toggle}
          onClick={toggleUserCollapsedDesktop}
          aria-label={
            isUserCollapsedDesktop
              ? i18n.t("platform.sidemenu.aria.expandMenu")
              : i18n.t("platform.sidemenu.aria.collapseMenu")
          }>
          {isUserCollapsedDesktop ? (
            <Icons.Layout.LayoutRight strokeWidth={1.73} />
          ) : (
            <Icons.Layout.LayoutLeft strokeWidth={1.73} />
          )}
        </button>
      </span>
    </Tippy>
  );

  const renderDesktopHeaderLogo = () => {
    if (isCollapsedDesktop && !isViewportCompactDesktop) {
      return (
        <div className={styles.logo_expand_morph}>
          <div className={`${styles.adtraction_logo} ${styles.logo_expand_morph_logo}`}>
            <AdtractionLogo
              withTagline={false}
              size="small"
              showText={false}
              takeoverUser={takeoverUser}
            />
          </div>
          <Tippy
            content={i18n.t("platform.sidemenu.aria.expandMenu")}
            arrow={false}
            theme="light"
            placement="right"
            {...customTippyOptions}
            hideOnClick={true}>
            <span className={styles.logo_expand_morph_button_host}>
              <button
                type="button"
                className={`${styles.collapse_toggle} ${styles.logo_expand_toggle}`}
                onClick={toggleUserCollapsedDesktop}
                aria-label={i18n.t("platform.sidemenu.aria.expandMenu")}>
                <Icons.Layout.LayoutRight strokeWidth={1.73} />
              </button>
            </span>
          </Tippy>
        </div>
      );
    }

    return (
      <Link to="/dashboard" className={styles.adtraction_logo}>
        <AdtractionLogo
          withTagline={false}
          size="small"
          showText={!isCollapsedDesktop}
          takeoverUser={takeoverUser}
        />
      </Link>
    );
  };

  const renderAccountTriggerIcon = () =>
    showCurrentAccountFlag ? (
      <Flag flag={currentAccountFlag} width="1.25rem" height="1.25rem" />
    ) : (
      <Icons.User.User01 strokeWidth={1.73} className={styles.icon} width={20} height={20} />
    );

  return (
    <>
      {!isMobile && (
        <div
          ref={sidemenuRef}
          className={`${styles.sidemenu_wrapper} ${styles.sidemenu} ${styles.desktop_only} ${
            isCollapsedDesktop ? styles.collapsed : ""
          } ${isInitialMount ? styles.no_transition : ""}`}>
          <div className={styles.sidemenu_header}>
            {renderDesktopHeaderLogo()}
            {!isViewportCompactDesktop && !isCollapsedDesktop && renderDesktopCollapseToggle()}
          </div>

          <div
            className={`${styles.search_container}${
              isCollapsedDesktop ? ` ${styles.search_container_collapsed}` : ""
            }`}>
            <Tippy
              content={i18n.t("platform.sidemenu.tippy.search")}
              arrow={false}
              theme="light"
              placement="right"
              disabled={!isCollapsedDesktop}
              {...customTippyOptions}>
              <div className={styles.search_morph_wrapper}>
                <GlobalSearch
                  userRoleOverride="AdvertiserUser"
                  getCountries={platformAgent.getBrandSelectCountries}
                  PartnerCard={PartnerCard}
                  ChannelCard={ChannelCard}
                  searchablePages={searchablePages}
                  entitySearchEnabled={entitySearchEnabled}
                  compact={isCollapsedDesktop}
                />
              </div>
            </Tippy>
          </div>

          <div className={styles.content}>
            <div className={styles.navigation}>
              <nav className={styles.menu}>
                {menuItems.map((item, index) => {
                  const menuEl = (
                    <MenuItem
                      key={index}
                      item={{
                        ...item,
                        label: item.label
                      }}
                      index={index}
                      isActive={isActive}
                      onDisabledClick={handleDisabledClick}
                    />
                  );
                  if (!isCollapsedDesktop) return menuEl;
                  return (
                    <Tippy
                      key={`tt-${index}`}
                      content={item.label}
                      arrow={false}
                      theme="light"
                      placement="right"
                      hideOnClick={false}
                      {...customTippyOptions}>
                      <div>{menuEl}</div>
                    </Tippy>
                  );
                })}
              </nav>
            </div>

            {renderManagerCard(isCollapsedDesktop ? "small-vertical" : "large")}

            <div className={styles.footer}>
              {isCollapsedDesktop ? (
                <Tippy
                  content={i18n.t("platform.sidemenu.notifications.label")}
                  arrow={false}
                  theme="light"
                  placement="right"
                  {...customTippyOptions}>
                  <div
                    className={`${styles.menu_item} ${styles.disabled}`}
                    onClick={handleDisabledClick}
                    aria-label={i18n.t("platform.sidemenu.notifications.label")}>
                    <Icons.Alert.Bell01
                      strokeWidth={1.73}
                      className={styles.icon}
                      width="var(--size-icon-medium)"
                      height="var(--size-icon-medium)"
                    />
                    <span className={styles.menu_label}>
                      {i18n.t("platform.sidemenu.notifications.label")}
                    </span>
                  </div>
                </Tippy>
              ) : (
                <div
                  className={`${styles.menu_item} ${styles.disabled}`}
                  onClick={handleDisabledClick}
                  aria-label={i18n.t("platform.sidemenu.notifications.label")}>
                  <Icons.Alert.Bell01
                    strokeWidth={1.73}
                    className={styles.icon}
                    width="var(--size-icon-medium)"
                    height="var(--size-icon-medium)"
                  />
                  <span className={styles.menu_label}>
                    {i18n.t("platform.sidemenu.notifications.label")}
                  </span>
                </div>
              )}

              {isCollapsedDesktop ? (
                <Tippy
                  content={i18n.t("platform.sidemenu.account.accountMenuShort")}
                  arrow={false}
                  theme="light"
                  placement="right"
                  disabled={isAccountPopoverOpen}
                  {...customTippyOptions}>
                  <Tippy
                    content={renderAccountPopover()}
                    interactive={true}
                    arrow={false}
                    theme="light"
                    visible={isAccountPopoverOpen}
                    onClickOutside={() => setIsAccountPopoverOpen(false)}
                    {...customTippyOptions}
                    maxWidth="none"
                    placement="right">
                    <button
                      type="button"
                      className={`${styles.menu_item} ${
                        isAccountPopoverOpen || isActive("/settings") ? styles.active : ""
                      }`}
                      aria-expanded={isAccountPopoverOpen}
                      onClick={toggleAccountPopover}>
                      {renderAccountTriggerIcon()}
                      <span className={styles.menu_label}>{menuDisplayName}</span>
                    </button>
                  </Tippy>
                </Tippy>
              ) : (
                <Tippy
                  content={renderAccountPopover()}
                  interactive={true}
                  arrow={false}
                  theme="light"
                  visible={isAccountPopoverOpen}
                  onClickOutside={() => setIsAccountPopoverOpen(false)}
                  {...customTippyOptions}
                  maxWidth="none"
                  placement="right">
                  <button
                    type="button"
                    className={`${styles.menu_item} ${
                      isAccountPopoverOpen || isActive("/settings") ? styles.active : ""
                    }`}
                    aria-expanded={isAccountPopoverOpen}
                    onClick={toggleAccountPopover}>
                    {renderAccountTriggerIcon()}
                    <span className={styles.menu_label}>{menuDisplayName}</span>
                  </button>
                </Tippy>
              )}

              <div className={styles.currency_menu_item}>
                {!isCurrencyLoaded ? (
                  <div className={styles.currency_skeleton}>
                    <div className={styles.currency_skeleton_icon} />
                    {!isCollapsedDesktop && <div className={styles.currency_skeleton_text} />}
                  </div>
                ) : (
                  <Tippy
                    content={i18n.t("platform.sidemenu.currency.displayForPlatform")}
                    placement="right"
                    {...customTippyOptions}>
                    <Tippy
                      content={renderCurrencyPopover()}
                      interactive={true}
                      {...customTippyOptions}
                      visible={isCurrencyPopoverOpen}
                      onClickOutside={() => setIsCurrencyPopoverOpen(false)}
                      placement="right">
                      <div
                        className={`${styles.menu_item} ${
                          isCurrencyPopoverOpen ? styles.active : ""
                        }`}
                        onClick={toggleCurrencyPopover}
                        aria-label={i18n.t("platform.sidemenu.aria.displayCurrency")}>
                        <Flag
                          flag={getCurrencyFlag(currentCurrency)}
                          width="1.25rem"
                          height="1.25rem"
                        />
                        {!isCollapsedDesktop && (
                          <span className={styles.menu_label}>{getCurrencyName(currentCurrency)}</span>
                        )}
                      </div>
                    </Tippy>
                  </Tippy>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation and sheet */}
      {isMobile && (
        <div
          className={`${styles.mobile_nav_container} ${styles.mobile_only}`}
          aria-hidden={!isMobile}>
          <div
            ref={mobileNavBarRef}
            className={styles.mobile_nav_bar}
            role="navigation"
            aria-label={i18n.t("platform.sidemenu.aria.primaryNav")}>
            {(menuItems || []).slice(0, 4).map((item, index) => {
              const Icon = item.icon;
              const active = item.url && !item.disabled && isActive(item.url);
              const content = (
                <>
                  {Icon ? (
                    <Icon
                      strokeWidth={1.73}
                      className={`${styles.icon} ${active ? styles.active : ""}`}
                      width="24"
                      height="24"
                    />
                  ) : (
                    <span className="icons" />
                  )}
                </>
              );

              if (item.disabled) {
                return (
                  <button
                    key={`mnav-${index}`}
                    className={`${styles.mobile_nav_button} ${styles.disabled}`}
                    onClick={handleDisabledClick}
                    aria-disabled="true">
                    {content}
                  </button>
                );
              }

              if (item.url) {
                return (
                  <Link
                    key={`mnav-${index}`}
                    to={item.url}
                    className={`${styles.mobile_nav_button} ${active ? styles.active : ""}`}
                    aria-current={active ? "page" : undefined}>
                    {content}
                  </Link>
                );
              }

              return null;
            })}
            <button
              className={`${styles.mobile_nav_button}`}
              onClick={openMobileSearch}
              aria-label={i18n.t("platform.sidemenu.aria.openSearch")}>
              <Icons.General.SearchMd width="24" height="24" />
            </button>
            <button
              className={`${styles.mobile_nav_button} ${styles.mobile_nav_sheet_toggle}`}
              onClick={() => setIsMobileSheetOpen(true)}
              aria-label={i18n.t("platform.sidemenu.aria.openMenu")}>
              <Icons.General.Menu01 width="1.25rem" height="1.25rem" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile sheet (bottom drawer) */}
      {isMobile && (
        <div
          className={`${styles.mobile_sheet_wrapper} ${styles.mobile_only} ${
            isMobileSheetOpen ? styles.open : ""
          }`}
          role="dialog"
          aria-modal={isMobileSheetOpen ? "true" : undefined}
          aria-hidden={!isMobileSheetOpen}
          inert={!isMobileSheetOpen ? "" : undefined}
          aria-label={i18n.t("platform.sidemenu.aria.menuDialog")}>
          <div
            className={styles.mobile_sheet_backdrop}
            onClick={() => setIsMobileSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={mobileSheetRef}
            className={`${styles.mobile_sheet} ${isDragging ? styles.dragging : ""}`}
            style={
              isMobileSheetOpen ? { transform: `translateY(${mobileDragOffset}px)` } : undefined
            }>
            <div
              id="mobile-sheet-grabber"
              className={styles.mobile_sheet_grabber}
              role="button"
              tabIndex={0}
              aria-label={i18n.t("platform.sidemenu.aria.closeMenu")}
              onClick={closeSheetViaClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  closeSheetViaClick();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeSheetViaClick();
                }
              }}
            />
            <div className={`${styles.sidemenu_wrapper} ${styles.mobile_sheet_content}`}>
              <div className={styles.search_container} ref={mobileSearchContainerRef}>
                <GlobalSearch
                  userRoleOverride="AdvertiserUser"
                  getCountries={platformAgent.getBrandSelectCountries}
                  PartnerCard={PartnerCard}
                  ChannelCard={ChannelCard}
                  searchablePages={searchablePages}
                  entitySearchEnabled={entitySearchEnabled}
                />
              </div>

              <nav className={styles.menu}>
                {(menuItems || []).map((item, index) => (
                  <MenuItem
                    key={`msheet-${index}`}
                    item={item}
                    index={index}
                    isActive={isActive}
                    onDisabledClick={handleDisabledClick}
                    onItemClick={closeSheetViaClick}
                  />
                ))}
              </nav>

              {renderManagerCard("small")}

              <div className={styles.footer}>
                <button
                  type="button"
                  className={`${styles.menu_item} ${styles.disabled}`}
                  onClick={handleDisabledClick}
                  aria-disabled="true">
                  <Icons.Alert.Bell01
                    strokeWidth={1.73}
                    className={styles.icon}
                    width={20}
                    height={20}
                  />
                  <span className={styles.menu_label}>
                    {i18n.t("platform.sidemenu.notifications.label")}
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.menu_item} ${
                    isMobileAccountModalOpen || isActive("/settings") ? styles.active : ""
                  }`}
                  onClick={() => {
                    setIsMobileAccountModalOpen(true);
                    setIsMobileSheetOpen(false);
                  }}>
                  {renderAccountTriggerIcon()}
                  <span className={styles.menu_label}>{menuDisplayName}</span>
                </button>

                <div className={styles.currency_menu_item}>
                  {!isCurrencyLoaded ? (
                    <div className={styles.currency_skeleton}>
                      <div className={styles.currency_skeleton_icon} />
                      <div className={styles.currency_skeleton_text} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.menu_item} ${
                        isMobileCurrencyModalOpen ? styles.active : ""
                      }`}
                      onClick={() => {
                        setIsMobileCurrencyModalOpen(true);
                        setIsMobileSheetOpen(false);
                      }}
                      aria-label={i18n.t("platform.sidemenu.aria.displayCurrencyMobileTap")}>
                      <Flag
                        flag={getCurrencyFlag(currentCurrency)}
                        width="1.25rem"
                        height="1.25rem"
                      />
                      <span className={styles.menu_label}>{getCurrencyName(currentCurrency)}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <Modal
          id="brand-mobile-account-modal"
          title={i18n.t("platform.sidemenu.modal.accountTitle")}
          isOpen={isMobileAccountModalOpen}
          onClose={() => setIsMobileAccountModalOpen(false)}
          onOutsideClick={() => setIsMobileAccountModalOpen(false)}>
          {renderAccountPopover()}
        </Modal>
      )}

      {isMobile && (
        <Modal
          id="brand-mobile-currency-modal"
          title={i18n.t("platform.sidemenu.modal.currencyTitle")}
          isOpen={isMobileCurrencyModalOpen}
          onClose={() => setIsMobileCurrencyModalOpen(false)}
          onOutsideClick={() => setIsMobileCurrencyModalOpen(false)}>
          {renderCurrencyPopover()}
        </Modal>
      )}
    </>
  );
}
