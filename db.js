const mongoose = require("mongoose");
const env = require("./config/env");

function getDatabaseState() {
  switch (mongoose.connection.readyState) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

function getDatabaseStatus() {
  return {
    state: getDatabaseState(),
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
}

async function connectDB() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus,
};
