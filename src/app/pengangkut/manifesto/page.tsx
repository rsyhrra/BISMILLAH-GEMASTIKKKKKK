'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import * as db from '@/lib/db';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Truck, CheckCircle2, XCircle, Clock, MapPin, Scale } from 'lucide-react';
import { formatDateTime, timeAgo } from '@/lib/utils';

export default function PengangkutManifestoPage() {
  return (
    <PageShell allowed={['PENGANGKUT']}>
      <ManifestoContent />
    </PageShell>
  );
}

function ManifestoContent() {
  const { user } = useApp();
  const [manifests, setManifests] = useState<db.PickupManifest[]>([]);

  useEffect(() => {
    setManifests(db.getManifests());
  }, []);

  const activeManifest = manifests.find((m) => m.status === 'EN_ROUTE') || manifests[0];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">QR Manifesto Penjemputan Digital</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Tunjukkan QR Code ini kepada Pengawas TPA saat pemeriksaan gerbang timbangan TPA
        </p>
      </div>

      {/* ACTIVE QR CODE CARD */}
      {activeManifest ? (
        <div className="bg-white rounded-3xl border border-amber-300 shadow-xl p-6 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
            Manifesto Aktif
          </div>

          <div className="space-y-1 pt-2">
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold px-3 py-1 rounded-full">
              ID: {activeManifest.id}
            </span>
            <p className="font-lexend font-extrabold text-lg text-on-surface mt-2">
              TRUK #{activeManifest.truck_code} — {activeManifest.driver_name}
            </p>
            <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" /> Rute: Kel. {activeManifest.kelurahan} (RT {activeManifest.rt})
            </p>
          </div>

          {/* QR CODE BOX */}
          <div className="bg-gradient-to-br from-amber-50 to-slate-50 border-2 border-amber-200 rounded-3xl p-6 inline-block shadow-inner mx-auto">
            <QRCodeSVG
              value={JSON.stringify({
                manifestId: activeManifest.id,
                truck: activeManifest.truck_code,
                driver: activeManifest.driver_name,
                kelurahan: activeManifest.kelurahan,
                rt: activeManifest.rt,
                wasteType: activeManifest.waste_type,
                tonnage: activeManifest.tonnage_kg,
              })}
              size={180}
              level="H"
              includeMargin
              className="mx-auto rounded-xl"
            />
            <p className="text-[10px] font-mono text-slate-500 font-bold mt-2 tracking-widest">
              SCAN AT TPA GATE
            </p>
          </div>

          {/* DETAILS GRID */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left text-xs">
            <div>
              <p className="text-[10px] text-on-surface-variant font-medium">Jenis Muatan</p>
              <p className="font-bold text-on-surface">{activeManifest.waste_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-medium">QC Wadah RT</p>
              <p className={`font-bold ${activeManifest.qc_status === 'CLEAN' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {activeManifest.qc_status === 'CLEAN' ? '✅ Terpilah' : '⚠️ Tercampur'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-medium">Estimasi Tonase</p>
              <p className="font-bold text-on-surface">{activeManifest.tonnage_kg} Kg</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
          <QrCode className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="font-lexend font-bold text-sm text-on-surface">Belum ada manifesto aktif</p>
          <p className="text-xs text-on-surface-variant">
            Silakan buat rute penjemputan baru di halaman Rute RT.
          </p>
        </div>
      )}

      {/* HISTORICAL LOG MANIFESTOS */}
      <div className="space-y-3">
        <h3 className="font-lexend font-bold text-base text-on-surface flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" /> Riwayat Pengangkutan Truk
        </h3>

        <div className="space-y-2.5">
          {manifests.map((m) => {
            const isApproved = m.status === 'APPROVED_TPA';
            const isRejected = m.status === 'REJECTED_TPA';

            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl border p-4 shadow-card space-y-2.5 ${
                  isApproved
                    ? 'border-emerald-200'
                    : isRejected
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-lexend font-bold text-xs text-on-surface">
                        {m.id} — Kel. {m.kelurahan} (RT {m.rt})
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        Muatan: {m.waste_type} • {m.tonnage_kg} Kg • {timeAgo(m.created_at)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isApproved ? '🟢 Lolos TPA' : isRejected ? '🔴 Ditolak TPA' : '🟡 Menuju TPA'}
                  </span>
                </div>

                {m.tpa_notes && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 leading-relaxed">
                    <strong className="text-on-surface">Catatan Inspeksi TPA: </strong> {m.tpa_notes}
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
