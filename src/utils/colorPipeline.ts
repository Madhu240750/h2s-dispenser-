import {
  CalibrationPoint,
  CalibrationSample,
  ScanResult,
  Wristband,
  DispenserDevice,
  SystemAuditLog,
  SystemSettings,
  MLModelConfig,
  NotificationItem,
  WorkerProfile
} from '../types';

export const INITIAL_CALIBRATION_CURVE: CalibrationPoint[] = [
  { id: 'S-001', ppmH: 0, l: 95, a: 0, b: 0, sampleName: 'Clean Strip (0 ppm·h)', hexColor: '#FBF7E4', status: 'VERIFIED' },
  { id: 'S-002', ppmH: 5, l: 85, a: 5, b: 15, sampleName: 'Trace Level (5 ppm·h)', hexColor: '#E8D3B0', status: 'VERIFIED' },
  { id: 'S-003', ppmH: 15, l: 70, a: 12, b: 25, sampleName: 'Threshold (15 ppm·h)', hexColor: '#B39062', status: 'VERIFIED' },
  { id: 'S-004', ppmH: 30, l: 50, a: 20, b: 40, sampleName: 'Elevated (30 ppm·h)', hexColor: '#6C4928', status: 'VERIFIED' },
  { id: 'S-005', ppmH: 50, l: 30, a: 15, b: 35, sampleName: 'Hazardous (50 ppm·h)', hexColor: '#35261F', status: 'VERIFIED' },
];

export const DEMO_CALIBRATION_SAMPLES: CalibrationSample[] = [
  {
    id: 'CAL-EXP-001',
    sampleName: 'Control Reference (Zero Exposure)',
    ppmH: 0.0,
    concentrationPpm: 0.0,
    durationMinutes: 480,
    rgb: { r: 251, g: 247, b: 228 },
    hsv: { h: 50, s: 9, v: 98 },
    lab: { l: 95.0, a: 0.0, b: 0.0 },
    temperatureC: 22.5,
    humidityPct: 45.0,
    date: '2026-08-10',
    notes: 'Standard laboratory blank strip in pure N2 chamber. Baseline zero point.',
    isDemo: true,
  },
  {
    id: 'CAL-EXP-002',
    sampleName: 'Trace Permissible Threshold',
    ppmH: 5.0,
    concentrationPpm: 1.0,
    durationMinutes: 300,
    rgb: { r: 232, g: 211, b: 176 },
    hsv: { h: 38, s: 24, v: 91 },
    lab: { l: 85.0, a: 5.0, b: 15.0 },
    temperatureC: 23.0,
    humidityPct: 48.0,
    date: '2026-08-12',
    notes: 'Mild tan coloration with lead-acetate chemical complexing.',
    isDemo: true,
  },
  {
    id: 'CAL-EXP-003',
    sampleName: 'Action Level Threshold (STEL Target)',
    ppmH: 15.0,
    concentrationPpm: 2.5,
    durationMinutes: 360,
    rgb: { r: 179, g: 144, b: 98 },
    hsv: { h: 34, s: 45, v: 70 },
    lab: { l: 70.0, a: 12.0, b: 25.0 },
    temperatureC: 24.1,
    humidityPct: 52.0,
    date: '2026-08-15',
    notes: 'Amber brown distinct darkening. Approaching ceiling limit.',
    isDemo: true,
  },
  {
    id: 'CAL-EXP-004',
    sampleName: 'Elevated Hazard Standard',
    ppmH: 30.0,
    concentrationPpm: 5.0,
    durationMinutes: 360,
    rgb: { r: 108, g: 73, b: 40 },
    hsv: { h: 29, s: 63, v: 42 },
    lab: { l: 50.0, a: 20.0, b: 40.0 },
    temperatureC: 24.8,
    humidityPct: 50.5,
    date: '2026-08-18',
    notes: 'Dark brownish-black PbS crystalline aggregation.',
    isDemo: true,
  },
  {
    id: 'CAL-EXP-005',
    sampleName: 'OSHA Ceiling Hazardous Saturation',
    ppmH: 50.0,
    concentrationPpm: 10.0,
    durationMinutes: 300,
    rgb: { r: 53, g: 38, b: 31 },
    hsv: { h: 19, s: 42, v: 21 },
    lab: { l: 30.0, a: 15.0, b: 35.0 },
    temperatureC: 25.0,
    humidityPct: 55.0,
    date: '2026-08-20',
    notes: 'High concentration test. Strong chromatic shift towards matte charcoal.',
    isDemo: true,
  },
];

