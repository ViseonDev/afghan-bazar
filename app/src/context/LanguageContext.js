import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18n } from 'i18n-js';

// Import translations
import en from '../locales/en.json';
import fa from '../locales/fa.json';
import ps from '../locales/ps.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Configure i18n
const i18n = new I18n({
  en,
  fa,
  ps,
});

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    i18n.locale = currentLanguage;
    setIsRTL(currentLanguage === 'fa' || currentLanguage === 'ps');
  }, [currentLanguage]);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && ['en', 'fa', 'ps'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (language) => {
    try {
      if (!['en', 'fa', 'ps'].includes(language)) {
        throw new Error('Invalid language code');
      }

      await AsyncStorage.setItem('language', language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const t = (key, options = {}) => {
    return i18n.t(key, options);
  };

  const getLanguageName = (code) => {
    const names = {
      en: 'English',
      fa: 'فارسی',
      ps: 'پښتو',
    };
    return names[code] || code;
  };

  const getSupportedLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fa', name: 'Dari', nativeName: 'دری' },
      { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
    ];
  };

  const formatNumber = (number) => {
    // Format numbers based on language
    if (currentLanguage === 'fa' || currentLanguage === 'ps') {
      // Convert to Persian/Arabic numerals if needed
      return number.toLocaleString('fa-IR');
    }
    return number.toLocaleString('en-US');
  };

  const formatCurrency = (amount, currency = 'AFN') => {
    const formattedAmount = formatNumber(amount);

    if (currency === 'AFN') {
      return `${formattedAmount} ${t('currency.afn')}`;
    } else if (currency === 'USD') {
      return `$${formattedAmount}`;
    } else if (currency === 'EUR') {
      return `€${formattedAmount}`;
    }

    return `${formattedAmount} ${currency}`;
  };

  const formatDate = (date, format = 'short') => {
    const dateObj = new Date(date);

    if (format === 'short') {
      return dateObj.toLocaleDateString(
        currentLanguage === 'en' ? 'en-US' : 'fa-IR',
      );
    } else if (format === 'long') {
      return dateObj.toLocaleDateString(
        currentLanguage === 'en' ? 'en-US' : 'fa-IR',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );
    }

    return dateObj.toLocaleDateString();
  };

  const value = {
    currentLanguage,
    isRTL,
    changeLanguage,
    t,
    getLanguageName,
    getSupportedLanguages,
    formatNumber,
    formatCurrency,
    formatDate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
