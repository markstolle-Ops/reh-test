/**
 * RESO Web API OData client with delta sync support.
 *
 * Provides direct MLS board integration as an alternative to SimplyRETS
 * middleware for high-volume boards where a direct IDX agreement exists.
 *
 * Phase 6 (MLS-04): RESO direct integration layer.
 * Phase 6-03: RESO responses cached with 5-minute TTL to reduce API rate
 *             limit consumption during concurrent user searches.
 */

import { cacheWrap, buildCacheKey } from "@/lib/redis";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResoBoardConfig {
  boardId: string;
  apiUrl: string;    // RESO Web API base URL (no trailing slash)
  apiToken: string;  // Bearer token for Authorization header
  name: string;      // Human-readable board name (e.g. "CRMLS")
}

export interface ResoProperty {
  ListingKey?: string;
  ListPrice?: number;
  BedroomsTotal?: number;
  BathroomsTotalDecimal?: number;
  LivingArea?: number;
  PostalCity?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  UnparsedAddress?: string;
  PropertyType?: string;
  StandardStatus?: string;
  Latitude?: number;
  Longitude?: number;
  ModificationTimestamp?: string;
  Media?: Array<{ MediaURL: string }>;
  [key: string]: unknown; // allow additional RESO fields
}

interface ResoODataResponse {
  value: ResoProperty[];
  "@odata.nextLink"?: string;
}

interface FetchParams {
  filter?: string;
  top?: number;
  skip?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PAGES = 10;
const DEFAULT_TOP = 200;
/** RESO response cache TTL — 5 minutes reduces rate limit consumption */
const RESO_CACHE_TTL_SECONDS = 300;

// ─── fetchResoListings ────────────────────────────────────────────────────────

/**
 * Fetch RESO Property resources from a board's OData endpoint.
 * Automatically follows @odata.nextLink for pagination, capped at MAX_PAGES.
 *
 * Responses are cached for 5 minutes (RESO_CACHE_TTL_SECONDS) to reduce
 * rate limit consumption during concurrent user searches.
 *
 * @param board  Board config (URL + auth token)
 * @param params Optional OData query parameters
 */
export async function fetchResoListings(
  board: ResoBoardConfig,
  params?: FetchParams
): Promise<ResoProperty[]> {
  const cacheKey = buildCacheKey(`reso:${board.boardId}`, {
    filter: params?.filter ?? null,
    top: params?.top ?? DEFAULT_TOP,
    skip: params?.skip ?? null,
  });

  return cacheWrap(cacheKey, RESO_CACHE_TTL_SECONDS, async () => {
    const allListings: ResoProperty[] = [];

    // Build initial URL
    const searchParams = new URLSearchParams();
    searchParams.set("$expand", "Media");
    searchParams.set("$top", String(params?.top ?? DEFAULT_TOP));
    if (params?.filter) {
      searchParams.set("$filter", params.filter);
    }
    if (params?.skip != null) {
      searchParams.set("$skip", String(params.skip));
    }

    let url: string | undefined = `${board.apiUrl}/Property?${searchParams.toString()}`;
    let pageCount = 0;

    while (url && pageCount < MAX_PAGES) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${board.apiToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `RESO API error for board ${board.boardId}: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as ResoODataResponse;
      allListings.push(...(data.value ?? []));

      url = data["@odata.nextLink"];
      pageCount++;
    }

    return allListings;
  });
}

// ─── fetchResoDelta ───────────────────────────────────────────────────────────

/**
 * Fetch only listings modified after the given timestamp (delta sync).
 * Appends $filter=ModificationTimestamp gt {since.toISOString()} to the query.
 *
 * Delta results are also cached — same 5-minute TTL as full fetches.
 *
 * @param board  Board config
 * @param since  Fetch listings modified after this date
 */
export async function fetchResoDelta(
  board: ResoBoardConfig,
  since: Date
): Promise<ResoProperty[]> {
  const filter = `ModificationTimestamp gt ${since.toISOString()}`;
  return fetchResoListings(board, { filter });
}
