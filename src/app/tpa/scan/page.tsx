'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { cn } from '@/lib/utils';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  Scale,
  Truck,
  ShieldAlert,
  Loader2,
  QrCode,
  MapPin,
} from 'lucide-react';

export default function TpaScanPage() {
  return (
    <PageShell allowed={['PENGAWAS_TPA']}>
      <TpaScanContent />
    </PageShell>
  );
}

function TpaScanContent() {
  const { user } = useApp();
  const { showToast } = useToast();
  const [manifests, setManifests] = useState<db.PickupManifest[]>([]);
  const [selected, setSelected] = useState<db.PickupManifest | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Inspection Form State
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [tonnageKg, setTonnageKg] = useState('850');
  const [tpaNotes, setTpaNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setManifests(db.getManifests());
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  if (!mounted) return null;

  const handleOpenInspect = (m: db.PickupManifest) => {
    setSelected(m);
    setTonnageKg(String(m.tonnage_kg));
    setTpaNotes('');
    setDecision('APPROVE');
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);

    const isApproved = decision === 'APPROVE';
    db.inspectManifestTPA(selected.id, isApproved, Number(tonnageKg) || selected.tonnage_kg, tpaNotes);

    setSaving(false);

    if (isApproved) {
      showToast(
        'success',
        'Muatan Truk Lolos Inspeksi TPA',
        `Truk ${selected.truck_code} (${selected.kelurahan}) diizinkan dumping di zona komposting TPA. Timbangan: ${tonnageKg} Kg.`
      );
    } else {
      showToast(
        'info',
        'Muatan Truk Ditolak TPA',
        `Truk ${selected.truck_code} ditolak karena kontaminasi. Laporan pelanggaran & penalti telah dikirim ke DLH.`
      );
    }

    setSelected(null);
    load();
  };

  const pendingList = manifests.filter((m) => m.status === 'EN_ROUTE');
  const processedList = manifests.filter((m) => m.status !== 'EN_ROUTE');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Pemeriksaan Pintu Gerbang TPA</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Scan QR Manifesto & inspeksi kelayakan muatan truk sebelum pembongkaran (*dumping*)
        </p>
      </div>

      {/* INSPECTIONS SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="bg-indigo-400/20 text-indigo-200 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-400/30">
            TPA TAMANGAPA KOTA MAKASSAR
          </span>
          <p className="font-lexend font-extrabold text-lg">{user?.full_name}</p>
          <p className="text-xs text-indigo-200 flex items-center gap-1">
            <ScanLine className="w-3.5 h-3.5" /> Quality Gate Assessment & Digital Scale Check-in
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
          <Scale className="w-6 h-6" />
        </div>
      </div>

      {/* SIMULATED SCANNER ACTION */}
      <div className="bg-white rounded-3xl border border-indigo-200 shadow-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-lexend font-bold text-sm text-on-surface flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-600" /> Pemindai QR Manifesto TPA
          </h2>
          <span className="bg-indigo-50 text-indigo-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100">
            {pendingList.length} Truk Tiba
          </span>
        </div>

        {pendingList.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-lexend font-bold text-xs text-on-surface">Tidak ada antrean truk saat ini</p>
            <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
              Semua truk yang tiba di gerbang TPA telah selesai diinspeksi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant font-medium">
              Truk yang sedang dalam ruju menuju pintu timbangan TPA:
            </p>

            {pendingList.map((m) => (
              <div
                key={m.id}
                className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:bg-indigo-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-lexend font-bold text-xs text-on-surface">
                      {m.truck_code} — {m.driver_name}
                    </p>
                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-indigo-600" /> Kel. {m.kelurahan} (RT {m.rt}) • Muatan: {m.waste_type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenInspect(m)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shrink-0"
                >
                  <ScanLine className="w-4 h-4" /> Inspeksi TPA
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL FORM */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Inspeksi Gerbang TPA"
        subtitle={selected ? `Manifesto ${selected.id} — Truk ${selected.truck_code}` : undefined}
        size="sm"
        footer={
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setSelected(null)}
              className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold px-4 py-3 rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={handleInspectSubmit}
              disabled={saving}
              className={cn(
                'flex-1 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md',
                decision === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              )}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : decision === 'APPROVE' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {decision === 'APPROVE' ? 'Izinkan Dumping TPA' : 'Tolak Muatan Truk'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selected && (
            <>
              {/* DETAILS SUMMARY */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-on-surface">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Sopir Armada</span>
                  <span className="font-bold">{selected.driver_name} ({selected.truck_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Rute Asal RT</span>
                  <span className="font-bold">Kel. {selected.kelurahan} (RT {selected.rt})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Klaim Muatan</span>
                  <span className="font-bold text-indigo-700">{selected.waste_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Kondisi QC RT awal</span>
                  <span className={`font-bold ${selected.qc_status === 'CLEAN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selected.qc_status === 'CLEAN' ? '✅ Terpilah Bersih' : '⚠️ Wadah RT Tercampur'}
                  </span>
                </div>
              </div>

              {/* DECISION SELECTION */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Hasil Inspeksi Pintu Gerbang TPA
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVE')}
                    className={cn(
                      'p-3.5 rounded-2xl border-2 text-left transition',
                      decision === 'APPROVE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <p className="text-xs font-extrabold">🟢 Lolos (Clean Batch)</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Izinkan dumping di zona komposting</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    className={cn(
                      'p-3.5 rounded-2xl border-2 text-left transition',
                      decision === 'REJECT'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 font-extrabold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <p className="text-xs font-extrabold">🔴 Tolak (Contaminated)</p>
                    <p className="text-[10px] text-rose-600 font-medium mt-0.5">Tolak & alihkan ke landfill umum</p>
                  </button>
                </div>
              </div>

              {/* TIMBANGAN NETTO */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Hasil Timbangan Netto TPA (Kg)
                </label>
                <input
                  type="number"
                  required
                  value={tonnageKg}
                  onChange={(e) => setTonnageKg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-bold text-on-surface focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* CATATAN PENGAWAS TPA */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Catatan Inspeksi / Alasan Penolakan
                </label>
                <textarea
                  value={tpaNotes}
                  onChange={(e) => setTpaNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    decision === 'APPROVE'
                      ? 'Muatan terpilah murni 98%, disetujui untuk bahan organik kompos...'
                      : 'Ditolak: Sampah organik terbukti terkontaminasi plastik 35%...'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* PROCESSED LIST LOG */}
      <div className="space-y-3">
        <h3 className="font-lexend font-bold text-base text-on-surface">Log Inspeksi TPA Selesai</h3>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-900 text-white text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Truk & Driver</th>
                  <th className="py-3 px-4">Rute RT</th>
                  <th className="py-3 px-4">Muatan</th>
                  <th className="py-3 px-4">Timbangan</th>
                  <th className="py-3 px-4">Status TPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedList.map((m) => {
                  const isApproved = m.status === 'APPROVED_TPA';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-on-surface">{m.truck_code}</p>
                        <p className="text-[10px] text-on-surface-variant">{m.driver_name}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        Kel. {m.kelurahan} (RT {m.rt})
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{m.waste_type}</td>
                      <td className="py-3 px-4 font-extrabold text-on-surface">{m.tonnage_kg} Kg</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isApproved ? '🟢 Lolos TPA' : '🔴 Ditolak TPA'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
