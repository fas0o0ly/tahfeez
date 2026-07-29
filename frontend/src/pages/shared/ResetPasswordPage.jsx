// src/pages/shared/ResetPasswordPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import { useFormError } from '../../hooks/useFormError';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { error, parseError, clearError } = useFormError();

  const [form, setForm] = useState({ password: '', confirm_password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    clearError();
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // No token in URL
  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-semibold text-forest-900 mb-2">
            Invalid reset link
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary" size="md">Request New Link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const errors = {};
    if (!form.password) errors.password = 'Password is required';
    if (form.password.length < 8) errors.password = 'At least 8 characters required';
    if (!/[A-Z]/.test(form.password)) errors.password = 'Must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) errors.password = 'Must contain a number';
    if (form.password !== form.confirm_password) errors.confirm_password = 'Passwords do not match';
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
      await authApi.resetPassword({ token, password: form.password });
      toast.success('Password reset successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      parseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-forest-600 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to sign in
      </Link>

      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-display font-semibold text-forest-900 mb-1"
        >
          Set new password
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-500 text-sm"
        >
          Choose a strong password for your account.
        </motion.p>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="space-y-4"
        noValidate
      >
        <Input
          label="New password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          error={fieldErrors.password}
          autoComplete="new-password"
          disabled={loading}
          hint="Must contain uppercase letter and number"
        />

        <Input
          label="Confirm new password"
          type="password"
          name="confirm_password"
          value={form.confirm_password}
          onChange={handleChange}
          placeholder="Repeat your password"
          error={fieldErrors.confirm_password}
          autoComplete="new-password"
          disabled={loading}
        />

        {/* Password strength bar */}
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
                ? 'Strong ✓'
                : 'Weak'}
            </span>
          </div>
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
        >
          Reset Password
        </Button>
      </motion.form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;