import { Icons } from "@adtraction/ui-icons";
import { i18n } from "@adtraction/shared-i18n";

/**
 * @typedef {"content" | "paid" | "direct" | "creators" | "savingsAndRewards" | "other"} ChannelPrimaryType
 * @typedef {import("react").ComponentType<any>} ChannelIconComponent
 * @typedef {{ icon: ChannelIconComponent; label: string; type: ChannelPrimaryType }} ChannelCategory
 */

/** @type {ChannelPrimaryType[]} */
export const CHANNEL_PRIMARY_TYPES = [
  "content",
  "paid",
  "direct",
  "creators",
  "savingsAndRewards",
  "other"
];

/** @type {Record<ChannelPrimaryType, ChannelIconComponent>} */
export const CHANNEL_TYPE_ICON_MAP = {
  content: Icons.Channel.Content,
  paid: Icons.Channel.Paid,
  direct: Icons.Channel.Direct,
  creators: Icons.Channel.Creators,
  savingsAndRewards: Icons.Channel.SavingsAndRewards,
  other: Icons.Channel.Other
};

/** @type {Record<ChannelPrimaryType, string>} */
export const CHANNEL_TYPE_LABELS = {
  get content() {
    return i18n.t("ui.toolkit.channel.type.content");
  },
  get paid() {
    return i18n.t("ui.toolkit.channel.type.paid");
  },
  get direct() {
    return i18n.t("ui.toolkit.channel.type.direct");
  },
  get creators() {
    return i18n.t("ui.toolkit.channel.type.creators");
  },
  get savingsAndRewards() {
    return i18n.t("ui.toolkit.channel.type.savingsAndRewards");
  },
  get other() {
    return i18n.t("ui.toolkit.channel.type.other");
  }
};

/** @type {Record<string, ChannelCategory>} */
export const CHANNEL_CATEGORY_MAP = {
  content: {
    icon: Icons.Channel.Content,
    get label() {
      return i18n.t("ui.toolkit.channel.type.content");
    },
    type: "content"
  },
  comparison: {
    icon: Icons.Channel.Content,
    get label() {
      return i18n.t("ui.toolkit.channel.category.comparison");
    },
    type: "content"
  },
  directory: {
    icon: Icons.Channel.Content,
    get label() {
      return i18n.t("ui.toolkit.channel.category.directory");
    },
    type: "content"
  },
  productTester: {
    icon: Icons.Channel.Content,
    get label() {
      return i18n.t("ui.toolkit.channel.category.productTester");
    },
    type: "content"
  },

  blog: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.blog");
    },
    type: "creators"
  },
  facebookGroup: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.facebookGroup");
    },
    type: "creators"
  },
  influencerSubnetwork: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.influencerSubnetwork");
    },
    type: "creators"
  },
  instagram: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.instagram");
    },
    type: "creators"
  },
  telegram: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.telegram");
    },
    type: "creators"
  },
  tiktok: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.tiktok");
    },
    type: "creators"
  },
  youtube: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.youtube");
    },
    type: "creators"
  },
  otherSocialMedia: {
    icon: Icons.Channel.Creators,
    get label() {
      return i18n.t("ui.toolkit.channel.category.otherSocialMedia");
    },
    type: "creators"
  },

  browserExtension: {
    icon: Icons.Channel.SavingsAndRewards,
    get label() {
      return i18n.t("ui.toolkit.channel.category.browserExtension");
    },
    type: "savingsAndRewards"
  },
  cashback: {
    icon: Icons.Channel.SavingsAndRewards,
    get label() {
      return i18n.t("ui.toolkit.channel.category.cashback");
    },
    type: "savingsAndRewards"
  },
  promoCodes: {
    icon: Icons.Channel.SavingsAndRewards,
    get label() {
      return i18n.t("ui.toolkit.channel.category.promoCodes");
    },
    type: "savingsAndRewards"
  },
  promotions: {
    icon: Icons.Channel.SavingsAndRewards,
    get label() {
      return i18n.t("ui.toolkit.channel.category.promotions");
    },
    type: "savingsAndRewards"
  },
  loyalty: {
    icon: Icons.Channel.SavingsAndRewards,
    get label() {
      return i18n.t("ui.toolkit.channel.category.loyalty");
    },
    type: "savingsAndRewards"
  },
  portal: {
    icon: Icons.Channel.SavingsAndRewards,
    get label() {
      return i18n.t("ui.toolkit.channel.category.portal");
    },
    type: "savingsAndRewards"
  },

  email: {
    icon: Icons.Channel.Direct,
    get label() {
      return i18n.t("ui.toolkit.channel.category.email");
    },
    type: "direct"
  },
  sms: {
    icon: Icons.Channel.Direct,
    get label() {
      return i18n.t("ui.toolkit.channel.category.sms");
    },
    type: "direct"
  },

  css: {
    icon: Icons.Channel.Paid,
    get label() {
      return i18n.t("ui.toolkit.channel.category.css");
    },
    type: "paid"
  },
  retargeting: {
    icon: Icons.Channel.Paid,
    get label() {
      return i18n.t("ui.toolkit.channel.category.retargeting");
    },
    type: "paid"
  },
  searchEngineAds: {
    icon: Icons.Channel.Paid,
    get label() {
      return i18n.t("ui.toolkit.channel.category.searchEngineAds");
    },
    type: "paid"
  },
  socialMediaAds: {
    icon: Icons.Channel.Paid,
    get label() {
      return i18n.t("ui.toolkit.channel.category.socialMediaAds");
    },
    type: "paid"
  },

  adtractionPlus: {
    icon: Icons.Channel.Other,
    get label() {
      return i18n.t("ui.toolkit.channel.category.adtractionPlus");
    },
    type: "other"
  },
  adtractionTest: {
    icon: Icons.Channel.Other,
    get label() {
      return i18n.t("ui.toolkit.channel.category.adtractionTest");
    },
    type: "other"
  },
  broker: {
    icon: Icons.Channel.Other,
    get label() {
      return i18n.t("ui.toolkit.channel.category.broker");
    },
    type: "other"
  },
  mobileApp: {
    icon: Icons.Channel.Other,
    get label() {
      return i18n.t("ui.toolkit.channel.category.mobileApp");
    },
    type: "other"
  },
  subnetwork: {
    icon: Icons.Channel.Other,
    get label() {
      return i18n.t("ui.toolkit.channel.category.subnetwork");
    },
    type: "other"
  },
  other: {
    icon: Icons.Channel.Other,
    get label() {
      return i18n.t("ui.toolkit.channel.category.other");
    },
    type: "other"
  }
};

