import type { FastifyPluginAsync } from "fastify";

import type { BuildAppOptions } from "../app.js";
import { registerHealthRoutes } from "./health/index.js";
import { registerMailRoutes } from "./mail/index.js";

export function registerRoutes(options: BuildAppOptions): FastifyPluginAsync {
  return async (app) => {
    app.register(registerHealthRoutes);
    app.register(registerMailRoutes(options));
  };
}
