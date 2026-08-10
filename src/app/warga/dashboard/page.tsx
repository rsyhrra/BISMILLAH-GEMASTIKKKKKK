'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/page-shell';
import { useApp } from '@/lib/app-context';
import * as db from '@/lib/db';
import { WeekBarChart } from '@/components/waste-chart';
import StatusBadge from '@/components/status-badge';
import ReportDetailModal from '@/components/report-detail-modal';
import { Star, Camera, ChevronRight, Leaf, Trash2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function WargaDashboardPage() {
  return (
    <PageShell allowed={['WARGA']}>
      <DashboardContent />
    </PageShell>
  );
}

function DashboardContent() {
  const { user } = useApp();
  const [reports, setReports] = useState<db.Report[]>([]);
  const [selected, setSelected] = useState<db.Report | null>(null);

  useEffect(() => {
    if (user) setReports(db.getReports(user.id));
  }, [user]);

  if (!user) return null;

  const points = db.computePoints(user.id);
  const todayStatus = db.getTodayStatus(user.id);
  const recent = reports.slice(0, 3);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const label = d.toLocaleDateString('id-ID', { weekday: 'short' }).replace('.', '');
    const key = d.toDateString();
    const count = reports.filter((r) => new Date(r.created_at).toDateString() === key).length;
    return { day: label, laporan: count };
  });

  const statusMsg =
    todayStatus === 'PATUH'
      ? 'Terima kasih! Laporan hari ini sudah diterima.'
      : 'Kirim laporan pemilahan hari ini untuk menjaga kepatuhan dan menambah poin.';

  return (
    <div className="space-y-5">
      {/* HERO POIN */}
      <section className="relative rounded-3xl bg-gradient-to-br from-primary-900 via-teal-900 to-slate-900 text-white p-5 shadow-card-lg overflow-hidden border border-primary-700/30">
        <div className="absolute inset-0 bg-weave-pattern opacity-20 pointer-events-none"></div>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-accent-400 uppercase bg-accent-400/10 px-2 py-0.5 rounded-full border border-accent-400/20">
                KOTA MAKASSAR
              </span>
              <h2 className="font-lexend font-bold text-lg text-white mt-1.5 flex items-center gap-1.5">
                Poin Siri' na Pacce
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-accent-400" />
            </div>
          </div>

          <div className="flex items-end justify-between bg-emerald-950/50 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20">
            <div>
              <p className="text-[10px] text-slate-300 uppercase font-semibold">Total Poin Terkumpul</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-lexend text-4xl font-black tracking-tight text-accent-400 drop-shadow-sm">
                  {points.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-accent-300">Pts</span>
              </div>
            </div>
            <StatusBadge
              variant={todayStatus === 'PATUH' ? 'patuh' : 'belum'}
              label={todayStatus === 'PATUH' ? 'Patuh Hari Ini' : 'Belum Lapor'}
              size="lg"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-slate-300 font-medium">
              <span>Target Pemilahan Sampah</span>
              <span className="text-accent-400 font-bold">70%</span>
            </div>
            <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-emerald-500/20">
              <div className="bg-gradient-to-r from-accent-400 to-emerald-400 h-full rounded-full transition-all duration-500 w-[70%]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* STATUS CARD */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-on-surface-variant font-semibold">Status Kepatuhan Hari Ini</p>
          <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{statusMsg}</p>
        </div>
        <StatusBadge
          variant={todayStatus === 'PATUH' ? 'patuh' : 'belum'}
          label={todayStatus === 'PATUH' ? 'Patuh' : 'Belum Lapor'}
          size="lg"
          className="shrink-0"
        />
      </section>

      {/* BAR CHART */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-lexend font-bold text-sm text-on-surface">Aktivitas 7 Hari Terakhir</h3>
            <p className="text-[11px] text-on-surface-variant">Jumlah laporan pemilahan per hari</p>
          </div>
        </div>
        <WeekBarChart data={last7} />
      </section>

      {/* CTA */}
      <Link
        href="/warga/lapor"
        className="block w-full bg-gradient-to-r from-primary-700 via-primary-600 to-teal-600 hover:from-primary-600 hover:to-teal-500 text-white font-extrabold text-sm py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary-700/30 active:scale-[0.98] transition"
      >
        <Camera className="w-5 h-5" />
        Lapor Sampah Sekarang
      </Link>

      {/* RIWAYAT TERAKHIR */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-0.5">
          <h3 className="font-lexend font-bold text-base text-on-surface">Riwayat Terakhir</h3>
          <Link
            href="/warga/riwayat"
            className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-0.5 transition"
          >
            Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center space-y-2">
            <p className="text-sm font-bold text-on-surface">Belum ada laporan</p>
            <p className="text-xs text-on-surface-variant">Mulai lapor sampah terpilah hari ini.</p>
          </div>
        )}

        {recent.map((rep) => (
          <button
            key={rep.id}
            onClick={() => setSelected(rep)}
            className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex gap-3.5 items-center shadow-card hover:shadow-card-lg transition text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 border border-primary-100">
              {rep.type === 'ORGANIK' ? <Leaf className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-xs text-on-surface truncate">
                  {rep.type === 'ORGANIK' ? 'Pemilahan Organik' : 'Pemilahan Anorganik'}
                </span>
                <StatusBadge
                  variant={rep.status === 'APPROVED' ? 'patuh' : rep.status === 'REJECTED' ? 'tidak' : 'tengah'}
                  label={rep.status === 'APPROVED' ? 'Selesai' : rep.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant">{timeAgo(rep.created_at)}</p>
              <p className="text-[11px] font-bold text-primary-700 mt-0.5">+{rep.points} Poin</p>
            </div>
          </button>
        ))}
      </section>

      <ReportDetailModal report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
