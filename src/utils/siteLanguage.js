import { useCallback, useEffect, useState } from "react";
import { languageModes } from "./i18n";

const siteLanguageStorageKey = "gigshieldLanguageMode";
const siteLanguageChangedEvent = "gigshield:language-changed";

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

export function useSiteLanguage() {
  const [languageMode, setLanguageMode] = useState(getStoredLanguageMode);

  const setGlobalLanguageMode = useCallback((nextMode) => {
    setLanguageMode((previousMode) => {
      const resolvedMode =
        typeof nextMode === "function" ? nextMode(previousMode) : nextMode;
      const normalizedMode = sanitizeLanguageMode(resolvedMode);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(siteLanguageStorageKey, normalizedMode);
        window.dispatchEvent(
          new CustomEvent(siteLanguageChangedEvent, { detail: normalizedMode }),
        );
      }

      return normalizedMode;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncFromStorage = () => {
      setLanguageMode(getStoredLanguageMode());
    };

    const handleCustomLanguageChange = (event) => {
      const nextMode = sanitizeLanguageMode(event?.detail);
      setLanguageMode(nextMode);
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(
      siteLanguageChangedEvent,
      handleCustomLanguageChange,
    );

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(
        siteLanguageChangedEvent,
        handleCustomLanguageChange,
      );
    };
  }, []);

  return { languageMode, setLanguageMode: setGlobalLanguageMode };
}
