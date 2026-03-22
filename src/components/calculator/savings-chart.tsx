"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CommissionBreakdown } from "@/types";

interface SavingsChartProps {
  breakdown: CommissionBreakdown;
}

function formatDollar(value: number): string {
  return `$${value.toLocaleString()}`;
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

export function SavingsChart({ breakdown }: SavingsChartProps) {
  const data = [
    {
      name: "Traditional Agent",
      total: breakdown.totalWithAgent,
      fill: "#ef4444",
    },
    {
      name: "RealEstateHunter",
      total: breakdown.totalWithPlatform,
      fill: "#22c55e",
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value) => [formatDollar(Number(value)), "Total Cost"]}
          cursor={{ fill: "rgba(0,0,0,0.05)" }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
