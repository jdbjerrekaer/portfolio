const MIN_QUERY_LENGTH = 2;

const RANK = {
  EXACT_TITLE: 1000,
  EXACT_CORE_PHRASE: 900,
  EXACT_CORE: 800,
  EXACT_SECONDARY_PHRASE: 700,
  EXACT_SECONDARY: 650,
  TITLE_PREFIX: 500,
  CORE_PREFIX: 400,
  TITLE_SUBSTRING: 200,
  CORE_SUBSTRING: 150,
  SECONDARY_SUBSTRING: 100
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");

const uniqueNormalized = (values) => {
  const seen = new Set();
  const result = [];
  (values || []).forEach((value) => {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
};

const phraseLengthBonus = (keyword) => Math.min(keyword.length, 80);

/**
 * Resolve synonyms from either Phase 1 arrays or Phase 2 Lokalise prefixes.
 * Phase 2: page.coreSynonymPrefix / page.secondarySynonymPrefix + getResourceKeys(prefix).
 */
export const resolvePageKeywords = (page, { translate, getResourceKeys } = {}) => {
  const resolveFromPrefix = (prefix) => {
    if (!prefix || typeof getResourceKeys !== "function" || typeof translate !== "function") {
      return [];
    }
    return getResourceKeys(prefix)
      .map((key) => {
        const value = translate(key);
        if (!value || value === key) return "";
        return value;
      })
      .filter(Boolean);
  };

  const core =
    Array.isArray(page.coreKeywords) && page.coreKeywords.length > 0
      ? page.coreKeywords
      : resolveFromPrefix(page.coreSynonymPrefix);
  const secondary =
    Array.isArray(page.secondaryKeywords) && page.secondaryKeywords.length > 0
      ? page.secondaryKeywords
      : resolveFromPrefix(page.secondarySynonymPrefix);

  return {
    core: uniqueNormalized(core),
    secondary: uniqueNormalized(secondary)
  };
};

const scoreKeywords = (query, keywords, { exactWord, exactPhrase, prefix, substring }) => {
  let best = 0;
  for (const keyword of keywords) {
    if (keyword === query) {
      const base = keyword.includes(" ") ? exactPhrase : exactWord;
      best = Math.max(best, base + phraseLengthBonus(keyword));
      continue;
    }
    if (keyword.startsWith(query)) {
      best = Math.max(best, prefix + phraseLengthBonus(keyword));
      continue;
    }
    if (keyword.includes(query)) {
      best = Math.max(best, substring);
    }
  }
  return best;
};

const scorePage = (page, query, translate, getResourceKeys) => {
  const title = normalize(typeof translate === "function" ? translate(page.titleKey) : page.titleKey);
  const { core, secondary } = resolvePageKeywords(page, { translate, getResourceKeys });

  let score = 0;
  if (title === query) score = Math.max(score, RANK.EXACT_TITLE + phraseLengthBonus(title));
  else if (title.startsWith(query)) score = Math.max(score, RANK.TITLE_PREFIX);
  else if (title.includes(query)) score = Math.max(score, RANK.TITLE_SUBSTRING);

  score = Math.max(
    score,
    scoreKeywords(query, core, {
      exactWord: RANK.EXACT_CORE,
      exactPhrase: RANK.EXACT_CORE_PHRASE,
      prefix: RANK.CORE_PREFIX,
      substring: RANK.CORE_SUBSTRING
    })
  );
  score = Math.max(
    score,
    scoreKeywords(query, secondary, {
      exactWord: RANK.EXACT_SECONDARY,
      exactPhrase: RANK.EXACT_SECONDARY_PHRASE,
      prefix: RANK.SECONDARY_SUBSTRING,
      substring: RANK.SECONDARY_SUBSTRING
    })
  );

  return score;
};

/**
 * Match access-filtered searchable pages against a query.
 * Titles/keywords are resolved at call time (async-i18n safe).
 *
 * @param {string} query
 * @param {Array} pages already access-filtered host registry entries
 * @param {(key: string) => string} translate
 * @param {{ getResourceKeys?: (prefix: string) => string[] }} [options]
 */
export const matchSearchablePages = (query, pages, translate, options = {}) => {
  const q = normalize(query);
  if (q.length < MIN_QUERY_LENGTH) return [];

  const getResourceKeys = options.getResourceKeys;
  const scored = [];
  const seenIds = new Set();

  (pages || []).forEach((page) => {
    if (!page || !page.id || !page.route || seenIds.has(page.id)) return;
    const score = scorePage(page, q, translate, getResourceKeys);
    if (score <= 0) return;
    seenIds.add(page.id);

    const title =
      typeof translate === "function" ? translate(page.titleKey) || page.titleKey : page.titleKey;
    const parentTitle = page.parentTitleKey
      ? typeof translate === "function"
        ? translate(page.parentTitleKey) || page.parentTitleKey
        : page.parentTitleKey
      : undefined;

    scored.push({
      id: page.id,
      type: "page",
      platform: page.platform || "partner",
      title,
      parentTitle,
      route: page.route,
      _score: score
    });
  });

  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return String(a.title).localeCompare(String(b.title));
  });

  return scored.map(({ _score, ...result }) => result);
};

/**
 * Collect translation keys under a prefix from an i18next-like resource bundle object.
 * Used by Phase 2 Lokalise synonym discovery.
 */
export const collectKeysByPrefix = (resources, prefix) => {
  if (!resources || !prefix) return [];
  const keys = Object.keys(resources);
  const withDot = prefix.endsWith(".") ? prefix : `${prefix}.`;
  return keys.filter((key) => key.startsWith(withDot));
};
