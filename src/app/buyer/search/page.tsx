"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NlqSearchBar } from "@/components/search/NlqSearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import type { NormalizedListing, SearchParams } from "@/types";

const MapView = dynamic(() => import("@/components/search/MapView"), { ssr: false });

/**
 * /buyer/search
 *
 * Client component — syncs filter state with URL search params and
 * fetches /api/search on each filter change. Supports pagination via
 * "Load more" button incrementing the page param.
 *
 * Authenticated users can toggle save/unsave via the heart icon on each card.
 */
export default function BuyerSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Parse URL params into SearchParams ─────────────────────────────────────
  function parseSearchParams(sp: URLSearchParams): SearchParams {
    const params: SearchParams = {};
    const q = sp.get("q");
    if (q) params.q = q;
    const minPrice = sp.get("minPrice");
    if (minPrice) params.minPrice = Number(minPrice);
    const maxPrice = sp.get("maxPrice");
    if (maxPrice) params.maxPrice = Number(maxPrice);
    const minBeds = sp.get("minBeds");
    if (minBeds) params.minBeds = Number(minBeds);
    const maxBeds = sp.get("maxBeds");
    if (maxBeds) params.maxBeds = Number(maxBeds);
    const minBaths = sp.get("minBaths");
    if (minBaths) params.minBaths = Number(minBaths);
    const maxBaths = sp.get("maxBaths");
    if (maxBaths) params.maxBaths = Number(maxBaths);
    const minSqft = sp.get("minSqft");
    if (minSqft) params.minSqft = Number(minSqft);
    const maxSqft = sp.get("maxSqft");
    if (maxSqft) params.maxSqft = Number(maxSqft);
    const propertyType = sp.get("propertyType");
    if (propertyType) params.propertyType = propertyType as SearchParams["propertyType"];
    const page = sp.get("page");
    if (page) params.page = Number(page);
    return params;
  }

  // ─── State ───────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<SearchParams>(() => parseSearchParams(searchParams));
  const [nlq, setNlq] = useState<string>(() => searchParams.get("nlq") ?? "");
  const [listings, setListings] = useState<NormalizedListing[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"list" | "map">("list");
  const [savingSearch, setSavingSearch] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  // Prevent stale closure in effect
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // ─── Build query string ──────────────────────────────────────────────────────
  function buildQueryString(params: SearchParams, pg: number, activeNlq?: string): string {
    const sp = new URLSearchParams();
    // When NLQ is active, pass it directly to the API — server-side GPT parsing
    if (activeNlq) {
      sp.set("nlq", activeNlq);
    }
    if (params.q) sp.set("q", params.q);
    if (params.minPrice) sp.set("minPrice", String(params.minPrice));
    if (params.maxPrice) sp.set("maxPrice", String(params.maxPrice));
    if (params.minBeds) sp.set("minBeds", String(params.minBeds));
    if (params.maxBeds) sp.set("maxBeds", String(params.maxBeds));
    if (params.minBaths) sp.set("minBaths", String(params.minBaths));
    if (params.maxBaths) sp.set("maxBaths", String(params.maxBaths));
    if (params.minSqft) sp.set("minSqft", String(params.minSqft));
    if (params.maxSqft) sp.set("maxSqft", String(params.maxSqft));
    if (params.propertyType) sp.set("propertyType", params.propertyType);
    if (pg > 1) sp.set("page", String(pg));
    return sp.toString();
  }

  // ─── Fetch listings ──────────────────────────────────────────────────────────
  const fetchListings = useCallback(
    async (params: SearchParams, pg: number, append: boolean, activeNlq?: string) => {
      setLoading(true);
      try {
        const qs = buildQueryString(params, pg, activeNlq);
        const res = await fetch(`/api/search?${qs}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const results: NormalizedListing[] = data.results ?? [];
        const limit = 24;
        setListings((prev) => (append ? [...prev, ...results] : results));
        setHasMore(results.length === limit);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ─── Sync filters with URL and trigger fetch ─────────────────────────────────
  useEffect(() => {
    const newPage = 1;
    setPage(newPage);
    // Include nlq in URL so the browser address bar reflects the active query
    const qs = buildQueryString(filters, newPage, nlq || undefined);
    router.replace(`/buyer/search${qs ? `?${qs}` : ""}`, { scroll: false });
    fetchListings(filters, newPage, false, nlq || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, nlq]);

  // ─── Load saved IDs for current user ─────────────────────────────────────────
  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch("/api/saved-listing-ids");
        if (res.ok) {
          const data = await res.json();
          setSavedIds(new Set<string>(data.ids ?? []));
        }
      } catch {
        // not authenticated or network error — no-op
      }
    }
    loadSaved();
  }, []);

  // ─── Toggle save handler ─────────────────────────────────────────────────────
  async function handleToggleSave(id: string, source: string) {
    try {
      const res = await fetch(`/api/listings/${id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      if (res.ok) {
        const { saved } = await res.json();
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (saved) {
            next.add(id);
          } else {
            next.delete(id);
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Toggle save error:", err);
    }
  }

  // ─── Load more ────────────────────────────────────────────────────────────────
  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(filters, nextPage, true, nlq || undefined);
  }

  // ─── Clear NLQ ────────────────────────────────────────────────────────────────
  function handleClearNlq() {
    setNlq("");
    // URL will be updated by the filters/nlq effect
  }

  // ─── Save search ──────────────────────────────────────────────────────────────
  async function handleSaveSearch() {
    if (!searchName.trim()) return;
    setSavingSearch(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchName.trim(), filters }),
      });
      if (res.ok) {
        setShowSaveModal(false);
        setSearchName("");
      } else if (res.status === 401) {
        alert("Please sign in to save searches.");
      }
    } catch (err) {
      console.error("Save search error:", err);
    } finally {
      setSavingSearch(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Search Listings</h1>
        <p className="mt-1 text-gray-500">
          Browse homes for sale across our platform and MLS listings.
        </p>
      </div>

      {/* NLQ Search Bar — above filters on all screen sizes */}
      <NlqSearchBar defaultValue={nlq} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar — 280px on lg screens, stacks above on mobile */}
        <aside className="lg:w-[280px] shrink-0">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <SearchFilters params={filters} onChange={setFilters} />
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Active NLQ banner — dismissible */}
          {nlq && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-800">
              <span>
                <span className="font-medium">AI search:</span> &ldquo;{nlq}&rdquo;
              </span>
              <button
                type="button"
                onClick={handleClearNlq}
                className="ml-4 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
              >
                Clear
              </button>
            </div>
          )}

          {/* Toolbar: List/Map toggle + Save Search */}
          <div className="flex items-center justify-between mb-4">
            {/* List / Map toggle */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  view === "list"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setView("map")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                  view === "map"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Map
              </button>
            </div>

            {/* Save Search button */}
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              Save search
            </button>
          </div>

          {loading && listings.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <span className="ml-3 text-gray-500">Loading listings…</span>
            </div>
          ) : (
            <>
              {view === "map" ? (
                <MapView listings={listings} />
              ) : (
                <SearchResults
                  listings={listings}
                  savedIds={savedIds}
                  onToggleSave={handleToggleSave}
                />
              )}

              {view === "list" && hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {loading ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Save search modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Save this search</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get email alerts when new listings match your current filters.
            </p>
            <input
              type="text"
              placeholder="Search name (e.g. &quot;Austin 3BR&quot;)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowSaveModal(false);
                  setSearchName("");
                }}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={savingSearch || !searchName.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSearch ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
