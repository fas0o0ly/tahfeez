// src/components/common/RouteGuards.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_DASHBOARDS } from '../../utils/constants';
import PageLoader from './PageLoader';

// Requires authentication + optional role check
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROLE_DASHBOARDS[user?.role] || '/login'} replace />;
  }

  return children;
};

// Redirects authenticated users away from auth pages
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageLoader />;

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_DASHBOARDS[user.role] || '/'} replace />; 
  }

  return children;
};