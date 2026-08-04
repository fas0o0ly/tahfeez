// src/pages/admin/UsersPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUsers } from '../../hooks/useUsers';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { Spinner, EmptyState, Pagination } from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

// ─── Filter bar ────────────────────────────────────────────────────────────

const FilterBar = ({ filters, onFilterChange }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange('search', search);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('users.search.placeholder')}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-forest-200 focus:border-forest-400
                       bg-white placeholder:text-gray-400"
          />
        </div>
        <Button type="submit" variant="primary" size="sm">{t('common.search')}</Button>
      </form>

      {/* Role filter */}
      <select
        value={filters.role}
        onChange={(e) => onFilterChange('role', e.target.value)}
        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                   focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
      >
        <option value="">{t('users.filter.allRoles')}</option>
        <option value="student">{t('role.student')}</option>
        <option value="teacher">{t('role.teacher')}</option>
        <option value="admin">{t('role.admin')}</option>
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                   focus:outline-none focus:ring-2 focus:ring-forest-200 text-gray-700"
      >
        <option value="">{t('users.filter.allStatuses')}</option>
        <option value="active">{t('common.status.active')}</option>
        <option value="pending">{t('common.status.pending')}</option>
        <option value="suspended">{t('common.status.suspended')}</option>
        <option value="banned">{t('common.status.banned')}</option>
      </select>
    </div>
  );
};

// ─── Status action modal ───────────────────────────────────────────────────

const StatusModal = ({ user, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const options = [
    { value: 'active',    label: t('users.statusModal.activate.label'), description: t('users.statusModal.activate.desc'), variant: 'success' },
    { value: 'suspended', label: t('users.statusModal.suspend.label'),  description: t('users.statusModal.suspend.desc'),  variant: 'warning' },
    { value: 'banned',    label: t('users.statusModal.ban.label'),      description: t('users.statusModal.ban.desc'),      variant: 'error'   },
  ].filter((o) => o.value !== user?.status);

  const handleConfirm = async () => {
    if (!status) return;
    setLoading(true);
    const ok = await onConfirm(user.id, status);
    setLoading(false);
    if (ok) onClose();
  };

  return (
    <Modal isOpen={!!user} onClose={onClose} title={t('users.statusModal.title')} size="sm">
      <div className="space-y-3 mb-5">
        <p className="text-sm text-gray-500">
          {t('users.statusModal.prompt', { name: user?.full_name })}
        </p>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
              ${status === opt.value
                ? 'border-forest-500 bg-forest-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <input
              type="radio"
              name="status"
              value={opt.value}
              checked={status === opt.value}
              onChange={() => setStatus(opt.value)}
              className="mt-0.5 accent-forest-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!status}
          loading={loading}
          onClick={handleConfirm}
        >
          {t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────

const UsersPage = () => {
  const { t } = useTranslation();
  const { users, pagination, loading, error, filters, updateFilter, setPage, updateUserStatus } = useUsers();
  const [statusTarget, setStatusTarget] = useState(null);

  const handleStatusConfirm = async (id, status) => {
    return updateUserStatus(id, status);
  };

  return (
    <DashboardLayout title="Users">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-forest-900">{t('users.title')}</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {pagination ? t('users.totalCount', { count: pagination.total }) : t('users.loading')}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-4">
          <FilterBar filters={filters} onFilterChange={updateFilter} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : error ? (
            <EmptyState
              icon="⚠️"
              title={t('users.error')}
              description={error}
            />
          ) : users.length === 0 ? (
            <EmptyState
              icon="👤"
              title={t('users.notFound.title')}
              description={t('users.notFound.desc')}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('users.table.user')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('users.table.role')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('users.table.status')}
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('users.table.joined')}
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('users.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                                {user.full_name}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={user.role}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={user.status}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setStatusTarget(user)}
                              className="text-xs text-gray-500 hover:text-forest-600
                                         font-medium transition-colors px-2 py-1
                                         rounded-lg hover:bg-forest-50"
                            >
                              {t('users.changeStatus')}
                            </button>
                            <Link
                              to={`/admin/users/${user.id}`}
                              className="text-xs text-forest-600 hover:text-forest-800
                                         font-medium transition-colors px-2 py-1
                                         rounded-lg hover:bg-forest-50"
                            >
                              {t('users.view')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {users.map((user) => (
                  <div key={user.id} className="px-4 py-3.5 flex items-center gap-3">
                    <Avatar src={user.avatar_url} name={user.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role}>{user.role}</Badge>
                        <Badge variant={user.status}>{user.status}</Badge>
                      </div>
                    </div>
                    <Link to={`/admin/users/${user.id}`} className="text-gray-300 hover:text-forest-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="px-4 md:px-6 border-t border-gray-100">
                <Pagination pagination={pagination} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Status change modal */}
      <StatusModal
        user={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </DashboardLayout>
  );
};

export default UsersPage;