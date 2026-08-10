export type UserRole = 'WARGA' | 'RT_RW' | 'KADER_DLH' | 'ADMIN_DLH';

export type ReportStatus =
  | 'SUBMITTED'
  | 'SAMPLED_FOR_RT'
  | 'AUTO_PASS'
  | 'APPROVED_BY_RT'
  | 'REJECTED_BY_RT'
  | 'ESCALATED_KADER'
  | 'FINAL_APPROVED'
  | 'FINAL_REJECTED';

export interface Profile {
  id: string;
  nik: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  kecamatan: string;
  kelurahan: string;
  rt: string;
  rw: string;
  rt_code: string;
  siri_points: number;
  created_at: string;
}

export interface WasteReport {
  id: string;
  citizen_id: string;
  rt_id?: string;
  kader_id?: string;
  photo_url: string;
  notes?: string;
  status: ReportStatus;
  is_disputed: boolean;
  is_anomaly: boolean;
  created_at: string;
  citizen_profile?: Profile;
}

export interface HouseholdRiskScore {
  household_id: string;
  compliance_30d: number;
  violations_30d: number;
  zone_weight: number;
  risk_score: number;
  consecutive_rejections: number;
  last_evaluated_at: string;
}
