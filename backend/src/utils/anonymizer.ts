const PII_KEYS = new Set([
  "email",
  "cpf",
  "phone",
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "secret"
]);

function isPii(key: string): boolean {
  const lower = key.toLowerCase();
  return PII_KEYS.has(lower) || [...PII_KEYS].some((k) => lower.includes(k));
}

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at < 2) return "***@***";
  const user = value.slice(0, at);
  return `${user.slice(0, 2)}${"*".repeat(Math.max(user.length - 2, 3))}${value.slice(at)}`;
}

function maskCpf(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length !== 11) return "***.***.***-**";
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length < 4) return "****";
  return `${"*".repeat(d.length - 4)}${d.slice(-4)}`;
}

function maskGeneric(value: string): string {
  if (value.length <= 4) return "****";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

function maskValue(key: string, value: unknown): unknown {
  if (typeof value !== "string") return value;
  const lower = key.toLowerCase();
  if (lower.includes("email")) return maskEmail(value);
  if (lower.includes("cpf")) return maskCpf(value);
  if (lower.includes("phone")) return maskPhone(value);
  return maskGeneric(value);
}

export function anonymizeObject(
  obj: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  if (depth > 5) return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPii(key)) {
      result[key] = maskValue(key, value);
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = anonymizeObject(
        value as Record<string, unknown>,
        depth + 1
      );
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === "object"
          ? anonymizeObject(item as Record<string, unknown>, depth + 1)
          : item
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}
