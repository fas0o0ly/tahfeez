// src/pages/admin/AdminSessionDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionApi } from '../../api/sessionApi';
import { userApi } from '../../api/userApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const DAYS      = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const LANGUAGES = ['arabic','english','malay','urdu','french','other'];

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

const SelectField = ({ label, name, value, onChange, disabled, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select
      name={name}
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                 focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                 transition-all disabled:bg-gray-50 text-gray-800"
    >
      {children}
    </select>
  </div>
);

// ─── Status change modal ───────────────────────────────────────────────────

const STATUS_OPTIONS = {
  admin: [
    { value: 'scheduled', label: 'Scheduled', desc: 'Mark as scheduled and ready',     color: 'amber' },
    { value: 'live',      label: 'Live',       desc: 'Set session as live/in-progress', color: 'green' },
    { value: 'completed', label: 'Completed',  desc: 'Mark session as done',            color: 'blue'  },
    { value: 'cancelled', label: 'Cancelled',  desc: 'Cancel this session',             color: 'red'   },
  ],
  teacher: [
    { value: 'scheduled', label: 'Scheduled',     desc: 'Move back to scheduled',          color: 'amber' },
    { value: 'live',      label: 'Start Session',  desc: 'Open the session for students',   color: 'green' },
    { value: 'completed', label: 'End Session',    desc: 'Mark session as completed',       color: 'blue'  },
    { value: 'cancelled', label: 'Cancel Session', desc: 'Cancel this session',             color: 'red'   },
  ],
};

const colorMap = {
  green: 'border-emerald-500 bg-emerald-50',
  amber: 'border-amber-500 bg-amber-50',
  blue:  'border-blue-500 bg-blue-50',
  red:   'border-red-500 bg-red-50',
};

const StatusModal = ({ isOpen, onClose, currentStatus, onConfirm, role = 'admin' }) => {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const options = (STATUS_OPTIONS[role] || STATUS_OPTIONS.admin)
    .filter((o) => o.value !== currentStatus);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    await onConfirm(selected);
    setSelected('');
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setSelected(''); }} title="Change Session Status" size="sm">
      <div className="space-y-2 mb-5">
        <p className="text-sm text-gray-500 mb-3">
          Current status:{' '}
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
              name="session_status"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
              className="mt-0.5 accent-forest-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.desc}</p>
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

// ─── Edit session modal (admin only) ──────────────────────────────────────

