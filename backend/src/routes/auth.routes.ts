import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { sendOtpEmail } from "../lib/mailer";
import { issueOtp, verifyOtp } from "../services/otp.service";

const router = Router();

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const registerSchema = z.object({ email, password });
const verifySchema = z.object({ email, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });
const emailOnlySchema = z.object({ email });
const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });

// POST /auth/register
router.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });

  if (existing?.isVerified) {
    throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists. Please log in.");
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  // If they registered before but never verified, update their password and send a new code
  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } })
    : await prisma.user.create({ data: { email: body.email, passwordHash } });

  const code = await issueOtp(user.id);
  await sendOtpEmail(user.email, code);

  res.status(201).json({ message: "Account created. We sent a 6-digit code to your email.", email: user.email });
});

// POST /auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  const body = verifySchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  if (!user) throw new AppError(400, "OTP_INVALID", "Incorrect code.");
  if (user.isVerified) throw new AppError(409, "ALREADY_VERIFIED", "This email is already verified. Please log in.");

  await verifyOtp(user.id, body.code);
  res.json({ message: "Email verified. You can now log in." });
});

// POST /auth/resend-otp
router.post("/resend-otp", async (req, res) => {
  const body = emailOnlySchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  if (user && !user.isVerified) {
    const code = await issueOtp(user.id);
    await sendOtpEmail(user.email, code);
  }

  res.json({ message: "If this email needs verification, a new code has been sent." });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  const passwordOk = user ? await bcrypt.compare(body.password, user.passwordHash) : false;
  if (!user || !passwordOk) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
  }

  if (!user.isVerified) {
    // Send a fresh code so they can verify straight away (ignore cooldown if one was just sent)
    try {
      const code = await issueOtp(user.id);
      await sendOtpEmail(user.email, code);
    } catch (e) {
      if (!(e instanceof AppError && e.code === "OTP_COOLDOWN")) throw e;
    }
    throw new AppError(403, "EMAIL_NOT_VERIFIED", "Please verify your email. We sent you a new code.");
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });

  res.json({
    token,
    user: { id: user.id, email: user.email, profileCompleted: user.profileCompleted },
  });
});

export default router;