'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import * as db from '@/lib/db';
import { cn } from '@/lib/utils';

const RiskMap = dynamic(() => import('@/components/risk-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl bg-slate-200 animate-pulse flex items-center justify-center text-xs font-bold text-slate-400">
      Memuat peta risiko...
    </div>
  ),
});

export default function DlhPetaPage() {
  return (
    <PageShell allowed={['ADMIN_DLH']}>
      <PetaContent />
    </PageShell>
  );
}

function PetaContent() {
  const [kelurahan, setKelurahan] = useState<db.KelurahanStat[]>([]);
  const [selected, setSelected] = useState<db.KelurahanStat | null>(null);

  useEffect(() => {
    setKelurahan(db.getKelurahanStats());
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Peta Risiko Pemilahan</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Klaster risiko per kelurahan — klik marker untuk detail rekomendasi
        </p>
      </div>

      {/* LEGENDA */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-200/80 shadow-card px-4 py-3 text-[11px] font-bold">
        <span className="text-on-surface-variant">Legenda:</span>
        <span className="flex items-center gap-1.5 text-on-surface">
          <span className="w-3 h-3 rounded-full bg-primary-600"></span> Rendah (&lt;30)
        </span>
        <span className="flex items-center gap-1.5 text-on-surface">
          <span className="w-3 h-3 rounded-full bg-accent-500"></span> Sedang (30–59)
        </span>
        <span className="flex items-center gap-1.5 text-on-surface">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Tinggi (≥60)
        </span>
        <span className="ml-auto text-on-surface-variant font-medium">Ukuran marker = tingkat risiko</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <RiskMap kelurahan={kelurahan} onSelect={setSelected} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected ? `Kec. ${selected.kecamatan}` : undefined}
        size="sm"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-xl border border-slate-200 py-2.5">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Kepatuhan</p>
                <p className="font-lexend font-extrabold text-lg text-primary-700">{selected.compliance}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 py-2.5">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Residu</p>
                <p className="font-lexend font-extrabold text-lg text-on-surface">{selected.residuTon} T</p>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 py-2.5">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase">Anomali</p>
                <p className="font-lexend font-extrabold text-lg text-red-600">{selected.activeDisputes}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-on-surface-variant">Skor Risiko</span>
                <span
                  className={cn(
                    selected.riskLevel === 'HIGH' && 'text-red-600',
                    selected.riskLevel === 'MEDIUM' && 'text-accent-600',
                    selected.riskLevel === 'LOW' && 'text-primary-700'
                  )}
                >
                  {selected.riskScore}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    selected.riskLevel === 'HIGH' ? 'bg-red-500' : selected.riskLevel === 'MEDIUM' ? 'bg-accent-500' : 'bg-primary-600'
                  )}
                  style={{ width: `${selected.riskScore}%` }}
                />
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-3.5">
              <p className="text-[11px] font-bold text-primary-800 mb-1">Rekomendasi</p>
              <p className="text-xs text-primary-900 leading-relaxed">
                {selected.riskScore >= 60
                  ? 'Prioritas penertiban & sosialisasi door-to-door. Koordinasikan dengan kader DLH dan RT setempat.'
                  : selected.riskScore >= 30
                    ? 'Tingkatkan frekuensi sampling acak dan dorong laporan mandiri warga melalui insentif poin.'
                    : 'Pertahankan program berjalan. Jadwalkan sampling rutin 10% dan monitoring berkala.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
