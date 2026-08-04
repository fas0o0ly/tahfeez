import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => {
    const next = isAr ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('tahfeez-lang', next);
    document.documentElement.dir  = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return (
    <button
      onClick={toggle}
      className={`text-sm font-semibold tracking-wide transition-colors ${className}`}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {isAr ? 'EN' : 'عربي'}
    </button>
  );
}
