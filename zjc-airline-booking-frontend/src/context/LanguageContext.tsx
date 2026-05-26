"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "zh-CN" | "en-US";

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const normalizeLanguage = (value?: string | null): Language | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith("en")) return "en-US";
  if (lower.startsWith("zh")) return "zh-CN";
  return null;
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh-CN");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRaw = localStorage.getItem("zjc_language");
    const stored = normalizeLanguage(storedRaw);
    const fallback =
      navigator.language?.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
    const initial = stored ?? fallback;
    setLanguageState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLanguage = (lang: Language) => {
    const normalized = normalizeLanguage(lang) ?? "zh-CN";
    setLanguageState(normalized);
    if (typeof window !== "undefined") {
      localStorage.setItem("zjc_language", normalized);
      document.documentElement.lang = normalized;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "zh-CN" ? "en-US" : "zh-CN");
  };

  const value = useMemo(
    () => ({
      language,
      toggleLanguage,
      setLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}


