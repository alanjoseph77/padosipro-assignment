import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

vi.mock("../src/lib/mailer", () => ({ sendOtpEmail: vi.fn() }));

import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { sendOtpEmail } from "../src/lib/mailer";

const email = "login@test.com";
const password = "Test1234";

// The mailer is mocked, so we read the code it "sent"
const lastSentCode = () => vi.mocked(sendOtpEmail).mock.calls.at(-1)![1];

beforeEach(async () => {
  await prisma.user.deleteMany();
  vi.mocked(sendOtpEmail).mockClear();
});

describe("register", () => {
  it("creates an account, hashes the password, and emails a code", async () => {
    const res = await request(app).post("/auth/register").send({ email, password });
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).not.toBe(password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format
    expect(sendOtpEmail).toHaveBeenCalledWith(email, expect.stringMatching(/^\d{6}$/));
  });

  it("rejects a weak password with a field message", async () => {
    const res = await request(app).post("/auth/register").send({ email, password: "abc" });
    expect(res.status).toBe(422);
    expect(res.body.error.fields.password).toBeDefined();
  });
});

describe("login rules", () => {
  it("sends unverified users back to verification", async () => {
    await request(app).post("/auth/register").send({ email, password });
    const res = await request(app).post("/auth/login").send({ email, password });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("gives the same error for a wrong password and an unknown email", async () => {
    await request(app).post("/auth/register").send({ email, password });

    const wrongPw = await request(app).post("/auth/login").send({ email, password: "Wrong1234" });
    const noUser = await request(app).post("/auth/login").send({ email: "nobody@test.com", password });

    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.error).toEqual(noUser.body.error);
  });

  it("returns a token once verified", async () => {
    await request(app).post("/auth/register").send({ email, password });
    await request(app).post("/auth/verify-otp").send({ email, code: lastSentCode() }).expect(200);

    const res = await request(app).post("/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.profileCompleted).toBe(false);
  });

  it("rejects protected routes without a token", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
  });
});
