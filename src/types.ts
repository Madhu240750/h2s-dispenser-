export type HealthCondition = 'HEALTHY' | 'UNDER_OBSERVATION' | 'HAZARD_ALERT';
export type ShiftStatus = 'ACTIVE_SHIFT' | 'COMPLETED_SHIFT' | 'OFF_DUTY';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type UserRole = 'worker' | 'supervisor' | 'admin';
export type ViewMode = 'worker_app' | 'supervisor_portal' | 'admin_suite' | 'rpi_terminal' | 'architecture_view';
export type ActiveTab = 'dashboard' | 'scan' | 'history' | 'band_info' | 'profile' | 'notifications';
export type AdminTab =
  | 'overview'
  | 'workers'
  | 'wristbands'
  | 'dispensers'
  | 'calibration'
  | 'ml_models'
  | 'audit_logs'
  | 'settings'
  | 'diagnostics'
  | 'beginner_guide';

export type BandStatus = 'AVAILABLE' | 'ASSIGNED' | 'ACTIVE' | 'EXPIRED' | 'RETURNED' | 'DISABLED';

export interface Wristband {
  bandId: string;
  qrToken: string;
  batchId: string;
  manufacturingDate: string;
  activationDate: string | null;
  expiryDate: string;
  status: BandStatus;
  assignedWorkerId: string | null;
  assignedWorkerName?: string;
  initialPatchColor?: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  dept: string;
  role?: string;
  contact?: string;
  bandId?: string | null;
  qrPayload?: string | null;
  validity?: 'VALID' | 'EXPIRED' | 'PENDING';
  status: 'ACTIVE' | 'INACTIVE';
  shiftStatus?: ShiftStatus;
  checkInTime?: string | null;
  returnTime?: string | null;
  issuedDate?: string;
  expiresInDays?: number;
  shiftHours?: number;
  healthCondition: HealthCondition;
  lastExposure: number;
  cumulativeExposure: number;
  lastRisk: RiskLevel;
  lastLab?: { l: string; a: string; b: string } | null;
  lastRgb?: { r: number; g: number; b: number } | null;
  lastHsv?: { h: number; s: number; v: number } | null;
  history?: ScanResult[];
}

export interface CalibrationPoint {
  id: string;
  ppmH: number;
  l: number;
  a: number;
  b: number;
  sampleName?: string;
  hexColor?: string;
  status: 'VERIFIED' | 'DEMO DATA' | 'CUSTOM';
}

export interface CalibrationSample {
  id: string;
  sampleName: string;
  ppmH: number;
  concentrationPpm: number;
  durationMinutes: number;
  rgb: { r: number; g: number; b: number };
  hsv: { h: number; s: number; v: number };
  lab: { l: number; a: number; b: number };
  temperatureC: number;
  humidityPct: number;
  date: string;
  notes: string;
  isDemo: boolean;
}

export interface MLModelConfig {
  modelId: string;
  name: string;
  algorithm: 'Linear Regression' | 'Polynomial (Degree 2)' | 'Random Forest Regressor' | 'Support Vector Regressor';
  version: string;
  trainingSamples: number;
  r2Score: number;
  rmse: number;
  lastTrained: string;
  status: 'ACTIVE' | 'EXPERIMENTAL';
}

export interface DispenserDevice {
  deviceId: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  inventory: number;
  maxCapacity: number;
  lastHeartbeat: string;
  softwareVersion: string;
  motorStatus: 'IDLE' | 'DISPENSING' | 'JAMMED' | 'FAULT';
  mode: 'SIMULATION' | 'GPIO';
  errorStatus: string | null;
  pendingTransactions: number;
}

export interface DispenserTransaction {
  transactionId: string;
  deviceId: string;
  workerId: string;
  workerName: string;
  bandId: string;
  type: 'DISPENSE' | 'RETURN';
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING_SYNC';
  error?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'AUTH' | 'DISPENSER' | 'BAND' | 'SCAN' | 'CALIBRATION' | 'SYSTEM' | 'SECURITY';
  details: string;
  user: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SystemSettings {
  lowRiskThreshold: number; // ppm·h (default 10)
  highRiskThreshold: number; // ppm·h (default 20)
  bandValidityDays: number; // days (default 7)
  minQualityScore: number; // % (default 70)
  blurThreshold: number; // sharpness score (default 45)
  heartbeatIntervalSec: number; // seconds (default 15)
  simulationModeOnly: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  read: boolean;
  targetRole: 'all' | 'worker' | 'supervisor' | 'admin';
  workerId?: string;
}

export interface ScanResult {
  id: string;
  timestamp: string;
  rgb: { r: number; g: number; b: number };
  hsv?: { h: number; s: number; v: number };
  lab: { l: string; a: string; b: string };
  exposure: number;
  risk: RiskLevel;
  confidence: number;
  bandId: string;
  workerId: string;
  nearestPoint?: CalibrationPoint;
  notes?: string;
  type?: 'RETURN_KIOSK' | 'MOBILE_APP';
  qualityScore?: number;
  lightingCondition?: 'OPTIMAL' | 'LOW_LIGHT' | 'OVEREXPOSED';
  blurScore?: number;
}

export type ScanState = 'idle' | 'capturing' | 'analyzing' | 'result';

export interface HardwareEvent {
  eventType: 'BAND_DISPENSED' | 'SHIFT_COMPLETED_SCAN' | 'EMERGENCY_EVAC' | 'CONNECTED';
  workerId?: string;
  workerName?: string;
  dept?: string;
  bandId?: string;
  stationId?: string;
  checkInTime?: string;
  returnTime?: string;
  exposure?: number;
  risk?: RiskLevel;
  healthCondition?: HealthCondition;
  requiresEmergencyAlert?: boolean;
}
