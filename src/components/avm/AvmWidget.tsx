"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvmEstimate } from "@/services/avm/housecanary";

interface AvmWidgetProps {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

// ─── Currency formatter ───────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function AvmSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Home Value Estimate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 animate-pulse">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="h-4 bg-muted rounded w-56" />
        <div className="h-4 bg-muted rounded w-32" />
      </CardContent>
    </Card>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function AvmWidget({ address }: AvmWidgetProps) {
  const [estimate, setEstimate] = useState<AvmEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
    });

    fetch(`/api/avm?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json();
      })
      .then((json: AvmEstimate) => {
        if (!cancelled) {
          setEstimate(json);
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
  }, [address.street, address.city, address.state, address.zip]);

  if (loading) return <AvmSkeleton />;

  if (error || !estimate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Home Value Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Value estimate unavailable at this time.</p>
        </CardContent>
      </Card>
    );
  }

  const confidencePct = Math.round(estimate.confidence * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Home Value Estimate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estimated value */}
        <div>
          <p className="text-sm text-muted-foreground">Estimated Value</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(estimate.estimatedValue)}
          </p>
        </div>

        {/* Confidence range */}
        <div>
          <p className="text-sm text-muted-foreground">Range</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(estimate.lowRange)} &ndash; {formatCurrency(estimate.highRange)}
          </p>
        </div>

        {/* Confidence score */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Confidence</span>
          <span className="text-sm font-semibold text-foreground">{confidencePct}%</span>
        </div>

        {/* Provider attribution */}
        <p className="text-xs text-muted-foreground">Powered by {estimate.provider}</p>

        {/* Mandatory disclaimer */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          This is an automated estimate, not an appraisal. For a precise value, consult a licensed
          appraiser.
        </p>
      </CardContent>
    </Card>
  );
}
