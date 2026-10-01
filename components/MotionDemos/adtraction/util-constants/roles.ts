/**
 * User role constants used throughout the application
 * @packageDocumentation
 */

/**
 * Available user roles in the system
 */
export type UserRole =
  | "AffiliateUser"
  | "SubAffiliateUser"
  | "AdvertiserUser"
  | "SubAdvertiserUser"
  | "AdminUser"
  | "AgencyUser"
  | "SubAgencyUser";

/** Affiliate user role */
export const AFFILIATE_ROLE: UserRole = "AffiliateUser";

/** Sub-affiliate user role */
export const SUBAFFILIATE_ROLE: UserRole = "SubAffiliateUser";

/** Advertiser user role */
export const ADVERTISER_ROLE: UserRole = "AdvertiserUser";

/** Sub-advertiser user role */
export const SUBADVERTISER_ROLE: UserRole = "SubAdvertiserUser";

/** Admin user role */
export const ADMIN_ROLE: UserRole = "AdminUser";

/** Agency user role */
export const AGENCY_ROLE: UserRole = "AgencyUser";

/** Sub-agency user role */
export const SUBAGENCY_ROLE: UserRole = "SubAgencyUser";

/**
 * Array of all available user roles
 */
export const ALL_USER_ROLES: UserRole[] = [
  AFFILIATE_ROLE,
  SUBAFFILIATE_ROLE,
  ADVERTISER_ROLE,
  SUBADVERTISER_ROLE,
  ADMIN_ROLE,
  AGENCY_ROLE,
  SUBAGENCY_ROLE
];
