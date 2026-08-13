'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp, homePath } from '@/lib/app-context';
import * as db from '@/lib/db';
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

const DEMO_LOGIN: { role: Role; email: string; label: string; name: string; color: string }[] = [
  { role: 'WARGA', email: 'warga1@test.com', label: 'Warga', name: 'Andi Pratama', color: 'bg-emerald-500' },
  { role: 'RT_RW', email: 'rt1@test.com', label: 'Ketua RT', name: 'H. Syamsuddin', color: 'bg-blue-500' },
  { role: 'PENGANGKUT', email: 'driver@test.com', label: 'Pengangkut', name: 'Budi Transport', color: 'bg-amber-500' },
  { role: 'PENGAWAS_TPA', email: 'tpa@test.com', label: 'Pengawas TPA', name: 'Pak Slamet', color: 'bg-indigo-500' },
  { role: 'ADMIN_DLH', email: 'dlh@test.com', label: 'Admin DLH', name: 'Admin DLH', color: 'bg-purple-600' },
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
        setError('Email/NIK atau kata sandi salah. Gunakan tombol demo di bawah untuk mencoba.');
        return;
      }
      const loggedInUser = db.getSessionUser();
      if (loggedInUser) finish(loggedInUser.role);
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
            Aplikasi Pemantauan Kepatuhan Pemilahan Sampah Rumah Tangga Kota Makassar
          </p>
        </div>

        <div className="bg-white text-on-background rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl shadow-emerald-950/40">
          <div className="text-center space-y-1 pb-1">
            <h2 className="font-lexend font-bold text-lg text-on-surface">Selamat Datang</h2>
            <p className="text-xs text-on-surface-variant">
              Masukkan kredensial akun Anda untuk masuk ke sistem
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" /> {error}
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
                  placeholder="warga1@test.com atau NIK"
                  suppressHydrationWarning
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-on-surface placeholder-slate-400 focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-500/20 transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-on-surface">Kata Sandi</label>
                <span className="text-[10px] text-on-surface-variant font-medium">demo: demo123</span>
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
                  suppressHydrationWarning
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
              className="w-full bg-gradient-to-r from-primary-700 to-teal-600 hover:from-primary-600 hover:to-teal-500 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-primary-700/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi Kredensial...
                </>
              ) : (
                <>Masuk ke Aplikasi PILAH.ki</>
              )}
            </button>
          </form>

          {/* DEMO BANNER FOR JUDGES / TESTING */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-on-surface flex items-center gap-1.5">
                ⚡ Uji Coba Demo (1-Klik Login)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                5 Peran Aktor
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_LOGIN.map((d) => (
                <button
                  key={d.role}
                  onClick={() => handleQuick(d.role, d.email)}
                  disabled={loading}
                  className="bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-on-surface p-2.5 rounded-xl flex flex-col items-start transition disabled:opacity-50 text-left group"
                >
                  <div className="flex items-center gap-1.5 font-extrabold text-[11px] text-on-surface group-hover:text-emerald-800">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', d.color)}></span>
                    {d.label}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate w-full mt-0.5">
                    {d.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1 text-center">
            <p className="text-xs text-on-surface-variant">
              Belum punya akun?{' '}
              <Link href="/register" className="text-primary-700 font-bold hover:underline">
                Daftar Mandiri Warga / RT
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
