// src/components/quran/AudioPlayer.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RECITERS = [
  { key: 'mishary', label: 'Mishary Rashid', arabicName: 'مشاري راشد' },
  { key: 'sudais',  label: 'Abdul Rahman Al-Sudais', arabicName: 'عبدالرحمن السديس' },
];

const AudioPlayer = ({ verses, currentVerseIndex, onVerseChange, onClose }) => {
  const [reciter, setReciter]         = useState('mishary');
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [continuous, setContinuous]   = useState(true);
  const [progress, setProgress]       = useState(0);
  const [duration, setDuration]       = useState(0);
  const [showReciter, setShowReciter] = useState(false);

  const audioRef = useRef(null);
  const activeIndex = useRef(currentVerseIndex);

  const currentVerse = verses?.[activeIndex.current];
  const audioUrl = currentVerse?.audio?.[reciter];

  const loadAndPlay = useCallback((index) => {
    if (!verses?.[index]) return;
    activeIndex.current = index;
    onVerseChange?.(index);

    const verse = verses[index];
    const url = verse.audio?.[reciter];
    if (!url || !audioRef.current) return;

    audioRef.current.src = url;
    audioRef.current.load();
    setIsLoading(true);
    setProgress(0);

    audioRef.current.play().catch(() => setIsPlaying(false));
  }, [verses, reciter, onVerseChange]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioRef.current.src) {
        loadAndPlay(activeIndex.current);
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleNext = () => {
    const nextIdx = activeIndex.current + 1;
    if (nextIdx < verses.length) loadAndPlay(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = activeIndex.current - 1;
    if (prevIdx >= 0) loadAndPlay(prevIdx);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  // Sync playing state when verse changes externally
  useEffect(() => {
    if (currentVerseIndex !== activeIndex.current) {
      loadAndPlay(currentVerseIndex);
    }
  }, [currentVerseIndex, loadAndPlay]);

  // Wire up audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay        = () => { setIsPlaying(true); setIsLoading(false); };
    const onPause       = () => setIsPlaying(false);
    const onWaiting     = () => setIsLoading(true);
    const onCanPlay     = () => setIsLoading(false);
    const onTimeUpdate  = () => setProgress(audio.currentTime);
    const onDuration    = () => setDuration(audio.duration || 0);
    const onEnded       = () => {
      if (continuous && activeIndex.current + 1 < verses.length) {
        loadAndPlay(activeIndex.current + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play',       onPlay);
    audio.addEventListener('pause',      onPause);
    audio.addEventListener('waiting',    onWaiting);
    audio.addEventListener('canplay',    onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended',      onEnded);

    return () => {
      audio.removeEventListener('play',       onPlay);
      audio.removeEventListener('pause',      onPause);
      audio.removeEventListener('waiting',    onWaiting);
      audio.removeEventListener('canplay',    onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended',      onEnded);
    };
  }, [continuous, verses, loadAndPlay]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPct = duration ? (progress / duration) * 100 : 0;
  const displayVerse = verses?.[activeIndex.current];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:left-64"
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* Reciter picker dropdown */}
      <AnimatePresence>
        {showReciter && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-0 right-0 mb-2 mx-4"
          >
            <div className="bg-white rounded-2xl shadow-card-hover border border-gray-100 p-2 max-w-xs mx-auto">
              {RECITERS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => { setReciter(r.key); setShowReciter(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl
                               text-sm transition-colors duration-150
                               ${reciter === r.key
                                 ? 'bg-forest-600 text-white'
                                 : 'text-gray-700 hover:bg-forest-50'
                               }`}
                >
                  <span className="font-body">{r.label}</span>
                  <span style={{ fontFamily: 'Amiri, serif', fontSize: '0.9rem' }}>
                    {r.arabicName}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player bar */}
      <div className="bg-white border-t border-gray-100 shadow-lg px-4 pb-4 pt-2">
        {/* Progress bar */}
        <div
          className="h-1 bg-gray-100 rounded-full mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-forest-600 rounded-full transition-all duration-100"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Verse info */}
          <div className="flex-1 min-w-0">
            {displayVerse ? (
              <>
                <p
                  className="text-forest-900 text-sm leading-tight truncate"
                  style={{ fontFamily: 'Amiri Quran, Amiri, serif', direction: 'rtl', textAlign: 'right' }}
                >
                  {displayVerse.arabic_text?.slice(0, 60)}…
                </p>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {displayVerse.name_english} · Verse {displayVerse.verse_number}
                  <span className="mx-1.5 text-gray-300">·</span>
                  {formatTime(progress)} / {formatTime(duration)}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 font-body">No verse selected</p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Continuous toggle */}
            <button
              onClick={() => setContinuous((v) => !v)}
              title={continuous ? 'Continuous on' : 'Continuous off'}
              className={`p-2 rounded-lg text-xs transition-colors duration-150
                ${continuous ? 'text-forest-600 bg-forest-50' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Prev */}
            <button
              onClick={handlePrev}
              disabled={activeIndex.current === 0}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                         transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-forest-600 text-white
                         flex items-center justify-center hover:bg-forest-700
                         transition-colors shadow-sm"
            >
              {isLoading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!verses || activeIndex.current >= verses.length - 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                         transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Reciter selector */}
            <button
              onClick={() => setShowReciter((v) => !v)}
              className={`p-2 rounded-lg transition-colors duration-150
                ${showReciter ? 'bg-forest-50 text-forest-600' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Change reciter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600
                         transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;