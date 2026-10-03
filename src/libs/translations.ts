import de from "../i18n/de.json";
import en from "../i18n/en.json";
import { DEFAULT_LANGUAGE, type Language } from "./language";

const TRANSLATIONS = { de, en };

type Ui = typeof en.ui;

export function getTranslations(language: Language) {
  const translations = TRANSLATIONS[language];

  return {
    title: translations.title,
    ui: (key: keyof Ui) =>
      translations.ui[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE].ui[key],
  };
}
