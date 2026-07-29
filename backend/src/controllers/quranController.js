// src/controllers/quranController.js
const { query, getClient } = require('../config/db');
const { success, error } = require('../utils/response');

const AUDIO_CDN = {
  mishary: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
  sudais:  'https://cdn.islamic.network/quran/audio/128/ar.abdurrahmansudais',
};

const buildAudioUrl = (reciter, globalVerseNumber) => {
  const base = AUDIO_CDN[reciter] || AUDIO_CDN.mishary;
  return `${base}/${globalVerseNumber}.mp3`;
};

// ─── Surah List ────────────────────────────────────────────────────────────
// GET /api/quran/surahs
const getSurahs = async (req, res) => {
  try {
    const { revelation_type, juz, search } = req.query;

    const conditions = [];
    const params = [];

    if (revelation_type) {
      params.push(revelation_type);
      conditions.push(`revelation_type = $${params.length}`);
    }

    if (juz) {
      params.push(parseInt(juz));
      conditions.push(`juz_number = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(name_english) LIKE $${idx} OR LOWER(name_transliteration) LIKE $${idx} OR name_arabic LIKE $${idx})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
        id, surah_number, name_arabic, name_english, name_transliteration,
        total_verses, revelation_type, juz_number, page_start, page_end
       FROM surahs
       ${where}
       ORDER BY surah_number ASC`,
      params
    );

    return success(res, { surahs: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('getSurahs error:', err.message);
    return error(res, 'Failed to fetch surahs', 500);
  }
};

// ─── Single Surah with Verses ──────────────────────────────────────────────
// GET /api/quran/surahs/:number
const getSurahByNumber = async (req, res) => {
  try {
    const surahNumber = parseInt(req.params.number);

    const surahResult = await query(
      `SELECT id, surah_number, name_arabic, name_english, name_transliteration,
              total_verses, revelation_type, juz_number, page_start, page_end
       FROM surahs
       WHERE surah_number = $1`,
      [surahNumber]
    );

    if (!surahResult.rows.length) {
      return error(res, 'Surah not found', 404);
    }

    const surah = surahResult.rows[0];

    const versesResult = await query(
      `SELECT
        v.id, v.verse_number, v.arabic_text, v.translation_en, v.translation_ms,
        v.transliteration, v.page_number, v.juz_number, v.hizb_quarter,
        (
          SELECT COALESCE(SUM(s2.total_verses), 0)
          FROM surahs s2
          WHERE s2.surah_number < $2
        ) + v.verse_number AS global_verse_number
       FROM verses v
       WHERE v.surah_id = $1
       ORDER BY v.verse_number ASC`,
      [surah.id, surahNumber]
    );

    const versesWithAudio = versesResult.rows.map((v) => ({
      ...v,
      audio: {
        mishary: buildAudioUrl('mishary', v.global_verse_number),
        sudais:  buildAudioUrl('sudais',  v.global_verse_number),
      },
    }));

    return success(res, { surah, verses: versesWithAudio });
  } catch (err) {
    console.error('getSurahByNumber error:', err.message);
    return error(res, 'Failed to fetch surah', 500);
  }
};

// ─── Page Navigation ───────────────────────────────────────────────────────
// GET /api/quran/pages/:page
const getVersesByPage = async (req, res) => {
  try {
    const pageNumber = parseInt(req.params.page);

    const result = await query(
      `SELECT
        v.id, v.surah_id, v.verse_number, v.arabic_text, v.translation_en, v.translation_ms,
        v.transliteration, v.page_number, v.juz_number, v.hizb_quarter,
        s.surah_number, s.name_arabic, s.name_english, s.name_transliteration,
        s.revelation_type,
        (
          SELECT COALESCE(SUM(s2.total_verses), 0)
          FROM surahs s2
          WHERE s2.surah_number < s.surah_number
        ) + v.verse_number AS global_verse_number
       FROM verses v
       JOIN surahs s ON s.id = v.surah_id
       WHERE v.page_number = $1
       ORDER BY s.surah_number ASC, v.verse_number ASC`,
      [pageNumber]
    );

    if (!result.rows.length) {
      return error(res, 'No verses found for this page', 404);
    }

    const versesWithAudio = result.rows.map((v) => ({
      ...v,
      audio: {
        mishary: buildAudioUrl('mishary', v.global_verse_number),
        sudais:  buildAudioUrl('sudais',  v.global_verse_number),
      },
    }));

    // Collect unique surahs on this page for header display
    const surahsOnPage = [];
    const seen = new Set();

    for (const verse of versesWithAudio) {
      if (!seen.has(verse.surah_number)) {
        seen.add(verse.surah_number);
        surahsOnPage.push({
          surah_number:         verse.surah_number,
          name_arabic:          verse.name_arabic,
          name_english:         verse.name_english,
          name_transliteration: verse.name_transliteration,
          revelation_type:      verse.revelation_type,
        });
      }
    }

    return success(res, {
      page:   pageNumber,
      surahs: surahsOnPage,
      verses: versesWithAudio,
      total:  result.rows.length,
    });
  } catch (err) {
    console.error('getVersesByPage error:', err.message);
    return error(res, 'Failed to fetch page', 500);
  }
};

// ─── Juz Navigation ────────────────────────────────────────────────────────
// GET /api/quran/juz/:number
const getVersesByJuz = async (req, res) => {
  try {
    const juzNumber = parseInt(req.params.number);

    const result = await query(
      `SELECT
        v.id, v.surah_id, v.verse_number, v.arabic_text, v.translation_en, v.translation_ms,
        v.transliteration, v.page_number, v.juz_number, v.hizb_quarter,
        s.surah_number, s.name_arabic, s.name_english, s.name_transliteration,
        (
          SELECT COALESCE(SUM(s2.total_verses), 0)
          FROM surahs s2
          WHERE s2.surah_number < s.surah_number
        ) + v.verse_number AS global_verse_number
       FROM verses v
       JOIN surahs s ON s.id = v.surah_id
       WHERE v.juz_number = $1
       ORDER BY s.surah_number ASC, v.verse_number ASC`,
      [juzNumber]
    );

    if (!result.rows.length) {
      return error(res, 'No verses found for this juz', 404);
    }

    const versesWithAudio = result.rows.map((v) => ({
      ...v,
      audio: {
        mishary: buildAudioUrl('mishary', v.global_verse_number),
        sudais:  buildAudioUrl('sudais',  v.global_verse_number),
      },
    }));

    return success(res, {
      juz:    juzNumber,
      verses: versesWithAudio,
      total:  result.rows.length,
    });
  } catch (err) {
    console.error('getVersesByJuz error:', err.message);
    return error(res, 'Failed to fetch juz', 500);
  }
};

// ─── Bookmarks ─────────────────────────────────────────────────────────────
// GET /api/quran/bookmarks
const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT
        b.id, b.surah_id, b.verse_id, b.label, b.color, b.created_at,
        s.surah_number, s.name_arabic, s.name_english, s.name_transliteration,
        v.verse_number, v.arabic_text, v.translation_en, v.page_number
       FROM bookmarks b
       JOIN surahs s ON s.id = b.surah_id
       LEFT JOIN verses v ON v.id = b.verse_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return success(res, { bookmarks: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('getBookmarks error:', err.message);
    return error(res, 'Failed to fetch bookmarks', 500);
  }
};

// POST /api/quran/bookmarks
// Upsert — same user + surah + verse + label combo updates color; new combo inserts
const upsertBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { surah_id, verse_id = null, label = null, color = null } = req.body;

    const surahCheck = await query(
      'SELECT id FROM surahs WHERE id = $1',
      [surah_id]
    );
    if (!surahCheck.rows.length) {
      return error(res, 'Surah not found', 404);
    }

    if (verse_id) {
      const verseCheck = await query(
        'SELECT id FROM verses WHERE id = $1 AND surah_id = $2',
        [verse_id, surah_id]
      );
      if (!verseCheck.rows.length) {
        return error(res, 'Verse not found in the specified surah', 404);
      }
    }

    const result = await query(
      `INSERT INTO bookmarks (user_id, surah_id, verse_id, label, color)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, surah_id, verse_id, label) DO UPDATE SET
         color      = EXCLUDED.color,
         updated_at = NOW()
       RETURNING id, surah_id, verse_id, label, color, created_at, updated_at`,
      [userId, surah_id, verse_id, label, color]
    );

    return success(res, { bookmark: result.rows[0] }, 'Bookmark saved', 201);
  } catch (err) {
    console.error('upsertBookmark error:', err.message);
    return error(res, 'Failed to save bookmark', 500);
  }
};

// DELETE /api/quran/bookmarks/:id
const deleteBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM bookmarks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!result.rowCount) {
      return error(res, 'Bookmark not found', 404);
    }

    return success(res, null, 'Bookmark removed');
  } catch (err) {
    console.error('deleteBookmark error:', err.message);
    return error(res, 'Failed to delete bookmark', 500);
  }
};

