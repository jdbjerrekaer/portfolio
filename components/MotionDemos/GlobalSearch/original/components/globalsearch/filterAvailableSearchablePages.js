/**
 * Pathname-only availability for global search destinations.
 * Privilege filtering stays in the host; this only drops the current route and disabled pages.
 */

export const normalizePathname = (pathname = "") => {
  if (!pathname || typeof pathname !== "string") return "";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

/** Same active-route rule as BrandSidemenu / PartnerSidemenu. */
export const isActiveRoute = (pathname, route) => {
  const current = normalizePathname(pathname);
  const target = normalizePathname(route);
  if (!current || !target) return false;
  return current === target || current.startsWith(`${target}/`);
};

export const filterAvailableSearchablePages = (searchablePages = [], pathname = "") =>
  (Array.isArray(searchablePages) ? searchablePages : []).filter(
    (page) => page?.route && !page.disabled && !isActiveRoute(pathname, page.route)
  );
