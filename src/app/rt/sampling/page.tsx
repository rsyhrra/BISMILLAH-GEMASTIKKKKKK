'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import CameraCapture from '@/components/camera-capture';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { cn, timeAgo, formatDateTime } from '@/lib/utils';
import { RefreshCw, MapPin, Check, X, Camera, Loader2, Eye, Leaf, Trash2, Clock, Info, ShieldCheck } from 'lucide-react';

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
  const [viewingReport, setViewingReport] = useState<{ citizen: db.DemoUser; report: db.Report } | null>(null);
  
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
      // In sampling view, only show PENDING reports requiring action!
      reports[w.id] = db.getReports(w.id).filter((r) => r.status === 'PENDING');
      sampling[w.id] = db.getLatestSampling(w.id);
    });
    setReportsByCitizen(reports);
    setSamplingByCitizen(sampling);
  };

  const handleVerifySingleReport = (citizen: db.DemoUser, report: db.Report, approved: boolean) => {
    if (!user) return;
    try {
      const res = db.verifySingleReport(report.id, approved, user.id);
      load();
      if (res.anomaly) {
        showToast(
          'warning',
          'Ditolak & Masuk Anomali',
          `Laporan ${report.type} ${citizen.full_name} ditolak. Data diteruskan ke menu Anomali & DLH.`
        );
      } else {
        showToast(
          'success',
          'Laporan Disetujui',
          `Laporan ${report.type} ${citizen.full_name} disetujui (+5 Poin). Berhasil dipindahkan ke Riwayat Verifikasi.`
        );
      }
    } catch {
      showToast('error', 'Gagal', 'Terjadi kesalahan sistem.');
    }
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
          <h1 className="font-lexend font-extrabold text-xl text-on-surface">Pendataan & Sampling RT</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kel. {user.kelurahan} • RT {user.rt} / RW {user.rw} — Verifikasi 1-Click & Sidak Lapangan
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

      {/* BANNER PENJELASAN SISTEM SAMPLING VERIFIKASI RT */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-4 shadow-card border border-emerald-700/30 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent-400 shrink-0" />
          <h3 className="font-lexend font-bold text-xs text-white">Apa itu Sampling & Verifikasi RT?</h3>
        </div>
        <p className="text-[11px] text-emerald-100/90 leading-relaxed">
          <strong>Maksud Patuh:</strong> Tingkat kesadaran warga memilah sampah (Organik & Anorganik) dari rumah. <br />
          <strong>Diverifikasi oleh:</strong> <u>Ketua RT ({user.full_name})</u> secara resmi. Anda dapat menyetujui/menolak laporan warga dalam <strong>1 Klik</strong> di bawah ini, atau melakukan sidak acak warga.
        </p>
      </div>

      {/* ANTREAN LAPORAN PENDING & SAMPLING */}
      <div className="space-y-3">
        {wargaList.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
            <p className="text-sm font-bold text-on-surface">Tidak ada warga terdaftar di RT Anda</p>
          </div>
        )}

        {wargaList.map((w) => {
          const pendingReports = reportsByCitizen[w.id] ?? [];
          const hasPending = pendingReports.length > 0;
          const lastSampling = samplingByCitizen[w.id] ?? null;
          const points = db.computePoints(w.id);

          return (
            <div
              key={w.id}
              className={cn(
                'bg-white rounded-2xl border p-4 space-y-3 transition',
                hasPending ? 'border-amber-300 bg-amber-50/15 shadow-md' : 'border-slate-200/80 shadow-card'
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
                {(() => {
                  const compStatus = db.getWargaComplianceStatus(w.id);
                  return (
                    <StatusBadge
                      variant={compStatus === 'PATUH' ? 'patuh' : compStatus === 'TIDAK' ? 'tidak' : 'belum'}
                      label={compStatus === 'PATUH' ? 'Patuh' : compStatus === 'TIDAK' ? 'Tidak Patuh' : 'Belum Disampling'}
                      className="shrink-0"
                    />
                  );
                })()}
              </div>

              {/* DAFTAR LAPORAN MANDIRI PENDING WARGA */}
              {pendingReports.length > 0 ? (
                <div className="space-y-2.5">
                  {pendingReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-amber-50/40 border border-amber-300 transition rounded-2xl p-3 space-y-2.5 shadow-sm"
                    >
                      <div
                        onClick={() => setViewingReport({ citizen: w, report })}
                        className="flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {report.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={report.photo}
                              alt="Foto Laporan Warga"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0 group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg shrink-0">
                              {report.type === 'ORGANIK' ? '🌱' : '♻️'}
                            </div>
                          )}
                          <div className="text-xs min-w-0">
                            <p className="font-extrabold text-on-surface flex items-center gap-1.5 flex-wrap">
                              Sampah {report.type === 'ORGANIK' ? 'Organik (Sisa Makanan)' : 'Anorganik (Kemasan/Residu)'}
                            </p>
                            <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" /> Dikirim: {timeAgo(report.created_at)}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                          <Eye className="w-3 h-3" /> Verifikasi RT
                        </span>
                      </div>

                      {/* TOMBOL AKSI VERIFIKASI PENDING (1-KLIK PROSES) */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/80">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifySingleReport(w, report, true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-sm"
                          title="Setujui dalam 1 Klik"
                        >
                          <Check className="w-4 h-4 shrink-0" /> Setujui Patuh (+5 Pts)
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifySingleReport(w, report, false);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-sm"
                          title="Tolak dalam 1 Klik"
                        >
                          <X className="w-4 h-4 shrink-0" /> Tolak Laporan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between">
                  <span className="text-slate-500 font-medium text-[11px]">Belum ada laporan sampah yang masuk</span>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                    Bersih / Nihil
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CAMERA CAPTURE */}
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

      {/* MODAL KONFIRMASI SAMPLING */}
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

      {/* MODAL PRATINJAU DETAIL LAPORAN WARGA */}
      <Modal
        open={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title="Detail Foto & Pemilahan Warga"
        subtitle={
          viewingReport
            ? `${viewingReport.citizen.full_name} (${viewingReport.citizen.email})`
            : undefined
        }
        size="md"
        footer={
          viewingReport ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setViewingReport(null)}
                className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold px-4 py-3 rounded-xl transition"
              >
                Tutup
              </button>
              {viewingReport.report.status === 'PENDING' ? (
                <>
                  <button
                    onClick={() => {
                      const target = viewingReport.citizen;
                      const r = viewingReport.report;
                      setViewingReport(null);
                      handleVerifySingleReport(target, r, true);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Setujui Patuh (+5 Pts)
                  </button>
                  <button
                    onClick={() => {
                      const target = viewingReport.citizen;
                      const r = viewingReport.report;
                      setViewingReport(null);
                      handleVerifySingleReport(target, r, false);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold px-4 py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <X className="w-4 h-4" /> Tolak Laporan
                  </button>
                </>
              ) : undefined}
            </div>
          ) : undefined
        }
      >
        {viewingReport && (
          <div className="space-y-4">
            {viewingReport.report.photo ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 aspect-[4/3] bg-slate-900 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingReport.report.photo}
                  alt="Bukti Foto Sampah Terpilah Warga"
                  className="w-full h-full object-contain"
                />
                <span className="absolute top-2 left-2 bg-emerald-700/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Foto Asli Aplikasi PILAH.ki
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-2xl p-8 text-center text-slate-500 text-xs font-medium">
                Tidak ada foto terlampir pada laporan ini
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-on-surface">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-on-surface-variant font-medium">Warga Pelapor</span>
                <span className="font-extrabold text-on-surface">{viewingReport.citizen.full_name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-on-surface-variant font-medium">Jenis Sampah Terpilah</span>
                <span className="font-extrabold text-primary-700 flex items-center gap-1.5">
                  {viewingReport.report.type === 'ORGANIK' ? <Leaf className="w-4 h-4 text-emerald-600" /> : <Trash2 className="w-4 h-4 text-amber-600" />}
                  {viewingReport.report.type === 'ORGANIK' ? 'Organik (Sisa Makanan)' : 'Anorganik (Kemasan/Residu)'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-on-surface-variant font-medium">Waktu Pengiriman</span>
                <span className="font-bold text-slate-700">{formatDateTime(viewingReport.report.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Status Laporan</span>
                <span className="font-extrabold px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                  🟡 Menunggu Verifikasi RT
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
