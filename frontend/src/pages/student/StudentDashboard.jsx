import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { attendanceApi } from '../../api/attendanceApi';
import { sessionApi } from '../../api/sessionApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { Spinner } from '../../components/common/EmptyState';

const ACTION_DEFS = [
  { icon: '📅', labelKey: 'dashboard.student.actions.sessions.label',   descKey: 'dashboard.student.actions.sessions.desc',   to: '/student/sessions',       accent: 'forest' },
  { icon: '🎤', labelKey: 'dashboard.student.actions.assessment.label', descKey: 'dashboard.student.actions.assessment.desc', to: '/student/assessments/new', accent: 'gold'   },
  { icon: '📊', labelKey: 'dashboard.student.actions.report.label',     descKey: 'dashboard.student.actions.report.desc',     to: '/student/reports',        accent: 'forest' },
  { icon: '📖', labelKey: 'dashboard.student.actions.quran.label',      descKey: 'dashboard.student.actions.quran.desc',      to: '/student/quran/read',     accent: 'teal'   },
  { icon: '💬', labelKey: 'dashboard.student.actions.messages.label',   descKey: 'dashboard.student.actions.messages.desc',   to: '/student/messages',       accent: 'blue'   },
  { icon: '📈', labelKey: 'dashboard.student.actions.progress.label',   descKey: 'dashboard.student.actions.progress.desc',   to: '/student/progress',       accent: 'gray'   },
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
  const { t } = useTranslation();
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

  const ACTIONS = ACTION_DEFS.map((a) => ({ ...a, label: t(a.labelKey), desc: t(a.descKey) }));
  const statusLabel = {
    not_started:    t('progress.status.not_started'),
    in_progress:    t('progress.status.in_progress'),
    needs_revision: t('progress.status.needs_revision'),
    completed:      t('progress.status.completed'),
    certified:      t('progress.status.certified'),
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
              <p className="text-teal-300 text-sm mb-0.5">{t('dashboard.student.greeting')}</p>
              <h2 className="font-display text-2xl font-semibold text-white">{user?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="student">{t('dashboard.student.badge.student')}</Badge>
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
              <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.student.stats.juzMemorized')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-center">
              <p className="text-2xl font-display font-semibold text-forest-700">
                {attendSummary?.rate_pct != null ? `${attendSummary.rate_pct}%` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.student.stats.attendanceRate')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-center">
              <p className="text-sm font-semibold text-forest-700 leading-tight mt-1">
                {statusLabel[progress?.status] ?? t('progress.status.not_started')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.student.stats.progressStatus')}</p>
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
                {t('dashboard.student.liveNow')} — {liveSessions.length} session{liveSessions.length > 1 ? 's' : ''} in progress
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
                      {s.teacher_name ? `${t('dashboard.student.teacher')} ${s.teacher_name} · ` : ''}
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
                      {t('dashboard.student.joinNow')}
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
                <h3 className="font-display font-semibold text-forest-900">{t('dashboard.student.hifzProgress.title')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t('dashboard.student.hifzProgress.subtitle')}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-semibold text-forest-600">
                  {juzMemorized}
                  <span className="text-sm text-gray-400 font-body font-normal"> / 30</span>
                </p>
                <p className="text-xs text-gray-400">{t('dashboard.student.hifzProgress.juzMemorized')}</p>
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
              <span>{t('dashboard.student.hifzProgress.start')}</span>
              <span>{t('dashboard.student.hifzProgress.halfway')}</span>
              <span>{t('dashboard.student.hifzProgress.complete')}</span>
            </div>
            {juzMemorized === 0 && (
              <div className="bg-forest-50 border border-forest-100 rounded-xl px-4 py-3">
                <p className="text-sm text-forest-700 leading-relaxed">
                  {t('dashboard.student.hifzProgress.notStarted')}
                </p>
              </div>
            )}
            {juzMemorized > 0 && juzMemorized < 30 && (
              <div className="bg-forest-50 border border-forest-100 rounded-xl px-4 py-3">
                <p className="text-sm text-forest-700">
                  {t('dashboard.student.hifzProgress.inProgress', { count: 30 - juzMemorized })}
                </p>
              </div>
            )}
            {juzMemorized >= 30 && (
              <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 text-center">
                <p className="text-gold-700 font-semibold">{t('dashboard.student.hifzProgress.completed')}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Quick Actions ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-1">{t('dashboard.student.quickActions.title')}</h3>
          <p className="text-xs text-gray-400 mb-4">{t('dashboard.student.quickActions.subtitle')}</p>
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
