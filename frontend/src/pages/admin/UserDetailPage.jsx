// src/pages/admin/UserDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userApi } from '../../api/userApi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Spinner } from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

// ─── Info row ──────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-36 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-700 text-right flex-1">
      {value ?? <span className="text-gray-300 italic">Not provided</span>}
    </span>
  </div>
);

// ─── Section card ──────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
    <h3 className="font-display font-semibold text-forest-900 mb-4 pb-3 border-b border-gray-100">
      {title}
    </h3>
    {children}
  </div>
);

// ─── Main page ─────────────────────────────────────────────────────────────

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await userApi.getUserById(id);
        setUser(data.data.user);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    setActionLoading(true);
    try {
      await userApi.updateUserStatus(id, selectedStatus);
      setUser((prev) => ({ ...prev, status: selectedStatus }));
      toast.success(`User ${selectedStatus} successfully`);
      setShowStatusModal(false);
      setSelectedStatus('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyIjazah = async () => {
    setActionLoading(true);
    try {
      await userApi.verifyIjazah(id);
      setUser((prev) => ({
        ...prev,
        ijazah_verified: true,
        ijazah_verified_at: new Date().toISOString(),
      }));
      toast.success('Ijazah verified successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await userApi.deleteUser(id);
      toast.success('User account deleted');
      navigate('/admin/users');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
      setActionLoading(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-MY', {
      day: 'numeric', month: 'long', year: 'numeric',
    }) : null;

  if (loading) {
    return (
      <DashboardLayout title="User Detail">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout title="User Detail">
        <div className="text-center py-20">
          <p className="text-red-500 text-sm mb-4">{error || 'User not found'}</p>
          <Link to="/admin/users">
            <Button variant="secondary" size="sm">← Back to Users</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusOptions = ['active', 'suspended', 'banned', 'pending']
    .filter((s) => s !== user.status);

  return (
    <DashboardLayout title="User Detail">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-4xl mx-auto"
      >
        {/* Back link */}
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400
                     hover:text-forest-600 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar src={user.avatar_url} name={user.full_name} size="xl" />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display text-2xl font-semibold text-forest-900">
                  {user.full_name}
                </h2>
                <Badge variant={user.role}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge variant={user.status}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
                {user.email_verified && (
                  <Badge variant="success">✓ Verified</Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm">{user.email}</p>
              {user.phone && (
                <p className="text-gray-400 text-xs mt-0.5">{user.phone}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Joined {formatDate(user.created_at)}
                {user.last_login_at && ` · Last login ${formatDate(user.last_login_at)}`}
              </p>
            </div>

            {/* Admin actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStatusModal(true)}
              >
                Change Status
              </Button>
              {user.role === 'teacher' && !user.ijazah_verified && user.ijazah_chain && (
                <Button
                  variant="gold"
                  size="sm"
                  loading={actionLoading}
                  onClick={handleVerifyIjazah}
                >
                  Verify Ijazah
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Info sections */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Personal info */}
          <Section title="Personal Information">
            <InfoRow label="Gender" value={user.gender} />
            <InfoRow label="Date of Birth" value={formatDate(user.date_of_birth)} />
            <InfoRow label="Nationality" value={user.nationality} />
            <InfoRow label="Language" value={user.preferred_language} />
          </Section>

          {/* Role-specific info */}
          {user.role === 'student' && (
            <Section title="Student Profile">
              <InfoRow label="Level" value={user.current_level} />
              <InfoRow label="Juz Memorized" value={user.total_juz_memorized} />
              <InfoRow label="Guardian" value={user.guardian_name} />
              <InfoRow label="Guardian Phone" value={user.guardian_phone} />
              <InfoRow label="Enrolled" value={formatDate(user.enrollment_date)} />
              {user.notes && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{user.notes}</p>
                </div>
              )}
            </Section>
          )}

          {user.role === 'teacher' && (
            <Section title="Teacher Profile">
              <InfoRow label="Experience" value={user.years_experience ? `${user.years_experience} years` : null} />
              <InfoRow label="Timezone" value={user.timezone} />
              <InfoRow label="Max Students" value={user.max_students} />
              <InfoRow
                label="Ijazah"
                value={
                  user.ijazah_verified
                    ? `✓ Verified on ${formatDate(user.ijazah_verified_at)}`
                    : user.ijazah_chain
                    ? 'Pending verification'
                    : null
                }
              />
              {user.cv_url && (
                <InfoRow
                  label="CV"
                  value={
                    <a
                      href={user.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest-600 hover:underline"
                    >
                      View CV →
                    </a>
                  }
                />
              )}
            </Section>
          )}

          {user.role === 'admin' && (
            <Section title="Admin Profile">
              <InfoRow label="Department" value={user.department} />
              <InfoRow
                label="Super Admin"
                value={user.is_super_admin ? 'Yes' : 'No'}
              />
              {user.permissions?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Permissions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.permissions.map((p) => (
                      <Badge key={p} variant="info">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Teacher bio / specializations */}
          {user.role === 'teacher' && (user.bio || user.specializations?.length > 0) && (
            <Section title="Professional Details">
              {user.specializations?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.specializations.map((s) => (
                      <Badge key={s} variant="teacher">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {user.bio && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
                </div>
              )}
            </Section>
          )}
        </div>
      </motion.div>

      {/* Status change modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => { setShowStatusModal(false); setSelectedStatus(''); }}
        title="Change Account Status"
        size="sm"
      >
        <div className="space-y-2 mb-5">
          {statusOptions.map((s) => (
            <label
              key={s}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${selectedStatus === s
                  ? 'border-forest-500 bg-forest-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={selectedStatus === s}
                onChange={() => setSelectedStatus(s)}
                className="accent-forest-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">{s}</p>
                <p className="text-xs text-gray-400">
                  {s === 'active' && 'Allow user to access the platform'}
                  {s === 'suspended' && 'Temporarily revoke access'}
                  {s === 'banned' && 'Permanently block this account'}
                  {s === 'pending' && 'Reset to awaiting approval'}
                </p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedStatus}
            loading={actionLoading}
            onClick={handleStatusChange}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="sm"
      >
        <div className="mb-5">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            This will anonymize{' '}
            <span className="font-medium text-gray-800">{user.full_name}</span>'s account.
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={actionLoading}
            onClick={handleDelete}
          >
            Delete Account
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default UserDetailPage;