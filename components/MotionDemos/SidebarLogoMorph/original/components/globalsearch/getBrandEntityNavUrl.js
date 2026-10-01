/**
 * Map global-search applicationStatus → Partnerships URL `status` filter.
 * Matches VALID_PARTNERSHIP_STATUS_FILTERS in brands Partnerships.
 */
export const mapApplicationStatusToPartnershipStatus = (status) => {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "APPLIED":
    case "WAITING":
    case "PENDING":
    case "INVITED":
      return "waiting";
    case "REJECTED":
      return "notApproved";
    default:
      return null;
  }
};

const buildPartnershipsUrl = (searchTitle, status) => {
  const params = new URLSearchParams();
  const q = typeof searchTitle === "string" ? searchTitle.trim() : "";
  if (q) params.set("search", q);
  const partnershipStatus = mapApplicationStatusToPartnershipStatus(status);
  if (partnershipStatus) params.set("status", partnershipStatus);
  const query = params.toString();
  return `/my-brand/partner-access/partnerships${query ? `?${query}` : ""}`;
};

/**
 * Brand-platform destination for a global-search channel/partner result.
 * NOT_APPLIED → Discover deep-link; otherwise → Partnerships with search + status.
 */
export const getBrandEntityNavUrl = (result) => {
  if (!result) return "/discover";

  const isNetworkOnly =
    !result.status || result.status === "NOT_APPLIED" || result.status === "NOT_APPLIED_API";

  if (result.type === "channel") {
    const channelId = result.affiliateSiteId || result.id;
    if (isNetworkOnly) {
      return channelId ? `/discover?channel=${encodeURIComponent(channelId)}` : "/discover";
    }
    return buildPartnershipsUrl(result.title || "", result.status);
  }

  if (result.type === "partner") {
    if (isNetworkOnly) {
      return result.id ? `/discover?partner=${encodeURIComponent(result.id)}` : "/discover";
    }
    return buildPartnershipsUrl(result.title || "", result.status);
  }

  return null;
};

export default getBrandEntityNavUrl;
