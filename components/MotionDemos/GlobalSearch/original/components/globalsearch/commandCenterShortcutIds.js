const isBrandUser = (role) => role === "AdvertiserUser" || role === "SubAdvertiserUser";

export const PARTNER_SHORTCUT_IDS = [
  "partner.applications",
  "partner.insights.conversions",
  "partner.brands",
  "partner.earnings.balance"
];

export const BRAND_SHORTCUT_IDS = [
  "brand.myBrand.partnerAccess",
  "brand.myBrand.price",
  "brand.insights.conversions",
  "brand.insights.overview"
];

/** Page ids already shown as command-center shortcut cards — keep them out of Recents. */
export const getCommandCenterShortcutIds = (userRole) =>
  isBrandUser(userRole) ? BRAND_SHORTCUT_IDS : PARTNER_SHORTCUT_IDS;
