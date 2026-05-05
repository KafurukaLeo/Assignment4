import nodemailer from "nodemailer";

// Interface defining the shape of email options passed to sendEmail
interface EmailOptions {
  to: string;      // Recipient email address
  subject: string; // Email subject line
  html: string;    // HTML content of the email body
}

/**
 * Nodemailer transporter — configured to send emails via Gmail SMTP.
 * Uses environment variables for credentials so they are never hardcoded.
 * EMAIL_HOST defaults to Gmail's SMTP server if not set.
 * Port 587 with secure: false uses STARTTLS (recommended for Gmail).
 */
const transporter = nodemailer.createTransport({
  host: process.env["EMAIL_HOST"] ?? "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS (upgrades to TLS after connection)
  auth: {
    user: process.env["EMAIL_USER"], // Gmail address from .env
    pass: process.env["EMAIL_PASS"], // Gmail app password from .env
  },
});

/**
 * sendEmail — sends an HTML email using the configured transporter.
 * Used throughout the app for:
 * - Welcome emails after registration
 * - Booking confirmation emails
 * - Booking cancellation emails
 * - Password reset emails
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env["EMAIL_FROM"] ?? process.env["EMAIL_USER"], // Sender display name + address
    to,
    subject,
    html,
  });
}

export default transporter;
