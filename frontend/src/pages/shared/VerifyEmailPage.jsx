// src/pages/shared/VerifyEmailPage.jsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../../api/authApi';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/common/Button';

const STATUS = { LOADING: 'loading', SUCCESS: 'success', ERROR: 'error', NO_TOKEN: 'no_token' };

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? STATUS.LOADING : STATUS.NO_TOKEN);
  const [errorMessage, setErrorMessage] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { data } = await authApi.verifyEmail(token);
        setRequiresApproval(!!data?.data?.requires_approval);
        setStatus(STATUS.SUCCESS);
      } catch (err) {
        setErrorMessage(
          err?.response?.data?.message || 'Verification failed. The link may have expired.'
        );
        setStatus(STATUS.ERROR);
      }
    };

    verify();
  }, [token]);

  const renderContent = () => {
    if (status === STATUS.LOADING) {
      return (
        <div className="text-center py-8">
          <div className="relative w-14 h-14 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-forest-100" />
            <div className="absolute inset-0 rounded-full border-t-2 border-forest-500 animate-spin" />
          </div>
          <h2 className="text-xl font-display font-semibold text-forest-900 mb-2">
            Verifying your email
          </h2>
          <p className="text-gray-400 text-sm">Please wait a moment...</p>
        </div>
      );
    }

    if (status === STATUS.SUCCESS) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-5"
          >
            <svg className="w-8 h-8 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h2 className="text-2xl font-display font-semibold text-forest-900 mb-2">
            Email verified!
          </h2>
          {requiresApproval ? (
            <>
              <p className="text-gray-500 text-sm mb-1">
                As-salamu alaykum — your email is confirmed.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                Your teacher account is now awaiting admin approval. You'll be able to sign in once approved.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-1">
                As-salamu alaykum — your account is now active.
              </p>
              <p className="text-gray-400 text-xs mb-8">
                You can now sign in and begin your Quran memorization journey.
              </p>
            </>
          )}

          <Link to="/login">
            <Button variant="primary" size="md">
              Sign In to Your Account
            </Button>
          </Link>
        </motion.div>
      );
    }

    if (status === STATUS.ERROR) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="text-2xl font-display font-semibold text-forest-900 mb-2">
            Verification failed
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            {errorMessage}
          </p>

          <div className="flex flex-col gap-3 items-center">
            <Link to="/login">
              <Button variant="primary" size="md">Back to Sign In</Button>
            </Link>
            <p className="text-xs text-gray-400">
              Need a new verification link? Sign in and we'll send one.
            </p>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">📧</span>
        </div>
        <h2 className="text-2xl font-display font-semibold text-forest-900 mb-2">
          Check your inbox
        </h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          A verification link has been sent to your email. Click it to activate your account.
        </p>
        <Link to="/login">
          <Button variant="secondary" size="md">Back to Sign In</Button>
        </Link>
      </div>
    );
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
        {renderContent()}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;