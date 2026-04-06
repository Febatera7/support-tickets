import { useState, useRef, useEffect } from "react";
import { useLanguage } from "#src/context/LanguageContext";
import type { Language } from "#src/types";
import "#src/components/ui/LanguageSelector.css";

const FLAGS: Record<Language, string> = {
  pt: "🇧🇷",
  es: "🇪🇸",
  en: "🇬🇧"
};

const LANG_LABELS: Record<Language, string> = {
  pt: "Português",
  es: "Español",
  en: "English"
};

const LANGS: Language[] = ["pt", "es", "en"];

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`lang-selector ${compact ? "compact" : ""}`} ref={ref}>
      <button
        className="lang-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
      >
        <span className="flag">{FLAGS[lang]}</span>
        {!compact && <span className="lang-label">{LANG_LABELS[lang]}</span>}
        <span className="chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGS.map((l) => (
            <button
              key={l}
              className={`lang-option ${l === lang ? "active" : ""}`}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
            >
              <span className="flag">{FLAGS[l]}</span>
              <span>{LANG_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
