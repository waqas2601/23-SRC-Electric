import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { AppError } from "../utils/AppError.js";

type RequestPart = "body" | "query" | "params";

export function validateRequest(
  schema: ZodTypeAny,
  part: RequestPart = "body",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      (req as unknown as Record<RequestPart, unknown>)[part] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return next(
          new AppError(
            400,
            "BAD_REQUEST",
            "Request validation failed",
            details,
          ),
        );
      }

      return next(error);
    }
  };
}
