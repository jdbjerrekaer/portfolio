import { Icons } from "@adtraction/ui-icons";

/**
 * Conversion status constants
 */
export const CONVERSION_STATUS_APPROVED = "approved";
export const CONVERSION_STATUS_PENDING = "pending";
export const CONVERSION_STATUS_REJECTED = "rejected";
export const CONVERSION_STATUS_CLAIMS = "claims";

/** Payment stage constants */
export const PAYMENT_STAGE_CONFIRMED = "confirmed";
export const PAYMENT_STAGE_INVOICED = "invoiced";
export const PAYMENT_STAGE_PAYABLE = "payable";
export const PAYMENT_STAGE_PAID = "paid";

export const CONVERSION_PAYMENT_STAGES = [
  PAYMENT_STAGE_CONFIRMED,
  PAYMENT_STAGE_INVOICED,
  PAYMENT_STAGE_PAYABLE,
  PAYMENT_STAGE_PAID
];

export const VALID_PAYMENT_STAGES = new Set(CONVERSION_PAYMENT_STAGES);

/**
 * Default conversion status values
 */
export const DEFAULT_CONVERSION_STATUS = [CONVERSION_STATUS_APPROVED, CONVERSION_STATUS_PENDING];

/**
 * Conversion status filter options used across insights components
 * Represents the different states a conversion can be in
 */
export const CONVERSION_STATUS_OPTIONS = [
  {
    value: CONVERSION_STATUS_APPROVED,
    translationKey: "insights.statusOptions.approved",
    icon: <Icons.Communication.ConversionApproved />
  },
  {
    value: CONVERSION_STATUS_PENDING,
    translationKey: "insights.statusOptions.pending",
    icon: <Icons.Communication.ConversionPending />
  },
  {
    value: CONVERSION_STATUS_REJECTED,
    translationKey: "insights.statusOptions.notApproved",
    icon: <Icons.Communication.ConversionRejected />
  },
  {
    value: CONVERSION_STATUS_CLAIMS,
    translationKey: "insights.statusOptions.openClaims",
    icon: <Icons.Custom.BrandSearch />
  }
];
