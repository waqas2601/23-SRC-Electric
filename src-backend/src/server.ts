import dotenv from "dotenv";
import mongoose from "mongoose";
import type { Server } from "http";
import app from "./app.js";
import { bootstrapAdminUser } from "./config/bootstrapAdmin.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
let server: Server | null = null;
let isShuttingDown = false;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function gracefulShutdown(reason: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${reason} received. Starting graceful shutdown...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error?: Error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      console.log("HTTP server closed");
    }

    await mongoose.disconnect();
    console.log("MongoDB disconnected");
    process.exit(exitCode);
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Graceful shutdown failed:", message);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled promise rejection:", getErrorMessage(reason));
  void gracefulShutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught exception:", getErrorMessage(error));
  void gracefulShutdown("uncaughtException", 1);
});

(async () => {
  try {
    await connectDB();
    await bootstrapAdminUser();
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Failed to start server:", message);
    process.exit(1);
  }
})();
