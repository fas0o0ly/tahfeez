// src/pages/shared/ChatbotPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { chatbotApi } from '../../api/chatbotApi';
import toast from 'react-hot-toast';

// ─── Utilities ────────────────────────────────────────────────────────────────

const relativeTime = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
};

const EXAMPLE_PROMPTS = [
  'I feel anxious about my future',
  'How do I find peace during hardship?',
  'I feel lost and far from Allah',
  'Help me understand the concept of tawakkul',
];

// ─── Verse card ───────────────────────────────────────────────────────────────

const VerseCard = ({ verse }) => {
  const pct = Math.round((verse.score || 0) * 100);
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-amber-700">
          Surah {verse.surah_number} · Ayah {verse.ayah_number}
        </span>
        <span className="text-[10px] text-amber-500 font-medium">{pct}% match</span>
      </div>

      {/* Theme pills */}
      {verse.themes && verse.themes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {verse.themes.map((t, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium
                         bg-amber-100 text-amber-700 border border-amber-200"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Arabic */}
      <p
        dir="rtl"
        style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem', lineHeight: '2.2' }}
        className="text-forest-900 text-right mb-2"
      >
        ﴾{verse.arabic_text}﴿
      </p>

      {/* English */}
      <p className="text-sm text-gray-600 italic leading-relaxed border-t border-amber-100 pt-2 mt-1">
        {verse.translation_en}
      </p>

      {/* Relevance bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-amber-500 flex-shrink-0 font-medium">Relevance {pct}%</span>
      </div>
    </div>
  );
};

// ─── Thinking indicator ───────────────────────────────────────────────────────

const ThinkingDots = () => (
  <div className="flex items-center gap-1.5 px-4 py-3.5">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-forest-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// ─── Assistant message ────────────────────────────────────────────────────────

const AssistantMessage = ({ item }) => (
  <div className="max-w-2xl">
    {item.is_out_of_scope ? (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-500 text-sm">⚠</span>
          <span className="text-xs font-semibold text-orange-600">Out of Scope</span>
        </div>
        <p className="text-sm text-orange-700 leading-relaxed">{item.response}</p>
      </div>
    ) : (
      <div>
        {/* Badges */}
        <div className="flex gap-2 mb-2">
          {item.emotion_detected && item.emotion_detected !== 'unknown' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium
                             bg-blue-50 text-blue-600 border border-blue-200">
              {item.emotion_detected}
            </span>
          )}
          {item.topic_detected && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium
                             bg-forest-50 text-forest-700 border border-forest-200">
              {item.topic_detected}
            </span>
          )}
        </div>

        {/* Response text */}
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{item.response}</p>
        </div>

        {/* Verse cards */}
        {item.verses_used && item.verses_used.length > 0 && (
          <div className="mt-2 space-y-2">
            {item.verses_used.map((v, i) => (
              <VerseCard key={i} verse={v} />
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

// ─── Chat thread ──────────────────────────────────────────────────────────────

const ChatThread = ({ item }) => (
  <div className="space-y-5 pb-2">
    {/* User bubble */}
    <div className="flex justify-end">
      <div className="max-w-sm rounded-2xl rounded-tr-sm bg-forest-800 px-4 py-2.5 shadow-sm">
        <p className="text-sm text-white leading-relaxed">{item.user_query}</p>
      </div>
    </div>

    {/* Assistant */}
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-200 flex-shrink-0
                        flex items-center justify-center mt-0.5 shadow-sm">
          <span style={{ fontFamily: 'Amiri, serif', color: '#92400e', fontSize: '14px' }}>ط</span>
        </div>
        <AssistantMessage item={item} />
      </div>
    </div>
  </div>
);

// ─── Welcome state ────────────────────────────────────────────────────────────

const WelcomeState = ({ onPrompt }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-10">
    <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-200
                    flex items-center justify-center mb-4 shadow-sm">
      <span style={{ fontFamily: 'Amiri, serif', color: '#92400e', fontSize: '28px' }}>ق</span>
    </div>
    <h2 className="text-xl font-display font-semibold text-forest-900 mb-2">
      Quran Guidance Assistant
    </h2>
    <p className="text-sm text-gray-500 max-w-sm mb-8">
      Share what is on your heart and receive guidance rooted in the words of Allah.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
      {EXAMPLE_PROMPTS.map((p) => (
        <button
          key={p}
          onClick={() => onPrompt(p)}
          className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white
                     text-sm text-gray-600 hover:border-amber-300 hover:bg-amber-50
                     hover:text-amber-800 shadow-sm transition-all duration-150"
        >
          {p}
        </button>
      ))}
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const ChatbotPage = () => {
  const [history, setHistory]      = useState([]);
  const [histLoading, setHistLoad] = useState(true);
  const [activeItem, setActive]    = useState(null);
  const [input, setInput]          = useState('');
  const [thinking, setThinking]    = useState(false);
  const bottomRef                  = useRef(null);
  const inputRef                   = useRef(null);

  const loadHistory = useCallback(async () => {
    setHistLoad(true);
    try {
      const res = await chatbotApi.getHistory();
      setHistory(res.data.data.history || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setHistLoad(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeItem, thinking]);

  const handleSend = async (text) => {
    const q = (text || input).trim();
    if (!q || thinking) return;

    setInput('');
    setThinking(true);
    setActive(null);

    try {
      const res = await chatbotApi.sendQuery(q);
      const data = res.data.data;
      const newItem = {
        id:               data.conversation_id,
        user_query:       q,
        response:         data.response,
        emotion_detected: data.emotion,
        topic_detected:   data.topic,
        is_out_of_scope:  data.is_out_of_scope,
        verses_used:      data.verses_used,
        created_at:       new Date().toISOString(),
      };
      setActive(newItem);
      setHistory((prev) => [newItem, ...prev]);
    } catch {
      toast.error('Failed to get response. Please try again.');
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await chatbotApi.deleteConversation(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (activeItem?.id === id) setActive(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleNewChat = () => {
    setActive(null);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const resolveItem = (h) => ({
    id:               h.id,
    user_query:       h.user_query,
    response:         h.assistant_response,
    emotion_detected: h.emotion_detected,
    topic_detected:   h.topic_detected,
    is_out_of_scope:  h.is_out_of_scope,
    verses_used:      typeof h.verses_used === 'string'
      ? JSON.parse(h.verses_used)
      : (h.verses_used || []),
    created_at:       h.created_at,
  });

  const displayItem = activeItem
    ? { ...activeItem, verses_used: activeItem.verses_used || [] }
    : null;

  return (
    <DashboardLayout title="Quran Guidance">
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex gap-4">

        {/* ── Left: history panel ──────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-200
                        shadow-card flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span className="font-display font-semibold text-forest-900 text-sm">History</span>
          </div>

          {/* New Chat button */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                         bg-forest-800 text-white text-sm font-medium
                         hover:bg-forest-700 transition-colors duration-150 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {histLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-forest-200 border-t-forest-600
                                rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-xs text-gray-400">No conversations yet</p>
              </div>
            ) : (
              history.map((h) => {
                const item = resolveItem(h);
                const isActive = activeItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50
                                transition-colors group relative
                                ${isActive ? 'bg-amber-50 border-l-2 border-l-amber-400' : ''}`}
                  >
                    <p className={`text-xs font-medium truncate mb-0.5
                                   ${isActive ? 'text-amber-700' : 'text-gray-700'}`}>
                      {item.user_query}
                    </p>
                    <p className="text-[10px] text-gray-400">{relativeTime(item.created_at)}</p>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded
                                 text-gray-300 hover:text-red-400
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: chat panel ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200
                        shadow-card overflow-hidden min-w-0">

          {/* Chat body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
            {!displayItem && !thinking ? (
              <WelcomeState onPrompt={(p) => handleSend(p)} />
            ) : (
              <div className="space-y-6 max-w-3xl mx-auto">
                {displayItem && <ChatThread item={displayItem} />}
                {thinking && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-200
                                    flex-shrink-0 flex items-center justify-center shadow-sm">
                      <span style={{ fontFamily: 'Amiri, serif', color: '#92400e', fontSize: '14px' }}>ط</span>
                    </div>
                    <div className="rounded-xl bg-white border border-gray-200 shadow-sm">
                      <ThinkingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Share what is on your heart…"
                disabled={thinking}
                className="flex-1 resize-none bg-gray-50 border border-gray-200
                           rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400
                           focus:outline-none focus:border-forest-400 focus:ring-2
                           focus:ring-forest-100 transition-all duration-150
                           disabled:opacity-50 max-h-32 overflow-y-auto"
                style={{ minHeight: '46px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || thinking}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-forest-800 text-white
                           flex items-center justify-center transition-all duration-150
                           hover:bg-forest-700 disabled:opacity-40 disabled:cursor-not-allowed
                           shadow-sm"
                title="Send (Enter)"
              >
                {thinking ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Responses are grounded solely in the Quran · Press Enter to send
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default ChatbotPage;
