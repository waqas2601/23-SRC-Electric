import type { Request, Response } from "express";
import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";
import { bootstrapAdminUser } from "../src/config/bootstrapAdmin.js";

let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDB();
      await bootstrapAdminUser();
    })();
  }

  await initPromise;
}

export default async function handler(
  req: Request,
  res: Response,
): Promise<void> {
  await ensureInitialized();
  app(req, res);
}
