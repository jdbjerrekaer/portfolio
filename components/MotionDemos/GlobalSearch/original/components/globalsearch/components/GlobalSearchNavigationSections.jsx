import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { i18n } from "@adtraction/shared-i18n";
import { Icons } from "@adtraction/ui-icons";
import { groupSearchablePages } from "../groupSearchablePages";
import { getGlobalSearchPageIcon } from "../getGlobalSearchPageIcon";
import styles from "./GlobalSearchNavigationSections.module.scss";

const ICON_SIZE = "1.125rem";

const isBrandUser = (role) => role === "AdvertiserUser" || role === "SubAdvertiserUser";

/**
 * Empty-query navigation: grouped page destinations from the host searchablePages registry.
 */
export const GlobalSearchNavigationSections = ({
  userRole = "partner",
  searchablePages = [],
  onNavigate = () => {},
  updateRecentSearches = () => {}
}) => {
  const history = useHistory();
  const platform = isBrandUser(userRole) ? "brand" : "partner";
  const sections = useMemo(
    () => groupSearchablePages(searchablePages, platform),
    [searchablePages, platform]
  );

  if (sections.length === 0) return null;

  const handleNavigate = (page) => {
    if (!page?.route) return;
    const title = i18n.t(page.titleKey);
    const parentTitle = page.parentTitleKey ? i18n.t(page.parentTitleKey) : "";
    updateRecentSearches({
      id: page.id,
      type: "page",
      title,
      parentTitle,
      route: page.route
    });
    onNavigate();
    history.push(page.route);
  };

  return (
    <div className={styles.sections} data-testid="global-search-navigation-sections">
      {sections.map((section) => (
        <section
          key={section.id}
          className={styles.section}
          aria-labelledby={`gs-nav-${section.id}`}>
          <p className={styles.sectionHeader} id={`gs-nav-${section.id}`}>
            {i18n.t(section.titleKey)}
          </p>
          <div className={styles.list}>
            {section.pages.map((page) => {
              const title = i18n.t(page.titleKey);
              const parentTitle = page.parentTitleKey ? i18n.t(page.parentTitleKey) : "";
              const Icon = getGlobalSearchPageIcon(page.route);
              return (
                <button
                  key={page.id}
                  type="button"
                  className={styles.row}
                  data-command-item="true"
                  data-testid={`global-search-nav-${page.id}`}
                  aria-label={i18n.t("platform.globalSearch.aria.selectItem", { title })}
                  onClick={() => handleNavigate(page)}>
                  <span className={styles.iconWrap} aria-hidden="true">
                    <Icon width={ICON_SIZE} height={ICON_SIZE} strokeWidth={1.75} />
                  </span>
                  <span className={styles.content}>
                    <span className={styles.title}>{title}</span>
                    {parentTitle ? <span className={styles.meta}>{parentTitle}</span> : null}
                  </span>
                  <span className={styles.chevron} aria-hidden="true">
                    <Icons.Arrow.ChevronRight width="1rem" height="1rem" strokeWidth={1.75} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default GlobalSearchNavigationSections;
