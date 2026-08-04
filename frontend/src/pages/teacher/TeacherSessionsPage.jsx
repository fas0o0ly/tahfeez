// src/pages/teacher/TeacherSessionsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sessionApi } from '../../api/sessionApi';
import { useSessions } from '../../hooks/useSessions';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SessionCard from '../../components/common/SessionCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Spinner, EmptyState, Pagination } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

// ─── My sessions tab ───────────────────────────────────────────────────────

const MySessionsTab = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const { data } = await sessionApi.getMyTeacherSessions();
      setSessions(data.data.sessions);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStart = async (id) => {
    setActionLoading(id);
    try {
      await sessionApi.updateStatus(id, 'live');
      setSessions((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: 'live' } : s)
      );
      toast.success('Session is now live!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start session');
    } finally { setActionLoading(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title={t('sessions.teacher.noSessions.title')}
        description={t('sessions.teacher.noSessions.desc')}
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sessions.map((session, i) => (
        <SessionCard
          key={session.id}
          session={session}
          index={i}
          to={`/teacher/sessions/${session.id}`}
          action={
            session.status === 'scheduled' && (
              <Button
                variant="primary"
                size="sm"
                loading={actionLoading === session.id}
                onClick={() => handleStart(session.id)}
              >
                {t('sessions.teacher.startSession')}
              </Button>
            )
          }
        />
      ))}
    </div>
  );
};

// ─── Available sessions tab ────────────────────────────────────────────────

const AvailableSessionsTab = () => {
  const { t } = useTranslation();
  const { sessions, pagination, loading, error, filters, updateFilter, setPage } =
    useSessions({ status: 'draft' });
  const [requestLoading, setRequestLoading] = useState(null);
  const [requested, setRequested] = useState(new Set());

  const handleRequest = async (id) => {
    setRequestLoading(id);
    try {
      await sessionApi.requestToTeach(id);
      setRequested((prev) => new Set([...prev, id]));
      toast.success(t('sessions.teacher.requestSubmitted'));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Request failed');
    } finally { setRequestLoading(null); }
  };

  // Only show draft sessions with no teacher
  const available = sessions.filter((s) => !s.teacher_id || !s.teacher_name);

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (error)   return <EmptyState icon="⚠️" title="Failed to load" description={error} />;

  if (available.length === 0) {
    return (
      <EmptyState
        icon="📭"
        title={t('sessions.teacher.noAvailable.title')}
        description={t('sessions.teacher.noAvailable.desc')}
      />
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {available.map((session, i) => (
          <SessionCard
            key={session.id}
            session={session}
            index={i}
            action={
              requested.has(session.id) ? (
                <Badge variant="pending">{t('sessions.teacher.requestSent')}</Badge>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={requestLoading === session.id}
                  onClick={() => handleRequest(session.id)}
                >
                  {t('sessions.teacher.requestToTeach')}
                </Button>
              )
            }
          />
        ))}
      </div>
      {pagination && (
        <div className="mt-6">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────

const TeacherSessionsPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState('my');

  return (
    <DashboardLayout title={t('sessions.title')}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-forest-900">{t('sessions.title')}</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {t('sessions.teacher.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {[
            { key: 'my',        label: t('sessions.teacher.tabs.my') },
            { key: 'available', label: t('sessions.teacher.tabs.available') },
          ].map((tab_item) => (
            <button
              key={tab_item.key}
              onClick={() => setTab(tab_item.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${tab === tab_item.key
                  ? 'bg-white text-forest-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab_item.label}
            </button>
          ))}
        </div>

        {tab === 'my'        && <MySessionsTab />}
        {tab === 'available' && <AvailableSessionsTab />}
      </motion.div>
    </DashboardLayout>
  );
};

export default TeacherSessionsPage;