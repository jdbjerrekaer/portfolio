// portfolio edit: i18n is pre-initialised by the shared-i18n shim
import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from "react";
import { useLocation } from "react-router-dom";
import { i18n } from "@adtraction/shared-i18n";
import { UserRoleContext } from "@adtraction/util-providers";
import {
  Input,
  Tag,
  CheckChip,
  Chip,
  Button,
  DropdownSelect,
  ScrollShadow,
  Modal,
  Toaster
} from "@adtraction/ui-components";
import { Icons } from "@adtraction/ui-icons";
import Tippy from "@tippyjs/react";
import styles from "./GlobalSearchModal.module.scss";
import { GlobalSearchResultList } from "./GlobalSearchResultList";
import platformAgent from "../../../../fakeSearchAgent"; // portfolio edit: fake search agent with visitor-chosen latency
import { useDebouncedEffect } from "../hooks/useDebouncedEffect";
import { GlobalSearchEmptySuggestions } from "./GlobalSearchEmptySuggestions";
import { GlobalSearchNavigationSections } from "./GlobalSearchNavigationSections";
import { getErrorCodeFromClientError, getHttpStatusFromClientError } from "../../../utils/apiError";
import { Flag } from "@adtraction/ui-flags";
const StaffBrandResultItem = null; // portfolio edit: staff-only brand row, not rendered in this brand-user demo
const mockBrands = []; // portfolio edit: Storybook-only mock data, unused here
import { filterAvailableSearchablePages } from "../filterAvailableSearchablePages";
import { getCommandCenterShortcutIds } from "../commandCenterShortcutIds";
import {
  collectKeysByPrefix,
  matchSearchablePages
} from "../matchSearchablePages";

const isInsideTippyRoot = (target) =>
  target instanceof Element && Boolean(target.closest("[data-tippy-root]"));

const COMMAND_CENTER_ITEM_SELECTOR =
  '#search-content [data-command-item="true"], #search-content [data-search-item="true"]';

const getCommandCenterItems = () =>
  typeof document === "undefined"
    ? []
    : Array.from(document.querySelectorAll(COMMAND_CENTER_ITEM_SELECTOR));

const clearCommandCenterKeyboardActive = () => {
  getCommandCenterItems().forEach((el) => el.removeAttribute("data-keyboard-active"));
};

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY = 300;
const RECENT_SEARCHES_EVENT = "adtraction-recent-searches-updated";
const DASHBOARD_SELECTED_MARKETS_STORAGE_KEY = "dashboard-selected-countries";

const isIdQuery = (query) => {
  if (!query || typeof query !== "string") return false;
  const trimmed = query.trim();
  return trimmed.length > 0 && /^\d+$/.test(trimmed);
};

const isBrandUser = (role) => role === "AdvertiserUser" || role === "SubAdvertiserUser";

/**
 * Map Status filter values → API applicationStatus strings.
 * Brand-user chips use pending/declined/invited; partner Brands-page chips use
 * not_applied/applied/rejected (same vocabulary as partner BrandsPage).
 */
const STATUS_FILTER_TO_APPLICATION = {
  approved: "APPROVED",
  pending: "APPLIED",
  declined: "REJECTED",
  invited: "INVITED",
  not_applied: "NOT_APPLIED",
  applied: "APPLIED",
  rejected: "REJECTED"
};

const matchesSelectedStatusFilters = (applicationStatus, selectedFilterValues) => {
  if (!Array.isArray(selectedFilterValues) || selectedFilterValues.length === 0) return true;
  const normalized = String(applicationStatus || "").toUpperCase();
  // Partner "Not applied" also covers NOT_APPLIED_API.
  return selectedFilterValues.some((value) => {
    const mapped = STATUS_FILTER_TO_APPLICATION[value];
    if (mapped === "NOT_APPLIED") {
      return normalized === "NOT_APPLIED" || normalized === "NOT_APPLIED_API";
    }
    return mapped === normalized;
  });
};

const KNOWN_ENTITY_STATUSES = new Set([
  "APPROVED",
  "APPLIED",
  "REJECTED",
  "INVITED",
  "NOT_APPLIED",
  "NOT_APPLIED_API"
]);

/** Persist only API-known statuses; omit unknowns so enrichment can fill them in. */
const sanitizeEntityStatus = (status) => {
  if (typeof status !== "string") return undefined;
  const normalized = status.trim().toUpperCase();
  return KNOWN_ENTITY_STATUSES.has(normalized) ? normalized : undefined;
};

const getPageResourceKeys = (prefix) => {
  if (!i18n || typeof i18n.getResourceBundle !== "function") return [];
  const language = i18n.language || "en";
  const bundle =
    i18n.getResourceBundle(language, "translation") ||
    i18n.getResourceBundle("en", "translation") ||
    {};
  return collectKeysByPrefix(bundle, prefix);
};

