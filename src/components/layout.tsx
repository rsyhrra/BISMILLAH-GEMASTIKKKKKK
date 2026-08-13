'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/db';
import {
  Home,
  Camera,
  History,
  ClipboardCheck,
  AlertTriangle,
  LayoutDashboard,
  Map,
  ClipboardList,
  Bell,
  LogOut,
  Truck,
  QrCode,
  ScanLine,
  Scale,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  WARGA: [
    { href: '/warga/dashboard', label: 'Beranda', icon: Home },
    { href: '/warga/lapor', label: 'Lapor', icon: Camera },
    { href: '/warga/riwayat', label: 'Riwayat', icon: History },
  ],
  RT_RW: [
    { href: '/rt/sampling', label: 'Sampling', icon: ClipboardCheck },
    { href: '/rt/riwayat', label: 'Riwayat', icon: History },
    { href: '/rt/anomali', label: 'Anomali', icon: AlertTriangle },
  ],
  ADMIN_DLH: [
    { href: '/dlh/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/dlh/peta', label: 'Peta Risiko', icon: Map },
    { href: '/dlh/intervensi', label: 'Intervensi', icon: ClipboardList },
  ],
  PENGANGKUT: [
    { href: '/pengangkut/rute', label: 'Rute RT', icon: Truck },
    { href: '/pengangkut/manifesto', label: 'Manifesto', icon: QrCode },
  ],
  PENGAWAS_TPA: [
    { href: '/tpa/scan', label: 'Inspeksi TPA', icon: ScanLine },
    { href: '/tpa/riwayat', label: 'Audit Tonase', icon: Scale },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  WARGA: 'Warga',
  RT_RW: 'Ketua RT',
  ADMIN_DLH: 'Admin DLH',
  PENGANGKUT: 'Petugas Pengangkut',
  PENGAWAS_TPA: 'Pengawas TPA',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, notifCount } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  const nav = NAV_BY_ROLE[user.role] ?? [];
  const navWithNotif: NavItem[] = [
    ...nav,
    { href: '/notifikasi', label: 'Notifikasi', icon: Bell },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans bg-weave-pattern">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href={nav[0]?.href ?? '/login'} className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-primary-700 text-white flex items-center justify-center font-lexend font-black text-sm shadow-md shadow-primary-700/30">
              P
            </span>
            <span className="font-lexend font-extrabold text-base tracking-tight text-primary-700">
              PILAH<span className="text-on-background">.ki</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-primary-50 border border-primary-200 text-primary-700 text-[11px] font-bold px-2.5 py-1 rounded-full mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
              {ROLE_LABEL[user.role]}
            </span>

            <Link
              href="/notifikasi"
              className="relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-on-surface-variant flex items-center justify-center transition border border-slate-200"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                  {notifCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white text-on-surface-variant flex items-center justify-center transition border border-slate-200"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-6 px-4">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-20 self-start py-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary-700 text-white flex items-center justify-center font-lexend font-extrabold text-base shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-lexend font-bold text-xs text-on-surface truncate">{user.full_name}</p>
                <p className="text-[10px] text-on-surface-variant font-semibold truncate">
                  {user.kelurahan}, RT {user.rt}/{user.rw}
                </p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navWithNotif.map((item) => {
                const active =
                  pathname === item.href || (item.href !== '/notifikasi' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition',
                      active
                        ? 'bg-primary-700 text-white shadow-md shadow-primary-700/25'
                        : 'text-on-surface-variant hover:bg-primary-50 hover:text-primary-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.href === '/notifikasi' && notifCount > 0 && (
                      <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {notifCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 min-w-0 py-6 pb-32 lg:pb-10">{children}</main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 pb-safe shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        <div
          className="max-w-md mx-auto grid gap-1 items-center"
          style={{ gridTemplateColumns: `repeat(${navWithNotif.length}, minmax(0, 1fr))` }}
        >
          {navWithNotif.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 py-2 transition',
                  active ? 'text-primary-700 font-extrabold' : 'text-slate-400 font-medium hover:text-slate-600'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center transition',
                    active ? 'bg-primary-700 text-white shadow-md shadow-primary-700/25 scale-105' : 'bg-transparent text-slate-400'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] tracking-tight">{item.label}</span>
                {item.href === '/notifikasi' && notifCount > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                    {notifCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
