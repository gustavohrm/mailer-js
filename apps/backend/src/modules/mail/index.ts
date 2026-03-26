import nodemailer from "nodemailer";

import type { SmtpConfig } from "../config/index.js";
import { mailSendFailed } from "../errors/index.js";

export type SendMailInput = {
  from?: string;
  html?: string;
  subject: string;
  text: string;
  to: string;
};

export type MailModule = {
  sendEmail(input: SendMailInput): Promise<string>;
  verifyConnection(): Promise<void>;
};

export function createMailModule(config: SmtpConfig): MailModule {
  const transporter = nodemailer.createTransport({
    auth: config.auth,
    host: config.host,
    port: config.port,
    secure: config.secure,
  });

  return {
    async verifyConnection(): Promise<void> {
      await transporter.verify();
    },
    async sendEmail(input: SendMailInput): Promise<string> {
      try {
        const info = await transporter.sendMail({
          from: input.from ?? config.from,
          html: input.html,
          subject: input.subject,
          text: input.text,
          to: input.to,
        });

        return info.messageId;
      } catch (error) {
        throw mailSendFailed(error);
      }
    },
  };
}
