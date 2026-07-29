// src/pages/student/StudentSessionDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sessionApi } from '../../api/sessionApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const statusVariant = {
  draft: 'info', scheduled: 'pending', live: 'success',
  completed: 'info', cancelled: 'error',
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-36 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-700 text-right flex-1">
      {value ?? <span className="text-gray-300 italic">Not set</span>}
    </span>
  </div>
);

const StudentSessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = async () => {
    try {
      const { data } = await sessionApi.getSessionById(id);
      setSession(data.data.session);

      // Load teacher profile if student is enrolled
      if (data.data.session.my_enrollment_status === 'approved') {
        try {
          const teacherRes = await sessionApi.getSessionTeacherProfile(id);
          setTeacher(teacherRes.data.data.teacher);
        } catch { /* not enrolled or no teacher */ }
      }
    } catch (err) {
      toast.error('Session not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleEnroll = async () => {
    setActionLoading('enroll');
    try {
      await sessionApi.enroll(id);
      toast.success('Enrollment request sent — awaiting teacher approval');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Enrollment failed');
    } finally { setActionLoading(null); }
  };

  const handleWithdraw = async () => {
    setActionLoading('withdraw');
    try {
      await sessionApi.withdraw(id);
      toast.success('You have withdrawn from this session');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Withdrawal failed');
    } finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Session Detail">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout title="Session Detail">
        <EmptyState icon="📅" title="Session not found" />
      </DashboardLayout>
    );
  }

  const enrollmentStatus = session.my_enrollment_status;
  const enrolledCount    = parseInt(session.enrolled_count ?? 0, 10);
  const isFull           = enrolledCount >= session.max_students;

  return (
    <DashboardLayout title="Session Detail">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        <Link
          to="/student/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-forest-600 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display text-2xl font-semibold text-forest-900">
                  {session.title}
                </h2>
                <Badge variant={statusVariant[session.status]}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </div>
              {session.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{session.description}</p>
              )}
            </div>

            {/* Enrollment action */}
            <div className="flex-shrink-0">
              {enrollmentStatus === 'approved' && (
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="success">✓ You are enrolled</Badge>
                  {session.status === 'live' ? (
                    <button
                      onClick={() => navigate(`/sessions/${id}/live`)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500
                                 text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                                 transition-colors shadow-sm animate-pulse"
                    >
                      <span className="w-2 h-2 rounded-full bg-white" />
                      Join Live Session
                    </button>
                  ) : (
                    <p className="text-xs text-gray-400">Waiting for session to start</p>
                  )}
                </div>
              )}
              {enrollmentStatus === 'pending' && (
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="pending">Request pending</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={actionLoading === 'withdraw'}
                    onClick={handleWithdraw}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Withdraw request
                  </Button>
                </div>
              )}
              {enrollmentStatus === 'rejected' && (
                <Badge variant="error">Enrollment rejected</Badge>
              )}
              {!enrollmentStatus && (
                isFull
                  ? <Badge variant="error">Session is full</Badge>
                  : !session.teacher_id
                  ? <span className="text-xs text-gray-400">No teacher assigned yet</span>
                  : (
                    <Button
                      variant="primary"
                      size="md"
                      loading={actionLoading === 'enroll'}
                      onClick={handleEnroll}
                    >
                      Request to Join
                    </Button>
                  )
              )}
            </div>
          </div>
        </div>

        {/* Session info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <h3 className="font-display font-semibold text-forest-900 mb-4 pb-3 border-b border-gray-100">
            Session Information
          </h3>
          <InfoRow label="Type" value={session.session_type?.replace('_', ' ')} />
          <InfoRow label="Language" value={session.session_language} />
          <InfoRow label="Gender" value={session.session_gender} />
          <InfoRow
            label="Age Range"
            value={
              session.age_range_min || session.age_range_max
                ? `${session.age_range_min ?? '?'} – ${session.age_range_max ?? '?'} years`
                : 'All ages'
            }
          />
          <InfoRow label="Duration" value={`${session.duration_minutes} minutes`} />
          <InfoRow label="Capacity" value={`${enrolledCount} / ${session.max_students} students`} />
          <InfoRow
            label="Schedule"
            value={new Date(session.scheduled_at).toLocaleString('en-MY', {
              weekday: 'long', day: 'numeric', month: 'long',
              year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          />
          {session.session_days?.length > 0 && (
            <InfoRow
              label="Recurring"
              value={session.session_days
                .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                .join(', ')}
            />
          )}
        </div>

        {/* Teacher info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <h3 className="font-display font-semibold text-forest-900 mb-4 pb-3 border-b border-gray-100">
            Teacher
          </h3>
          {session.teacher_name ? (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={session.teacher_avatar} name={session.teacher_name} size="lg" />
                <div>
                  <p className="font-medium text-gray-800">{session.teacher_name}</p>
                  {session.teacher_ijazah_verified && (
                    <Badge variant="gold" className="mt-1">✓ Ijazah Verified</Badge>
                  )}
                </div>
              </div>

              {/* Full profile — only visible to enrolled students */}
              {teacher && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {teacher.bio && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{teacher.bio}</p>
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
                  {teacher.years_experience && (
                    <p className="text-sm text-gray-500">
                      {teacher.years_experience} years of teaching experience
                    </p>
                  )}
                </div>
              )}

              {enrollmentStatus && enrollmentStatus !== 'approved' && (
                <p className="text-xs text-gray-400 mt-3 italic">
                  Full teacher profile visible after enrollment approval
                </p>
              )}
              {!enrollmentStatus && (
                <p className="text-xs text-gray-400 mt-3 italic">
                  Enroll to view full teacher profile
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No teacher assigned yet</p>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentSessionDetailPage;