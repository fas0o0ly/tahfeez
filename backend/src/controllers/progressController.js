const attendanceService = require('../services/attendanceService');
const { success } = require('../utils/response');

const getMyProgress = async (req, res) => {
  const progress = await attendanceService.getOrCreateProgress(req.user.id);
  return success(res, { progress }, 'Progress retrieved');
};

const getStudentProgress = async (req, res) => {
  const progress = await attendanceService.getStudentProgress(req.params.studentId, req.user);
  return success(res, { progress }, 'Progress retrieved');
};

const updateStudentProgress = async (req, res) => {
  const progress = await attendanceService.upsertProgress(
    req.params.studentId, req.user.id, req.body
  );
  return success(res, { progress }, 'Progress updated');
};

const getStudentNotes = async (req, res) => {
  const notes = await attendanceService.getStudentNotes(req.params.studentId, req.user);
  return success(res, { notes }, 'Notes retrieved');
};

const addNote = async (req, res) => {
  const note = await attendanceService.addNote(
    req.user.id, req.params.studentId, req.body
  );
  return success(res, { note }, 'Note added', 201);
};

const deleteNote = async (req, res) => {
  await attendanceService.deleteNote(req.params.noteId, req.user.id);
  return success(res, null, 'Note deleted');
};

module.exports = {
  getMyProgress,
  getStudentProgress,
  updateStudentProgress,
  getStudentNotes,
  addNote,
  deleteNote,
};
