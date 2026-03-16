import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.ts";

describe("Health API", () => {
  it("should return status ok", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
