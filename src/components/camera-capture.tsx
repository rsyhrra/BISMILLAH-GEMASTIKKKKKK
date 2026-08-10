'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Camera, RefreshCw, Check, ImagePlus, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
  hint?: string;
  locationLabel?: string;
  shutterColor?: 'emerald' | 'amber';
}

function compressImage(dataUrl: string, maxSize = 720, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('load image'));
    img.src = dataUrl;
  });
}

export default function CameraCapture({
  open,
  onClose,
  onCapture,
  title = 'Ambil Foto Bukti',
  hint = 'Posisikan sampah di tengah bingkai',
  locationLabel,
  shutterColor = 'emerald',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [phase, setPhase] = useState<'live' | 'preview'>('live');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      setTimestamp(
        new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Makassar',
        }).format(new Date()) + ' WITA'
      );
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [open]);

  const stopCamera = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  };

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Kamera tidak didukung oleh peramban ini.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, facingMode: 'environment' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setError('Akses kamera ditolak. Gunakan tombol unggah foto sebagai alternatif.');
    }
  };

  useEffect(() => {
    if (open && phase === 'live') startCamera();
    return () => {
      if (!open) stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleClose = () => {
    stopCamera();
    setPhoto(null);
    setPhase('live');
    setError(null);
    onClose();
  };

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Watermark lokasi + waktu
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`Lokasi: ${locationLabel ?? 'RT Setempat'}`, 14, canvas.height - 22);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`Waktu: ${timestamp} • PILAH.ki Verified`, 14, canvas.height - 7);

    return canvas.toDataURL('image/jpeg', 0.88);
  };

  const handleShoot = async () => {
    const raw = captureFrame();
    if (!raw) {
      setError('Gagal mengambil foto. Pastikan kamera aktif.');
      return;
    }
    try {
      const compressed = await compressImage(raw);
      setPhoto(compressed);
      setPhase('preview');
      stopCamera();
    } catch {
      setError('Gagal memproses foto.');
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setPhase('live');
    startCamera();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        setPhoto(compressed);
        setPhase('preview');
        setError(null);
      } catch {
        setError('Gagal memproses file foto.');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-0 bottom-[56px] lg:bottom-0 z-[60] bg-slate-950 text-white flex flex-col font-sans animate-fade-in overflow-hidden">
      {/* FULL-SCREEN CAMERA VIDEO OR PREVIEW */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl border border-rose-500/30">
              <Camera className="w-8 h-8" />
            </div>
            <p className="text-base font-bold">Kamera Tidak Tersedia</p>
            <p className="text-xs text-slate-300 max-w-xs">{error}</p>
            <div className="flex gap-2 w-full max-w-xs pt-2">
              <button
                onClick={startCamera}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5"
              >
                <ImagePlus className="w-4 h-4" /> Unggah Foto
              </button>
            </div>
          </div>
        ) : phase === 'live' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: mirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
        ) : (
          photo && <img src={photo} alt="Hasil Foto" className="w-full h-full object-cover" />
        )}

        {/* OVERLAY TOP HEADER (OVER VIDEO) */}
        <div className="absolute top-0 inset-x-0 z-20 pt-7 pb-8 px-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-start justify-between">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition shadow-md"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center text-white space-y-0.5 pt-1">
            <h3 className="font-lexend font-extrabold text-base tracking-tight drop-shadow-md">
              {title}
            </h3>
            <p className="text-[11px] text-slate-200 font-medium drop-shadow-sm">
              {phase === 'preview' ? 'Periksa hasil foto sebelum digunakan' : hint}
            </p>
          </div>

          <div className="w-10 h-10" />
        </div>

        {/* OVERLAY WATERMARK BADGE */}
        {!error && (
          <div className="absolute top-22 inset-x-0 z-20 flex justify-center pointer-events-none px-4">
            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-emerald-300 font-bold border border-white/15 flex items-center gap-1.5 shadow-lg">
              <MapPin className="w-3.5 h-3.5" />
              {locationLabel ?? 'GPS Aktif'} • {timestamp}
            </span>
          </div>
        )}

        {/* OVERLAY BOTTOM SHUTTER & CONTROLS */}
        {!error && (
          <div className="absolute bottom-0 inset-x-0 z-20 pt-8 pb-4 px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {phase === 'live' ? (
              <div className="relative flex items-center justify-center max-w-xs mx-auto">
                {/* BIG WHITE CIRCULAR SHUTTER BUTTON */}
                <button
                  onClick={handleShoot}
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/20 p-1 flex items-center justify-center active:scale-90 transition shadow-2xl"
                  title="Ambil Foto"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner">
                    <div className="w-14 h-14 rounded-full border-2 border-slate-300 bg-slate-100" />
                  </div>
                </button>

                {/* MIRROR TOGGLE BUTTON */}
                <button
                  onClick={() => setMirrored((m) => !m)}
                  className="absolute right-0 text-slate-200 flex flex-col items-center gap-1 hover:text-white transition active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold">{mirrored ? 'Mirror' : 'Asli'}</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-3 max-w-sm mx-auto">
                <button
                  onClick={handleRetake}
                  className="bg-black/60 backdrop-blur-md hover:bg-black/80 text-white text-xs font-bold px-5 py-3.5 rounded-2xl border border-white/20 flex items-center justify-center gap-2 transition flex-1"
                >
                  <RefreshCw className="w-4 h-4" /> Foto Ulang
                </button>
                <button
                  onClick={() => {
                    if (photo) {
                      onCapture(photo);
                      handleClose();
                    }
                  }}
                  className={cn(
                    'flex-1 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition',
                    shutterColor === 'emerald'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                      : 'bg-gradient-to-r from-accent-600 to-accent-500'
                  )}
                >
                  <Check className="w-5 h-5" /> Gunakan Foto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas + file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
