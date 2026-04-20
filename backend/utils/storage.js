const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const messagesFile = path.join(dataDir, 'messages.json');
const aiUsersFile = path.join(dataDir, 'ai-users.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
  if (!fs.existsSync(messagesFile)) fs.writeFileSync(messagesFile, '[]');
  if (!fs.existsSync(aiUsersFile)) fs.writeFileSync(aiUsersFile, '[]');
}

function readJson(file) {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadUsers() {
  return readJson(usersFile);
}

function saveUsers(users) {
  writeJson(usersFile, users);
}

function loadMessages() {
  return readJson(messagesFile);
}

function saveMessages(messages) {
  writeJson(messagesFile, messages);
}

function loadAiUsers() {
  return readJson(aiUsersFile);
}

function saveAiUsers(users) {
  writeJson(aiUsersFile, users);
}

module.exports = {
  loadUsers,
  saveUsers,
  loadMessages,
  saveMessages,
  loadAiUsers,
  saveAiUsers
};