import { defaultLang, ui } from "./ui";

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: string): string {
    const parts = key.split(".");
    let value: any = ui[lang];

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        // fallback auf defaultLang
        value = ui[defaultLang];
        for (const p of parts) {
          if (value && typeof value === "object" && p in value) {
            value = value[p];
          } else {
            return key; // fallback auf key selbst
          }
        }
        break;
      }
    }

    if (typeof value === "string") {
      return value;
    }

    return key; // fallback wenn kein String gefunden wurde
  };
}
