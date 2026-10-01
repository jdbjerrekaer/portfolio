// Stand-in for platform/superagent/platformAgent: same method names and response shapes as the
// BFF's brand global-search endpoint, served from fictional data after a latency the visitor picks.

let latencyMs = 150;
export const setFakeSearchLatency = (ms) => {
  latencyMs = ms;
};

// Fictional partners and channels (no real Adtraction customers).
const PARTNERS = [
  { affiliateId: 410233, affiliateName: "Tidvatten Media AB", isoCode: "SE", marketIsoCodes: ["SE", "NO"], applicationStatus: "APPROVED" },
  { affiliateId: 410871, affiliateName: "Fjällglim Publishing", isoCode: "NO", marketIsoCodes: ["NO"], applicationStatus: "APPLIED" },
  { affiliateId: 411502, affiliateName: "Bytesbaren Rewards ApS", isoCode: "DK", marketIsoCodes: ["DK", "SE", "FI"], applicationStatus: "APPROVED" },
  { affiliateId: 412040, affiliateName: "Lumo Creators Oy", isoCode: "FI", marketIsoCodes: ["FI"], applicationStatus: "INVITED" },
  { affiliateId: 412388, affiliateName: "Kvällsdeal Media", isoCode: "SE", marketIsoCodes: ["SE"], applicationStatus: "NOT_APPLIED" },
  { affiliateId: 413117, affiliateName: "Saltsten Digital GmbH", isoCode: "DE", marketIsoCodes: ["DE", "AT"], applicationStatus: "REJECTED" }
];

const CHANNELS = [
  { affiliateSiteId: 920114, affiliateId: 410233, channelName: "Tidvatten Deals", channelType: "promoCodes", isoCode: "SE", marketIsoCodes: ["SE", "NO"], applicationStatus: "APPROVED", hasSegment: true, segmentName: "Top content partners", segmentCommission: "12 %" },
  { affiliateSiteId: 920377, affiliateId: 410233, channelName: "Tidvatten Media newsletter", channelType: "email", isoCode: "SE", marketIsoCodes: ["SE"], applicationStatus: "APPROVED", hasSegment: false },
  { affiliateSiteId: 921045, affiliateId: 410871, channelName: "Fjällglim travel blog", channelType: "blog", isoCode: "NO", marketIsoCodes: ["NO"], applicationStatus: "APPLIED" },
  { affiliateSiteId: 921388, affiliateId: 411502, channelName: "Bytesbaren cashback app", channelType: "cashback", isoCode: "DK", marketIsoCodes: ["DK", "SE", "FI"], applicationStatus: "APPROVED", hasSegment: true, segmentName: "Cashback 2024", segmentCommission: "8 %" },
  { affiliateSiteId: 922051, affiliateId: 412040, channelName: "@lumo.creates", channelType: "instagram", isoCode: "FI", marketIsoCodes: ["FI"], applicationStatus: "INVITED" },
  { affiliateSiteId: 922406, affiliateId: 412388, channelName: "Kvällsdeal price comparison", channelType: "comparison", isoCode: "SE", marketIsoCodes: ["SE"], applicationStatus: "NOT_APPLIED" },
  { affiliateSiteId: 923170, affiliateId: 413117, channelName: "Saltsten search campaigns", channelType: "searchEngineAds", isoCode: "DE", marketIsoCodes: ["DE", "AT"], applicationStatus: "REJECTED" },
  { affiliateSiteId: 923522, affiliateId: 411502, channelName: "Bytesbaren deals weekly", channelType: "email", isoCode: "DK", marketIsoCodes: ["DK"], applicationStatus: "APPLIED" }
];

const nameOf = (id) => PARTNERS.find((p) => p.affiliateId === id)?.affiliateName || "";

const STATUS_VALUE_TO_API = {
  approved: ["APPROVED"],
  pending: ["APPLIED"],
  declined: ["REJECTED"],
  invited: ["INVITED"]
};

const wait = () => new Promise((resolve) => setTimeout(resolve, latencyMs));

const platformAgent = {
  // Same contract as POST client/platform/globalSearch: mixed Channel/Partner rows.
  async brand_getBrandGlobalSearchResult({ query = "", statuses } = {}) {
    await wait();
    const q = String(query).trim().toLowerCase();
    const isId = /^\d+$/.test(q);
    const allowed = Array.isArray(statuses) && statuses.length
      ? new Set(statuses.flatMap((s) => STATUS_VALUE_TO_API[s] || []))
      : null;
    const keep = (status) => !allowed || allowed.has(status);

    const channels = CHANNELS.filter((c) =>
      isId ? String(c.affiliateSiteId) === q : c.channelName.toLowerCase().includes(q) || nameOf(c.affiliateId).toLowerCase().includes(q)
    )
      .filter((c) => keep(c.applicationStatus))
      .map((c) => ({ resource: "Channel", ...c, affiliateName: nameOf(c.affiliateId) }));

    const partners = PARTNERS.filter((p) =>
      isId ? String(p.affiliateId) === q : p.affiliateName.toLowerCase().includes(q)
    )
      .filter((p) => keep(p.applicationStatus))
      .map((p) => ({ resource: "Partner", ...p }));

    return [...partners, ...channels];
  },

  async getBrandSelectCountries() {
    return [
      { id: "1", name: "Sweden", isocode: "SE" },
      { id: "6", name: "Denmark", isocode: "DK" },
      { id: "8", name: "Finland", isocode: "FI" },
      { id: "15", name: "Norway", isocode: "NO" },
      { id: "10", name: "Germany", isocode: "DE" },
      { id: "2", name: "Austria", isocode: "AT" }
    ];
  }
};

export default platformAgent;
