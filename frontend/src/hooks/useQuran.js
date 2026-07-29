// src/hooks/useQuran.js
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchSurahs,
  fetchPage,
  fetchJuz,
  fetchBookmarks,
  upsertBookmark,
  deleteBookmark,
  fetchReadingPosition,
  saveReadingPosition,
  fetchNotes,
  upsertNote,
  deleteNoteByVerse,
} from '../api/quranApi';
import toast from 'react-hot-toast';

// ─── Surah list hook ───────────────────────────────────────────────────────
export const useSurahs = () => {
  const [surahs, setSurahs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchSurahs(filters);
      setSurahs(data.data.surahs);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load surahs';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { surahs, loading, error, reload: load };
};

// ─── Reader hook — page-by-page navigation ─────────────────────────────────
export const useQuranReader = () => {
  const [currentPage, setCurrentPage]   = useState(1);
  const [pageData, setPageData]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [bookmarks, setBookmarks]       = useState([]);
  const [bookmarkIds, setBookmarkIds]   = useState(new Set());
  // notes: Map<verse_id, { id, content, ... }>
  const [notes, setNotes]               = useState(new Map());

  // true = no saved position found, show surah list panel first
  // false = saved position restored, go straight to reader
  // null = still initialising (checking position)
  const [isFirstTime, setIsFirstTime]   = useState(null);

  const saveTimer = useRef(null);

  // Returns fresh data so callers never rely on stale state
  const loadPage = useCallback(async (page) => {
    if (page < 1 || page > 604) return null;
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchPage(page);
      setPageData(data.data);
      setCurrentPage(page);
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load page';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced navigation — saves position after the new page actually loads
  // using the returned fresh data, not the stale pageData closure
  const goToPage = useCallback((page) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    // If we were showing the first-time surah panel, dismiss it now
    setIsFirstTime(false);

    saveTimer.current = setTimeout(async () => {
      const freshData = await loadPage(page);
      const firstVerse = freshData?.verses?.[0];
      if (firstVerse) {
        saveReadingPosition({
          surah_id:    firstVerse.surah_id,
          verse_id:    firstVerse.id,
          page_number: page,
        }).catch(() => {});
      }
    }, 400);
  }, [loadPage]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // ─── Notes ─────────────────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    try {
      const { data } = await fetchNotes();
      const map = new Map();
      (data.data.notes || []).forEach((n) => map.set(n.verse_id, n));
      setNotes(map);
    } catch {
      // Non-critical
    }
  }, []);

  const saveNote = useCallback(async (verseId, content) => {
    if (!content.trim()) return;
    try {
      const { data } = await upsertNote(verseId, content);
      const note = data.data.note;
      setNotes((prev) => new Map(prev).set(verseId, note));
      toast.success('Note saved');
    } catch {
      toast.error('Failed to save note');
    }
  }, []);

  const deleteNote = useCallback(async (verseId) => {
    try {
      await deleteNoteByVerse(verseId);
      setNotes((prev) => {
        const next = new Map(prev);
        next.delete(verseId);
        return next;
      });
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  }, []);

  // ─── Bookmarks ─────────────────────────────────────────────────────────
  const loadBookmarks = useCallback(async () => {
    try {
      const { data } = await fetchBookmarks();
      const list = data.data.bookmarks;
      setBookmarks(list);
      setBookmarkIds(new Set(list.map((b) => b.verse_id).filter(Boolean)));
    } catch {
      // Non-critical — silently skip
    }
  }, []);

  const toggleBookmark = useCallback(async (verse, surahId) => {
    const isBookmarked = bookmarkIds.has(verse.id);

    if (isBookmarked) {
      const existing = bookmarks.find((b) => b.verse_id === verse.id);
      if (!existing) return;
      try {
        await deleteBookmark(existing.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
        setBookmarkIds((prev) => {
          const next = new Set(prev);
          next.delete(verse.id);
          return next;
        });
        toast.success('Bookmark removed');
      } catch {
        toast.error('Failed to remove bookmark');
      }
    } else {
      try {
        const { data } = await upsertBookmark({ surah_id: surahId, verse_id: verse.id });
        const newBookmark = data.data.bookmark;
        setBookmarks((prev) => [newBookmark, ...prev]);
        setBookmarkIds((prev) => new Set([...prev, verse.id]));
        toast.success('Verse bookmarked');
      } catch {
        toast.error('Failed to save bookmark');
      }
    }
  }, [bookmarks, bookmarkIds]);

  const removeBookmark = useCallback(async (bookmarkId, verseId) => {
    try {
      await deleteBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      setBookmarkIds((prev) => {
        const next = new Set(prev);
        next.delete(verseId);
        return next;
      });
      toast.success('Bookmark removed');
    } catch {
      toast.error('Failed to remove bookmark');
    }
  }, []);

  // ─── Init — check for saved position ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await fetchReadingPosition();
        const position = data.data.position;

        if (position?.page_number) {
          // Returning user — restore their position immediately
          setIsFirstTime(false);
          await loadPage(position.page_number);
        } else {
          // First time — show surah list panel, don't load any page yet
          setIsFirstTime(true);
          setLoading(false);
        }
      } catch {
        // Network error or no position — treat as first time
        setIsFirstTime(true);
        setLoading(false);
      }

      // Load bookmarks and notes in parallel regardless
      loadBookmarks();
      loadNotes();
    };

    init();

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [loadPage, loadBookmarks, loadNotes]);

  return {
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
    loadBookmarks,
    notes,
    saveNote,
    deleteNote,
  };
};

// ─── Juz navigation hook ───────────────────────────────────────────────────
export const useJuz = (number) => {
  const [juzData, setJuzData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!number) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await fetchJuz(number);
        setJuzData(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load juz');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [number]);

  return { juzData, loading, error };
};