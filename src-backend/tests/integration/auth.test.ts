import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.ts";

describe("Auth API", () => {
  it("should login admin and return token", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "test12345",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user?.email).toBe("admin@example.com");
  });

  it("should reject invalid login", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should block protected route without token", async () => {
    const response = await request(app).get("/api/v1/products");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
