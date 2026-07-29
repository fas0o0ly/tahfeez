import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  session_started:       '🟢',
  session_cancelled:     '🔴',
  session_reminder:      '🔔',
  enrollment_approved:   '✅',
  enrollment_rejected:   '❌',
  new_message:           '✉️',
  assessment_ready:      '📋',
  progress_update:       '📈',
  account_status_changed:'⚙️',
  system:                '📢',
};

const relativeTime = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen]             = useState(false);
  const [count, setCount]           = useState(0);
  const [notifications, setNotifs]  = useState([]);
  const [loading, setLoading]       = useState(false);
  const dropdownRef                 = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setCount(res.data.data.count);
    } catch { /* silent — polling shouldn't toast on failure */ }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getRecent();
      setNotifs(res.data.data.notifications || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  // Fetch count on mount + every 30s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    if (!open) fetchRecent();
    setOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setCount(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotifClick = async (notif) => {
    // Mark as read
    if (!notif.is_read) {
      try {
        await notificationApi.markRead(notif.id);
        setCount((c) => Math.max(0, c - 1));
        setNotifs((prev) =>
          prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n)
        );
      } catch { /* best-effort */ }
    }

    setOpen(false);

    // Navigate to context using meta
    const meta = notif.meta || {};
    if (meta.session_id) {
      navigate(`/${user?.role}/sessions/${meta.session_id}`);
    } else if (meta.sender_id) {
      navigate(`/${user?.role}/messages`, { state: { openUserId: meta.sender_id } });
    } else {
      navigate(`/${user?.role}/notifications`);
    }
  };

  const displayCount = count > 99 ? '99+' : count;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100
                   transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
               6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388
               6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3
               3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                           flex items-center justify-center bg-red-500 text-white
                           text-[10px] font-bold rounded-full px-1 leading-none">
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl
                        shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center py-6">
                <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors
                              flex items-start gap-3 ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug truncate
                                   ${n.is_read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); navigate(`/${user?.role}/notifications`); }}
              className="text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
