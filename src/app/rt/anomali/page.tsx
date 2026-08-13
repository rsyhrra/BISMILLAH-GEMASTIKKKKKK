'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { AlertTriangle, CheckCircle2, ShieldCheck, MapPin, Loader2, ArrowUpRight } from 'lucide-react';
import { formatDateTime, timeAgo } from '@/lib/utils';

export default function RtAnomaliPage() {
  return (
    <PageShell allowed={['RT_RW']}>
      <AnomaliContent />
    </PageShell>
  );
}

function AnomaliContent() {
  const { user } = useApp();
  const { showToast } = useToast();
  const [konflik, setKonflik] = useState<db.Konflik[]>([]);
  const [selected, setSelected] = useState<db.Konflik | null>(null);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user) return;
    setKonflik(db.getKonflikForRT(user.id));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleOpen = (k: db.Konflik) => {
    setSelected(k);
    setCatatan('');
  };

  const handleResolve = () => {
    if (!selected) return;
    setSaving(true);
    db.resolveKonflik(selected.id, catatan);
    setSaving(false);
    const name = db.getUser(selected.citizen_id)?.full_name ?? 'Warga';
    setSelected(null);
    load();
    showToast('success', 'Konflik Ditindaklanjuti', `Anomali ${name} telah diselesaikan.`);
  };

  const handleEskalasi = () => {
    if (!selected) return;
    setSaving(true);
    db.eskalasiKonflik(selected.id, catatan);
    setSaving(false);
    const name = db.getUser(selected.citizen_id)?.full_name ?? 'Warga';
    setSelected(null);
    load();
    showToast('info', 'Dinaikkan ke DLH', `Sengketa anomali ${name} berhasil dinaikkan ke Dinas Lingkungan Hidup.`);
  };

  if (!user) return null;

  const active = konflik.filter((k) => k.status === 'AKTIF').length;
  const eskalasi = konflik.filter((k) => k.status === 'ESKALASI').length;
  const resolved = konflik.filter((k) => k.status === 'SELESAI').length;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface">Deteksi Anomali</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Perbedaan status laporan warga vs hasil sampling RT
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-accent-50 border border-accent-200 rounded-2xl p-3.5 shadow-card">
          <p className="text-[10px] font-extrabold text-accent-800 uppercase tracking-wider">Aktif</p>
          <p className="font-lexend font-extrabold text-2xl text-accent-700 mt-1">{active}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 shadow-card">
          <p className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">Di DLH</p>
          <p className="font-lexend font-extrabold text-2xl text-purple-700 mt-1">{eskalasi}</p>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-3.5 shadow-card">
          <p className="text-[10px] font-extrabold text-primary-800 uppercase tracking-wider">Selesai</p>
          <p className="font-lexend font-extrabold text-2xl text-primary-700 mt-1">{resolved}</p>
        </div>
      </div>

      {/* LIST */}
      {konflik.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <p className="font-lexend font-bold text-base text-on-surface">Tidak ada anomali</p>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
            Semua hasil sampling RT konsisten dengan laporan warga.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {konflik.map((k) => {
          const citizen = db.getUser(k.citizen_id);
          const isResolved = k.status === 'SELESAI';
          const isEskalasi = k.status === 'ESKALASI';

          return (
            <div
              key={k.id}
              className={`bg-white rounded-2xl border p-4 shadow-card space-y-3 ${
                isResolved
                  ? 'border-primary-200'
                  : isEskalasi
                  ? 'border-purple-300 bg-purple-50/20'
                  : 'border-accent-300/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-lexend font-extrabold text-sm shrink-0 border ${
                      isResolved
                        ? 'bg-primary-50 text-primary-700 border-primary-100'
                        : isEskalasi
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-accent-50 text-accent-700 border-accent-100'
                    }`}
                  >
                    {citizen?.full_name.charAt(0) ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-lexend font-bold text-sm text-on-surface truncate">
                      {citizen?.full_name ?? 'Warga'}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Kel. {k.kelurahan} • {timeAgo(k.created_at)}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  variant={isResolved ? 'selesai' : isEskalasi ? 'eskalasi' : 'anomali'}
                  label={isResolved ? 'Selesai' : isEskalasi ? 'Dinaikkan ke DLH' : 'Anomali'}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-lg">
                  Warga: {k.warga_status === 'PATUH' ? 'Patuh' : 'Belum'}
                </span>
                <span className="text-slate-400">vs</span>
                <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-lg">
                  RT: {k.rt_status === 'PATUH' ? 'Patuh' : 'Tidak Patuh'}
                </span>
              </div>

              {k.status === 'AKTIF' && (
                <button
                  onClick={() => handleOpen(k)}
                  className="w-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-primary-700/20"
                >
                  <AlertTriangle className="w-4 h-4" /> Process & Tindak Lanjut
                </button>
              )}

              {k.catatan && (
                <p className="text-[11px] text-on-surface-variant bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed">
                  <strong className="text-on-surface font-semibold">Catatan: </strong>{' '}
                  {k.catatan.replace(/ditolak RT/gi, 'terdeteksi anomali pemilahan saat sampling RT')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* TINDAK LANJUT MODAL */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Tindak Lanjut Anomali"
        subtitle={selected ? db.getUser(selected.citizen_id)?.full_name : undefined}
        size="sm"
        footer={
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
              <button
                onClick={handleResolve}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Selesaikan di RT
              </button>
              <button
                onClick={handleEskalasi}
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                Naikkan ke DLH
              </button>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold py-2.5 rounded-xl transition"
            >
              Batal
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selected && (
            <>
              <div className="bg-accent-50 border border-accent-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Waktu Deteksi</span>
                  <span className="font-bold text-on-surface">{formatDateTime(selected.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Status Warga vs RT</span>
                  <span className="font-bold text-on-surface">
                    {selected.warga_status === 'PATUH' ? 'Patuh' : 'Belum'} vs {selected.rt_status === 'PATUH' ? 'Patuh' : 'Tidak'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Catatan Klarifikasi / Alasan Eskalasi
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Warga tidak terima ditegur dan menuntut pembuktian resmi DLH..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-on-surface">💡 Pilihan Tindakan:</p>
                <p>• <strong>Selesaikan di RT</strong>: Pilih ini jika sengketa telah tuntas/sepakat di tingkat RT.</p>
                <p>• <strong>Naikkan ke DLH</strong>: Pilih ini jika warga menolak/membantah sehingga DLH Kota Makassar yang mengambil keputusan resmi.</p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
