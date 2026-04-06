import { Worker, Job, UnrecoverableError } from "bullmq";

import { AppDataSource } from "#src/config/database";
import { redisConnection } from "#src/config/redis";
import { User } from "#src/entities/User";
import { validateEmail } from "#src/external/EmailValidationService";
import { EmailValidationJobData } from "#src/types";
import { sleep } from "#src/utils/backoff";
import { logger } from "#src/utils/logger";
import { RateLimitError } from "#src/utils/rate-limiter";

async function process(job: Job<EmailValidationJobData>): Promise<void> {
  const { userId, email } = job.data;
  logger.info("[EmailWorker] Processing", {
    jobId: job.id,
    userId,
    attempt: job.attemptsMade
  });

  let result;
  try {
    result = await validateEmail(email);
  } catch (err) {
    if (err instanceof RateLimitError) {
      await sleep(err.retryAfterSeconds * 1000);
      throw err;
    }
    throw err;
  }

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user) throw new UnrecoverableError(`User ${userId} not found`);

  user.emailValidated =
    result.isDeliverable && result.isValid && !result.isDisposable;
  await repo.save(user);

  logger.info("[EmailWorker] Done", { userId, validated: user.emailValidated });
}

export function startEmailValidationWorker(): Worker<EmailValidationJobData> {
  const worker = new Worker<EmailValidationJobData>(
    "email-validation",
    process,
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 }
    }
  );
  worker.on("completed", (job) =>
    logger.info("[EmailWorker] Job completed", { jobId: job.id })
  );
  worker.on("failed", (job, err) =>
    logger.error("[EmailWorker] Job failed", {
      jobId: job?.id,
      error: err.message
    })
  );
  logger.info("[EmailWorker] Started");
  return worker;
}
