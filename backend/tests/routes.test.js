const request = require("supertest");
const { app } = require("../src/app");
const { prisma } = require("../src/db");
const { createToken, hashPassword } = require("../src/utils");

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

  test("POST /api/auth/register returns a safe duplicate-email message", async () => {
    const email = `duplicate-${Date.now()}@taskflow.ai`;

    await prisma.user.create({
      data: {
        name: "Existing User",
        email,
        passwordHash: await hashPassword("Admin@123"),
        role: "ADMIN",
        passwordSetupRequired: false,
      },
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "Another User",
      email,
      password: "Admin@123",
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("An account with this email already exists.");
  });

  test("PATCH /api/auth/me without a token returns a proper auth message", async () => {
    const response = await request(app).patch("/api/auth/me").send({
      name: "Updated Name",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Missing authentication token.");
  });

  test("POST /api/users creates a temporary-password user that must reset on first login", async () => {
    const adminEmail = `admin-${Date.now()}@taskflow.ai`;
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        passwordHash: await hashPassword("Admin@123"),
        role: "ADMIN",
        passwordSetupRequired: false,
      },
    });

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${createToken(admin)}`)
      .send({
        name: "New Member",
        email: `member-${Date.now()}@taskflow.ai`,
        role: "MEMBER",
        managerId: null,
      });

    expect(response.status).toBe(201);
    expect(typeof response.body.temporaryPassword).toBe("string");
    expect(response.body.temporaryPassword.length).toBeGreaterThanOrEqual(8);

    const createdUser = await prisma.user.findUnique({
      where: { email: response.body.user.email },
      select: { id: true, passwordSetupRequired: true, passwordHash: true },
    });

    expect(createdUser).toBeTruthy();
    expect(createdUser.passwordSetupRequired).toBe(true);
    expect(createdUser.passwordHash).not.toBe(response.body.temporaryPassword);
  });
});
