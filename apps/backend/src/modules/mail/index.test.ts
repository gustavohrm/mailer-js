import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, transporter } = vi.hoisted(() => {
  const transporterMock = {
    sendMail: vi.fn(),
    verify: vi.fn(),
  };

  return {
    createTransport: vi.fn(() => transporterMock),
    transporter: transporterMock,
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport,
  },
}));

import { AppError } from "../errors/index.js";
import { createMailModule } from "./index.js";

describe("createMailModule", () => {
  beforeEach(() => {
    createTransport.mockClear();
    transporter.sendMail.mockReset();
    transporter.verify.mockReset();
  });

  it("creates a transporter from the SMTP config and sends mail with the default from address", async () => {
    transporter.sendMail.mockResolvedValue({
      messageId: "message-123",
    });

    const mail = createMailModule({
      auth: {
        pass: "smtp-pass",
        user: "smtp-user",
      },
      from: "no-reply@example.com",
      host: "smtp.example.com",
      port: 587,
      secure: false,
    });

    await expect(
      mail.sendEmail({
        subject: "Hello",
        text: "Body",
        to: "recipient@example.com",
      }),
    ).resolves.toBe("message-123");

    expect(createTransport).toHaveBeenCalledWith({
      auth: {
        pass: "smtp-pass",
        user: "smtp-user",
      },
      host: "smtp.example.com",
      port: 587,
      secure: false,
    });
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: "no-reply@example.com",
      html: undefined,
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com",
    });
  });

  it("prefers an explicit from address and passes html through to nodemailer", async () => {
    transporter.sendMail.mockResolvedValue({
      messageId: "message-456",
    });

    const mail = createMailModule({
      from: "default@example.com",
      host: "smtp.example.com",
      port: 465,
      secure: true,
    });

    await expect(
      mail.sendEmail({
        from: "sender@example.com",
        html: "<p>Hello</p>",
        subject: "Hello",
        text: "Body",
        to: "recipient@example.com",
      }),
    ).resolves.toBe("message-456");

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: "sender@example.com",
      html: "<p>Hello</p>",
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com",
    });
  });

  it("delegates connection verification to the transporter", async () => {
    transporter.verify.mockResolvedValue(undefined);

    const mail = createMailModule({
      from: "no-reply@example.com",
      host: "smtp.example.com",
      port: 587,
      secure: false,
    });

    await expect(mail.verifyConnection()).resolves.toBeUndefined();
    expect(transporter.verify).toHaveBeenCalledTimes(1);
  });

  it("wraps send failures in an AppError with a safe message", async () => {
    const cause = new Error("smtp auth failed");
    transporter.sendMail.mockRejectedValue(cause);

    const mail = createMailModule({
      from: "no-reply@example.com",
      host: "smtp.example.com",
      port: 587,
      secure: false,
    });

    const sendPromise = mail.sendEmail({
      subject: "Hello",
      text: "Body",
      to: "recipient@example.com",
    });

    await expect(sendPromise).rejects.toMatchObject({
      cause,
      code: "MAIL_SEND_FAILED",
      message: "Unable to send email right now.",
      statusCode: 503,
    });
    await expect(sendPromise).rejects.toBeInstanceOf(AppError);
  });
});
