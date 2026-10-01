import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { i18n } from "@adtraction/shared-i18n";
import { Icons } from "@adtraction/ui-icons";
import { getCommandCenterShortcutIds } from "../commandCenterShortcutIds";
import styles from "./GlobalSearchEmptySuggestions.module.scss";

const SHORTCUT_META = {
  "partner.applications": {
    titleKey: "platform.globalSearch.shortcuts.myApplications",
    Icon: Icons.Files.FileCheck02,
    routeOverride: "/brands?status=applied",
    registryId: "partner.brands"
  },
  "partner.insights.conversions": {
    titleKey: "platform.globalSearch.pages.partner.insightsConversions",
    Icon: Icons.Finance.BankNote01
  },
  "partner.brands": {
    titleKey: "platform.globalSearch.shortcuts.myBrands",
    Icon: Icons.Custom.Brand,
    routeOverride: "/brands?status=approved"
  },
  "partner.earnings.balance": {
    titleKey: "platform.globalSearch.pages.partner.earnings",
    Icon: Icons.Finance.BankNote01
  },
  "brand.myBrand.partnerAccess": {
    titleKey: "platform.globalSearch.shortcuts.myChannels",
    Icon: Icons.User.Users01
  },
  "brand.myBrand.price": {
    titleKey: "platform.globalSearch.pages.brand.myBrandPrice",
    Icon: Icons.Finance.CoinsStacked01,
    // Host sets includeInShortcuts only for showCommissions (edit)
    requiresIncludeInShortcuts: true
  },
  "brand.insights.conversions": {
    titleKey: "platform.globalSearch.pages.brand.insightsConversions",
    Icon: Icons.Finance.BankNote01
  },
  "brand.insights.overview": {
    titleKey: "platform.globalSearch.pages.brand.insights",
    Icon: Icons.Chart.Pie02
  }
};

/**
 * Empty Recents state: shortcut cards resolved from the host searchablePages registry.
 */
export const GlobalSearchEmptySuggestions = ({
  userRole = "partner",
  searchablePages = [],
  onNavigate = () => {}
}) => {
  const history = useHistory();
  const shortcutIds = getCommandCenterShortcutIds(userRole);

  const suggestions = useMemo(() => {
    const byId = new Map(
      (Array.isArray(searchablePages) ? searchablePages : [])
        .filter((page) => page?.id)
        .map((page) => [page.id, page])
    );

    return shortcutIds
      .map((id) => {
        const meta = SHORTCUT_META[id];
        if (!meta) return null;
        const page = byId.get(meta.registryId || id);
        if (!page?.route) return null;
        if (meta.requiresIncludeInShortcuts && page.includeInShortcuts !== true) return null;
        return {
          id,
          route: meta.routeOverride || page.route,
          titleKey: meta.titleKey,
          Icon: meta.Icon
        };
      })
      .filter(Boolean);
  }, [searchablePages, shortcutIds]);

  if (suggestions.length === 0) return null;

  const handleNavigate = (route) => {
    if (!route) return;
    onNavigate();
    history.push(route);
  };

  return (
    <div
      className={styles.suggestions}
      role="list"
      aria-label={i18n.t("platform.globalSearch.shortcutsAria")}
      data-testid="global-search-shortcuts">
      {suggestions.map(({ id, route, titleKey, Icon }, index) => {
        const title = i18n.t(titleKey);
        return (
          <React.Fragment key={id}>
            {index > 0 && (
              <span
                className={styles.divider}
                data-testid="global-search-shortcut-divider"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              className={styles.card}
              role="listitem"
              data-command-item="true"
              data-testid={`global-search-shortcut-${id}`}
              aria-label={i18n.t("platform.globalSearch.aria.selectItem", { title })}
              onClick={() => handleNavigate(route)}>
              <span className={styles.icon_circle}>
                <Icon strokeWidth={1.75} width="1.5rem" height="1.5rem" />
              </span>
              <span className={styles.label}>{title}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};
