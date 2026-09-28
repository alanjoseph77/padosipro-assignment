import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../lib/errors";

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Please log in to continue.");
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string };
    res.locals.userId = payload.sub;
    next();
  } catch {
    throw new AppError(401, "SESSION_EXPIRED", "Your session has expired. Please log in again.");
  }
};