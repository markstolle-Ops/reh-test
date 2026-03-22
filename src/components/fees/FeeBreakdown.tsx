"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStateInfo } from "@/lib/states";
import type { TransactionFees } from "@/services/fees/transaction-fees";
import { calculateTransactionFees } from "@/services/fees/transaction-fees";
import type { LaunchState } from "@/types";

// ─── Exported utilities (used by tests and other components) ──────────────────

/**
 * Returns true if an attorney fee should be shown for the given TransactionFees object.
 * Attorney fees apply to attorney-required (GA, NC) and customary-attorney (NY, IL) states.
 */
export function shouldShowAttorneyFee(fees: TransactionFees): boolean {
  return fees.attorneyFee > 0;
}

/**
 * Returns true if an agent-for-hire fee should be shown for the given TransactionFees object.
 * Agent fees apply to attorney-required (GA, NC) and customary-attorney (NY, IL) states.
 */
export function shouldShowAgentForHireFee(fees: TransactionFees): boolean {
  return fees.agentForHireFee > 0;
}

/**
 * Formats a cent value to a dollar string with $ prefix and commas.
 * e.g. 250000 → "$2,500.00"
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FeeBreakdownProps {
  /** Home price in cents */
  homePrice: number;
  /** Two-letter launch state code */
  state: LaunchState;
}

interface FeeRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

function FeeRow({ label, value, className = "" }: FeeRowProps) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Displays a full fee breakdown for a listing, comparing platform costs
 * to traditional agent commission. State-aware: attorney fees only shown
 * for attorney-required and customary-attorney states.
 *
 * Used on listing detail pages (COST-03, COST-04).
 */
export function FeeBreakdown({ homePrice, state }: FeeBreakdownProps) {
  const fees = calculateTransactionFees(homePrice, state);
  const stateInfo = getStateInfo(state);
  const showAttorney = shouldShowAttorneyFee(fees);

  // Determine attorney fee label note
  let attorneyNote = "";
  if (stateInfo.closingType === "attorney-required") {
    attorneyNote = `(required in ${state})`;
  } else if (stateInfo.closingType === "customary-attorney") {
    attorneyNote = `(customary in ${state})`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <FeeRow label="Platform Fee" value={formatCents(fees.platformFee)} />
        <FeeRow label="Title Company Fee" value={formatCents(fees.titleFee)} />

        {showAttorney && (
          <FeeRow
            label={
              <span>
                Attorney Fee <span className="text-xs text-muted-foreground">{attorneyNote}</span>
              </span>
            }
            value={formatCents(fees.attorneyFee)}
          />
        )}

        <FeeRow label="Flat-Fee MLS Listing" value={formatCents(fees.mlsSyndicationFee)} />

        {fees.agentForHireFee > 0 && (
          <FeeRow
            label={
              <span>
                Agent-for-Hire Fee{" "}
                <span className="text-xs text-muted-foreground">
                  (licensed agent closing support)
                </span>
              </span>
            }
            value={formatCents(fees.agentForHireFee)}
          />
        )}

        <Separator className="my-2" />

        <FeeRow
          label={<span className="font-semibold text-foreground">Total Platform Fees</span>}
          value={<span className="font-bold">{formatCents(fees.totalFees)}</span>}
        />

        <FeeRow
          label="Traditional Agent Commission (5.5%)"
          value={
            <span className="line-through text-destructive">
              {formatCents(fees.traditionalCommission)}
            </span>
          }
        />

        <FeeRow
          label={<span className="font-semibold text-foreground">Your Savings</span>}
          value={
            <span className="font-bold text-green-600 dark:text-green-400">
              {formatCents(fees.savings)}
            </span>
          }
        />

        <p className="text-xs text-muted-foreground pt-3 border-t mt-2">
          Fees are estimates and may vary. Title company fees depend on your chosen provider.
        </p>
      </CardContent>
    </Card>
  );
}
