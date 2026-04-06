import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";

import type { Language } from "#src/types";
import pt from "#src/translates/locales/pt.json";
import en from "#src/translates/locales/en.json";
import es from "#src/translates/locales/es.json";

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;

const LOCALES: Record<Language, Translations> = { pt, en, es };
const STORAGE_KEY = "support_tickets_lang";
const DEFAULT_LANG: Language = "pt";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored && stored in LOCALES ? stored : DEFAULT_LANG;
  });

  const setLang = (newLang: Language) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLangState(newLang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = LOCALES[lang] as unknown;
    for (const k of keys) {
      if (typeof value === "object" && value !== null && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function resetLang(): void {
  localStorage.removeItem(STORAGE_KEY);
}
