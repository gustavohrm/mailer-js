import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const envFilePath = fileURLToPath(new URL("../../../../../.env", import.meta.url));

export type SmtpConfig = {
  auth?: {
    pass: string;
    user: string;
  };
  from: string;
  host: string;
  port: number;
  secure: boolean;
};

export type AppConfig = {
  auth: {
    bearerToken: string;
  };
  port: number;
  smtp: SmtpConfig;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return parsed;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function readSmtpPort(value: string | undefined): number {
  if (!value) {
    throw new Error("Missing required environment variable: SMTP_PORT");
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("SMTP_PORT must be a positive integer");
  }

  return parsed;
}

function readSmtpAuth() {
  const user = readOptionalEnv("SMTP_USER");
  const pass = readOptionalEnv("SMTP_PASS");

  if (!user && !pass) {
    return undefined;
  }

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must both be provided when using SMTP authentication");
  }

  return { user, pass };
}

export function loadConfig(): AppConfig {
  dotenv.config({
    path: envFilePath,
  });

  return {
    auth: {
      bearerToken: readRequiredEnv("API_BEARER_TOKEN"),
    },
    port: readPort(process.env.PORT, 3000),
    smtp: {
      auth: readSmtpAuth(),
      from: readRequiredEnv("SMTP_FROM"),
      host: readRequiredEnv("SMTP_HOST"),
      port: readSmtpPort(process.env.SMTP_PORT),
      secure: readBoolean(process.env.SMTP_SECURE, false),
    },
  };
}
