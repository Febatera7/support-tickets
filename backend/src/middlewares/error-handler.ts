import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { AppError } from "#src/utils/errors";
import { logger } from "#src/utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join(".") || "root";
      if (!errors[field]) errors[field] = [];
      errors[field]!.push(issue.message);
    }
    logger.warn("[Validation] Failed", { path: req.path, errors });
    res
      .status(422)
      .json({ status: "error", message: "Validation failed", errors });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error("[AppError]", {
        message: err.message,
        statusCode: err.statusCode,
        path: req.path
      });
    } else {
      logger.warn("[AppError]", {
        message: err.message,
        statusCode: err.statusCode,
        path: req.path
      });
    }
    res.status(err.statusCode).json({ status: "error", message: err.message });
    return;
  }

  logger.error("[UnhandledError]", {
    message: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({ status: "error", message: "Internal server error" });
}

export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json({
      status: "error",
      message: `Route ${req.method} ${req.path} not found`
    });
}
