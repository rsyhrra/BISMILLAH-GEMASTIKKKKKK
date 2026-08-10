'use client';

import Modal from './modal';
import StatusBadge from './status-badge';
import { Leaf, Trash2, MapPin, Clock } from 'lucide-react';
import type { Report } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';

function ReportPhoto({ type }: { type: Report['type'] }) {
  const organik = type === 'ORGANIK';
  return (
    <div
      className={`w-full h-28 rounded-xl flex flex-col items-center justify-center gap-1.5 border ${
        organik ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-accent-50 border-accent-200 text-accent-700'
      }`}
    >
      {organik ? <Leaf className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
      <span className="text-[10px] font-bold">{organik ? 'Sampah Organik' : 'Sampah Anorganik'}</span>
    </div>
  );
}

const STATUS_META: Record<Report['status'], { variant: 'patuh' | 'tidak' | 'tengah'; label: string }> = {
  PENDING: { variant: 'tengah', label: 'Menunggu Verifikasi' },
  APPROVED: { variant: 'patuh', label: 'Disetujui' },
  REJECTED: { variant: 'tidak', label: 'Ditolak' },
};

export default function ReportDetailModal({
  report,
  onClose,
}: {
  report: Report | null;
  onClose: () => void;
}) {
  if (!report) return null;
  const meta = STATUS_META[report.status];

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title="Detail Laporan Pemilahan"
      subtitle={formatDateTime(report.created_at)}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-slate-400">{report.id}</span>
          <StatusBadge variant={meta.variant} label={meta.label} />
        </div>

        <ReportPhoto type={report.type} />

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Waktu
            </span>
            <span className="font-bold text-on-surface">{formatDateTime(report.created_at)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Poin
            </span>
            <span className="font-extrabold text-primary-700">+{report.points} Poin</span>
          </div>
        </div>

        <div className="text-[11px] text-on-surface-variant leading-relaxed bg-primary-50 border border-primary-100 rounded-2xl p-3">
          {report.status === 'APPROVED' && 'Laporan Anda telah diverifikasi dan dinyatakan patuh. Poin sudah ditambahkan.'}
          {report.status === 'PENDING' && 'Laporan menunggu pendataan/sampling oleh pengurus RT di wilayah Anda.'}
          {report.status === 'REJECTED' && 'Laporan Anda ditolak karena hasil sampling RT menemukan ketidaksesuaian.'}
        </div>
      </div>
    </Modal>
  );
}
