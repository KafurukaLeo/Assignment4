import nodemailer from "nodemailer";
interface EmailOptions {
    to: string;
    subject: string;
    text: string;
}
declare const transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport/index.js").SentMessageInfo, import("nodemailer/lib/smtp-transport/index.js").Options>;
export declare function sendEmail({ to, subject, text }: EmailOptions): Promise<void>;
export default transporter;
//# sourceMappingURL=email.d.ts.map