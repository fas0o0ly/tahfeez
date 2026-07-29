import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assessmentApi } from '../../api/assessmentApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssessmentResultCard from '../../components/assessment/AssessmentResultCard';
import Button from '../../components/common/Button';
import { EmptyState, Spinner, Pagination } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const AssessmentPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [page, setPage]               = useState(1);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await assessmentApi.listMyAssessments({ page, limit: 10 });
      setAssessments(data.data.assessments);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleDelete = async (id) => {
    try {
      await assessmentApi.deleteAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      toast.success('Assessment deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete assessment');
    }
  };

  return (
    <DashboardLayout title="My Assessments">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-900">
              Recitation Assessments
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              AI-powered memorization checks
            </p>
          </div>
          <Link to="/student/assessments/new">
            <Button variant="primary" size="sm">New Assessment</Button>
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchAssessments}>Try again</Button>
          </div>
        )}

        {!loading && !error && assessments.length === 0 && (
          <EmptyState
            icon="🎙️"
            title="No assessments yet"
            description="Start your first AI-powered recitation assessment and get instant Tajweed feedback."
            action={
              <Link to="/student/assessments/new">
                <Button variant="primary">Start Assessment</Button>
              </Link>
            }
          />
        )}

        {!loading && !error && assessments.length > 0 && (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div key={a.id} className="relative group">
                <AssessmentResultCard assessment={a} />
                {a.status !== 'processing' && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100
                               p-1.5 rounded-lg text-gray-300 hover:text-red-500
                               hover:bg-red-50 transition-all duration-200"
                    title="Delete assessment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AssessmentPage;
