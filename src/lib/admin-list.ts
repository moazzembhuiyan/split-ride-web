import type { PagedResponse } from "@/types/base";

const FETCH_SIZE = 100;

interface Identified {
  _id: string;
}

type FetchPage<T> = (page: number, limit: number) => Promise<PagedResponse<T>>;

/**
 * Loads a complete admin list instead of one server page.
 *
 * The API returns pages in no fixed order, so consecutive pages repeat some
 * rows and never return others. A single request for every row cannot overlap
 * with itself. If the API limits the page size, the rest is collected page by
 * page and de-duplicated.
 */
export async function fetchAllRows<T extends Identified>(
  fetchPage: FetchPage<T>,
): Promise<T[]> {
  const rows = new Map<string, T>();
  const collect = (batch: T[] | undefined) => {
    for (const row of batch ?? []) rows.set(row._id, row);
  };

  const first = await fetchPage(1, FETCH_SIZE);
  const total = first.pagination?.total ?? first.data?.length ?? 0;
  if ((first.data?.length ?? 0) >= total) {
    collect(first.data);
    return [...rows.values()];
  }

  let limit = FETCH_SIZE;
  let totalPage = first.pagination?.totalPage ?? 1;
  try {
    const whole = await fetchPage(1, total);
    collect(whole.data);
    if (rows.size >= total) return [...rows.values()];
    limit = total;
    totalPage = whole.pagination?.totalPage ?? totalPage;
  } catch {
    // Page size refused: fall back to the size that already worked.
    collect(first.data);
  }

  for (let page = 2; page <= totalPage; page++) {
    const next = await fetchPage(page, limit);
    collect(next.data);
  }
  return [...rows.values()];
}

export interface LocalPage<T> {
  items: T[];
  page: number;
  totalPage: number;
  total: number;
  /** 1-based positions of the first and last row shown; 0 when empty. */
  from: number;
  to: number;
}

/** Slices one page out of a full list, clamping a page that no longer exists. */
export function paginate<T>(
  rows: T[],
  requestedPage: number,
  pageSize: number,
): LocalPage<T> {
  const total = rows.length;
  const totalPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPage);
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    page,
    totalPage,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

function timeOf(value: string | undefined | null): number {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

/** createdAt descending, with _id as the tie-breaker. */
export function byNewest(
  a: Identified & { createdAt?: string },
  b: Identified & { createdAt?: string },
): number {
  return (
    timeOf(b.createdAt) - timeOf(a.createdAt) || b._id.localeCompare(a._id)
  );
}
