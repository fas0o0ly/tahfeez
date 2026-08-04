import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ReportFilters from '../../components/reports/ReportFilters';
import OrgStatCard from '../../components/reports/OrgStatCard';
import AttendanceBarChart from '../../components/reports/AttendanceBarChart';
import ScoreLineChart from '../../components/reports/ScoreLineChart';
import CertificateCard from '../../components/reports/CertificateCard';
import MedalBadge from '../../components/reports/MedalBadge';
import Avatar from '../../components/common/Avatar';
import { reportingApi } from '../../api/reportingApi';
import { certificateApi } from '../../api/certificateApi';
import toast from 'react-hot-toast';

const GRADE_COLORS = {
  excellent: 'text-emerald-600',
  very_good: 'text-forest-600',
  good:      'text-blue-600',
  acceptable:'text-amber-600',
  weak:      'text-red-500',
};

const SectionTitle = ({ title }) => (
  <h3 className="font-display text-lg font-semibold text-forest-900 mb-4">{title}</h3>
);

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

const JuzProgressBar = ({ total, status, grade }) => {
  const { t } = useTranslation();
  const pct = Math.min(Math.round((total / 30) * 100), 100);
  const milestones = [
    { juz: 10, labelKey: 'reports.student.milestone.juzAmma' },
    { juz: 15, labelKey: 'reports.student.milestone.halfQuran' },
    { juz: 30, labelKey: 'reports.student.milestone.fullQuran' },
  ];

  const gradeLabel = {
    excellent: t('reports.student.grade.excellent'),
    very_good: t('reports.student.grade.very_good'),
    good:      t('reports.student.grade.good'),
    acceptable:t('reports.student.grade.acceptable'),
    weak:      t('reports.student.grade.weak'),
  };

  return (
    <div className="bg-gradient-to-br from-forest-900 to-forest-800 rounded-2xl p-6
                    text-white print:break-inside-avoid mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-forest-300 text-xs font-medium uppercase tracking-wider">{t('reports.student.memorization')}</p>
          <p className="text-4xl font-display font-bold mt-1">
            {total}<span className="text-2xl text-forest-300 font-normal"> / 30 Juz</span>
          </p>
          {grade && (
            <p className={`text-sm font-medium mt-1 ${GRADE_COLORS[grade] || 'text-white'}`}>
              {gradeLabel[grade] || grade}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-5xl">📖</span>
          {status === 'completed' || status === 'certified' ? (
            <p className="text-xs text-gold-400 font-semibold mt-1">{t('reports.student.completedLabel')}</p>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-400 to-gold-500 rounded-full"
        />
      </div>

      {/* Milestones */}
      <div className="flex justify-between mt-1">
        {milestones.map((m) => (
          <div
            key={m.juz}
            className={`text-center text-[10px] ${total >= m.juz ? 'text-gold-400 font-semibold' : 'text-forest-400'}`}
          >
            <span>{t(m.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentAttendanceTable = ({ rows }) => {
  const { t } = useTranslation();
  if (!rows?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden mb-6 print:break-inside-avoid">
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-sm font-semibold text-forest-900">{t('reports.student.recentAttendance')}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.slice(0, 10).map((r, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">{r.session_title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(r.occurrence_date).toLocaleDateString('en-MY', {
                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full
                          ${r.present
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-500'}`}
            >
              {r.present ? t('reports.student.present') : t('reports.student.absent')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StudentReportsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod]             = useState('all');
  const [report, setReport]             = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      reportingApi.getStudentReport(user.id, period),
      certificateApi.getCertificates(user.id),
      certificateApi.getAchievements(user.id),
    ])
      .then(([repRes, certRes, achRes]) => {
        setReport(repRes.data.data.report);
        setCertificates(certRes.data.data.certificates || []);
        setAchievements(achRes.data.data.achievements || []);
      })
      .catch(() => toast.error(t('reports.failedLoad')))
      .finally(() => setLoading(false));
  }, [user?.id, period]);

  const r     = report || {};
  const stats = r.stats || {};

  return (
    <DashboardLayout title={t('reports.student.pageTitle')}>
      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('reports.student.printTitle')}</h1>
        <p className="text-base text-gray-700 mt-1">{r.profile?.full_name}</p>
        <p className="text-sm text-gray-500 mt-1">
          {t('reports.student.printGenerated', { date: new Date().toLocaleDateString('en-MY', { dateStyle: 'long' }) })}
        </p>
      </div>

      {/* Page title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 print:hidden">
        <h2 className="font-display text-2xl font-semibold text-forest-900">{t('reports.student.title')}</h2>
        <p className="text-gray-500 text-sm mt-0.5">{t('reports.student.subtitle')}</p>
      </motion.div>

      {/* Filters */}
      <ReportFilters period={period} onPeriodChange={setPeriod}>
        <PrintButton />
      </ReportFilters>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-forest-300 border-t-forest-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile strip */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-6
                          flex items-center gap-4 print:break-inside-avoid">
            <Avatar src={r.profile?.avatar_url} name={r.profile?.full_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-forest-900 text-lg leading-tight truncate">
                {r.profile?.full_name}
              </p>
              <p className="text-sm text-gray-500 capitalize mt-0.5">
                {r.profile?.current_level || t('reports.student.noLevel')}
                {r.profile?.age ? ` · Age ${r.profile.age}` : ''}
                {r.profile?.nationality ? ` · ${r.profile.nationality}` : ''}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-display font-semibold text-forest-900">{stats.cert_count ?? 0}</p>
                <p className="text-xs text-gray-400">{t('reports.student.certCount')}</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <p className="text-xl font-display font-semibold text-forest-900">{stats.medal_count ?? 0}</p>
                <p className="text-xs text-gray-400">{t('reports.student.medalCount')}</p>
              </div>
            </div>
          </div>

          {/* Juz progress hero */}
          <JuzProgressBar
            total={stats.total_juz || 0}
            status={stats.progress_status}
            grade={stats.accuracy_grade}
          />

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <OrgStatCard index={0} icon="✅" label={t('reports.student.attendRate')}       value={stats.attend_pct != null ? `${stats.attend_pct}%` : null}  accent="forest" />
            <OrgStatCard index={1} icon="📅" label={t('reports.student.sessionsAttended')} value={stats.attended}                                             accent="blue"   />
            <OrgStatCard index={2} icon="⏱"  label={t('reports.student.totalHours')}       value={stats.total_hours != null ? `${stats.total_hours}h` : null} accent="gold"   />
            <OrgStatCard index={3} icon="❌" label={t('reports.student.absentDays')}       value={stats.absent_days}                                          accent="red"    />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <AttendanceBarChart data={r.attendance_trend || []} title={t('reports.student.attendChart')} />
            <ScoreLineChart     data={r.assessment_trend || []} title={t('reports.student.scoreChart')}  />
          </div>

          {/* Recent attendance */}
          <RecentAttendanceTable rows={r.recent_attendance} />

          {/* Certificates */}
          {certificates.length > 0 && (
            <>
              <SectionTitle title={t('reports.student.myCerts')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {certificates.map((c) => <CertificateCard key={c.id} cert={c} />)}
              </div>
            </>
          )}

          {/* Medals */}
          {achievements.length > 0 && (
            <>
              <SectionTitle title={t('reports.student.myMedals')} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {achievements.map((a) => <MedalBadge key={a.id} achievement={a} />)}
              </div>
            </>
          )}

          {certificates.length === 0 && achievements.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-12
                            flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-3">🎖</span>
              <p className="text-sm font-medium text-gray-400">{t('reports.student.noAwards.title')}</p>
              <p className="text-xs text-gray-300 mt-1">{t('reports.student.noAwards.desc')}</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentReportsPage;
