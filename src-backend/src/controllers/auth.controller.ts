import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "JWT_SECRET is not configured",
    );
  }
  return secret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    throw new AppError(400, "BAD_REQUEST", "email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role: "admin",
    is_active: true,
  }).select("+password_hash");

  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
  }

  const expiresIn = getJwtExpiresIn();
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn },
  );

  return res.json({
    token,
    token_type: "Bearer",
    expires_in: expiresIn,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function getMe(req: Request, res: Response) {
  const authUser = res.locals.authUser as
    | { id: string; email: string; role: string }
    | undefined;

  if (!authUser) {
    throw new AppError(401, "UNAUTHORIZED", "Unauthorized");
  }

  const user = await User.findOne({
    _id: authUser.id,
    role: "admin",
    is_active: true,
  });

  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
