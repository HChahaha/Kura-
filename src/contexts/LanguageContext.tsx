import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh-HK';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    "Kitchen Inventory": "Kitchen Inventory",
    "To-Buy List": "To-Buy List",
    "What I wanna cook": "What I wanna cook",
    "Give me an idea": "Give me an idea",
    "Scan Receipt": "Scan Receipt",
    "Upload from Albums": "Upload from Albums 🖼️",
    "Best past price": "💡 Best past price:",
    "Expiring Soon": "Expiring Soon",
    "Need to Clear": "Need to Clear"
  },
  'zh-HK': {
    "Kitchen Inventory": "廚房小糧倉",
    "To-Buy List": "買餸清單",
    "What I wanna cook": "今日想煮乜？",
    "Give me an idea": "零靈感？清庫存優先！",
    "Scan Receipt": "即場 Scan 單",
    "Upload from Albums": "從相簿上傳 🖼️",
    "Best past price": "💡 歷史最平價：",
    "Expiring Soon": "就快過期！",
    "Need to Clear": "急需清倉"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && (saved === 'en' || saved === 'zh-HK')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    // @ts-ignore
    const val = translations[language]?.[key] || translations['en']?.[key] || key;
    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
