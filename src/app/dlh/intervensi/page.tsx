'use client';

import React, { useEffect, useState } from 'react';
import PageShell from '@/components/page-shell';
import Modal from '@/components/modal';
import StatusBadge from '@/components/status-badge';
import { useToast } from '@/components/toast';
import * as db from '@/lib/db';
import { cn } from '@/lib/utils';
import { FileDown, FileSpreadsheet, Loader2, Save, Scale, CheckCircle2, MapPin } from 'lucide-react';

export default function DlhIntervensiPage() {
  return (
    <PageShell allowed={['ADMIN_DLH']}>
      <IntervensiContent />
    </PageShell>
  );
}

function IntervensiContent() {
  const { showToast } = useToast();
  const [intervensi, setIntervensi] = useState<db.Intervensi[]>([]);
  const [kelurahan, setKelurahan] = useState<db.KelurahanStat[]>([]);
  const [konflikList, setKonflikList] = useState<db.Konflik[]>([]);
  
  // Modal State Intervensi
  const [selected, setSelected] = useState<db.Intervensi | null>(null);
  const [status, setStatus] = useState<db.IntervensiStatus>('BELUM');
  const [hasil, setHasil] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal State Arbitrasi Anomali
  const [selectedKonflik, setSelectedKonflik] = useState<db.Konflik | null>(null);
  const [decision, setDecision] = useState<'WARGA_VALID' | 'RT_VALID'>('WARGA_VALID');
  const [catatanKonflik, setCatatanKonflik] = useState('');

  const load = () => {
    setIntervensi(db.getIntervensi());
    setKelurahan(db.getKelurahanStats());
    setKonflikList(db.getKonflik());
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (item: db.Intervensi) => {
    setSelected(item);
    setStatus(item.status);
    setHasil(item.hasil);
  };

  const handleSave = () => {
    if (!selected) return;
    setSaving(true);
    db.updateIntervensi(selected.id, { status, hasil });
    setSaving(false);
    const name = selected.kelurahan;
    setSelected(null);
    load();
    showToast('success', 'Hasil Intervensi Disimpan', `Update ${name} tersimpan.`);
  };

  const handleResolveDLH = () => {
    if (!selectedKonflik) return;
    setSaving(true);
    db.resolveKonflikDLH(selectedKonflik.id, decision, catatanKonflik);
    setSaving(false);
    const name = db.getUser(selectedKonflik.citizen_id)?.full_name ?? 'Warga';
    setSelectedKonflik(null);
    load();
    showToast('success', 'Putusan Final DLH Tersimpan', `Keputusan resmi untuk ${name} berhasil diterbitkan.`);
  };

  const exportCSV = () => {
    const header = ['Kelurahan', 'Kecamatan', 'Skor Risiko', 'Kepatuhan', 'Residu (Ton)', 'Status Intervensi'];
    const rows = kelurahan.map((k) => [
      k.name,
      k.kecamatan,
      String(k.riskScore),
      `${k.compliance}%`,
      String(k.residuTon),
      intervensi.find((i) => i.kelurahan === k.name)?.status ?? '-',
    ]);
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intervensi-pilahki.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'CSV Diekspor', 'File CSV berhasil diunduh.');
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(21, 128, 61);
    doc.rect(0, 0, 297, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Laporan Intervensi PILAH.ki', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('DLH Kota Makassar — Pemantauan Pemilahan Sampah Rumah Tangga', 14, 19);

    const avg = Math.round(kelurahan.reduce((s, k) => s + k.riskScore, 0) / Math.max(kelurahan.length, 1));
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Ringkasan: ${kelurahan.length} kelurahan | Rata-rata skor risiko ${avg} | ${intervensi.length} intervensi tercatat`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['Kelurahan', 'Kecamatan', 'Skor Risiko', 'Kepatuhan', 'Residu (Ton)', 'Status', 'Hasil']],
      body: intervensi.map((i) => [
        i.kelurahan,
        i.kecamatan,
        String(i.risk_score),
        `${kelurahan.find((k) => k.name === i.kelurahan)?.compliance ?? '-'}%`,
        String(kelurahan.find((k) => k.name === i.kelurahan)?.residuTon ?? '-'),
        i.status,
        i.hasil || '-',
      ]),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    });

    doc.save('intervensi-pilahki.pdf');
    showToast('success', 'PDF Diekspor', 'Laporan PDF berhasil diunduh.');
  };

  const statusVariant = (s: db.IntervensiStatus) =>
    s === 'SELESAI' ? ('selesai' as const) : s === 'TENGAH' ? ('tengah' as const) : ('belum' as const);

  const eskalasiKonflikList = konflikList.filter((k) => k.status === 'ESKALASI');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-lexend font-extrabold text-xl text-on-surface">Intervensi & Arbitrasi DLH</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Penanganan kelurahan berisiko & putusan resmi sengketa RT</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="bg-primary-700 hover:bg-primary-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-card flex items-center gap-1.5 transition"
          >
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={exportCSV}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-card flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* SECTION ARBITRASI SENGKETA TERESKALASI */}
      <section className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-5 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-purple-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-lexend font-extrabold text-base tracking-tight">Arbitrasi Sengketa (Dinaikkan oleh RT)</h2>
              <p className="text-xs text-purple-200">Kasus anomali yang membutuhkan putusan resmi DLH Kota Makassar</p>
            </div>
          </div>
          <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs font-extrabold px-3 py-1 rounded-full">
            {eskalasiKonflikList.length} Kasus Pending
          </span>
        </div>

        {eskalasiKonflikList.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-xs text-purple-200">
            ✨ Tidak ada sengketa tereskalasi dari RT saat ini. Semua anomali berjalan kondusif.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eskalasiKonflikList.map((k) => {
              const citizen = db.getUser(k.citizen_id);
              return (
                <div key={k.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-lexend font-bold text-sm text-white">{citizen?.full_name ?? 'Warga'}</p>
                      <p className="text-[11px] text-purple-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-300" /> Kel. {k.kelurahan} • NIK: {citizen?.nik}
                      </p>
                    </div>
                    <StatusBadge variant="eskalasi" label="Di-eskalasi RT" />
                  </div>

                  <p className="text-xs text-purple-100 bg-black/20 rounded-xl p-2.5 leading-relaxed border border-white/10">
                    <strong className="text-purple-300">Catatan RT: </strong> {k.catatan}
                  </p>

                  <button
                    onClick={() => {
                      setSelectedKonflik(k);
                      setCatatanKonflik('');
                      setDecision('WARGA_VALID');
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Scale className="w-4 h-4" /> Terbitkan Putusan DLH
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TABEL INTERVENSI KELURAHAN */}
      <div className="space-y-3">
        <h3 className="font-lexend font-bold text-base text-on-surface">Program Intervensi Kelurahan</h3>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-primary-700 text-white text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kelurahan</th>
                  <th className="py-3 px-4">Skor Risiko</th>
                  <th className="py-3 px-4 hidden md:table-cell">Rekomendasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Hasil</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intervensi.map((item) => {
                  const dot =
                    item.risk_score >= 60 ? 'bg-red-500' : item.risk_score >= 30 ? 'bg-accent-500' : 'bg-primary-600';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-on-surface">{item.kelurahan}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.kecamatan}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2 font-extrabold text-on-surface">
                          <span className={cn('w-2.5 h-2.5 rounded-full', dot)}></span>
                          {item.risk_score}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-on-surface-variant max-w-[260px]">
                        <span className="line-clamp-2">{item.rekomendasi}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          variant={statusVariant(item.status)}
                          label={item.status === 'BELUM' ? 'Belum' : item.status === 'TENGAH' ? 'Sedang Berjalan' : 'Selesai'}
                        />
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-on-surface-variant max-w-[200px]">
                        <span className="line-clamp-2">{item.hasil || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpen(item)}
                          className="bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Catat Hasil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PUTUSAN ARBITRASI DLH */}
      <Modal
        open={!!selectedKonflik}
        onClose={() => setSelectedKonflik(null)}
        title="Putusan Arbitrasi Resmi DLH"
        subtitle={selectedKonflik ? `Warga: ${db.getUser(selectedKonflik.citizen_id)?.full_name}` : undefined}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedKonflik(null)}
              className="bg-slate-100 hover:bg-slate-200 text-on-surface-variant text-xs font-bold px-4 py-3 rounded-xl transition"
            >
              Batal
            </button>
            <button
              onClick={handleResolveDLH}
              disabled={saving}
              className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Terbitkan Putusan Final
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedKonflik && (
            <>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-purple-900">
                <p className="font-bold">Detail Sengketa:</p>
                <p>• Kelurahan: <strong>{selectedKonflik.kelurahan}</strong></p>
                <p>• Klaim Warga: <strong>Patuh Memilah</strong> vs Catatan RT: <strong>Sampah Campur</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Hasil Investigasi & Putusan DLH
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('WARGA_VALID')}
                    className={cn(
                      'p-3 rounded-2xl border-2 text-left transition',
                      decision === 'WARGA_VALID'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-extrabold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <p className="text-xs font-extrabold">✅ Warga Valid</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Memenangkan warga & kembalikan poin (+10)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('RT_VALID')}
                    className={cn(
                      'p-3 rounded-2xl border-2 text-left transition',
                      decision === 'RT_VALID'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 font-extrabold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <p className="text-xs font-extrabold font-lexend">❌ Sampling RT Valid</p>
                    <p className="text-[10px] text-rose-600 font-medium mt-0.5">Memenangkan RT & beri teguran ke warga</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Catatan Pertimbangan Resmi DLH
                </label>
                <textarea
                  value={catatanKonflik}
                  onChange={(e) => setCatatanKonflik(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Petugas DLH mengecek sampel ulang foto ber-GPS & menetapkan laporan warga sah..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* CATAT HASIL MODAL INTERVENSI */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Catat Hasil Intervensi"
        subtitle={selected ? `${selected.kelurahan} — Skor ${selected.risk_score}` : undefined}
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
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary-700 hover:bg-primary-600 text-white text-xs font-extrabold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Hasil
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block text-xs font-bold text-on-surface">
            Status Penanganan
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['BELUM', 'Belum'],
                ['TENGAH', 'Berjalan'],
                ['SELESAI', 'Selesai'],
              ] as [db.IntervensiStatus, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={cn(
                  'py-2.5 rounded-xl text-xs font-bold border-2 transition',
                  status === key
                    ? key === 'SELESAI'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : key === 'TENGAH'
                        ? 'border-accent-500 bg-accent-50 text-accent-700'
                        : 'border-slate-400 bg-slate-50 text-on-surface'
                    : 'border-slate-200 bg-white text-on-surface-variant hover:border-slate-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold text-on-surface">
            Catatan Hasil
          </label>
          <textarea
            value={hasil}
            onChange={(e) => setHasil(e.target.value)}
            rows={4}
            placeholder="Contoh: Sosialisasi door-to-door ke 120 KK selesai, kepatuhan naik 6%..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />

          {selected && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <p className="text-[11px] font-bold text-on-surface mb-1.5">Rekomendasi</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{selected.rekomendasi}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
