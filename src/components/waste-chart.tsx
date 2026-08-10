'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

function ClientOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback ?? <div className="h-40" />}</>;
  return <>{children}</>;
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'Inter',
  boxShadow: '0 8px 24px -12px rgba(15,23,42,0.18)',
};

export function WeekBarChart({ data }: { data: { day: string; laporan: number }[] }) {
  return (
    <ClientOnly fallback={<div className="h-40 bg-slate-50 rounded-xl animate-pulse" />}>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fontWeight: 600, fill: '#3f4d44' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#3f4d44' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: '#f0fdf4' }} contentStyle={tooltipStyle} />
            <Bar dataKey="laporan" name="Laporan" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}

export function TrendAreaChart({ data }: { data: { week: string; rate: number }[] }) {
  return (
    <ClientOnly fallback={<div className="h-56 bg-slate-50 rounded-xl animate-pulse" />}>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fontWeight: 600, fill: '#3f4d44' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#3f4d44' }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Kepatuhan']} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#15803d"
              strokeWidth={2.5}
              fill="url(#trendFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}
