const crypto = require("crypto");
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

function createOpaqueToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;

  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  while (required.length < 12) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }

  for (let index = required.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [required[index], required[swapIndex]] = [required[swapIndex], required[index]];
  }

  return required.join("");
}

function hashOpaqueToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function durationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(String(duration).trim());
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit];

  return value * multiplier;
}

function buildCredentialLink(mode, token) {
  const url = new URL(config.appUrl);
  url.searchParams.set("mode", mode);
  url.searchParams.set("token", token);
  return url.toString();
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
  createOpaqueToken,
  createTemporaryPassword,
  hashOpaqueToken,
  durationToMs,
  buildCredentialLink,
  hashPassword,
  comparePassword,
  sanitizeUser,
  scoreTaskAgainstQuery,
};
