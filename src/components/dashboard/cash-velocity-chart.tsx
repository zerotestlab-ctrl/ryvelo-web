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

import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CashVelocityPoint = { day: string; amount: number };

type Props = {
  data: CashVelocityPoint[];
  className?: string;
};

export function CashVelocityChart({ data, className }: Props) {
  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm shadow-black/20",
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Cash velocity</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Last 7 days · recovered cash by resolution date (UTC)
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cashVelocityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(176 100% 42%)"
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(176 100% 42%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/80"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`
                }
                width={44}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as CashVelocityPoint;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <div className="font-medium text-foreground">{label}</div>
                      <div className="mt-0.5 tabular-nums text-accent">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        }).format(row.amount)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(176 100% 42%)"
                strokeWidth={2}
                fill="url(#cashVelocityFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 0,
                  fill: "hsl(176 100% 42%)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
