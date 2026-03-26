import Fastify, { type FastifyInstance } from "fastify";

import { internalError, isAppError } from "./modules/errors/index.js";
import type { MailModule } from "./modules/mail/index.js";
import { registerRoutes } from "./routes/index.js";

export type BuildAppOptions = {
  authBearerToken: string;
  mail: MailModule;
};

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  app.setErrorHandler((error, request, reply) => {
    const appError = isAppError(error) ? error : internalError(error);
    const message = appError.expose ? appError.message : "Internal server error";

    if (appError.statusCode >= 500) {
      request.log.error({ err: error }, "Request failed");
    }

    return reply.status(appError.statusCode).send({
      error: {
        code: appError.code,
        message,
      },
    });
  });

  app.register(registerRoutes(options), {
    prefix: "/api/v1",
  });

  return app;
}
