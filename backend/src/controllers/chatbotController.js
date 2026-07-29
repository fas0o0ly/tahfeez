// src/controllers/chatbotController.js
const svc = require('../services/chatbotService');
const { success, notFound } = require('../utils/response');

const askChatbot = async (req, res) => {
  const { query } = req.body;
  const result = await svc.processQuery(req.user.id, query.trim());
  return success(res, result, 'Query processed');
};

const getHistory = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const history = await svc.getHistory(req.user.id, limit);
  return success(res, { history }, 'History retrieved');
};

const deleteConversation = async (req, res) => {
  const deleted = await svc.deleteConversation(req.params.id, req.user.id);
  if (!deleted) return notFound(res, 'Conversation not found');
  return success(res, null, 'Conversation deleted');
};

module.exports = { askChatbot, getHistory, deleteConversation };
