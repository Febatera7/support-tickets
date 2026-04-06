import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.string().default("3000").transform(Number),

  POSTGRES_HOST: z.string().min(1).default("localhost"),
  POSTGRES_PORT: z.string().default("5432").transform(Number),
  POSTGRES_USER: z.string().min(1).default("support_user"),
  POSTGRES_PASSWORD: z.string().min(1).default("support_password"),
  POSTGRES_DB: z.string().min(1).default("support_tickets"),
  DB_SYNC: z.string().default("false"),

  REDIS_HOST: z.string().min(1).default("localhost"),
  REDIS_PORT: z.string().default("6379").transform(Number),

  KEYCLOAK_URL: z.string().url().default("http://localhost:8080"),
  KEYCLOAK_REALM: z.string().min(1).default("support-tickets"),
  KEYCLOAK_CLIENT_ID: z.string().min(1).default("support-api"),
  KEYCLOAK_CLIENT_SECRET: z.string().min(1).default("secret"),
  KEYCLOAK_EXTERNAL_URL: z.string().url().default("http://localhost:8080"),

  GROQ_API_KEY: z.string().min(1).default("test-key"),
  ABSTRACT_API_KEY: z.string().min(1).default("test-key")
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[ENV] Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  if (process.env["NODE_ENV"] !== "test") process.exit(1);
}

export const env = parsed.success ? parsed.data : EnvSchema.parse({});
export type Env = typeof env;
