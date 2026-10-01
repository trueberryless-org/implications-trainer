export const LANGUAGES = { de: "Deutsch", en: "English" } as const;

export type Language = keyof typeof LANGUAGES;

export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && Object.hasOwn(LANGUAGES, value);
}

export function getLanguageFromPathname(pathname: string) {
  const [, language] = pathname.split("/");

  return isLanguage(language) ? language : DEFAULT_LANGUAGE;
}
