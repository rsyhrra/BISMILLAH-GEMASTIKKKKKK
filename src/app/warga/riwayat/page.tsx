'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import { useApp } from '@/lib/app-context';
import * as db from '@/lib/db';
import StatusBadge from '@/components/status-badge';
import ReportDetailModal from '@/components/report-detail-modal';
import { Leaf, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';

type Filter = 'all' | 'pending' | 'approved';

export default function WargaRiwayatPage() {
  return (
    <PageShell allowed={['WARGA']}>
      <RiwayatContent />
    </PageShell>
  );
}

function RiwayatContent() {
  const { user } = useApp();
  const [reports, setReports] = useState<db.Report[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<db.Report | null>(null);

  useEffect(() => {
    if (user) setReports(db.getReports(user.id));
  }, [user]);

  if (!user) return null;

  const points = db.computePoints(user.id);
  const approved = reports.filter((r) => r.status === 'APPROVED').length;
  const filtered = reports.filter((r) => {
    if (filter === 'pending') return r.status !== 'APPROVED';
    if (filter === 'approved') return r.status === 'APPROVED';
    return true;
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Riwayat Pelaporan</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Klik laporan untuk melihat detail bukti</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Total</p>
          <p className="font-lexend font-extrabold text-xl text-on-surface">{reports.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Disetujui</p>
          <p className="font-lexend font-extrabold text-xl text-primary-700">{approved}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Poin</p>
          <p className="font-lexend font-extrabold text-xl text-accent-600">{points}</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 text-xs font-bold shadow-card">
        {(
          [
            ['all', 'Semua'],
            ['pending', 'Menunggu'],
            ['approved', 'Disetujui'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex-1 py-2 rounded-xl transition',
              filter === key ? 'bg-primary-700 text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center space-y-2">
            <p className="text-sm font-bold text-on-surface">Tidak ada laporan</p>
            <p className="text-xs text-on-surface-variant">Belum ada riwayat dengan filter ini.</p>
          </div>
        )}

        {filtered.map((rep) => (
          <button
            key={rep.id}
            onClick={() => setSelected(rep)}
            className="w-full bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 flex gap-3.5 items-center shadow-card transition text-left group"
          >
            <div className="w-16 h-16 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 border border-primary-100">
              {rep.type === 'ORGANIK' ? <Leaf className="w-7 h-7" /> : <Trash2 className="w-7 h-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-mono font-bold text-slate-400">{rep.id}</span>
                <StatusBadge
                  variant={rep.status === 'APPROVED' ? 'patuh' : rep.status === 'REJECTED' ? 'tidak' : 'tengah'}
                  label={rep.status === 'APPROVED' ? 'Disetujui' : rep.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                />
              </div>
              <p className="font-lexend font-bold text-xs text-on-surface truncate">
                {rep.type === 'ORGANIK' ? 'Pemilahan Sampah Organik' : 'Pemilahan Sampah Anorganik'}
              </p>
              <div className="flex justify-between items-center mt-1 text-[10px] font-medium">
                <span className="text-on-surface-variant">{formatDateTime(rep.created_at)}</span>
                <span className="font-bold text-primary-700 flex items-center gap-1">
                  +{rep.points} Poin
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <ReportDetailModal report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
