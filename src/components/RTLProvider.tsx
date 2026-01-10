import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface RTLProviderProps {
  children: React.ReactNode;
}

const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar-EG' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language === 'ar-EG' ? 'ar' : 'en';

    // Add RTL-specific class for Tailwind
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.body.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
      document.body.classList.remove('rtl');
    }
  }, [i18n.language]);

  return <>{children}</>;
};

export default RTLProvider;
