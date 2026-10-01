import { i18n } from "@adtraction/shared-i18n";
import { CHANNEL_CATEGORY_META } from "../../../utils/channelTypeOptions";

export const KEY_PREFIX = "brands.myBrand.partnerAccess.channelAccess";

/** Acronyms / synonyms that don't appear in the short label. */
const CHANNEL_TYPE_SEARCH_ALIASES = {
  sem: ["searchEngineAds"],
  sea: ["searchEngineAds"],
  ppc: ["searchEngineAds"],
  cpc: ["searchEngineAds"],
  css: ["css"],
  "comparison shopping": ["css"],
  "comparison shopping service": ["css"],
  "comparison shopping services": ["css"]
};

export const channelTypeLabel = (channelType) =>
  i18n.t(`brands.brandsPage.channelType.${channelType.slug}`, {
    defaultValue: channelType.name || ""
  });

export const channelTypeDescription = (channelType) =>
  i18n.t(`${KEY_PREFIX}.description.${channelType.slug}`, { defaultValue: "" });

export const categoryHeaderLabel = (categoryKey) => {
  const meta = CHANNEL_CATEGORY_META[categoryKey] || CHANNEL_CATEGORY_META.other;
  return i18n.t(`brands.brandsPage.channelType.${meta.headerKey}`);
};

/** Split camelCase / kebab slugs into searchable words: searchEngineAds → "search engine ads". */
const slugToSearchText = (slug = "") =>
  String(slug)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .toLowerCase();

/**
 * Match search against label, description, slug/name, and known aliases
 * (e.g. "comparison shopping" → CSS, "sem" → Search engine ads).
 */
export const channelTypeMatchesSearch = (channelType, rawQuery) => {
  const query = String(rawQuery || "")
    .trim()
    .toLowerCase();
  if (!query) return true;

  const haystack = [
    channelTypeLabel(channelType),
    channelTypeDescription(channelType),
    channelType.name || "",
    channelType.slug || "",
    slugToSearchText(channelType.slug)
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(query)) return true;

  const aliasSlugs = CHANNEL_TYPE_SEARCH_ALIASES[query];
  if (aliasSlugs?.includes(channelType.slug)) return true;

  return false;
};
