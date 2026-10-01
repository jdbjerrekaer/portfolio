export const PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY = "adtraction-partner-sidemenu-collapsed";

export const getPartnerSidemenuUserCollapsed = () => {
  try {
    return localStorage.getItem(PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setPartnerSidemenuUserCollapsed = (collapsed) => {
  try {
    if (collapsed) {
      localStorage.setItem(PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(PARTNER_SIDEMENU_COLLAPSED_STORAGE_KEY);
    }
  } catch {}
};

export const isViewportCompactDesktop = () => {
  if (typeof window === "undefined") return false;
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  const compact = window.matchMedia("(max-width: 980px)").matches;
  return compact && !mobile;
};

export const isPartnerSidemenuCollapsedDesktop = () => {
  return isViewportCompactDesktop() || getPartnerSidemenuUserCollapsed();
};

export const syncPartnerSidemenuCollapsedAttribute = (userCollapsed) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (userCollapsed && !isViewportCompactDesktop()) {
    root.setAttribute("data-partner-sidemenu-collapsed", "true");
  } else {
    root.removeAttribute("data-partner-sidemenu-collapsed");
  }
};
