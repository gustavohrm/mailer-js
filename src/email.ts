import nodemailer from "nodemailer";

import { config } from "./config.ts";

export type SendEmailInput = {
  from?: string;
  html?: string;
  subject: string;
  text: string;
  to: string;
};

const transporter = nodemailer.createTransport({
  auth: config.smtp.auth,
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure
});

export async function verifySmtpConnection(): Promise<void> {
  await transporter.verify();
}

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const info = await transporter.sendMail({
    from: input.from ?? config.smtp.from,
    html: input.html,
    subject: input.subject,
    text: input.text,
    to: input.to
  });

  return info.messageId;
}
