import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReportFilters from '../../components/reports/ReportFilters';
import OrgStatCard from '../../components/reports/OrgStatCard';
import AttendanceBarChart from '../../components/reports/AttendanceBarChart';
import DistributionPieChart from '../../components/reports/DistributionPieChart';
import { reportingApi } from '../../api/reportingApi';
import toast from 'react-hot-toast';

const PrintButton = () => {
  const { t } = useTranslation();
  return (
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
      {t('reports.printBtn')}
    </button>
  );
};

const AdminReportsPage = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('all');
  const [data, setData]     = useState(null);

  useEffect(() => {
    reportingApi.getOrgStats(period)
      .then((r) => setData(r.data.data))
      .catch(() => toast.error(t('reports.failedLoad')));
  }, [period]);

  const stats  = data?.stats || {};
  const trend  = data?.attendance_trend || [];
  const levels = data?.student_levels || [];

  const row1 = [
    { icon: '👥', label: t('reports.admin.stats.totalStudents'),    value: stats.total_students,          accent: 'forest' },
    { icon: '⏱',  label: t('reports.admin.stats.instructionHours'), value: stats.total_instruction_hours != null ? `${stats.total_instruction_hours}h` : null, accent: 'blue' },
    { icon: '🟢',  label: t('reports.admin.stats.weeklyActive'),     value: stats.weekly_active_students,  accent: 'forest' },
    { icon: '📊',  label: t('reports.admin.stats.attendanceRate'),   value: stats.overall_attendance_pct != null ? `${stats.overall_attendance_pct}%` : null, accent: 'gold' },
  ];

  const row2 = [
    { icon: '🌍',  label: t('reports.admin.stats.countries'),         value: stats.countries_represented,   accent: 'purple' },
    { icon: '📖',  label: t('reports.admin.stats.juzMemorized'),      value: stats.system_memorized_juz,    accent: 'amber'  },
    { icon: '🎓',  label: t('reports.admin.stats.certifiedStudents'), value: stats.certified_students,      accent: 'gold'   },
    { icon: '🏅',  label: t('reports.admin.stats.withMedals'),        value: stats.students_with_medals,    accent: 'red'    },
  ];

  const row3 = [
    { icon: '👨‍🏫', label: t('reports.admin.stats.activeTeachers'),  value: stats.total_teachers,           accent: 'forest' },
    { icon: '📅',  label: t('reports.admin.stats.activeSessions'),   value: stats.total_sessions,           accent: 'blue'   },
    { icon: '🕌',  label: t('reports.admin.stats.completedQuran'),   value: stats.students_completed_quran, accent: 'gold'   },
  ];

  return (
    <DashboardLayout title={t('reports.admin.title')}>
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.admin.printTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('reports.admin.printGenerated', { date: new Date().toLocaleDateString('en-MY', { dateStyle: 'long' }) })}
        </p>
      </div>

      {/* Page title */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="mb-6 print:hidden"
      >
        <h2 className="font-display text-2xl font-semibold text-forest-900">{t('reports.admin.title')}</h2>
        <p className="text-gray-500 text-sm mt-0.5">{t('reports.admin.subtitle')}</p>
      </motion.div>

      {/* Filters */}
      <ReportFilters period={period} onPeriodChange={setPeriod}>
        <PrintButton />
      </ReportFilters>

      {/* Row 1 — primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {row1.map((k, i) => <OrgStatCard key={k.label} index={i} {...k} />)}
      </div>

      {/* Row 2 — secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {row2.map((k, i) => <OrgStatCard key={k.label} index={i + 4} {...k} />)}
      </div>

      {/* Row 3 — supplementary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {row3.map((k, i) => <OrgStatCard key={k.label} index={i + 8} {...k} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionPieChart data={levels} title={t('reports.admin.chart.levelDist')} />
        <AttendanceBarChart   data={trend}  title={t('reports.admin.chart.attendance')} />
      </div>
    </DashboardLayout>
  );
};

export default AdminReportsPage;
