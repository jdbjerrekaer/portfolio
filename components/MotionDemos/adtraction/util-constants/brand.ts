/**
 * Brand categories, keyed by their backend `category_id`.
 */
export const BRAND_CATEGORIES = {
  FINANCE: 1,
  AUTOMOTIVE: 2,
  ELECTRONICS: 3,
  OTHER: 4,
  HOBBIES_AND_GIFTS: 5,
  HEALTH_AND_BEAUTY: 6,
  HOME_AND_GARDEN: 7,
  INSURANCE: 8,
  FASHION: 9,
  FAMILY: 10,
  FOOD: 12,
  UTILITIES: 13,
  MARKETING: 14,
  TRAVEL: 15,
  SPORT_AND_OUTDOORS: 16,
  MEDIA: 17,
  ONLINE_SERVICES: 18
} as const;

/**
 * Maps each brand `category_id` to its Lokalise label key, so every consumer
 * resolves user-facing category labels from a single source.
 */
export const CATEGORY_LABEL_KEYS = {
  [BRAND_CATEGORIES.FINANCE]: "ui.toolkit.categories.finance",
  [BRAND_CATEGORIES.AUTOMOTIVE]: "ui.toolkit.categories.automotive",
  [BRAND_CATEGORIES.ELECTRONICS]: "ui.toolkit.categories.electronics",
  [BRAND_CATEGORIES.OTHER]: "ui.toolkit.categories.other",
  [BRAND_CATEGORIES.HOBBIES_AND_GIFTS]: "ui.toolkit.categories.hobbiesAndGifts",
  [BRAND_CATEGORIES.HEALTH_AND_BEAUTY]: "ui.toolkit.categories.healthAndBeauty",
  [BRAND_CATEGORIES.HOME_AND_GARDEN]: "ui.toolkit.categories.homeAndGarden",
  [BRAND_CATEGORIES.INSURANCE]: "ui.toolkit.categories.insurance",
  [BRAND_CATEGORIES.FASHION]: "ui.toolkit.categories.fashion",
  [BRAND_CATEGORIES.FAMILY]: "ui.toolkit.categories.family",
  [BRAND_CATEGORIES.FOOD]: "ui.toolkit.categories.food",
  [BRAND_CATEGORIES.UTILITIES]: "ui.toolkit.categories.utilities",
  [BRAND_CATEGORIES.MARKETING]: "ui.toolkit.categories.marketing",
  [BRAND_CATEGORIES.TRAVEL]: "ui.toolkit.categories.travel",
  [BRAND_CATEGORIES.SPORT_AND_OUTDOORS]: "ui.toolkit.categories.sportAndOutdoors",
  [BRAND_CATEGORIES.MEDIA]: "ui.toolkit.categories.media",
  [BRAND_CATEGORIES.ONLINE_SERVICES]: "ui.toolkit.categories.onlineServices"
} as const;

/**
 * Highlight types
 */
export const HIGHLIGHT_TYPES = {
  COMMISSION_INCREASE: "Commission Increase",
  NEW: "New",
  FOR_YOU: "For You",
  PROMO_CODE: "Promo Code",
  PROMOTIONS: "Promotions",
  GIFTING: "Gifting",
  SELF_MANAGED: "Self Managed",
  PRODUCT_FEED: "Product Feed",
  EXCLUSIVE: "Exclusive"
} as const;

/**
 * Application statuses
 */
export const APPLICATION_STATUS = {
  PENDING: "Waiting",
  APPROVED: "Approved",
  REJECTED: "Rejected"
} as const;

export const AFFILIATESITE_ADVERTPROGRAM_STATUS = {
  NOT_APPLIED: -9,
  PENDING: 2,
  APPROVED: 1,
  REJECTED: 0
} as const;

export const AFFILIATESITE_STATUS = {
  DENIED: 0,
  APPROVED: 1,
  PENDING: 2,
  REVIEW_AGAIN: 3,
  REVIEW_AGAIN_AND_PENDING: 4,
  UNDER_SURVEILLANCE: 5,
  REMOVE_UNDER_SURVEILLANCE: 6,
  PENDING_REJECTION: 7
} as const;

export const ADVERTPROGRAM_STATUS = {
  UNDER_CONSTRUCTION: 10,
  LIVE: 0,
  LIVE_HIDDEN: 1,
  PAUSED: 2,
  CLOSING: 3,
  CLOSED: 4,
  ARCHIVED: 5
} as const;

export const POPULARITY = {
  POPULAR: "Popular",
  VERY_POPULAR: "Very Popular",
  ON_THE_RISE: "On the Rise"
} as const;

/**
 * Service levels
 */
export const SERVICE_LEVELS = {
  BASIC: "Basic",
  GROWTH: "Growth",
  PREMIUM: "Premium"
} as const;
