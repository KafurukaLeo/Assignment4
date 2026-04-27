import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

// A transporter is the connection to your email service
// It holds the SMTP credentials and reuses the connection for all emails
const transporter = nodemailer.createTransport({
 service: "gmail",
 auth: {
   user: process.env.EMAIL_USER,
   pass: process.env.EMAIL_PASS,
 },
});

// sendEmail is a reusable function that wraps nodemailer's sendMail
// to: recipient email address
// subject: email subject line
// text: the email body as plain text
export async function sendEmail({to, subject, text}: EmailOptions) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
}

export default transporter;
