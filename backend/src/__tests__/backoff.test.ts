import { computeBackoffDelay, withBackoff } from "#src/utils/backoff";

describe("computeBackoffDelay", () => {
  it("returns base delay on first attempt", () => {
    expect(computeBackoffDelay(1, 1000, 32000, 0)).toBe(1000);
  });
  it("doubles each attempt", () => {
    expect(computeBackoffDelay(2, 1000, 32000, 0)).toBe(2000);
    expect(computeBackoffDelay(3, 1000, 32000, 0)).toBe(4000);
  });
  it("does not exceed maxMs", () => {
    expect(computeBackoffDelay(10, 1000, 5000, 0)).toBeLessThanOrEqual(5000);
  });
  it("adds jitter within range", () => {
    const delay = computeBackoffDelay(1, 1000, 32000, 500);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThan(1501);
  });
});

describe("withBackoff", () => {
  it("returns on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    await expect(withBackoff(fn, 3, "svc")).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("retries and succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("ok");
    await expect(withBackoff(fn, 3, "svc")).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it("throws after all attempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));
    await expect(withBackoff(fn, 3, "svc")).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
