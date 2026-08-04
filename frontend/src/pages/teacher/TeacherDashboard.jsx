import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { sessionApi } from '../../api/sessionApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Spinner } from '../../components/common/EmptyState';

const ACTION_DEFS = [
  { icon: '📅', labelKey: 'dashboard.teacher.actions.sessions.label',    descKey: 'dashboard.teacher.actions.sessions.desc',    to: '/teacher/sessions',  accent: 'forest' },
  { icon: '✅', labelKey: 'dashboard.teacher.actions.attendance.label',   descKey: 'dashboard.teacher.actions.attendance.desc',   to: '/teacher/sessions',  accent: 'forest' },
  { icon: '📊', labelKey: 'dashboard.teacher.actions.reports.label',      descKey: 'dashboard.teacher.actions.reports.desc',      to: '/teacher/reports',   accent: 'gold'   },
  { icon: '🎤', labelKey: 'dashboard.teacher.actions.assessments.label',  descKey: 'dashboard.teacher.actions.assessments.desc',  to: '/teacher/sessions',  accent: 'forest' },
  { icon: '💬', labelKey: 'dashboard.teacher.actions.messages.label',     descKey: 'dashboard.teacher.actions.messages.desc',     to: '/teacher/messages',  accent: 'blue'   },
  { icon: '👤', labelKey: 'dashboard.teacher.actions.profile.label',      descKey: 'dashboard.teacher.actions.profile.desc',      to: '/teacher/profile',   accent: 'gray'   },
];

const accentHover = {
  forest: 'hover:border-forest-200 hover:bg-forest-50 group-hover:bg-forest-200',
  gold:   'hover:border-gold-200   hover:bg-gold-50   group-hover:bg-gold-100',
  blue:   'hover:border-blue-200   hover:bg-blue-50   group-hover:bg-blue-100',
  gray:   'hover:border-gray-200   hover:bg-gray-50   group-hover:bg-gray-200',
};

const accentIcon = {
  forest: 'bg-forest-100',
  gold:   'bg-gold-50',
  blue:   'bg-blue-100',
  gray:   'bg-gray-100',
};

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const [liveSessions, setLiveSessions] = useState([]);
  const [liveLoading, setLiveLoading]   = useState(true);

  useEffect(() => {
    sessionApi.getMyTeacherSessions()
      .then((r) => {
        const all = r.data.data.sessions || [];
        setLiveSessions(all.filter((s) => s.status === 'live'));
      })
      .catch(() => {})
      .finally(() => setLiveLoading(false));
  }, []);

  const ACTIONS = ACTION_DEFS.map((a) => ({ ...a, label: t(a.labelKey), desc: t(a.descKey) }));

  const completionItems = [
    { label: t('dashboard.teacher.profileCompletion.photo'),   done: !!profile?.avatar_url },
    { label: t('dashboard.teacher.profileCompletion.bio'),     done: !!profile?.bio },
    { label: t('dashboard.teacher.profileCompletion.quals'),   done: !!profile?.qualifications },
    { label: t('dashboard.teacher.profileCompletion.ijazah'),  done: !!profile?.ijazah_chain },
    { label: t('dashboard.teacher.profileCompletion.days'),    done: (profile?.available_days?.length ?? 0) > 0 },
    { label: t('dashboard.teacher.profileCompletion.cv'),      done: !!profile?.cv_url },
  ];

  const completedCount    = completionItems.filter((i) => i.done).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);

  return (
    <DashboardLayout title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto"
      >
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-forest-900 to-forest-700 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#d4af37" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <Avatar src={user?.avatar_url} name={user?.full_name} size="lg" />
            <div>
              <p className="text-forest-300 text-sm mb-0.5">{t('dashboard.teacher.greeting')}</p>
              <h2 className="font-display text-2xl font-semibold text-white">{user?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="teacher">{t('dashboard.teacher.badge.teacher')}</Badge>
                {profile?.ijazah_verified && <Badge variant="gold">{t('dashboard.teacher.badge.ijazahVerified')}</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Live Sessions ─────────────────────────────────────────────── */}
        {!liveLoading && liveSessions.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <h3 className="font-display font-semibold text-forest-900 text-sm">
                {t('dashboard.teacher.liveNow')} — {liveSessions.length} session{liveSessions.length > 1 ? 's' : ''} active
              </h3>
            </div>
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
                    {t('dashboard.teacher.joinSession')}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ─── Profile completion ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-forest-900">{t('dashboard.teacher.profileCompletion.title')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('dashboard.teacher.profileCompletion.subtitle')}
                </p>
              </div>
              <span className="text-2xl font-display font-semibold text-forest-600">
                {completionPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-gradient-to-r from-forest-500 to-forest-400 rounded-full"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-2 mb-5">
              {completionItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-forest-100' : 'bg-gray-100'
                  }`}>
                    {item.done ? (
                      <svg className="w-3 h-3 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {completionPercent < 100 && (
              <Link to="/teacher/profile">
                <Button variant="primary" size="sm">{t('dashboard.teacher.profileCompletion.cta')}</Button>
              </Link>
            )}
          </div>
        )}

        {/* ─── Quick Actions ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-1">{t('dashboard.teacher.quickActions.title')}</h3>
          <p className="text-xs text-gray-400 mb-4">{t('dashboard.teacher.quickActions.subtitle')}</p>
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
                                     flex items-center justify-center transition-colors
                                     text-xl flex-shrink-0`}>
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

export default TeacherDashboard;
