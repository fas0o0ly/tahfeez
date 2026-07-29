import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { attendanceApi } from '../../api/attendanceApi';
import { sessionApi } from '../../api/sessionApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { Spinner } from '../../components/common/EmptyState';

const statusLabel = {
  not_started:    'Not Started',
  in_progress:    'In Progress',
  needs_revision: 'Needs Revision',
  completed:      'Completed',
  certified:      'Certified',
};

const ACTIONS = [
  {
    icon: '📅',
    label: 'My Sessions',
    desc: 'View your enrolled Halaqah sessions',
    to: '/student/sessions',
    accent: 'forest',
  },
  {
    icon: '🎤',
    label: 'New Assessment',
    desc: 'Start an AI recitation assessment',
    to: '/student/assessments/new',
    accent: 'gold',
  },
  {
    icon: '📊',
    label: 'My Report',
    desc: 'View progress, certificates & medals',
    to: '/student/reports',
    accent: 'forest',
  },
  {
    icon: '📖',
    label: 'Quran Reader',
    desc: 'Read and study the Holy Quran',
    to: '/student/quran/read',
    accent: 'teal',
  },
  {
    icon: '💬',
    label: 'Messages',
    desc: 'Send a message to your teacher',
    to: '/student/messages',
    accent: 'blue',
  },
  {
    icon: '📈',
    label: 'My Progress',
    desc: 'Attendance & memorization history',
    to: '/student/progress',
    accent: 'gray',
  },
];

const accentHover = {
  forest: 'hover:border-forest-200 hover:bg-forest-50',
  gold:   'hover:border-gold-200   hover:bg-gold-50',
  teal:   'hover:border-teal-200   hover:bg-teal-50',
  blue:   'hover:border-blue-200   hover:bg-blue-50',
  gray:   'hover:border-gray-200   hover:bg-gray-50',
};

const accentIcon = {
  forest: 'bg-forest-100',
  gold:   'bg-gold-50',
  teal:   'bg-teal-100',
  blue:   'bg-blue-100',
  gray:   'bg-gray-100',
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [progress, setProgress]         = useState(null);
  const [attendSummary, setAttend]      = useState(null);
  const [progressLoading, setProgLoad]  = useState(true);
  const [liveSessions, setLiveSessions] = useState([]);
  const [liveLoading, setLiveLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setProgLoad(true);
      try {
        const [progRes, attendRes] = await Promise.all([
          attendanceApi.getMyProgress(),
          attendanceApi.getMyAttendance({ page: 1, limit: 1 }),
        ]);
        setProgress(progRes.data.data.progress);
        setAttend(attendRes.data.data);
      } catch { /* fall back to showing zeros */ }
      finally { setProgLoad(false); }
    };
    load();
  }, []);

  useEffect(() => {
    sessionApi.listSessions({ status: 'live', limit: 20 })
      .then((r) => {
        const all = r.data.data.sessions || [];
        // Only show sessions the student is actively enrolled and approved for
        setLiveSessions(all.filter((s) => s.my_enrollment_status === 'approved'));
      })
      .catch(() => {})
      .finally(() => setLiveLoading(false));
  }, []);

  const juzMemorized = parseFloat(progress?.total_juz_memorized ?? profile?.total_juz_memorized ?? 0);
  const juzPercent   = Math.min((juzMemorized / 30) * 100, 100);

  const levelColors = {
    beginner:     'student',
    intermediate: 'teacher',
    advanced:     'gold',
  };

  const loading = profileLoading || progressLoading;

  return (
    <DashboardLayout title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-forest-900 to-teal-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#d4af37" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots2)" />
            </svg>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <Avatar src={user?.avatar_url} name={user?.full_name} size="lg" />
            <div>
              <p className="text-teal-300 text-sm mb-0.5">As-salamu alaykum</p>
              <h2 className="font-display text-2xl font-semibold text-white">{user?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="student">Student</Badge>
                {profile?.current_level && (
                  <Badge variant={levelColors[profile.current_level] || 'info'}>
                    {profile.current_level.charAt(0).toUpperCase() + profile.current_level.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {!loading && (attendSummary || progress) && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-center">
              <p className="text-2xl font-display font-semibold text-forest-700">{juzMemorized}</p>
              <p className="text-xs text-gray-400 mt-0.5">Juz memorized</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-center">
              <p className="text-2xl font-display font-semibold text-forest-700">
                {attendSummary?.rate_pct != null ? `${attendSummary.rate_pct}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Attendance rate</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-center">
              <p className="text-sm font-semibold text-forest-700 leading-tight mt-1">
                {statusLabel[progress?.status] ?? 'Not started'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Progress status</p>
            </div>
          </div>
        )}

        {/* ─── Live Sessions ─────────────────────────────────────────────── */}
        {!liveLoading && liveSessions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <h3 className="font-display font-semibold text-forest-900 text-sm">
                Live Now — {liveSessions.length} session{liveSessions.length > 1 ? 's' : ''} in progress
              </h3>
            </div>
            <div className="space-y-3">
              {liveSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4
                             bg-gradient-to-r from-red-50 to-orange-50
                             border border-red-200 rounded-2xl px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.teacher_name ? `Teacher: ${s.teacher_name} · ` : ''}
                      {s.session_type?.replace('_', '-')} · {s.session_language}
                    </p>
                  </div>
                  <Link to={`/sessions/${s.id}/live`} className="flex-shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl
                                       bg-red-500 hover:bg-red-600 text-white text-sm font-semibold
                                       transition-colors shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Now
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memorization progress */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-forest-900">Hifz Progress</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your Quran memorization journey</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-semibold text-forest-600">
                  {juzMemorized}
                  <span className="text-sm text-gray-400 font-body font-normal"> / 30</span>
                </p>
                <p className="text-xs text-gray-400">Juz memorized</p>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${juzPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-gradient-to-r from-forest-500 to-teal-400 rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-5">
              <span>Start</span>
              <span>15 Juz</span>
              <span>Complete ✓</span>
            </div>
            {juzMemorized === 0 && (
              <div className="bg-forest-50 border border-forest-100 rounded-xl px-4 py-3">
                <p className="text-sm text-forest-700 leading-relaxed">
                  Your progress will be updated by your teacher after each session.
                  Join a Halaqah to begin your journey!
                </p>
              </div>
            )}
            {juzMemorized > 0 && juzMemorized < 30 && (
              <div className="bg-forest-50 border border-forest-100 rounded-xl px-4 py-3">
                <p className="text-sm text-forest-700">
                  MashaAllah! {30 - juzMemorized} Juz remaining. Keep up the excellent work!
                </p>
              </div>
            )}
            {juzMemorized >= 30 && (
              <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 text-center">
                <p className="text-gold-700 font-semibold">Alhamdulillah — Hafiz Al-Quran!</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Quick Actions ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-1">Quick Actions</h3>
          <p className="text-xs text-gray-400 mb-4">Jump to your most-used features</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACTIONS.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={action.to} className="block group">
                  <div className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100
                                   transition-all ${accentHover[action.accent]}`}>
                    <div className={`w-10 h-10 rounded-xl ${accentIcon[action.accent]}
                                     flex items-center justify-center text-xl flex-shrink-0`}>
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                      <p className="text-xs text-gray-400 leading-snug">{action.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-gray-500 transition-colors"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
