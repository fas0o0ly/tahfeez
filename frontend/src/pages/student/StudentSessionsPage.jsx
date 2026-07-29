// src/pages/student/StudentSessionsPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSessions } from '../../hooks/useSessions';
import { sessionApi } from '../../api/sessionApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SessionCard from '../../components/common/SessionCard';
import TeacherProfileModal from '../../components/common/TeacherProfileModal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Spinner, EmptyState, Pagination } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const LANGUAGES = ['arabic','english','malay','urdu','french','other'];
const TYPES     = ['one_on_one','group','open'];

const StudentSessionsPage = () => {
  const { sessions, pagination, loading, error, filters, updateFilter, setPage, refetch } =
    useSessions();
  const [actionLoading, setActionLoading] = useState(null);
  const [teacherModalSessionId, setTeacherModalSessionId] = useState(null);

  const handleEnroll = async (sessionId) => {
    setActionLoading(sessionId + '_enroll');
    try {
      await sessionApi.enroll(sessionId);
      toast.success('Enrollment request sent — awaiting teacher approval');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Enrollment failed');
    } finally { setActionLoading(null); }
  };

  const handleWithdraw = async (sessionId) => {
    setActionLoading(sessionId + '_withdraw');
    try {
      await sessionApi.withdraw(sessionId);
      toast.success('You have withdrawn from this session');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Withdrawal failed');
    } finally { setActionLoading(null); }
  };

  const getAction = (session) => {
    const status = session.my_enrollment_status;
    const enrolledCount = parseInt(session.enrolled_count ?? 0, 10);
    const isFull = enrolledCount >= session.max_students;

    if (status === 'approved') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="success">✓ Enrolled</Badge>
          <Link
            to={`/student/sessions/${session.id}`}
            className="text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors"
          >
            View →
          </Link>
        </div>
      );
    }

    if (status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="pending">Pending approval</Badge>
          <Button
            variant="ghost"
            size="sm"
            loading={actionLoading === session.id + '_withdraw'}
            onClick={() => handleWithdraw(session.id)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            Withdraw
          </Button>
        </div>
      );
    }

    if (status === 'rejected') {
      return <Badge variant="error">Request rejected</Badge>;
    }

    if (isFull) {
      return <Badge variant="error">Full</Badge>;
    }

    if (!session.teacher_id) {
      return <span className="text-xs text-gray-400 italic">No teacher yet</span>;
    }

    return (
      <Button
        variant="primary"
        size="sm"
        loading={actionLoading === session.id + '_enroll'}
        onClick={() => handleEnroll(session.id)}
      >
        Request to Join
      </Button>
    );
  };

  return (
    <DashboardLayout title="Sessions">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-5">
          <h2 className="font-display text-2xl font-semibold text-forest-900">Sessions</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Sessions matched to your profile — filtered by your gender and language
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                       focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            value={filters.language}
            onChange={(e) => updateFilter('language', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                       focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Failed to load sessions" description={error} />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No sessions available"
            description="There are no sessions matching your profile right now. Check back later."
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sessions.map((session, i) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={i}
                  action={getAction(session)}
                  onViewTeacher={
                    session.my_enrollment_status === 'approved'
                      ? (s) => setTeacherModalSessionId(s.id)
                      : undefined
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

export default StudentSessionsPage;