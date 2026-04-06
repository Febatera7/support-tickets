import { anonymizeObject } from "#src/utils/anonymizer";

describe("anonymizeObject", () => {
  it("masks email", () => {
    const r = anonymizeObject({ email: "john.doe@example.com" });
    expect(r["email"]).not.toBe("john.doe@example.com");
    expect(r["email"] as string).toContain("@example.com");
  });
  it("masks CPF", () => {
    const r = anonymizeObject({ cpf: "52998224725" });
    expect(r["cpf"]).not.toBe("52998224725");
    expect(r["cpf"] as string).toContain("***");
  });
  it("masks phone", () => {
    const r = anonymizeObject({ phone: "11987654321" });
    expect(r["phone"] as string).toContain("4321");
  });
  it("preserves non-PII fields", () => {
    const r = anonymizeObject({ name: "John", role: "operator" });
    expect(r["name"]).toBe("John");
    expect(r["role"]).toBe("operator");
  });
  it("anonymizes nested objects", () => {
    const r = anonymizeObject({ user: { email: "a@b.com", name: "Alice" } });
    const user = r["user"] as Record<string, unknown>;
    expect(user["email"]).not.toBe("a@b.com");
    expect(user["name"]).toBe("Alice");
  });
  it("does not mutate the original", () => {
    const original = { email: "test@example.com" };
    anonymizeObject(original);
    expect(original.email).toBe("test@example.com");
  });
});
