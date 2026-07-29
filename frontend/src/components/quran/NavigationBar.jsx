// src/components/quran/NavigationBar.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = ({
  currentPage,
  onGoToPage,
  showTranslation,
  showTransliteration,
  translationLang,
  onToggleTranslation,
  onToggleTransliteration,
  onChangeLang,
  onOpenBookmarks,
  onOpenSurahList,
  bookmarkCount,
  totalPages = 604,
}) => {
  const [showPageJump, setShowPageJump]   = useState(false);
  const [showJuzJump, setShowJuzJump]     = useState(false);
  const [jumpValue, setJumpValue]         = useState('');
  const [showSettings, setShowSettings]  = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePageJump = (e) => {
    e.preventDefault();
    const page = parseInt(jumpValue);
    if (page >= 1 && page <= 604) {
      onGoToPage(page);
      setShowPageJump(false);
      setJumpValue('');
    }
  };

  const handleJuzJump = (e) => {
    e.preventDefault();
    const juz = parseInt(jumpValue);
    // Approximate page start for each juz (standard Madina mushaf)
    const JUZ_PAGES = [1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
    if (juz >= 1 && juz <= 30) {
      onGoToPage(JUZ_PAGES[juz - 1]);
      setShowJuzJump(false);
      setJumpValue('');
    }
  };

  const baseRoute = user?.role === 'teacher' ? '/teacher' : '/student';

  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center
                    gap-2 flex-shrink-0 sticky top-0 z-30">

      {/* Back to surah list */}
      <button
        onClick={() => navigate(`${baseRoute}/quran`)}
        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-forest-700
                   transition-colors flex-shrink-0"
        title="Back to surah list"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Prev page */}
      <button
        onClick={() => onGoToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-forest-700
                   transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page indicator + jump */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowPageJump((v) => !v); setShowJuzJump(false); setJumpValue(''); }}
          className="px-3 py-1.5 rounded-xl bg-forest-50 text-forest-700 text-sm
                     font-medium font-body hover:bg-forest-100 transition-colors"
        >
          Page {currentPage} / {totalPages}
        </button>

        <AnimatePresence>
          {showPageJump && (
            <motion.form
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              onSubmit={handlePageJump}
              className="absolute top-full left-0 mt-2 bg-white rounded-xl
                         shadow-card-hover border border-gray-100 p-3 w-44 z-50"
            >
              <p className="text-xs text-gray-500 font-body mb-2">Go to page (1–604)</p>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={604}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  placeholder="e.g. 55"
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-forest-300 font-body"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-forest-600 text-white text-sm rounded-lg
                             hover:bg-forest-700 transition-colors font-body"
                >
                  Go
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Juz jump */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowJuzJump((v) => !v); setShowPageJump(false); setJumpValue(''); }}
          className="px-3 py-1.5 rounded-xl bg-cream-50 text-gray-600 text-sm
                     font-body hover:bg-cream-100 transition-colors border border-cream-200"
        >
          Juz
        </button>

        <AnimatePresence>
          {showJuzJump && (
            <motion.form
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              onSubmit={handleJuzJump}
              className="absolute top-full left-0 mt-2 bg-white rounded-xl
                         shadow-card-hover border border-gray-100 p-3 w-44 z-50"
            >
              <p className="text-xs text-gray-500 font-body mb-2">Go to juz (1–30)</p>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={30}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  placeholder="e.g. 5"
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-forest-300 font-body"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-forest-600 text-white text-sm rounded-lg
                             hover:bg-forest-700 transition-colors font-body"
                >
                  Go
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      {/* Right-side controls */}
      <div className="flex items-center gap-1">

        {/* Settings panel — translation/transliteration toggles */}
        <div className="relative">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`p-2 rounded-xl transition-colors
              ${showSettings ? 'bg-forest-50 text-forest-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Display settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                className="absolute top-full right-0 mt-2 bg-white rounded-xl
                           shadow-card-hover border border-gray-100 p-4 w-64 z-50"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide
                               font-body mb-3">
                  Display
                </p>

                {/* Translation toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-700 font-body">Translation</span>
                  <button
                    onClick={onToggleTranslation}
                    className={`w-10 h-5 rounded-full transition-colors duration-200 relative
                      ${showTranslation ? 'bg-forest-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                     transition-transform duration-200
                                     ${showTranslation ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Language selector */}
                {showTranslation && (
                  <div className="flex gap-2 mb-3 ml-0">
                    {[['en', 'English'], ['ms', 'Malay']].map(([lang, label]) => (
                      <button
                        key={lang}
                        onClick={() => onChangeLang(lang)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-body transition-colors
                          ${translationLang === lang
                            ? 'bg-forest-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Transliteration toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 font-body">Transliteration</span>
                  <button
                    onClick={onToggleTransliteration}
                    className={`w-10 h-5 rounded-full transition-colors duration-200 relative
                      ${showTransliteration ? 'bg-forest-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                     transition-transform duration-200
                                     ${showTransliteration ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Surah list */}
        <button
          onClick={onOpenSurahList}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100
                     hover:text-forest-600 transition-colors"
          title="Browse surahs"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>

                {/* Bookmarks */}
        <button
          onClick={onOpenBookmarks}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100
                     hover:text-gold-500 transition-colors"
          title="My bookmarks"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {bookmarkCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold-500 text-white
                             text-xs rounded-full flex items-center justify-center font-body
                             font-semibold">
              {bookmarkCount > 9 ? '9+' : bookmarkCount}
            </span>
          )}
        </button>
      </div>

      {/* Next page */}
      <button
        onClick={() => onGoToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-forest-700
                   transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default NavigationBar;