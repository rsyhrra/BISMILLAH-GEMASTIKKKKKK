'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionUser, homePath } from '@/lib/db';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getSessionUser();
    router.replace(user ? homePath(user.role) : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs font-bold text-on-surface-variant">Mengalihkan ke PILAH.ki...</p>
      </div>
    </div>
  );
}
