import morgan, { StreamOptions } from "morgan";

import { logger } from "#src/utils/logger";

const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim())
};

export const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);
