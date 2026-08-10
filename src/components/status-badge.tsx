'use client';

import { cn } from '@/lib/utils';
import { Check, X, Minus, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

type Variant = 'patuh' | 'tidak' | 'belum' | 'anomali' | 'selesai' | 'tengah';

const CONFIG: Record<
  Variant,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  patuh: {
    label: 'Patuh',
    cls: 'bg-primary-50 text-primary-700 border-primary-200',
    icon: <Check className="w-3 h-3" />,
  },
  tidak: {
    label: 'Tidak Patuh',
    cls: 'bg-red-50 text-red-700 border-red-200',
    icon: <X className="w-3 h-3" />,
  },
  belum: {
    label: 'Belum Lapor',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <Minus className="w-3 h-3" />,
  },
  anomali: {
    label: 'Anomali',
    cls: 'bg-accent-50 text-accent-700 border-accent-200',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  selesai: {
    label: 'Selesai',
    cls: 'bg-primary-50 text-primary-700 border-primary-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  tengah: {
    label: 'Sedang Berjalan',
    cls: 'bg-accent-50 text-accent-700 border-accent-200',
    icon: <Clock3 className="w-3 h-3" />,
  },
};

export default function StatusBadge({
  variant,
  label,
  size = 'sm',
  className,
}: {
  variant: Variant;
  label?: string;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const cfg = CONFIG[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border rounded-full font-bold whitespace-nowrap',
        size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
        cfg.cls,
        className
      )}
    >
      {cfg.icon}
      {label ?? cfg.label}
    </span>
  );
}
