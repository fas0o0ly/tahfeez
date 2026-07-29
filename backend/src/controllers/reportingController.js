const svc = require('../services/reportingService');
const { success } = require('../utils/response');

const getOrgStats = async (req, res) => {
  const period = req.query.period || 'all';
  const [stats, trend, levels] = await Promise.all([
    svc.getOrgStats(period),
    svc.getOrgAttendanceTrend(),
    svc.getStudentLevelDistribution(),
  ]);
  return success(res, { stats, attendance_trend: trend, student_levels: levels }, 'Organization report retrieved');
};

const getStudentReport = async (req, res) => {
  const period = req.query.period || 'all';
  const report = await svc.getStudentReport(req.params.studentId, req.user, period);
  return success(res, { report }, 'Student report retrieved');
};

const getSessionReport = async (req, res) => {
  const period = req.query.period || 'all';
  const report = await svc.getSessionReport(req.params.sessionId, req.user, period);
  return success(res, { report }, 'Session report retrieved');
};

const getTeacherReport = async (req, res) => {
  const period = req.query.period || 'all';
  const report = await svc.getTeacherReport(req.params.teacherId, req.user, period);
  return success(res, { report }, 'Teacher report retrieved');
};

const getPublicStats = async (req, res) => {
  const stats = await svc.getPublicStats();
  return success(res, { stats }, 'Public stats retrieved');
};

module.exports = { getOrgStats, getStudentReport, getSessionReport, getTeacherReport, getPublicStats };
