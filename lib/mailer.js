const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[mailer] Chưa cấu hình SMTP — mã xác nhận gửi tới ${to}: ${html}`);
    return;
  }
  await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, html });
}

module.exports = { sendMail };
