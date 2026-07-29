// src/seeders/seedQuran.js
//
// One-time seed script. Run with:
//   node src/seeders/seedQuran.js
//
// Fetches Arabic (quran-uthmani), English (en.sahih), Malay (ms.basmeih)
// from Al-Quran Cloud API and upserts into surahs + verses tables.
// Safe to re-run — all inserts use ON CONFLICT DO UPDATE.

require('dotenv').config();

const { getClient } = require('../config/db');

const BASE_URL = 'https://api.alquran.cloud/v1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, retries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
      const json = await res.json();
      if (json.code !== 200) throw new Error(`API error: ${json.status} — ${url}`);
      return json.data;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  Attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
};

const fetchAllEditions = async () => {
  console.log('Fetching from Al-Quran Cloud API (4 requests in parallel)...\n');

  const [arabicData, englishData, malayData, metaData] = await Promise.all([
    fetchWithRetry(`${BASE_URL}/quran/quran-uthmani`),
    fetchWithRetry(`${BASE_URL}/quran/en.sahih`),
    fetchWithRetry(`${BASE_URL}/quran/ms.basmeih`),
    fetchWithRetry(`${BASE_URL}/meta`),
  ]);

  console.log('✓ All API data fetched\n');
  return { arabicData, englishData, malayData, metaData };
};

// Build a fast lookup map: "surahNum:verseNum" -> translation text
const buildTranslationMap = (editionData) => {
  const map = new Map();
  for (const surah of editionData.surahs) {
    for (const ayah of surah.ayahs) {
      map.set(`${surah.number}:${ayah.numberInSurah}`, ayah.text);
    }
  }
  return map;
};

const seedSurahs = async (client, metaData) => {
  console.log('Seeding 114 surahs...');

  const surahs = metaData.surahs.references;

  for (const surah of surahs) {
    await client.query(
      `INSERT INTO surahs (
        surah_number, name_arabic, name_english, name_transliteration,
        total_verses, revelation_type, juz_number, page_start, page_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (surah_number) DO UPDATE SET
        name_arabic          = EXCLUDED.name_arabic,
        name_english         = EXCLUDED.name_english,
        name_transliteration = EXCLUDED.name_transliteration,
        total_verses         = EXCLUDED.total_verses,
        revelation_type      = EXCLUDED.revelation_type,
        updated_at           = NOW()`,
      [
        surah.number,
        surah.name,
        surah.englishName,
        surah.englishNameTranslation,
        surah.numberOfAyahs,
        surah.revelationType.toLowerCase(),
        null, // derived from verse data in fixSurahJuzNumbers()
        null,
        null,
      ]
    );
  }

  console.log(`✓ ${surahs.length} surahs seeded`);
};

const seedVerses = async (client, arabicData, englishMap, malayMap) => {
  console.log('Seeding 6,236 verses — this takes a moment...');

  let totalInserted = 0;

  for (const surah of arabicData.surahs) {
    const { rows } = await client.query(
      'SELECT id FROM surahs WHERE surah_number = $1',
      [surah.number]
    );

    if (!rows.length) {
      console.error(`  ✗ Surah ${surah.number} missing from DB — skipping its verses`);
      continue;
    }

    const surahId = rows[0].id;

    for (const ayah of surah.ayahs) {
      const key = `${surah.number}:${ayah.numberInSurah}`;

      await client.query(
        `INSERT INTO verses (
          surah_id, verse_number, arabic_text,
          translation_en, translation_ms, transliteration,
          page_number, juz_number, hizb_quarter,
          audio_url_mishary, audio_url_sudais
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (surah_id, verse_number) DO UPDATE SET
          arabic_text    = EXCLUDED.arabic_text,
          translation_en = EXCLUDED.translation_en,
          translation_ms = EXCLUDED.translation_ms,
          page_number    = EXCLUDED.page_number,
          juz_number     = EXCLUDED.juz_number,
          hizb_quarter   = EXCLUDED.hizb_quarter,
          updated_at     = NOW()`,
        [
          surahId,
          ayah.numberInSurah,
          ayah.text,
          englishMap.get(key) || null,
          malayMap.get(key)   || null,
          null,               // transliteration — not in these editions
          ayah.page           || null,
          ayah.juz            || null,
          ayah.hizbQuarter    || null,
          null,               // audio URLs are built dynamically by the API — not stored
          null,
        ]
      );

      totalInserted++;
    }

    if (surah.number % 10 === 0) {
      console.log(`  → Surah ${surah.number}/114 complete (${totalInserted} verses total)`);
    }
  }

  console.log(`✓ ${totalInserted} verses seeded`);
};

// Derive juz_number for each surah from its first verse
const fixSurahJuzNumbers = async (client) => {
  console.log('Updating surah juz numbers from verse data...');

  await client.query(`
    UPDATE surahs s
    SET juz_number = (
      SELECT v.juz_number
      FROM verses v
      WHERE v.surah_id = s.id
        AND v.verse_number = 1
        AND v.juz_number IS NOT NULL
      LIMIT 1
    )
    WHERE s.juz_number IS NULL
  `);

  console.log('✓ Surah juz numbers updated');
};


// Derive page_start and page_end for each surah from its verse data
const fixSurahPageRanges = async (client) => {
  console.log('Updating surah page ranges from verse data...');

  await client.query(`
    UPDATE surahs s
    SET
      page_start = (
        SELECT MIN(v.page_number)
        FROM verses v
        WHERE v.surah_id = s.id
          AND v.page_number IS NOT NULL
      ),
      page_end = (
        SELECT MAX(v.page_number)
        FROM verses v
        WHERE v.surah_id = s.id
          AND v.page_number IS NOT NULL
      )
    WHERE s.page_start IS NULL
  `);

  console.log('✓ Surah page ranges updated');
};

const run = async () => {
  const client = await getClient();

  try {
    const { arabicData, englishData, malayData, metaData } = await fetchAllEditions();

    const englishMap = buildTranslationMap(englishData);
    const malayMap   = buildTranslationMap(malayData);

    await client.query('BEGIN');

    await seedSurahs(client, metaData);
    await seedVerses(client, arabicData, englishMap, malayMap);
    await fixSurahJuzNumbers(client);
    await fixSurahPageRanges(client);

    await client.query('COMMIT');

    console.log('\n✅ Quran seed completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed — transaction rolled back');
    console.error(err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

run();