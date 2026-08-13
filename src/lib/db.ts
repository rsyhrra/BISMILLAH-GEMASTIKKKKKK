import { daysAgo } from './utils';

// ============================================================
// TYPES
// ============================================================

export type Role = 'WARGA' | 'RT_RW' | 'ADMIN_DLH' | 'PENGANGKUT' | 'PENGAWAS_TPA';

export type WasteType = 'ORGANIK' | 'ANORGANIK';
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SamplingStatus = 'PATUH' | 'TIDAK';
export type KonflikStatus = 'AKTIF' | 'ESKALASI' | 'SELESAI';
export type IntervensiStatus = 'BELUM' | 'TENGAH' | 'SELESAI';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotifType = 'info' | 'konflik' | 'success';

export interface PickupManifest {
  id: string;
  truck_code: string;
  driver_name: string;
  kelurahan: string;
  rt: string;
  waste_type: WasteType;
  status: 'EN_ROUTE' | 'APPROVED_TPA' | 'REJECTED_TPA';
  qc_status: 'CLEAN' | 'MIXED';
  qc_photo: string | null;
  tonnage_kg: number;
  tpa_notes?: string;
  created_at: string;
}

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  nik: string;
  role: Role;
  kecamatan: string;
  kelurahan: string;
  rt: string;
  rw: string;
  rt_code: string;
  siri_points: number;
}

export interface Report {
  id: string;
  citizen_id: string;
  type: WasteType;
  status: ReportStatus;
  points: number;
  photo: string | null;
  created_at: string;
}

