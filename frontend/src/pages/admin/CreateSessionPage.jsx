// src/pages/admin/CreateSessionPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sessionApi } from '../../api/sessionApi';
import { userApi } from '../../api/userApi';
import { useFormError } from '../../hooks/useFormError';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const SelectField = ({ label, name, value, onChange, disabled, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-gray-700">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
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

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
    <h3 className="font-display font-semibold text-forest-900 mb-4 pb-3 border-b border-gray-100">
      {title}
    </h3>
    {children}
  </div>
);

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const { error, parseError, clearError } = useFormError();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    session_type: 'group',
    scheduled_at: '',
    session_days: [],
    duration_minutes: 60,
    max_students: 10,
    session_gender: '',
    session_language: '',
    age_range_min: '',
    age_range_max: '',
    teacher_id: '',
    agora_channel: '',
  });

  // Load active teachers for assignment dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userApi.listUsers({ role: 'teacher', status: 'active', limit: 100 });
        setTeachers(data.data.users);
      } catch { /* non-critical */ }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError();
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

    if (!form.title || !form.session_gender || !form.session_language || !form.scheduled_at || !form.agora_channel) {
      parseError({ response: { data: { message: 'Please fill in all required fields' } } });
      return;
    }

    if (form.session_days.length === 0) {
      parseError({ response: { data: { message: 'Please select at least one session day' } } });
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, agora_channel: form.agora_channel.trim() };

      // Convert empty strings to null for optional fields
      ['description', 'teacher_id', 'age_range_min', 'age_range_max'].forEach((f) => {
        if (payload[f] === '') payload[f] = null;
      });

      // Convert numeric strings
      payload.duration_minutes = parseInt(payload.duration_minutes, 10);
      payload.max_students     = parseInt(payload.max_students, 10);
      if (payload.age_range_min) payload.age_range_min = parseInt(payload.age_range_min, 10);
      if (payload.age_range_max) payload.age_range_max = parseInt(payload.age_range_max, 10);

      const { data } = await sessionApi.createSession(payload);
      toast.success('Session created successfully');
      navigate(`/admin/sessions/${data.data.session.id}`);
    } catch (err) {
      parseError(err);
    } finally {
      setLoading(false);
    }
  };

  // Minimum datetime for scheduling (now + 15 min)
  const minDateTime = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString().slice(0, 16);

  return (
    <DashboardLayout title="Create Session">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        {/* Back */}
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

        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-forest-900">Create Session</h2>
          <p className="text-gray-500 text-sm mt-0.5">Set up a new Halaqah session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic info */}
          <Section title="Session Information">
            <div className="space-y-4">
              <Input
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Tajweed for Beginners — Morning Group"
                disabled={loading}
                required
              />

              <div>
                <Input
                  label="Agora channel name"
                  name="agora_channel"
                  value={form.agora_channel}
                  onChange={handleChange}
                  placeholder="e.g. tajweed-beginners-morning"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Unique name used for the live video/audio channel. Letters, numbers, hyphens, and underscores only.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={loading}
                  rows={3}
                  placeholder="Describe what students will learn in this session..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                             transition-all resize-none disabled:bg-gray-50 placeholder:text-gray-400"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Session type"
                  name="session_type"
                  value={form.session_type}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="one_on_one">One-on-One</option>
                  <option value="group">Group</option>
                  <option value="open">Open</option>
                </SelectField>

                <Input
                  label="Scheduled date & time"
                  name="scheduled_at"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={handleChange}
                  min={minDateTime}
                  disabled={loading}
                  required
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
              </div>
            </div>
          </Section>

          {/* Eligibility */}
          <Section title="Student Eligibility">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <SelectField
                label="Gender"
                name="session_gender"
                value={form.session_gender}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </SelectField>

              <SelectField
                label="Language"
                name="session_language"
                value={form.session_language}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Select language</option>
                {['arabic','english','malay','urdu','french','other'].map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </SelectField>

              <Input
                label="Min age (optional)"
                name="age_range_min"
                type="number"
                min={4}
                max={99}
                value={form.age_range_min}
                onChange={handleChange}
                placeholder="e.g. 10"
                disabled={loading}
              />

              <Input
                label="Max age (optional)"
                name="age_range_max"
                type="number"
                min={5}
                max={100}
                value={form.age_range_max}
                onChange={handleChange}
                placeholder="e.g. 18"
                disabled={loading}
              />
            </div>
          </Section>

          {/* Schedule days */}
          <Section title="Recurring Days">
            <p className="text-xs text-gray-400 mb-3">
              Select which days of the week this session recurs
            </p>
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
          </Section>

          {/* Teacher assignment */}
          <Section title="Teacher Assignment">
            <SelectField
              label="Assign teacher (optional)"
              name="teacher_id"
              value={form.teacher_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Leave unassigned — teachers can request</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
              ))}
            </SelectField>
            <p className="text-xs text-gray-400 mt-2">
              If no teacher is assigned, the session stays as a draft until a teacher requests it.
            </p>
          </Section>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Link to="/admin/sessions">
              <Button variant="secondary" size="md">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" size="md" loading={loading}>
              Create Session
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default CreateSessionPage;