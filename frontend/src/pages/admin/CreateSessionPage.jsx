// src/pages/admin/CreateSessionPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { sessionApi } from '../../api/sessionApi';
import { userApi } from '../../api/userApi';
import { useFormError } from '../../hooks/useFormError';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

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
  const { t } = useTranslation();
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

      ['description', 'teacher_id', 'age_range_min', 'age_range_max'].forEach((f) => {
        if (payload[f] === '') payload[f] = null;
      });

      payload.duration_minutes = parseInt(payload.duration_minutes, 10);
      payload.max_students     = parseInt(payload.max_students, 10);
      if (payload.age_range_min) payload.age_range_min = parseInt(payload.age_range_min, 10);
      if (payload.age_range_max) payload.age_range_max = parseInt(payload.age_range_max, 10);

      const { data } = await sessionApi.createSession(payload);
      toast.success(t('createSession.success'));
      navigate(`/admin/sessions/${data.data.session.id}`);
    } catch (err) {
      parseError(err);
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString().slice(0, 16);

  return (
    <DashboardLayout title={t('createSession.title')}>
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
          {t('createSession.back')}
        </Link>

        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-forest-900">{t('createSession.title')}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{t('createSession.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic info */}
          <Section title={t('createSession.sections.info')}>
            <div className="space-y-4">
              <Input
                label={t('createSession.fields.title')}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Tajweed for Beginners — Morning Group"
                disabled={loading}
                required
              />

              <div>
                <Input
                  label={t('createSession.fields.agoraChannel')}
                  name="agora_channel"
                  value={form.agora_channel}
                  onChange={handleChange}
                  placeholder="e.g. tajweed-beginners-morning"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  {t('createSession.fields.agoraHint')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  {t('createSession.fields.description')} <span className="text-gray-400 font-normal">{t('createSession.fields.descriptionOptional')}</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={loading}
                  rows={3}
                  placeholder={t('createSession.fields.descriptionPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                             transition-all resize-none disabled:bg-gray-50 placeholder:text-gray-400"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label={t('createSession.fields.sessionType')}
                  name="session_type"
                  value={form.session_type}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="one_on_one">{t('session.type.one_on_one')}</option>
                  <option value="group">{t('session.type.group')}</option>
                  <option value="open">{t('session.type.open')}</option>
                </SelectField>

                <Input
                  label={t('createSession.fields.scheduledAt')}
                  name="scheduled_at"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={handleChange}
                  min={minDateTime}
                  disabled={loading}
                  required
                />

                <Input
                  label={t('createSession.fields.duration')}
                  name="duration_minutes"
                  type="number"
                  min={15}
                  max={480}
                  value={form.duration_minutes}
                  onChange={handleChange}
                  disabled={loading}
                />

                <Input
                  label={t('createSession.fields.maxStudents')}
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
          <Section title={t('createSession.sections.eligibility')}>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <SelectField
                label={t('createSession.fields.gender')}
                name="session_gender"
                value={form.session_gender}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">{t('createSession.selectGender')}</option>
                <option value="male">{t('common.gender.male')}</option>
                <option value="female">{t('common.gender.female')}</option>
              </SelectField>

              <SelectField
                label={t('createSession.fields.language')}
                name="session_language"
                value={form.session_language}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">{t('createSession.selectLanguage')}</option>
                {['arabic','english','malay','urdu','french','other'].map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </SelectField>

              <Input
                label={t('createSession.fields.minAge')}
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
                label={t('createSession.fields.maxAge')}
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
          <Section title={t('createSession.sections.days')}>
            <p className="text-xs text-gray-400 mb-3">
              {t('createSession.daysHint')}
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
          <Section title={t('createSession.sections.teacher')}>
            <SelectField
              label={t('createSession.fields.teacher')}
              name="teacher_id"
              value={form.teacher_id}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">{t('createSession.fields.teacherPlaceholder')}</option>
              {teachers.map((teacher_item) => (
                <option key={teacher_item.id} value={teacher_item.id}>{teacher_item.full_name} ({teacher_item.email})</option>
              ))}
            </SelectField>
            <p className="text-xs text-gray-400 mt-2">
              {t('createSession.fields.teacherHint')}
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
              {t('createSession.submit')}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default CreateSessionPage;
