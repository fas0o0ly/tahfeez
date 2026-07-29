const svc = require('../services/messagingService');
const { success } = require('../utils/response');

const getInbox = async (req, res) => {
  const page  = parseInt(req.query.page  || '1',  10);
  const limit = parseInt(req.query.limit || '20', 10);
  const conversations = await svc.getInbox(req.user.id, { page, limit });
  return success(res, { conversations }, 'Inbox retrieved');
};

const getConversation = async (req, res) => {
  const messages = await svc.getConversation(req.user.id, req.params.userId);
  return success(res, { messages }, 'Conversation retrieved');
};

const sendMessage = async (req, res) => {
  const message = await svc.sendMessage(req.user.id, req.user.role, req.body);
  return success(res, { message }, 'Message sent', 201);
};

const deleteMessage = async (req, res) => {
  await svc.softDeleteMessage(req.params.messageId, req.user.id);
  return success(res, null, 'Message deleted');
};

const getContacts = async (req, res) => {
  const contacts = await svc.getContactableUsers(req.user.id, req.user.role);
  return success(res, { contacts }, 'Contacts retrieved');
};

module.exports = { getInbox, getConversation, sendMessage, deleteMessage, getContacts };
