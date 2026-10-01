export const DARK_MODE_STORAGE_KEY = "adtraction-allow-dark-mode";
export const THEME_PREFERENCES = {
  OFF: "off",
  AUTO: "auto",
  ON: "on"
};

const THEME_ATTRIBUTE = "data-theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

export const getThemePreference = () => {
  try {
    const preference = localStorage.getItem(DARK_MODE_STORAGE_KEY);

    if (preference === "true") {
      return THEME_PREFERENCES.AUTO;
    }

    if (preference === THEME_PREFERENCES.AUTO || preference === THEME_PREFERENCES.ON) {
      return preference;
    }

    // portfolio edit: default to Auto (was Off) so mounting the menu doesn't force the case study light.
    return THEME_PREFERENCES.AUTO;
  } catch {
    return THEME_PREFERENCES.AUTO;
  }
};

export const applyThemePreference = (themePreference = getThemePreference()) => {
  if (typeof document === "undefined") {
    return;
  }

  const rootElement = document.documentElement;

  if (themePreference === THEME_PREFERENCES.ON) {
    rootElement.setAttribute(THEME_ATTRIBUTE, DARK_THEME);
    return;
  }

  if (themePreference === THEME_PREFERENCES.AUTO) {
    rootElement.removeAttribute(THEME_ATTRIBUTE);
    return;
  }

  rootElement.setAttribute(THEME_ATTRIBUTE, LIGHT_THEME);
};

export const saveThemePreference = (themePreference) => {
  localStorage.setItem(DARK_MODE_STORAGE_KEY, themePreference);
  applyThemePreference(themePreference);
};