// ─── Reading Position ──────────────────────────────────────────────────────
// GET /api/quran/reading-position
const getReadingPosition = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT
        rp.surah_id, rp.verse_id, rp.page_number, rp.updated_at,
        s.surah_number, s.name_arabic, s.name_english, s.name_transliteration,
        v.verse_number, v.arabic_text
       FROM reading_position rp
       JOIN surahs s ON s.id = rp.surah_id
       LEFT JOIN verses v ON v.id = rp.verse_id
       WHERE rp.user_id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return success(res, { position: null }, 'No reading position saved yet');
    }

    return success(res, { position: result.rows[0] });
  } catch (err) {
    console.error('getReadingPosition error:', err.message);
    return error(res, 'Failed to fetch reading position', 500);
  }
};

// PUT /api/quran/reading-position
const upsertReadingPosition = async (req, res) => {
  try {
    const userId = req.user.id;
    const { surah_id, verse_id = null, page_number = null } = req.body;

    const surahCheck = await query(
      'SELECT id FROM surahs WHERE id = $1',
      [surah_id]
    );
    if (!surahCheck.rows.length) {
      return error(res, 'Surah not found', 404);
    }

    await query(
      `INSERT INTO reading_position (user_id, surah_id, verse_id, page_number, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         surah_id    = EXCLUDED.surah_id,
         verse_id    = EXCLUDED.verse_id,
         page_number = EXCLUDED.page_number,
         updated_at  = NOW()`,
      [userId, surah_id, verse_id, page_number]
    );

    return success(res, null, 'Reading position saved');
  } catch (err) {
    console.error('upsertReadingPosition error:', err.message);
    return error(res, 'Failed to save reading position', 500);
  }
};

