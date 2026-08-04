import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { assessmentApi } from '../../api/assessmentApi';
import { attendanceApi } from '../../api/attendanceApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AssessmentResultCard from '../../components/assessment/AssessmentResultCard';
import TeacherReviewModal from '../../components/assessment/TeacherReviewModal';
import { EmptyState, Spinner } from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const statusColors = {
  not_started:    'gray',
  in_progress:    'teacher',
  needs_revision: 'gold',
  completed:      'student',
  certified:      'admin',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const TeacherStudentAssessmentsPage = () => {
  const { t } = useTranslation();
  const { studentId } = useParams();

  const STATUS_OPTIONS = [
    { value: 'not_started',    label: t('progress.status.not_started') },
    { value: 'in_progress',    label: t('progress.status.in_progress') },
    { value: 'needs_revision', label: t('progress.status.needs_revision') },
    { value: 'completed',      label: t('progress.status.completed') },
    { value: 'certified',      label: t('progress.status.certified') },
  ];

  const GRADE_OPTIONS = [
    { value: 'excellent', label: t('assess.grade.excellent') },
    { value: 'very_good', label: t('assess.grade.very_good') },
    { value: 'good',      label: t('assess.grade.good') },
    { value: 'acceptable',label: t('assess.grade.acceptable') },
    { value: 'weak',      label: t('assess.grade.weak') },
  ];

  const [assessments, setAssessments]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedAssessment, setSelected] = useState(null);
  const [reviewModalOpen, setReviewModal] = useState(false);

  // Progress
  const [progress, setProgress]           = useState(null);
  const [progressEdit, setProgressEdit]   = useState({});
  const [progressSaving, setProgressSaving] = useState(false);

  // Notes
  const [notes, setNotes]                 = useState([]);
  const [noteContent, setNoteContent]     = useState('');
  const [notePrivate, setNotePrivate]     = useState(false);
  const [noteSaving, setNoteSaving]       = useState(false);
  const [deletingNote, setDeletingNote]   = useState(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await assessmentApi.listStudentAssessments(studentId);
      setAssessments(data.data.assessments);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await attendanceApi.getStudentProgress(studentId);
      const p = res.data.data.progress;
      setProgress(p);
      if (p) {
        setProgressEdit({
          total_juz_memorized:    p.total_juz_memorized    ?? 0,
          total_surahs_memorized: p.total_surahs_memorized ?? 0,
          status:                 p.status                 ?? 'not_started',
          accuracy_grade:         p.accuracy_grade         ?? '',
          teacher_notes:          p.teacher_notes          ?? '',
        });
      }
    } catch { /* student may not have a progress record yet */ }
  }, [studentId]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await attendanceApi.getStudentNotes(studentId);
      setNotes(res.data.data.notes || []);
    } catch { /* ignore */ }
  }, [studentId]);

  useEffect(() => {
    fetchAssessments();
    fetchProgress();
    fetchNotes();
  }, [fetchAssessments, fetchProgress, fetchNotes]);

  const handleSaveProgress = async () => {
    setProgressSaving(true);
    try {
      const res = await attendanceApi.updateStudentProgress(studentId, {
        total_juz_memorized:    parseInt(progressEdit.total_juz_memorized, 10) || 0,
        total_surahs_memorized: parseInt(progressEdit.total_surahs_memorized, 10) || 0,
        status:                 progressEdit.status        || null,
        accuracy_grade:         progressEdit.accuracy_grade || null,
        teacher_notes:          progressEdit.teacher_notes  || null,
      });
      setProgress(res.data.data.progress);
      toast.success(t('assess.teacher.progress.saveSuccess'));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update progress');
    } finally {
      setProgressSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setNoteSaving(true);
    try {
      await attendanceApi.addNote(studentId, {
        content:    noteContent.trim(),
        is_private: notePrivate,
      });
      setNoteContent('');
      setNotePrivate(false);
      await fetchNotes();
      toast.success(t('assess.teacher.notes.addSuccess'));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    setDeletingNote(noteId);
    try {
      await attendanceApi.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success(t('assess.teacher.notes.deleteSuccess'));
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setDeletingNote(null);
    }
  };

  const openReview = (assessment) => {
    setSelected(assessment);
    setReviewModal(true);
  };

  return (
    <DashboardLayout title={t('assess.teacher.pageTitle')}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        <Link
          to="/teacher/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-forest-600 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t('assess.teacher.back')}
        </Link>

        {/* ── Progress Card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <h3 className="font-display font-semibold text-forest-900 mb-4">{t('assess.teacher.progress.title')}</h3>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('assess.teacher.progress.juzLabel')}</label>
              <input
                type="number"
                min={0} max={30}
                value={progressEdit.total_juz_memorized ?? ''}
                onChange={(e) => setProgressEdit((p) => ({ ...p, total_juz_memorized: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('assess.teacher.progress.surahsLabel')}</label>
              <input
                type="number"
                min={0} max={114}
                value={progressEdit.total_surahs_memorized ?? ''}
                onChange={(e) => setProgressEdit((p) => ({ ...p, total_surahs_memorized: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('assess.teacher.progress.statusLabel')}</label>
              <select
                value={progressEdit.status ?? ''}
                onChange={(e) => setProgressEdit((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('assess.teacher.progress.gradeLabel')}</label>
              <select
                value={progressEdit.accuracy_grade ?? ''}
                onChange={(e) => setProgressEdit((p) => ({ ...p, accuracy_grade: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
              >
                <option value="">{t('assess.teacher.progress.gradeNotSet')}</option>
                {GRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-1">{t('assess.teacher.progress.notesLabel')}</label>
            <textarea
              rows={3}
              value={progressEdit.teacher_notes ?? ''}
              onChange={(e) => setProgressEdit((p) => ({ ...p, teacher_notes: e.target.value }))}
              placeholder={t('assess.teacher.progress.notesPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none
                         focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
            />
          </div>

          <div className="flex items-center justify-between">
            {progress?.last_reviewed_at && (
              <p className="text-xs text-gray-400">
                {t('assess.teacher.progress.lastReviewed', { date: fmtDate(progress.last_reviewed_at) })}
              </p>
            )}
            <div className="ml-auto">
              <Button variant="primary" size="sm" loading={progressSaving} onClick={handleSaveProgress}>
                {t('assess.teacher.progress.saveBtn')}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Teacher Notes ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <h3 className="font-display font-semibold text-forest-900 mb-4">{t('assess.teacher.notes.title')}</h3>

          {/* Add note form */}
          <div className="mb-4 space-y-2">
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('assess.teacher.notes.placeholder')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none
                         focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notePrivate}
                  onChange={(e) => setNotePrivate(e.target.checked)}
                  className="accent-forest-600 w-3.5 h-3.5"
                />
                {t('assess.teacher.notes.privateLabel')}
              </label>
              <Button
                variant="primary"
                size="sm"
                loading={noteSaving}
                disabled={!noteContent.trim()}
                onClick={handleAddNote}
              >
                {t('assess.teacher.notes.addBtn')}
              </Button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('assess.teacher.notes.empty')}</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id}
                     className="flex gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-400">{fmtDate(note.created_at)}</p>
                      {note.is_private && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-medium">
                          {t('assess.teacher.notes.privateTag')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{note.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNote === note.id}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recitation Assessments ─────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold text-forest-900">
            {t('assess.teacher.history.title')}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('assess.teacher.history.subtitle')}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-sm text-red-500 mb-3">{error}</p>
          </div>
        )}

        {!loading && !error && assessments.length === 0 && (
          <EmptyState
            icon="📋"
            title={t('assess.teacher.history.empty.title')}
            description={t('assess.teacher.history.empty.desc')}
          />
        )}

        {!loading && !error && assessments.length > 0 && (
          <div className="space-y-3">
            {assessments.map((a) => (
              <AssessmentResultCard
                key={a.id}
                assessment={a}
                onClick={() => openReview(a)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {selectedAssessment && (
        <TeacherReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModal(false)}
          assessment={selectedAssessment}
          onReviewSubmitted={fetchAssessments}
        />
      )}
    </DashboardLayout>
  );
};

export default TeacherStudentAssessmentsPage;
