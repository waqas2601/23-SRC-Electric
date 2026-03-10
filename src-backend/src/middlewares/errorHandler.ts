import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

type ErrorResponseBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
    method: string;
  };
};

function buildErrorResponse(
  req: Request,
  code: string,
  message: string,
  details?: unknown,
): ErrorResponseBody {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  };
}

function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    return new AppError(
      422,
      "UNPROCESSABLE_ENTITY",
      "Validation failed",
      details,
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, "BAD_REQUEST", `Invalid value for ${err.path}`);
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    const duplicateFields =
      "keyValue" in (err as object)
        ? Object.keys(
            (err as { keyValue?: Record<string, unknown> }).keyValue ?? {},
          )
        : [];

    return new AppError(409, "CONFLICT", "Duplicate value not allowed", {
      fields: duplicateFields,
    });
  }

  return new AppError(500, "INTERNAL_SERVER_ERROR", "Internal server error");
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const appError = normalizeError(err);

  if (appError.statusCode >= 500) {
    console.error(err);
  }

  const payload = buildErrorResponse(
    req,
    appError.code,
    appError.message,
    appError.details,
  );
  res.status(appError.statusCode).json(payload);
}
