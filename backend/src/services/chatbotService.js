// src/services/chatbotService.js
const openai = require('../config/openai');
const { query } = require('../config/db');

const THRESHOLD = parseFloat(process.env.CHATBOT_CONFIDENCE_THRESHOLD || '0.10');
const VERSE_LIMIT = 5;

// ─── Step 1: Detect emotion + topic ───────────────────────────────────────────

const detectEmotionAndTopic = async (userQuery) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an emotion and topic classifier for a Quran guidance chatbot. ' +
          'Return ONLY valid JSON with keys: emotion (string), topic (string), language (string: "en" | "ms" | "ar").',
      },
      {
        role: 'user',
        content:
          `Classify the following message. emotion = the user's emotional state (e.g. anxiety, grief, despair, anger, loneliness, gratitude). ` +
          `topic = the spiritual topic they need guidance on (e.g. hope, patience, forgiveness, hardship, gratitude, tawakkul). ` +
          `language = the language of the message.\n\nMessage: "${userQuery}"`,
      },
    ],
    temperature: 0.1,
    max_tokens: 60,
    response_format: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      emotion:  parsed.emotion  || 'unknown',
      topic:    parsed.topic    || 'general guidance',
      language: parsed.language || 'en',
    };
  } catch {
    return { emotion: 'unknown', topic: 'general guidance', language: 'en' };
  }
};

// ─── Step 2: Embed user query ──────────────────────────────────────────────────

const generateEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
};

// ─── Step 3: In-memory cosine similarity search ───────────────────────────────
// Embeddings are loaded once from the DB and cached. For 6,236 verses this is
// ~76 MB in memory and completes in ~20–50 ms per query — no pgvector needed.

let _embeddingCache = null;

const loadEmbeddingCache = async () => {
  if (_embeddingCache) return _embeddingCache;
  const result = await query(
    `SELECT surah_number, ayah_number, arabic_text, translation_en, themes, embedding
     FROM verse_embeddings
     WHERE embedding IS NOT NULL`
  );
  _embeddingCache = result.rows.map((r) => ({
    surah_number:   r.surah_number,
    ayah_number:    r.ayah_number,
    arabic_text:    r.arabic_text,
    translation_en: r.translation_en,
    themes:         r.themes,
    // pg returns JSONB as a parsed JS value already
    vector: Array.isArray(r.embedding) ? r.embedding : r.embedding,
  }));
  return _embeddingCache;
};

const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

const searchVerses = async (embedding, limit = VERSE_LIMIT) => {
  const corpus = await loadEmbeddingCache();

  const scored = corpus.map((v) => ({
    surah_number:   v.surah_number,
    ayah_number:    v.ayah_number,
    arabic_text:    v.arabic_text,
    translation_en: v.translation_en,
    themes:         v.themes,
    score:          parseFloat(cosineSimilarity(embedding, v.vector).toFixed(4)),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
};

// ─── Step 5: Generate grounded response ───────────────────────────────────────

const buildVerseContext = (verses) =>
  verses
    .map(
      (v) =>
        `Surah ${v.surah_number}, Ayah ${v.ayah_number}\n` +
        `Themes: ${v.themes.join(', ')}\n` +
        `Arabic: ${v.arabic_text}\n` +
        `English: ${v.translation_en}`
    )
    .join('\n---\n');

const OUT_OF_SCOPE_RESPONSE =
  "I'm only able to provide guidance rooted in the Quran. Your question appears to be outside the scope of Quranic spiritual guidance. " +
  "Please ask about matters of faith, patience, gratitude, hardship, or other spiritual concerns.";

const generateResponse = async (userQuery, emotion, topic, verses) => {
  const verseContext = buildVerseContext(verses);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          `You are a compassionate Quran Guidance Assistant.\n\n` +
          `STRICT RULES:\n` +
          `1. Respond using ONLY the provided Quran verses below.\n` +
          `2. NEVER invent verses, hadith, or Islamic rulings not in the provided text.\n` +
          `3. NEVER answer political, financial, medical, or worldly advice questions.\n` +
          `4. If the provided verses are insufficient to address the query, respond only with: "Out of Scope"\n` +
          `5. Be compassionate, concise (3–5 sentences), and hopeful.\n` +
          `6. Always cite Surah number and Ayah number (e.g. Surah Al-Baqarah, 2:286).\n\n` +
          `User emotion: [${emotion}] | Topic: [${topic}]\n\n` +
          `Retrieved verses (USE ONLY THESE):\n---\n${verseContext}\n---`,
      },
      { role: 'user', content: userQuery },
    ],
    temperature: 0.5,
    max_tokens: 400,
  });

  const content = response.choices[0].message.content.trim();
  if (content === 'Out of Scope') return null;
  return content;
};

