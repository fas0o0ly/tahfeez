// src/components/layout/Topbar.jsx
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import NotificationBell from '../common/NotificationBell';

const Topbar = ({ onMenuOpen, title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center
                        justify-between px-4 lg:px-6 flex-shrink-0">
      {/* Left — mobile menu + page title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {title && (
          <h1 className="font-display text-lg font-semibold text-forest-900 hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      {/* Right — notifications + user identity */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-800 leading-none">{user?.full_name}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
        </div>
        <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
      </div>
    </header>
  );
};

export default Topbar;