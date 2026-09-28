import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  generateCode, hashCode, issueOtp, verifyOtp,
  OTP_TTL_MS, RESEND_COOLDOWN_MS, MAX_ATTEMPTS,
} from "../src/services/otp.service";

let userId: string;
const t0 = new Date("2026-10-01T10:00:00Z");
const later = (ms: number) => new Date(t0.getTime() + ms);

beforeEach(async () => {
  await prisma.user.deleteMany();
  const user = await prisma.user.create({ data: { email: "otp@test.com", passwordHash: "x" } });
  userId = user.id;
});

describe("code generation", () => {
  it("always produces exactly 6 digits", () => {
    for (let i = 0; i < 1000; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  it("stores only a hash, never the plain code", async () => {
    const code = await issueOtp(userId, t0);
    const otp = await prisma.emailOtp.findFirstOrThrow({ where: { userId } });
    expect(otp.codeHash).not.toContain(code);
    expect(otp.codeHash).toBe(hashCode(code));
  });
});

describe("verification", () => {
  it("verifies the user with the correct code", async () => {
    const code = await issueOtp(userId, t0);
    await verifyOtp(userId, code, later(1000));
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.isVerified).toBe(true);
  });

  it("rejects a wrong code and counts down attempts", async () => {
    await issueOtp(userId, t0);
    await expect(verifyOtp(userId, "000000", t0)).rejects.toMatchObject({
      code: "OTP_INVALID",
      message: expect.stringContaining("4 attempts left"),
    });
  });

  it("is single use", async () => {
    const code = await issueOtp(userId, t0);
    await verifyOtp(userId, code, t0);
    await expect(verifyOtp(userId, code, t0)).rejects.toMatchObject({ code: "OTP_EXPIRED" });
  });
});

describe("expiry", () => {
  it("accepts a code just before 10 minutes", async () => {
    const code = await issueOtp(userId, t0);
    await expect(verifyOtp(userId, code, later(OTP_TTL_MS - 1000))).resolves.toBeUndefined();
  });

  it("rejects a code after 10 minutes", async () => {
    const code = await issueOtp(userId, t0);
    await expect(verifyOtp(userId, code, later(OTP_TTL_MS + 1000))).rejects.toMatchObject({
      code: "OTP_EXPIRED",
    });
  });
});

describe("attempt limit", () => {
  it("locks after 5 wrong attempts, even if the 6th is correct", async () => {
    const code = await issueOtp(userId, t0);
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      await expect(verifyOtp(userId, "000000", t0)).rejects.toMatchObject({ code: "OTP_INVALID" });
    }
    await expect(verifyOtp(userId, "000000", t0)).rejects.toMatchObject({ code: "OTP_LOCKED" });
    await expect(verifyOtp(userId, code, t0)).rejects.toMatchObject({ code: "OTP_LOCKED" });
  });
});

describe("resend cooldown", () => {
  it("blocks a new code within 30 seconds", async () => {
    await issueOtp(userId, t0);
    await expect(issueOtp(userId, later(10_000))).rejects.toMatchObject({ code: "OTP_COOLDOWN" });
  });

  it("allows a new code after 30 seconds and kills the old one", async () => {
    const oldCode = await issueOtp(userId, t0);
    const newCode = await issueOtp(userId, later(RESEND_COOLDOWN_MS + 1000));

    if (oldCode !== newCode) {
      await expect(verifyOtp(userId, oldCode, later(RESEND_COOLDOWN_MS + 2000))).rejects.toMatchObject({
        code: "OTP_INVALID",
      });
    }
    await expect(verifyOtp(userId, newCode, later(RESEND_COOLDOWN_MS + 2000))).resolves.toBeUndefined();
  });
});
