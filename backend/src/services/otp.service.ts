import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";

export const OTP_TTL_MS = 10 * 60 * 1000;       // 10 minutes
export const RESEND_COOLDOWN_MS = 30 * 1000;    // 30 seconds
export const MAX_ATTEMPTS = 5;

export function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string): string {
  return crypto.createHmac("sha256", process.env.OTP_SECRET!).update(code).digest("hex");
}

export async function issueOtp(userId: string, now = new Date()): Promise<string> {
  const last = await prisma.emailOtp.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (last) {
    const waitedMs = now.getTime() - last.createdAt.getTime();
    if (waitedMs < RESEND_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - waitedMs) / 1000);
      throw new AppError(429, "OTP_COOLDOWN", `Please wait ${secondsLeft}s before requesting a new code`);
    }
  }

  // Any older unused codes stop working the moment a new one is issued
  await prisma.emailOtp.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: now },
  });

  const code = generateCode();
  await prisma.emailOtp.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
      createdAt: now,
    },
  });

  return code;
}

export async function verifyOtp(userId: string, code: string, now = new Date()): Promise<void> {
  const otp = await prisma.emailOtp.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt <= now) {
    throw new AppError(400, "OTP_EXPIRED", "This code has expired. Please request a new one.");
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new AppError(429, "OTP_LOCKED", "Too many incorrect attempts. Please request a new code.");
  }

  const matches = crypto.timingSafeEqual(Buffer.from(otp.codeHash), Buffer.from(hashCode(code)));

  if (!matches) {
    const updated = await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - updated.attempts;
    if (left <= 0) {
      throw new AppError(429, "OTP_LOCKED", "Too many incorrect attempts. Please request a new code.");
    }
    throw new AppError(400, "OTP_INVALID", `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`);
  }

  await prisma.$transaction([
    prisma.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: now } }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);
}