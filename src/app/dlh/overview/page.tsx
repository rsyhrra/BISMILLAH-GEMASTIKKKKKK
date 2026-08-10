'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/page-shell';
import StatCard from '@/components/stat-card';
import StatusBadge from '@/components/status-badge';
import { TrendAreaChart } from '@/components/waste-chart';
import * as db from '@/lib/db';
import { Users, Home as HomeIcon, Target, AlertTriangle, Map, ClipboardList, ChevronRight } from 'lucide-react';

export default function DlhOverviewPage() {
  return (
    <PageShell allowed={['ADMIN_DLH']}>
      <OverviewContent />
    </PageShell>
  );
}

function OverviewContent() {
  const [overview, setOverview] = useState<db.OverviewData | null>(null);
  const [kelurahan, setKelurahan] = useState<db.KelurahanStat[]>([]);

  useEffect(() => {
    setOverview(db.getOverview());
    setKelurahan(db.getKelurahanStats());
  }, []);

  if (!overview) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Dashboard DLH Kota Makassar</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Ringkasan kepatuhan pemilahan sampah, risiko, dan intervensi
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={HomeIcon}
          label="Total RT"
          value={overview.totalRT}
          sub="Pengurus RT terdaftar"
          tone="green"
        />
        <StatCard
          icon={Users}
          label="Total Warga"
          value={overview.totalWarga}
          sub="Rumah tangga terdaftar"
          tone="blue"
        />
        <StatCard
          icon={Target}
          label="Kepatuhan Rata-rata"
          value={`${overview.avgCompliance}%`}
          sub="Target Wali Kota 80%"
          tone="green"
          progress={overview.avgCompliance}
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomali Aktif"
          value={overview.activeAnomalies}
          sub="Perlu tindak lanjut"
          tone="red"
        />
      </div>

      {/* AREA CHART */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4">
        <div className="mb-3">
          <h3 className="font-lexend font-bold text-sm text-on-surface">Tren Kepatuhan 8 Minggu</h3>
          <p className="text-[11px] text-on-surface-variant">Perkembangan rata-rata kepatuhan kota</p>
        </div>
        <TrendAreaChart data={overview.weeklyTrend} />
      </section>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dlh/peta"
          className="bg-primary-700 hover:bg-primary-600 text-white rounded-2xl p-4 shadow-card-lg flex items-center justify-between transition group"
        >
          <span className="flex items-center gap-2.5 font-lexend font-bold text-sm">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Map className="w-4 h-4" />
            </span>
            Lihat Peta Risiko
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/dlh/intervensi"
          className="bg-slate-800 hover:bg-slate-700 text-white rounded-2xl p-4 shadow-card-lg flex items-center justify-between transition group"
        >
          <span className="flex items-center gap-2.5 font-lexend font-bold text-sm">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </span>
            Lihat Intervensi
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* SKOR RISIKO KELURAHAN */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 space-y-3">
        <div>
          <h3 className="font-lexend font-bold text-sm text-on-surface">Skor Risiko Per Kelurahan</h3>
          <p className="text-[11px] text-on-surface-variant">Diurutkan dari risiko tertinggi</p>
        </div>
        <div className="space-y-2.5">
          {kelurahan.map((k, idx) => (
            <div key={k.name} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-xs text-on-surface flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  {k.name}
                </span>
                <StatusBadge
                  variant={k.riskLevel === 'HIGH' ? 'anomali' : k.riskLevel === 'MEDIUM' ? 'tengah' : 'patuh'}
                  label={k.riskLevel === 'HIGH' ? 'Tinggi' : k.riskLevel === 'MEDIUM' ? 'Sedang' : 'Rendah'}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                <span>Kepatuhan {k.compliance}%</span>
                <span className="font-extrabold text-on-surface">
                  Skor <span className="font-lexend text-sm">{k.riskScore}</span>
                </span>
              </div>
              <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full ${
                    k.riskLevel === 'HIGH' ? 'bg-red-500' : k.riskLevel === 'MEDIUM' ? 'bg-accent-500' : 'bg-primary-600'
                  }`}
                  style={{ width: `${k.riskScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
