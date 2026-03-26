import { buildApp } from "./app.js";
import { loadConfig } from "./modules/config/index.js";
import { createMailModule } from "./modules/mail/index.js";

async function startServer(): Promise<void> {
  const config = loadConfig();
  const mail = createMailModule(config.smtp);

  await mail.verifyConnection();

  const app = buildApp({
    authBearerToken: config.auth.bearerToken,
    mail,
  });

  await app.listen({
    host: "0.0.0.0",
    port: config.port,
  });
}

void startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected startup error";

  console.error(`Failed to start server: ${message}`);
  process.exit(1);
});
