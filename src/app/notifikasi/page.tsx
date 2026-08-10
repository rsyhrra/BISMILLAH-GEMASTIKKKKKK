'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useApp } from '@/lib/app-context';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { AlertTriangle, CheckCircle2, Info, BellRing, Loader2 } from 'lucide-react';
import { formatDateTime, timeAgo } from '@/lib/utils';

const TYPE_ICON: Record<db.NotifType, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-sky-600" />,
  konflik: <AlertTriangle className="w-4 h-4 text-accent-600" />,
  success: <CheckCircle2 className="w-4 h-4 text-primary-600" />,
};

export default function NotifikasiPage() {
  return (
    <PageShell>
      <NotifikasiContent />
    </PageShell>
  );
}

function NotifikasiContent() {
  const { user, refreshNotif } = useApp();
  const { showToast } = useToast();
  const [notifs, setNotifs] = useState<db.AppNotification[]>([]);
  const [konflik, setKonflik] = useState<db.Konflik[]>([]);
  const [selected, setSelected] = useState<db.Konflik | null>(null);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!user) return;
    setNotifs(db.getNotifications(user.id));
    if (user.role === 'RT_RW') setKonflik(db.getKonflikForRT(user.id));
    else if (user.role === 'WARGA') setKonflik(db.getKonflik().filter((k) => k.citizen_id === user.id));
    else setKonflik(db.getKonflik());
    db.markAllRead(user.id);
    refreshNotif();
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleResolve = () => {
    if (!selected) return;
    setSaving(true);
    db.resolveKonflik(selected.id, catatan);
    setSaving(false);
    setSelected(null);
    load();
    showToast('success', 'Konflik Selesai', 'Tindak lanjut berhasil disimpan.');
  };

  if (!user) return null;

  const activeKonflik = konflik.filter((k) => k.status === 'AKTIF');

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-lexend font-extrabold text-xl text-on-surface flex items-center gap-2">
          <BellRing className="w-5 h-5 text-primary-700" /> Notifikasi
        </h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Konflik pemilahan & riwayat notifikasi</p>
      </div>

      {/* KONFLIK */}
      {konflik.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-lexend font-bold text-sm text-on-surface px-0.5">
            Konflik Aktif{' '}
            {activeKonflik.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
                {activeKonflik.length}
              </span>
            )}
          </h2>

          {konflik.map((k) => {
            const citizen = db.getUser(k.citizen_id);
            const resolved = k.status === 'SELESAI';
            return (
              <div
                key={k.id}
                className={`bg-white rounded-2xl border p-4 shadow-card ${
                  resolved ? 'border-primary-200' : 'border-accent-300/70'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-lexend font-bold text-xs text-on-surface truncate">
                      {citizen?.full_name ?? 'Warga'}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Kel. {k.kelurahan} • {timeAgo(k.created_at)}
                    </p>
                  </div>
                  <StatusBadge variant={resolved ? 'selesai' : 'anomali'} />
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] font-bold">
                  <span className="bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-lg">
                    Warga: {k.warga_status === 'PATUH' ? 'Patuh' : 'Belum'}
                  </span>
                  <span className="text-slate-400">vs</span>
                  <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-lg">
                    RT: {k.rt_status === 'PATUH' ? 'Patuh' : 'Tidak Patuh'}
                  </span>
                </div>

                {!resolved && user.role === 'RT_RW' && (
                  <button
                    onClick={() => {
                      setSelected(k);
                      setCatatan('');
                    }}
                    className="mt-3 w-full bg-primary-700 hover:bg-primary-600 text-white text-xs font-extrabold py-2.5 rounded-xl transition"
                  >
                    Tandai Selesai
                  </button>
                )}
                {!resolved && user.role !== 'RT_RW' && (
                  <p className="mt-3 text-[11px] text-accent-700 bg-accent-50 border border-accent-100 rounded-xl px-3 py-2.5">
                    Menunggu tindak lanjut Ketua RT.
                  </p>
                )}
                {resolved && (
                  <p className="mt-3 text-[11px] text-on-surface-variant bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 leading-relaxed">
                    {k.catatan}
                  </p>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* RIWAYAT NOTIFIKASI */}
      <section className="space-y-3">
        <h2 className="font-lexend font-bold text-sm text-on-surface px-0.5">Riwayat Notifikasi</h2>

        {notifs.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-8 text-center">
            <p className="text-sm font-bold text-on-surface">Belum ada notifikasi</p>
            <p className="text-xs text-on-surface-variant mt-1">Semua sudah dibaca. Kondisi aman.</p>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card divide-y divide-slate-100">
          {notifs.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                {TYPE_ICON[n.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center gap-2">
                  <p className="font-bold text-xs text-on-surface truncate">{n.title}</p>
                  <span className="text-[10px] text-on-surface-variant shrink-0">{timeAgo(n.created_at)}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESOLUSI MODAL */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Tindak Lanjut Konflik"
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
              Simpan Resolusi
            </button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-accent-50 border border-accent-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Deteksi</span>
                <span className="font-bold text-on-surface">{formatDateTime(selected.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Warga vs RT</span>
                <span className="font-bold text-on-surface">
                  {selected.warga_status === 'PATUH' ? 'Patuh' : 'Belum'} vs{' '}
                  {selected.rt_status === 'PATUH' ? 'Patuh' : 'Tidak'}
                </span>
              </div>
            </div>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={4}
              placeholder="Catatan penyelesaian konflik..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