export const GlobalSearchModal = ({
  showModal = false,
  onHide = () => {},
  shouldFocus = false,
  onFocusConsumed = () => {},
  onLoadingChange = () => {},
  fakeSearchDelay = 100000,
  userRole = "partner",
  HighlightTag,
  getCountries = null,
  getBrandsAgent = null,
  BrandCard = null,
  searchablePages = [],
  entitySearchEnabled = true
}) => {
  const userRoleContext = useContext(UserRoleContext);
  const { pathname } = useLocation();
  const userId = userRoleContext?.userInfo?.userId || userRoleContext?.userInfo?.adminUserId || "anon";
  const recentSearchesStorageKey = `globalSearchRecents.${userId}`;
  const availableSearchablePages = useMemo(
    () => filterAvailableSearchablePages(searchablePages, pathname),
    [searchablePages, pathname]
  );
  // Discover / channel directory privilege — same gate as BrandLayout's brand.discover page.
  // Use the host-filtered registry (not pathname-filtered) so standing on /discover doesn't
  // look like the privilege disappeared.
  const canAccessDiscover = useMemo(
    () =>
      (Array.isArray(searchablePages) ? searchablePages : []).some(
        (page) => page?.id === "brand.discover" && !page.disabled
      ),
    [searchablePages]
  );

  const staffFilters = [
    { id: "brand", label: i18n.t("platform.globalSearch.filter.staffBrand") },
    { id: "channel", label: i18n.t("platform.globalSearch.filter.staffChannel") },
    { id: "partner", label: i18n.t("platform.globalSearch.filter.staffPartner") },
    { id: "agency", label: i18n.t("platform.globalSearch.filter.staffAgency") },
    { id: "invoice", label: i18n.t("platform.globalSearch.filter.staffInvoice") }
  ];

  const brandUserFilters = [
    { id: "partner", label: i18n.t("platform.globalSearch.filter.brandUserPartners") },
    { id: "channel", label: i18n.t("platform.globalSearch.filter.brandUserChannels") }
  ];

  // Brand Discover status chips (includes Invited).
  const brandStatusOptions = useMemo(
    () => [
      {
        value: "approved",
        label: i18n.t("platform.globalSearch.status.approved"),
        icon: <Icons.Custom.NotificationDot color="var(--ui-colors-green-600)" />
      },
      {
        value: "pending",
        label: i18n.t("platform.globalSearch.status.pending"),
        icon: <Icons.Time.Hourglass02 color="var(--ui-colors-orange-600)" />
      },
      {
        value: "declined",
        label: i18n.t("platform.globalSearch.status.declined"),
        icon: <Icons.General.XClose color="var(--text-body-default)" />
      },
      {
        value: "invited",
        label: i18n.t("platform.globalSearch.status.invited"),
        icon: <Icons.Communication.Send01 color="var(--text-body-default)" />
      }
    ],
    []
  );

  // Match partner BrandsPage STATUS_OPTIONS values + labels.
  const partnerStatusOptions = useMemo(
    () => [
      {
        value: "not_applied",
        label: i18n.t("platform.globalSearch.application.notApplied"),
        icon: <Icons.Custom.NotificationDot color="var(--primary-blue-500---primary)" />
      },
      {
        value: "approved",
        label: i18n.t("platform.globalSearch.status.approved"),
        icon: <Icons.Custom.NotificationDot color="var(--status-background-success)" />
      },
      {
        value: "applied",
        label: i18n.t("platform.globalSearch.status.pending"),
        icon: <Icons.Custom.NotificationDot color="var(--status-background-warning)" />
      },
      {
        value: "rejected",
        label: i18n.t("platform.globalSearch.status.declined"),
        icon: <Icons.Custom.NotificationDot color="var(--status-background-danger)" />
      }
    ],
    []
  );

  // Detect Storybook iframe to avoid making backend requests locally
  const isStorybookPreview =
    typeof window !== "undefined" &&
    window.location &&
    typeof window.location.pathname === "string" &&
    window.location.pathname.includes("iframe.html");
  const [currentQuery, setCurrentQuery] = useState("");
  const [isFocused, setIsFocused] = useState(shouldFocus);
  const [keyCombination, setKeyCombination] = useState(
    shouldFocus
      ? i18n.t("platform.globalSearch.keyEsc")
      : navigator.userAgent.includes("Mac")
        ? i18n.t("platform.globalSearch.keyCmdK")
        : i18n.t("platform.globalSearch.keyCtrlK")
  );
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [noMatchingValues, setNoMatchingValues] = useState(null);
  const [marketItems, setMarketItems] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const [selectedStatusOptions, setSelectedStatusOptions] = useState([]);

  const searchTimeoutRef = useRef(null);
  const inputContainerRef = useRef(null);
  const prevShowModalRef = useRef(showModal);
  const shouldApplyDashboardMarketsOnNextLoadRef = useRef(false);
  const brandPreferredMarketIsoCode = useMemo(() => {
    const countryPrivileges = userRoleContext?.countryPrivileges || [];
    const preferredCountryId = Number(countryPrivileges[0]);
    if (!preferredCountryId) return "";

    const preferredMarket = marketItems.find((item) => Number(item.id) === preferredCountryId);
    return preferredMarket?.isoCode || "";
  }, [userRoleContext?.countryPrivileges, marketItems]);

  const readDashboardSelectedMarketCodes = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(DASHBOARD_SELECTED_MARKETS_STORAGE_KEY);
      if (raw == null) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed.map((c) => String(c).toUpperCase());
    } catch {
      return null;
    }
  }, []);

  const applyDashboardSelectedMarkets = useCallback(() => {
    const codes = readDashboardSelectedMarketCodes();
    if (codes == null) return;
    const selected = new Set(codes);
    setMarketItems((prev) =>
      prev.map((item) => ({
        ...item,
        checked: selected.has(String(item.isoCode || item.flag || "").toUpperCase())
      }))
    );
  }, [readDashboardSelectedMarketCodes]);

  const recentSearchResults = useMemo(() => {
    const mapped = recentSearches.map((item) => {
      const entityStatus =
        item.type === "page" ? item.status || "" : sanitizeEntityStatus(item.status);
      return {
        id: item.id,
        affiliateSiteId: item.affiliateSiteId || item.id,
        type: item.type,
        title: item.title || "",
        parentTitle: item.parentTitle || "",
        route: item.route || "",
        subtitle: item.subtitle || "",
        affiliateName: item.affiliateName || item.subtitle || "",
        flag: item.flag || "",
        marketIsoCodes: item.marketIsoCodes || [],
        preferredMarketIsoCode:
          item.preferredMarketIsoCode || (item.type === "channel" ? brandPreferredMarketIsoCode : ""),
        channelType: item.channelType || "",
        hasSegment: Boolean(item.hasSegment),
        segmentName: item.segmentName || "",
        segmentCommission: item.segmentCommission || "",
        logo: item.logo,
        backgroundImage: item.backgroundImage,
        highlights: item.highlights || [],
        // Entities: keep status unset until enrichment fills it — never invent NOT_APPLIED.
        status: entityStatus
      };
    });
    if (canAccessDiscover) {
      return mapped;
    }
    // Without Discover, hide only explicitly network-only entity recents; pages always stay.
    // Missing status stays until enrichment resolves it (avoids empty Recents for stale saves).
    return mapped.filter(
      (item) =>
        item.type === "page" ||
        (item.status !== "NOT_APPLIED" && item.status !== "NOT_APPLIED_API")
    );
  }, [recentSearches, brandPreferredMarketIsoCode, canAccessDiscover]);

  // Enrich legacy recent items that are missing details (title, flag, backgroundImage, or status).
  // The persisted _enriched flag prevents retry loops when the API returns empty data or fails.
  const channelEnrichmentAttemptedRef = useRef(new Set());
  const partnerEnrichmentAttemptedRef = useRef(new Set());

  useEffect(() => {
    if (isStorybookPreview || !showModal) return;
    if (userId === "anon") return;

    const itemsNeedingEnrichment = recentSearches.filter(
      (i) =>
        i &&
        i.type === "brand" &&
        !i._enriched &&
        (!i.title || !i.flag || !i.backgroundImage || !i.status)
    );
    if (itemsNeedingEnrichment.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        // Single batch call to fetch all needed programs by ID
        const idsToEnrich = [...new Set(itemsNeedingEnrichment.map((i) => i.id))];
        const matchMap = new Map();

        try {
          const resp = await platformAgent.dashboard_enrichRecentSearchPrograms({
            programIds: idsToEnrich
          });
          const list = Array.isArray(resp) ? resp : [];
          for (const r of list) {
            if (r && r.programId != null) {
              matchMap.set(r.programId, r);
            }
          }
        } catch {
          // ignore — items stay as-is but won't be retried
        }

        if (cancelled) return;

        // Merge enriched data back, marking every attempted item with _enriched
        // so it's never retried even if the API returned empty/partial data
        setRecentSearches((prev) => {
          const enrichedIds = new Set(idsToEnrich);
          let changed = false;
          const merged = prev.map((p) => {
            if (p.type !== "brand" || !enrichedIds.has(p.id)) return p;
            changed = true;
            const match = matchMap.get(p.id);
            if (match) {
              return {
                id: p.id,
                type: p.type,
                title: match.programName || p.title || "",
                flag: match.isoCode || p.flag || "",
                logo: match.logoUrl || p.logo,
                backgroundImage: match.backgroundImageUrl || p.backgroundImage,
                highlights: p.highlights || [],
                status: match.applicationStatus || p.status || "NOT_APPLIED",
                _enriched: true
              };
            }
            // No match found — mark as enriched anyway to prevent retries
            return { ...p, _enriched: true };
          });

          if (!changed) return prev;

          try {
            window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(merged));
            window.dispatchEvent(
              new CustomEvent(RECENT_SEARCHES_EVENT, { detail: { recentSearches: merged } })
            );
          } catch {}
          return merged;
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recentSearches, isStorybookPreview, showModal, recentSearchesStorageKey, userId]);

  useEffect(() => {
    if (isStorybookPreview || !showModal || !isBrandUser(userRole)) return;

    const itemsNeedingEnrichment = recentSearches.filter((item) => {
      if (!item || item.type !== "channel") return false;

      const channelId = item.affiliateSiteId || item.id;
      if (!channelId || channelEnrichmentAttemptedRef.current.has(channelId)) return false;

      return (
        !sanitizeEntityStatus(item.status) ||
        !(item.affiliateName || item.subtitle) ||
        !item.channelType ||
        (item.hasSegment && !item.segmentName)
      );
    });
    if (itemsNeedingEnrichment.length === 0) return;

    itemsNeedingEnrichment.forEach((item) => {
      channelEnrichmentAttemptedRef.current.add(item.affiliateSiteId || item.id);
    });

    let cancelled = false;

    (async () => {
      const enrichedById = new Map();

      await Promise.all(
        itemsNeedingEnrichment.map(async (item) => {
          const channelId = item.affiliateSiteId || item.id;
          try {
            const response = await platformAgent.brand_getBrandGlobalSearchResult({
              query: String(channelId)
            });
            const match = (Array.isArray(response) ? response : []).find((result) => {
              const resourceType = (result?.resource || "Channel").toLowerCase();
              return resourceType === "channel" && String(result?.affiliateSiteId || "") === String(channelId);
            });

            if (match) {
              const affiliateName =
                match.affiliateName || item.affiliateName || item.subtitle || "";
              const resolvedStatus =
                sanitizeEntityStatus(match.applicationStatus) || sanitizeEntityStatus(item.status);
              enrichedById.set(channelId, {
                affiliateSiteId: match.affiliateSiteId,
                title: match.channelName || item.title || "",
                subtitle: affiliateName,
                affiliateName,
                flag: match.isoCode || item.flag || "",
                marketIsoCodes:
                  Array.isArray(match.marketIsoCodes) && match.marketIsoCodes.length > 0
                    ? match.marketIsoCodes
                    : [match.isoCode || item.flag].filter(Boolean),
                preferredMarketIsoCode: item.preferredMarketIsoCode || brandPreferredMarketIsoCode,
                channelType: match.channelType || item.channelType || "",
                hasSegment: Boolean(match.hasSegment),
                segmentName: match.segmentName || "",
                segmentCommission: match.segmentCommission || "",
                ...(resolvedStatus ? { status: resolvedStatus } : {})
              });
            }
          } catch {
            // Keep stale recent as-is; this is a best-effort repair for older entries.
          }
        })
      );

      if (cancelled || enrichedById.size === 0) return;

      setRecentSearches((prev) => {
        let changed = false;
        const merged = prev.map((item) => {
          if (item?.type !== "channel") return item;

          const channelId = item.affiliateSiteId || item.id;
          const enriched = enrichedById.get(channelId);
          if (!enriched) return item;

          changed = true;
          return {
            ...item,
            ...enriched
          };
        });

        if (!changed) return prev;

        try {
          window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(merged));
          window.dispatchEvent(
            new CustomEvent(RECENT_SEARCHES_EVENT, { detail: { recentSearches: merged } })
          );
        } catch {}

        return merged;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [recentSearches, isStorybookPreview, showModal, userRole, brandPreferredMarketIsoCode, recentSearchesStorageKey]);

  // Refresh partner recent status/title when missing (same Discover-off gate needs real status).
  useEffect(() => {
    if (isStorybookPreview || !showModal || !isBrandUser(userRole)) return;

    const itemsNeedingEnrichment = recentSearches.filter((item) => {
      if (!item || item.type !== "partner") return false;
      const partnerId = item.id;
      if (!partnerId || partnerEnrichmentAttemptedRef.current.has(partnerId)) return false;
      return !sanitizeEntityStatus(item.status) || !item.title;
    });
    if (itemsNeedingEnrichment.length === 0) return;

    itemsNeedingEnrichment.forEach((item) => {
      partnerEnrichmentAttemptedRef.current.add(item.id);
    });

    let cancelled = false;

    (async () => {
      const enrichedById = new Map();

      await Promise.all(
        itemsNeedingEnrichment.map(async (item) => {
          const partnerId = item.id;
          try {
            const response = await platformAgent.brand_getBrandGlobalSearchResult({
              query: String(partnerId)
            });
            const match = (Array.isArray(response) ? response : []).find((result) => {
              const resourceType = (result?.resource || "").toLowerCase();
              return resourceType === "partner" && String(result?.affiliateId || "") === String(partnerId);
            });

            if (match) {
              const resolvedStatus =
                sanitizeEntityStatus(match.applicationStatus) || sanitizeEntityStatus(item.status);
              enrichedById.set(partnerId, {
                title: match.affiliateName || item.title || "",
                subtitle: item.subtitle || "",
                affiliateName: item.affiliateName || "",
                flag: match.isoCode || item.flag || "",
                marketIsoCodes:
                  Array.isArray(match.marketIsoCodes) && match.marketIsoCodes.length > 0
                    ? match.marketIsoCodes
                    : [match.isoCode || item.flag].filter(Boolean),
                preferredMarketIsoCode: item.preferredMarketIsoCode || brandPreferredMarketIsoCode,
                ...(resolvedStatus ? { status: resolvedStatus } : {})
              });
            }
          } catch {
            // Keep stale recent as-is.
          }
        })
      );

      if (cancelled || enrichedById.size === 0) return;

      setRecentSearches((prev) => {
        let changed = false;
        const merged = prev.map((item) => {
          if (item?.type !== "partner") return item;
          const enriched = enrichedById.get(item.id);
          if (!enriched) return item;
          changed = true;
          return { ...item, ...enriched };
        });

        if (!changed) return prev;

        try {
          window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(merged));
          window.dispatchEvent(
            new CustomEvent(RECENT_SEARCHES_EVENT, { detail: { recentSearches: merged } })
          );
        } catch {}

        return merged;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [recentSearches, isStorybookPreview, showModal, userRole, brandPreferredMarketIsoCode, recentSearchesStorageKey]);

  const getBrandHighlights = useCallback(
    async (programIds) => {
      const affiliateId = userRoleContext?.userInfo?.userId;
      const agent = await getBrandsAgent?.();

      if (!programIds || !agent || !affiliateId) return [];

      const response = await agent.getBrandHighlightsNew({
        advertProgramIds: programIds,
        affiliateId
      });

      return response;
    },
    [getBrandsAgent, userRoleContext]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRecentsUpdated = (event) => {
      const next = event?.detail?.recentSearches;
      if (Array.isArray(next)) {
        setRecentSearches(next);
        return;
      }
      try {
        const saved = window.localStorage.getItem(recentSearchesStorageKey);
        setRecentSearches(saved ? JSON.parse(saved) : []);
      } catch {
        // ignore
      }
    };

    if (userId && userId !== "anon") {
      try {
        const saved = window.localStorage.getItem(recentSearchesStorageKey);
        const parsed = saved ? JSON.parse(saved) : [];
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentSearches([]);
      }
    } else {
      setRecentSearches([]);
    }

    window.addEventListener(RECENT_SEARCHES_EVENT, handleRecentsUpdated);
    return () => {
      window.removeEventListener(RECENT_SEARCHES_EVENT, handleRecentsUpdated);
    };
  }, [recentSearchesStorageKey, userId]);

  // Fetch countries from API
  useEffect(() => {
    if (!getCountries) {
      setMarketItems([]);
      setLoadingMarkets(false);
      return;
    }

    let active = true;
    setLoadingMarkets(true);

    getCountries()
      .then((result) => {
        if (!active) return;
        const arr = Array.isArray(result) ? result : [];

        // Transform API response to component format
        // API returns: {id, name, isocode}
        // Component expects: {id, label, checked, flag}
        const transformed = arr.map((country) => ({
          id: Number(country.id), // API returns string, component uses number
          label: country.name,
          checked: false, // Default UI state
          flag: country.isocode === "UN" ? "UnitedNations" : country.isocode,
          isoCode: country.isocode
        }));

        setMarketItems(transformed);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error fetching countries:", error);
        setMarketItems([]);
      })
      .finally(() => {
        if (active) setLoadingMarkets(false);
      });

    return () => {
      active = false;
    };
  }, [getCountries]);

  useEffect(() => {
    const wasOpen = prevShowModalRef.current;
    prevShowModalRef.current = showModal;

    if (!wasOpen && showModal) {
      if (marketItems.length > 0) {
        applyDashboardSelectedMarkets();
      } else {
        shouldApplyDashboardMarketsOnNextLoadRef.current = true;
      }
    }
  }, [showModal, marketItems.length, applyDashboardSelectedMarkets]);

  useEffect(() => {
    if (!showModal) return;
    if (!shouldApplyDashboardMarketsOnNextLoadRef.current) return;
    if (marketItems.length === 0) return;
    shouldApplyDashboardMarketsOnNextLoadRef.current = false;
    applyDashboardSelectedMarkets();
  }, [showModal, marketItems, applyDashboardSelectedMarkets]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!showModal) return;

    const onStorage = (e) => {
      if (e?.key !== DASHBOARD_SELECTED_MARKETS_STORAGE_KEY) return;
      applyDashboardSelectedMarkets();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [showModal, applyDashboardSelectedMarkets]);

  const focusSearchInput = useCallback(() => {
    // Focus the first native input inside the input container
    const el = inputContainerRef.current?.querySelector("input");
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && showModal) {
        onHide();
      } else if (showModal && (e.metaKey || e.ctrlKey) && e.key === "k") { // portfolio edit: only while open, so a closed demo never swallows ⌘K
        e.preventDefault();
        setIsFocused(true);
        focusSearchInput();
      }
    },
    [onHide, showModal, focusSearchInput]
  );

  const handleFocus = useCallback((setFocused = true) => {
    setIsFocused(setFocused);
    setKeyCombination(
      setFocused
        ? i18n.t("platform.globalSearch.keyEsc")
        : navigator.userAgent.includes("Mac")
          ? i18n.t("platform.globalSearch.keyCmdK")
          : i18n.t("platform.globalSearch.keyCtrlK")
    );
  }, []);

  const updateRecentSearches = useCallback((result) => {
    if (userId === "anon") return;
    const {
      id,
      affiliateSiteId,
      type,
      title,
      parentTitle,
      route,
      subtitle,
      affiliateName,
      flag,
      marketIsoCodes,
      preferredMarketIsoCode,
      channelType,
      hasSegment,
      segmentName,
      segmentCommission,
      logo,
      backgroundImage,
      highlights,
      status
    } = result;
    // Shortcut destinations already sit in the command-center cards — don't fill Recents slots.
    if (
      type === "page" &&
      getCommandCenterShortcutIds(userRole).includes(id)
    ) {
      return;
    }
    setRecentSearches((prev) => {
      const partnerName = affiliateName || subtitle || "";
      const sanitizedStatus = sanitizeEntityStatus(status);
      const recentItem =
        type === "page"
          ? {
              id,
              type,
              title: title || "",
              parentTitle: parentTitle || "",
              route: route || ""
            }
          : {
              id,
              affiliateSiteId: affiliateSiteId || null,
              type,
              title,
              subtitle: partnerName,
              affiliateName: partnerName,
              flag,
              marketIsoCodes: marketIsoCodes || [],
              preferredMarketIsoCode: preferredMarketIsoCode || "",
              channelType: channelType || "",
              hasSegment: Boolean(hasSegment),
              segmentName: segmentName || "",
              segmentCommission: segmentCommission || "",
              logo,
              backgroundImage,
              highlights,
              ...(sanitizedStatus ? { status: sanitizedStatus } : {})
            };
      const updated = [
        recentItem,
        ...prev.filter((item) => `${item.type}:${item.id}` !== `${type}:${id}`)
      ].slice(0, 5);
      try {
        window.localStorage.setItem(recentSearchesStorageKey, JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent(RECENT_SEARCHES_EVENT, { detail: { recentSearches: updated } })
        );
      } catch {}
      return updated;
    });
  }, [recentSearchesStorageKey, userId, userRole]);

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((id) => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  }, []);

  const toggleMarket = useCallback((marketId) => {
    setMarketItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === marketId ? { ...item, checked: !item.checked } : item
      );
      return newItems;
    });
  }, []);

  const stableOptionMapRef = useRef(new Map());
  const prevCheckedIdsRef = useRef(new Set());

  const setMarketsFromSelectedLabels = useCallback((selectedLabels) => {
    setMarketItems((prev) =>
      prev.map((item) => ({
        ...item,
        checked: selectedLabels.includes(item.label)
      }))
    );
  }, []);

  const selectedMarketItems = useMemo(
    () => marketItems.filter((item) => item.checked),
    [marketItems]
  );

  const selectedMarketsCount = selectedMarketItems.length;

  const activeFilterCount =
    activeFilters.length + selectedMarketsCount + selectedStatusOptions.length;
  const hasActiveFilters = activeFilterCount > 0;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const isTouchPointer = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches === true,
    []
  );
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(-1);
  const [commandMouseMoved, setCommandMouseMoved] = useState(true);
  const filterHoverOpenTimerRef = useRef(null);
  const filterHoverCloseTimerRef = useRef(null);

  const clearFilterHoverTimers = useCallback(() => {
    if (filterHoverOpenTimerRef.current) {
      clearTimeout(filterHoverOpenTimerRef.current);
      filterHoverOpenTimerRef.current = null;
    }
    if (filterHoverCloseTimerRef.current) {
      clearTimeout(filterHoverCloseTimerRef.current);
      filterHoverCloseTimerRef.current = null;
    }
  }, []);

  const scheduleFiltersOpen = useCallback(() => {
    clearFilterHoverTimers();
    filterHoverOpenTimerRef.current = setTimeout(() => {
      setFiltersOpen(true);
    }, 150);
  }, [clearFilterHoverTimers]);

  const scheduleFiltersClose = useCallback(
    (event) => {
      // Moving into a nested Tippy (e.g. DropdownSelect menu) must not dismiss filters
      if (isInsideTippyRoot(event?.relatedTarget)) return;
      clearFilterHoverTimers();
      filterHoverCloseTimerRef.current = setTimeout(() => {
        setFiltersOpen(false);
      }, 200);
    },
    [clearFilterHoverTimers]
  );

  useEffect(() => {
    if (!showModal) {
      clearFilterHoverTimers();
      setFiltersOpen(false);
    }
  }, [showModal, clearFilterHoverTimers]);

  useEffect(
    () => () => {
      clearFilterHoverTimers();
    },
    [clearFilterHoverTimers]
  );

  const marketOptions = useMemo(() => {
    const currentCheckedIds = new Set(marketItems.filter((i) => i.checked).map((i) => i.id));

    const options = [...marketItems]
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
      .map((item) => {
        const wasChecked = prevCheckedIdsRef.current.has(item.id);
        const isChecked = currentCheckedIds.has(item.id);

        let optionObj = stableOptionMapRef.current.get(item.id);

        if (!optionObj || (wasChecked && !isChecked)) {
          optionObj = {
            label: item.label,
            value: item.id,
            icon: <Flag flag={item.flag} size="small" />
          };
          stableOptionMapRef.current.set(item.id, optionObj);
        } else {
          optionObj.label = item.label;
          optionObj.value = item.id;
          optionObj.icon = <Flag flag={item.flag} size="small" />;
        }

        return optionObj;
      });

    // Update previous checked ids snapshot for next render
    prevCheckedIdsRef.current = currentCheckedIds;

    return options;
  }, [marketItems]);

  const selectedMarketOptions = useMemo(() => {
    // Build selected option objects to pass as a controlled value to DropdownSelect
    const selectedLabels = new Set(marketItems.filter((i) => i.checked).map((i) => i.label));
    return marketOptions.filter((opt) => selectedLabels.has(opt.label));
  }, [marketItems, marketOptions]);

  const BrandItemComponent = useMemo(() => {
    if (userRole === "staff") {
      return StaffBrandResultItem;
    }
    return null;
  }, [userRole]);

  const performSearch = useCallback(() => {
    if (currentQuery.length < MIN_QUERY_LENGTH) {
      setSearchResults(null);
      setIsLoadingLocal(false);
      setNoMatchingValues(null);
      onLoadingChange(false);
      return;
    }

    let cancelled = false;
    // Clear to [] (not null) so command center hides and ResultList uses search chrome while loading.
    setSearchResults([]);
    setNoMatchingValues(null);
    setIsLoadingLocal(true);
    onLoadingChange(true);

    const pageMatches = matchSearchablePages(
      currentQuery,
      availableSearchablePages,
      (key) => i18n.t(key),
      {
        getResourceKeys: getPageResourceKeys
      }
    );

    const finishWithEntityResults = (entityResults = []) => {
      if (cancelled) return;
      const merged = [...pageMatches, ...(Array.isArray(entityResults) ? entityResults : [])];
      setSearchResults(merged);
      setNoMatchingValues(merged.length === 0 ? currentQuery : null);
      setIsLoadingLocal(false);
      onLoadingChange(false);
    };

    // In Storybook, use local mock data to simulate search results
    if (isStorybookPreview) {
      const timeout = setTimeout(
        () => {
          if (cancelled) return;

          const lcQuery = currentQuery.toLowerCase();
          const filtered = mockBrands.filter((b) =>
            (b.title || "").toLowerCase().includes(lcQuery)
          );

          // Apply client-side market filtering by iso code when markets are selected
          const selectedMarketCodes = new Set(
            marketItems
              .filter((i) => i.checked)
              .map((i) => (i.flag === "UnitedNations" ? "UN" : i.flag))
          );
          const hasCheckedMarkets = selectedMarketCodes.size > 0;
          const marketFiltered =
            hasCheckedMarkets && !isIdQuery(currentQuery)
              ? filtered.filter((item) => selectedMarketCodes.has((item.flag || "").toUpperCase()))
              : filtered;

          finishWithEntityResults(marketFiltered);
        },
        Math.max(0, Number(fakeSearchDelay) || 0)
      );

      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }

    if (!entitySearchEnabled) {
      finishWithEntityResults([]);
      return () => {
        cancelled = true;
      };
    }

    if (isBrandUser(userRole)) {
      const selectedStatuses = selectedStatusOptions.map((status) => status.value);
      const requestBody = { query: currentQuery };
      if (selectedStatuses.length > 0) {
        requestBody.statuses = selectedStatuses;
      }

      platformAgent
        .brand_getBrandGlobalSearchResult(requestBody)
        .then((response) => {
          if (cancelled) return;
          const list = Array.isArray(response) ? response : [];

          const mapped = list
            .map((r) => {
              if (!r) return null;
              const resourceType = (r.resource || "Channel").toLowerCase();
              const id = resourceType === "channel" ? r.affiliateSiteId : r.affiliateId;
              if (id == null) return null;

              const channelAffiliateName =
                resourceType === "channel" ? r.affiliateName || "" : "";
              return {
                id: id,
                affiliateSiteId: r.affiliateSiteId,
                type: resourceType,
                title: resourceType === "channel" ? r.channelName || "" : r.affiliateName || "",
                subtitle: channelAffiliateName,
                affiliateName: channelAffiliateName,
                flag: r.isoCode || "",
                marketIsoCodes:
                  Array.isArray(r.marketIsoCodes) && r.marketIsoCodes.length > 0
                    ? r.marketIsoCodes
                    : [r.isoCode].filter(Boolean),
                preferredMarketIsoCode: brandPreferredMarketIsoCode,
                channelType: r.channelType || "",
                hasSegment: Boolean(r.hasSegment),
                segmentName: r.segmentName || "",
                segmentCommission: r.segmentCommission || "",
                status: r.applicationStatus || "NOT_APPLIED"
              };
            })
            .filter(Boolean);

          const seen = new Set();
          const deduped = mapped.filter((item) => {
            const k = `${item.type}:${item.id}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });

          // Apply client-side type filtering (Partners/Channels filter chips).
          // Exact numeric ID queries skip type chips so a channel ID still surfaces.
          let typeFiltered = deduped;
          if (activeFilters.length > 0 && !isIdQuery(currentQuery)) {
            typeFiltered = deduped.filter((item) => activeFilters.includes(item.type));
          }

          // Apply client-side market filtering
          const selectedMarketCodes = new Set(
            marketItems
              .filter((i) => i.checked)
              .map((i) =>
                String(i.isoCode || (i.flag === "UnitedNations" ? "UN" : i.flag)).toUpperCase()
              )
          );
          const hasCheckedMarkets = selectedMarketCodes.size > 0;
          const marketFiltered =
            hasCheckedMarkets && !isIdQuery(currentQuery)
              ? typeFiltered.filter((item) => {
                  const itemMarkets = item.marketIsoCodes?.length ? item.marketIsoCodes : [item.flag];
                  return itemMarkets.some((market) => {
                    const code = String(market === "UnitedNations" ? "UN" : market).toUpperCase();
                    return selectedMarketCodes.has(code);
                  });
                })
              : typeFiltered;

          // Defense in depth: without Discover privilege, never render network-only statuses.
          const privilegeFiltered = canAccessDiscover
            ? marketFiltered
            : marketFiltered.filter(
                (item) =>
                  item.status &&
                  item.status !== "NOT_APPLIED" &&
                  item.status !== "NOT_APPLIED_API"
              );

          finishWithEntityResults(privilegeFiltered);
        })
        .catch((err) => {
          if (!cancelled) {
            const status = getHttpStatusFromClientError(err);
            const code = getErrorCodeFromClientError(err);
            if (status === 403 && code) {
              Toaster.trigger({
                type: "warning",
                title: i18n.t("platform.globalSearch.toast.brandSearchForbiddenTitle"),
                description: i18n.t(code)
              });
            }
            // Keep local page matches even when the entity API fails.
            finishWithEntityResults([]);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    // Partner users search for brands
    platformAgent
      .dashboard_getQueryResult({ query: currentQuery })
      .then(async (response) => {
        if (cancelled) return;
        const list = Array.isArray(response) ? response : [];
        const programIds = list.map((r) => r.programId).filter(Boolean);
        const highlightsMap = new Map();
        if (programIds.length > 0) {
          try {
            const highlightsResp = await getBrandHighlights(programIds);
            // Handle various response formats:
            // - Array directly: [{ programid: ... }]
            // - Object with highlights property: { highlights: [...] }
            // - Object with highlightsList property: { highlightsList: [...] }
            // - Single object (when only one program): { programid: ... }
            let highlightsList;
            if (Array.isArray(highlightsResp)) {
              highlightsList = highlightsResp;
            } else if (highlightsResp?.highlights) {
              highlightsList = highlightsResp.highlights;
            } else if (highlightsResp?.highlightsList) {
              highlightsList = highlightsResp.highlightsList;
            } else if (
              highlightsResp &&
              typeof highlightsResp === "object" &&
              highlightsResp.programid != null
            ) {
              // Single object response - wrap in array
              highlightsList = [highlightsResp];
            } else {
              highlightsList = [];
            }

            // Map API keys to HIGHLIGHT_TYPES display values
            const highlightKeys = [
              ["commissionincrease", i18n.t("platform.globalSearch.highlight.commissionIncrease")],
              ["newprogram", i18n.t("platform.globalSearch.highlight.newProgram")],
              ["promocode", i18n.t("platform.globalSearch.highlight.promoCode")],
              ["promotions", i18n.t("platform.globalSearch.highlight.promotions")],
              ["selfmanaged", i18n.t("platform.globalSearch.highlight.selfManaged")],
              ["productfeed", i18n.t("platform.globalSearch.highlight.productFeed")],
              ["gifting", i18n.t("platform.globalSearch.highlight.gifting")],
              ["foryou", i18n.t("platform.globalSearch.highlight.forYou")]
            ];

            highlightsList.forEach((h) => {
              const programId = Number(h.programid);
              if (!programId) return;
              const types = highlightKeys.filter(([key]) => h[key]).map(([, type]) => type);
              if (types.length > 0) highlightsMap.set(programId, types);
            });
          } catch (highlightError) {
            // Log highlight fetch errors for debugging
            console.warn("Failed to fetch brand highlights:", highlightError);
          }
        }

        const mapped = list
          .map((r) => {
            if (!r || r.programId == null) return null;
            const programId = Number(r.programId);
            return {
              id: programId,
              type: "brand",
              title: r.programName || "",
              flag: r.isoCode || "",
              additionalMarkets: Array.isArray(r.additionalMarkets) ? r.additionalMarkets : [],
              logo: r.logoUrl || undefined,
              backgroundImage: r.backgroundImageUrl || undefined,
              highlights: highlightsMap.get(programId) || [],
              status: r.applicationStatus || "NOT_APPLIED"
            };
          })
          .filter(Boolean);

        // Deduplicate by type-id pair to avoid duplicate keys and repeated items
        const seen = new Set();
        const deduped = mapped.filter((item) => {
          const k = `${item.type}:${item.id}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        // Apply client-side market filtering by iso code when markets are selected
        const selectedMarketCodes = new Set(
          marketItems
            .filter((i) => i.checked)
            .map((i) =>
              String(i.isoCode || (i.flag === "UnitedNations" ? "UN" : i.flag)).toUpperCase()
            )
        );
        const hasCheckedMarkets = selectedMarketCodes.size > 0;
        const marketFiltered =
          hasCheckedMarkets && !isIdQuery(currentQuery)
            ? deduped.filter((item) => {
                // Only brand items have country iso information in our mapping
                if (item.type !== "brand") return false;
                const code = (item.flag || "").toUpperCase();
                const additionalCodes = (item.additionalMarkets || []).map((c) =>
                  String(c).toUpperCase()
                );
                return (
                  selectedMarketCodes.has(code) ||
                  additionalCodes.some((c) => selectedMarketCodes.has(c))
                );
              })
            : deduped;

        const selectedStatuses = selectedStatusOptions.map((status) => status.value);
        const statusFiltered =
          selectedStatuses.length > 0 && !isIdQuery(currentQuery)
            ? marketFiltered.filter((item) =>
                matchesSelectedStatusFilters(item.status, selectedStatuses)
              )
            : marketFiltered;

        finishWithEntityResults(statusFiltered);
      })
      .catch((err) => {
        if (!cancelled) {
          const status = getHttpStatusFromClientError(err);
          const code = getErrorCodeFromClientError(err);
          if (status === 429 && code) {
            Toaster.trigger({
              type: "warning",
              title: i18n.t("platform.globalSearch.toast.rateLimitedTitle"),
              description: i18n.t(code)
            });
          }
          // Keep local page matches even when the entity API fails.
          finishWithEntityResults([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentQuery,
    onLoadingChange,
    fakeSearchDelay,
    isStorybookPreview,
    marketItems,
    brandPreferredMarketIsoCode,
    selectedStatusOptions,
    activeFilters,
    getBrandHighlights,
    userRole,
    availableSearchablePages,
    canAccessDiscover,
    entitySearchEnabled
  ]);

  useDebouncedEffect(performSearch, SEARCH_DELAY, [
    currentQuery,
    activeFilters,
    marketItems,
    brandPreferredMarketIsoCode,
    selectedStatusOptions
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Empty-query command center: ArrowUp/Down/Enter across shortcuts, recents, and nav rows.
  useEffect(() => {
    if (!showModal || searchResults != null) {
      setCommandSelectedIndex(-1);
      setCommandMouseMoved(true);
      clearCommandCenterKeyboardActive();
    }
  }, [showModal, searchResults]);

  useEffect(() => {
    if (!showModal || searchResults != null) return;

    const items = getCommandCenterItems();
    if (commandMouseMoved || commandSelectedIndex < 0) {
      items.forEach((el) => el.removeAttribute("data-keyboard-active"));
      return;
    }

    items.forEach((el, i) => {
      if (i === commandSelectedIndex) {
        el.setAttribute("data-keyboard-active", "true");
        if (typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ block: "nearest" });
        }
      } else {
        el.removeAttribute("data-keyboard-active");
      }
    });
  }, [showModal, searchResults, commandSelectedIndex, commandMouseMoved]);

  useEffect(() => {
    if (!showModal || searchResults != null) return undefined;

    const handleCommandKeyDown = (event) => {
      if (filtersOpen) return;
      if (isInsideTippyRoot(event.target)) return;

      const items = getCommandCenterItems();
      if (items.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCommandMouseMoved(false);
        setCommandSelectedIndex((prev) => {
          if (prev < 0) return 0;
          return prev < items.length - 1 ? prev + 1 : 0;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCommandMouseMoved(false);
        setCommandSelectedIndex((prev) => {
          if (prev < 0) return items.length - 1;
          return prev > 0 ? prev - 1 : items.length - 1;
        });
        return;
      }

      if (event.key === "Enter" && commandSelectedIndex >= 0) {
        const selected = items[commandSelectedIndex];
        if (selected) {
          event.preventDefault();
          selected.click();
        }
      }
    };

    const handleMouseMove = () => {
      setCommandMouseMoved((moved) => (moved ? moved : true));
    };

    window.addEventListener("keydown", handleCommandKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("keydown", handleCommandKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      clearCommandCenterKeyboardActive();
    };
  }, [showModal, searchResults, filtersOpen, commandSelectedIndex]);

  useEffect(() => {
    if (shouldFocus) {
      setCurrentQuery("");
      setIsFocused(true);
      setKeyCombination(i18n.t("platform.globalSearch.keyEsc"));
      // After the modal becomes visible, focus the input
      requestAnimationFrame(() => focusSearchInput());
      onFocusConsumed();
    }
  }, [shouldFocus, onFocusConsumed, focusSearchInput]);

  useEffect(() => {
    if (showModal) {
      setCurrentQuery("");
      // Ensure focus also when opening without keyboard shortcut
      requestAnimationFrame(() => focusSearchInput());
    }
  }, [showModal, focusSearchInput]);

  // Outside click is handled by shared Modal

  useEffect(() => {
    const timeoutId = searchTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const filterButtonAria = hasActiveFilters
    ? i18n.t("platform.globalSearch.filtersActiveAria")
    : i18n.t("platform.globalSearch.filtersButtonAria");

  const filterPopover = (
    <div
      className={styles.filter_popover}
      data-testid="global-search-filter-popover"
      onMouseEnter={
        isTouchPointer
          ? undefined
          : () => {
              clearFilterHoverTimers();
              setFiltersOpen(true);
            }
      }
      onMouseLeave={isTouchPointer ? undefined : scheduleFiltersClose}>
      {(userRole === "staff" || isBrandUser(userRole)) && (
        <div className={styles.filter_type_chips} data-testid="global-search-filter-type-chips">
          {userRole === "staff" &&
            staffFilters.map((item) => (
              <CheckChip
                key={item.id}
                text={item.label}
                size="default"
                checked={activeFilters.includes(item.id)}
                onClickCallback={() => toggleFilter(item.id)}
                className={styles.filter_chip}
                data-testid={`global-search-filter-${item.id}`}
              />
            ))}

          {isBrandUser(userRole) &&
            brandUserFilters.map((item) => (
              <CheckChip
                key={item.id}
                text={item.label}
                size="default"
                checked={activeFilters.includes(item.id)}
                onClickCallback={() => toggleFilter(item.id)}
                className={styles.filter_chip}
                data-testid={`global-search-filter-${item.id}`}
                iconLeft={
                  item.id === "partner" ? (
                    <Icons.User.Users01 />
                  ) : item.id === "channel" ? (
                    <Icons.Alert.Announcement01 />
                  ) : null
                }
              />
            ))}
        </div>
      )}
      <div className={styles.filter_controls} data-testid="global-search-filter-controls">
        <div className={styles.filter_control_row}>
          <DropdownSelect
            size="small"
            text={
              selectedMarketsCount === 1
                ? i18n.t("platform.globalSearch.market")
                : i18n.t("platform.globalSearch.markets")
            }
            options={marketOptions}
            iconLeftEnabled={true}
            search={false}
            multiSelect={true}
            preferredDirection="bottom"
            selectedOptions={selectedMarketOptions}
            onChange={(selected) => {
              const selectedLabels = Array.isArray(selected)
                ? selected.map((opt) => opt.label)
                : [];
              setMarketsFromSelectedLabels(selectedLabels);
            }}
          />
          {(isBrandUser(userRole) || userRole === "partner") && (
            <DropdownSelect
              size="small"
              text={i18n.t("platform.globalSearch.statusFilter")}
              options={userRole === "partner" ? partnerStatusOptions : brandStatusOptions}
              iconLeftEnabled={true}
              search={false}
              multiSelect={true}
              preferredDirection="bottom"
              selectedOptions={selectedStatusOptions}
              onChange={(selected) => {
                setSelectedStatusOptions(Array.isArray(selected) ? selected : []);
              }}
            />
          )}
        </div>
        {selectedMarketItems.length > 0 && (
          <div
            className={styles.selected_filters}
            data-testid="global-search-selected-filters">
            {selectedMarketItems.map((item) => (
              <Chip
                key={item.id}
                id={String(item.id)}
                text={item.label}
                size="small"
                iconLeft={<Flag flag={item.flag} size="small" />}
                onClose={(id) =>
                  setMarketItems((prev) =>
                    prev.map((i) => (i.id === Number(id) ? { ...i, checked: false } : i))
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      id="global-search-modal"
      isOpen={showModal}
      onClose={onHide}
      onOutsideClick={onHide}
      showCloseButton={true}
      dismissible={true}
      maxWidth="min(70vw, 1044px)"
      minHeight="250px"
      className={styles.global_search_modal}>
      <div className={styles.modal_body}>
        <div className={styles.input_row} data-testid="global-search-input-row">
          <div className={styles.input_container} ref={inputContainerRef}>
            <Input
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onBlur={() => handleFocus(false)}
              text={
                isBrandUser(userRole)
                  ? i18n.t("platform.globalSearch.modalPlaceholderBrand")
                  : i18n.t("platform.globalSearch.modalPlaceholderPartner")
              }
              onClick={() => handleFocus(true)}
              autoFocus={shouldFocus}
              iconLeft={
                <Icons.General.SearchMd
                  strokeWidth={2.73}
                  width="var(--size-icon-medium)"
                  height="var(--size-icon-medium)"
                />
              }
              iconRight={<Tag text={keyCombination} size="small" />}
              forceFocusBorder={isFocused}
            />
          </div>
          <Tippy
            content={filterPopover}
            visible={filtersOpen}
            interactive={true}
            interactiveBorder={12}
            appendTo={typeof document !== "undefined" ? () => document.body : "parent"}
            placement="bottom-end"
            arrow={false}
            theme="light"
            maxWidth="none"
            zIndex={10000020}
            onClickOutside={(_instance, event) => {
              if (isInsideTippyRoot(event?.target)) return;
              clearFilterHoverTimers();
              setFiltersOpen(false);
            }}>
            <span
              className={styles.filter_button_wrapper}
              data-testid="global-search-filter-button"
              onMouseEnter={isTouchPointer ? undefined : scheduleFiltersOpen}
              onMouseLeave={isTouchPointer ? undefined : scheduleFiltersClose}>
              <Button
                type="secondary"
                size="default"
                text=""
                ariaLabel={filterButtonAria}
                iconLeft={<Icons.General.FilterLines strokeWidth={2} />}
                onClick={() => {
                  clearFilterHoverTimers();
                  // touch has no hover to close on, so a tap toggles
                  setFiltersOpen((open) => (isTouchPointer ? !open : true));
                }}
                className={styles.filter_button}
              />
              {hasActiveFilters ? (
                <span
                  className={styles.filter_badge}
                  data-testid="global-search-filter-badge"
                  aria-hidden="true">
                  {activeFilterCount > 99 ? "99+" : activeFilterCount}
                </span>
              ) : null}
            </span>
          </Tippy>
        </div>
        <div className={styles.modal_main_container}>
          <div className={styles.search_scroll_outer_wrapper} id="search-wrapper">
            <div
              className={styles.command_center_content}
              id="search-content"
              data-testid="global-search-command-center">
              {searchResults == null && !isLoadingLocal && (
                <div className={styles.command_center_shortcuts}>
                  <GlobalSearchEmptySuggestions
                    userRole={userRole}
                    searchablePages={availableSearchablePages}
                    onNavigate={onHide}
                  />
                </div>
              )}
              <GlobalSearchResultList
                searchResults={searchResults}
                currentQuery={noMatchingValues}
                isLoadingLocal={isLoadingLocal}
                updateRecentSearches={updateRecentSearches}
                recentSearches={recentSearchResults}
                BrandItemComponent={BrandItemComponent}
                userRole={userRole}
                HighlightTag={HighlightTag}
                BrandCard={BrandCard}
                onItemSelected={() => {
                  onHide();
                }}
                onSuggestionClick={(suggestion) => {
                  setCurrentQuery(suggestion);
                  setIsFocused(true);
                  requestAnimationFrame(() => focusSearchInput());
                }}
              />
              {searchResults == null && !isLoadingLocal && (
                <GlobalSearchNavigationSections
                  userRole={userRole}
                  searchablePages={availableSearchablePages}
                  onNavigate={onHide}
                  updateRecentSearches={updateRecentSearches}
                />
              )}
            </div>
            <ScrollShadow
              direction="vertical"
              wrapper="search-wrapper"
              scrollContainer="search-content"
              hideScrollbar={true}
              size="small"
              showIdleHint
              showTooltip
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
