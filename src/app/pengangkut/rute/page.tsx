'use client';

import React, { useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { cn } from '@/lib/utils';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  MapPin,
  Camera,
  Scale,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import CameraCapture from '@/components/camera-capture';
import { useRouter } from 'next/navigation';

export default function PengangkutRutePage() {
  return (
    <PageShell allowed={['PENGANGKUT']}>
      <RuteContent />
    </PageShell>
  );
}

function RuteContent() {
  const { user } = useApp();
  const { showToast } = useToast();
  const router = useRouter();

  const [selectedRt, setSelectedRt] = useState('Merdeka (RT 01)');
  const [wasteType, setWasteType] = useState<db.WasteType>('ORGANIK');
  const [qcStatus, setQcStatus] = useState<'CLEAN' | 'MIXED'>('CLEAN');
  const [tonnageKg, setTonnageKg] = useState('850');
  const [showCamera, setShowCamera] = useState(false);
  const [qcPhoto, setQcPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCapture = (photoDataUrl: string) => {
    setQcPhoto(photoDataUrl);
    setShowCamera(false);
    showToast('success', 'Foto QC Berhasil', 'Bukti foto kondisi wadah RT telah diambil.');
  };

  const handleGenerateManifest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const manifest = db.createManifest(
      user.full_name,
      'Merdeka',
      '01',
      wasteType,
      qcStatus,
      qcPhoto,
      Number(tonnageKg) || 500
    );

    setSaving(false);

    if (qcStatus === 'MIXED') {
      showToast(
        'info',
        'Laporan Pelanggaran RT Dicatat',
        'Manifesto terbit dengan catatan wadah RT tercampur. Poin kepatuhan RT telah terpotong.'
      );
    } else {
      showToast(
        'success',
        'QR Manifesto Truk Terbit',
        'Manifesto pengangkutan aktif! Tunjukkan QR ini kepada Pengawas TPA.'
      );
    }

    router.push('/pengangkut/manifesto');
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Rute & QC Penjemputan RT</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Inspeksi wadah komunal RT sebelum muat ke truk & terbitkan QR Manifesto Truk
        </p>
      </div>

      {/* DRIVER INFO CARD */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-white/20">
              KODE TRUK: TRUK-04
            </span>
            <span className="bg-emerald-400/20 text-emerald-100 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              AKTIF
            </span>
          </div>
          <p className="font-lexend font-extrabold text-lg">{user?.full_name}</p>
          <p className="text-xs text-amber-100 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Rute Operasional: Kel. Merdeka, Bahari, & Sejahtera
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-200">
          <Truck className="w-6 h-6" />
        </div>
      </div>

      {/* FORM QUALITY CONTROL & MUAT TRUK */}
      <form onSubmit={handleGenerateManifest} className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 space-y-4">
        <h2 className="font-lexend font-bold text-sm text-on-surface flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600" /> Form Inspeksi & Loading Rute
        </h2>

        {/* LOKASI PENJEMPUTAN */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Titik Penjemputan Wadah Komunal RT
          </label>
          <select
            value={selectedRt}
            onChange={(e) => setSelectedRt(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-on-surface font-bold focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="Merdeka (RT 01)">Kel. Merdeka — RT 01 / RW 02 (Skor Kepatuhan: 58%)</option>
            <option value="Bahari (RT 02)">Kel. Bahari — RT 02 / RW 01 (Skor Kepatuhan: 85%)</option>
            <option value="Sejahtera (RT 01)">Kel. Sejahtera — RT 01 / RW 03 (Skor Kepatuhan: 72%)</option>
          </select>
        </div>

        {/* KOMPARTEMEN TRUK */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1.5">
            Kompartemen Sekat Truk yang Diisi
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setWasteType('ORGANIK')}
              className={cn(
                'p-3.5 rounded-2xl border-2 text-left transition',
                wasteType === 'ORGANIK'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-extrabold">🌱 Sekat Organik</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Sisa makanan, dedaunan, & hayati</p>
            </button>

            <button
              type="button"
              onClick={() => setWasteType('ANORGANIK')}
              className={cn(
                'p-3.5 rounded-2xl border-2 text-left transition',
                wasteType === 'ANORGANIK'
                  ? 'border-amber-600 bg-amber-50 text-amber-800 font-extrabold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-extrabold">♻️ Sekat Anorganik / Residu</p>
              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Plastik, kertas, kaleng, & residu</p>
            </button>
          </div>
        </div>

        {/* QC WADAH RT ASSESSMENT */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1.5">
            Hasil QC Kondisi Sampah di Tempat Kumpul RT
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setQcStatus('CLEAN')}
              className={cn(
                'p-3.5 rounded-2xl border-2 text-left transition',
                qcStatus === 'CLEAN'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-extrabold">✅ Terpilah Bersih</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Wadah RT rapi & sesuai sekat</p>
            </button>

            <button
              type="button"
              onClick={() => setQcStatus('MIXED')}
              className={cn(
                'p-3.5 rounded-2xl border-2 text-left transition',
                qcStatus === 'MIXED'
                  ? 'border-rose-600 bg-rose-50 text-rose-800 font-extrabold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-extrabold">⚠️ Wadah RT Tercampur</p>
              <p className="text-[10px] text-rose-600 font-medium mt-0.5">Laporkan pelanggaran pemilahan RT</p>
            </button>
          </div>
        </div>

        {/* FOTO BUKTI QC */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Foto QC Wadah Komunal RT (Wajib)
          </label>
          {qcPhoto ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qcPhoto} alt="QC Foto Wadah RT" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" /> Foto Ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 rounded-2xl py-6 text-center transition flex flex-col items-center justify-center gap-1.5 text-slate-500"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-600">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-on-surface">Ambil Foto Kondisi Wadah RT</p>
              <p className="text-[10px] text-on-surface-variant">Sertakan stempel waktu & tanda lokasi GPS</p>
            </button>
          )}
        </div>

        {/* ESTIMASI TONASE */}
        <div>
          <label className="block text-xs font-bold text-on-surface mb-1">
            Estimasi Berat Muatan (Kg)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <input
              type="number"
              required
              value={tonnageKg}
              onChange={(e) => setTonnageKg(e.target.value)}
              placeholder="Contoh: 850"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-on-surface font-bold focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* ALERT Mix Warning */}
        {qcStatus === 'MIXED' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Peringatan Pelanggaran Wadah RT
            </p>
            <p className="text-[11px] leading-relaxed">
              Dengan menandai sampah tercampur, sistem akan mencatat kelalaian RT ini dan mengecualikan Petugas Pengangkut dari sanksi jika muatan ditolak di TPA.
            </p>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs py-3.5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
        >
          <QrCode className="w-4 h-4" /> Terbitkan QR Manifesto Truk & Brangkat ke TPA <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* CAMERA MODAL */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        title="Inspeksi Foto Wadah RT"
        hint="Posisikan tempat sampah komunal RT di tengah bingkai"
        locationLabel="RT 01 / RW 02 — Kel. Merdeka"
        shutterColor="amber"
      />
    </div>
  );
}
