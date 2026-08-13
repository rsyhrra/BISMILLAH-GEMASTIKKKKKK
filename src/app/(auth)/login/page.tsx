'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp, homePath } from '@/lib/app-context';
import type { Role } from '@/lib/db';
import { cn } from '@/lib/utils';
import { User, House, Building2, Lock, Eye, EyeOff, ShieldCheck, Loader2, Truck, Scale } from 'lucide-react';

const ROLE_OPTIONS: { role: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  { role: 'WARGA', label: 'Warga', desc: 'Lapor & poin', icon: <User className="w-4 h-4" /> },
  { role: 'RT_RW', label: 'Ketua RT', desc: 'Sampling & anomali', icon: <House className="w-4 h-4" /> },
  { role: 'PENGANGKUT', label: 'Pengangkut', desc: 'QC Rute & Manifesto', icon: <Truck className="w-4 h-4" /> },
  { role: 'PENGAWAS_TPA', label: 'Pengawas TPA', desc: 'Scan & Gate TPA', icon: <Scale className="w-4 h-4" /> },
  { role: 'ADMIN_DLH', label: 'Admin DLH', desc: 'Dashboard & intervensi', icon: <Building2 className="w-4 h-4" /> },
];

const DEMO_LOGIN: { role: Role; email: string; label: string; color: string }[] = [
  { role: 'WARGA', email: 'warga1@test.com', label: 'Warga', color: 'bg-emerald-500' },
  { role: 'RT_RW', email: 'rt1@test.com', label: 'Ketua RT', color: 'bg-blue-500' },
  { role: 'PENGANGKUT', email: 'driver@test.com', label: 'Pengangkut', color: 'bg-amber-500' },
  { role: 'PENGAWAS_TPA', email: 'tpa@test.com', label: 'Pengawas TPA', color: 'bg-indigo-500' },
  { role: 'ADMIN_DLH', email: 'dlh@test.com', label: 'Admin DLH', color: 'bg-purple-600' },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary-700 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useApp();

  const [role, setRole] = useState<Role>('WARGA');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finish = (r: Role) => {
    const from = searchParams.get('from');
    router.push(from || homePath(r));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const ok = login(identifier, password);
      setLoading(false);
      if (!ok) {
        setError('Email atau kata sandi salah. Gunakan akun demo di bawah untuk simulasi.');
        return;
      }
      finish(role);
    }, 500);
  };

  const handleQuick = (demoRole: Role, email: string) => {
    setLoading(true);
    setTimeout(() => {
      login(email, 'demo123');
      setLoading(false);
      finish(demoRole);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-emerald-700 to-teal-800 text-white flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-weave-pattern opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6 my-auto">
        {/* BRANDING */}
        <div className="text-center space-y-2">
          <h1 className="font-lexend text-4xl font-extrabold tracking-tight">
            PILAH<span className="text-white/80">.ki</span>
          </h1>
          <p className="text-white/80 text-xs font-medium max-w-xs mx-auto">
            PWA Pemantauan Kepatuhan Pemilahan Sampah Rumah Tangga Kota Makassar
          </p>
        </div>

        <div className="bg-white text-on-background rounded-3xl p-6 space-y-5 shadow-2xl shadow-emerald-950/40">
          {/* ROLE PICKER */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Masuk sebagai
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setRole(opt.role)}
                  className={cn(
                    'rounded-2xl border-2 p-3 text-center transition',
                    role === opt.role
                      ? 'border-primary-700 bg-primary-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-primary-300'
                  )}
                >
                  <div
                    className={cn(
                      'mx-auto mb-1.5 flex items-center justify-center',
                      role === opt.role ? 'text-primary-700' : 'text-slate-400'
                    )}
                  >
                    {opt.icon}
                  </div>
                  <p className="text-xs font-extrabold text-on-surface">{opt.label}</p>
                  <p className="text-[9px] text-on-surface-variant mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-red-500" /> {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-on-surface">Email / NIK</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="warga1@test.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-on-surface placeholder-slate-400 focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-500/20 transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-on-surface">Kata Sandi</label>
                <span className="text-[10px] text-on-surface-variant font-medium">password: demo123</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs text-on-surface placeholder-slate-400 focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-500/20 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-700 to-teal-600 hover:from-primary-600 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-primary-700/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...
                </>
              ) : (
                <>Masuk ke {ROLE_OPTIONS.find((o) => o.role === role)?.label}</>
              )}
            </button>
          </form>

          {/* DEMO BANNER */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="bg-accent-50 border border-accent-200 text-accent-800 text-[11px] px-3 py-2.5 rounded-xl flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-accent-600 shrink-0" />
              Mode demo aktif — klik peran untuk login cepat
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
              {DEMO_LOGIN.map((d) => (
                <button
                  key={d.role}
                  onClick={() => handleQuick(d.role, d.email)}
                  disabled={loading}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-on-surface py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <span className={cn('w-2 h-2 rounded-full', d.color)}></span>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1 text-center">
            <p className="text-xs text-on-surface-variant">
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary-700 font-bold hover:underline">
                Daftar Mandiri
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/70 font-medium">
          Dinas Lingkungan Hidup Kota Makassar &copy; 2026
        </p>
      </div>
    </div>
  );
}
