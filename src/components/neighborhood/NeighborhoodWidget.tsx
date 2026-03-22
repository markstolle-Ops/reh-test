"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NeighborhoodData } from "@/services/neighborhood/data";

interface NeighborhoodWidgetProps {
  zip: string;
  state: string;
}

// ─── Score color helpers ──────────────────────────────────────────────────────

function scoreColor(score: number, max: number = 100): string {
  const pct = score / max;
  if (pct >= 0.7) return "text-green-600";
  if (pct >= 0.4) return "text-yellow-600";
  return "text-red-600";
}

function crimeLabel(crimeIndex: number): {
  label: string;
  color: string;
} {
  if (crimeIndex <= 30) return { label: "Low", color: "text-green-600" };
  if (crimeIndex <= 60) return { label: "Medium", color: "text-yellow-600" };
  return { label: "High", color: "text-red-600" };
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  max = 100,
}: {
  label: string;
  score: number;
  max?: number;
}) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-current transition-all"
          style={{ width: `${pct}%` }}
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={max}
          role="progressbar"
        />
      </div>
      <span className={`text-sm font-semibold w-10 text-right tabular-nums ${scoreColor(score, max)}`}>
        {score}
      </span>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function NeighborhoodSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Neighborhood</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function NeighborhoodWidget({ zip, state }: NeighborhoodWidgetProps) {
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/neighborhood?zip=${encodeURIComponent(zip)}&state=${encodeURIComponent(state)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((json: { neighborhood: NeighborhoodData }) => {
        if (!cancelled) {
          setData(json.neighborhood);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [zip, state]);

  if (loading) return <NeighborhoodSkeleton />;

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Neighborhood</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Neighborhood data unavailable at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const crime = crimeLabel(data.crimeIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neighborhood</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Walkability scores */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Walkability</h4>
          <ScoreBar label="Walk Score" score={data.walkScore} />
          <ScoreBar label="Transit Score" score={data.transitScore} />
          <ScoreBar label="Bike Score" score={data.bikeScore} />
        </div>

        {/* School ratings */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Schools</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Rating</span>
            <span className={`text-lg font-bold ${scoreColor(data.schoolRating, 10)}`}>
              {data.schoolRating}/10
            </span>
          </div>
          {data.nearbySchools.length > 0 && (
            <ul className="space-y-1">
              {data.nearbySchools.map((school, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{school.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {school.distance} &bull;{" "}
                    <span className={scoreColor(school.rating, 10)}>
                      {school.rating}/10
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Crime index */}
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Safety</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Crime Index</span>
            <span className={`text-sm font-semibold ${crime.color}`}>
              {crime.label} ({data.crimeIndex})
            </span>
          </div>
        </div>

        {/* Source attribution */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          Data sources: Walk Score, GreatSchools (stub data — real APIs pending)
        </p>
      </CardContent>
    </Card>
  );
}
