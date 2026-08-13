'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import CameraCapture from '@/components/camera-capture';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { cn, timeAgo } from '@/lib/utils';
import { RefreshCw, MapPin, Check, X, Camera, Loader2 } from 'lucide-react';

export default function RtSamplingPage() {
  return (
    <PageShell allowed={['RT_RW']}>
      <SamplingContent />
    </PageShell>
  );
}

function SamplingContent() {
  const { user } = useApp();
  const { showToast } = useToast();

  const [wargaList, setWargaList] = useState<db.DemoUser[]>([]);
  const [reportsByCitizen, setReportsByCitizen] = useState<Record<string, db.Report[]>>({});
  const [samplingByCitizen, setSamplingByCitizen] = useState<Record<string, db.SamplingRecord | null>>({});

  const [active, setActive] = useState<{ citizen: db.DemoUser; status: db.SamplingStatus } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user) return;
    const warga = db.getWargaOfRT(user.rt_code);
    setWargaList(warga);
    const reports: Record<string, db.Report[]> = {};
    const sampling: Record<string, db.SamplingRecord | null> = {};
    warga.forEach((w) => {
      reports[w.id] = db.getReports(w.id);
      sampling[w.id] = db.getLatestSampling(w.id);
    });
    setReportsByCitizen(reports);
    setSamplingByCitizen(sampling);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const requestGPS = () => {
    setGpsStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          });
          setGpsStatus('ok');
        },
        () => setGpsStatus('fail'),
        { timeout: 8000 }
      );
    } else {
      setGpsStatus('fail');
    }
  };

  const handlePick = (citizen: db.DemoUser, status: db.SamplingStatus) => {
    setActive({ citizen, status });
    setPhoto(null);
    setCameraOpen(true);
  };

  const handleCapture = (dataUrl: string) => {
    setPhoto(dataUrl);
    setCameraOpen(false);
    setConfirmOpen(true);
    requestGPS();
  };

  const handleSave = () => {
    if (!active || !user) return;
    let lat = coords?.lat ?? null;
    let lng = coords?.lng ?? null;
    if ((lat === null || lng === null) && manualLat && manualLng) {
      lat = Number(manualLat);
      lng = Number(manualLng);
    }
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      showToast('error', 'Lokasi Diperlukan', 'Izinkan akses GPS atau masukkan koordinat secara manual.');
      return;
    }

    setSaving(true);
    const result = db.addSampling(user.id, active.citizen.id, active.status, photo, lat, lng);
    setSaving(false);
    setConfirmOpen(false);
    setActive(null);
    load();

    if (result.anomaly) {
      showToast(
        'konflik',
        'Anomali Terdeteksi!',
        `${active.citizen.full_name} melapor patuh namun sampling RT menyatakan ${active.status === 'PATUH' ? 'patuh' : 'tidak patuh'}. Konflik dibuat.`
      );
    } else {
      showToast(
        'success',
        'Data Sampling Disimpan',
        `${active.citizen.full_name} tercatat ${active.status === 'PATUH' ? 'PATUH' : 'TIDAK PATUH'}${active.status === 'PATUH' ? ' (+5 poin)' : ''}.`
      );
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-lexend font-extrabold text-xl text-on-surface">Pendataan Mingguan RT</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kel. {user.kelurahan} • RT {user.rt} — sampling foto + GPS per KK
          </p>
        </div>
        <button
          onClick={load}
          className="bg-white border border-slate-200/80 shadow-card hover:shadow-card-lg text-on-surface-variant w-10 h-10 rounded-xl flex items-center justify-center transition"
          title="Muat ulang data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KARTU WARGA */}
      <div className="space-y-3">
        {wargaList.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
            <p className="text-sm font-bold text-on-surface">Tidak ada warga terdaftar di RT Anda</p>
          </div>
        )}

        {wargaList.map((w, idx) => {
          const reports = reportsByCitizen[w.id] ?? [];
          const lastReport = reports[0] ?? null;
          const lastSampling = samplingByCitizen[w.id] ?? null;
          const points = db.computePoints(w.id);

          return (
            <div
              key={w.id}
              className={cn(
                'bg-white rounded-2xl border p-4 space-y-3 transition',
                lastReport?.status === 'PENDING'
                  ? 'border-amber-300 bg-amber-50/20 shadow-md'
                  : 'border-slate-200/80 shadow-card'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-lexend font-extrabold text-sm shrink-0 border border-primary-100">
                    {w.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-lexend font-extrabold text-sm text-on-surface truncate">{w.full_name}</p>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                        {w.email}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      NIK: {w.nik} • {points} Pts
                    </p>
                  </div>
                </div>
                <StatusBadge
                  variant={lastSampling ? (lastSampling.status === 'PATUH' ? 'patuh' : 'tidak') : 'belum'}
                  label={lastSampling ? (lastSampling.status === 'PATUH' ? 'Patuh' : 'Tidak Patuh') : 'Belum Disampling'}
                  className="shrink-0"
                />
              </div>

              {/* BUKTI FOTO LAPORAN MANDIRI WARGA */}
              {lastReport ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {lastReport.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lastReport.photo}
                        alt="Foto Laporan Warga"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg shrink-0">
                        {lastReport.type === 'ORGANIK' ? '🌱' : '♻️'}
                      </div>
                    )}
                    <div className="text-xs min-w-0">
                      <p className="font-extrabold text-on-surface flex items-center gap-1.5 flex-wrap">
                        Laporan Mandiri: {lastReport.type === 'ORGANIK' ? 'Organik' : 'Anorganik'}
                        {lastReport.status === 'PENDING' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                            Menunggu Verifikasi RT
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        Dikirim: {timeAgo(lastReport.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-on-surface-variant font-medium">
                  Belum mengirim laporan pemilahan mandiri
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handlePick(w, 'PATUH')}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" /> Patuh
                </button>
                <button
                  onClick={() => handlePick(w, 'TIDAK')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold py-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <X className="w-4 h-4" /> Tidak Patuh
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CAMERA */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setActive(null);
        }}
        onCapture={handleCapture}
        title={`Foto Bukti ${active?.status === 'PATUH' ? 'Patuh' : 'Tidak Patuh'}`}
        hint="Dokumentasikan kondisi pemilahan sampah KK"
        locationLabel={active ? `Kel. ${active.citizen.kelurahan}` : undefined}
        shutterColor={active?.status === 'PATUH' ? 'emerald' : 'amber'}
      />

      {/* KONFIRMASI */}
      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setActive(null);
        }}
        title="Konfirmasi Data Sampling"
        subtitle={
          active
            ? `${active.citizen.full_name} — ${active.status === 'PATUH' ? 'PATUH' : 'TIDAK PATUH'}`
            : undefined
        }
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                setConfirmOpen(false);
                setActive(null);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold px-4 py-3 rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary-700 hover:bg-primary-600 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Simpan & Selesaikan
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {photo && (
            <div className="rounded-2xl overflow-hidden border-2 border-slate-200 aspect-[4/3]">
              <img src={photo} alt="Bukti" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Lokasi GPS</span>
              {gpsStatus === 'loading' && (
                <span className="flex items-center gap-1.5 text-on-surface-variant font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mendeteksi...
                </span>
              )}
              {gpsStatus === 'ok' && coords && (
                <span className="font-mono font-bold text-primary-700">
                  {coords.lat}, {coords.lng}
                </span>
              )}
              {gpsStatus === 'fail' && (
                <button onClick={requestGPS} className="text-primary-700 font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Coba Lagi
                </button>
              )}
              {gpsStatus === 'idle' && (
                <button onClick={requestGPS} className="text-primary-700 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Ambil GPS
                </button>
              )}
            </div>

            {gpsStatus === 'fail' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="Latitude"
                  inputMode="decimal"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-600"
                />
                <input
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="Longitude"
                  inputMode="decimal"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-600"
                />
              </div>
            )}
          </div>

          <div
            className={cn(
              'rounded-2xl border p-3 text-xs font-bold flex items-center gap-2',
              active?.status === 'PATUH'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}
          >
            {active?.status === 'PATUH' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            Hasil sampling: {active?.status === 'PATUH' ? 'PATUH (+5 poin warga)' : 'TIDAK PATUH'}
          </div>
        </div>
      </Modal>
    </div>
  );
}
