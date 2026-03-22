"use client";

import type { SearchParams, PropertyType } from "@/types";

interface SearchFiltersProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land_lot", label: "Land / Lot" },
];

/**
 * SearchFilters
 *
 * Sidebar with filter controls for the buyer search page.
 * Calls onChange with updated SearchParams whenever any control changes.
 * Controls: text search (city/zip), min/max price, min beds, min baths, min sqft, property type.
 */
export function SearchFilters({ params, onChange }: SearchFiltersProps) {
  function update(patch: Partial<SearchParams>) {
    onChange({ ...params, ...patch });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Filters</h2>
      </div>

      {/* City or ZIP */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-q" className="text-sm font-medium text-gray-700">
          City or ZIP
        </label>
        <input
          id="filter-q"
          type="text"
          value={params.q ?? ""}
          onChange={(e) => update({ q: e.target.value || undefined })}
          placeholder="e.g. Austin or 78701"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Price Range</span>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="filter-min-price" className="text-xs text-gray-500">
              Min ($)
            </label>
            <input
              id="filter-min-price"
              type="number"
              min={0}
              step={10000}
              value={params.minPrice ? params.minPrice / 100 : ""}
              onChange={(e) =>
                update({ minPrice: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined })
              }
              placeholder="No min"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label htmlFor="filter-max-price" className="text-xs text-gray-500">
              Max ($)
            </label>
            <input
              id="filter-max-price"
              type="number"
              min={0}
              step={10000}
              value={params.maxPrice ? params.maxPrice / 100 : ""}
              onChange={(e) =>
                update({ maxPrice: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined })
              }
              placeholder="No max"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Min Beds */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-min-beds" className="text-sm font-medium text-gray-700">
          Min Bedrooms
        </label>
        <select
          id="filter-min-beds"
          value={params.minBeds ?? ""}
          onChange={(e) =>
            update({ minBeds: e.target.value ? Number(e.target.value) : undefined })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
          <option value="5">5+</option>
        </select>
      </div>

      {/* Min Baths */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-min-baths" className="text-sm font-medium text-gray-700">
          Min Bathrooms
        </label>
        <select
          id="filter-min-baths"
          value={params.minBaths ?? ""}
          onChange={(e) =>
            update({ minBaths: e.target.value ? Number(e.target.value) : undefined })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      {/* Min Sqft */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-min-sqft" className="text-sm font-medium text-gray-700">
          Min Sq Ft
        </label>
        <input
          id="filter-min-sqft"
          type="number"
          min={0}
          step={100}
          value={params.minSqft ?? ""}
          onChange={(e) =>
            update({ minSqft: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="No min"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Property Type */}
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-type" className="text-sm font-medium text-gray-700">
          Property Type
        </label>
        <select
          id="filter-type"
          value={params.propertyType ?? ""}
          onChange={(e) =>
            update({
              propertyType: (e.target.value as PropertyType) || undefined,
            })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All types</option>
          {PROPERTY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={() => onChange({})}
        className="mt-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
      >
        Reset filters
      </button>
    </div>
  );
}
