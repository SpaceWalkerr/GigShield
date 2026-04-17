import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { languageModes } from "./i18n";

const siteLanguageStorageKey = "gigshieldLanguageMode";

function sanitizeLanguageMode(value) {
  if (
    value === languageModes.ENGLISH ||
    value === languageModes.HINDI ||
    value === languageModes.HINGLISH
  ) {
    return value;
  }
  return languageModes.ENGLISH;
}

export function getStoredLanguageMode() {
  if (typeof window === "undefined") {
    return languageModes.ENGLISH;
  }
  const stored = window.localStorage.getItem(siteLanguageStorageKey);
  return sanitizeLanguageMode(stored);
}

// ─── Context ────────────────────────────────────────────────────────────────
export const SiteLanguageContext = createContext(null);

export function SiteLanguageProvider({ children }) {
  const [languageMode, setLanguageModeRaw] = useState(getStoredLanguageMode);

  const setLanguageMode = useCallback((nextMode) => {
    setLanguageModeRaw((prev) => {
      const resolved = typeof nextMode === "function" ? nextMode(prev) : nextMode;
      const normalized = sanitizeLanguageMode(resolved);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(siteLanguageStorageKey, normalized);
      }
      return normalized;
    });
  }, []);

  // Keep in sync when another tab changes localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === siteLanguageStorageKey) {
        setLanguageModeRaw(sanitizeLanguageMode(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ languageMode, setLanguageMode }),
    [languageMode, setLanguageMode],
  );

  return (
    <SiteLanguageContext.Provider value={value}>
      {children}
    </SiteLanguageContext.Provider>
  );
}

export function useSiteLanguage() {
  const ctx = useContext(SiteLanguageContext);
  if (!ctx) {
    throw new Error("useSiteLanguage must be used inside <SiteLanguageProvider>");
  }
  return ctx;
}

