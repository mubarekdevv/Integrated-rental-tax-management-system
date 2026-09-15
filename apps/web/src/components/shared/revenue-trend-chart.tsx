"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function RevenueTrendChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={70} tickFormatter={(v: number) => v.toLocaleString()} />
        <Tooltip formatter={(value: unknown) => `${Number(value).toLocaleString()} ETB`} />
        <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
