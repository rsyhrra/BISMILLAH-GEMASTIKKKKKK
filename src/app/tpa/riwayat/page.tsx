'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { Scale, Truck, CheckCircle2, XCircle, FileSpreadsheet, MapPin } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function TpaRiwayatPage() {
  return (
    <PageShell allowed={['PENGAWAS_TPA']}>
      <TpaRiwayatContent />
    </PageShell>
  );
}

function TpaRiwayatContent() {
  const { showToast } = useToast();
  const [manifests, setManifests] = useState<db.PickupManifest[]>([]);

  useEffect(() => {
    setManifests(db.getManifests());
  }, []);

  const totalTonnage = manifests
    .filter((m) => m.status === 'APPROVED_TPA')
    .reduce((s, m) => s + m.tonnage_kg, 0);

  const organikTonnage = manifests
    .filter((m) => m.status === 'APPROVED_TPA' && m.waste_type === 'ORGANIK')
    .reduce((s, m) => s + m.tonnage_kg, 0);

  const cleanBatchCount = manifests.filter((m) => m.status === 'APPROVED_TPA').length;
  const rejectedBatchCount = manifests.filter((m) => m.status === 'REJECTED_TPA').length;
  const cleanRate = Math.round((cleanBatchCount / Math.max(manifests.length, 1)) * 100);

  const exportCSV = () => {
    const header = ['ID Manifesto', 'Truk', 'Sopir', 'Kelurahan', 'RT', 'Muatan', 'Berat (Kg)', 'Status TPA', 'Catatan'];
    const rows = manifests.map((m) => [
      m.id,
      m.truck_code,
      m.driver_name,
      m.kelurahan,
      m.rt,
      m.waste_type,
      String(m.tonnage_kg),
      m.status,
      m.tpa_notes || '-',
    ]);
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-tonase-tpa-pilahki.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'CSV Tonase Diekspor', 'File CSV audit tonase TPA berhasil diunduh.');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-lexend font-extrabold text-xl text-on-surface">Audit Tonase TPA Tamangapa</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Rekapitulasi timbangan digital & kualitas muatan armada</p>
        </div>
        <button
          onClick={exportCSV}
          className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-card flex items-center gap-1.5 transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Ekspor CSV Audit
        </button>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 shadow-card">
          <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Tonase Organik</p>
          <p className="font-lexend font-extrabold text-2xl text-emerald-700 mt-1">{(organikTonnage / 1000).toFixed(1)} <span className="text-xs font-normal">Ton</span></p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 shadow-card">
          <p className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">Tingkat Lolos TPA</p>
          <p className="font-lexend font-extrabold text-2xl text-indigo-700 mt-1">{cleanRate}%</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 shadow-card">
          <p className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Truk Ditolak</p>
          <p className="font-lexend font-extrabold text-2xl text-rose-700 mt-1">{rejectedBatchCount}</p>
        </div>
      </div>

      {/* LOG TABLE */}
      <div className="space-y-3">
        <h3 className="font-lexend font-bold text-base text-on-surface">Histori Timbangan Digital TPA</h3>

        <div className="space-y-3">
          {manifests.map((m) => {
            const isApproved = m.status === 'APPROVED_TPA';
            const isRejected = m.status === 'REJECTED_TPA';

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-4 space-y-3 hover:border-indigo-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-lexend font-bold text-sm text-on-surface">
                        {m.id} — {m.truck_code} ({m.driver_name})
                      </p>
                      <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-600" /> Rute: Kel. {m.kelurahan} (RT {m.rt}) • {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isApproved ? '🟢 Approved' : isRejected ? '🔴 Rejected' : '🟡 En Route'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant">Jenis Muatan: </span>
                    <span className="font-bold text-on-surface">{m.waste_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant">Berat Netto: </span>
                    <span className="font-extrabold text-indigo-800">{m.tonnage_kg} Kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant">QC Wadah RT: </span>
                    <span className={`font-bold ${m.qc_status === 'CLEAN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.qc_status === 'CLEAN' ? 'Clean' : 'Mixed'}
                    </span>
                  </div>
                </div>

                {m.tpa_notes && (
                  <p className="text-[11px] text-slate-600 bg-indigo-50/40 border border-indigo-100 rounded-xl px-3 py-2 leading-relaxed">
                    <strong className="text-indigo-900 font-semibold">Catatan Pengawas TPA: </strong> {m.tpa_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
