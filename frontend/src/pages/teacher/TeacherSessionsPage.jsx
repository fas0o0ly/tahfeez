// src/pages/teacher/TeacherSessionsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
        title="No sessions assigned"
        description="You have no sessions yet. Request to teach an available session below."
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
                Start Session
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
  const { sessions, pagination, loading, error, filters, updateFilter, setPage } =
    useSessions({ status: 'draft' });
  const [requestLoading, setRequestLoading] = useState(null);
  const [requested, setRequested] = useState(new Set());

  const handleRequest = async (id) => {
    setRequestLoading(id);
    try {
      await sessionApi.requestToTeach(id);
      setRequested((prev) => new Set([...prev, id]));
      toast.success('Request submitted — awaiting admin approval');
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
        title="No available sessions"
        description="There are no unassigned sessions right now. Check back later."
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
                <Badge variant="pending">Request sent</Badge>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={requestLoading === session.id}
                  onClick={() => handleRequest(session.id)}
                >
                  Request to Teach
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
  const [tab, setTab] = useState('my');

  return (
    <DashboardLayout title="Sessions">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-forest-900">Sessions</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage your sessions and request new ones
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {[
            { key: 'my',        label: 'My Sessions' },
            { key: 'available', label: 'Available to Teach' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${tab === t.key
                  ? 'bg-white text-forest-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t.label}
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