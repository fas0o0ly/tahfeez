// src/seeders/seedEmbeddings.js
//
// Two-phase one-time seeder for the RAG chatbot corpus.
// Run from the backend directory:
//   node src/seeders/seedEmbeddings.js
//
// Phase 1: GPT-4o-mini generates 3–7 spiritual themes per verse (batch 10)
//   → saved to themes_checkpoint.json after completion (skipped on re-run)
// Phase 2: text-embedding-3-small embeds enriched text and inserts into DB (batch 100)
//
// If Phase 2 fails, re-run the script — Phase 1 will be loaded from the checkpoint file.
// Delete themes_checkpoint.json only if you want to regenerate themes from scratch.

require('dotenv').config();

const fs     = require('fs');
const path   = require('path');
const { getClient } = require('../config/db');
const openai = require('../config/openai');

const THEME_BATCH       = 10;
const EMBED_BATCH       = 100;
const LOG_EVERY         = 500;
const CHECKPOINT_FILE   = path.join(__dirname, 'themes_checkpoint.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Checkpoint helpers ───────────────────────────────────────────────────────

const saveCheckpoint = (verses) => {
  const data = verses.map((v) => ({ id: v.id, themes: v.themes }));
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2));
};

const loadCheckpoint = () => {
  if (!fs.existsSync(CHECKPOINT_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
  } catch {
    return null;
  }
};

const applyCheckpoint = (verses, checkpoint) => {
  const map = new Map(checkpoint.map((c) => [c.id, c.themes]));
  for (const v of verses) {
    v.themes = map.get(v.id) || [];
  }
};

// ─── Phase 1: theme generation ────────────────────────────────────────────────

const buildThemePrompt = (verses) => {
  const lines = verses.map((v, i) =>
    `[${i + 1}] Surah ${v.surah_number}, Ayah ${v.ayah_number}\nArabic: ${v.arabic_text}\nEnglish: ${v.translation_en}`
  );
  return (
    `For each Quran verse below, generate 3 to 7 single-word or short-phrase themes ` +
    `that describe its core spiritual meaning (e.g. hope, patience, forgiveness, hardship, gratitude, ` +
    `tawakkul, taubah, mercy, guidance, unity, prayer, perseverance, contentment).\n` +
    `Return ONLY a JSON array of arrays, one per verse, in the same order, with no extra text.\n` +
    `Example for 2 verses: [["hope","patience"],["mercy","forgiveness","gratitude"]]\n\n` +
    lines.join('\n\n')
  );
};

const generateThemesBatch = async (verses, attempt = 1) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildThemePrompt(verses) }],
      temperature: 0.3,
      max_tokens: 600,
    });
    const raw = response.choices[0].message.content.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array');
    while (parsed.length < verses.length) parsed.push([]);
    return parsed.slice(0, verses.length).map((themes) =>
      Array.isArray(themes) ? themes.map((t) => String(t).toLowerCase().trim()) : []
    );
  } catch (err) {
    if (attempt < 3) {
      console.warn(`  Theme batch failed (attempt ${attempt}): ${err.message}. Retrying...`);
      await sleep(3000 * attempt);
      return generateThemesBatch(verses, attempt + 1);
    }
    console.warn(`  Theme batch failed permanently: ${err.message}. Using empty themes.`);
    return verses.map(() => []);
  }
};

const phase1GenerateThemes = async (verses) => {
  // Check for existing checkpoint
  const checkpoint = loadCheckpoint();
  if (checkpoint && checkpoint.length === verses.length) {
    applyCheckpoint(verses, checkpoint);
    console.log(`\nPhase 1: Loaded themes from checkpoint (${checkpoint.length} verses) — skipping API calls.\n`);
    return;
  }

  console.log(`\nPhase 1: Generating themes for ${verses.length} verses (batch size ${THEME_BATCH})...`);
  const total = verses.length;
  let done = 0;

  for (let i = 0; i < total; i += THEME_BATCH) {
    const batch = verses.slice(i, i + THEME_BATCH);
    const themes = await generateThemesBatch(batch);
    for (let j = 0; j < batch.length; j++) {
      batch[j].themes = themes[j];
    }
    done += batch.length;
    if (done % LOG_EVERY < THEME_BATCH || done === total) {
      console.log(`  Themes: ${done}/${total} verses processed`);
    }
    await sleep(200);
  }

  // Save checkpoint so Phase 2 failures don't require redoing Phase 1
  saveCheckpoint(verses);
  console.log(`✓ Phase 1 complete — themes saved to themes_checkpoint.json\n`);
};