// ─── Step 6: Persist ──────────────────────────────────────────────────────────

const storeConversation = async (userId, { userQuery, response, emotion, topic, verses, topScore, isOutOfScope }) => {
  const versesJson = JSON.stringify(
    verses.map((v) => ({
      surah_number:   v.surah_number,
      ayah_number:    v.ayah_number,
      arabic_text:    v.arabic_text,
      translation_en: v.translation_en,
      themes:         v.themes,
      score:          v.score,
    }))
  );

  const result = await query(
    `INSERT INTO chatbot_conversations
       (user_id, user_query, assistant_response, emotion_detected, topic_detected,
        is_out_of_scope, verses_used, top_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [userId, userQuery, response, emotion, topic, isOutOfScope, versesJson, topScore]
  );
  return result.rows[0].id;
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────

const processQuery = async (userId, userQuery) => {
  // Steps 1 + 2 in parallel
  const [{ emotion, topic }, embedding] = await Promise.all([
    detectEmotionAndTopic(userQuery),
    generateEmbedding(userQuery),
  ]);

  // Step 3: in-memory similarity search
  const verses = await searchVerses(embedding);

  // Step 4: confidence gate
  const topScore = verses.length > 0 ? verses[0].score : 0;
  if (verses.length === 0 || topScore < THRESHOLD) {
    const conversationId = await storeConversation(userId, {
      userQuery, response: OUT_OF_SCOPE_RESPONSE, emotion, topic,
      verses: [], topScore, isOutOfScope: true,
    });
    return {
      conversation_id: conversationId,
      response: OUT_OF_SCOPE_RESPONSE,
      emotion, topic,
      is_out_of_scope: true,
      verses_used: [],
    };
  }

  // Step 5: generate response
  const responseText = await generateResponse(userQuery, emotion, topic, verses);

  if (!responseText) {
    const conversationId = await storeConversation(userId, {
      userQuery, response: OUT_OF_SCOPE_RESPONSE, emotion, topic,
      verses: [], topScore, isOutOfScope: true,
    });
    return {
      conversation_id: conversationId,
      response: OUT_OF_SCOPE_RESPONSE,
      emotion, topic,
      is_out_of_scope: true,
      verses_used: [],
    };
  }

  // Step 6: persist
  const conversationId = await storeConversation(userId, {
    userQuery, response: responseText, emotion, topic,
    verses, topScore, isOutOfScope: false,
  });

  return {
    conversation_id: conversationId,
    response: responseText,
    emotion,
    topic,
    is_out_of_scope: false,
    verses_used: verses,
  };
};

// ─── History ──────────────────────────────────────────────────────────────────

const getHistory = async (userId, limit = 20) => {
  const result = await query(
    `SELECT id, user_query, assistant_response, emotion_detected, topic_detected,
            is_out_of_scope, verses_used, top_score, created_at
     FROM chatbot_conversations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteConversation = async (id, userId) => {
  const result = await query(
    'DELETE FROM chatbot_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rowCount > 0;
};

// ─── Cache invalidation (call if corpus is re-seeded) ─────────────────────────

const clearEmbeddingCache = () => { _embeddingCache = null; };

module.exports = { processQuery, getHistory, deleteConversation, clearEmbeddingCache };