const EditSessionModal = ({ session, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title:            session.title            ?? '',
    description:      session.description      ?? '',
    session_type:     session.session_type     ?? 'group',
    scheduled_at:     session.scheduled_at
      ? new Date(session.scheduled_at).toISOString().slice(0, 16)
      : '',
    session_days:     session.session_days     ?? [],
    duration_minutes: session.duration_minutes ?? 60,
    max_students:     session.max_students     ?? 10,
    session_gender:   session.session_gender   ?? '',
    session_language: session.session_language ?? '',
    age_range_min:    session.age_range_min    ?? '',
    age_range_max:    session.age_range_max    ?? '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day) => {
    setForm((prev) => ({
      ...prev,
      session_days: prev.session_days.includes(day)
        ? prev.session_days.filter((d) => d !== day)
        : [...prev.session_days, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.session_gender || !form.session_language || !form.scheduled_at) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.session_days.length === 0) {
      toast.error('Please select at least one session day');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };

      ['description', 'age_range_min', 'age_range_max'].forEach((f) => {
        if (payload[f] === '') payload[f] = null;
      });

      payload.duration_minutes = parseInt(payload.duration_minutes, 10);
      payload.max_students     = parseInt(payload.max_students, 10);
      if (payload.age_range_min) payload.age_range_min = parseInt(payload.age_range_min, 10);
      if (payload.age_range_max) payload.age_range_max = parseInt(payload.age_range_max, 10);

      const { data } = await sessionApi.updateSession(session.id, payload);
      toast.success('Session updated successfully');
      onSaved(data.data.session);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Modal isOpen onClose={onClose} title="Edit Session Details" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <Input
          label="Title *"
          name="title"
          value={form.title}
          onChange={handleChange}
          disabled={loading}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            disabled={loading}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                       transition-all resize-none disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Session type *"
            name="session_type"
            value={form.session_type}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="one_on_one">One-on-One</option>
            <option value="group">Group</option>
            <option value="open">Open</option>
          </SelectField>

          <Input
            label="Scheduled date & time *"
            name="scheduled_at"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={handleChange}
            min={minDateTime}
            disabled={loading}
          />

          <Input
            label="Duration (minutes)"
            name="duration_minutes"
            type="number"
            min={15}
            max={480}
            value={form.duration_minutes}
            onChange={handleChange}
            disabled={loading}
          />

          <Input
            label="Max students"
            name="max_students"
            type="number"
            min={1}
            max={100}
            value={form.max_students}
            onChange={handleChange}
            disabled={loading}
          />

          <SelectField
            label="Gender *"
            name="session_gender"
            value={form.session_gender}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </SelectField>

          <SelectField
            label="Language *"
            name="session_language"
            value={form.session_language}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select language</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </SelectField>

          <Input
            label="Min age"
            name="age_range_min"
            type="number"
            min={4}
            max={99}
            value={form.age_range_min}
            onChange={handleChange}
            placeholder="Optional"
            disabled={loading}
          />

          <Input
            label="Max age"
            name="age_range_max"
            type="number"
            min={5}
            max={100}
            value={form.age_range_max}
            onChange={handleChange}
            placeholder="Optional"
            disabled={loading}
          />
        </div>

        {/* Recurring days */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Recurring days *
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                disabled={loading}
                onClick={() => handleDayToggle(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize
                           transition-all duration-150
                           ${form.session_days.includes(day)
                             ? 'bg-forest-600 text-white'
                             : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                           }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={loading} type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────

const AdminSessionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const load = async () => {
    try {
      const [sessionRes, enrollmentsRes] = await Promise.all([
        sessionApi.getSessionById(id),
        sessionApi.getEnrollments(id).catch(() => ({ data: { data: { enrollments: [] } } })),
      ]);
      setSession(sessionRes.data.data.session);
      setEnrollments(enrollmentsRes.data.data.enrollments);
    } catch {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const { data } = await userApi.listUsers({ role: 'teacher', status: 'active', limit: 100 });
        setTeachers(data.data.users);
      } catch { /* non-critical */ }
    };
    if (showAssignModal) loadTeachers();
  }, [showAssignModal]);

  const handleStatusChange = async (status) => {
    setActionLoading(status);
    try {
      const { data } = await sessionApi.updateStatus(id, status);
      setSession(data.data.session);
      toast.success(`Session ${status}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) return;
    setActionLoading('assign');
    try {
      const { data } = await sessionApi.assignTeacher(id, selectedTeacher);
      setSession(data.data.session);
      setShowAssignModal(false);
      setSelectedTeacher('');
      toast.success('Teacher assigned successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Assignment failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveTeacher = async () => {
    setActionLoading('approve-teacher');
    try {
      const { data } = await sessionApi.approveTeacher(id);
      setSession(data.data.session);
      toast.success('Teacher request approved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
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

  const pendingEnrollments  = enrollments.filter((e) => e.status === 'pending');
  const approvedEnrollments = enrollments.filter((e) => e.status === 'approved');
  const isEditable          = !['completed', 'cancelled'].includes(session.status);
  const isTeacherPending    = session.status === 'draft' && session.teacher_id;

  return (
    <DashboardLayout title="Session Detail">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-4xl mx-auto"
      >
        <Link
          to="/admin/sessions"
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
                {isTeacherPending && (
                  <Badge variant="warning">Teacher Pending Approval</Badge>
                )}
              </div>
              {session.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{session.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {session.status === 'live' && (
                <button
                  onClick={() => navigate(`/sessions/${id}/live`)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500
                             text-white text-sm font-semibold px-5 py-2.5 rounded-xl
                             transition-colors shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Monitor Live
                </button>
              )}
              {isEditable && (
                <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
                  ✏️ Edit Details
                </Button>
              )}
              {isTeacherPending && (
                <Button
                  variant="gold"
                  size="sm"
                  loading={actionLoading === 'approve-teacher'}
                  onClick={handleApproveTeacher}
                >
                  Approve Teacher
                </Button>
              )}
              {isEditable && (
                <Button variant="secondary" size="sm" onClick={() => setShowAssignModal(true)}>
                  {session.teacher_id ? 'Change Teacher' : 'Assign Teacher'}
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => setShowStatusModal(true)}>
                Change Status
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* Session details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-display font-semibold text-forest-900">Session Details</h3>
              {isEditable && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors"
                >
                  Edit →
                </button>
              )}
            </div>
            <InfoRow label="Type"         value={session.session_type?.replace('_', ' ')} />
            <InfoRow label="Language"     value={session.session_language} />
            <InfoRow label="Gender"       value={session.session_gender} />
            <InfoRow
              label="Age Range"
              value={
                session.age_range_min || session.age_range_max
                  ? `${session.age_range_min ?? '?'} – ${session.age_range_max ?? '?'}`
                  : 'All ages'
              }
            />
            <InfoRow label="Duration"     value={`${session.duration_minutes} minutes`} />
            <InfoRow label="Max Students" value={session.max_students} />
            <InfoRow
              label="Scheduled"
              value={new Date(session.scheduled_at).toLocaleString('en-MY', {
                weekday:'short', day:'numeric', month:'short',
                year:'numeric', hour:'2-digit', minute:'2-digit',
              })}
            />
            <InfoRow
              label="Days"
              value={session.session_days
                ?.map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                .join(', ')}
            />
          </div>

          {/* Teacher card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-display font-semibold text-forest-900">Assigned Teacher</h3>
              {isEditable && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors"
                >
                  {session.teacher_id ? 'Change →' : 'Assign →'}
                </button>
              )}
            </div>
            {session.teacher_name ? (
              <div className="flex items-center gap-4">
                <Avatar src={session.teacher_avatar} name={session.teacher_name} size="lg" />
                <div>
                  <p className="font-medium text-gray-800">{session.teacher_name}</p>
                  {session.teacher_ijazah_verified && (
                    <Badge variant="gold" className="mt-1">✓ Ijazah Verified</Badge>
                  )}
                  {isTeacherPending && (
                    <p className="text-xs text-amber-600 mt-1">Awaiting your approval</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-3">No teacher assigned yet</p>
                <Button variant="secondary" size="sm" onClick={() => setShowAssignModal(true)}>
                  Assign Teacher
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h3 className="font-display font-semibold text-forest-900">Enrollments</h3>
            <div className="flex gap-2">
              <Badge variant="pending">{pendingEnrollments.length} pending</Badge>
              <Badge variant="success">{approvedEnrollments.length} approved</Badge>
            </div>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState icon="👤" title="No enrollment requests yet" />
          ) : (
            <div className="divide-y divide-gray-50">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-3">
                  <Avatar src={e.avatar_url} name={e.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{e.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.current_level && (
                      <span className="text-xs text-gray-400 capitalize">{e.current_level}</span>
                    )}
                    <Badge variant={
                      e.status === 'approved' ? 'success' :
                      e.status === 'pending'  ? 'pending' :
                      e.status === 'rejected' ? 'error'   : 'info'
                    }>
                      {e.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit session modal */}
      <AnimatePresence>
        {showEditModal && (
          <EditSessionModal
            session={session}
            onClose={() => setShowEditModal(false)}
            onSaved={(updated) => setSession((prev) => ({ ...prev, ...updated }))}
          />
        )}
      </AnimatePresence>

      {/* Change status modal */}
      <StatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={session?.status}
        onConfirm={async (status) => {
          await handleStatusChange(status);
          setShowStatusModal(false);
        }}
        role="admin"
      />

      {/* Assign teacher modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => { setShowAssignModal(false); setSelectedTeacher(''); }}
        title="Assign Teacher"
        size="sm"
      >
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">Select teacher</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-800"
          >
            <option value="">Choose a teacher...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedTeacher}
            loading={actionLoading === 'assign'}
            onClick={handleAssignTeacher}
          >
            Assign
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminSessionDetailPage;