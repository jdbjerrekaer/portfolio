import { Icons } from "@adtraction/ui-icons";

/**
 * Presentation metadata per channel-type category. The list of channel types and their
 * category/slug/id comes from the partners channel-types endpoint (injected via the host as the
 * getChannelTypes prop); only the icon and header label live here.
 */
export const CHANNEL_CATEGORY_META = {
  content: { headerKey: "contentMarketing", Icon: Icons.Channel.Content },
  creators: { headerKey: "creators", Icon: Icons.Channel.Creators },
  paid: { headerKey: "paidMarketing", Icon: Icons.Channel.Paid },
  direct: { headerKey: "directMarketing", Icon: Icons.Channel.Direct },
  cashback: { headerKey: "savingsAndRewards", Icon: Icons.Channel.SavingsAndRewards },
  other: { headerKey: "other", Icon: Icons.Channel.Other }
};

export const CHANNEL_CATEGORY_ORDER = [
  "content",
  "creators",
  "paid",
  "direct",
  "cashback",
  "other"
];

/**
 * Build the channel-type filter options (header rows + indented child rows) from the DB-driven
 * catalog. Labels resolve from i18n by slug, falling back to the DB name for not-yet-translated
 * types; the icon comes from the category. New channel types appear with no code change.
 *
 * @param {Array} categories - `categories` array from the channel-types endpoint
 * @param {(key: string, opts?: object) => string} t - i18n translate function
 * @param {object} [indentStyle] - style applied to child rows
 */
export const buildChannelTypeOptions = (categories, t, indentStyle) => {
  const byKey = new Map((categories || []).map((category) => [category.key, category]));
  const options = [];
  CHANNEL_CATEGORY_ORDER.forEach((categoryKey) => {
    const category = byKey.get(categoryKey);
    if (!category || !category.channelTypes?.length) {
      return;
    }
    const meta = CHANNEL_CATEGORY_META[categoryKey] || CHANNEL_CATEGORY_META.other;
    const Icon = meta.Icon;
    const headerValue = `_header_${categoryKey}`;
    options.push({
      value: headerValue,
      label: t(`brands.brandsPage.channelType.${meta.headerKey}`),
      icon: <Icon />,
      _isHeader: true
    });
    category.channelTypes.forEach((channelType) => {
      options.push({
        value: channelType.slug,
        label: t(`brands.brandsPage.channelType.${channelType.slug}`, {
          defaultValue: channelType.name
        }),
        icon: <Icon />,
        _group: headerValue,
        style: indentStyle
      });
    });
  });
  return options;
};

/** Build a slug → affiliatesitetag-id lookup from the catalog (used to filter brands by type). */
export const buildChannelTypeSlugToId = (categories) => {
  const map = {};
  (categories || []).forEach((category) =>
    (category.channelTypes || []).forEach((channelType) => {
      map[channelType.slug] = channelType.id;
    })
  );
  return map;
};

/** Icon component for a channel-type category (content, creators, paid, …). */
export const getCategoryIconComponent = (category) => {
  const meta = CHANNEL_CATEGORY_META[category] || CHANNEL_CATEGORY_META.other;
  return meta.Icon;
};

const channelTypeIconProps = {
  color: "currentColor",
  width: "var(--size-icon-small)",
  height: "var(--size-icon-small)"
};

/** Rendered icon for a channel-type category. */
export const getCategoryIcon = (category) => {
  const Icon = getCategoryIconComponent(category);
  return <Icon {...channelTypeIconProps} />;
};

/** Resolve the translated label for a catalog entry (slug → i18n, else DB name). */
export const getChannelTypeDisplayLabel = (entry, t) => {
  if (!entry?.slug) {
    return entry?.name || "";
  }
  return t(`brands.brandsPage.channelType.${entry.slug}`, {
    defaultValue: entry.name
  });
};

/** Build name/id lookups from the DB-driven catalog. */
export const buildChannelTypeNameLookups = (categories) => {
  const byName = new Map();
  const byId = new Map();
  (categories || []).forEach((category) =>
    (category.channelTypes || []).forEach((channelType) => {
      const entry = {
        ...channelType,
        categoryKey: category.key,
        category: channelType.category || category.key
      };
      if (channelType.name) {
        byName.set(channelType.name.toLowerCase(), entry);
      }
      if (channelType.id != null) {
        byId.set(channelType.id, entry);
      }
    })
  );
  return { byName, byId };
};

/** Resolve a catalog entry by DB display name or affiliatesitetag id. */
export const resolveChannelTypeEntry = (name, categories, tagId = null) => {
  const { byName, byId } = buildChannelTypeNameLookups(categories);
  if (tagId != null && byId.has(tagId)) {
    return byId.get(tagId);
  }
  if (name && String(name).trim()) {
    return byName.get(String(name).toLowerCase()) ?? null;
  }
  return null;
};

const getCategorySortIndex = (category) => {
  const index = CHANNEL_CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CHANNEL_CATEGORY_ORDER.length : index;
};

const resolveFilterItem = (item, byName, byId) => {
  const name = typeof item === "string" ? item : item?.name;
  const tagId = typeof item === "object" && item != null ? item.tagId : null;
  return (
    (tagId != null && byId.get(tagId)) || (name ? byName.get(String(name).toLowerCase()) : null)
  );
};

/** Sort partnership channel-type filters by category, then display name. */
export const sortPartnershipChannelTypeFilters = (items, categories, t) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  const { byName, byId } = buildChannelTypeNameLookups(categories);
  return [...items].sort((a, b) => {
    const entryA = resolveFilterItem(a, byName, byId);
    const entryB = resolveFilterItem(b, byName, byId);
    const categoryA = entryA?.category ?? entryA?.categoryKey ?? "other";
    const categoryB = entryB?.category ?? entryB?.categoryKey ?? "other";
    const categoryDiff = getCategorySortIndex(categoryA) - getCategorySortIndex(categoryB);
    if (categoryDiff !== 0) {
      return categoryDiff;
    }
    const nameA = typeof a === "string" ? a : a?.name;
    const nameB = typeof b === "string" ? b : b?.name;
    const labelA = entryA ? getChannelTypeDisplayLabel(entryA, t) : nameA || "";
    const labelB = entryB ? getChannelTypeDisplayLabel(entryB, t) : nameB || "";
    return labelA.localeCompare(labelB, undefined, { sensitivity: "base" });
  });
};

export const buildPartnershipChannelTypeFilterOptions = (typeNames, categories, t) => {
  if (!Array.isArray(typeNames) || typeNames.length === 0) {
    return [];
  }
  const { byName, byId } = buildChannelTypeNameLookups(categories);
  return sortPartnershipChannelTypeFilters(typeNames, categories, t).map((item) => {
    const name = typeof item === "string" ? item : item?.name;
    const entry = resolveFilterItem(item, byName, byId);
    const category = entry?.category ?? entry?.categoryKey ?? "other";
    const Icon = getCategoryIconComponent(category);
    return {
      label: entry ? getChannelTypeDisplayLabel(entry, t) : name,
      value: name,
      icon: <Icon {...channelTypeIconProps} />
    };
  });
};
