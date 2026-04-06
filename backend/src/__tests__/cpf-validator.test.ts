import { isValidCpf } from "#src/utils/cpf-validator";

describe("isValidCpf", () => {
  it("validates a known valid CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("rejects all-same digits", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });
  it("rejects wrong length", () => {
    expect(isValidCpf("123")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
  it("rejects invalid check digits", () => {
    expect(isValidCpf("529.982.247-26")).toBe(false);
  });
  it("accepts with or without formatting", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
});
