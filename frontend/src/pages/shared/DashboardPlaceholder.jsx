// src/pages/shared/DashboardPlaceholder.jsx
// Temporary placeholder dashboards until Module 2 is built

import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const DashboardPlaceholder = ({ role }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const colors = {
    admin: 'from-purple-900 to-purple-700',
    teacher: 'from-forest-900 to-forest-700',
    student: 'from-forest-800 to-teal-700',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors[role]} flex items-center justify-center p-6`}>
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-forest-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">
            {role === 'admin' ? '🛡️' : role === 'teacher' ? '🎓' : '📖'}
          </span>
        </div>

        <h1 className="text-2xl font-display font-semibold text-forest-900 mb-1">
          {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
        </h1>

        <p className="text-gray-500 text-sm mb-1">
          Welcome, <span className="text-forest-700 font-medium">{user?.full_name}</span>
        </p>
        <p className="text-gray-400 text-xs mb-8">
          Module 2 (User Management) coming next.
        </p>

        <div className="bg-forest-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-medium text-forest-700 mb-2 uppercase tracking-wide">Session Info</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Role: <span className="text-gray-700 font-medium">{user?.role}</span></p>
            <p className="text-xs text-gray-500">Email: <span className="text-gray-700 font-medium">{user?.email}</span></p>
            <p className="text-xs text-gray-500">Status: <span className="text-green-600 font-medium">{user?.status}</span></p>
          </div>
        </div>

        <Button variant="danger" size="md" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export const AdminDashboard = () => <DashboardPlaceholder role="admin" />;
export const TeacherDashboard = () => <DashboardPlaceholder role="teacher" />;
export const StudentDashboard = () => <DashboardPlaceholder role="student" />;