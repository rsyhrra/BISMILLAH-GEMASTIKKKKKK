export interface RiskInput {
  compliance30d: number; // C: Persentase kepatuhan 30 hari terakhir (0 - 100%)
  violations30d: number; // M: Jumlah pelanggaran / sampah campur 30 hari terakhir
  zoneWeight: number;    // Z: Bobot zona wilayah (1.0 standar, 1.3 zona kritis TPA Tamangapa)
}

export interface SamplingDecision {
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  samplingRate: number; // 1.0 = 100%, 0.35 = 35%, 0.10 = 10%
  mustInspect: boolean;
  autoPassAllowed: boolean;
}

/**
 * Menghitung skor risiko berdasarkan formula PILAH.ki Kota Makassar:
 * R = (100 - C) * 0.5 + (M * 10) * Z
 */
export function calculateAdaptiveRisk(input: RiskInput): SamplingDecision {
  const { compliance30d, violations30d, zoneWeight = 1.0 } = input;

  // Formula R
  const rawRisk = (100 - compliance30d) * 0.5 + (violations30d * 10) * zoneWeight;
  const riskScore = Math.min(100, Math.max(0, Math.round(rawRisk)));

  if (riskScore >= 60) {
    return {
      riskScore,
      riskLevel: 'HIGH',
      samplingRate: 1.0, // 100% wajib diperiksa RT
      mustInspect: true,
      autoPassAllowed: false,
    };
  } else if (riskScore >= 30) {
    return {
      riskScore,
      riskLevel: 'MEDIUM',
      samplingRate: 0.35, // 35% sampling acak
      mustInspect: false,
      autoPassAllowed: false,
    };
  } else {
    return {
      riskScore,
      riskLevel: 'LOW',
      samplingRate: 0.10, // 10% sampling acak (90% Auto-pass)
      mustInspect: false,
      autoPassAllowed: true,
    };
  }
}
