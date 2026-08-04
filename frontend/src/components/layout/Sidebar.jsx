// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import LanguageSwitcher from '../common/LanguageSwitcher';
import toast from 'react-hot-toast';
import logoImg from '../../assets/logo.png';

const QuranIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const GuidanceIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ApprovalIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SessionsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MessagesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const AssessmentsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const ProgressIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const adminNavItems = [
  { key: 'nav.dashboard',        to: '/admin/dashboard',  icon: <DashboardIcon /> },
  { key: 'nav.users',            to: '/admin/users',      icon: <UsersIcon /> },
  { key: 'nav.pendingApprovals', to: '/admin/pending',    icon: <ApprovalIcon /> },
  { key: 'nav.sessions',         to: '/admin/sessions',   icon: <SessionsIcon /> },
  { key: 'nav.messages',         to: '/admin/messages',   icon: <MessagesIcon /> },
  { key: 'nav.reports',          to: '/admin/reports',    icon: <ReportsIcon /> },
  { key: 'nav.guidance',         to: '/admin/chatbot',    icon: <GuidanceIcon /> },
  { key: 'nav.profile',          to: '/admin/profile',    icon: <ProfileIcon /> },
];

const teacherNavItems = [
  { key: 'nav.dashboard',  to: '/teacher/dashboard',   icon: <DashboardIcon /> },
  { key: 'nav.sessions',   to: '/teacher/sessions',    icon: <SessionsIcon /> },
  { key: 'nav.quran',      to: '/teacher/quran/read',  icon: <QuranIcon /> },
  { key: 'nav.messages',   to: '/teacher/messages',    icon: <MessagesIcon /> },
  { key: 'nav.reports',    to: '/teacher/reports',     icon: <ReportsIcon /> },
  { key: 'nav.guidance',   to: '/teacher/chatbot',     icon: <GuidanceIcon /> },
  { key: 'nav.profile',    to: '/teacher/profile',     icon: <ProfileIcon /> },
];

const studentNavItems = [
  { key: 'nav.dashboard',   to: '/student/dashboard',   icon: <DashboardIcon /> },
  { key: 'nav.sessions',    to: '/student/sessions',    icon: <SessionsIcon /> },
  { key: 'nav.quran',       to: '/student/quran/read',  icon: <QuranIcon /> },
  { key: 'nav.assessments', to: '/student/assessments', icon: <AssessmentsIcon /> },
  { key: 'nav.progress',    to: '/student/progress',    icon: <ProgressIcon /> },
  { key: 'nav.messages',    to: '/student/messages',    icon: <MessagesIcon /> },
  { key: 'nav.reports',     to: '/student/reports',     icon: <ReportsIcon /> },
  { key: 'nav.guidance',    to: '/student/chatbot',     icon: <GuidanceIcon /> },
  { key: 'nav.profile',     to: '/student/profile',     icon: <ProfileIcon /> },
];

const navByRole = { admin: adminNavItems, teacher: teacherNavItems, student: studentNavItems };

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navItems = navByRole[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success(t('nav.signedOut'));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed top-0 h-full z-30 w-64
          ${isRTL ? 'right-0' : 'left-0'}
          bg-gradient-to-b from-forest-950 via-forest-900 to-forest-950
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}
        `}
      >
        {/* Gold accent stripe */}
        <div
          className="absolute top-0 h-full w-1 opacity-60 ltr:left-0 rtl:right-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #d4af37 30%, #d4af37 70%, transparent 100%)',
          }}
        />

        {/* Logo */}
        <div className="px-6 pt-6 pb-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Tahfeez" className="w-9 h-9 object-contain flex-shrink-0" />
            <div>
              <p className="text-white font-display font-semibold text-base leading-none">Tahfeez</p>
              <p className="text-forest-400 text-xs mt-0.5">{t(`role.${user?.role}`)}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-150 group relative
                ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-forest-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold-400 rounded-full ltr:left-0 rtl:right-0"
                    />
                  )}
                  <span className={`transition-colors ${isActive ? 'text-gold-400' : 'text-forest-400 group-hover:text-forest-200'}`}>
                    {item.icon}
                  </span>
                  {t(item.key)}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card + language switcher + logout */}
        <div className="px-3 pb-5 pt-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-forest-400 text-xs truncate" dir="ltr">{user?.email}</p>
            </div>
          </div>

          <LanguageSwitcher className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-forest-400 hover:text-gold-300 hover:bg-white/5 mb-1" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-forest-400 hover:text-red-400 hover:bg-red-500/10
                       text-sm transition-all duration-150"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