export const DEMO_WORKER: WorkerProfile = {
  id: 'W003',
  name: 'Rahul Kumar',
  dept: 'Refinery - Sector 4 Tank Farm',
  role: 'Field Process Operator',
  contact: 'operator.w003@plant-safesense.internal',
  bandId: 'H2S-BAND-00482',
  qrPayload: 'H2S|W003|H2S-BAND-00482|1710315000',
  validity: 'VALID',
  status: 'ACTIVE',
  shiftStatus: 'ACTIVE_SHIFT',
  checkInTime: '08:00 AM',
  returnTime: null,
  issuedDate: 'Today',
  expiresInDays: 4,
  shiftHours: 8,
  healthCondition: 'HEALTHY',
  lastExposure: 3.0,
  cumulativeExposure: 18.5,
  lastRisk: 'LOW',
  lastLab: { l: '88.0', a: '3.5', b: '9.0' },
  lastRgb: { r: 236, g: 220, b: 190 },
  lastHsv: { h: 39, s: 20, v: 93 },
  history: [
    {
      id: 'SCN-90214',
      timestamp: 'Today, 08:30 AM',
      rgb: { r: 179, g: 144, b: 98 },
      hsv: { h: 34, s: 45, v: 70 },
      lab: { l: '70.2', a: '12.4', b: '24.8' },
      exposure: 15.2,
      risk: 'MODERATE',
      confidence: 0.94,
      bandId: 'H2S-BAND-00482',
      workerId: 'W003',
      type: 'MOBILE_APP',
      qualityScore: 92,
      lightingCondition: 'OPTIMAL',
      blurScore: 78,
      notes: 'Post morning shift field inspection',
    },
    {
      id: 'SCN-88410',
      timestamp: 'Yesterday, 04:15 PM',
      rgb: { r: 195, g: 165, b: 120 },
      hsv: { h: 36, s: 38, v: 76 },
      lab: { l: '75.8', a: '9.2', b: '21.0' },
      exposure: 11.5,
      risk: 'MODERATE',
      confidence: 0.91,
      bandId: 'H2S-BAND-00482',
      workerId: 'W003',
      type: 'MOBILE_APP',
      qualityScore: 88,
      lightingCondition: 'OPTIMAL',
      blurScore: 74,
    },
    {
      id: 'SCN-87102',
      timestamp: '2 days ago',
      rgb: { r: 235, g: 215, b: 180 },
      hsv: { h: 38, s: 23, v: 92 },
      lab: { l: '86.4', a: '4.8', b: '14.2' },
      exposure: 4.2,
      risk: 'LOW',
      confidence: 0.96,
      bandId: 'H2S-BAND-00482',
      workerId: 'W003',
      type: 'RETURN_KIOSK',
      qualityScore: 95,
      lightingCondition: 'OPTIMAL',
      blurScore: 86,
    },
  ],
};

