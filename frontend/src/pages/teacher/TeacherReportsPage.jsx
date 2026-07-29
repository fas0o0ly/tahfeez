import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReportFilters from '../../components/reports/ReportFilters';
import OrgStatCard from '../../components/reports/OrgStatCard';
import AttendanceBarChart from '../../components/reports/AttendanceBarChart';
import ScoreLineChart from '../../components/reports/ScoreLineChart';
import DistributionPieChart from '../../components/reports/DistributionPieChart';
import CertificateCard from '../../components/reports/CertificateCard';
import MedalBadge from '../../components/reports/MedalBadge';
import IssueCertificateModal from '../../components/reports/IssueCertificateModal';
import AwardMedalModal from '../../components/reports/AwardMedalModal';
import Avatar from '../../components/common/Avatar';
import { reportingApi } from '../../api/reportingApi';
import { certificateApi } from '../../api/certificateApi';
import { messageApi } from '../../api/messageApi';
import toast from 'react-hot-toast';

const SectionTitle = ({ title, sub }) => (
  <div className="mb-4">
    <h3 className="font-display text-lg font-semibold text-forest-900">{title}</h3>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const Divider = () => <hr className="my-8 border-gray-100" />;

const PrintButton = () => (
  <button
    onClick={() => window.print()}
    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl
               bg-forest-600 text-white text-xs font-medium
               hover:bg-forest-700 transition-colors print:hidden"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
    Print Report
  </button>
);

const TeacherReportsPage = () => {
  const { user } = useAuth();
  const [period, setPeriod]               = useState('all');
  const [teacherReport, setTeacherReport] = useState(null);
  const [students, setStudents]           = useState([]);
  const [selectedId, setSelectedId]       = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [certificates, setCertificates]   = useState([]);
  const [achievements, setAchievements]   = useState([]);
  const [loadingTeacher, setLoadingTeacher] = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [issueCertOpen, setIssueCertOpen]   = useState(false);
  const [awardMedalOpen, setAwardMedalOpen] = useState(false);

  // Load teacher's own stats + student list
  useEffect(() => {
    if (!user?.id) return;
    setLoadingTeacher(true);
    Promise.all([
      reportingApi.getTeacherReport(user.id, period),
      messageApi.getContacts(),
    ])
      .then(([teachRes, contRes]) => {
        setTeacherReport(teachRes.data.data.report);
        const all = contRes.data.data.contacts || [];
        setStudents(all.filter((c) => c.role === 'student'));
      })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoadingTeacher(false));
  }, [user?.id, period]);

  // Load selected student's data
  const loadStudent = useCallback(async (studentId) => {
    if (!studentId) {
      setStudentReport(null); setCertificates([]); setAchievements([]);
      return;
    }
    setLoadingStudent(true);
    try {
      const [repRes, certRes, achRes] = await Promise.all([
        reportingApi.getStudentReport(studentId, period),
        certificateApi.getCertificates(studentId),
        certificateApi.getAchievements(studentId),
      ]);
      setStudentReport(repRes.data.data.report);
      setCertificates(certRes.data.data.certificates || []);
      setAchievements(achRes.data.data.achievements || []);
    } catch {
      toast.error('Failed to load student data');
    } finally {
      setLoadingStudent(false);
    }
  }, [period]);

  useEffect(() => { loadStudent(selectedId); }, [selectedId, loadStudent]);

  const handleStudentChange = (e) => setSelectedId(e.target.value);

  const tr     = teacherReport || {};
  const tStats = tr.stats || {};
  const sr     = studentReport || {};
  const sStats = sr.stats || {};
  const selectedStudent = students.find((s) => s.id === selectedId);

  return (
    <DashboardLayout title="Reports">
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Report</h1>
        {selectedStudent && (
          <p className="text-base text-gray-700 mt-1">
            Student: {selectedStudent.full_name}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Generated {new Date().toLocaleDateString('en-MY', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Page title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 print:hidden">
        <h2 className="font-display text-2xl font-semibold text-forest-900">Reports</h2>
        <p className="text-gray-500 text-sm mt-0.5">Your teaching stats and student progress</p>
      </motion.div>

      {/* Filters */}
      <ReportFilters period={period} onPeriodChange={setPeriod}>
        <PrintButton />
      </ReportFilters>

      {/* ─── Section 1: Teacher own stats ─────────────────────────────────── */}
      <SectionTitle title="My Teaching Stats" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OrgStatCard index={0} icon="📅" label="Active Sessions"    value={tStats.sessions_count}     accent="forest" />
        <OrgStatCard index={1} icon="👥" label="Total Students"     value={tStats.total_students}      accent="blue"   />
        <OrgStatCard index={2} icon="⏱"  label="Hours Taught"       value={tStats.total_hours_taught != null ? `${tStats.total_hours_taught}h` : null} accent="gold" />
      </div>

      <DistributionPieChart
        data={tr.student_progress_distribution || []}
        title="Student Progress Distribution (by Juz Range)"
      />

      <Divider />

      {/* ─── Section 2: Student report ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <SectionTitle title="Student Report" sub="Select a student to view their full report" />
        <div className="print:hidden">
          <select
            value={selectedId}
            onChange={handleStudentChange}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 min-w-[200px]
                       focus:outline-none focus:ring-2 focus:ring-forest-200 bg-white"
          >
            <option value="">— Select student —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedId && (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-16
                        flex flex-col items-center justify-center text-center print:hidden">
          <span className="text-4xl mb-3">👤</span>
          <p className="text-sm font-medium text-gray-400">Select a student above to view their report</p>
        </div>
      )}

      {selectedId && loadingStudent && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" />
        </div>
      )}

      {selectedId && !loadingStudent && studentReport && (
        <>
          {/* Student profile strip */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4 flex items-center gap-4">
            <Avatar src={sr.profile?.avatar_url} name={sr.profile?.full_name} size="lg" />
            <div>
              <p className="font-display font-semibold text-forest-900 text-lg leading-tight">
                {sr.profile?.full_name}
              </p>
              <p className="text-sm text-gray-500 capitalize mt-0.5">
                {sr.profile?.current_level || 'No level'}{sr.profile?.age ? ` · Age ${sr.profile.age}` : ''}
                {sr.profile?.nationality ? ` · ${sr.profile.nationality}` : ''}
              </p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-4 text-center">
              <div>
                <p className="text-xl font-display font-semibold text-forest-900">{sStats.cert_count ?? 0}</p>
                <p className="text-xs text-gray-400">Certificates</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div>
                <p className="text-xl font-display font-semibold text-forest-900">{sStats.medal_count ?? 0}</p>
                <p className="text-xs text-gray-400">Medals</p>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <OrgStatCard index={0} icon="✅" label="Attendance Rate"   value={sStats.attend_pct != null ? `${sStats.attend_pct}%` : null}    accent="forest" />
            <OrgStatCard index={1} icon="❌" label="Absent Days"       value={sStats.absent_days}       accent="red"    />
            <OrgStatCard index={2} icon="⏱"  label="Total Hours"       value={sStats.total_hours != null ? `${sStats.total_hours}h` : null}   accent="blue"   />
            <OrgStatCard index={3} icon="📖" label="Juz Memorized"     value={sStats.total_juz}         accent="gold"   />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <AttendanceBarChart data={sr.attendance_trend || []} title="Attendance (Last 12 Weeks)" />
            <ScoreLineChart     data={sr.assessment_trend || []} title="Assessment Score Trend"     />
          </div>

          <Divider />

          {/* ─── Certificates ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title="Certificates" />
            <button
              onClick={() => setIssueCertOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-forest-600 text-white text-xs font-medium
                         hover:bg-forest-700 transition-colors print:hidden"
            >
              + Issue Certificate
            </button>
          </div>

          {certificates.length === 0 ? (
            <p className="text-sm text-gray-400 mb-6">No certificates issued yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {certificates.map((c) => <CertificateCard key={c.id} cert={c} />)}
            </div>
          )}

          <Divider />

          {/* ─── Medals ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title="Medals & Achievements" />
            <button
              onClick={() => setAwardMedalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-gold-500 text-white text-xs font-medium
                         hover:bg-gold-600 transition-colors print:hidden"
            >
              + Award Medal
            </button>
          </div>

          {achievements.length === 0 ? (
            <p className="text-sm text-gray-400">No medals awarded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {achievements.map((a) => <MedalBadge key={a.id} achievement={a} />)}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <IssueCertificateModal
        isOpen={issueCertOpen}
        onClose={() => setIssueCertOpen(false)}
        studentId={selectedId}
        onIssued={(cert) => setCertificates((prev) => [cert, ...prev])}
      />
      <AwardMedalModal
        isOpen={awardMedalOpen}
        onClose={() => setAwardMedalOpen(false)}
        studentId={selectedId}
        onAwarded={(a) => setAchievements((prev) => [a, ...prev])}
      />
    </DashboardLayout>
  );
};

export default TeacherReportsPage;
