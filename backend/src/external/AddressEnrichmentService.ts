import axios from "axios";

import { viaCEPBreaker } from "#src/external/circuit-breakers";
import { sleep } from "#src/utils/backoff";
import { logger } from "#src/utils/logger";
import { checkRateLimit, RateLimitError } from "#src/utils/rate-limiter";


interface ViaCEPResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

const RATE_LIMIT = { service: "viacep", maxCalls: 300, windowSeconds: 60 };

async function callViaCEP(cep: string): Promise<AddressData> {
  await checkRateLimit(RATE_LIMIT);
  const clean = cep.replace(/\D/g, "");
  const response = await axios.get<ViaCEPResponse>(
    `https://viacep.com.br/ws/${clean}/json/`,
    { timeout: 5000 }
  );
  if (response.data.erro === true) throw new Error(`CEP ${clean} not found`);
  return {
    street: response.data.logradouro,
    neighborhood: response.data.bairro,
    city: response.data.localidade,
    state: response.data.uf
  };
}

const breaker = viaCEPBreaker(callViaCEP);

export async function enrichAddress(cep: string): Promise<AddressData> {
  try {
    return await (breaker.fire(cep) as Promise<AddressData>);
  } catch (err) {
    if (err instanceof RateLimitError) {
      await sleep(Math.min(err.retryAfterSeconds * 1000, 10000));
      throw err;
    }
    logger.error("[AddressEnrichment] Failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    throw err;
  }
}