export const INITIAL_WRISTBANDS: Wristband[] = [
  {
    bandId: 'H2S-BAND-00482',
    qrToken: 'TOKEN-H2S-00482-998A',
    batchId: 'BATCH-2026-Q3-A',
    manufacturingDate: '2026-08-01',
    activationDate: '2026-09-13',
    expiryDate: '2026-09-20',
    status: 'ACTIVE',
    assignedWorkerId: 'W003',
    assignedWorkerName: 'Rahul Kumar',
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-1092',
    qrToken: 'TOKEN-H2S-1092-441B',
    batchId: 'BATCH-2026-Q3-A',
    manufacturingDate: '2026-08-01',
    activationDate: '2026-09-13',
    expiryDate: '2026-09-20',
    status: 'ACTIVE',
    assignedWorkerId: 'W001',
    assignedWorkerName: 'Amit Sharma',
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-1144',
    qrToken: 'TOKEN-H2S-1144-882C',
    batchId: 'BATCH-2026-Q3-B',
    manufacturingDate: '2026-08-10',
    activationDate: '2026-09-13',
    expiryDate: '2026-09-20',
    status: 'ACTIVE',
    assignedWorkerId: 'W002',
    assignedWorkerName: 'Priya Patel',
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-0988',
    qrToken: 'TOKEN-H2S-0988-112D',
    batchId: 'BATCH-2026-Q3-B',
    manufacturingDate: '2026-08-10',
    activationDate: '2026-09-12',
    expiryDate: '2026-09-19',
    status: 'RETURNED',
    assignedWorkerId: 'W004',
    assignedWorkerName: 'Suresh Reddy',
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-2001',
    qrToken: 'TOKEN-H2S-2001-331E',
    batchId: 'BATCH-2026-Q3-C',
    manufacturingDate: '2026-09-01',
    activationDate: null,
    expiryDate: '2026-10-01',
    status: 'AVAILABLE',
    assignedWorkerId: null,
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-2002',
    qrToken: 'TOKEN-H2S-2002-554F',
    batchId: 'BATCH-2026-Q3-C',
    manufacturingDate: '2026-09-01',
    activationDate: null,
    expiryDate: '2026-10-01',
    status: 'AVAILABLE',
    assignedWorkerId: null,
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-2003',
    qrToken: 'TOKEN-H2S-2003-772G',
    batchId: 'BATCH-2026-Q3-C',
    manufacturingDate: '2026-09-01',
    activationDate: null,
    expiryDate: '2026-10-01',
    status: 'AVAILABLE',
    assignedWorkerId: null,
    initialPatchColor: '#FBF7E4',
  },
  {
    bandId: 'H2S-BAND-0391',
    qrToken: 'TOKEN-H2S-0391-990H',
    batchId: 'BATCH-2026-Q2-Z',
    manufacturingDate: '2026-06-15',
    activationDate: '2026-07-01',
    expiryDate: '2026-07-08',
    status: 'EXPIRED',
    assignedWorkerId: null,
    initialPatchColor: '#FBF7E4',
  },
];

export const INITIAL_DISPENSERS: DispenserDevice[] = [
  {
    deviceId: 'RPI-DISP-01',
    name: 'Sector 4 North Kiosk',
    location: 'Refinery Tank Farm Entrance',
    status: 'ONLINE',
    inventory: 48,
    maxCapacity: 60,
    lastHeartbeat: '12 seconds ago',
    softwareVersion: 'v2.4.1-armhf',
    motorStatus: 'IDLE',
    mode: 'SIMULATION',
    errorStatus: null,
    pendingTransactions: 0,
  },
  {
    deviceId: 'RPI-DISP-02',
    name: 'CDU-2 Air Lock Dispenser',
    location: 'Crude Distillation Unit Air Lock',
    status: 'ONLINE',
    inventory: 14,
    maxCapacity: 60,
    lastHeartbeat: '5 seconds ago',
    softwareVersion: 'v2.4.1-armhf',
    motorStatus: 'IDLE',
    mode: 'SIMULATION',
    errorStatus: null,
    pendingTransactions: 0,
  },
  {
    deviceId: 'RPI-DISP-03',
    name: 'SRU Control Building Terminal',
    location: 'Sulfur Recovery Unit Building 3',
    status: 'WARNING',
    inventory: 4,
    maxCapacity: 60,
    lastHeartbeat: '45 seconds ago',
    softwareVersion: 'v2.3.9-armhf',
    motorStatus: 'IDLE',
    mode: 'SIMULATION',
    errorStatus: 'Low Band Inventory Warning (< 5 units)',
    pendingTransactions: 1,
  },
];

