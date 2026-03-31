const nodemailer = require("nodemailer");
const { config } = require("./config");
const logger = require("./logger");

let transporterPromise;

async function getTransporter() {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      })
    );
  }

  return transporterPromise;
}

async function sendUserOnboardingEmail({ email, name, setupLink }) {
  const subject = "Your TaskFlow AI account has been created";
  const text = [
    `Hello ${name},`,
    "",
    "Your TaskFlow AI account has been created by an administrator.",
    "Use the secure link below to create your password and activate your account:",
    setupLink,
    "",
    "Your new password must include at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
  ].join("\n");

  const transporter = await getTransporter();
  if (!transporter) {
    logger.warn("SMTP is not configured; onboarding email could not be sent to %s", email);
    return { delivery: "disabled" };
  }

  await transporter.sendMail({
    from: config.smtpFrom,
    to: email,
    subject,
    text,
  });

  return { delivery: "smtp" };
}

async function sendPasswordResetEmail({ email, name, resetLink }) {
  const subject = "Reset your TaskFlow AI password";
  const text = [
    `Hello ${name},`,
    "",
    "A password reset was requested for your TaskFlow AI account.",
    "Use the secure link below to choose a new password:",
    resetLink,
    "",
    "If you did not request this change, you can safely ignore this email.",
  ].join("\n");

  const transporter = await getTransporter();
  if (!transporter) {
    logger.warn("SMTP is not configured; password reset email could not be sent to %s", email);
    return { delivery: "disabled" };
  }

  await transporter.sendMail({
    from: config.smtpFrom,
    to: email,
    subject,
    text,
  });

  return { delivery: "smtp" };
}

module.exports = { sendUserOnboardingEmail, sendPasswordResetEmail };
