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
import { RefreshCw, MapPin, Check, X, Camera, Loader2, Eye, Leaf, Trash2, Clock, Inbox, History, User } from 'lucide-react';

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

  const [tab, setTab] = useState<'antrean' | 'riwayat'>('antrean');
  const [wargaList, setWargaList] = useState<db.DemoUser[]>([]);
  const [reportsByCitizen, setReportsByCitizen] = useState<Record<string, db.Report[]>>({});
  const [samplingByCitizen, setSamplingByCitizen] = useState<Record<string, db.SamplingRecord | null>>({});

  const [active, setActive] = useState<{ citizen: db.DemoUser; status: db.SamplingStatus } | null>(null);
  const [viewingReport, setViewingReport] = useState<{ citizen: db.DemoUser; report: db.Report } | null>(null);
  const [historyCitizen, setHistoryCitizen] = useState<db.DemoUser | null>(null);
  
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

  const handleVerifySingleReport = (citizen: db.DemoUser, report: db.Report, approved: boolean) => {
    if (!user) return;
    try {
      const res = db.verifySingleReport(report.id, approved, user.id);
      load();
      if (res.anomaly) {
        showToast(
          'warning',
          'Anomali Ditemukan',
          `Laporan ${report.type} ${citizen.full_name} ditolak. Ketidaksesuaian diteruskan ke DLH.`
        );
      } else {
        showToast(
          approved ? 'success' : 'info',
          approved ? 'Laporan Disetujui' : 'Laporan Ditolak',
          approved
            ? `Laporan ${report.type} ${citizen.full_name} disetujui (+5 Poin).`
            : `Laporan ${report.type} ${citizen.full_name} ditolak.`
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

  const totalPendingCount = wargaList.reduce(
    (acc, w) => acc + (reportsByCitizen[w.id]?.filter((r) => r.status === 'PENDING').length || 0),
    0
  );
  const totalVerifiedCount = wargaList.reduce(
    (acc, w) => acc + (reportsByCitizen[w.id]?.filter((r) => r.status !== 'PENDING').length || 0),
    0
  );

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-lexend font-extrabold text-xl text-on-surface">Dashboard Ketua RT</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kel. {user.kelurahan} • RT {user.rt} / RW {user.rw}
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

      {/* NAVIGATION TABS */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 text-xs font-extrabold shadow-card">
        <button
          onClick={() => setTab('antrean')}
          className={cn(
            'flex-1 py-3 rounded-xl transition flex items-center justify-center gap-2',
            tab === 'antrean'
              ? 'bg-primary-700 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-slate-50'
          )}
        >
          <Inbox className="w-4 h-4" />
          <span>Antrean Verifikasi RT</span>
          {totalPendingCount > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-black',
                tab === 'antrean' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
              )}
            >
              {totalPendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('riwayat')}
          className={cn(
            'flex-1 py-3 rounded-xl transition flex items-center justify-center gap-2',
            tab === 'riwayat'
              ? 'bg-primary-700 text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-slate-50'
          )}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Verifikasi Warga</span>
          {totalVerifiedCount > 0 && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-black',
                tab === 'riwayat' ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
              )}
            >
              {totalVerifiedCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ANTREAN VERIFIKASI & SAMPLING */}
      {tab === 'antrean' && (
        <div className="space-y-3">
          {wargaList.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
              <p className="text-sm font-bold text-on-surface">Tidak ada warga terdaftar di RT Anda</p>
            </div>
          )}

          {wargaList.map((w) => {
            const reports = reportsByCitizen[w.id] ?? [];
            const pendingReports = reports.filter((r) => r.status === 'PENDING');
            const hasPending = pendingReports.length > 0;
            const lastSampling = samplingByCitizen[w.id] ?? null;
            const points = db.computePoints(w.id);

            return (
              <div
                key={w.id}
                className={cn(
                  'bg-white rounded-2xl border p-4 space-y-3 transition',
                  hasPending ? 'border-amber-300 bg-amber-50/10 shadow-md' : 'border-slate-200/80 shadow-card'
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

                {/* DAFTAR LAPORAN MANDIRI PENDING WARGA */}
                {reports.length > 0 ? (
                  <div className="space-y-2.5">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className={cn(
                          'bg-slate-50 border transition rounded-2xl p-3 space-y-2.5 shadow-sm',
                          report.status === 'PENDING' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                        )}
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
                                Sampah {report.type === 'ORGANIK' ? 'Organik' : 'Anorganik'}
                              </p>
                              <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400" /> Dikirim: {timeAgo(report.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {report.status === 'APPROVED' && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                                🟢 Disetujui Patuh
                              </span>
                            )}
                            {report.status === 'REJECTED' && (
                              <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2.5 py-1 rounded-full border border-red-200">
                                🔴 Ditolak
                              </span>
                            )}
                            {report.status === 'PENDING' && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Detail Foto
                              </span>
                            )}
                          </div>
                        </div>

                        {/* TOMBOL AKSI INDIVIDUAL RAPI BILA STATUS PENDING */}
                        {report.status === 'PENDING' && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifySingleReport(w, report, true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-sm"
                            >
                              <Check className="w-4 h-4 shrink-0" /> Setujui (+5 Pts)
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifySingleReport(w, report, false);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-sm"
                            >
                              <X className="w-4 h-4 shrink-0" /> Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-3 text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>Belum ada laporan sampah yang masuk</span>
                    <span className="text-[10px] bg-slate-200/60 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                      Belum Lapor
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: RIWAYAT VERIFIKASI WARGA */}
      {tab === 'riwayat' && (
        <div className="space-y-3">
          {wargaList.map((w) => {
            const verifiedReports = (reportsByCitizen[w.id] ?? []).filter((r) => r.status !== 'PENDING');
            const patuhCount = verifiedReports.filter((r) => r.status === 'APPROVED').length;
            const tidakCount = verifiedReports.filter((r) => r.status === 'REJECTED').length;
            const points = db.computePoints(w.id);

            return (
              <div
                key={w.id}
                onClick={() => setHistoryCitizen(w)}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-lg transition cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center font-lexend font-black text-base shrink-0 border border-primary-100 group-hover:scale-105 transition">
                    {w.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-lexend font-extrabold text-sm text-on-surface truncate group-hover:text-primary-700 transition flex items-center gap-2">
                      {w.full_name}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      NIK: {w.nik} • {w.email}
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        🟢 {patuhCount} Disetujui (Patuh)
                      </span>
                      {tidakCount > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">
                          🔴 {tidakCount} Ditolak
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Poin</p>
                    <p className="font-lexend font-black text-base text-accent-600">{points} Pts</p>
                  </div>
                  <button className="bg-slate-100 group-hover:bg-primary-700 group-hover:text-white text-slate-700 text-xs font-extrabold px-3 py-2 rounded-xl flex items-center gap-1 transition">
                    <Eye className="w-3.5 h-3.5" /> Lihat Riwayat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                    <Check className="w-4 h-4" /> Setujui (+5 Pts)
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
                    <X className="w-4 h-4" /> Tolak
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
                <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] ${
                  viewingReport.report.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {viewingReport.report.status === 'PENDING' ? '🟡 Menunggu Verifikasi RT' : '🟢 Disetujui RT'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL RIWAYAT LENGKAP WARGA */}
      <Modal
        open={!!historyCitizen}
        onClose={() => setHistoryCitizen(null)}
        title={historyCitizen ? `Riwayat Laporan: ${historyCitizen.full_name}` : ''}
        subtitle={
          historyCitizen
            ? `NIK: ${historyCitizen.nik} • RT ${historyCitizen.rt} / RW ${historyCitizen.rw}`
            : undefined
        }
        size="md"
      >
        {historyCitizen && (
          <div className="space-y-3">
            {(() => {
              const citizenReports = (reportsByCitizen[historyCitizen.id] ?? []).filter((r) => r.status !== 'PENDING');
              if (citizenReports.length === 0) {
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 font-medium">
                    Belum ada riwayat laporan yang diverifikasi untuk warga ini.
                  </div>
                );
              }
              return citizenReports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {rep.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rep.photo}
                          alt="Foto Laporan"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg shrink-0">
                          {rep.type === 'ORGANIK' ? '🌱' : '♻️'}
                        </div>
                      )}
                      <div className="text-xs min-w-0">
                        <p className="font-extrabold text-on-surface">
                          Sampah {rep.type === 'ORGANIK' ? 'Organik' : 'Anorganik'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateTime(rep.created_at)} ({timeAgo(rep.created_at)})
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {rep.status === 'APPROVED' ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                          🟢 Disetujui (+5 Pts)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-3 py-1 rounded-full border border-red-200">
                          🔴 Ditolak (Tidak Patuh)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
