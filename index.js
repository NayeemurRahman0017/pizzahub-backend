import app from "./src/app.js";
import { env } from "./src/config/env.js";
import { closeDB, connectDB } from "./src/config/db.js";

await connectDB();
const server = app.listen(env.port, () =>
  console.log(`PizzaHub API running on http://localhost:${env.port}`)
);

const shutdown = async () => {
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);