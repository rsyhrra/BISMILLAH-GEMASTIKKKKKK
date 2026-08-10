'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp, homePath } from '@/lib/app-context';
import type { Role } from '@/lib/db';
import { Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs font-bold text-on-surface-variant">Memuat PILAH.ki...</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({
  allowed,
  children,
}: {
  allowed?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowed && !allowed.includes(user.role)) {
      router.replace(homePath(user.role));
    }
  }, [loading, user, allowed, pathname, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen />;
  if (allowed && !allowed.includes(user.role)) return <LoadingScreen />;

  return <>{children}</>;
}
