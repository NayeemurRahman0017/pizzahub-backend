import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { closeDB, connectDB } from "./src/config/db.js";

await connectDB();
const server = app.listen(env.port, () =>
  console.log(`PizzaHub API running on http://localhost:${env.port}`)
);

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
    await closeDB();
    clearTimeout(forceExit);
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Without these, an unhandled rejection would leave the process alive but broken.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});