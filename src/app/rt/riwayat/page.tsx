'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import { useApp } from '@/lib/app-context';
import * as db from '@/lib/db';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { RefreshCw, Eye, History, Check, Clock, User } from 'lucide-react';

export default function RtRiwayatPage() {
  return (
    <PageShell allowed={['RT_RW']}>
      <RiwayatContent />
    </PageShell>
  );
}

function RiwayatContent() {
  const { user } = useApp();

  const [wargaList, setWargaList] = useState<db.DemoUser[]>([]);
  const [reportsByCitizen, setReportsByCitizen] = useState<Record<string, db.Report[]>>({});
  const [historyCitizen, setHistoryCitizen] = useState<db.DemoUser | null>(null);

  const load = () => {
    if (!user) return;
    const warga = db.getWargaOfRT(user.rt_code);
    setWargaList(warga);
    const reports: Record<string, db.Report[]> = {};
    warga.forEach((w) => {
      // Include all processed reports (APPROVED or REJECTED)
      reports[w.id] = db.getReports(w.id).filter((r) => r.status !== 'PENDING');
    });
    setReportsByCitizen(reports);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-lexend font-extrabold text-xl text-on-surface">Riwayat Verifikasi Warga</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Kel. {user.kelurahan} • RT {user.rt} / RW {user.rw} — Rekam jejak verifikasi, anomali & putusan DLH
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

      {/* DAFTAR WARGA */}
      <div className="space-y-3">
        {wargaList.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
            <p className="text-sm font-bold text-on-surface">Tidak ada warga terdaftar di RT Anda</p>
          </div>
        )}

        {wargaList.map((w) => {
          const citizenReports = reportsByCitizen[w.id] ?? [];
          const approvedCount = citizenReports.filter((r) => r.status === 'APPROVED').length;
          const rejectedCount = citizenReports.filter((r) => r.status === 'REJECTED').length;
          const points = db.computePoints(w.id);

          return (
            <div
              key={w.id}
              onClick={() => setHistoryCitizen(w)}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card hover:shadow-card-lg transition cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-lexend font-black text-base shrink-0 border border-emerald-100 group-hover:scale-105 transition">
                  {w.full_name.charAt(0)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="font-lexend font-extrabold text-sm text-on-surface truncate group-hover:text-emerald-700 transition">
                    {w.full_name}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    NIK: {w.nik} • {w.email}
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {approvedCount} Disetujui
                    </span>
                    {rejectedCount > 0 && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
                        {rejectedCount} Ditolak
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
                <button className="bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 text-xs font-extrabold px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm">
                  <Eye className="w-4 h-4" /> Lihat Riwayat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL RIWAYAT LENGKAP WARGA */}
      <Modal
        open={!!historyCitizen}
        onClose={() => setHistoryCitizen(null)}
        title={historyCitizen ? `Riwayat Verifikasi: ${historyCitizen.full_name}` : ''}
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
              const citizenReports = reportsByCitizen[historyCitizen.id] ?? [];
              if (citizenReports.length === 0) {
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 font-medium">
                    Belum ada riwayat laporan yang diproses untuk warga ini.
                  </div>
                );
              }
              return citizenReports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {rep.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rep.photo}
                          alt="Foto Laporan"
                          className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-base shrink-0">
                          {rep.type === 'ORGANIK' ? '🌱' : '♻️'}
                        </div>
                      )}
                      <div className="text-xs min-w-0 space-y-0.5">
                        <p className="font-extrabold text-on-surface text-sm leading-snug">
                          Sampah {rep.type === 'ORGANIK' ? 'Organik (Sisa Makanan)' : 'Anorganik (Kemasan/Residu)'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {formatDateTime(rep.created_at)} ({timeAgo(rep.created_at)})
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center pt-1 sm:pt-0">
                      {rep.audit_source === 'RT_SOLVED' ? (
                        <span className="text-[11px] bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-full border border-amber-200">
                          Disetujui RT (Selesai RT) (+5 Pts)
                        </span>
                      ) : rep.audit_source === 'DLH_WARGA_VALID' ? (
                        <span className="text-[11px] bg-indigo-100 text-indigo-900 font-extrabold px-3 py-1 rounded-full border border-indigo-200">
                          Disetujui DLH (Warga Valid) (+10 Pts)
                        </span>
                      ) : rep.audit_source === 'DLH_RT_VALID' ? (
                        <span className="text-[11px] bg-rose-100 text-rose-900 font-extrabold px-3 py-1 rounded-full border border-rose-200">
                          Ditolak DLH (RT Valid)
                        </span>
                      ) : rep.status === 'APPROVED' ? (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                          Disetujui RT (+5 Pts)
                        </span>
                      ) : (
                        <span className="text-[11px] bg-rose-100 text-rose-800 font-extrabold px-3 py-1 rounded-full border border-rose-200">
                          Ditolak DLH (Sampling RT Valid)
                        </span>
                      )}
                    </div>
                  </div>

                  {rep.audit_source === 'RT_SOLVED' && (
                    <div className="bg-amber-100/70 border border-amber-200/80 text-amber-950 rounded-xl px-3.5 py-2.5 text-[11px] font-medium leading-relaxed">
                      <strong>⚠️ Notice Anomali:</strong> Pernah melalui anomali RT & disetujui setelah klarifikasi RT.
                    </div>
                  )}

                  {rep.audit_source === 'DLH_WARGA_VALID' && (
                    <div className="bg-indigo-100/70 border border-indigo-200/80 text-indigo-950 rounded-xl px-3.5 py-2.5 text-[11px] font-medium leading-relaxed">
                      <strong>🏛️ Notice Putusan DLH:</strong> Warga Valid (Menang Arbitrasi DLH, status di-override & Poin +10 diberikan).
                    </div>
                  )}

                  {rep.audit_source === 'DLH_RT_VALID' && (
                    <div className="bg-rose-100/70 border border-rose-200/80 text-rose-950 rounded-xl px-3.5 py-2.5 text-[11px] font-medium leading-relaxed">
                      <strong>🏛️ Notice Putusan DLH:</strong> Sampling RT Valid (Menang Arbitrasi DLH, Penolakan RT Sah & Final).
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
