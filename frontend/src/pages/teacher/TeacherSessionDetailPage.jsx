// src/pages/teacher/TeacherSessionDetailPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sessionApi } from '../../api/sessionApi';
import { attendanceApi } from '../../api/attendanceApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

// ─── Status change modal ───────────────────────────────────────────────────

const TEACHER_STATUS_OPTIONS = [
  { value: 'scheduled', labelKey: 'sessionDetail.statusModal.teacher.scheduled.label', descKey: 'sessionDetail.statusModal.teacher.scheduled.desc', color: 'amber' },
  { value: 'live',      labelKey: 'sessionDetail.statusModal.teacher.live.label',      descKey: 'sessionDetail.statusModal.teacher.live.desc',      color: 'green' },
  { value: 'completed', labelKey: 'sessionDetail.statusModal.teacher.completed.label', descKey: 'sessionDetail.statusModal.teacher.completed.desc', color: 'blue'  },
  { value: 'cancelled', labelKey: 'sessionDetail.statusModal.teacher.cancelled.label', descKey: 'sessionDetail.statusModal.teacher.cancelled.desc', color: 'red'   },
];

const colorMap = {
  amber: 'border-amber-500 bg-amber-50',
  green: 'border-emerald-500 bg-emerald-50',
  blue:  'border-blue-500 bg-blue-50',
  red:   'border-red-500 bg-red-50',
};

