// Stand-in for @adtraction/shared-i18n: same t() contract, English only.
import en from "./en.json";

const interpolate = (s, vars) =>
  vars ? s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] ?? "")) : s;

export const i18n = {
  language: "en",
  isInitialized: true,
  getResourceBundle: () => en,
  t: (key, vars) => interpolate(en[key] ?? (vars && vars.defaultValue) ?? key, vars),
  on() {},
  off() {}
};
export default i18n;
