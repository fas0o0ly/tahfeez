// src/components/quran/BookmarkPanel.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BookmarkPanel = ({ isOpen, onClose, bookmarks, onRemove, onNavigate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGo = (bookmark) => {
    onNavigate(bookmark.page_number || 1);
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
            className="fixed inset-0 bg-obsidian-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
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
                  Bookmarks
                </h2>
                <p className="text-xs text-gray-400 font-body mt-0.5">
                  {bookmarks.length} saved {bookmarks.length === 1 ? 'verse' : 'verses'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gold-50 flex items-center
                                  justify-center mb-3">
                    <svg className="w-6 h-6 text-gold-400" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <p className="font-display font-semibold text-forest-900 text-base mb-1">
                    No bookmarks yet
                  </p>
                  <p className="text-sm text-gray-400 font-body leading-relaxed">
                    Tap the bookmark icon on any verse while reading to save it here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {bookmarks.map((bookmark) => (
                    <li key={bookmark.id} className="group px-5 py-4 hover:bg-gray-50
                                                     transition-colors duration-150">
                      {/* Color dot + surah name */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {bookmark.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: bookmark.color }}
                            />
                          )}
                          <span className="text-xs font-medium text-forest-700 font-body">
                            {bookmark.name_english}
                            <span className="text-gray-400 font-normal mx-1">·</span>
                            Verse {bookmark.verse_number}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100
                                        transition-opacity duration-150">
                          <button
                            onClick={() => handleGo(bookmark)}
                            className="p-1.5 rounded-lg text-forest-600 hover:bg-forest-50
                                       transition-colors"
                            title="Go to verse"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onRemove(bookmark.id, bookmark.verse_id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500
                                       hover:bg-red-50 transition-colors"
                            title="Remove bookmark"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                                 stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Arabic snippet */}
                      {bookmark.arabic_text && (
                        <p
                          className="text-forest-800 leading-relaxed mb-1.5 text-right"
                          style={{
                            fontFamily: 'Amiri Quran, Amiri, serif',
                            fontSize: '1.1rem',
                            direction: 'rtl',
                          }}
                        >
                          {bookmark.arabic_text.length > 80
                            ? bookmark.arabic_text.slice(0, 80) + '…'
                            : bookmark.arabic_text}
                        </p>
                      )}

                      {/* Translation snippet */}
                      {bookmark.translation_en && (
                        <p className="text-xs text-gray-400 font-body leading-relaxed line-clamp-2">
                          {bookmark.translation_en}
                        </p>
                      )}

                      {/* Label */}
                      {bookmark.label && (
                        <span className="inline-block mt-1.5 text-xs bg-gold-50 text-gold-700
                                         border border-gold-200 rounded-full px-2 py-0.5 font-body">
                          {bookmark.label}
                        </span>
                      )}
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

export default BookmarkPanel;