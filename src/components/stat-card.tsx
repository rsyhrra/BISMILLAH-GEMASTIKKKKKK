'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type Tone = 'green' | 'blue' | 'amber' | 'red';

const TONES: Record<Tone, { iconBg: string; bar: string; value: string }> = {
  green: { iconBg: 'bg-primary-50 text-primary-700', bar: 'bg-primary-600', value: 'text-primary-700' },
  blue: { iconBg: 'bg-sky-50 text-sky-700', bar: 'bg-sky-600', value: 'text-sky-700' },
  amber: { iconBg: 'bg-accent-50 text-accent-700', bar: 'bg-accent-500', value: 'text-accent-700' },
  red: { iconBg: 'bg-red-50 text-red-700', bar: 'bg-red-500', value: 'text-red-600' },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'green',
  progress,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  progress?: number;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-lg transition',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider leading-tight pr-2">
          {label}
        </span>
        <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', t.iconBg)}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
      </div>
      <p className={cn('font-lexend text-2xl font-extrabold leading-tight', t.value)}>{value}</p>
      {sub && <p className="text-[11px] text-on-surface-variant mt-1">{sub}</p>}
      {typeof progress === 'number' && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', t.bar)}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
