// Stand-in for react-i18next: useTranslation(ns, { i18n }) -> { t, i18n } over the i18n shim.
import defaultI18n from "./i18n";

export const useTranslation = (_ns, opts) => {
  const i18n = opts?.i18n ?? defaultI18n;
  return { t: i18n.t, i18n };
};