// ─── Phase 2: enriched text + embeddings ──────────────────────────────────────

const buildEnrichedText = (v) => {
  const themesSection = v.themes.length > 0 ? `Themes:\n${v.themes.join('\n')}\n\n` : '';
  const malaySection  = v.translation_ms ? `Malay:\n${v.translation_ms}` : '';
  return (
    `Surah ${v.surah_number}, Ayah ${v.ayah_number}\n\n` +
    themesSection +
    `Arabic:\n${v.arabic_text}\n\n` +
    `English:\n${v.translation_en}` +
    (malaySection ? `\n\n${malaySection}` : '')
  );
};

const embedBatch = async (texts, attempt = 1) => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  } catch (err) {
    if (attempt < 3) {
      console.warn(`  Embed batch failed (attempt ${attempt}): ${err.message}. Retrying...`);
      await sleep(5000 * attempt);
      return embedBatch(texts, attempt + 1);
    }
    throw err;
  }
};

const phase2EmbedAndInsert = async (client, verses) => {
  console.log(`Phase 2: Embedding enriched text and inserting ${verses.length} rows...`);
  const total = verses.length;
  let done = 0;

  for (let i = 0; i < total; i += EMBED_BATCH) {
    const batch = verses.slice(i, i + EMBED_BATCH);
    const enrichedTexts = batch.map(buildEnrichedText);
    const embeddings    = await embedBatch(enrichedTexts);

    for (let j = 0; j < batch.length; j++) {
      const v = batch[j];
      await client.query(
        `INSERT INTO verse_embeddings
           (verse_id, surah_number, ayah_number, arabic_text, translation_en, translation_ms,
            themes, enriched_text, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          v.id,
          v.surah_number,
          v.ayah_number,
          v.arabic_text,
          v.translation_en,
          v.translation_ms || null,
          v.themes,
          enrichedTexts[j],
          JSON.stringify(embeddings[j]),
        ]
      );
    }

    done += batch.length;
    if (done % LOG_EVERY < EMBED_BATCH || done === total) {
      console.log(`  Embedded & inserted: ${done}/${total}`);
    }
    await sleep(100);
  }

  console.log('✓ Phase 2 complete — all embeddings inserted\n');
};

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  const client = await getClient();
  try {
    // Check if already fully seeded
    const existing = await client.query('SELECT COUNT(*) AS cnt FROM verse_embeddings');
    if (parseInt(existing.rows[0].cnt, 10) > 0) {
      console.log(`verse_embeddings already contains ${existing.rows[0].cnt} rows. Exiting.`);
      console.log('To re-seed: DELETE FROM verse_embeddings; then re-run.');
      return;
    }

    // Fetch all verses
    const result = await client.query(
      `SELECT v.id, s.surah_number, v.verse_number AS ayah_number,
              v.arabic_text, v.translation_en, v.translation_ms
       FROM verses v
       JOIN surahs s ON s.id = v.surah_id
       ORDER BY s.surah_number, v.verse_number`
    );
    const verses = result.rows;
    console.log(`Fetched ${verses.length} verses from database.\n`);

    if (verses.length === 0) {
      console.error('No verses found. Run seedQuran.js first.');
      process.exit(1);
    }

    // Phase 1: themes (loads from checkpoint if available)
    await phase1GenerateThemes(verses);

    // Phase 2: embed + insert
    await phase2EmbedAndInsert(client, verses);

    // Verify
    const countRes = await client.query(
      'SELECT COUNT(*) AS cnt, AVG(array_length(themes, 1))::NUMERIC(4,1) AS avg_themes FROM verse_embeddings'
    );
    const { cnt, avg_themes } = countRes.rows[0];
    console.log(`✅ Seeding complete! Rows: ${cnt} | Avg themes per verse: ${avg_themes}`);
    console.log(`   You can delete themes_checkpoint.json — it is no longer needed.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
})();
