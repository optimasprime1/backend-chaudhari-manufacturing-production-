const app = require("./app");
const env = require("./config/env");
const { connectDB, disconnectDB } = require("./db");

let server;

async function startServer() {
  await connectDB();
  server = app.listen(env.port, () => {
    console.log(`Backend API running at http://localhost:${env.port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully.`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error(`Backend startup failed because MongoDB is unavailable: ${error.message}`);
  process.exitCode = 1;
});