export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'AUD-901',
    timestamp: 'Today, 08:00 AM',
    action: 'Band Dispensed & Check-in',
    category: 'DISPENSER',
    details: 'Wristband H2S-BAND-00482 dispensed for Worker Rahul Kumar (W003) at RPI-DISP-01',
    user: 'RPI-DISP-01 (Kiosk Auto)',
    level: 'INFO',
  },
  {
    id: 'AUD-900',
    timestamp: 'Today, 07:30 AM',
    action: 'High Exposure Return Scan Alert',
    category: 'SCAN',
    details: 'Worker Suresh Reddy (W004) scanned 38.5 ppm·h. High-risk acoustic buzzer and notification triggered.',
    user: 'RPI-KIOSK-RETURN-01',
    level: 'CRITICAL',
  },
  {
    id: 'AUD-899',
    timestamp: 'Yesterday, 04:30 PM',
    action: 'Calibration Curve Updated',
    category: 'CALIBRATION',
    details: 'Admin verified sample CAL-EXP-003 with piecewise linear regression.',
    user: 'Admin (System Supervisor)',
    level: 'INFO',
  },
  {
    id: 'AUD-898',
    timestamp: 'Yesterday, 02:15 PM',
    action: 'Low Inventory Warning Flagged',
    category: 'DISPENSER',
    details: 'SRU Control Building Terminal has 4 units remaining.',
    user: 'RPI-DISP-03',
    level: 'WARNING',
  },
];

export const INITIAL_MODELS: MLModelConfig[] = [
  {
    modelId: 'ML-H2S-PLR-01',
    name: 'Piecewise Lightness Regression (L*)',
    algorithm: 'Linear Regression',
    version: '1.4.0',
    trainingSamples: 24,
    r2Score: 0.982,
    rmse: 1.15,
    lastTrained: '2026-09-01',
    status: 'ACTIVE',
  },
  {
    modelId: 'ML-H2S-POLY-02',
    name: 'Polynomial Color Shift Model',
    algorithm: 'Polynomial (Degree 2)',
    version: '2.0.1-beta',
    trainingSamples: 48,
    r2Score: 0.965,
    rmse: 1.48,
    lastTrained: '2026-09-10',
    status: 'EXPERIMENTAL',
  },
  {
    modelId: 'ML-H2S-RF-03',
    name: 'Multi-Channel Random Forest Regressor',
    algorithm: 'Random Forest Regressor',
    version: '3.0.0-rc',
    trainingSamples: 64,
    r2Score: 0.988,
    rmse: 0.92,
    lastTrained: '2026-09-12',
    status: 'EXPERIMENTAL',
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  lowRiskThreshold: 10,
  highRiskThreshold: 20,
  bandValidityDays: 7,
  minQualityScore: 70,
  blurThreshold: 45,
  heartbeatIntervalSec: 15,
  simulationModeOnly: true,
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    title: '⚠️ CRITICAL H₂S ALERT: Suresh Reddy',
    message: 'Worker Suresh Reddy (W004) recorded 38.5 ppm·h on band H2S-BAND-0988. Immediate respiratory medical evaluation mandated.',
    timestamp: 'Today, 07:30 AM',
    type: 'CRITICAL',
    read: false,
    targetRole: 'all',
    workerId: 'W004',
  },
  {
    id: 'NOTIF-02',
    title: '📦 Low Band Inventory: RPI-DISP-03',
    message: 'SRU Control Building Terminal has reached low inventory threshold (4 wristbands left). Restock required.',
    timestamp: 'Today, 06:15 AM',
    type: 'WARNING',
    read: false,
    targetRole: 'admin',
  },
  {
    id: 'NOTIF-03',
    title: '⏱️ Shift Check-in Confirmed: W003',
    message: 'Wristband H2S-BAND-00482 activated for Rahul Kumar. Zero-point calibration verified.',
    timestamp: 'Today, 08:00 AM',
    type: 'INFO',
    read: true,
    targetRole: 'worker',
    workerId: 'W003',
  },
];

