import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { messageApi } from '../../api/messageApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const relativeTime = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
};

// ─── Compose Modal ───────────────────────────────────────────────────────────
const ComposeModal = ({ isOpen, onClose, onSent }) => {
  const { t } = useTranslation();
  const [contacts, setContacts]     = useState([]);
  const [recipientId, setRecipient] = useState('');
  const [subject, setSubject]       = useState('');
  const [content, setContent]       = useState('');
  const [sending, setSending]       = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    messageApi.getContacts()
      .then((r) => setContacts(r.data.data.contacts || []))
      .catch(() => {});
  }, [isOpen]);

  const handleSend = async () => {
    if (!recipientId || !content.trim()) return;
    setSending(true);
    try {
      await messageApi.sendMessage({
        recipient_id: recipientId,
        subject: subject.trim() || undefined,
        content: content.trim(),
      });
      toast.success(t('messages.sent'));
      setRecipient(''); setSubject(''); setContent('');
      onSent(recipientId);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('messages.failedToSend'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('messages.compose.title')} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('messages.compose.to')}</label>
          <select
            value={recipientId}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-forest-200"
          >
            <option value="">{t('messages.compose.selectRecipient')}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.role})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('messages.compose.subject')}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={255}
            placeholder={t('messages.compose.subjectPlaceholder')}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('messages.compose.message')}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder={t('messages.compose.messagePlaceholder')}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2
                       focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="primary"
            size="sm"
            loading={sending}
            disabled={!recipientId || !content.trim()}
            onClick={handleSend}
          >
            {t('messages.send')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────
const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const [conversations, setConvos] = useState([]);
  const [convLoading, setConvLoad] = useState(true);
  const [activeUserId, setActive]  = useState(null);
  const [activeUser, setActiveUser]= useState(null);
  const [messages, setMessages]    = useState([]);
  const [threadLoading, setThreadL]= useState(false);
  const [reply, setReply]          = useState('');
  const [sending, setSending]      = useState(false);
  const [showCompose, setCompose]  = useState(false);
  const bottomRef                  = useRef(null);

  const loadInbox = useCallback(async () => {
    setConvLoad(true);
    try {
      const res = await messageApi.getInbox();
      setConvos(res.data.data.conversations || []);
    } catch { toast.error(t('messages.failedToLoad')); }
    finally { setConvLoad(false); }
  }, []);

  const openConversation = useCallback(async (otherUserId, otherUserInfo = null) => {
    setActive(otherUserId);
    if (otherUserInfo) setActiveUser(otherUserInfo);
    setThreadL(true);
    try {
      const res = await messageApi.getConversation(otherUserId);
      setMessages(res.data.data.messages || []);
      // Update inbox to clear unread count for this conversation
      setConvos((prev) =>
        prev.map((c) => c.other_user_id === otherUserId ? { ...c, unread_count: 0 } : c)
      );
    } catch { toast.error(t('messages.failedConversation')); }
    finally { setThreadL(false); }
  }, []);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  // Handle navigation from notification bell (state.openUserId)
  useEffect(() => {
    if (location.state?.openUserId) {
      openConversation(location.state.openUserId);
    }
  }, [location.state, openConversation]);

  // Scroll thread to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async () => {
    if (!reply.trim() || !activeUserId) return;
    setSending(true);
    try {
      await messageApi.sendMessage({ recipient_id: activeUserId, content: reply.trim() });
      setReply('');
      // Refresh thread
      const res = await messageApi.getConversation(activeUserId);
      setMessages(res.data.data.messages || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleComposeSent = (recipientId) => {
    loadInbox();
    openConversation(recipientId);
  };

  return (
    <DashboardLayout title="Messages">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex gap-4">

        {/* ── Left panel: conversation list ──────────────────────────── */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100
                        shadow-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-display font-semibold text-forest-900 text-sm">{t('messages.inbox')}</span>
            <button
              onClick={() => setCompose(true)}
              className="p-1.5 rounded-lg text-forest-600 hover:bg-forest-50 transition-colors"
              title="New message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {convLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : conversations.length === 0 ? (
              <div className="py-10">
                <EmptyState icon="✉️" title={t('messages.noConversations.title')} description={t('messages.noConversations.desc')} />
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.other_user_id}
                  onClick={() => openConversation(c.other_user_id, c)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors
                              flex items-center gap-3
                              ${activeUserId === c.other_user_id ? 'bg-forest-50' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={c.other_avatar} name={c.other_name} size="sm" />
                    {parseInt(c.unread_count) > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500
                                       rounded-full flex items-center justify-center
                                       text-[9px] text-white font-bold">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate
                                     ${parseInt(c.unread_count) > 0 ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                        {c.other_name}
                      </p>
                      <span className="text-[10px] text-gray-300 flex-shrink-0 ml-1">
                        {relativeTime(c.last_sent_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_content}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right panel: thread ────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-card
                        flex flex-col overflow-hidden min-w-0">
          {!activeUserId ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon="💬"
                title={t('messages.selectConversation.title')}
                description={t('messages.selectConversation.desc')}
              />
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Avatar src={activeUser?.other_avatar} name={activeUser?.other_name} size="sm" />
                <p className="font-medium text-gray-800 text-sm">
                  {activeUser?.other_name || '…'}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {threadLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <EmptyState icon="💬" title={t('messages.noMessages.title')} description={t('messages.noMessages.desc')} />
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <Avatar src={m.sender_avatar} name={m.sender_name} size="xs"
                                  className="mr-2 flex-shrink-0 self-end" />
                        )}
                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm
                                         ${isMe
                                           ? 'bg-forest-600 text-white rounded-br-sm'
                                           : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                          {m.subject && (
                            <p className={`text-xs font-semibold mb-1
                                           ${isMe ? 'text-forest-100' : 'text-gray-500'}`}>
                              {m.subject}
                            </p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          <p className={`text-[10px] mt-1 text-right
                                         ${isMe ? 'text-forest-200' : 'text-gray-400'}`}>
                            {new Date(m.created_at).toLocaleTimeString('en-MY', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply bar */}
              <div className="border-t border-gray-100 px-4 py-3 flex gap-2 items-end">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  rows={2}
                  maxLength={5000}
                  placeholder={t('messages.replyPlaceholder')}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-forest-200 resize-none"
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={sending}
                  disabled={!reply.trim()}
                  onClick={handleSendReply}
                >
                  {t('messages.send')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ComposeModal
        isOpen={showCompose}
        onClose={() => setCompose(false)}
        onSent={handleComposeSent}
      />
    </DashboardLayout>
  );
};

export default MessagesPage;
