import { createLogger, format, transports, Logger } from "winston";

import { env } from "#src/config/env";
import { anonymizeObject } from "#src/utils/anonymizer";

const anonymizeFormat = format((info) => {
  for (const field of ["data", "body", "user"]) {
    const val = info[field];
    if (val !== null && typeof val === "object") {
      info[field] = anonymizeObject(val as Record<string, unknown>);
    }
  }
  return info;
});

export const logger: Logger = createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    anonymizeFormat(),
    env.NODE_ENV === "production"
      ? format.json()
      : format.combine(format.colorize(), format.simple())
  ),
  defaultMeta: { service: "support-tickets" },
  transports: [new transports.Console()]
});
