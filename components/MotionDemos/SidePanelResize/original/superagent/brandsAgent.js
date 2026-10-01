// Stand-in for brands/src/app/superagent/brandsAgent.js: the two calls PriceHistoryModal makes,
// resolving a fake commission history after a short delay so the loading state is visible.
const DAY = 86400000;
const now = Date.now();
const wait = (value, delay) => new Promise((r) => setTimeout(() => r(value), delay));

const brandsAgent = {
  getCompensationSegmentHistory: () =>
    wait(
      [
        { timestamp: now - 12 * DAY, setting: "Partner commission", change: "8.00% -> 10.00%", username: "Maja Holm" },
        { timestamp: now - 47 * DAY, setting: "Segment name", change: "Default -> Content partners", username: "Maja Holm" },
        { timestamp: now - 95 * DAY, setting: "Partner commission", change: "6.50% -> 8.00%", username: "Jonas Berg" },
        { timestamp: now - 160 * DAY, setting: "Cookie duration", change: "30 days -> 45 days", username: "Jonas Berg" },
        { timestamp: now - 240 * DAY, setting: "Partner commission", change: "5.00% -> 6.50%", username: "Sara Ek" }
      ],
      700
    ),
  getFutureCompensationSegments: () =>
    wait(
      [
        {
          futurecompensationsegment_id: 1,
          compensationsegment_id: 101,
          value: 12,
          percentagecompensation: true,
          changedate: now + 14 * DAY
        }
      ],
      700
    )
};

export default brandsAgent;
