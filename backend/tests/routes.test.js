const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/db");

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Health and auth routes", () => {
  test("GET /health returns status ok", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok", service: "taskflow-ai" });
  });

  test("POST /api/auth/login rejects invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "doesnotexist@taskflow.ai",
      password: "wrong",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password.");
  });

  test("POST /api/auth/forgot-password returns a generic success response", async () => {
    const response = await request(app).post("/api/auth/forgot-password").send({
      email: "doesnotexist@taskflow.ai",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("If an account exists for that email, password reset instructions have been sent.");
  });
});
