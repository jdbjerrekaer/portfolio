// portfolio stand-in for the brands MF superagent: only getSegmentBudget, used by
// SegmentBudgetTooltip. Shapes match the BUDGET_FIXTURES in SegmentCard.stories.jsx.
const BUDGETS = {
  influencers: {
    shared: true,
    unit: "Cost",
    period: "MONTHLY",
    threshold: 10000,
    remainingValue: 4200,
    currency: "SEK",
    fallbackSegmentName: "Standard"
  },
  cashback: {
    shared: false,
    unit: "Cost",
    period: "WEEKLY",
    threshold: 5000,
    remainingValue: 5000,
    currency: "SEK",
    fallbackSegmentName: "Standard"
  }
};

const brandsAgent = {
  getSegmentBudget: (segmentId) =>
    new Promise((resolve, reject) =>
      setTimeout(() => (BUDGETS[segmentId] ? resolve(BUDGETS[segmentId]) : reject(new Error("no budget"))), 400)
    )
};

export default brandsAgent;
