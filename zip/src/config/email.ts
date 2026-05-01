import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env["EMAIL_HOST"] ?? "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
  },
});

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env["EMAIL_FROM"] ?? process.env["EMAIL_USER"],
    to,
    subject,
    html,
  });
}

export default transporter;
