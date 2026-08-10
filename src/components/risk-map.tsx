'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { KelurahanStat } from '@/lib/db';

const COLOR: Record<KelurahanStat['riskLevel'], string> = {
  HIGH: '#dc2626',
  MEDIUM: '#f59e0b',
  LOW: '#16a34a',
};

export default function RiskMap({
  kelurahan,
  onSelect,
}: {
  kelurahan: KelurahanStat[];
  onSelect?: (k: KelurahanStat) => void;
}) {
  return (
    <MapContainer
      center={[-5.155, 119.44]}
      zoom={12}
      className="h-[420px] w-full rounded-2xl z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {kelurahan.map((k) => {
        const color = COLOR[k.riskLevel];
        return (
          <CircleMarker
            key={k.name}
            center={[k.lat, k.lng]}
            radius={16 + (k.riskScore / 100) * 22}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.4, weight: 2 }}
            eventHandlers={{ click: () => onSelect?.(k) }}
          >
            <Popup>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                <strong>{k.name}</strong>
                <div style={{ color: '#3f4d44' }}>Kepatuhan: {k.compliance}%</div>
                <div style={{ color: color, fontWeight: 700 }}>Skor Risiko: {k.riskScore}</div>
                <button
                  onClick={() => onSelect?.(k)}
                  style={{
                    marginTop: 6,
                    background: '#15803d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Lihat Rekomendasi
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
