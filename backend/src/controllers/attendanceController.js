const attendanceService = require('../services/attendanceService');
const { success } = require('../utils/response');

const getSessionAttendance = async (req, res) => {
  const { sessionId } = req.params;
  const date = req.query.date || null;
  const result = await attendanceService.getSessionAttendance(sessionId, req.user, date);
  return success(res, result, 'Attendance retrieved');
};

const getSessionOccurrenceDates = async (req, res) => {
  const { sessionId } = req.params;
  const dates = await attendanceService.getSessionOccurrenceDates(sessionId, req.user);
  return success(res, { dates }, 'Occurrence dates retrieved');
};

const upsertStudentAttendance = async (req, res) => {
  const { sessionId, studentId } = req.params;
  const record = await attendanceService.upsertStudentAttendance(
    sessionId, studentId, req.user.id, req.body
  );
  return success(res, { record }, 'Attendance saved');
};

const getMyAttendance = async (req, res) => {
  const page  = parseInt(req.query.page,  10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await attendanceService.getMyAttendance(req.user.id, { page, limit });
  return success(res, result, 'Attendance history retrieved');
};

const getStudentAttendance = async (req, res) => {
  const { studentId } = req.params;
  const page  = parseInt(req.query.page,  10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await attendanceService.getStudentAttendance(studentId, req.user, { page, limit });
  return success(res, result, 'Student attendance retrieved');
};

module.exports = {
  getSessionAttendance,
  getSessionOccurrenceDates,
  upsertStudentAttendance,
  getMyAttendance,
  getStudentAttendance,
};
