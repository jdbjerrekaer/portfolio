import { i18n } from "@adtraction/shared-i18n";

/** Monolith trend mail group-by strings (ReportUtil GROUPBY_*). */
export const MAIL_GROUP_BY_PERIOD_DAY = "groupbyday";
export const MAIL_GROUP_BY_PERIOD_WEEK = "groupbyweek";
export const MAIL_GROUP_BY_PERIOD_MONTH = "groupbymonth";
export const MAIL_GROUP_BY_PERIOD_YEAR = "groupbyyear";

export const INSIGHTS_OVERVIEW_GROUP_BY = Object.freeze({
  EPI: "epi",
  BRAND: "brand",
  CHANNEL: "channel",
  BRANDMATERIAL: "brandmaterial",
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  HOUR: "hour"
});

export const INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL = Object.freeze([
  INSIGHTS_OVERVIEW_GROUP_BY.DAY,
  INSIGHTS_OVERVIEW_GROUP_BY.WEEK,
  INSIGHTS_OVERVIEW_GROUP_BY.MONTH,
  INSIGHTS_OVERVIEW_GROUP_BY.HOUR
]);

export function isInsightsOverviewIntervalGroupBy(groupBy) {
  if (groupBy == null || groupBy === "") {
    return false;
  }
  return INSIGHTS_OVERVIEW_GROUP_BY_INTERVAL.includes(String(groupBy).toLowerCase());
}

export function getInsightsOverviewGroupByLabel(groupBy) {
  if (groupBy == null || groupBy === "") {
    return i18n.t("insights.mailSubscription.overview");
  }
  const g = String(groupBy).toLowerCase();
  switch (g) {
    case INSIGHTS_OVERVIEW_GROUP_BY.BRAND:
      return i18n.t("insights.mailSubscription.brand");
    case INSIGHTS_OVERVIEW_GROUP_BY.CHANNEL:
      return i18n.t("insights.mailSubscription.channel");
    case INSIGHTS_OVERVIEW_GROUP_BY.EPI:
      return i18n.t("insights.mailSubscription.epi");
    case INSIGHTS_OVERVIEW_GROUP_BY.BRANDMATERIAL:
      return i18n.t("insights.mailSubscription.brandMaterial");
    case INSIGHTS_OVERVIEW_GROUP_BY.DAY:
      return i18n.t("insights.mailSubscription.day");
    case INSIGHTS_OVERVIEW_GROUP_BY.WEEK:
      return i18n.t("insights.mailSubscription.week");
    case INSIGHTS_OVERVIEW_GROUP_BY.MONTH:
      return i18n.t("insights.mailSubscription.month");
    case INSIGHTS_OVERVIEW_GROUP_BY.HOUR:
      return i18n.t("insights.mailSubscription.hour");
    default:
      return i18n.t("insights.mailSubscription.overview");
  }
}

export function insightsOverviewGroupByToMailGroupByPeriod(overviewGroupBy) {
  const g =
    overviewGroupBy == null || overviewGroupBy === ""
      ? null
      : String(overviewGroupBy).toLowerCase();

  if (g == null) {
    return MAIL_GROUP_BY_PERIOD_DAY;
  }
  switch (g) {
    case INSIGHTS_OVERVIEW_GROUP_BY.WEEK:
      return MAIL_GROUP_BY_PERIOD_WEEK;
    case INSIGHTS_OVERVIEW_GROUP_BY.MONTH:
      return MAIL_GROUP_BY_PERIOD_MONTH;
    case INSIGHTS_OVERVIEW_GROUP_BY.DAY:
    case INSIGHTS_OVERVIEW_GROUP_BY.HOUR:
      return MAIL_GROUP_BY_PERIOD_DAY;
    case INSIGHTS_OVERVIEW_GROUP_BY.BRAND:
    case INSIGHTS_OVERVIEW_GROUP_BY.CHANNEL:
    case INSIGHTS_OVERVIEW_GROUP_BY.BRANDMATERIAL:
    case INSIGHTS_OVERVIEW_GROUP_BY.EPI:
      return MAIL_GROUP_BY_PERIOD_DAY;
    default:
      return MAIL_GROUP_BY_PERIOD_DAY;
  }
}
