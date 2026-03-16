import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach } from "vitest";
import User from "../src/models/User.ts";

let mongoServer: MongoMemoryServer;

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";
process.env.JWT_EXPIRES_IN = "1d";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }

  const password_hash = await bcrypt.hash("test12345", 10);
  await User.create({
    name: "Test Admin",
    email: "admin@example.com",
    password_hash,
    role: "admin",
    is_active: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});
