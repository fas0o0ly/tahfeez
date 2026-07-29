// src/controllers/enrollmentController.js
const enrollmentService = require('../services/enrollmentService');
const { success, created } = require('../utils/response');

const requestEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.requestEnrollment(
    req.params.id,
    req.user.id
  );
  return created(res, { enrollment }, 'Enrollment request submitted — awaiting teacher approval');
};

const getSessionEnrollments = async (req, res) => {
  const enrollments = await enrollmentService.getSessionEnrollments(
    req.params.id,
    req.user
  );
  return success(res, { enrollments }, 'Enrollments retrieved successfully');
};

const updateEnrollmentStatus = async (req, res) => {
  const enrollment = await enrollmentService.updateEnrollmentStatus(
    req.params.id,
    req.params.enrollmentId,
    req.body.status,
    req.user.id
  );
  return success(
    res,
    { enrollment },
    `Student ${req.body.status} successfully`
  );
};

const withdrawEnrollment = async (req, res) => {
  await enrollmentService.withdrawEnrollment(req.params.id, req.user.id);
  return success(res, null, 'You have withdrawn from this session');
};

module.exports = {
  requestEnrollment,
  getSessionEnrollments,
  updateEnrollmentStatus,
  withdrawEnrollment,
};