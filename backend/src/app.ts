import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";

import { errorHandler, notFoundHandler } from "#src/middlewares/error-handler";
import { requestLogger } from "#src/middlewares/request-logger";
import { slaRouter } from "#src/routes/sla";
import { sseRouter } from "#src/routes/sse";
import { ticketRouter } from "#src/routes/tickets";
import { userRouter } from "#src/routes/users";

export function createApp(): Application {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    })
  );

  app.use(
    cors({
      origin: [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://support_frontend"
      ],
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get("/health", (_req, res) =>
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  );

  app.use("/api/users", userRouter);
  app.use("/api/tickets", ticketRouter);
  app.use("/api/sla", slaRouter);
  app.use("/api/events", sseRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}