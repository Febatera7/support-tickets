import {
  parsePagination,
  buildPaginatedResponse,
  getSkip
} from "#src/utils/pagination";

describe("parsePagination", () => {
  it("returns defaults when nothing provided", () => {
    expect(parsePagination(undefined, undefined)).toEqual({
      page: 1,
      limit: 20
    });
  });
  it("parses valid values", () => {
    expect(parsePagination("3", "50")).toEqual({ page: 3, limit: 50 });
  });
  it("enforces minimum page of 1", () => {
    expect(parsePagination("0", "10").page).toBe(1);
  });
  it("caps limit at 100", () => {
    expect(parsePagination("1", "999").limit).toBe(100);
  });
  it("handles non-numeric gracefully", () => {
    expect(parsePagination("abc", "xyz")).toEqual({ page: 1, limit: 20 });
  });
});

describe("getSkip", () => {
  it("returns 0 for first page", () => {
    expect(getSkip({ page: 1, limit: 20 })).toBe(0);
  });
  it("computes correct offset", () => {
    expect(getSkip({ page: 2, limit: 20 })).toBe(20);
    expect(getSkip({ page: 3, limit: 10 })).toBe(20);
  });
});

describe("buildPaginatedResponse", () => {
  it("computes totalPages", () => {
    const r = buildPaginatedResponse(["a", "b"], 25, { page: 1, limit: 10 });
    expect(r.totalPages).toBe(3);
    expect(r.total).toBe(25);
  });
  it("handles empty results", () => {
    const r = buildPaginatedResponse([], 0, { page: 1, limit: 20 });
    expect(r.totalPages).toBe(0);
  });
});