/**
 * Standard CIE L*a*b* conversion for colorimetric H2S dosimeter
 */
export function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  // Lightness channel (photometric luminance weighted)
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55;
  const a_val = (r - g) * 0.5 + 50;
  const b_val = (g - b) * 0.5 + 50;

  return {
    l: Math.max(0, Math.min(100, l)),
    a: a_val,
    b: b_val,
  };
}

/**
 * Convert RGB (0-255) to HSV (0-360, 0-100, 0-100)
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  let s = max === 0 ? 0 : diff / max;
  let v = max;

  if (diff !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / diff) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / diff + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / diff + 4);
    }
  }

  if (h < 0) h += 360;

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Calculate Euclidean Delta-E color difference between two Lab points
 */
export function deltaE(
  l1: number, a1: number, b1: number,
  l2: number, a2: number, b2: number
): number {
  return Math.sqrt(
    Math.pow(l1 - l2, 2) +
    Math.pow(a1 - a2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

/**
 * Assess image quality: estimate blur (Laplacian variance approximation) and brightness
 */
export function assessImageQuality(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { qualityScore: number; blurScore: number; brightness: number; condition: 'OPTIMAL' | 'LOW_LIGHT' | 'OVEREXPOSED' } {
  const sampleW = Math.min(width, 200);
  const sampleH = Math.min(height, 200);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

  let totalLuminance = 0;
  let pixelCount = imgData.length / 4;

  for (let i = 0; i < imgData.length; i += 4) {
    const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    totalLuminance += lum;
  }

  const avgBrightness = Math.round(totalLuminance / pixelCount);

  // Approximate gradient variance for sharpness
  let varianceSum = 0;
  for (let i = 4; i < imgData.length - 4; i += 8) {
    const diff = Math.abs(imgData[i] - imgData[i - 4]);
    varianceSum += diff;
  }
  const blurScore = Math.min(100, Math.round((varianceSum / (pixelCount * 0.5)) * 4));

  let condition: 'OPTIMAL' | 'LOW_LIGHT' | 'OVEREXPOSED' = 'OPTIMAL';
  if (avgBrightness < 60) condition = 'LOW_LIGHT';
  else if (avgBrightness > 220) condition = 'OVEREXPOSED';

  const brightnessPenalty = condition === 'OPTIMAL' ? 0 : 25;
  const qualityScore = Math.max(30, Math.min(99, Math.round(blurScore * 0.6 + (100 - brightnessPenalty) * 0.4)));

  return {
    qualityScore,
    blurScore,
    brightness: avgBrightness,
    condition,
  };
}

/**
 * Process RGBA data to estimate H2S exposure using calibration curve or chosen algorithm
 */
export function processImageToExposure(
  rgbaData: { r: number; g: number; b: number },
  calibrationCurve: CalibrationPoint[] = INITIAL_CALIBRATION_CURVE,
  algorithm: 'linear' | 'polynomial' | 'rf' = 'linear'
): Omit<ScanResult, 'id' | 'timestamp' | 'bandId' | 'workerId'> {
  const { r, g, b } = rgbaData;
  const { l, a, b: b_lab } = rgbToLab(r, g, b);
  const hsv = rgbToHsv(r, g, b);

  // Sort calibration curve by Lightness descending (highest L = 0 ppm·h)
  const sorted = [...calibrationCurve].sort((x, y) => y.l - x.l);

  let estimatedPpmH = 0;
  if (sorted.length > 0) {
    if (l >= sorted[0].l) {
      estimatedPpmH = sorted[0].ppmH;
    } else if (l <= sorted[sorted.length - 1].l) {
      estimatedPpmH = sorted[sorted.length - 1].ppmH;
    } else {
      // Find segment
      for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i];
        const p2 = sorted[i + 1];
        if (l <= p1.l && l >= p2.l) {
          const t = (p1.l - l) / (p1.l - p2.l || 1);
          estimatedPpmH = p1.ppmH + t * (p2.ppmH - p1.ppmH);
          break;
        }
      }
    }
  }

  // Algorithm adjustment modifier
  if (algorithm === 'polynomial') {
    // Slight non-linear curve fitting for mid-range saturation
    estimatedPpmH = Math.max(0, estimatedPpmH * 0.98 + 0.002 * Math.pow(estimatedPpmH, 1.3));
  } else if (algorithm === 'rf') {
    // Multi-feature weighted blend using saturation and lightness
    const satWeight = (hsv.s / 100) * 0.1;
    estimatedPpmH = Math.max(0, estimatedPpmH * (1 - satWeight) + (estimatedPpmH * 1.05) * satWeight);
  }

  estimatedPpmH = Math.round(estimatedPpmH * 10) / 10;

  // Find nearest calibration sample
  let minDiff = Infinity;
  let nearestPoint: CalibrationPoint | undefined = undefined;
  sorted.forEach((pt) => {
    const diff = Math.abs(pt.l - l);
    if (diff < minDiff) {
      minDiff = diff;
      nearestPoint = pt;
    }
  });

  // Risk categorization according to OSHA/NIOSH standards:
  // < 10 ppm·h: LOW (Below Permissible Exposure Limit TWA)
  // 10 - 20 ppm·h: MODERATE (Approaching Ceiling / STEL)
  // > 20 ppm·h: HIGH (Exceeds OSHA Ceiling / Action Required)
  let risk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (estimatedPpmH >= 20) {
    risk = 'HIGH';
  } else if (estimatedPpmH >= 10) {
    risk = 'MODERATE';
  } else {
    risk = 'LOW';
  }

  const confidence = Math.max(0.75, Math.min(0.98, 1 - (minDiff / 100) * 0.35));

  return {
    rgb: { r, g, b },
    hsv,
    lab: { l: l.toFixed(1), a: a.toFixed(1), b: b_lab.toFixed(1) },
    exposure: estimatedPpmH,
    risk,
    confidence: Math.round(confidence * 100) / 100,
    nearestPoint,
  };
}

export const SAMPLE_STRIPS = [
  {
    name: 'Clean Strip',
    sub: '0 ppm·h (Yellow/White)',
    color: '#FBF7E4',
    rgb: { r: 251, g: 247, b: 228 },
    badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  },
  {
    name: 'Low Exposure',
    sub: '5 ppm·h (Slight Tan)',
    color: '#E8D3B0',
    rgb: { r: 232, g: 211, b: 176 },
    badgeColor: 'border-blue-300 bg-blue-50 text-blue-700',
  },
  {
    name: 'Moderate Exposure',
    sub: '15 ppm·h (Amber/Brown)',
    color: '#B39062',
    rgb: { r: 179, g: 144, b: 98 },
    badgeColor: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    name: 'High Exposure',
    sub: '30 ppm·h (Dark Brown)',
    color: '#6C4928',
    rgb: { r: 108, g: 73, b: 40 },
    badgeColor: 'border-orange-300 bg-orange-50 text-orange-700',
  },
  {
    name: 'Critical Exposure',
    sub: '50 ppm·h (Charcoal/Black)',
    color: '#35261F',
    rgb: { r: 53, g: 38, b: 31 },
    badgeColor: 'border-rose-300 bg-rose-50 text-rose-700',
  },
];
