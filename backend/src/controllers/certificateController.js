const svc = require('../services/certificateService');
const { success } = require('../utils/response');

const getCertificates = async (req, res) => {
  const certs = await svc.getStudentCertificates(req.params.studentId, req.user);
  return success(res, { certificates: certs }, 'Certificates retrieved');
};

const issueCertificate = async (req, res) => {
  const cert = await svc.issueCertificate(req.user.id, req.user.role, req.params.studentId, req.body);
  return success(res, { certificate: cert }, 'Certificate issued', 201);
};

const revokeCertificate = async (req, res) => {
  await svc.revokeCertificate(req.params.id, req.user.id);
  return success(res, null, 'Certificate revoked');
};

const getAchievementTypes = async (req, res) => {
  const types = await svc.getAchievementTypes();
  return success(res, { types }, 'Achievement types retrieved');
};

const getAchievements = async (req, res) => {
  const achievements = await svc.getStudentAchievements(req.params.studentId, req.user);
  return success(res, { achievements }, 'Achievements retrieved');
};

const awardMedal = async (req, res) => {
  const achievement = await svc.awardMedal(req.user.id, req.user.role, req.params.studentId, req.body);
  return success(res, { achievement }, 'Medal awarded', 201);
};

const revokeMedal = async (req, res) => {
  await svc.revokeMedal(req.params.id, req.user.id);
  return success(res, null, 'Medal revoked');
};

module.exports = {
  getCertificates, issueCertificate, revokeCertificate,
  getAchievementTypes, getAchievements, awardMedal, revokeMedal,
};
