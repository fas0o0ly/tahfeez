// src/pages/shared/ProfilePage.jsx
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { Spinner } from '../../components/common/EmptyState';

const LANGUAGES = [
  { value: 'arabic',  label: 'Arabic'  },
  { value: 'english', label: 'English' },
  { value: 'malay',   label: 'Malay'   },
  { value: 'urdu',    label: 'Urdu'    },
  { value: 'french',  label: 'French'  },
  { value: 'other',   label: 'Other'   },
];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

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
                 transition-all duration-200 disabled:bg-gray-50 text-gray-800"
    >
      {children}
    </select>
  </div>
);

// ─── Section wrapper ───────────────────────────────────────────────────────

const Section = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
    <div className="mb-5 pb-4 border-b border-gray-100">
      <h3 className="font-display font-semibold text-forest-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Avatar section ────────────────────────────────────────────────────────

const AvatarSection = ({ profile, onUpload, onRemove, saving }) => {
  const { t } = useTranslation();
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <Section title={t('profile.photo.title')} subtitle={t('profile.photo.subtitle')}>
      <div className="flex items-center gap-5">
        <Avatar src={profile?.avatar_url} name={profile?.full_name} size="2xl" />
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            onClick={() => fileRef.current?.click()}
          >
            {t('profile.photo.upload')}
          </Button>
          {profile?.avatar_url && (
            <Button
              variant="ghost"
              size="sm"
              loading={saving}
              onClick={onRemove}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              {t('profile.photo.remove')}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
};

// ─── Main component ────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { profile, loading, saving, updateProfile, uploadAvatar, removeAvatar } = useProfile();

  const [form, setForm] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize form once profile loads
  if (profile && !initialized) {
    setForm({ ...profile });
    setInitialized(true);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day) => {
    const current = form.available_days || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setForm((prev) => ({ ...prev, available_days: updated }));
  };

  const handleSpecializationsChange = (e) => {
    const values = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
    setForm((prev) => ({ ...prev, specializations: values }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Only send fields the backend accepts — strip read-only profile metadata
  const sharedFields = ['full_name', 'phone', 'nationality', 'preferred_language', 'date_of_birth'];
  const studentFields = ['age', 'guardian_name', 'guardian_phone', 'current_level', 'notes'];
  const teacherFields = ['bio', 'qualifications', 'years_experience', 'specializations',
                         'ijazah_chain', 'available_days', 'timezone', 'max_students', 'cv_url'];
  const adminFields = ['department'];

  const allowedFields = [...sharedFields, ...studentFields, ...teacherFields, ...adminFields];
  const payload = Object.fromEntries(
    Object.entries(form).filter(([key]) => allowedFields.includes(key))
  );

  // Strip empty strings to null so backend handles them cleanly
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '') payload[key] = null;
  });

  const ok = await updateProfile(payload);
  if (ok && form.full_name !== user.full_name) {
    updateUser({ ...user, full_name: form.full_name, avatar_url: form.avatar_url });
  }
};

  const handleAvatarUpload = async (file) => {
    const url = await uploadAvatar(file);
    if (url) {
      setForm((prev) => ({ ...prev, avatar_url: url }));
      updateUser({ ...user, avatar_url: url });
    }
  };

  const handleAvatarRemove = async () => {
    await removeAvatar();
    setForm((prev) => ({ ...prev, avatar_url: null }));
    updateUser({ ...user, avatar_url: null });
  };

  if (loading || !form) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-forest-900">{t('profile.title')}</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {t('profile.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <AvatarSection
            profile={form}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            saving={saving}
          />

          {/* Account info — read only */}
          <Section title={t('profile.account.title')} subtitle={t('profile.account.subtitle')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{t('profile.account.email')}</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl flex-1">
                    {form.email}
                  </p>
                  {form.email_verified && <Badge variant="success">{t('profile.account.verified')}</Badge>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{t('profile.account.role')}</label>
                <p className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl capitalize">
                  {form.role}
                </p>
              </div>
            </div>
          </Section>

          {/* Personal info */}
          <Section title={t('profile.personal.title')}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.personal.fullName')}
                name="full_name"
                value={form.full_name ?? ''}
                onChange={handleChange}
                disabled={saving}
              />
              <Input
                label={t('profile.personal.phone')}
                name="phone"
                type="tel"
                value={form.phone ?? ''}
                onChange={handleChange}
                placeholder="+60 12 345 6789"
                disabled={saving}
              />
              <Input
                label={t('profile.personal.dob')}
                name="date_of_birth"
                type="date"
                value={form.date_of_birth?.split('T')[0] ?? ''}
                onChange={handleChange}
                disabled={saving}
              />
              <Input
                label={t('profile.personal.nationality')}
                name="nationality"
                value={form.nationality ?? ''}
                onChange={handleChange}
                placeholder="Malaysian"
                disabled={saving}
              />
              <SelectField
                label={t('profile.personal.language')}
                name="preferred_language"
                value={form.preferred_language}
                onChange={handleChange}
                disabled={saving}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </SelectField>
            </div>
          </Section>

          {/* Student-specific */}
          {user.role === 'student' && (
            <Section title={t('profile.student.title')}>
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label={t('profile.student.level')}
                  name="current_level"
                  value={form.current_level}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">{t('profile.student.level.notSet')}</option>
                  <option value="beginner">{t('profile.student.level.beginner')}</option>
                  <option value="intermediate">{t('profile.student.level.intermediate')}</option>
                  <option value="advanced">{t('profile.student.level.advanced')}</option>
                </SelectField>

                <Input
                  label={t('profile.student.guardianName')}
                  name="guardian_name"
                  value={form.guardian_name ?? ''}
                  onChange={handleChange}
                  disabled={saving}
                />

                <Input
                  label={t('profile.student.guardianPhone')}
                  name="guardian_phone"
                  type="tel"
                  value={form.guardian_phone ?? ''}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">{t('profile.student.notes')}</label>
                <textarea
                  name="notes"
                  value={form.notes ?? ''}
                  onChange={handleChange}
                  disabled={saving}
                  rows={3}
                  placeholder="Any additional notes..."
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                             transition-all resize-none disabled:bg-gray-50 placeholder:text-gray-400"
                />
              </div>
            </Section>
          )}

          {/* Teacher-specific */}
          {user.role === 'teacher' && (
            <>
              <Section title={t('profile.teacher.profTitle')}>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <Input
                    label={t('profile.teacher.yearsExp')}
                    name="years_experience"
                    type="number"
                    min={0}
                    max={70}
                    value={form.years_experience ?? ''}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <Input
                    label={t('profile.teacher.maxStudents')}
                    name="max_students"
                    type="number"
                    min={1}
                    max={100}
                    value={form.max_students ?? ''}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <SelectField
                    label={t('profile.teacher.timezone')}
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (MYT)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="America/New_York">America/New_York (ET)</option>
                    <option value="America/Chicago">America/Chicago (CT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                  </SelectField>
                  <Input
                    label={t('profile.teacher.cvLink')}
                    name="cv_url"
                    type="url"
                    value={form.cv_url ?? ''}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/your-cv"
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    {t('profile.teacher.specializations')}
                    <span className="text-xs text-gray-400 font-normal ml-1">{t('profile.teacher.specializationHint')}</span>
                  </label>
                  <input
                    type="text"
                    value={(form.specializations || []).join(', ')}
                    onChange={handleSpecializationsChange}
                    placeholder="tajweed, hifz, qiraat"
                    disabled={saving}
                    className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                               transition-all disabled:bg-gray-50 placeholder:text-gray-400"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    {t('profile.teacher.availableDays')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        disabled={saving}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium
                                   capitalize transition-all duration-150
                                   ${(form.available_days || []).includes(day)
                                     ? 'bg-forest-600 text-white'
                                     : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                   }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">{t('profile.teacher.qualifications')}</label>
                  <textarea
                    name="qualifications"
                    value={form.qualifications ?? ''}
                    onChange={handleChange}
                    disabled={saving}
                    rows={2}
                    className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                               transition-all resize-none disabled:bg-gray-50"
                  />
                </div>
              </Section>

              <Section title={t('profile.teacher.bioTitle')}>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">{t('profile.teacher.bio')}</label>
                  <textarea
                    name="bio"
                    value={form.bio ?? ''}
                    onChange={handleChange}
                    disabled={saving}
                    rows={4}
                    placeholder={t('profile.teacher.bioPlaceholder')}
                    className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                               transition-all resize-none disabled:bg-gray-50 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-medium text-gray-700">{t('profile.teacher.ijazahChain')}</label>
                    {form.ijazah_verified && (
                      <Badge variant="gold">{t('profile.teacher.ijazahVerified')}</Badge>
                    )}
                  </div>
                  <textarea
                    name="ijazah_chain"
                    value={form.ijazah_chain ?? ''}
                    onChange={handleChange}
                    disabled={saving}
                    rows={3}
                    placeholder={t('profile.teacher.ijazahPlaceholder')}
                    className="mt-0.5 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                               transition-all resize-none disabled:bg-gray-50 placeholder:text-gray-400"
                  />
                </div>
              </Section>
            </>
          )}

          {/* Admin-specific */}
          {user.role === 'admin' && (
            <Section title={t('profile.admin.title')}>
              <Input
                label={t('profile.admin.department')}
                name="department"
                value={form.department ?? ''}
                onChange={handleChange}
                placeholder="e.g. Academic Affairs"
                disabled={saving}
              />
            </Section>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
            >
              {t('profile.saveChanges')}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProfilePage;