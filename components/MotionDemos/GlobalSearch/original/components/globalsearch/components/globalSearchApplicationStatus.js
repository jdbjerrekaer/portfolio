import { i18n } from "@adtraction/shared-i18n";

// ChannelName / ChannelStatusIcon numeric statuses (AFFILIATESITE_ADVERTPROGRAM_STATUS).
// Inline literals so Jest CI does not need to parse util-constants ESM.
const STATUS = {
  NOT_APPLIED: -9,
  REJECTED: 0,
  APPROVED: 1,
  PENDING: 2
};

/**
 * Map API / discover applicationStatus values to ChannelName's numeric statuses.
 * ChannelName / ChannelStatusIcon: 1=Approved, 2=Pending, 0=Rejected.
 */
export const toChannelApplicationStatus = (applicationStatus) => {
  switch (applicationStatus) {
    case "APPROVED":
    case STATUS.APPROVED:
      return STATUS.APPROVED;
    case "APPLIED":
    case "WAITING":
    case "PENDING":
    case STATUS.PENDING:
      return STATUS.PENDING;
    case "REJECTED":
    case STATUS.REJECTED:
      return STATUS.REJECTED;
    default:
      return null;
  }
};

/**
 * Map API applicationStatus values to a localized badge label for global-search rows.
 */
export const getApplicationStatusLabel = (applicationStatus) => {
  switch (applicationStatus) {
    case "APPROVED":
    case STATUS.APPROVED:
      return i18n.t("platform.globalSearch.application.approved");
    case "APPLIED":
    case "WAITING":
    case "PENDING":
    case STATUS.PENDING:
      return i18n.t("platform.globalSearch.application.waiting");
    case "REJECTED":
    case STATUS.REJECTED:
      return i18n.t("platform.globalSearch.application.rejected");
    case "INVITED":
      return i18n.t("platform.globalSearch.application.invited");
    case "NOT_APPLIED":
    case STATUS.NOT_APPLIED:
      return i18n.t("platform.globalSearch.application.notApplied");
    default:
      return null;
  }
};

/**
 * Tone class for ApplicationStatus-style badges: approved | pending | rejected | invited.
 * NOT_APPLIED stays hidden (no tone).
 */
export const getApplicationStatusTone = (applicationStatus) => {
  if (applicationStatus === "INVITED") return "invited";

  switch (toChannelApplicationStatus(applicationStatus)) {
    case STATUS.APPROVED:
      return "approved";
    case STATUS.PENDING:
      return "pending";
    case STATUS.REJECTED:
      return "rejected";
    default:
      return null;
  }
};
