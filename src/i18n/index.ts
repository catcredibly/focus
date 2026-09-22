import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en";
import zhCN from "./zh-CN";
import type { Locale } from "../settings";

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, "zh-CN": { translation: zhCN } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export const localeCode = (language = i18n.resolvedLanguage): Locale => language === "zh-CN" ? "zh-CN" : "en";

export default i18n;
