import Groq from "groq-sdk";

import { env } from "#src/config/env";
import { TicketPriority } from "#src/entities/Ticket";
import { groqBreaker } from "#src/external/circuit-breakers";
import { sleep } from "#src/utils/backoff";
import { logger } from "#src/utils/logger";
import { checkRateLimit, RateLimitError } from "#src/utils/rate-limiter";

export interface AICategorizationResult {
  suggestedPriority: TicketPriority;
  suggestedCategory: string;
  reasoning: string;
}

interface GroqResponse {
  priority: string;
  category: string;
  reasoning: string;
}

const RATE_LIMIT = { service: "groq", maxCalls: 30, windowSeconds: 60 };

const VALID_CATEGORIES = new Set([
  "billing",
  "technical",
  "account",
  "network",
  "hardware",
  "software",
  "security",
  "other"
]);

function parsePriority(value: string): TicketPriority {
  const normalized = value.toLowerCase().trim();
  const map: Record<string, TicketPriority> = {
    low: TicketPriority.LOW,
    medium: TicketPriority.MEDIUM,
    high: TicketPriority.HIGH,
    critical: TicketPriority.CRITICAL
  };
  return map[normalized] ?? TicketPriority.MEDIUM;
}

const groqClient = new Groq({ apiKey: env.GROQ_API_KEY });

async function callGroq(
  title: string,
  description: string
): Promise<AICategorizationResult> {
  await checkRateLimit(RATE_LIMIT);

  const prompt = `You are a support ticket triage assistant for an IT/services company. Analyze the ticket and classify its priority and category.

PRIORITY RULES (be strict):
- critical: life safety risk, fire, flooding, complete system outage affecting all users, physical emergency, irreversible data loss
- high: major system down, security breach, many users affected, significant financial impact, urgent deadline
- medium: partial degradation, single user blocked, non-urgent bug, feature not working as expected
- low: question, cosmetic issue, nice-to-have, documentation request, minor inconvenience

CATEGORY RULES:
- hardware: physical equipment issues (computer, printer, server, fire, flood affecting equipment)
- software: application bugs, crashes, installation
- network: connectivity, internet, VPN, firewall
- security: breach, unauthorized access, malware, data leak
- billing: invoices, payments, charges
- account: login, password, permissions, access
- technical: generic technical issue not covered above
- other: anything else

Title: "${title}"
Description: "${description}"

Respond ONLY with a valid JSON object, no markdown, no extra text:
{"priority":"<low|medium|high|critical>","category":"<billing|technical|account|network|hardware|software|security|other>","reasoning":"<one sentence explaining the priority choice>"}`;

  const completion = await groqClient.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.1
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: GroqResponse;
  try {
    parsed = JSON.parse(raw) as GroqResponse;
  } catch {
    logger.warn("[Groq] Failed to parse response, using defaults", { raw });
    return {
      suggestedPriority: TicketPriority.MEDIUM,
      suggestedCategory: "other",
      reasoning: ""
    };
  }

  const category = VALID_CATEGORIES.has(parsed.category?.trim() ?? "")
    ? parsed.category!.trim()
    : "other";

  return {
    suggestedPriority: parsePriority(parsed.priority ?? "medium"),
    suggestedCategory: category,
    reasoning: parsed.reasoning?.trim() ?? ""
  };
}

const breaker = groqBreaker(callGroq);

export async function categorizeTicket(
  title: string,
  description: string
): Promise<AICategorizationResult> {
  try {
    return await (breaker.fire(
      title,
      description
    ) as Promise<AICategorizationResult>);
  } catch (err) {
    if (err instanceof RateLimitError) {
      await sleep(Math.min(err.retryAfterSeconds * 1000, 60000));
      throw err;
    }
    logger.error("[AICategorization] Failed", {
      error: err instanceof Error ? err.message : String(err)
    });
    throw err;
  }
}