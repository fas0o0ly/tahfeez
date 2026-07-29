// src/pages/shared/ForgotPasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../../api/authApi';
import { useFormError } from '../../hooks/useFormError';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { error, parseError, clearError } = useFormError();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      parseError({ response: { data: { message: 'Please enter your email address' } } });
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      // Even on error show submitted — prevents email enumeration on frontend too
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">📨</span>
          </div>

          <h2 className="text-2xl font-display font-semibold text-forest-900 mb-2">
            Reset link sent
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            If an account exists for
          </p>
          <p className="text-forest-700 font-medium text-sm mb-2">{email}</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-8 max-w-xs mx-auto">
            you'll receive a password reset link. The link expires in 1 hour.
            Check your spam folder if you don't see it.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link to="/login">
              <Button variant="primary" size="md">Back to Sign In</Button>
            </Link>
            <button
              type="button"
              onClick={() => { setSubmitted(false); setEmail(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Try a different email
            </button>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

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
          Forgot password?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-gray-500 text-sm leading-relaxed"
        >
          Enter your email and we'll send you a link to reset your password.
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
          value={email}
          onChange={(e) => { clearError(); setEmail(e.target.value); }}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={loading}
        />

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
          Send Reset Link
        </Button>
      </motion.form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;