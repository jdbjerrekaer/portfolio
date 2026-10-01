/**
 * User privileges and permissions constants
 * @packageDocumentation
 */

/**
 * Client-related privileges
 */
export const CLIENT_PRIVILEGES = {
  /** Permission to view commissions */
  SHOW_COMMISSION: "showCommissions",
  /** Permission to view channel directory */
  SHOW_CHANNEL_DIRECTORY: "showChannelDirectory",
  /** Permission to view platform fee reports and API */
  SHOW_PLATFORM_FEE_REPORTS_AND_API: "showPlatformFeeReportsAndApi",
  /** Permission to view segment info for affiliates */
  SHOW_SEGMENT_INFO_AFFILIATES: "showSegmentInfoAffiliates",
  /** Permission to edit approved and rejected affiliates */
  EDIT_APPROVED_AND_REJECTED_AFFILIATES: "editApprovedAndRejectedAffiliates",
  /** Permission to edit Brand platform Channel Access */
  EDIT_CHANNEL_ACCESS: "editChannelAccess",
  /** Permission to edit coupon codes */
  EDIT_COUPON_CODES: "editCouponCodes",
  /** Permission to manage channels across all markets */
  ALLOW_MANAGE_CHANNELS_ALL_MARKETS: "allowManageChannelsAllMarkets",
  /** Permission to send invitations to affiliates */
  SEND_INVITATION_AFFILIATES: "sendInvitationAffiliates",
  /** Permission to edit the brand program description */
  ALLOW_EDIT_PROGRAM_DESCRIPTION: "allowEditOfProgramDescription",
  /** Permission to switch between parent and sub-advertiser accounts */
  SWITCH_PARENT_ADVERTISER_ACCOUNT: "switchParentAdvertiserAccount",
  /** Permission to update exchange cost list advertiser */
  UPDATE_EXCHANGECOST_LISTADVERTISER: "updateExchangeCostListAdvertiser"
} as const;

/**
 * Admin-related privileges
 */
export const ADMIN_PRIVILEGES = {
  /** Permission to view admin privileges UI */
  SHOW_ADMINS_PRIVILEGES_UI: "showAdminsPrivileges",
  /** Permission to view admin country privileges UI */
  SHOW_ADMINS_COUNTRY_PRIVILEGES_UI: "showAdminsCountryPrivileges",
  /** Permission to enable prepayments */
  ENABLE_PREPAYMENTS_PRIVILEGE: "enablePrepayments",
  /** Permission to change status of approved transaction report */
  CHANGE_STATUS_APPROVED_TRANSACTION_REPORT: "changeStatusApprovedTransactionReport",
  /** Permission to view all invoices */
  SHOW_INVOICE_ALL: "showInvoiceAll",
  /** Permission to update data feeds */
  UPDATE_DATA_FEEDS: "updateDataFeeds",
  /** Permission to edit program description */
  ALLOW_EDIT_PROGRAM_DESCRIPTION: "allowEditOfProgramDescription",
  /** Permission to view fraud scores */
  SEE_FRAUD_SCORES: "seeFraudScores",
  /** Permission to set channel under surveillance */
  SET_CHANNEL_TO_UNDER_SURVEILLANCE: "setChannelToUnderSurveillance",
  /** Permission to give money to partner */
  GIVE_MONEY_TO_PARTNER: "giveMoneyToPartner",
  /** Permission to manage invoices */
  MANAGE_INVOICES: "showViewInvoices",
  /** Permission to change adservice program status */
  ALLOW_ADSERVICE_PROGRAM_STATUS_CHANGE: "allowAdserviceProgramsStatusChange",
  /** Permission to show extra type icons in transaction report */
  SHOW_EXTRA_TYPE_ICONS_TRANSACTION_REPORT: "showExtraTypeIconsTransactionReport"
} as const;

/**
 * Partner-related privileges
 */
export const PARTNER_PRIVILEGES = {
  /** Permission to bulk upload claims */
  BULK_UPLOAD_CLAIMS: "bulkUploadClaims"
} as const;

/**
 * Sub-partner related privileges
 */
export const SUBPARTNER_PRIVILEGES = {
  /** Permission to use sub-affiliate links */
  ALLOW_SUB_AFFILIATE_LINKS: "allowSubAffiliateLinks",
  /** Permission to view sub-affiliate reports */
  ALLOW_SUB_AFFILIATE_REPORTS: "allowSubAffiliateReports",
  /** Permission to use sub-affiliate tools */
  ALLOW_SUB_AFFILIATE_TOOLS: "allowSubAffiliateTools",
  /** Permission to access sub-affiliate finance */
  ALLOW_SUB_AFFILIATE_FINANCE: "allowSubAffiliateFinance",
  /** Permission to use sub-affiliate API */
  ALLOW_SUB_AFFILIATE_API: "allowSubAffiliateAPI"
} as const;

/**
 * Type for all available privileges
 */
export type Privilege =
  | (typeof CLIENT_PRIVILEGES)[keyof typeof CLIENT_PRIVILEGES]
  | (typeof ADMIN_PRIVILEGES)[keyof typeof ADMIN_PRIVILEGES]
  | (typeof PARTNER_PRIVILEGES)[keyof typeof PARTNER_PRIVILEGES]
  | (typeof SUBPARTNER_PRIVILEGES)[keyof typeof SUBPARTNER_PRIVILEGES];
