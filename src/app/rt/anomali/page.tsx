'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { AlertTriangle, CheckCircle2, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
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

  if (!user) return null;

  const active = konflik.filter((k) => k.status === 'AKTIF').length;
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent-50 border border-accent-200 rounded-2xl p-4 shadow-card">
          <p className="text-[11px] font-bold text-accent-800 uppercase">Anomali Aktif</p>
          <p className="font-lexend font-extrabold text-3xl text-accent-700 mt-1">{active}</p>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 shadow-card">
          <p className="text-[11px] font-bold text-primary-800 uppercase">Ditindaklanjuti</p>
          <p className="font-lexend font-extrabold text-3xl text-primary-700 mt-1">{resolved}</p>
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
          const resolvedNow = k.status === 'SELESAI';
          return (
            <div
              key={k.id}
              className={`bg-white rounded-2xl border p-4 shadow-card space-y-3 ${
                resolvedNow ? 'border-primary-200' : 'border-accent-300/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-lexend font-extrabold text-sm shrink-0 border ${
                      resolvedNow
                        ? 'bg-primary-50 text-primary-700 border-primary-100'
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
                <StatusBadge variant={resolvedNow ? 'selesai' : 'anomali'} />
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

              {!resolvedNow && (
                <button
                  onClick={() => handleOpen(k)}
                  className="w-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" /> Tindak Lanjut
                </button>
              )}
              {resolvedNow && (
                <p className="text-[11px] text-on-surface-variant bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed">
                  {k.catatan}
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
          <div className="flex gap-3">
            <button
              onClick={() => setSelected(null)}
              className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold px-4 py-3 rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={handleResolve}
              disabled={saving}
              className="flex-1 bg-primary-700 hover:bg-primary-600 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Tandai Selesai
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

              <label className="block text-xs font-bold text-on-surface">
                Catatan Tindak Lanjut
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                placeholder="Contoh: Warga sudah ditegur, sampah campur diminta dipisahkan ulang..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
