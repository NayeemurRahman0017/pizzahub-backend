import app from "./app.js";
import { env } from "./config/env.js";
import { closeDB, connectDB } from "./config/db.js";

await connectDB();

const server = app.listen(env.port, () => {
  console.log(`PizzaHub API running on port ${env.port}`);
});

let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log(`${signal} received, closing server...`);

  const forceExit = setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);

  forceExit.unref();

  server.close(async () => {
    try {
      await closeDB();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (error) {
      console.error("Database shutdown error:", error);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});