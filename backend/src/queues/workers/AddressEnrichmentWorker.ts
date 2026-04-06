import { Worker, Job, UnrecoverableError } from "bullmq";

import { AppDataSource } from "#src/config/database";
import { redisConnection } from "#src/config/redis";
import { User } from "#src/entities/User";
import { enrichAddress } from "#src/external/AddressEnrichmentService";
import { AddressEnrichmentJobData } from "#src/types";
import { sleep } from "#src/utils/backoff";
import { logger } from "#src/utils/logger";
import { RateLimitError } from "#src/utils/rate-limiter";

async function process(job: Job<AddressEnrichmentJobData>): Promise<void> {
  const { userId, cep } = job.data;
  logger.info("[AddressWorker] Processing", {
    jobId: job.id,
    userId,
    attempt: job.attemptsMade
  });

  let address;
  try {
    address = await enrichAddress(cep);
  } catch (err) {
    if (err instanceof RateLimitError) {
      await sleep(Math.min(err.retryAfterSeconds * 1000, 10000));
      throw err;
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found"))
      throw new UnrecoverableError(`CEP ${cep} does not exist`);
    throw err;
  }

  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user) throw new UnrecoverableError(`User ${userId} not found`);

  user.street = address.street;
  user.neighborhood = address.neighborhood;
  user.city = address.city;
  user.state = address.state;
  user.addressEnriched = true;
  await repo.save(user);

  logger.info("[AddressWorker] Done", { userId, city: address.city });
}

export function startAddressEnrichmentWorker(): Worker<AddressEnrichmentJobData> {
  const worker = new Worker<AddressEnrichmentJobData>(
    "address-enrichment",
    process,
    {
      connection: redisConnection,
      concurrency: 10,
      limiter: { max: 30, duration: 1000 }
    }
  );
  worker.on("completed", (job) =>
    logger.info("[AddressWorker] Job completed", { jobId: job.id })
  );
  worker.on("failed", (job, err) =>
    logger.error("[AddressWorker] Job failed", {
      jobId: job?.id,
      error: err.message
    })
  );
  logger.info("[AddressWorker] Started");
  return worker;
}
