// portfolio stand-in: the real file awaits initializeI18n with these strings; the portfolio's
// i18n shim is synchronous, so the insights strings are merged into it up front.
import en from "./translations/locale/en.json";
import shimStrings from "../../../adtraction/shims/en.json";

Object.assign(shimStrings, en);

export const i18nReady = Promise.resolve();