const StatusModal = ({ isOpen, onClose, currentStatus, onConfirm }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const options = TEACHER_STATUS_OPTIONS.filter((o) => o.value !== currentStatus);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    await onConfirm(selected);
    setSelected('');
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setSelected(''); }} title={t('sessionDetail.statusModal.title')} size="sm">
      <div className="space-y-2 mb-5">
        <p className="text-sm text-gray-500 mb-3">
          {t('sessionDetail.statusModal.currentStatus')}{' '}
          <span className="font-medium text-gray-700 capitalize">{currentStatus}</span>
        </p>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
              ${selected === opt.value ? colorMap[opt.color] : 'border-gray-200 hover:border-gray-300'}`}
          >
            <input
              type="radio"
              name="teacher_status"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
              className="mt-0.5 accent-forest-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{t(opt.labelKey)}</p>
              <p className="text-xs text-gray-400">{t(opt.descKey)}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={() => { onClose(); setSelected(''); }}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!selected}
          loading={loading}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
};

// ─── Status variant map ────────────────────────────────────────────────────

const statusVariant = {
  draft: 'info', scheduled: 'pending', live: 'success',
  completed: 'info', cancelled: 'error',
};

// ─── Main page ─────────────────────────────────────────────────────────────

const TeacherSessionDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Attendance state
  const today = new Date().toISOString().slice(0, 10);
  const [attendDate, setAttendDate]         = useState(today);
  const [occurrenceDates, setOccDates]      = useState([]);
  const [attendStudents, setAttendStudents] = useState([]);
  const [attendLoading, setAttendLoading]   = useState(false);
  const [attendDraft, setAttendDraft]       = useState({});
  const [attendSaving, setAttendSaving]     = useState(false);

  const load = async () => {
    try {
      const [sessionRes, enrollRes, datesRes] = await Promise.all([
        sessionApi.getSessionById(id),
        sessionApi.getEnrollments(id),
        attendanceApi.getSessionDates(id).catch(() => ({ data: { data: { dates: [] } } })),
      ]);
      setSession(sessionRes.data.data.session);
      setEnrollments(enrollRes.data.data.enrollments);
      setOccDates(datesRes.data.data.dates || []);
    } catch {
      toast.error(t('sessionDetail.failedLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const loadAttendance = useCallback(async (date) => {
    setAttendLoading(true);
    try {
      const res = await attendanceApi.getSessionAttendance(id, date);
      const students = res.data.data.students || [];
      setAttendStudents(students);
      const draft = {};
      students.forEach((s) => {
        draft[s.student_id] = {
          present: s.present ?? false,
          notes:   s.notes  ?? '',
        };
      });
      setAttendDraft(draft);
    } catch {
      toast.error(t('sessionDetail.teacher.attendance.failedLoad'));
    } finally {
      setAttendLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAttendance(attendDate); }, [attendDate, loadAttendance]);

  const handleSaveAttendance = async () => {
    setAttendSaving(true);
    try {
      await Promise.all(
        attendStudents.map((s) =>
          attendanceApi.upsertAttendance(id, s.student_id, {
            present: attendDraft[s.student_id]?.present ?? false,
            notes:   attendDraft[s.student_id]?.notes   || null,
            date:    attendDate,
          })
        )
      );
      toast.success(t('sessionDetail.teacher.attendance.saveSuccess'));
      const datesRes = await attendanceApi.getSessionDates(id);
      setOccDates(datesRes.data.data.dates || []);
    } catch {
      toast.error(t('sessionDetail.teacher.attendance.failedSave'));
    } finally {
      setAttendSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    setActionLoading('status');
    try {
      const { data } = await sessionApi.updateStatus(id, status);
      setSession(data.data.session);
      const messages = {
        live:      t('sessionDetail.teacher.statusMsg.live'),
        completed: t('sessionDetail.teacher.statusMsg.completed'),
        cancelled: t('sessionDetail.teacher.statusMsg.cancelled'),
      };
      toast.success(messages[status] || `Session ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally { setActionLoading(null); }
  };

  const handleEnrollmentAction = async (enrollmentId, status) => {
    setActionLoading(enrollmentId + status);
    try {
      await sessionApi.updateEnrollment(id, enrollmentId, status);
      setEnrollments((prev) =>
        prev.map((e) => e.id === enrollmentId ? { ...e, status } : e)
      );
      toast.success(`Student ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <DashboardLayout title={t('sessionDetail.details.title')}>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout title={t('sessionDetail.details.title')}>
        <EmptyState icon="📅" title={t('sessionDetail.notFound')} />
      </DashboardLayout>
    );
  }

  const pending  = enrollments.filter((e) => e.status === 'pending');
  const approved = enrollments.filter((e) => e.status === 'approved');
  const others   = enrollments.filter((e) => !['pending','approved'].includes(e.status));

  const profileFields = [
    { labelKey: 'sessionDetail.teacher.studentModal.gender',       value: viewStudent?.gender },
    { labelKey: 'sessionDetail.teacher.studentModal.language',     value: viewStudent?.preferred_language },
    { labelKey: 'sessionDetail.teacher.studentModal.age',          value: viewStudent?.age },
    { labelKey: 'sessionDetail.teacher.studentModal.level',        value: viewStudent?.current_level },
    { labelKey: 'sessionDetail.teacher.studentModal.juz',          value: viewStudent?.total_juz_memorized },
    { labelKey: 'sessionDetail.teacher.studentModal.guardian',     value: viewStudent?.guardian_name },
    { labelKey: 'sessionDetail.teacher.studentModal.guardianPhone',value: viewStudent?.guardian_phone },
  ];

  return (
    <DashboardLayout title={t('sessionDetail.details.title')}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-4xl mx-auto"
      >
        <Link
          to="/teacher/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-forest-600 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('sessionDetail.back')}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display text-2xl font-semibold text-forest-900">
                  {session.title}
                </h2>
                <Badge variant={statusVariant[session.status]}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(session.scheduled_at).toLocaleString('en-MY', {
                  weekday:'short', day:'numeric', month:'short',
                  year:'numeric', hour:'2-digit', minute:'2-digit',
                })}
                {' · '}{session.duration_minutes} min
                {' · '}{session.session_language}
                {' · '}{session.session_gender}
              </p>
            </div>

            {session.status !== 'draft' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {session.status === 'scheduled' && (
                  <button
                    disabled={actionLoading === 'status'}
                    onClick={async () => {
                      await handleStatusChange('live');
                      navigate(`/sessions/${id}/live`);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500
                               disabled:opacity-60 disabled:cursor-not-allowed
                               text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                               transition-colors shadow-sm"
                  >
                    {actionLoading === 'status' ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                    {t('sessionDetail.teacher.startSession')}
                  </button>
                )}
                {session.status === 'live' && (
                  <button
                    onClick={() => navigate(`/sessions/${id}/live`)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500
                               text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                               transition-colors shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    {t('sessionDetail.teacher.rejoinSession')}
                  </button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowStatusModal(true)}
                >
                  {t('sessionDetail.header.changeStatus')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment management */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-display font-semibold text-forest-900">
              {t('sessionDetail.teacher.enrollments.title')}
            </h3>
            <div className="flex gap-2">
              <Badge variant="pending">{pending.length} pending</Badge>
              <Badge variant="success">{approved.length} approved</Badge>
            </div>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState icon="👤" title={t('sessionDetail.enrollments.empty')} />
          ) : (
            <div className="space-y-2">
              {/* Pending first */}
              {pending.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                    {t('sessionDetail.teacher.enrollments.pending')}
                  </p>
                  <AnimatePresence>
                    {pending.map((e) => (
                      <motion.div
                        key={e.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="flex items-center gap-3 p-3 rounded-xl
                                   bg-amber-50 border border-amber-100 mb-2"
                      >
                        <Avatar src={e.avatar_url} name={e.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {e.full_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {e.current_level || t('sessionDetail.teacher.noLevel')}
                            {e.age ? ` · Age ${e.age}` : ''}
                            {e.total_juz_memorized > 0 && ` · ${e.total_juz_memorized} Juz`}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setViewStudent(e)}
                            className="text-xs text-gray-400 hover:text-forest-600 transition-colors"
                          >
                            {t('sessionDetail.teacher.profileLink')}
                          </button>
                          <Button
                            variant="danger"
                            size="sm"
                            loading={actionLoading === e.id + 'rejected'}
                            onClick={() => handleEnrollmentAction(e.id, 'rejected')}
                          >
                            {t('sessionDetail.teacher.rejectBtn')}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoading === e.id + 'approved'}
                            onClick={() => handleEnrollmentAction(e.id, 'approved')}
                          >
                            {t('sessionDetail.teacher.approveBtn')}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Approved */}
              {approved.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
                    {t('sessionDetail.teacher.enrollments.approved', { count: approved.length, max: session.max_students })}
                  </p>
                  {approved.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl
                                               hover:bg-gray-50 transition-colors mb-1">
                      <Avatar src={e.avatar_url} name={e.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.full_name}</p>
                        <p className="text-xs text-gray-400">
                          {e.current_level || t('sessionDetail.teacher.noLevel')}
                          {e.age ? ` · Age ${e.age}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewStudent(e)}
                          className="text-xs text-forest-600 hover:text-forest-800
                                     font-medium transition-colors"
                        >
                          {t('sessionDetail.teacher.profileLink')}
                        </button>
                        <Link
                          to={`/teacher/students/${e.student_id}/assessments`}
                          className="text-xs text-gold-600 hover:text-gold-700
                                     font-medium transition-colors"
                        >
                          {t('sessionDetail.teacher.assessmentsLink')}
                        </Link>
                        <Badge variant="success">Approved</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejected / withdrawn */}
              {others.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {t('sessionDetail.teacher.enrollments.rejected')}
                  </p>
                  {others.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl
                                               opacity-50 mb-1">
                      <Avatar src={e.avatar_url} name={e.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 truncate">{e.full_name}</p>
                      </div>
                      <Badge variant={e.status === 'rejected' ? 'error' : 'info'}>
                        {e.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attendance section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-display font-semibold text-forest-900">
              {t('sessionDetail.teacher.attendance.title')}
            </h3>
            <input
              type="date"
              value={attendDate}
              onChange={(e) => e.target.value && setAttendDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5
                         focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </div>

          {attendLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : attendStudents.length === 0 ? (
            <EmptyState
              icon="📅"
              title={t('sessionDetail.teacher.attendance.empty.title')}
              description={t('sessionDetail.teacher.attendance.empty.desc')}
            />
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {attendStudents.map((s) => {
                  const draft = attendDraft[s.student_id] || {};
                  const isPresent = draft.present ?? false;
                  return (
                    <div key={s.student_id}
                         className="flex flex-col sm:flex-row sm:items-center gap-3 p-3
                                    rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar src={s.avatar_url} name={s.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.full_name}</p>
                          {s.duration_seconds > 0 && (
                            <p className="text-xs text-gray-400">
                              {Math.floor(s.duration_seconds / 60)} min in session
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() =>
                            setAttendDraft((prev) => ({
                              ...prev,
                              [s.student_id]: { ...prev[s.student_id], present: !isPresent },
                            }))
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                      text-xs font-semibold transition-colors
                                      ${isPresent
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          {isPresent
                            ? t('sessionDetail.teacher.attendance.present')
                            : t('sessionDetail.teacher.attendance.absent')}
                        </button>

                        <input
                          type="text"
                          value={draft.notes || ''}
                          onChange={(e) =>
                            setAttendDraft((prev) => ({
                              ...prev,
                              [s.student_id]: { ...prev[s.student_id], notes: e.target.value },
                            }))
                          }
                          placeholder={t('sessionDetail.teacher.attendance.notePlaceholder')}
                          className="hidden sm:block text-xs border border-gray-200 rounded-lg
                                     px-2.5 py-1.5 w-40 focus:outline-none focus:ring-2
                                     focus:ring-forest-200 focus:border-forest-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  loading={attendSaving}
                  onClick={handleSaveAttendance}
                >
                  {t('sessionDetail.teacher.attendance.saveBtn')}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Status change modal */}
      <StatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={session?.status}
        onConfirm={async (status) => {
          await handleStatusChange(status);
          setShowStatusModal(false);
        }}
      />

      {/* Student profile modal */}
      <Modal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title={t('sessionDetail.teacher.studentModal.title')}
        size="sm"
      >
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={viewStudent.avatar_url} name={viewStudent.full_name} size="lg" />
              <div>
                <p className="font-semibold text-gray-800">{viewStudent.full_name}</p>
                <p className="text-sm text-gray-400">{viewStudent.email}</p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {profileFields.map(({ labelKey, value }) =>
                value ? (
                  <div key={labelKey} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-400">{t(labelKey)}</span>
                    <span className="text-gray-700 capitalize">{value}</span>
                  </div>
                ) : null
              )}
            </div>
            {viewStudent.notes && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                {viewStudent.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default TeacherSessionDetailPage;
