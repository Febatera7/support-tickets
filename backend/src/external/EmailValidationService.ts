import axios from "axios";

import { env } from "#src/config/env";
import { abstractAPIBreaker } from "#src/external/circuit-breakers";
import { sleep } from "#src/utils/backoff";
import { logger } from "#src/utils/logger";
import { checkRateLimit, RateLimitError } from "#src/utils/rate-limiter";


interface AbstractEmailResponse {
  deliverability: string;
  quality_score: string;
  is_valid_format: { value: boolean };
  is_disposable_email: { value: boolean };
  is_smtp_valid: { value: boolean };
}

export interface EmailValidationResult {
  isValid: boolean;
  isDeliverable: boolean;
  isDisposable: boolean;
  qualityScore: number;
}

const RATE_LIMIT = {
  service: "abstract-email",
  maxCalls: 100,
  windowSeconds: 3600
};

async function callAbstractAPI(email: string): Promise<EmailValidationResult> {
  await checkRateLimit(RATE_LIMIT);

  const response = await axios.get<AbstractEmailResponse>(
    "https://emailvalidation.abstractapi.com/v1/",
    { params: { api_key: env.ABSTRACT_API_KEY, email }, timeout: 8000 }
  );

  if (response.status === 429) {
    await sleep(60000);
    throw new Error("AbstractAPI rate limit (429)");
  }

  const d = response.data;
  return {
    isValid: d.is_valid_format.value && d.is_smtp_valid.value,
    isDeliverable: d.deliverability === "DELIVERABLE",
    isDisposable: d.is_disposable_email.value,
    qualityScore: parseFloat(d.quality_score)
  };
}

const breaker = abstractAPIBreaker(callAbstractAPI);

export async function validateEmail(
  email: string
): Promise<EmailValidationResult> {
  try {
    return await (breaker.fire(email) as Promise<EmailValidationResult>);
  } catch (err) {
    if (err instanceof RateLimitError) {
      await sleep(err.retryAfterSeconds * 1000);
      throw err;
    }
    logger.error("[EmailValidation] Failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    throw err;
  }
}
