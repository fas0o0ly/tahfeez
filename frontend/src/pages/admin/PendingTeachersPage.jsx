// src/pages/admin/PendingTeachersPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '../../api/userApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

// ─── Teacher card ──────────────────────────────────────────────────────────

const TeacherCard = ({ teacher, onApprove, onReject, loading }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) : '—';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar src={teacher.avatar_url} name={teacher.full_name} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-display font-semibold text-forest-900 text-lg leading-tight">
                {teacher.full_name}
              </h3>
              <Badge variant="pending">Pending</Badge>
            </div>
            <p className="text-sm text-gray-500">{teacher.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Applied {formatDate(teacher.created_at)}
            </p>

            {/* Quick info chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.years_experience && (
                <span className="text-xs bg-forest-50 text-forest-600 px-2.5 py-1 rounded-full">
                  {teacher.years_experience} yrs experience
                </span>
              )}
              {teacher.timezone && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {teacher.timezone}
                </span>
              )}
              {teacher.ijazah_chain && (
                <span className="text-xs bg-gold-50 text-gold-700 px-2.5 py-1 rounded-full border border-gold-200">
                  Has Ijazah chain
                </span>
              )}
              {teacher.cv_url && (
                <a
                  href={teacher.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  View CV →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-xs text-gray-400 hover:text-forest-600
                     transition-colors flex items-center gap-1"
        >
          {expanded ? 'Hide details' : 'Show more details'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {teacher.bio && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{teacher.bio}</p>
                  </div>
                )}
                {teacher.qualifications && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Qualifications
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{teacher.qualifications}</p>
                  </div>
                )}
                {teacher.specializations?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.specializations.map((s) => (
                        <Badge key={s} variant="teacher">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {teacher.ijazah_chain && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Ijazah Chain
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">{teacher.ijazah_chain}</p>
                  </div>
                )}
                {teacher.available_days?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Available Days
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.available_days.map((d) => (
                        <span key={d} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action footer */}
      <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100
                      flex items-center justify-between gap-3">
        <Link
          to={`/admin/users/${teacher.id}`}
          className="text-xs text-gray-400 hover:text-forest-600 transition-colors"
        >
          Full profile →
        </Link>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={loading === teacher.id + '_reject'}
            onClick={() => onReject(teacher.id)}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading === teacher.id + '_approve'}
            onClick={() => onApprove(teacher.id)}
          >
            Approve
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────

const PendingTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userApi.getPendingTeachers();
        setTeachers(data.data.teachers);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load pending teachers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try {
      await userApi.updateUserStatus(id, 'active');
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      toast.success('Teacher approved successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id + '_reject');
    try {
      await userApi.updateUserStatus(id, 'banned');
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      toast.success('Teacher rejected');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout title="Pending Approvals">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-900">
              Pending Approvals
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Review and approve teacher account applications
            </p>
          </div>
          {!loading && teachers.length > 0 && (
            <Badge variant="pending">{teachers.length} pending</Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Failed to load" description={error} />
        ) : teachers.length === 0 ? (
          <EmptyState
            icon="✅"
            title="All caught up"
            description="There are no pending teacher applications right now."
          />
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  loading={actionLoading}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PendingTeachersPage;