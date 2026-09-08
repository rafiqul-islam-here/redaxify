import nodemailer from "nodemailer";

// SMTP_HOST lets local dev point at Mailpit instead of real Gmail SMTP.
const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 465;
const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true;
const email = process.env.SMTP_USER || process.env.EMAIL;
const password = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  ...(email && password ? { auth: { user: email, pass: password } } : {}),
});

export const mailOptions = {
  from: email,
};
