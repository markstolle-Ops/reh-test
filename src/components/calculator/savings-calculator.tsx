"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateSavings } from "@/lib/calculator";
import { LAUNCH_STATES } from "@/lib/constants";
import { STATE_INFO } from "@/lib/states";
import type { CommissionBreakdown } from "@/types";
import { BreakdownTable } from "./breakdown-table";
import { SavingsChart } from "./savings-chart";

const DEFAULT_HOME_PRICE = 400000;
const DEFAULT_STATE = "CA";

function formatInputValue(raw: string): string {
  // Strip non-numeric characters and format with commas
  const numeric = raw.replace(/[^0-9]/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString();
}

export function SavingsCalculator() {
  const [displayValue, setDisplayValue] = useState<string>(DEFAULT_HOME_PRICE.toLocaleString());
  const [homePrice, setHomePrice] = useState<number>(DEFAULT_HOME_PRICE);
  const [state, setState] = useState<string>(DEFAULT_STATE);

  const breakdown: CommissionBreakdown = calculateSavings(homePrice, state);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const numeric = raw ? Number(raw) : 0;
    setDisplayValue(numeric ? numeric.toLocaleString() : "");
    setHomePrice(numeric);
  }, []);

  const handleStateChange = useCallback((value: string | null) => {
    if (value) setState(value);
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Cost Comparison Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="home-price" className="text-sm font-medium">
              Home Price
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="home-price"
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handlePriceChange}
                className="pl-7"
                placeholder="400,000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="state-select" className="text-sm font-medium">
              State
            </label>
            <Select value={state} onValueChange={handleStateChange}>
              <SelectTrigger id="state-select">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {LAUNCH_STATES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {STATE_INFO[code]?.name ?? code} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Total Closing Costs</p>
          <SavingsChart breakdown={breakdown} />
        </div>

        {/* Breakdown table */}
        <BreakdownTable breakdown={breakdown} />

        <p className="text-xs text-muted-foreground">
          * Estimates only. Title and attorney fees vary by transaction. Platform fee is a
          placeholder — exact pricing coming soon. Traditional commission assumes 5.5%.
        </p>
      </CardContent>
    </Card>
  );
}
