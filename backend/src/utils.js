const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { config } = require("./config");

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      managerId: user.managerId || null,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function createPasswordSetupToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      purpose: "password_setup",
    },
    config.jwtSecret,
    { expiresIn: config.passwordSetupExpiresIn }
  );
}

function verifyPasswordSetupToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  if (payload.purpose !== "password_setup") {
    throw new Error("Invalid password setup token.");
  }
  return payload;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    managerId: user.managerId || null,
    passwordSetupRequired: Boolean(user.passwordSetupRequired),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function scoreTaskAgainstQuery(task, query) {
  const haystack = [
    task.title,
    task.description,
    task.assignee?.name,
    ...(task.subtasks || []).map((subtask) => subtask.title),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.reduce((score, term) => {
    if (!haystack.includes(term)) return score;
    if (task.title.toLowerCase().includes(term)) return score + 5;
    if (task.description.toLowerCase().includes(term)) return score + 3;
    return score + 1;
  }, 0);
}

module.exports = {
  createToken,
  createPasswordSetupToken,
  verifyPasswordSetupToken,
  hashPassword,
  comparePassword,
  sanitizeUser,
  scoreTaskAgainstQuery,
};