export interface SamplingRecord {
  id: string;
  rt_id: string;
  citizen_id: string;
  status: SamplingStatus;
  photo: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Konflik {
  id: string;
  rt_id: string;
  citizen_id: string;
  kelurahan: string;
  warga_status: 'PATUH' | 'BELUM';
  rt_status: SamplingStatus;
  status: KonflikStatus;
  catatan: string;
  created_at: string;
}

export interface Intervensi {
  id: string;
  kelurahan: string;
  kecamatan: string;
  risk_score: number;
  rekomendasi: string;
  status: IntervensiStatus;
  hasil: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotifType;
  read: boolean;
  created_at: string;
}

export interface KelurahanStat {
  name: string;
  kecamatan: string;
  lat: number;
  lng: number;
  compliance: number;
  anomalyRate: number;
  activeDisputes: number;
  rtCount: number;
  wargaCount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  residuTon: number;
}

export interface OverviewData {
  totalRT: number;
  totalWarga: number;
  avgCompliance: number;
  activeAnomalies: number;
  weeklyTrend: { week: string; rate: number }[];
}

interface DemoDB {
  users: DemoUser[];
  reports: Report[];
  sampling: SamplingRecord[];
  konflik: Konflik[];
  intervensi: Intervensi[];
  notifications: AppNotification[];
  manifests: PickupManifest[];
}

// ============================================================
// CONSTANTS & SEED
// ============================================================

const DEMO_KEY = 'pilah_demo_v1';
const SESSION_KEY = 'pilah_session_v1';

export const KELURAHAN_META: Omit<KelurahanStat, 'compliance' | 'anomalyRate' | 'activeDisputes' | 'riskScore' | 'riskLevel' | 'wargaCount'>[] = [
  { name: 'Merdeka', kecamatan: 'Manggala', lat: -5.159, lng: 119.456, rtCount: 1, residuTon: 180 },
  { name: 'Bahari', kecamatan: 'Ujung Pandang', lat: -5.125, lng: 119.412, rtCount: 1, residuTon: 45 },
  { name: 'Sejahtera', kecamatan: 'Panakkukang', lat: -5.163, lng: 119.445, rtCount: 1, residuTon: 95 },
  { name: 'Hijau', kecamatan: 'Rappocini', lat: -5.186, lng: 119.468, rtCount: 1, residuTon: 88 },
  { name: 'Makmur', kecamatan: 'Tamalate', lat: -5.172, lng: 119.438, rtCount: 1, residuTon: 110 },
];

// Base compliance per kelurahan (dipakai untuk demo)
const BASE_COMPLIANCE: Record<string, number> = {
  Merdeka: 58,
  Bahari: 88,
  Sejahtera: 71,
  Hijau: 82,
  Makmur: 66,
};

const BASE_RESIDU: Record<string, number> = {
  Merdeka: 180,
  Bahari: 45,
  Sejahtera: 95,
  Hijau: 88,
  Makmur: 110,
};

export function getRtCode(kelurahan: string): string {
  const map: Record<string, string> = {
    Merdeka: 'MKS-MRD-001',
    Bahari: 'MKS-BHR-001',
    Sejahtera: 'MKS-SJH-001',
    Hijau: 'MKS-HJU-001',
    Makmur: 'MKS-MKM-001',
  };
  return map[kelurahan] || `MKS-${kelurahan.substring(0, 3).toUpperCase()}-001`;
}

function seedUsers(): DemoUser[] {
  const w = (
    id: string,
    email: string,
    full_name: string,
    nik: string,
    kelurahan: string,
    rt: string,
    rw: string,
    rt_code: string,
    points: number
  ): DemoUser => ({
    id,
    email,
    password: 'demo123',
    full_name,
    nik,
    role: 'WARGA',
    kecamatan: KELURAHAN_META.find((k) => k.name === kelurahan)!.kecamatan,
    kelurahan,
    rt,
    rw,
    rt_code,
    siri_points: points,
  });

  const r = (id: string, email: string, full_name: string, kelurahan: string): DemoUser => ({
    id,
    email,
    password: 'demo123',
    full_name,
    nik: `KK-${id.toUpperCase()}`,
    role: 'RT_RW',
    kecamatan: KELURAHAN_META.find((k) => k.name === kelurahan)!.kecamatan,
    kelurahan,
    rt: '01',
    rw: '02',
    rt_code: getRtCode(kelurahan),
    siri_points: 0,
  });

  return [
    {
      id: 'dlh',
      email: 'dlh@test.com',
      password: 'demo123',
      full_name: 'Administrator DLH',
      nik: '1985000000000001',
      role: 'ADMIN_DLH',
      kecamatan: 'Makassar',
      kelurahan: 'Kota Makassar',
      rt: '-',
      rw: '-',
      rt_code: '-',
      siri_points: 0,
    },
    r('rt1', 'rt1@test.com', 'H. Syamsuddin', 'Merdeka'),
    r('rt2', 'rt2@test.com', 'Ibu Rahmawati', 'Bahari'),
    r('rt3', 'rt3@test.com', 'Pak Darmawan', 'Sejahtera'),
    r('rt4', 'rt4@test.com', 'Ibu Fitriani', 'Hijau'),
    r('rt5', 'rt5@test.com', 'Pak Yohanis', 'Makmur'),
    {
      id: 'p1',
      email: 'driver@test.com',
      password: 'demo123',
      full_name: 'Budi Transport (Sopir Truk #04)',
      nik: '7371018800000001',
      role: 'PENGANGKUT',
      kecamatan: 'Manggala',
      kelurahan: 'Merdeka',
      rt: '01',
      rw: '02',
      rt_code: 'TRUK-04',
      siri_points: 0,
    },
    {
      id: 't1',
      email: 'tpa@test.com',
      password: 'demo123',
      full_name: 'Pak Slamet (Pengawas TPA Tamangapa)',
      nik: '7371019900000002',
      role: 'PENGAWAS_TPA',
      kecamatan: 'Manggala',
      kelurahan: 'TPA Tamangapa',
      rt: '-',
      rw: '-',
      rt_code: 'TPA-01',
      siri_points: 0,
    },
    w('w1', 'warga1@test.com', 'Andi Pratama', '7371012903940001', 'Merdeka', '01', '02', 'MKS-MRD-001', 25),
    w('w2', 'warga2@test.com', 'Siti Nurhaliza', '7371015007870002', 'Merdeka', '01', '02', 'MKS-MRD-001', 10),
    w('w3', 'warga3@test.com', 'Budi Santoso', '7371011208800003', 'Merdeka', '01', '02', 'MKS-MRD-001', 0),
    w('w4', 'warga4@test.com', 'Dewi Lestari', '7371012201950004', 'Bahari', '01', '02', 'MKS-BHR-001', 20),
    w('w5', 'warga5@test.com', 'Ahmad Fauzi', '7371011803920005', 'Bahari', '01', '02', 'MKS-BHR-001', 5),
    w('w6', 'warga6@test.com', 'Nurul Aini', '7371010506880006', 'Sejahtera', '01', '02', 'MKS-SJH-001', 15),
    w('w7', 'warga7@test.com', 'Rizal Hakim', '7371012701910007', 'Sejahtera', '01', '02', 'MKS-SJH-001', 10),
    w('w8', 'warga8@test.com', 'Mega Puspita', '7371011503840008', 'Hijau', '01', '02', 'MKS-HJU-001', 30),
    w('w9', 'warga9@test.com', 'Joko Widodo', '7371010906760009', 'Hijau', '01', '02', 'MKS-HJU-001', 10),
    w('w10', 'warga10@test.com', 'Rina Kartika', '7371012304990010', 'Makmur', '01', '02', 'MKS-MKM-001', 20),
    w('w11', 'warga11@test.com', 'Hendra Gunawan', '7371011408920011', 'Makmur', '01', '02', 'MKS-MKM-001', 5),
    w('w12', 'warga12@test.com', 'Sri Wahyuni', '7371010203900012', 'Makmur', '01', '02', 'MKS-MKM-001', 0),
  ];
}

function seedReports(): Report[] {
  return [
    { id: 'R-001', citizen_id: 'w1', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(1) },
    { id: 'R-002', citizen_id: 'w1', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(3) },
    { id: 'R-003', citizen_id: 'w1', type: 'ANORGANIK', status: 'PENDING', points: 10, photo: null, created_at: daysAgo(0) },
    { id: 'R-004', citizen_id: 'w2', type: 'ORGANIK', status: 'PENDING', points: 10, photo: null, created_at: daysAgo(0) },
    { id: 'R-005', citizen_id: 'w4', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(2) },
    { id: 'R-006', citizen_id: 'w4', type: 'ANORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(4) },
    { id: 'R-007', citizen_id: 'w6', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(1) },
    { id: 'R-008', citizen_id: 'w6', type: 'ORGANIK', status: 'PENDING', points: 10, photo: null, created_at: daysAgo(5) },
    { id: 'R-009', citizen_id: 'w8', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(2) },
    { id: 'R-010', citizen_id: 'w8', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(4) },
    { id: 'R-011', citizen_id: 'w8', type: 'ANORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(6) },
    { id: 'R-012', citizen_id: 'w10', type: 'ORGANIK', status: 'APPROVED', points: 10, photo: null, created_at: daysAgo(1) },
    { id: 'R-013', citizen_id: 'w10', type: 'ORGANIK', status: 'PENDING', points: 10, photo: null, created_at: daysAgo(6) },
  ];
}

function seedSampling(): SamplingRecord[] {
  return [
    { id: 'S-001', rt_id: 'rt1', citizen_id: 'w1', status: 'PATUH', photo: null, lat: -5.159, lng: 119.456, created_at: daysAgo(1) },
    { id: 'S-002', rt_id: 'rt1', citizen_id: 'w2', status: 'PATUH', photo: null, lat: -5.159, lng: 119.456, created_at: daysAgo(2) },
    { id: 'S-003', rt_id: 'rt2', citizen_id: 'w4', status: 'PATUH', photo: null, lat: -5.125, lng: 119.412, created_at: daysAgo(2) },
    { id: 'S-004', rt_id: 'rt1', citizen_id: 'w1', status: 'PATUH', photo: null, lat: -5.159, lng: 119.456, created_at: daysAgo(6) },
  ];
}

function seedKonflik(): Konflik[] {
  return [
    {
      id: 'K-001',
      rt_id: 'rt1',
      citizen_id: 'w1',
      kelurahan: 'Merdeka',
      warga_status: 'PATUH',
      rt_status: 'TIDAK',
      status: 'AKTIF',
      catatan: 'Warga mengklaim telah memilah, namun hasil sampling RT menemukan sampah campur.',
      created_at: daysAgo(0),
    },
  ];
}

function seedIntervensi(): Intervensi[] {
  return [
    {
      id: 'I-001',
      kelurahan: 'Merdeka',
      kecamatan: 'Manggala',
      risk_score: 71,
      rekomendasi: 'Penertiban kawasan TPA Tamangapa & sosialisasi pemilahan door-to-door.',
      status: 'TENGAH',
      hasil: 'Sosialisasi ke 120 KK, target 2 minggu.',
      created_at: daysAgo(3),
    },
    {
      id: 'I-002',
      kelurahan: 'Makmur',
      kecamatan: 'Tamalate',
      risk_score: 52,
      rekomendasi: 'Tambahan bank sampah unit & jadwal angkut residu lebih sering.',
      status: 'BELUM',
      hasil: '',
      created_at: daysAgo(5),
    },
    {
      id: 'I-003',
      kelurahan: 'Sejahtera',
      kecamatan: 'Panakkukang',
      risk_score: 45,
      rekomendasi: 'Insentif poin ganda untuk KK kepatuhan rendah.',
      status: 'SELESAI',
      hasil: 'Peningkatan kepatuhan 6% dalam 30 hari.',
      created_at: daysAgo(10),
    },
  ];
}

function seedNotifications(): AppNotification[] {
  return [
    {
      id: 'N-001',
      user_id: 'w1',
      title: 'Anomali Pemilahan Terdeteksi',
      message: 'Sampling RT menemukan sampah campur meskipun Anda melapor patuh. Silakan koordinasi dengan RT.',
      type: 'konflik',
      read: false,
      created_at: daysAgo(0),
    },
    {
      id: 'N-002',
      user_id: 'rt1',
      title: 'Konflik Baru di RT 01',
      message: 'Anomali terdeteksi pada laporan KK Andi Pratama. Perlu tindak lanjut.',
      type: 'konflik',
      read: false,
      created_at: daysAgo(0),
    },
    {
      id: 'N-003',
      user_id: 'w1',
      title: 'Laporan Terverifikasi',
      message: 'Laporan pemilahan organik Anda diverifikasi RT. +10 poin.',
      type: 'success',
      read: true,
      created_at: daysAgo(1),
    },
  ];
}

function seedManifests(): PickupManifest[] {
  return [
    {
      id: 'MAN-001',
      truck_code: 'TRUK-04',
      driver_name: 'Budi Transport',
      kelurahan: 'Merdeka',
      rt: '01',
      waste_type: 'ORGANIK',
      status: 'EN_ROUTE',
      qc_status: 'CLEAN',
      qc_photo: null,
      tonnage_kg: 850,
      created_at: daysAgo(0),
    },
    {
      id: 'MAN-002',
      truck_code: 'TRUK-02',
      driver_name: 'Pak Ruslan',
      kelurahan: 'Bahari',
      rt: '02',
      waste_type: 'ANORGANIK',
      status: 'APPROVED_TPA',
      qc_status: 'CLEAN',
      qc_photo: null,
      tonnage_kg: 1200,
      tpa_notes: 'Muatan terpilah bersih, lolos inspeksi TPA.',
      created_at: daysAgo(1),
    },
    {
      id: 'MAN-003',
      truck_code: 'TRUK-05',
      driver_name: 'Pak Hasan',
      kelurahan: 'Sejahtera',
      rt: '01',
      waste_type: 'ORGANIK',
      status: 'REJECTED_TPA',
      qc_status: 'MIXED',
      qc_photo: null,
      tonnage_kg: 950,
      tpa_notes: 'Ditolak: Sampah organik terbukti terkontaminasi plastik 30%.',
      created_at: daysAgo(2),
    },
  ];
}

function buildSeed(): DemoDB {
  return {
    users: seedUsers(),
    reports: seedReports(),
    sampling: seedSampling(),
    konflik: seedKonflik(),
    intervensi: seedIntervensi(),
    notifications: seedNotifications(),
    manifests: seedManifests(),
  };
}

// ============================================================
// STORAGE
// ============================================================

let cache: DemoDB | null = null;

function loadDB(): DemoDB {
  if (typeof window === 'undefined') return buildSeed();
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(DEMO_KEY);
    if (raw) {
      cache = JSON.parse(raw) as DemoDB;
      if (!cache.manifests) cache.manifests = seedManifests();
      const seededUsers = seedUsers();
      seededUsers.forEach((su) => {
        const found = cache!.users.find((u) => u.id === su.id || u.email === su.email);
        if (!found) {
          cache!.users.push(su);
        } else {
          found.rt_code = su.rt_code;
        }
      });
      return cache;
    }
  } catch {
    /* ignore corrupt */
  }
  cache = buildSeed();
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(cache));
  return cache;
}

function saveDB() {
  if (typeof window === 'undefined' || !cache) return;
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(cache));
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

export function resetDemoDB() {
  cache = null;
  if (typeof window !== 'undefined') window.localStorage.removeItem(DEMO_KEY);
}

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !(url && key && !url.includes('your-project-id'));
}

