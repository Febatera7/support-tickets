import CircuitBreaker from "opossum";

import { logger } from "#src/utils/logger";

type AsyncFn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => Promise<TReturn>;

function makeBreaker<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>,
  name: string,
  timeout: number,
  errorThreshold: number,
  resetTimeout: number
): CircuitBreaker<TArgs, TReturn> {
  const breaker = new CircuitBreaker(fn, {
    timeout,
    errorThresholdPercentage: errorThreshold,
    resetTimeout,
    volumeThreshold: 3
  });

  breaker.on("open", () =>
    logger.warn(`[CircuitBreaker] OPEN — ${name} is unavailable`)
  );
  breaker.on("halfOpen", () =>
    logger.info(`[CircuitBreaker] HALF-OPEN — ${name} testing recovery`)
  );
  breaker.on("close", () =>
    logger.info(`[CircuitBreaker] CLOSED — ${name} recovered`)
  );
  breaker.on("reject", () =>
    logger.warn(`[CircuitBreaker] REJECTED — ${name} circuit is open`)
  );
  breaker.on("timeout", () =>
    logger.warn(`[CircuitBreaker] TIMEOUT — ${name}`)
  );

  breaker.fallback(() => {
    throw new Error(`Service ${name} is currently unavailable`);
  });

  return breaker;
}

export function abstractAPIBreaker<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>
): CircuitBreaker<TArgs, TReturn> {
  return makeBreaker(fn, "AbstractAPI", 8000, 50, 60000);
}

export function viaCEPBreaker<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>
): CircuitBreaker<TArgs, TReturn> {
  return makeBreaker(fn, "ViaCEP", 5000, 40, 30000);
}

export function groqBreaker<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>
): CircuitBreaker<TArgs, TReturn> {
  return makeBreaker(fn, "Groq", 20000, 60, 60000);
}
