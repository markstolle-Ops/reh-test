"use client";

import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NormalizedListing } from "@/types";

interface MapViewProps {
  listings: NormalizedListing[];
  onMarkerClick?: (id: string) => void;
}

/**
 * Format a price number (in cents) to a short label like "$450k" or "$1.2m".
 */
function formatPriceLabel(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}m`;
  }
  return `$${Math.round(dollars / 1_000)}k`;
}

/**
 * Interactive Mapbox map showing listing markers with price labels.
 *
 * Uses react-map-gl. Dynamically imported with { ssr: false } in the
 * search page to avoid SSR issues with mapbox-gl.
 *
 * Props:
 *   listings   - NormalizedListing[] to render as markers
 *   onMarkerClick - optional callback with listing id when marker is clicked
 */
export default function MapView({ listings, onMarkerClick }: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          longitude: -98.5,
          latitude: 38.9,
          zoom: 4,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl position="top-right" />
        {listings.map((listing) => {
          if (listing.lat == null || listing.lng == null) return null;
          return (
            <Marker
              key={listing.id}
              longitude={listing.lng}
              latitude={listing.lat}
              anchor="bottom"
              onClick={() => onMarkerClick?.(listing.id)}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "999px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPriceLabel(listing.price)}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
