import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
};

function getBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError(401, "UNAUTHORIZED", "Authorization header is missing");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid authorization format");
  }

  return token;
}

function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "JWT_SECRET is not configured",
    );
  }

  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(req);
    const payload = verifyToken(token);

    if (!payload.sub || payload.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Admin access required");
    }

    const user = await User.findOne({
      _id: payload.sub,
      role: "admin",
      is_active: true,
    });

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
    }

    res.locals.authUser = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
}
