import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import { Spinner, EmptyState } from '../../components/common/EmptyState';
import { attendanceApi } from '../../api/attendanceApi';

const statusColors = {
  not_started:    'gray',
  in_progress:    'teacher',
  needs_revision: 'gold',
  completed:      'student',
  certified:      'admin',
};

const statusLabel = {
  not_started:    'Not Started',
  in_progress:    'In Progress',
  needs_revision: 'Needs Revision',
  completed:      'Completed',
  certified:      'Certified (Hafiz)',
};

const gradeColors = {
  excellent: 'text-green-600',
  very_good: 'text-teal-600',
  good:      'text-blue-600',
  acceptable:'text-yellow-600',
  weak:      'text-red-500',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDuration = (secs) => {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  return m > 0 ? `${m} min` : `${secs}s`;
};

const MyProgressPage = () => {
  const { user } = useAuth();
  const [progress, setProgress]         = useState(null);
  const [attendance, setAttendance]     = useState(null);
  const [notes, setNotes]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [attendPage, setAttendPage]     = useState(1);
  const [attendTotal, setAttendTotal]   = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [progRes, attendRes, notesRes] = await Promise.all([
          attendanceApi.getMyProgress(),
          attendanceApi.getMyAttendance({ page: 1, limit: 15 }),
          attendanceApi.getStudentNotes(user.id).catch(() => ({ data: { data: { notes: [] } } })),
        ]);
        setProgress(progRes.data.data.progress);
        const aData = attendRes.data.data;
        setAttendance(aData);
        setAttendTotal(aData.total);
        setNotes(notesRes.data.data.notes || []);
      } catch {
        // errors shown inline
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const loadMoreAttendance = async () => {
    const nextPage = attendPage + 1;
    try {
      const res = await attendanceApi.getMyAttendance({ page: nextPage, limit: 15 });
      const aData = res.data.data;
      setAttendance((prev) => ({
        ...aData,
        rows: [...(prev?.rows || []), ...aData.rows],
      }));
      setAttendPage(nextPage);
    } catch { /* ignore */ }
  };

  return (
    <DashboardLayout title="My Progress">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* ── Progress Record ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-display font-semibold text-forest-900 text-lg mb-4">
                Hifz Progress
              </h2>

              {!progress ? (
                <p className="text-sm text-gray-400">No progress record yet. Your teacher will update this after sessions.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-forest-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-display font-semibold text-forest-700">
                        {progress.total_juz_memorized ?? 0}
                        <span className="text-sm text-gray-400 font-body font-normal">/30</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Juz memorized</p>
                    </div>
                    <div className="bg-forest-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-display font-semibold text-forest-700">
                        {progress.total_surahs_memorized ?? 0}
                        <span className="text-sm text-gray-400 font-body font-normal">/114</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Surahs memorized</p>
                    </div>
                    <div className="bg-forest-50 rounded-xl p-3 text-center">
                      <p className={`text-lg font-semibold ${gradeColors[progress.accuracy_grade] || 'text-gray-500'}`}>
                        {progress.accuracy_grade
                          ? progress.accuracy_grade.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Accuracy grade</p>
                    </div>
                    <div className="bg-forest-50 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                      <Badge variant={statusColors[progress.status] || 'gray'}>
                        {statusLabel[progress.status] || progress.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1.5">Status</p>
                    </div>
                  </div>

                  {progress.teacher_notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Teacher Notes</p>
                      <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">
                        {progress.teacher_notes}
                      </p>
                    </div>
                  )}

                  {progress.last_reviewed_at && (
                    <p className="text-xs text-gray-400 mt-3">
                      Last reviewed: {fmtDate(progress.last_reviewed_at)}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Attendance History ───────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-forest-900 text-lg">
                  Attendance History
                </h2>
                {attendance && attendance.total > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-display font-semibold text-forest-600">
                      {attendance.rate_pct ?? 0}%
                    </p>
                    <p className="text-xs text-gray-400">
                      {attendance.attended}/{attendance.total} sessions attended
                    </p>
                  </div>
                )}
              </div>

              {!attendance || attendance.total === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No attendance records yet"
                  description="Your attendance will appear here once you join sessions."
                />
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {attendance.rows.map((row) => (
                      <div key={row.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{row.session_title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(row.occurrence_date)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {fmtDuration(row.duration_seconds) && (
                            <span className="text-xs text-gray-400">{fmtDuration(row.duration_seconds)}</span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                            ${row.present
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-600'}`}>
                            {row.present ? '✓ Present' : '✗ Absent'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {attendance.rows.length < attendTotal && (
                    <button
                      onClick={loadMoreAttendance}
                      className="mt-4 w-full text-sm text-forest-600 hover:text-forest-700
                                 font-medium py-2 border border-forest-100 rounded-xl
                                 hover:bg-forest-50 transition-colors"
                    >
                      Load more
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── Teacher Notes ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-display font-semibold text-forest-900 text-lg mb-4">
                Teacher Feedback
              </h2>

              {notes.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title="No feedback yet"
                  description="Notes from your teacher will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-600">{note.teacher_name}</p>
                        <p className="text-xs text-gray-400">{fmtDate(note.created_at)}</p>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MyProgressPage;
