/**
 * Brand Platform searchable pages for global search.
 *
 * PHASE 2: synonyms live in Lokalise under titleKey.synonyms.core|secondary.*.
 * Resolve lazily via matchSearchablePages synonym prefixes + i18n resource bundle.
 *
 * `access` mirrors BrandLayout gates:
 *   always | discover | price
 */

export const SEARCHABLE_BRAND_PAGES = [
  {
    id: "brand.dashboard",
    platform: "brand",
    type: "page",
    route: "/dashboard",
    titleKey: "platform.globalSearch.pages.brand.dashboard",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.dashboard.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.dashboard.synonyms.secondary"
  },
  {
    id: "brand.insights.overview",
    platform: "brand",
    type: "page",
    route: "/insights/overview",
    titleKey: "platform.globalSearch.pages.brand.insightsOverview",
    parentTitleKey: "platform.globalSearch.pages.brand.insights",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.insightsOverview.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.insightsOverview.synonyms.secondary"
  },
  {
    id: "brand.insights.conversions",
    platform: "brand",
    type: "page",
    route: "/insights/conversions",
    titleKey: "platform.globalSearch.pages.brand.insightsConversions",
    parentTitleKey: "platform.globalSearch.pages.brand.insights",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.insightsConversions.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.insightsConversions.synonyms.secondary"
  },
  {
    id: "brand.discover",
    platform: "brand",
    type: "page",
    route: "/discover",
    titleKey: "platform.globalSearch.pages.brand.discover",
    access: "discover",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.discover.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.discover.synonyms.secondary"
  },
  {
    id: "brand.myBrand",
    platform: "brand",
    type: "page",
    route: "/my-brand",
    titleKey: "platform.globalSearch.pages.brand.myBrand",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrand.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrand.synonyms.secondary"
  },
  {
    id: "brand.myBrand.description",
    platform: "brand",
    type: "page",
    route: "/my-brand/description",
    titleKey: "platform.globalSearch.pages.brand.myBrandDescription",
    parentTitleKey: "platform.globalSearch.nav.brand",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandDescription.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandDescription.synonyms.secondary"
  },
  {
    id: "brand.myBrand.linksPromotions",
    platform: "brand",
    type: "page",
    route: "/my-brand/linksPromotions",
    titleKey: "platform.globalSearch.pages.brand.myBrandLinksPromotions",
    parentTitleKey: "platform.globalSearch.nav.brand",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandLinksPromotions.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandLinksPromotions.synonyms.secondary"
  },
  {
    id: "brand.myBrand.promoCodes",
    platform: "brand",
    type: "page",
    route: "/my-brand/promoCodes",
    titleKey: "platform.globalSearch.pages.brand.myBrandPromoCodes",
    parentTitleKey: "platform.globalSearch.nav.brand",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandPromoCodes.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandPromoCodes.synonyms.secondary"
  },
  {
    id: "brand.myBrand.images",
    platform: "brand",
    type: "page",
    route: "/my-brand/images",
    titleKey: "platform.globalSearch.pages.brand.myBrandImages",
    parentTitleKey: "platform.globalSearch.nav.brand",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandImages.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandImages.synonyms.secondary"
  },
  {
    id: "brand.myBrand.price",
    platform: "brand",
    type: "page",
    route: "/my-brand/price",
    titleKey: "platform.globalSearch.pages.brand.myBrandPrice",
    parentTitleKey: "platform.globalSearch.nav.brand",
    access: "price",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandPrice.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandPrice.synonyms.secondary"
  },
  {
    id: "brand.myBrand.finance",
    platform: "brand",
    type: "page",
    route: "/my-brand/finance",
    titleKey: "platform.globalSearch.pages.brand.myBrandFinance",
    parentTitleKey: "platform.globalSearch.nav.brand",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandFinance.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandFinance.synonyms.secondary"
  },
  {
    id: "brand.myBrand.channelAccess",
    platform: "brand",
    type: "page",
    route: "/my-brand/partner-access/channel-access",
    titleKey: "platform.globalSearch.pages.brand.myBrandChannelAccess",
    parentTitleKey: "platform.globalSearch.nav.partnerAccess",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandChannelAccess.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandChannelAccess.synonyms.secondary"
  },
  {
    id: "brand.myBrand.partnerAccess",
    platform: "brand",
    type: "page",
    route: "/my-brand/partner-access/partnerships",
    titleKey: "platform.globalSearch.pages.brand.myBrandPartnerAccess",
    parentTitleKey: "platform.globalSearch.nav.partnerAccess",
    access: "always",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.myBrandPartnerAccess.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.myBrandPartnerAccess.synonyms.secondary"
  },
  {
    id: "brand.settings.users",
    platform: "brand",
    type: "page",
    route: "/settings/users",
    titleKey: "platform.globalSearch.pages.brand.settingsUsers",
    parentTitleKey: "platform.globalSearch.nav.settings",
    access: "fullAdvertiser",
    coreSynonymPrefix: "platform.globalSearch.pages.brand.settingsUsers.synonyms.core",
    secondarySynonymPrefix: "platform.globalSearch.pages.brand.settingsUsers.synonyms.secondary"
  }
];

/**
 * Filter Brand Platform registry entries by BrandLayout privilege flags.
 * Price stays in the registry for view access (`hasPriceAccess` =
 * showCommissions OR showSegmentInfoAffiliates);
 * `includeInShortcuts` is set only when the user can edit commissions.
 * Settings Users matches BrandSettingsPage (hidden from sub-advertisers).
 */
export const filterSearchableBrandPages = ({
  canAccessDiscover = false,
  hasPriceAccess = false,
  canEditPrice = false,
  isSubAdvertiserUser = false
} = {}) => {
  return SEARCHABLE_BRAND_PAGES.filter((page) => {
    switch (page.access) {
      case "always":
        return true;
      case "discover":
        return canAccessDiscover;
      case "price":
        return hasPriceAccess;
      case "fullAdvertiser":
        return !isSubAdvertiserUser;
      default:
        return false;
    }
  }).map((page) =>
    page.id === "brand.myBrand.price"
      ? { ...page, includeInShortcuts: Boolean(canEditPrice) }
      : page
  );
};
