// portfolio stand-in for the insights API agent: same method names, fake affiliate data, no network.
const CHANNELS = [
  ["Deal Hunters", "dealhunters.example", "cashback", ["DK", "SE"]],
  ["Nordic Savers", "nordicsavers.example", "voucher", ["SE", "NO"]],
  ["Tech Review Daily", "techreview.example", "content", ["DK"]],
  ["Budget Mama", "budgetmama.example", "content", ["NO"]],
  ["Points Club", "pointsclub.example", "loyalty", ["FI", "SE"]],
  ["Compare It", "compareit.example", "comparison", ["DK", "NO", "SE"]],
  ["Style Notes", "stylenotes.example", "influencer", ["SE"]],
  ["Coupon Corner", "couponcorner.example", "voucher", ["FI"]],
  ["Home & Garden Tips", "homegarden.example", "content", ["DK"]],
  ["Run Faster", "runfaster.example", "content", ["NO", "FI"]],
  ["Cashback Kings", "cashbackkings.example", "cashback", ["DK", "SE", "NO"]],
  ["Travel Buddy", "travelbuddy.example", "content", ["SE"]],
  ["Gadget Deals", "gadgetdeals.example", "voucher", ["DK"]],
  ["Family Finance", "familyfinance.example", "comparison", ["NO"]],
  ["Weekend Picks", "weekendpicks.example", "newsletter", ["FI", "DK"]],
  ["Green Living", "greenliving.example", "content", ["SE", "FI"]]
];

// Deterministic pseudo-random so the "previous period" is stable between toggles.
const rand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const buildRows = (period) =>
  CHANNELS.map(([channelName, channelUrl, channelType, channelMarkets], i) => {
    const drift = period === "compare" ? 0.7 + rand(i + 1) * 0.6 : 1;
    const visitors = Math.round((1200 + rand(i + 11) * 18000) * drift);
    const clicks = Math.round(visitors * (1.1 + rand(i + 21) * 0.4));
    const conversions = Math.round(visitors * (0.01 + rand(i + 31) * 0.05) * (period === "compare" ? 0.8 + rand(i + 41) * 0.5 : 1));
    const orderValue = Math.round(conversions * (350 + rand(i + 51) * 900));
    const commission = Math.round(orderValue * (0.04 + rand(i + 61) * 0.06));
    return {
      channelId: 1000 + i,
      channelName,
      channelUrl: `https://${channelUrl}`,
      channelType,
      channelMarkets,
      clicks,
      visitors,
      paidClicks: 0,
      conversions,
      convRate: visitors ? (conversions / visitors) * 100 : 0,
      epc: visitors ? commission / visitors : 0,
      commission,
      orderValue,
      aov: conversions ? orderValue / conversions : 0
    };
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const insightsAgent = {
  insights_getOverviewTable: async (params) => {
    await wait(700);
    // The demo marks the comparison request by its earlier start date.
    const period = params?.startDate && params.startDate < "2026-09-01" ? "compare" : "primary";
    return { data: buildRows(period), limitExceeded: false };
  },
  insights_getBrandDetails: async () => ({}),
  insights_saveMailSubscription: async () => ({ success: true })
};

export default insightsAgent;
