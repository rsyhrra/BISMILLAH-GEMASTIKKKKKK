'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'konflik';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastState {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastState | null>(null);

const STYLES: Record<ToastType, { icon: React.ReactNode; accent: string; iconColor: string }> = {
  success: { icon: <CheckCircle2 className="w-5 h-5" />, accent: 'border-l-primary-600', iconColor: 'text-primary-600' },
  error: { icon: <XCircle className="w-5 h-5" />, accent: 'border-l-red-600', iconColor: 'text-red-600' },
  info: { icon: <Info className="w-5 h-5" />, accent: 'border-l-sky-600', iconColor: 'text-sky-600' },
  konflik: { icon: <AlertTriangle className="w-5 h-5" />, accent: 'border-l-accent-600', iconColor: 'text-accent-600' },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => {
          const style = STYLES[t.type];
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={cn(
                'pointer-events-auto w-full max-w-sm bg-white rounded-2xl border border-slate-200 border-l-4 shadow-card-lg px-4 py-3 flex items-start gap-3 animate-toast-in cursor-pointer',
                style.accent
              )}
            >
              <span className={cn('mt-0.5 shrink-0', style.iconColor)}>{style.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-on-surface">{t.title}</p>
                {t.message && <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{t.message}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
