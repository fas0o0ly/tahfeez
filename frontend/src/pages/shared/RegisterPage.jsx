// src/pages/shared/RegisterPage.jsx
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/authApi';
import { useFormError } from '../../hooks/useFormError';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const STEPS = { DETAILS: 1, DONE: 2 };

const LANGUAGES = [
  { value: 'arabic',  label: 'Arabic'  },
  { value: 'english', label: 'English' },
  { value: 'malay',   label: 'Malay'   },
  { value: 'urdu',    label: 'Urdu'    },
  { value: 'french',  label: 'French'  },
  { value: 'other',   label: 'Other'   },
];

const SelectField = ({ label, name, value, onChange, disabled, error, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-gray-700 tracking-wide">{label}</label>
    )}
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        w-full px-4 py-3 rounded-xl border bg-white text-sm
        focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200
        disabled:bg-gray-50 disabled:cursor-not-allowed
        ${error
          ? 'border-red-300 focus:ring-red-200 text-gray-800'
          : 'border-gray-200 focus:ring-forest-200 focus:border-forest-400 text-gray-800'
        }
      `}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-500">⚠ {error}</p>}
  </div>
);

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const { error, parseError, clearError } = useFormError();
  const { t } = useTranslation();

  const initialRole = searchParams.get('role') === 'teacher' ? 'teacher' : 'student';

  const [step, setStep] = useState(STEPS.DETAILS);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    role: initialRole,
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    gender: '',
    date_of_birth: '',
    preferred_language: '',
    phone: '',
    nationality: '',
    cv_url: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError();
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errors = {};
    if (!form.full_name.trim()) errors.full_name = 'Full name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email address';
    if (!form.gender) errors.gender = 'Gender is required';
    if (!form.date_of_birth) errors.date_of_birth = 'Date of birth is required';
    if (!form.preferred_language) errors.preferred_language = 'Preferred language is required';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 8) errors.password = 'At least 8 characters required';
    else if (!/[A-Z]/.test(form.password)) errors.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password)) errors.password = 'Must contain a number';
    if (form.password !== form.confirm_password) errors.confirm_password = 'Passwords do not match';
    if (form.role === 'teacher' && form.cv_url && !/^https?:\/\/.+/.test(form.cv_url)) {
      errors.cv_url = 'Must be a valid URL (e.g. Google Drive link)';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      if (!payload.cv_url) delete payload.cv_url;
      if (!payload.phone) delete payload.phone;
      if (!payload.nationality) delete payload.nationality;
      await authApi.register(payload);
      setStep(STEPS.DONE);
    } catch (err) {
      parseError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === STEPS.DONE) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold text-forest-900 mb-2">
            {t('auth.register.checkEmail')}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            {t('auth.register.sentLink')}
          </p>
          <p className="text-forest-700 font-medium text-sm mb-6">{form.email}</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-6 max-w-xs mx-auto">
            {t('auth.register.linkExpires')}
          </p>
          {form.role === 'teacher' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-start">
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">{t('auth.register.teacherNote')}</span>{' '}
                {t('auth.register.teacherNoteText')}
              </p>
            </div>
          )}
          <Link to="/login">
            <Button variant="primary" size="md">{t('auth.register.backToSignIn')}</Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-semibold text-forest-900 mb-1">
          {t('auth.register.title')}
        </h1>
        <p className="text-gray-500 text-sm">
          {t('auth.register.joinAs')}{' '}
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, role: 'student' }))}
            className={`font-medium transition-colors ${form.role === 'student' ? 'text-forest-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('role.student')}
          </button>
          {' '}{t('auth.register.or')}{' '}
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, role: 'teacher' }))}
            className={`font-medium transition-colors ${form.role === 'teacher' ? 'text-forest-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('role.teacher')}
          </button>
        </p>
      </div>

      {/* Role toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
        {['student', 'teacher'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setForm(p => ({ ...p, role: r }))}
            className={`
              flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${form.role === r ? 'bg-white text-forest-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            {r === 'student' ? t('auth.register.studentLabel') : t('auth.register.teacherLabel')}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t('auth.register.fullName')}
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          placeholder="Ahmad ibn Abdullah"
          error={fieldErrors.full_name}
          disabled={loading}
          autoComplete="name"
        />

        <Input
          label={t('auth.register.email')}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={fieldErrors.email}
          disabled={loading}
          autoComplete="email"
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label={t('auth.register.gender')}
            name="gender"
            value={form.gender}
            onChange={handleChange}
            disabled={loading}
            error={fieldErrors.gender}
          >
            <option value="">{t('auth.register.selectGender')}</option>
            <option value="male">{t('auth.register.male')}</option>
            <option value="female">{t('auth.register.female')}</option>
          </SelectField>

          <Input
            label={t('auth.register.dob')}
            type="date"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={handleChange}
            error={fieldErrors.date_of_birth}
            disabled={loading}
            max={new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          />
        </div>

        <SelectField
          label={t('auth.register.language')}
          name="preferred_language"
          value={form.preferred_language}
          onChange={handleChange}
          disabled={loading}
          error={fieldErrors.preferred_language}
        >
          <option value="">{t('auth.register.selectLanguage')}</option>
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('auth.register.password')}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t('auth.register.passwordMin')}
            error={fieldErrors.password}
            disabled={loading}
            autoComplete="new-password"
          />
          <Input
            label={t('auth.register.confirmPassword')}
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            placeholder={t('auth.register.repeatPassword')}
            error={fieldErrors.confirm_password}
            disabled={loading}
            autoComplete="new-password"
          />
        </div>

        {form.password && (
          <div className="flex gap-1.5 items-center">
            {[
              form.password.length >= 8,
              /[A-Z]/.test(form.password),
              /[0-9]/.test(form.password),
            ].map((met, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${met ? 'bg-forest-400' : 'bg-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">
              {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password)].filter(Boolean).length === 3
                ? t('auth.register.strong') : t('auth.register.weak')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('auth.register.phone')}
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+60 12 345 6789"
            disabled={loading}
          />
          <Input
            label={t('auth.register.nationality')}
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            placeholder="Malaysian"
            disabled={loading}
          />
        </div>

        {form.role === 'teacher' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
          >
            <Input
              label={t('auth.register.cvLink')}
              type="url"
              name="cv_url"
              value={form.cv_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/your-cv"
              error={fieldErrors.cv_url}
              disabled={loading}
              hint={t('auth.register.cvHint')}
            />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="full"
          loading={loading}
          className="mt-1"
        >
          {t('auth.register.submit')}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {t('auth.register.alreadyHave')}{' '}
        <Link to="/login" className="text-forest-600 font-medium hover:text-forest-800 transition-colors">
          {t('auth.register.signIn')}
        </Link>
      </p>

      {form.role === 'teacher' && (
        <p className="mt-2 text-center text-xs text-forest-500">
          {t('auth.register.teacherApproval')}
        </p>
      )}
    </AuthLayout>
  );
};

export default RegisterPage;