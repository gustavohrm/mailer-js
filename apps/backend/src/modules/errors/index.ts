export type AppErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "MAIL_SEND_FAILED"
  | "INTERNAL_ERROR";

type AppErrorOptions = {
  cause?: unknown;
  code: AppErrorCode;
  expose: boolean;
  message: string;
  statusCode: number;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause?: unknown;
  readonly expose: boolean;
  readonly statusCode: number;

  constructor(options: AppErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });

    this.name = "AppError";
    this.code = options.code;
    this.cause = options.cause;
    this.expose = options.expose;
    this.statusCode = options.statusCode;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function invalidRequest(message: string): AppError {
  return new AppError({
    code: "INVALID_REQUEST",
    expose: true,
    message,
    statusCode: 400
  });
}

export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    expose: true,
    message,
    statusCode: 401
  });
}

export function mailSendFailed(cause?: unknown): AppError {
  return new AppError({
    cause,
    code: "MAIL_SEND_FAILED",
    expose: true,
    message: "Unable to send email right now.",
    statusCode: 503
  });
}

export function internalError(cause?: unknown): AppError {
  return new AppError({
    cause,
    code: "INTERNAL_ERROR",
    expose: true,
    message: "Internal server error",
    statusCode: 500
  });
}
