// src/pages/shared/QuranPage.jsx
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SurahCard from '../../components/quran/SurahCard';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import { useSurahs } from '../../hooks/useQuran';

const REVELATION_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Meccan', value: 'meccan' },
  { label: 'Medinan', value: 'medinan' },
];

const QuranPage = () => {
  const [search, setSearch]         = useState('');
  const [revelation, setRevelation] = useState('');
  const [juzFilter, setJuzFilter]   = useState('');

  const { surahs, loading, error, reload } = useSurahs();

  // Client-side filtering — all 114 surahs are already in memory
  const filtered = surahs.filter((s) => {
    const matchesSearch = !search || [
      s.name_english,
      s.name_transliteration,
      s.name_arabic,
    ].some((v) => v?.toLowerCase().includes(search.toLowerCase()));

    const matchesRevelation = !revelation || s.revelation_type === revelation;
    const matchesJuz = !juzFilter || s.juz_number === parseInt(juzFilter);

    return matchesSearch && matchesRevelation && matchesJuz;
  });

  return (
    <DashboardLayout title="Quran">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-forest-600 flex items-center justify-center flex-shrink-0">
            <span
              style={{ fontFamily: 'Amiri, serif', color: '#d4af37', fontSize: '1.2rem' }}
            >
              ق
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-forest-900">
              Al-Quran Al-Karim
            </h1>
            <p className="text-sm text-gray-400 font-body">
              114 Surahs · 6,236 Verses · 30 Juz
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or transliteration…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm
                         font-body text-gray-800 placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-forest-300 focus:border-forest-400
                         transition-all"
            />
          </div>

          {/* Revelation type filter */}
          <div className="flex gap-1.5">
            {REVELATION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRevelation(f.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-body transition-colors
                  ${revelation === f.value
                    ? 'bg-forest-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Juz filter */}
          <select
            value={juzFilter}
            onChange={(e) => setJuzFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-body
                       text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-300
                       bg-white cursor-pointer"
          >
            <option value="">All Juz</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
              <option key={j} value={j}>Juz {j}</option>
            ))}
          </select>
        </div>

        {/* Active filter summary */}
        {(search || revelation || juzFilter) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-500 font-body">
              Showing <span className="font-semibold text-forest-700">{filtered.length}</span> of 114 surahs
            </p>
            <button
              onClick={() => { setSearch(''); setRevelation(''); setJuzFilter(''); }}
              className="text-xs text-forest-600 hover:text-forest-800 font-body font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Surah list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Failed to load surahs"
          description={error}
          action={
            <button
              onClick={() => reload()}
              className="px-5 py-2.5 bg-forest-600 text-white text-sm rounded-xl
                         hover:bg-forest-700 transition-colors font-body"
            >
              Try again
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No surahs found"
          description="Try adjusting your search or filters."
          action={
            <button
              onClick={() => { setSearch(''); setRevelation(''); setJuzFilter(''); }}
              className="px-5 py-2.5 bg-forest-600 text-white text-sm rounded-xl
                         hover:bg-forest-700 transition-colors font-body"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2"
        >
          {filtered.map((surah, index) => (
            <SurahCard key={surah.id} surah={surah} index={index} />
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default QuranPage;