/**
 * Maps an affiliate site tag string to a valid channel type.
 * Handles various tag formats and normalizations to match valid channel types.
 *
 * @param {string|null|undefined} tag - The affiliate site tag to map
 * @returns {string} A valid channel type, or "other" as fallback
 */
export const mapTagToChannelType = (tag) => {
  if (!tag) return "other";

  const trimmed = String(tag).trim();

  // Check if it's already a valid key in CHANNEL_CATEGORY_MAP
  if (CHANNEL_CATEGORY_MAP[trimmed]) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();

  // Check normalized version
  if (CHANNEL_CATEGORY_MAP[normalized]) {
    return normalized;
  }

  const collapsed = normalized.replace(/[\s_-]+/g, "");

  // Check collapsed version
  if (CHANNEL_CATEGORY_MAP[collapsed]) {
    return collapsed;
  }

  // Special mappings for backend variations
  const tagMappings = {
    "comparison shopping service": "comparison",
    "comparison website": "comparison",
    "css (google shopping kanal)": "comparison",
    browserextension: "browserExtension",
    "browser extension": "browserExtension",
    browser_extension: "browserExtension",
    mobileapp: "mobileApp",
    "mobile app": "mobileApp",
    mobile_app: "mobileApp",
    newsletter: "email",
    "promo codes": "promoCodes",
    coupons: "promoCodes",
    "product tester": "productTester",
    producttester: "productTester",
    "facebook group": "facebookGroup",
    facebookgroup: "facebookGroup",
    "influencer subnetwork": "influencerSubnetwork",
    influencersubnetwork: "influencerSubnetwork",
    "other social media": "otherSocialMedia",
    othersocialmedia: "otherSocialMedia",
    "search engine ads": "searchEngineAds",
    searchengineads: "searchEngineAds",
    "social media ads": "socialMediaAds",
    socialmediaads: "socialMediaAds",
    "adtraction plus": "adtractionPlus",
    adtractionplus: "adtractionPlus",
    "adtraction test": "adtractionTest",
    adtractiontest: "adtractionTest"
  };

  return tagMappings[normalized] || tagMappings[collapsed] || "other";
};

export const SUBNETWORK_CHANNEL_TYPE_TAG_IDS = [21, 26];

export const SUBNETWORK_CHANNEL_TYPES = ["subnetwork", "influencerSubnetwork"];

export const isSubnetworkChannelType = (channelType, channelTypeTagId = null) => {
  const tagId = channelTypeTagId != null ? Number(channelTypeTagId) : null;
  if (tagId != null && !Number.isNaN(tagId) && SUBNETWORK_CHANNEL_TYPE_TAG_IDS.includes(tagId)) {
    return true;
  }
  return SUBNETWORK_CHANNEL_TYPES.includes(mapTagToChannelType(channelType));
};
