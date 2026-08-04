import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  session_started:        '🟢',
  session_cancelled:      '🔴',
  session_reminder:       '🔔',
  enrollment_approved:    '✅',
  enrollment_rejected:    '❌',
  new_message:            '✉️',
  assessment_ready:       '📋',
  progress_update:        '📈',
  account_status_changed: '⚙️',
  system:                 '📢',
};

const relativeTime = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const NotificationsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [notifications, setNotifs] = useState([]);
  const [loading, setLoading]      = useState(true);
  const [unreadOnly, setUnreadOnly]= useState(false);
  const [page, setPage]            = useState(1);
  const [totalPages, setTotalPages]= useState(1);
  const [markingAll, setMarkingAll]= useState(false);

  const load = useCallback(async (pg = 1, unread = false) => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll({
        page: pg,
        limit: 20,
        ...(unread && { unread: 'true' }),
      });
      const d = res.data.data;
      setNotifs(d.rows || []);
      setTotalPages(d.total_pages || 1);
      setPage(pg);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, unreadOnly); }, [unreadOnly, load]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) await handleMarkRead(notif.id);
    const meta = notif.meta || {};
    if (meta.session_id) {
      navigate(`/${user?.role}/sessions/${meta.session_id}`);
    } else if (meta.sender_id) {
      navigate(`/${user?.role}/messages`, { state: { openUserId: meta.sender_id } });
    }
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <DashboardLayout title={t('notifications.title')}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between
                          gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <h2 className="font-display font-semibold text-forest-900">{t('notifications.title')}</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setUnreadOnly(false)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors
                              ${!unreadOnly
                                ? 'bg-forest-600 text-white'
                                : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {t('notifications.all')}
                </button>
                <button
                  onClick={() => setUnreadOnly(true)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors
                              ${unreadOnly
                                ? 'bg-forest-600 text-white'
                                : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {t('notifications.unread')}
                </button>
              </div>
            </div>
            {hasUnread && (
              <Button
                variant="secondary"
                size="sm"
                loading={markingAll}
                onClick={handleMarkAllRead}
              >
                {t('notifications.markAllRead')}
              </Button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : notifications.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon="🔔"
                title={unreadOnly ? t('notifications.noUnread') : t('notifications.empty')}
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors
                              ${!n.is_read ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || '🔔'}
                  </span>

                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => handleNotifClick(n)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm leading-snug
                                     ${n.is_read ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <Badge variant="info">{t('notifications.new')}</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{relativeTime(n.created_at)}</p>
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-forest-600
                                   hover:bg-gray-100 transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500
                                 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                           stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                             L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 px-6 py-4 border-t border-gray-100">
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1, unreadOnly)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200
                           disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                {t('notifications.prev')}
              </button>
              <span className="text-xs text-gray-400">{t('notifications.page', { page, total: totalPages })}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => load(page + 1, unreadOnly)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200
                           disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                {t('notifications.next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
