'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, House, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'WARGA' | 'RT_RW'>('WARGA');
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Location Fields
  const [kecamatan, setKecamatan] = useState('Manggala');
  const [kelurahan, setKelurahan] = useState('Merdeka');
  const [rt, setRt] = useState('01');
  const [rw, setRw] = useState('02');
  const [rtCode, setRtCode] = useState('MKS-MRD-001');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 1400);
    }, 800);
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder-slate-400 focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-500/20 transition';

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans py-12 bg-weave-pattern">
      <div className="w-full max-w-lg z-10">
        {/* BRANDING */}
        <div className="text-center mb-6">
          <h1 className="font-lexend text-3xl font-extrabold tracking-tight text-primary-700">
            Pendaftaran <span className="text-on-background">PILAH.ki</span>
          </h1>
          <p className="text-on-surface-variant text-xs mt-1">
            Pendaftaran mandiri Warga & Pengurus RT/RW Kota Makassar
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-card-lg">
          {/* ROLE SELECTOR */}
          <div className="mb-6 space-y-2.5">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
              Pilih Jenis Akun Pendaftaran Mandiri
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('WARGA')}
                className={cn(
                  'py-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 border-2',
                  role === 'WARGA'
                    ? 'bg-primary-50 border-primary-700 text-primary-700 shadow-md'
                    : 'bg-white border-slate-200 text-on-surface-variant hover:border-primary-300'
                )}
              >
                <User className="w-4 h-4" /> Akun Warga
              </button>
              <button
                type="button"
                onClick={() => setRole('RT_RW')}
                className={cn(
                  'py-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 border-2',
                  role === 'RT_RW'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md'
                    : 'bg-white border-slate-200 text-on-surface-variant hover:border-blue-300'
                )}
              >
                <House className="w-4 h-4" /> Akun RT / RW
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-[11px] text-slate-500 leading-tight">
              💡 <span className="font-semibold">Catatan Kedinasan:</span> Akun untuk <span className="font-bold text-slate-700">Pengangkut Armada, Pengawas TPA, & Admin DLH</span> diterbitkan resmi oleh DLH Kota Makassar.
            </div>
          </div>

          {success ? (
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-primary-700 text-white rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-lexend text-base font-bold text-primary-800">Pendaftaran Berhasil!</h3>
              <p className="text-xs text-on-surface-variant">
                Akun {role === 'WARGA' ? 'Warga' : 'RT/RW'} atas nama{' '}
                <span className="font-bold text-on-surface">{fullName}</span> telah terdaftar. Mengalihkan ke halaman masuk...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" suppressHydrationWarning>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Muhammad Ahmad"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="737101xxxxxx0001"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">No. WhatsApp / HP</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* LOKASI */}
              {role === 'WARGA' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Kecamatan</label>
                      <select
                        value={kecamatan}
                        onChange={(e) => setKecamatan(e.target.value)}
                        className={inputCls}
                      >
                        <option>Manggala</option>
                        <option>Panakkukang</option>
                        <option>Tamalate</option>
                        <option>Rappocini</option>
                        <option>Biringkanaya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Kelurahan</label>
                      <select
                        value={kelurahan}
                        onChange={(e) => setKelurahan(e.target.value)}
                        className={inputCls}
                      >
                        <option>Merdeka</option>
                        <option>Bahari</option>
                        <option>Sejahtera</option>
                        <option>Hijau</option>
                        <option>Makmur</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">RT</label>
                      <input type="text" value={rt} onChange={(e) => setRt(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">RW</label>
                      <input type="text" value={rw} onChange={(e) => setRw(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Kode Unik RT</label>
                      <input
                        type="text"
                        value={rtCode}
                        onChange={(e) => setRtCode(e.target.value)}
                        placeholder="MKS-MRD-001"
                        className={cn(inputCls, 'text-primary-700 font-bold font-mono')}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Kecamatan</label>
                    <input type="text" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Kelurahan</label>
                    <input type="text" value={kelurahan} onChange={(e) => setKelurahan(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Kode RT</label>
                    <input
                      type="text"
                      value={rtCode}
                      onChange={(e) => setRtCode(e.target.value)}
                      placeholder="MKS-MRD-001"
                      className={cn(inputCls, 'text-blue-700 font-bold font-mono')}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className={inputCls}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-700 hover:bg-primary-600 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-primary-700/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses Registrasi...
                  </>
                ) : (
                  <>
                    Daftarkan Akun PILAH.ki <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* NOTICE */}
          <div className="mt-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-on-surface-variant space-y-1">
            <p className="font-bold text-on-surface flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary-700" /> Akun Petugas DLH:
            </p>
            <p className="text-[11px] leading-relaxed">
              Admin & Kader DLH tidak mendaftar publik. Akun internal dibuat langsung oleh Dinas Lingkungan Hidup Kota Makassar.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-on-surface-variant">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-primary-700 font-bold hover:underline">
                Masuk Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
