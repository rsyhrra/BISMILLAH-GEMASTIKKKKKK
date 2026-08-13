'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/page-shell';
import CameraCapture from '@/components/camera-capture';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { cn } from '@/lib/utils';
import { Camera, Leaf, Trash2, Send, ImagePlus, X, AlertCircle } from 'lucide-react';

export default function WargaLaporPage() {
  return (
    <PageShell allowed={['WARGA']}>
      <LaporContent />
    </PageShell>
  );
}

function LaporContent() {
  const { user } = useApp();
  const router = useRouter();
  const { showToast } = useToast();

  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [type, setType] = useState<db.WasteType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, setRefreshKey] = useState(0);

  if (!user) return null;

  const pendingReport = db.getReports(user.id).find((r) => r.status === 'PENDING');
  const hasPending = !!pendingReport;

  const handleCancelPending = () => {
    if (pendingReport) {
      db.deleteReport(pendingReport.id);
      showToast('info', 'Laporan Dibatalkan', 'Laporan Anda sebelumnya telah dibatalkan.');
      setPhoto(null);
      setType(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleSubmit = () => {
    if (hasPending) {
      showToast('warning', 'Laporan Tertunda', 'Selesaikan atau batalkan laporan sebelumnya terlebih dahulu.');
      return;
    }
    if (!photo || !type) {
      showToast('info', 'Lengkapi dulu', 'Ambil foto dan pilih jenis sampah terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    db.addReport(user.id, type, photo);
    setSubmitting(false);
    showToast('success', 'Laporan Terkirim!', '+10 Poin Siri\' na Pacce ditambahkan ke akun Anda.');
    router.push('/warga/dashboard');
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Lapor Pemilahan Sampah</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Foto sampah terpilah lalu tentukan jenisnya. Setiap laporan bernilai <strong className="text-primary-700">+10 Poin</strong>.
        </p>
      </div>

      {/* ALERT LAPORAN PENDING */}
      {hasPending && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-xs text-amber-900">Laporan Sebelumnya Sedang Diverifikasi RT</h3>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Anda memiliki 1 laporan (<strong>{pendingReport.type === 'ORGANIK' ? 'Organik' : 'Anorganik'}</strong>) yang belum diverifikasi oleh Ketua RT. Harap tunggu hingga verifikasi selesai sebelum membuat laporan baru, atau Anda dapat membatalkan laporan tersebut di bawah ini.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelPending}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Batalkan Laporan Ini Agar Bisa Melapor Ulang
          </button>
        </div>
      )}

      {/* STEP 1: FOTO */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-lexend font-bold text-sm text-on-surface flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary-700 text-white text-[11px] font-extrabold flex items-center justify-center">1</span>
            Ambil Foto
          </h3>
          {photo && (
            <button
              onClick={() => setPhoto(null)}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Hapus / Foto Ulang
            </button>
          )}
        </div>

        {photo ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary-200 aspect-[4/3]">
            <img src={photo} alt="Bukti" className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 bg-primary-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Foto Terverifikasi
            </span>
          </div>
        ) : (
          <button
            onClick={() => setCameraOpen(true)}
            className="w-full border-2 border-dashed border-primary-300 bg-primary-50/60 rounded-2xl py-10 flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:bg-primary-50 transition"
          >
            <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-on-surface">Buka Kamera</p>
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <ImagePlus className="w-3 h-3" /> Auto-compress, watermark GPS & waktu
            </p>
          </button>
        )}
      </section>

      {/* STEP 2: JENIS SAMPAH */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 space-y-3">
        <h3 className="font-lexend font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-primary-700 text-white text-[11px] font-extrabold flex items-center justify-center">2</span>
          Pilih Jenis Sampah
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setType('ORGANIK')}
            className={cn(
              'rounded-2xl border-2 p-4 text-center transition',
              type === 'ORGANIK'
                ? 'border-primary-600 bg-primary-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-primary-300'
            )}
          >
            <Leaf className={cn('w-7 h-7 mx-auto mb-1.5', type === 'ORGANIK' ? 'text-primary-600' : 'text-slate-400')} />
            <p className="text-xs font-extrabold text-on-surface">Organik</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Sisa makanan, daun, buah</p>
          </button>
          <button
            onClick={() => setType('ANORGANIK')}
            className={cn(
              'rounded-2xl border-2 p-4 text-center transition',
              type === 'ANORGANIK'
                ? 'border-accent-500 bg-accent-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-accent-300'
            )}
          >
            <Trash2 className={cn('w-7 h-7 mx-auto mb-1.5', type === 'ANORGANIK' ? 'text-accent-600' : 'text-slate-400')} />
            <p className="text-xs font-extrabold text-on-surface">Anorganik</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Plastik, kemasan, botol</p>
          </button>
        </div>
      </section>

      {/* STEP 3: KIRIM */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !photo || !type}
        className={cn(
          'w-full font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition',
          photo && type
            ? 'bg-gradient-to-r from-primary-700 to-teal-600 text-white shadow-lg shadow-primary-700/30 active:scale-[0.98]'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        )}
      >
        <Send className="w-4 h-4" />
        Kirim Laporan Pemilahan (+10 Poin)
      </button>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={setPhoto}
        title={
          type === 'ORGANIK'
            ? 'Foto Sampah Organik'
            : type === 'ANORGANIK'
            ? 'Foto Sampah Residu / Anorganik'
            : 'Foto Sampah Terpilah'
        }
        hint="Posisikan sampah terpilah pada bingkai"
        locationLabel={`Kel. ${user.kelurahan}, RT ${user.rt}`}
      />
    </div>
  );
}
