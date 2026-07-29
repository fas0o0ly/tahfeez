// src/components/quran/SurahListPanel.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Accurate Madina Mushaf page numbers (604-page edition) — used as fallback
// when page_start is not yet populated in the DB. Index = surah_number - 1.
const MUSHAF_PAGE_MAP = [
  1,2,50,77,106,128,151,177,187,208,
  221,235,249,255,267,282,293,304,312,318,
  322,325,332,337,341,343,347,350,352,355,
  358,362,364,366,368,369,372,374,376,378,
  380,382,385,387,388,390,392,394,396,398,
  400,402,403,404,405,406,407,408,409,410,
  411,411,412,413,414,415,416,417,417,418,
  419,420,421,421,422,422,423,424,424,425,
  425,426,426,427,427,428,428,429,429,430,
  430,431,431,431,432,432,433,433,433,434,
  434,434,435,435,435,436,436,436,437,437,
  437,437,438,438,
];

const REVELATION_COLORS = {
  meccan:  'bg-amber-50 text-amber-700 border border-amber-200',
  medinan: 'bg-blue-50 text-blue-700 border border-blue-200',
};

// Accepts surahs list from parent (already loaded by useSurahs in the reader hook)
const SurahListPanel = ({ isOpen, onClose, onSelectSurah, surahs = [], loading }) => {
  const [search, setSearch]         = useState('');
  const [revelation, setRevelation] = useState('');

  const filtered = surahs.filter((s) => {
    const matchesSearch = !search || [
      s.name_english,
      s.name_transliteration,
      s.name_arabic,
      String(s.surah_number),
    ].some((v) => v?.toLowerCase().includes(search.toLowerCase()));

    const matchesRevelation = !revelation || s.revelation_type === revelation;
    return matchesSearch && matchesRevelation;
  });

  const handleSelect = (surah) => {
    // Prefer page_start from DB (populated by seed). Fall back to the accurate
    // Madina Mushaf map for any surahs where page_start is still null.
    const page = surah.page_start
      || MUSHAF_PAGE_MAP[surah.surah_number - 1]
      || 1;
    onSelectSurah(page);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-obsidian-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm z-50
                       bg-white flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-display font-semibold text-forest-900 text-lg">
                  Surahs
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  Select a surah to navigate
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search + filter */}
            <div className="px-4 pt-3 pb-2 border-b border-gray-50 flex-shrink-0 space-y-2">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search surah…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200
                             text-sm font-body text-gray-800 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-forest-300
                             focus:border-forest-400 transition-all"
                />
              </div>

              <div className="flex gap-1.5">
                {[['', 'All'], ['meccan', 'Meccan'], ['medinan', 'Medinan']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setRevelation(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-body transition-colors
                      ${revelation === val
                        ? 'bg-forest-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Surah list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <svg className="animate-spin w-6 h-6 text-forest-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <p className="font-display font-semibold text-forest-900 mb-1">
                    No surahs found
                  </p>
                  <p className="text-sm text-gray-400 font-body">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {filtered.map((surah) => (
                    <li key={surah.id}>
                      <button
                        onClick={() => handleSelect(surah)}
                        className="w-full flex items-center gap-3 px-4 py-3
                                   hover:bg-forest-50 transition-colors duration-150 text-left group"
                      >
                        {/* Number badge */}
                        <div className="relative w-9 h-9 flex-shrink-0">
                          <div
                            className="absolute inset-0 bg-forest-100 group-hover:bg-forest-200
                                       transition-colors"
                            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center
                                           text-xs font-semibold text-forest-700 font-body">
                            {surah.surah_number}
                          </span>
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-medium text-forest-900 font-body truncate">
                              {surah.name_english}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0
                                             ${REVELATION_COLORS[surah.revelation_type]}`}>
                              {surah.revelation_type === 'meccan' ? 'M' : 'Md'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-body">
                            {surah.name_transliteration} · {surah.total_verses} verses
                          </p>
                        </div>

                        {/* Arabic name */}
                        <p
                          className="text-forest-800 flex-shrink-0 group-hover:text-forest-600
                                     transition-colors"
                          style={{
                            fontFamily: 'Amiri Quran, Amiri, serif',
                            fontSize: '1.1rem',
                            direction: 'rtl',
                          }}
                        >
                          {surah.name_arabic}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SurahListPanel;