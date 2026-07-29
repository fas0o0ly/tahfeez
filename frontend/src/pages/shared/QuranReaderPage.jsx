// src/pages/shared/QuranReaderPage.jsx
import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DashboardLayout from '../../components/layout/DashboardLayout';
import NavigationBar from '../../components/quran/NavigationBar';
import VerseBlock from '../../components/quran/VerseBlock';
import AudioPlayer from '../../components/quran/AudioPlayer';
import BookmarkPanel from '../../components/quran/BookmarkPanel';
import SurahListPanel from '../../components/quran/SurahListPanel';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import { useQuranReader, useSurahs } from '../../hooks/useQuran';

const QuranReaderPage = () => {
  const {
    currentPage,
    pageData,
    loading,
    error,
    isFirstTime,
    bookmarks,
    bookmarkIds,
    goToPage,
    nextPage,
    prevPage,
    toggleBookmark,
    removeBookmark,
    notes,
    saveNote,
    deleteNote,
  } = useQuranReader();

  // Surah list — loaded once, shared between the surah panel and nav
  const { surahs, loading: surahsLoading } = useSurahs();

  // Display preferences
  const [showTranslation, setShowTranslation]         = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [translationLang, setTranslationLang]         = useState('en');

  // Audio state
  const [audioOpen, setAudioOpen]             = useState(false);
  const [playingVerseIdx, setPlayingVerseIdx] = useState(0);

  // Panel state
  const [bookmarkPanelOpen, setBookmarkPanelOpen]   = useState(false);
  const [surahPanelOpen, setSurahPanelOpen]         = useState(false);

  // Open surah panel automatically for first-time users once we know
  // isFirstTime is resolved (not null)
  const surahPanelVisible = surahPanelOpen || isFirstTime === true;

  const handlePlayVerse = useCallback((verse) => {
    const idx = pageData?.verses?.findIndex((v) => v.id === verse.id) ?? 0;
    setPlayingVerseIdx(idx);
    setAudioOpen(true);
  }, [pageData]);

  // Surah header rendered when a new surah starts on this page
  const renderSurahHeader = (surahNumber, surahData) => (
    <div key={`header-${surahNumber}`} className="text-center py-6 mb-2">
      <div className="inline-block bg-gradient-to-b from-forest-900 to-forest-800
                      rounded-2xl px-8 py-4 shadow-glow-green">
        <p
          className="text-gold-400 mb-1"
          style={{ fontFamily: 'Amiri Quran, Amiri, serif', fontSize: '1.8rem', direction: 'rtl' }}
        >
          {surahData.name_arabic}
        </p>
        <p className="text-forest-300 text-sm font-body">
          {surahData.name_english} · {surahData.name_transliteration}
        </p>
        <p className="text-forest-500 text-xs font-body mt-0.5 capitalize">
          {surahData.revelation_type} · {surahData.total_verses ?? ''} verses
        </p>
      </div>

      {/* Bismillah for every surah except At-Tawbah (9) and Al-Fatihah (1) */}
      {surahNumber !== 9 && surahNumber !== 1 && (
        <p
          className="text-forest-900 mt-5 text-center"
          style={{ fontFamily: 'Amiri Quran, Amiri, serif', fontSize: '1.8rem', direction: 'rtl' }}
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}
    </div>
  );

  // Group verses by surah so headers render at the right place
  const groupedVerses = () => {
    if (!pageData?.verses) return [];
    const groups = [];
    let lastSurahNum = null;

    for (const verse of pageData.verses) {
      if (verse.surah_number !== lastSurahNum) {
        lastSurahNum = verse.surah_number;
        const surahMeta = pageData.surahs?.find((s) => s.surah_number === verse.surah_number);
        groups.push({ type: 'header', surahNumber: verse.surah_number, surahMeta });
      }
      groups.push({ type: 'verse', verse, surahId: verse.surah_id });
    }
    return groups;
  };

  // isFirstTime === null means we're still checking the saved position
  if (isFirstTime === null) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p
              className="text-forest-700"
              style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem' }}
            >
              بِسْمِ اللَّهِ
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <div className="flex flex-col -mx-4 lg:-mx-6 -my-6 min-h-full">

        {/* Navigation bar */}
        <NavigationBar
          currentPage={currentPage}
          onGoToPage={goToPage}
          showTranslation={showTranslation}
          showTransliteration={showTransliteration}
          translationLang={translationLang}
          onToggleTranslation={() => setShowTranslation((v) => !v)}
          onToggleTransliteration={() => setShowTransliteration((v) => !v)}
          onChangeLang={setTranslationLang}
          onOpenBookmarks={() => setBookmarkPanelOpen(true)}
          onOpenSurahList={() => setSurahPanelOpen(true)}
          bookmarkCount={bookmarks.length}
        />

        {/* Content area */}
        <div className={`flex-1 overflow-y-auto bg-cream-50 ${audioOpen ? 'pb-28' : 'pb-6'}`}>

          {/* First-time welcome — shown until user picks a surah */}
          {isFirstTime && !loading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-forest-600 flex items-center
                              justify-center mb-5 shadow-glow-green">
                <span
                  style={{ fontFamily: 'Amiri, serif', color: '#d4af37', fontSize: '1.8rem' }}
                >
                  ق
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold text-forest-900 mb-2">
                Welcome to the Quran Reader
              </h2>
              <p className="text-gray-500 text-sm font-body max-w-xs leading-relaxed mb-6">
                Choose a surah to begin reading. Your position will be saved automatically.
              </p>
              <button
                onClick={() => setSurahPanelOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-forest-600 text-white
                           rounded-xl font-body text-sm hover:bg-forest-700 transition-colors
                           shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Browse Surahs
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p
                  className="text-forest-700"
                  style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem' }}
                >
                  بِسْمِ اللَّهِ
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex items-center justify-center py-32 px-4">
              <EmptyState
                icon="⚠️"
                title="Failed to load page"
                description={error}
                action={
                  <button
                    onClick={() => goToPage(currentPage)}
                    className="px-5 py-2.5 bg-forest-600 text-white text-sm rounded-xl
                               hover:bg-forest-700 transition-colors font-body"
                  >
                    Try again
                  </button>
                }
              />
            </div>
          )}

          {/* Page content */}
          {!loading && !error && pageData && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto px-4 py-6"
              >
                {groupedVerses().map((item) => {
                  if (item.type === 'header') {
                    return renderSurahHeader(item.surahNumber, item.surahMeta || {});
                  }

                  const globalIdx = pageData.verses.findIndex((v) => v.id === item.verse.id);

                  return (
                    <VerseBlock
                      key={item.verse.id}
                      verse={item.verse}
                      surahId={item.surahId}
                      showTranslation={showTranslation}
                      showTransliteration={showTransliteration}
                      translationLang={translationLang}
                      isBookmarked={bookmarkIds.has(item.verse.id)}
                      onBookmark={toggleBookmark}
                      isPlaying={audioOpen && playingVerseIdx === globalIdx}
                      onPlay={handlePlayVerse}
                      note={notes.get(item.verse.id)}
                      onSaveNote={saveNote}
                      onDeleteNote={deleteNote}
                    />
                  );
                })}

                {/* Page footer nav */}
                <div className="flex items-center justify-center gap-4 mt-10 pb-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
                               font-body text-gray-500 hover:bg-white hover:text-forest-700
                               border border-gray-200 hover:border-forest-200 transition-all
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  <span className="text-xs text-gray-400 font-body">
                    Page {currentPage} of 604
                  </span>

                  <button
                    onClick={nextPage}
                    disabled={currentPage >= 604}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm
                               font-body text-gray-500 hover:bg-white hover:text-forest-700
                               border border-gray-200 hover:border-forest-200 transition-all
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Audio player */}
      <AnimatePresence>
        {audioOpen && pageData?.verses && (
          <AudioPlayer
            verses={pageData.verses}
            currentVerseIndex={playingVerseIdx}
            onVerseChange={setPlayingVerseIdx}
            onClose={() => setAudioOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bookmark drawer */}
      <BookmarkPanel
        isOpen={bookmarkPanelOpen}
        onClose={() => setBookmarkPanelOpen(false)}
        bookmarks={bookmarks}
        onRemove={removeBookmark}
        onNavigate={goToPage}
      />

      {/* Surah list panel — slide in from right */}
      <SurahListPanel
        isOpen={surahPanelVisible}
        onClose={() => setSurahPanelOpen(false)}
        onSelectSurah={goToPage}
        surahs={surahs}
        loading={surahsLoading}
      />
    </DashboardLayout>
  );
};

export default QuranReaderPage;