// ─── Verse Notes ───────────────────────────────────────────────────────────
// GET /api/quran/notes  — all notes for the current user
const getNotes = async (req, res) => {
  try {
    const result = await query(
      `SELECT vn.id, vn.verse_id, vn.content, vn.created_at, vn.updated_at,
              v.verse_number, v.surah_id,
              s.surah_number, s.name_english, s.name_transliteration
       FROM verse_notes vn
       JOIN verses  v ON v.id = vn.verse_id
       JOIN surahs  s ON s.id = v.surah_id
       WHERE vn.user_id = $1
       ORDER BY vn.updated_at DESC`,
      [req.user.id]
    );
    return success(res, { notes: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('getNotes error:', err.message);
    return error(res, 'Failed to fetch notes', 500);
  }
};

// POST /api/quran/notes  — upsert a note for a verse
const saveNote = async (req, res) => {
  try {
    const { verse_id, content } = req.body;

    const verseCheck = await query('SELECT id FROM verses WHERE id = $1', [verse_id]);
    if (!verseCheck.rows.length) return error(res, 'Verse not found', 404);

    const result = await query(
      `INSERT INTO verse_notes (user_id, verse_id, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, verse_id) DO UPDATE
         SET content = EXCLUDED.content, updated_at = NOW()
       RETURNING id, verse_id, content, created_at, updated_at`,
      [req.user.id, verse_id, content.trim()]
    );
    return success(res, { note: result.rows[0] }, 'Note saved', 201);
  } catch (err) {
    console.error('saveNote error:', err.message);
    return error(res, 'Failed to save note', 500);
  }
};

// DELETE /api/quran/notes/:verse_id  — delete the note for a specific verse
const deleteNote = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM verse_notes WHERE verse_id = $1 AND user_id = $2',
      [req.params.verse_id, req.user.id]
    );
    if (!result.rowCount) return error(res, 'Note not found', 404);
    return success(res, null, 'Note deleted');
  } catch (err) {
    console.error('deleteNote error:', err.message);
    return error(res, 'Failed to delete note', 500);
  }
};

module.exports = {
  getSurahs,
  getSurahByNumber,
  getVersesByPage,
  getVersesByJuz,
  getBookmarks,
  upsertBookmark,
  deleteBookmark,
  getReadingPosition,
  upsertReadingPosition,
  getNotes,
  saveNote,
  deleteNote,
};