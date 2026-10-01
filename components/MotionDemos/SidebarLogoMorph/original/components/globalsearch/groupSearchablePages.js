/**
 * Group access-filtered searchable page registry entries into modal navigation sections.
 * Privilege filtering stays in the host; this only organizes what was already passed in.
 */

const PARTNER_SECTION_DEFS = [
  {
    id: "main",
    titleKey: "platform.globalSearch.nav.main",
    matchIds: ["partner.dashboard", "partner.brands", "partner.products"]
  },
  {
    id: "insights",
    titleKey: "platform.globalSearch.nav.insights",
    matchPrefix: "partner.insights."
  },
  {
    id: "earnings",
    titleKey: "platform.globalSearch.nav.earnings",
    matchPrefix: "partner.earnings."
  },
  {
    id: "features",
    titleKey: "platform.globalSearch.nav.features",
    matchPrefix: "partner.features."
  },
  {
    id: "settings",
    titleKey: "platform.globalSearch.nav.settings",
    matchPrefix: "partner.settings."
  }
];

const BRAND_SECTION_DEFS = [
  {
    id: "main",
    titleKey: "platform.globalSearch.nav.main",
    matchIds: ["brand.dashboard", "brand.discover"]
  },
  {
    id: "insights",
    titleKey: "platform.globalSearch.nav.insights",
    matchIds: ["brand.insights.overview", "brand.insights.conversions"]
  },
  {
    id: "brand",
    titleKey: "platform.globalSearch.nav.brand",
    matchIds: [
      "brand.myBrand.description",
      "brand.myBrand.linksPromotions",
      "brand.myBrand.promoCodes",
      "brand.myBrand.images",
      "brand.myBrand.price"
    ]
  },
  {
    id: "partnerAccess",
    titleKey: "platform.globalSearch.nav.partnerAccess",
    matchIds: ["brand.myBrand.channelAccess", "brand.myBrand.partnerAccess"]
  },
  {
    id: "settings",
    titleKey: "platform.globalSearch.nav.settings",
    matchPrefix: "brand.settings."
  }
];

/**
 * @param {Array} searchablePages - privilege-filtered registry entries
 * @param {"partner"|"brand"} platform
 * @returns {Array<{ id: string, titleKey: string, pages: Array }>}
 */
export const groupSearchablePages = (searchablePages = [], platform = "partner") => {
  const defs = platform === "brand" ? BRAND_SECTION_DEFS : PARTNER_SECTION_DEFS;
  const pages = Array.isArray(searchablePages) ? searchablePages : [];
  const pagesById = new Map(pages.map((page) => [page.id, page]));

  return defs
    .map((section) => {
      const matchedIds = new Set();
      const sectionPages = [];

      if (Array.isArray(section.matchIds)) {
        section.matchIds.forEach((id) => {
          const page = pagesById.get(id);
          if (!page) return;
          matchedIds.add(id);
          sectionPages.push(page);
        });
      }

      if (section.matchPrefix) {
        pages.forEach((page) => {
          if (!page?.id?.startsWith(section.matchPrefix) || matchedIds.has(page.id)) return;
          sectionPages.push(page);
        });
      }

      return {
        id: section.id,
        titleKey: section.titleKey,
        pages: sectionPages
      };
    })
    .filter((section) => section.pages.length > 0);
};
