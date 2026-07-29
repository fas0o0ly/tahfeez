// src/controllers/sessionController.js
const sessionService = require('../services/sessionService');
const { success, created } = require('../utils/response');

const createSession = async (req, res) => {
  const session = await sessionService.createSession(req.user.id, req.body);
  return created(res, { session }, 'Session created successfully');
};

const listSessions = async (req, res) => {
  const { type, status, gender, language, page, limit } = req.query;

  // Students get smart-matched sessions based on their profile
  if (req.user.role === 'student') {
    const result = await sessionService.listSessionsForStudent(req.user.id, {
      type, status, gender, language,
      page:  parseInt(page,  10) || 1,
      limit: parseInt(limit, 10) || 20,
    });
    return success(res, result, 'Sessions retrieved successfully');
  }

  const result = await sessionService.listSessions({
    role: req.user.role,
    userId: req.user.id,
    type, status, gender, language,
    page:  parseInt(page,  10) || 1,
    limit: parseInt(limit, 10) || 20,
  });

  return success(res, result, 'Sessions retrieved successfully');
};

const getMyTeacherSessions = async (req, res) => {
  const sessions = await sessionService.getTeacherSessions(req.user.id);
  return success(res, { sessions }, 'Your sessions retrieved successfully');
};

const getSessionById = async (req, res) => {
  const session = await sessionService.getSessionById(req.params.id, req.user);
  return success(res, { session }, 'Session retrieved successfully');
};

const updateSession = async (req, res) => {
  const session = await sessionService.updateSession(req.params.id, req.body);
  return success(res, { session }, 'Session updated successfully');
};

const updateSessionStatus = async (req, res) => {
  const session = await sessionService.updateSessionStatus(
    req.params.id,
    req.body.status,
    req.user
  );
  return success(res, { session }, `Session ${req.body.status} successfully`);
};

const assignTeacher = async (req, res) => {
  const session = await sessionService.assignTeacher(
    req.params.id,
    req.body.teacher_id,
    req.user.id
  );
  return success(res, { session }, 'Teacher assigned successfully');
};

const requestToTeach = async (req, res) => {
  await sessionService.requestToTeach(req.params.id, req.user.id);
  return success(res, null, 'Request submitted — awaiting admin approval');
};

const approveTeacherRequest = async (req, res) => {
  const session = await sessionService.approveTeacherRequest(req.params.id, req.user.id);
  return success(res, { session }, 'Teacher request approved successfully');
};

const getSessionStudents = async (req, res) => {
  const students = await sessionService.getSessionStudents(req.params.id, req.user.id);
  return success(res, { students }, 'Students retrieved successfully');
};

const getSessionTeacherProfile = async (req, res) => {
  const teacher = await sessionService.getSessionTeacherProfile(req.params.id, req.user);
  return success(res, { teacher }, 'Teacher profile retrieved successfully');
};

module.exports = {
  createSession,
  listSessions,
  getMyTeacherSessions,
  getSessionById,
  updateSession,
  updateSessionStatus,
  assignTeacher,
  requestToTeach,
  approveTeacherRequest,
  getSessionStudents,
  getSessionTeacherProfile,
};