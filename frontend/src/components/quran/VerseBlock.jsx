// src/components/quran/VerseBlock.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VerseBlock = ({
  verse,
  surahId,
  showTranslation,
  showTransliteration,
  translationLang,  // 'en' | 'ms'
  isBookmarked,
  onBookmark,
  isPlaying,
  onPlay,
  note,          // { content, updated_at } | undefined
  onSaveNote,    // (verseId, content) => void
  onDeleteNote,  // (verseId) => void
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [noteOpen, setNoteOpen]       = useState(false);
  const [draft, setDraft]             = useState('');
  const textareaRef                   = useRef(null);

  const translation = translationLang === 'ms'
    ? verse.translation_ms
    : verse.translation_en;

  const hasNote = Boolean(note?.content);

  // Sync draft when the panel opens or the saved note changes
  useEffect(() => {
    if (noteOpen) {
      setDraft(note?.content ?? '');
      // Auto-focus the textarea after animation
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [noteOpen, note?.content]);

  const handleSave = () => {
    if (draft.trim()) {
      onSaveNote(verse.id, draft);
    }
    setNoteOpen(false);
  };

  const handleDelete = () => {
    onDeleteNote(verse.id);
    setDraft('');
    setNoteOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
    if (e.key === 'Escape') setNoteOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative py-5 px-1 border-b border-gray-100 last:border-0
        ${isPlaying ? 'bg-forest-50/60 rounded-xl px-3' : ''}
        transition-colors duration-300
      `}
    >
      {/* Verse number + action strip */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Verse number badge — amber dot when a note exists */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <div
              className="absolute inset-0 bg-forest-600"
              style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
            />
            <span className="absolute inset-0 flex items-center justify-center
                             text-white text-xs font-semibold font-body">
              {verse.verse_number}
            </span>
            {hasNote && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full
                               bg-amber-400 border-2 border-white" />
            )}
          </div>

          {verse.juz_number && (
            <span className="text-xs text-gray-400 font-body">
              Juz {verse.juz_number}
            </span>
          )}
        </div>

        {/* Actions — visible on hover or when active */}
        <div className={`flex items-center gap-1 transition-opacity duration-200
                         ${showOptions || noteOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

          {/* Play button */}
          <button
            onClick={() => onPlay(verse)}
            title="Play recitation"
            className={`p-1.5 rounded-lg transition-colors duration-150
              ${isPlaying
                ? 'bg-forest-600 text-white'
                : 'text-gray-400 hover:text-forest-600 hover:bg-forest-50'
              }`}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Note button */}
          <button
            onClick={() => setNoteOpen((v) => !v)}
            title={hasNote ? 'Edit note' : 'Add note'}
            className={`p-1.5 rounded-lg transition-colors duration-150
              ${noteOpen
                ? 'bg-amber-100 text-amber-600'
                : hasNote
                  ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Bookmark button */}
          <button
            onClick={() => onBookmark(verse, surahId)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
            className={`p-1.5 rounded-lg transition-colors duration-150
              ${isBookmarked
                ? 'text-gold-500 hover:text-gold-600'
                : 'text-gray-400 hover:text-gold-500 hover:bg-gold-50'
              }`}
          >
            <svg
              className="w-4 h-4"
              fill={isBookmarked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Arabic text */}
      <p
        className="text-right leading-loose text-forest-900 mb-4 select-text"
        style={{
          fontFamily: 'Amiri Quran, Amiri, serif',
          fontSize: '1.65rem',
          direction: 'rtl',
          lineHeight: '3rem',
        }}
      >
        {verse.arabic_text}
        <span
          className="inline-block mx-2 text-gold-500"
          style={{ fontFamily: 'Amiri Quran, Amiri, serif' }}
        >
          ﴿{verse.verse_number}﴾
        </span>
      </p>

      {/* Transliteration */}
      <AnimatePresence>
        {showTransliteration && verse.transliteration && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-gray-500 italic mb-2 font-body leading-relaxed"
          >
            {verse.transliteration}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Translation */}
      <AnimatePresence>
        {showTranslation && translation && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-gray-600 leading-relaxed font-body border-l-2
                       border-forest-200 pl-3"
          >
            {translation}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Saved note display (when editor is closed) */}
      <AnimatePresence>
        {hasNote && !noteOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200
                            rounded-xl px-3 py-2.5">
              <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-xs text-amber-900 leading-relaxed font-body flex-1 whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note editor */}
      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-3 overflow-hidden"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your note for this verse…"
                maxLength={2000}
                rows={3}
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2
                           text-sm font-body text-gray-700 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-amber-300
                           resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-amber-600/70">
                  {draft.length}/2000 · Ctrl+Enter to save
                </span>
                <div className="flex items-center gap-2">
                  {hasNote && (
                    <button
                      onClick={handleDelete}
                      className="text-xs text-red-500 hover:text-red-600
                                 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => setNoteOpen(false)}
                    className="text-xs text-gray-500 hover:text-gray-700
                               px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!draft.trim()}
                    className="text-xs font-semibold text-white bg-amber-500
                               hover:bg-amber-600 disabled:opacity-40
                               px-3 py-1 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VerseBlock;
