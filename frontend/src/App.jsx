// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/common/RouteGuards';

// ─── Auth pages ────────────────────────────────────────────────────────────
import LoginPage          from './pages/shared/LoginPage';
import RegisterPage       from './pages/shared/RegisterPage';
import VerifyEmailPage    from './pages/shared/VerifyEmailPage';
import ForgotPasswordPage from './pages/shared/ForgotPasswordPage';
import ResetPasswordPage  from './pages/shared/ResetPasswordPage';

// ─── Admin pages ───────────────────────────────────────────────────────────
import AdminDashboard         from './pages/admin/AdminDashboard';
import UsersPage              from './pages/admin/UsersPage';
import UserDetailPage         from './pages/admin/UserDetailPage';
import PendingTeachersPage    from './pages/admin/PendingTeachersPage';
import SessionsPage           from './pages/admin/SessionsPage';
import CreateSessionPage      from './pages/admin/CreateSessionPage';
import AdminSessionDetailPage from './pages/admin/AdminSessionDetailPage';
import AdminReportsPage       from './pages/admin/AdminReportsPage';

// ─── Teacher pages ─────────────────────────────────────────────────────────
import TeacherDashboard                  from './pages/teacher/TeacherDashboard';
import TeacherSessionsPage               from './pages/teacher/TeacherSessionsPage';
import TeacherSessionDetailPage          from './pages/teacher/TeacherSessionDetailPage';
import TeacherStudentAssessmentsPage     from './pages/teacher/TeacherStudentAssessmentsPage';
import TeacherReportsPage                from './pages/teacher/TeacherReportsPage';

// ─── Student pages ─────────────────────────────────────────────────────────
import StudentDashboard         from './pages/student/StudentDashboard';
import StudentSessionsPage      from './pages/student/StudentSessionsPage';
import StudentSessionDetailPage from './pages/student/StudentSessionDetailPage';
import AssessmentPage           from './pages/student/AssessmentPage';
import NewAssessmentPage        from './pages/student/NewAssessmentPage';
import MyProgressPage           from './pages/student/MyProgressPage';
import StudentReportsPage       from './pages/student/StudentReportsPage';

// ─── Shared pages ──────────────────────────────────────────────────────────
import ProfilePage        from './pages/shared/ProfilePage';
import LiveSessionPage    from './pages/shared/LiveSessionPage';
import QuranPage          from './pages/shared/QuranPage';
import QuranReaderPage    from './pages/shared/QuranReaderPage';
import MessagesPage       from './pages/shared/MessagesPage';
import NotificationsPage  from './pages/shared/NotificationsPage';
import ChatbotPage        from './pages/shared/ChatbotPage';

// ─── Landing page ──────────────────────────────────────────────────────────
import LandingPage from './pages/LandingPage';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

        {/* ─── Public auth routes ─────────────────────────────────────── */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        {/* ─── Live session ───────────────────────────────────────────── */}
        <Route path="/sessions/:id/live" element={
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <LiveSessionPage />
          </ProtectedRoute>
        } />

        {/* ─── Admin routes ───────────────────────────────────────────── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>
        } />
        <Route path="/admin/users/:id" element={
          <ProtectedRoute allowedRoles={['admin']}><UserDetailPage /></ProtectedRoute>
        } />
        <Route path="/admin/pending" element={
          <ProtectedRoute allowedRoles={['admin']}><PendingTeachersPage /></ProtectedRoute>
        } />
        <Route path="/admin/sessions" element={
          <ProtectedRoute allowedRoles={['admin']}><SessionsPage /></ProtectedRoute>
        } />
        <Route path="/admin/sessions/create" element={
          <ProtectedRoute allowedRoles={['admin']}><CreateSessionPage /></ProtectedRoute>
        } />
        <Route path="/admin/sessions/:id" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminSessionDetailPage /></ProtectedRoute>
        } />
        <Route path="/admin/profile" element={
          <ProtectedRoute allowedRoles={['admin']}><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/admin/messages" element={
          <ProtectedRoute allowedRoles={['admin']}><MessagesPage /></ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}><NotificationsPage /></ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>
        } />
        <Route path="/admin/chatbot" element={
          <ProtectedRoute allowedRoles={['admin']}><ChatbotPage /></ProtectedRoute>
        } />

        {/* ─── Teacher routes ─────────────────────────────────────────── */}
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/teacher/sessions" element={
          <ProtectedRoute allowedRoles={['teacher']}><TeacherSessionsPage /></ProtectedRoute>
        } />
        <Route path="/teacher/sessions/:id" element={
          <ProtectedRoute allowedRoles={['teacher']}><TeacherSessionDetailPage /></ProtectedRoute>
        } />
        <Route path="/teacher/quran" element={
          <ProtectedRoute allowedRoles={['teacher']}><QuranPage /></ProtectedRoute>
        } />
        <Route path="/teacher/quran/read" element={
          <ProtectedRoute allowedRoles={['teacher']}><QuranReaderPage /></ProtectedRoute>
        } />
        <Route path="/teacher/profile" element={
          <ProtectedRoute allowedRoles={['teacher']}><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/teacher/messages" element={
          <ProtectedRoute allowedRoles={['teacher']}><MessagesPage /></ProtectedRoute>
        } />
        <Route path="/teacher/notifications" element={
          <ProtectedRoute allowedRoles={['teacher']}><NotificationsPage /></ProtectedRoute>
        } />
        <Route path="/teacher/students/:studentId/assessments" element={
          <ProtectedRoute allowedRoles={['teacher']}><TeacherStudentAssessmentsPage /></ProtectedRoute>
        } />
        <Route path="/teacher/reports" element={
          <ProtectedRoute allowedRoles={['teacher']}><TeacherReportsPage /></ProtectedRoute>
        } />
        <Route path="/teacher/chatbot" element={
          <ProtectedRoute allowedRoles={['teacher']}><ChatbotPage /></ProtectedRoute>
        } />

        {/* ─── Student routes ─────────────────────────────────────────── */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/sessions" element={
          <ProtectedRoute allowedRoles={['student']}><StudentSessionsPage /></ProtectedRoute>
        } />
        <Route path="/student/sessions/:id" element={
          <ProtectedRoute allowedRoles={['student']}><StudentSessionDetailPage /></ProtectedRoute>
        } />
        <Route path="/student/quran" element={
          <ProtectedRoute allowedRoles={['student']}><QuranPage /></ProtectedRoute>
        } />
        <Route path="/student/quran/read" element={
          <ProtectedRoute allowedRoles={['student']}><QuranReaderPage /></ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/student/assessments" element={
          <ProtectedRoute allowedRoles={['student']}><AssessmentPage /></ProtectedRoute>
        } />
        <Route path="/student/assessments/new" element={
          <ProtectedRoute allowedRoles={['student']}><NewAssessmentPage /></ProtectedRoute>
        } />
        <Route path="/student/progress" element={
          <ProtectedRoute allowedRoles={['student']}><MyProgressPage /></ProtectedRoute>
        } />
        <Route path="/student/messages" element={
          <ProtectedRoute allowedRoles={['student']}><MessagesPage /></ProtectedRoute>
        } />
        <Route path="/student/notifications" element={
          <ProtectedRoute allowedRoles={['student']}><NotificationsPage /></ProtectedRoute>
        } />
        <Route path="/student/reports" element={
          <ProtectedRoute allowedRoles={['student']}><StudentReportsPage /></ProtectedRoute>
        } />
        <Route path="/student/chatbot" element={
          <ProtectedRoute allowedRoles={['student']}><ChatbotPage /></ProtectedRoute>
        } />

        {/* ─── 404 fallback ───────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;