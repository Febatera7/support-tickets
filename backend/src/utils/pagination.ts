import { PaginatedResponse, PaginationQuery } from "#src/types";

export function parsePagination(
  page: unknown,
  limit: unknown
): PaginationQuery {
  const p = Math.max(1, parseInt(String(page ?? "1"), 10) || 1);
  const l = Math.min(
    100,
    Math.max(1, parseInt(String(limit ?? "20"), 10) || 20)
  );
  return { page: p, limit: l };
}

export function getSkip({ page, limit }: PaginationQuery): number {
  return (page - 1) * limit;
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationQuery
): PaginatedResponse<T> {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
