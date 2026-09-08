import nodemailer from 'nodemailer';

// SMTP_HOST lets local dev point at Mailpit instead of real Gmail SMTP.
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true';
const email = process.env.SMTP_USER || process.env.EMAIL; // e.g., your-email@gmail.com
const appPassword = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD; // Use Gmail App Password

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  ...(email && appPassword ? { auth: { user: email, pass: appPassword } } : {}),
  ...(host === 'smtp.gmail.com' ? { tls: { ciphers: 'SSLv3' } } : {}), // Ensure compatibility with Gmail
});


