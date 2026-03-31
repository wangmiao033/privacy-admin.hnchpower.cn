"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/visit-stats";

type Props = {
  data: DailyPoint[];
};

export function DashboardTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.day.slice(5),
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#18181b" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              fontSize: 12,
            }}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { day?: string } | undefined;
              return p?.day ?? "";
            }}
          />
          <Area
            type="monotone"
            dataKey="pv"
            name="PV"
            stroke="#18181b"
            strokeWidth={2}
            fill="url(#fillPv)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
