"use client";

import type { CommissionBreakdown } from "@/types";
import { Separator } from "@/components/ui/separator";
import { COMMISSION_RATE_DEFAULT } from "@/lib/constants";

interface BreakdownTableProps {
  breakdown: CommissionBreakdown;
}

function fmt(value: number): string {
  return `$${value.toLocaleString()}`;
}

const commissionPct = `${(COMMISSION_RATE_DEFAULT * 100).toFixed(1)}%`;

export function BreakdownTable({ breakdown }: BreakdownTableProps) {
  const { traditionalCommission, platformFee, titleFee, attorneyFee, totalWithAgent, totalWithPlatform, savings } =
    breakdown;

  const hasAttorney = attorneyFee > 0;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2 pr-4 text-left font-semibold text-muted-foreground">Line Item</th>
            <th className="py-2 px-4 text-right font-semibold">Traditional Agent</th>
            <th className="py-2 pl-4 text-right font-semibold">RealEstateHunter</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <tr>
            <td className="py-2 pr-4 text-muted-foreground">
              Agent Commission ({commissionPct})
            </td>
            <td className="py-2 px-4 text-right">{fmt(traditionalCommission)}</td>
            <td className="py-2 pl-4 text-right text-muted-foreground">—</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-muted-foreground">
              Platform Fee
              <span className="ml-1 text-xs text-muted-foreground">(approximate — exact pricing coming soon)</span>
            </td>
            <td className="py-2 px-4 text-right text-muted-foreground">—</td>
            <td className="py-2 pl-4 text-right">{fmt(platformFee)}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-muted-foreground">Title / Escrow Fees</td>
            <td className="py-2 px-4 text-right">{fmt(titleFee)}</td>
            <td className="py-2 pl-4 text-right">{fmt(titleFee)}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 text-muted-foreground">Attorney Fee</td>
            <td className="py-2 px-4 text-right">{hasAttorney ? fmt(attorneyFee) : "N/A"}</td>
            <td className="py-2 pl-4 text-right">{hasAttorney ? fmt(attorneyFee) : "N/A"}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t">
            <td className="py-2 pr-4 font-bold">Total</td>
            <td className="py-2 px-4 text-right font-bold">{fmt(totalWithAgent)}</td>
            <td className="py-2 pl-4 text-right font-bold">{fmt(totalWithPlatform)}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4" />
            <td colSpan={2} className="py-2 pl-4 text-right">
              <span className="inline-block rounded bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                Your Savings: {fmt(savings)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
      <Separator className="mt-4" />
    </div>
  );
}
