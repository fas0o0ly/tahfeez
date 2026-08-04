// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../api/userApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { Spinner } from '../../components/common/EmptyState';

const StatCard = ({ label, value, sub, icon, delay = 0, accent = 'green' }) => {
  const accents = {
    green:  'from-forest-600 to-forest-500',
    gold:   'from-gold-600 to-gold-400',
    amber:  'from-amber-500 to-amber-400',
    red:    'from-red-500 to-red-400',
    purple: 'from-purple-600 to-purple-400',
    blue:   'from-blue-600 to-blue-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex items-start gap-4"
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accents[accent]}
                       flex items-center justify-center flex-shrink-0 text-white text-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-semibold text-forest-900 leading-none">
          {value ?? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" />}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub !== undefined && (
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        )}
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          userApi.getUserStats(),
          userApi.getPendingTeachers(),
        ]);
        setStats(statsRes.data.data.stats);
        setPendingTeachers(pendingRes.data.data.teachers.slice(0, 5));
      } catch {
        // Errors handled silently — stats show skeleton
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="font-display text-2xl font-semibold text-forest-900">
          {t('dashboard.admin.title')}
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {t('dashboard.admin.subtitle')}
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t('dashboard.admin.stats.totalUsers')}
          value={stats?.total_users}
          sub={t('dashboard.admin.stats.newThisWeek', { count: stats?.new_this_week ?? '—' })}
          icon="👥"
          accent="green"
          delay={0}
        />
        <StatCard
          label={t('dashboard.admin.stats.students')}
          value={stats?.total_students}
          icon="📖"
          accent="blue"
          delay={0.05}
        />
        <StatCard
          label={t('dashboard.admin.stats.teachers')}
          value={stats?.total_teachers}
          icon="🎓"
          accent="purple"
          delay={0.1}
        />
        <StatCard
          label={t('dashboard.admin.stats.pendingApprovals')}
          value={stats?.pending_teachers}
          icon="⏳"
          accent="amber"
          delay={0.15}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t('dashboard.admin.stats.activeUsers')}
          value={stats?.active_users}
          icon="✅"
          accent="green"
          delay={0.2}
        />
        <StatCard
          label={t('dashboard.admin.stats.suspended')}
          value={stats?.suspended_users}
          icon="⚠️"
          accent="amber"
          delay={0.25}
        />
        <StatCard
          label={t('dashboard.admin.stats.banned')}
          value={stats?.banned_users}
          icon="🚫"
          accent="red"
          delay={0.3}
        />
        <StatCard
          label={t('dashboard.admin.stats.newThisMonth')}
          value={stats?.new_this_month}
          icon="📈"
          accent="gold"
          delay={0.35}
        />
      </div>

      {/* Pending teachers widget */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-card"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-display font-semibold text-forest-900">
              {t('dashboard.admin.pending.title')}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('dashboard.admin.pending.subtitle')}
            </p>
          </div>
          <Link
            to="/admin/pending"
            className="text-xs text-forest-600 hover:text-forest-800
                       font-medium transition-colors"
          >
            {t('dashboard.admin.pending.viewAll')}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm text-gray-500">{t('dashboard.admin.pending.empty')}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {pendingTeachers.map((teacher) => (
              <li key={teacher.id}>
                <Link
                  to={`/admin/users/${teacher.id}`}
                  className="flex items-center gap-4 px-6 py-3.5
                             hover:bg-gray-50 transition-colors"
                >
                  <Avatar
                    src={teacher.avatar_url}
                    name={teacher.full_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {teacher.full_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {teacher.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="pending">{t('common.status.pending')}</Badge>
                    <svg
                      className="w-4 h-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;