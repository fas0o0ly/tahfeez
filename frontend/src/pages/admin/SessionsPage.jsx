// src/pages/admin/SessionsPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSessions } from '../../hooks/useSessions';
import { sessionApi } from '../../api/sessionApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SessionCard from '../../components/common/SessionCard';
import TeacherProfileModal from '../../components/common/TeacherProfileModal';
import Button from '../../components/common/Button';
import { Spinner, EmptyState, Pagination } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const TYPES     = ['one_on_one','group','open'];
const STATUSES  = ['draft','scheduled','live','completed','cancelled'];
const LANGUAGES = ['arabic','english','malay','urdu','french','other'];
const GENDERS   = ['male','female'];

const FilterBar = ({ filters, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {/* Type */}
    <select
      value={filters.type}
      onChange={(e) => onChange('type', e.target.value)}
      className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                 focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
    >
      <option value="">All types</option>
      {TYPES.map((t) => (
        <option key={t} value={t}>{t.replace('_', ' ')}</option>
      ))}
    </select>

    {/* Status */}
    <select
      value={filters.status}
      onChange={(e) => onChange('status', e.target.value)}
      className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                 focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
    >
      <option value="">All statuses</option>
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>

    {/* Language */}
    <select
      value={filters.language}
      onChange={(e) => onChange('language', e.target.value)}
      className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                 focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
    >
      <option value="">All languages</option>
      {LANGUAGES.map((l) => (
        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
      ))}
    </select>

    {/* Gender */}
    <select
      value={filters.gender}
      onChange={(e) => onChange('gender', e.target.value)}
      className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                 focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
    >
      <option value="">All genders</option>
      {GENDERS.map((g) => (
        <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
      ))}
    </select>
  </div>
);

const SessionsPage = () => {
  const { sessions, pagination, loading, error, filters, updateFilter, setPage, refetch } = useSessions();
  const [actionLoading, setActionLoading] = useState(null);
  const [teacherModalSessionId, setTeacherModalSessionId] = useState(null);

  const handleCancel = async (id) => {
    setActionLoading(id);
    try {
      await sessionApi.updateStatus(id, 'cancelled');
      toast.success('Session cancelled');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel session');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout title="Sessions">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-900">Sessions</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {pagination ? `${pagination.total} total sessions` : 'Loading...'}
            </p>
          </div>
          <Link to="/admin/sessions/create">
            <Button variant="primary" size="md">+ New Session</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <FilterBar filters={filters} onChange={updateFilter} />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Failed to load sessions" description={error} />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No sessions found"
            description="Create your first session to get started"
            action={
              <Link to="/admin/sessions/create">
                <Button variant="primary" size="sm">Create Session</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sessions.map((session, i) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={i}
                  to={`/admin/sessions/${session.id}`}
                  onViewTeacher={(s) => setTeacherModalSessionId(s.id)}
                  action={
                    !['completed','cancelled'].includes(session.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={actionLoading === session.id}
                        onClick={() => handleCancel(session.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )
                  }
                />
              ))}
            </div>

            <div className="mt-6">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          </>
        )}

        <TeacherProfileModal
          isOpen={!!teacherModalSessionId}
          onClose={() => setTeacherModalSessionId(null)}
          sessionId={teacherModalSessionId}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default SessionsPage;