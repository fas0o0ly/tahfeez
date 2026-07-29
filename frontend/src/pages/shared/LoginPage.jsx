// src/pages/shared/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useFormError } from '../../hooks/useFormError';
import { authApi } from '../../api/authApi';
import { ROLE_DASHBOARDS } from '../../utils/constants';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { error, parseError, clearError } = useFormError();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Resend verification state
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    clearError();
    setShowResend(false);
    setResendSent(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      parseError({ response: { data: { message: 'Please fill in all fields' } } });
      return;
    }

    setLoading(true);
    setShowResend(false);
    setResendSent(false);

    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}`);
      const destination = from || ROLE_DASHBOARDS[user.role];
      navigate(destination, { replace: true });
    } catch (err) {
      parseError(err);
      const message = err?.response?.data?.message || '';
      if (message.toLowerCase().includes('verify your email')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email) {
      toast.error('Please enter your email address above first');
      return;
    }

    setResendLoading(true);
    try {
      await authApi.resendVerification(form.email);
      setResendSent(true);
      setShowResend(false);
      clearError();
      toast.success('Verification email sent — check your inbox');
    } catch (err) {
      const message = err?.response?.data?.message || '';
      if (message.toLowerCase().includes('already verified')) {
        toast.success('Your account is already verified. Try signing in again.');
        setShowResend(false);
        clearError();
      } else {
        toast.error('Failed to resend. Please try again in a moment.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-display font-semibold text-forest-900 mb-1"
        >
          Welcome back
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-500 text-sm"
        >
          Sign in to continue your Quran journey
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
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

        <div>
          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Your password"
            autoComplete="current-password"
            disabled={loading}
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-forest-600 hover:text-forest-800 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend verification prompt */}
        <AnimatePresence>
          {showResend && (
            <motion.div
              key="resend"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200"
            >
              <p className="text-amber-800 text-sm mb-2.5">
                Didn't receive the verification email?
              </p>
              <Button
                type="button"
                variant="gold"
                size="sm"
                loading={resendLoading}
                onClick={handleResend}
              >
                Resend Verification Email
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resend success confirmation */}
        <AnimatePresence>
          {resendSent && (
            <motion.div
              key="resend-sent"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3 rounded-xl bg-forest-50 border border-forest-200"
            >
              <p className="text-forest-700 text-sm">
                ✓ Verification email sent to{' '}
                <span className="font-medium">{form.email}</span>.
                Check your inbox and spam folder.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          variant="primary"
          size="full"
          loading={loading}
          className="mt-2"
        >
          Sign In
        </Button>
      </motion.form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">New to Tahfeez?</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/register?role=student">
          <Button variant="secondary" size="md" className="w-full">
            Join as Student
          </Button>
        </Link>
        <Link to="/register?role=teacher">
          <Button variant="secondary" size="md" className="w-full">
            Join as Teacher
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;