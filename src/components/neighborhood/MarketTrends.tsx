"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketTrendPoint } from "@/services/neighborhood/data";

interface MarketTrendsProps {
  zip: string;
  state: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

function formatTooltipPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function MarketTrendsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Trends</CardTitle>
      </CardHeader>
      <CardContent className="animate-pulse space-y-4">
        <div className="h-48 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketTrends({ zip, state }: MarketTrendsProps) {
  const [trends, setTrends] = useState<MarketTrendPoint[]>([]);
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
      .then((json: { trends: MarketTrendPoint[] }) => {
        if (!cancelled) {
          setTrends(json.trends ?? []);
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

  if (loading) return <MarketTrendsSkeleton />;

  if (error || trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Market trend data unavailable at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compute summary stats from the most recent data point
  const latest = trends[trends.length - 1];
  const avgDom = Math.round(trends.reduce((sum, p) => sum + p.daysOnMarket, 0) / trends.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Trends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line chart */}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trends} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="price"
              orientation="left"
              tickFormatter={formatPrice}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <YAxis
              yAxisId="dom"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
              label={{
                value: "DOM",
                angle: 90,
                position: "insideRight",
                offset: 8,
                style: { fontSize: 10, fill: "var(--muted-foreground)" },
              }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Median Price")
                  return [formatTooltipPrice(Number(value ?? 0)), String(name)];
                return [value ?? 0, String(name)];
              }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                color: "var(--card-foreground)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="medianPrice"
              name="Median Price"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="dom"
              type="monotone"
              dataKey="daysOnMarket"
              name="Days on Market"
              stroke="#d97706"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Current Median Price" value={formatPrice(latest.medianPrice)} />
          <StatCard label="Avg Days on Market" value={`${avgDom} days`} />
          <StatCard label="Active Inventory" value={`${latest.activeInventory} units`} />
        </div>

        {/* Source attribution */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          Market data powered by RealEstateHunter Analytics (stub data — real APIs pending)
        </p>
      </CardContent>
    </Card>
  );
}