// ============================================================
// AUTH & SESSION
// ============================================================

export function login(identifier: string, password: string): DemoUser | null {
  const db = loadDB();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === identifier.trim().toLowerCase() &&
      u.password === password
  );
  if (!user) return null;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, user.id);
  }
  return user;
}

export function getSessionUser(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return loadDB().users.find((u) => u.id === id) ?? null;
}

export function logout() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
}

export function homePath(role: Role): string {
  if (role === 'RT_RW') return '/rt/sampling';
  if (role === 'ADMIN_DLH') return '/dlh/overview';
  if (role === 'PENGANGKUT') return '/pengangkut/rute';
  if (role === 'PENGAWAS_TPA') return '/tpa/scan';
  return '/warga/dashboard';
}

// ============================================================
// QUERIES
// ============================================================

export function getUser(id: string): DemoUser | null {
  return loadDB().users.find((u) => u.id === id) ?? null;
}

export function getReports(citizenId: string): Report[] {
  return loadDB()
    .reports.filter((r) => r.citizen_id === citizenId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getLatestReport(citizenId: string): Report | null {
  const list = getReports(citizenId);
  return list.length ? list[0] : null;
}

export function getWargaStatus(citizenId: string): 'PATUH' | 'BELUM' {
  const latest = getLatestReport(citizenId);
  return latest ? 'PATUH' : 'BELUM';
}

export function getTodayStatus(citizenId: string): 'PATUH' | 'BELUM' {
  const today = new Date().toDateString();
  const has = loadDB()
    .reports.some(
      (r) => r.citizen_id === citizenId && new Date(r.created_at).toDateString() === today
    );
  return has ? 'PATUH' : 'BELUM';
}

export function computePoints(citizenId: string): number {
  const db = loadDB();
  const fromReports = db.reports
    .filter((r) => r.citizen_id === citizenId && r.status !== 'REJECTED')
    .reduce((sum, r) => sum + r.points, 0);
  const fromSampling = db.sampling
    .filter((s) => s.citizen_id === citizenId && s.status === 'PATUH')
    .reduce((sum, s) => sum + 5, 0);
  return fromReports + fromSampling;
}

export function getWargaOfRT(rtCode: string): DemoUser[] {
  return loadDB()
    .users.filter((u) => u.role === 'WARGA' && u.rt_code === rtCode)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export function getLatestSampling(citizenId: string): SamplingRecord | null {
  const list = loadDB()
    .sampling.filter((s) => s.citizen_id === citizenId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return list.length ? list[0] : null;
}

export function getSamplingForRT(rtId: string): SamplingRecord[] {
  return loadDB()
    .sampling.filter((s) => s.rt_id === rtId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ============================================================
// MUTATIONS
// ============================================================

export function hasPendingReport(citizenId: string): boolean {
  return loadDB().reports.some((r) => r.citizen_id === citizenId && r.status === 'PENDING');
}

export function deleteReport(reportId: string): boolean {
  const db = loadDB();
  const idx = db.reports.findIndex((r) => r.id === reportId);
  if (idx !== -1) {
    db.reports.splice(idx, 1);
    saveDB();
    return true;
  }
  return false;
}

export function addReport(
  citizenId: string,
  type: WasteType,
  photo: string | null
): Report {
  const db = loadDB();
  const report: Report = {
    id: uid('R'),
    citizen_id: citizenId,
    type,
    status: 'PENDING',
    points: 10,
    photo,
    created_at: new Date().toISOString(),
  };
  db.reports.unshift(report);
  saveDB();
  return report;
}

export interface SamplingResult {
  record: SamplingRecord;
  anomaly: boolean;
  konflik?: Konflik;
}

export function verifySingleReport(
  reportId: string,
  approved: boolean,
  rtId: string,
  photo: string | null = null,
  lat: number = -5.1476,
  lng: number = 119.4327
): SamplingResult {
  const db = loadDB();
  const report = db.reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found');

  const citizenId = report.citizen_id;
  const citizen = db.users.find((u) => u.id === citizenId)!;

  report.status = approved ? 'APPROVED' : 'REJECTED';

  const samplingStatus: SamplingStatus = approved ? 'PATUH' : 'TIDAK';

  const record: SamplingRecord = {
    id: uid('S'),
    rt_id: rtId,
    citizen_id: citizenId,
    status: samplingStatus,
    photo: photo || report.photo,
    lat,
    lng,
    created_at: new Date().toISOString(),
  };
  db.sampling.unshift(record);

  if (approved) {
    citizen.siri_points += 5;
  }

  let anomaly = false;
  let konflik: Konflik | undefined;

  if (!approved) {
    const existing = db.konflik.find(
      (k) => k.citizen_id === citizenId && k.status === 'AKTIF'
    );
    if (!existing) {
      konflik = {
        id: uid('K'),
        rt_id: rtId,
        citizen_id: citizenId,
        kelurahan: citizen.kelurahan,
        warga_status: 'PATUH',
        rt_status: 'TIDAK',
        status: 'AKTIF',
        catatan: `Laporan sampah ${report.type} warga (${citizen.full_name}) ditolak RT.`,
        created_at: new Date().toISOString(),
      };
      db.konflik.unshift(konflik);
      anomaly = true;
    }
  }

  saveDB();
  return { record, anomaly, konflik };
}

export function addSampling(
  rtId: string,
  citizenId: string,
  status: SamplingStatus,
  photo: string | null,
  lat: number,
  lng: number
): SamplingResult {
  const db = loadDB();
  const citizen = db.users.find((u) => u.id === citizenId)!;

  const record: SamplingRecord = {
    id: uid('S'),
    rt_id: rtId,
    citizen_id: citizenId,
    status,
    photo,
    lat,
    lng,
    created_at: new Date().toISOString(),
  };
  db.sampling.unshift(record);

  // Verifikasi laporan warga terbaru
  const pending = db.reports.find(
    (r) => r.citizen_id === citizenId && r.status === 'PENDING'
  );
  if (pending) {
    pending.status = status === 'PATUH' ? 'APPROVED' : 'REJECTED';
  }

  // Poin tambahan jika patuh
  if (status === 'PATUH') {
    citizen.siri_points += 5;
  }

  let anomaly = false;
  let konflik: Konflik | undefined;

  const wargaStatus = getWargaStatus(citizenId);

  // Cek anomali: status RT bertentangan dengan klaim warga
  const existing = db.konflik.find(
    (k) => k.citizen_id === citizenId && k.status === 'AKTIF'
  );

  if (status === 'TIDAK' && wargaStatus === 'PATUH') {
    konflik = {
      id: uid('K'),
      rt_id: rtId,
      citizen_id: citizenId,
      kelurahan: citizen.kelurahan,
      warga_status: 'PATUH',
      rt_status: 'TIDAK',
      status: 'AKTIF',
      catatan: 'Warga mengklaim patuh, namun sampling RT menemukan sampah campur.',
      created_at: new Date().toISOString(),
    };
    db.konflik.unshift(konflik);
    anomaly = true;
  } else if (status === 'PATUH' && existing) {
    existing.status = 'SELESAI';
    existing.catatan = 'Klarifikasi RT: pemilahan dinyatakan patuh.';
    anomaly = false;
  }

  if (anomaly) {
    db.notifications.push({
      id: uid('N'),
      user_id: citizenId,
      title: 'Anomali Pemilahan Terdeteksi',
      message: 'Sampling RT menemukan sampah campur meskipun Anda melapor patuh.',
      type: 'konflik',
      read: false,
      created_at: new Date().toISOString(),
    });
    db.notifications.push({
      id: uid('N'),
      user_id: rtId,
      title: 'Konflik Baru di RT Anda',
      message: `Anomali terdeteksi pada KK ${citizen.full_name}. Perlu tindak lanjut.`,
      type: 'konflik',
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  saveDB();
  return { record, anomaly, konflik };
}

export function getKonflik(): Konflik[] {
  return loadDB()
    .konflik.slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getKonflikForRT(rtId: string): Konflik[] {
  return getKonflik().filter((k) => k.rt_id === rtId);
}

export function resolveKonflik(id: string, catatan: string): Konflik | null {
  const db = loadDB();
  const konflik = db.konflik.find((k) => k.id === id);
  if (!konflik) return null;
  konflik.status = 'SELESAI';
  konflik.catatan = catatan || konflik.catatan;
  saveDB();
  return konflik;
}

export function eskalasiKonflik(id: string, catatan: string): Konflik | null {
  const db = loadDB();
  const konflik = db.konflik.find((k) => k.id === id);
  if (!konflik) return null;
  konflik.status = 'ESKALASI';
  konflik.catatan = catatan || 'Sengketa dinaikkan ke DLH Kota Makassar untuk penanganan resmi.';
  
  // Notifikasi ke warga
  db.notifications.push({
    id: uid('N'),
    user_id: konflik.citizen_id,
    title: 'Anomali Dinaikkan ke DLH',
    message: 'Laporan sengketa pemilahan Anda telah dilimpahkan ke Dinas Lingkungan Hidup.',
    type: 'konflik',
    read: false,
    created_at: new Date().toISOString(),
  });

  saveDB();
  return konflik;
}

export function resolveKonflikDLH(id: string, decision: 'WARGA_VALID' | 'RT_VALID', catatan: string): Konflik | null {
  const db = loadDB();
  const konflik = db.konflik.find((k) => k.id === id);
  if (!konflik) return null;
  konflik.status = 'SELESAI';
  konflik.catatan = `Putusan Final DLH [${decision === 'WARGA_VALID' ? 'Laporan Warga Valid' : 'Sampling RT Valid'}]: ${catatan}`;

  const citizen = db.users.find((u) => u.id === konflik.citizen_id);
  if (citizen && decision === 'WARGA_VALID') {
    citizen.siri_points += 10;
  }

  saveDB();
  return konflik;
}

// ============================================================
// KELURAHAN & OVERVIEW (DLH)
// ============================================================

function riskLevelOf(score: number): RiskLevel {
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

export function getKelurahanStats(): KelurahanStat[] {
  const db = loadDB();
  return KELURAHAN_META.map((meta) => {
    const wargaCount = db.users.filter(
      (u) => u.role === 'WARGA' && u.kelurahan === meta.name
    ).length;
    const activeDisputes = db.konflik.filter(
      (k) => k.kelurahan === meta.name && k.status === 'AKTIF'
    ).length;
    const anomalyRate = wargaCount ? activeDisputes / wargaCount : 0;
    const compliance = BASE_COMPLIANCE[meta.name];
    const riskScore = Math.round((100 - compliance) * 0.7 + anomalyRate * 100 * 0.5);
    return {
      ...meta,
      compliance,
      anomalyRate,
      activeDisputes,
      wargaCount,
      riskScore,
      riskLevel: riskLevelOf(riskScore),
      residuTon: BASE_RESIDU[meta.name],
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

export function getOverview(): OverviewData {
  const stats = getKelurahanStats();
  const db = loadDB();
  const totalRT = db.users.filter((u) => u.role === 'RT_RW').length;
  const totalWarga = db.users.filter((u) => u.role === 'WARGA').length;
  const avgCompliance = Math.round(
    stats.reduce((sum, s) => sum + s.compliance, 0) / Math.max(stats.length, 1)
  );
  const activeAnomalies = db.konflik.filter((k) => k.status === 'AKTIF').length;

  // Tren kepatuhan 8 minggu (dibangkitkan dari rata-rata + noise deterministik)
  const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
    const week = new Date(Date.now() - (7 - i) * 7 * 86400000).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
    const drift = (i - 4) * 0.8;
    const noise = ((i * 7 + 3) % 5) * 0.5 - 1.2;
    const rate = Math.round(Math.min(100, Math.max(40, avgCompliance - 12 + drift + noise)));
    return { week, rate };
  });

  return { totalRT, totalWarga, avgCompliance, activeAnomalies, weeklyTrend };
}

// ============================================================
// INTERVENSI
// ============================================================

export function getIntervensi(): Intervensi[] {
  return loadDB()
    .intervensi.slice()
    .sort((a, b) => b.risk_score - a.risk_score);
}

export function updateIntervensi(
  id: string,
  patch: Partial<Pick<Intervensi, 'status' | 'hasil'>>
): Intervensi | null {
  const db = loadDB();
  const item = db.intervensi.find((i) => i.id === id);
  if (!item) return null;
  if (patch.status) item.status = patch.status;
  if (patch.hasil !== undefined) item.hasil = patch.hasil;
  saveDB();
  return item;
}

// ============================================================
// NOTIFIKASI
// ============================================================

export function getNotifications(userId: string): AppNotification[] {
  return loadDB()
    .notifications.filter((n) => n.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function unreadCount(userId: string): number {
  return loadDB().notifications.filter((n) => n.user_id === userId && !n.read).length;
}

export function markAllRead(userId: string) {
  const db = loadDB();
  db.notifications.forEach((n) => {
    if (n.user_id === userId) n.read = true;
  });
  saveDB();
}

// ============================================================
// MANIFESTS (PETUGAS PENGANGKUT & PENGAWAS TPA)
// ============================================================

export function getManifests(): PickupManifest[] {
  const db = loadDB();
  if (!db.manifests) db.manifests = [];
  return db.manifests.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createManifest(
  driverName: string,
  kelurahan: string,
  rt: string,
  wasteType: WasteType,
  qcStatus: 'CLEAN' | 'MIXED',
  qcPhoto: string | null,
  tonnageKg: number
): PickupManifest {
  const db = loadDB();
  if (!db.manifests) db.manifests = [];
  const manifest: PickupManifest = {
    id: uid('MAN'),
    truck_code: 'TRUK-04',
    driver_name: driverName,
    kelurahan,
    rt,
    waste_type: wasteType,
    status: 'EN_ROUTE',
    qc_status: qcStatus,
    qc_photo: qcPhoto,
    tonnage_kg: tonnageKg,
    created_at: new Date().toISOString(),
  };
  db.manifests.unshift(manifest);
  saveDB();
  return manifest;
}

export function inspectManifestTPA(
  id: string,
  approved: boolean,
  tonnageKg: number,
  tpaNotes: string
): PickupManifest | null {
  const db = loadDB();
  if (!db.manifests) db.manifests = [];
  const manifest = db.manifests.find((m) => m.id === id);
  if (!manifest) return null;

  manifest.status = approved ? 'APPROVED_TPA' : 'REJECTED_TPA';
  manifest.tonnage_kg = tonnageKg || manifest.tonnage_kg;
  manifest.tpa_notes = tpaNotes;

  if (!approved) {
    db.notifications.push({
      id: uid('N'),
      user_id: 'dlh',
      title: '🚨 Truk Ditolak di TPA Tamangapa',
      message: `Truk ${manifest.truck_code} (${manifest.kelurahan} RT ${manifest.rt}) ditolak di gerbang TPA: ${tpaNotes}`,
      type: 'konflik',
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  saveDB();
  return manifest;
}
