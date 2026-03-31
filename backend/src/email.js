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

async function sendUserOnboardingEmail({ email, name, temporaryPassword }) {
  const subject = "Your TaskFlow AI account has been created";
  const text = [
    `Hello ${name},`,
    "",
    "Your TaskFlow AI account has been created by an administrator.",
    `Temporary password: ${temporaryPassword}`,
    "",
    `Login at ${config.appUrl} and you will be prompted to set your own password.`,
    "",
    "Your new password must include at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
  ].join("\n");

  const transporter = await getTransporter();
  if (!transporter) {
    logger.info("Email fallback (no SMTP configured) to=%s subject=%s body=%s", email, subject, text);
    return { delivery: "log" };
  }

  await transporter.sendMail({
    from: config.smtpFrom,
    to: email,
    subject,
    text,
  });

  return { delivery: "smtp" };
}

module.exports = { sendUserOnboardingEmail };
