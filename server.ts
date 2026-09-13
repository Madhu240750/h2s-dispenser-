import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database for Workers, Shifts, and Scans
interface WorkerRecord {
  id: string;
  name: string;
  dept: string;
  role: string;
  status: 'ACTIVE_SHIFT' | 'COMPLETED_SHIFT' | 'OFF_DUTY';
  bandId: string | null;
  qrPayload: string | null;
  checkInTime: string | null;
  returnTime: string | null;
  healthCondition: 'HEALTHY' | 'UNDER_OBSERVATION' | 'HAZARD_ALERT';
  lastExposure: number;
  lastRisk: 'LOW' | 'MODERATE' | 'HIGH';
  lastLab: { l: string; a: string; b: string } | null;
  lastRgb: { r: number; g: number; b: number } | null;
  history: Array<{
    id: string;
    timestamp: string;
    exposure: number;
    risk: 'LOW' | 'MODERATE' | 'HIGH';
    lab: { l: string; a: string; b: string };
    rgb?: { r: number; g: number; b: number };
    bandId: string;
    type: 'RETURN_KIOSK' | 'MOBILE_APP';
  }>;
}

const workers: Record<string, WorkerRecord> = {
  W001: {
    id: 'W001',
    name: 'Amit Sharma',
    dept: 'Crude Distillation (CDU-2)',
    role: 'Process Operator',
    status: 'ACTIVE_SHIFT',
    bandId: 'H2S-BAND-1092',
    qrPayload: 'H2S|W001|H2S-BAND-1092|1710310000',
    checkInTime: '06:45 AM',
    returnTime: null,
    healthCondition: 'HEALTHY',
    lastExposure: 2.5,
    lastRisk: 'LOW',
    lastLab: { l: '91.2', a: '2.1', b: '6.4' },
    lastRgb: { r: 242, g: 232, b: 205 },
    history: [
      {
        id: 'SCN-1001',
        timestamp: 'Yesterday 03:30 PM',
        exposure: 3.2,
        risk: 'LOW',
        lab: { l: '89.4', a: '3.0', b: '8.2' },
        rgb: { r: 242, g: 232, b: 205 },
        bandId: 'H2S-BAND-1010',
        type: 'RETURN_KIOSK',
      },
    ],
  },
  W002: {
    id: 'W002',
    name: 'Priya Patel',
    dept: 'Hydrocracker Block B',
    role: 'Maintenance Technician',
    status: 'ACTIVE_SHIFT',
    bandId: 'H2S-BAND-1144',
    qrPayload: 'H2S|W002|H2S-BAND-1144|1710312000',
    checkInTime: '07:15 AM',
    returnTime: null,
    healthCondition: 'UNDER_OBSERVATION',
    lastExposure: 14.8,
    lastRisk: 'MODERATE',
    lastLab: { l: '71.5', a: '11.8', b: '23.4' },
    lastRgb: { r: 182, g: 148, b: 102 },
    history: [
      {
        id: 'SCN-1002',
        timestamp: 'Yesterday 04:00 PM',
        exposure: 14.8,
        risk: 'MODERATE',
        lab: { l: '71.5', a: '11.8', b: '23.4' },
        rgb: { r: 182, g: 148, b: 102 },
        bandId: 'H2S-BAND-1144',
        type: 'RETURN_KIOSK',
      },
    ],
  },
  W003: {
    id: 'W003',
    name: 'Rahul Kumar',
    dept: 'Refinery - Sector 4 Tank Farm',
    role: 'Field Operator',
    status: 'ACTIVE_SHIFT',
    bandId: 'H2S-BAND-00482',
    qrPayload: 'H2S|W003|H2S-BAND-00482|1710315000',
    checkInTime: '08:00 AM',
    returnTime: null,
    healthCondition: 'HEALTHY',
    lastExposure: 3.0,
    lastRisk: 'LOW',
    lastLab: { l: '88.0', a: '3.5', b: '9.0' },
    lastRgb: { r: 236, g: 220, b: 190 },
    history: [
      {
        id: 'SCN-1003',
        timestamp: 'Yesterday 04:45 PM',
        exposure: 4.5,
        risk: 'LOW',
        lab: { l: '86.1', a: '4.2', b: '12.0' },
        rgb: { r: 236, g: 220, b: 190 },
        bandId: 'H2S-BAND-00350',
        type: 'RETURN_KIOSK',
      },
    ],
  },
  W004: {
    id: 'W004',
    name: 'Suresh Reddy',
    dept: 'Sulfur Recovery Unit (SRU-1)',
    role: 'Lead Gas Inspector',
    status: 'COMPLETED_SHIFT',
    bandId: 'H2S-BAND-0988',
    qrPayload: 'H2S|W004|H2S-BAND-0988|1710290000',
    checkInTime: '11:30 PM (Night)',
    returnTime: '07:30 AM',
    healthCondition: 'HAZARD_ALERT',
    lastExposure: 38.5,
    lastRisk: 'HIGH',
    lastLab: { l: '42.0', a: '18.2', b: '36.0' },
    lastRgb: { r: 85, g: 58, b: 32 },
    history: [
      {
        id: 'SCN-1004',
        timestamp: 'Today 07:30 AM',
        exposure: 38.5,
        risk: 'HIGH',
        lab: { l: '42.0', a: '18.2', b: '36.0' },
        rgb: { r: 85, g: 58, b: 32 },
        bandId: 'H2S-BAND-0988',
        type: 'RETURN_KIOSK',
      },
    ],
  },
  W005: {
    id: 'W005',
    name: 'Vikram Singh',
    dept: 'Flaring & Venting Systems',
    role: 'Safety Marshall',
    status: 'OFF_DUTY',
    bandId: null,
    qrPayload: null,
    checkInTime: null,
    returnTime: null,
    healthCondition: 'HEALTHY',
    lastExposure: 0,
    lastRisk: 'LOW',
    lastLab: { l: '92.0', a: '1.5', b: '5.0' },
    lastRgb: { r: 240, g: 225, b: 195 },
    history: [],
  },
};

// Connected SSE Clients
const sseClients: Array<(data: string) => void> = [];

function broadcastEvent(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((send) => {
    try {
      send(message);
    } catch {
      // client disconnected
    }
  });
}

// Health check endpoint for ingress
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), service: 'h2s-safesense' });
});

// REST APIs
// 1. Get all workers & plant summary
app.get('/api/workers', (req, res) => {
  const workerList = Object.values(workers);
  const total = workerList.length;
  const activeShifts = workerList.filter((w) => w.status === 'ACTIVE_SHIFT').length;
  const highRiskCount = workerList.filter((w) => w.healthCondition === 'HAZARD_ALERT').length;
  const moderateCount = workerList.filter((w) => w.healthCondition === 'UNDER_OBSERVATION').length;
  const healthyCount = workerList.filter((w) => w.healthCondition === 'HEALTHY').length;

  res.json({
    workers: workerList,
    stats: {
      total,
      activeShifts,
      highRiskCount,
      moderateCount,
      healthyCount,
    },
  });
});

// 2. Get specific worker profile
app.get('/api/workers/:id', (req, res) => {
  const worker = workers[req.params.id];
  if (!worker) {
    res.status(404).json({ error: 'Worker not found' });
    return;
  }
  res.json(worker);
});

// 3. Raspberry Pi Dispenser endpoint (Check-in & Dispense Wristband)
app.post('/api/dispense', (req, res) => {
  const { workerId, stationId = 'RPI-DISPENSER-SECTOR4' } = req.body;
  if (!workerId || !workers[workerId]) {
    res.status(400).json({ error: 'Invalid workerId provided' });
    return;
  }

  const worker = workers[workerId];
  const newBandId = `H2S-BAND-${Math.floor(10000 + Math.random() * 90000)}`;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const qrPayload = `H2S|${worker.id}|${newBandId}|${Date.now()}`;

  worker.status = 'ACTIVE_SHIFT';
  worker.bandId = newBandId;
  worker.qrPayload = qrPayload;
  worker.checkInTime = nowStr;
  worker.returnTime = null;
  // Fresh band starts clean
  worker.healthCondition = 'HEALTHY';
  worker.lastExposure = 0;
  worker.lastRisk = 'LOW';

  const eventData = {
    eventType: 'BAND_DISPENSED',
    workerId: worker.id,
    workerName: worker.name,
    bandId: newBandId,
    stationId,
    checkInTime: nowStr,
    qrPayload,
  };

  broadcastEvent('BAND_DISPENSED', eventData);

  res.json({
    success: true,
    message: `Wristband ${newBandId} dispensed for worker ${worker.name}`,
    worker,
    stationId,
  });
});

// 4. Raspberry Pi Return Kiosk endpoint (Optical scan + QR scan after shift)
app.post('/api/return-scan', (req, res) => {
  const {
    qrPayload,
    workerId: reqWorkerId,
    bandId: reqBandId,
    rgb,
    lab,
    exposure,
    risk,
    stationId = 'RPI-KIOSK-RETURN-01',
  } = req.body;

  // Resolve worker from QR or direct ID
  let targetWorker: WorkerRecord | null = null;
  let resolvedBandId = reqBandId || '';

  if (qrPayload && qrPayload.includes('|')) {
    const parts = qrPayload.split('|');
    const qWorkerId = parts[1];
    const qBandId = parts[2];
    if (workers[qWorkerId]) {
      targetWorker = workers[qWorkerId];
      resolvedBandId = qBandId;
    }
  }

  if (!targetWorker && reqWorkerId && workers[reqWorkerId]) {
    targetWorker = workers[reqWorkerId];
  }

  if (!targetWorker) {
    res.status(400).json({ error: 'Worker could not be identified from band QR or payload' });
    return;
  }

  const calculatedExposure = typeof exposure === 'number' ? exposure : 15;
  const calculatedRisk =
    risk || (calculatedExposure >= 20 ? 'HIGH' : calculatedExposure >= 10 ? 'MODERATE' : 'LOW');

  let condition: 'HEALTHY' | 'UNDER_OBSERVATION' | 'HAZARD_ALERT' = 'HEALTHY';
  if (calculatedRisk === 'HIGH') {
    condition = 'HAZARD_ALERT';
  } else if (calculatedRisk === 'MODERATE') {
    condition = 'UNDER_OBSERVATION';
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const scanId = `SCN-${Math.floor(100000 + Math.random() * 900000)}`;

  targetWorker.status = 'COMPLETED_SHIFT';
  targetWorker.returnTime = nowStr;
  targetWorker.healthCondition = condition;
  targetWorker.lastExposure = calculatedExposure;
  targetWorker.lastRisk = calculatedRisk;
  if (lab) targetWorker.lastLab = lab;
  if (rgb) targetWorker.lastRgb = rgb;

  const scanEntry = {
    id: scanId,
    timestamp: nowStr,
    exposure: calculatedExposure,
    risk: calculatedRisk,
    lab: lab || { l: '60.0', a: '15.0', b: '25.0' },
    rgb: rgb || { r: 180, g: 150, b: 100 },
    bandId: resolvedBandId || targetWorker.bandId || 'UNKNOWN',
    type: 'RETURN_KIOSK' as const,
  };

  targetWorker.history.unshift(scanEntry);

  const eventData = {
    eventType: 'SHIFT_COMPLETED_SCAN',
    workerId: targetWorker.id,
    workerName: targetWorker.name,
    dept: targetWorker.dept,
    bandId: scanEntry.bandId,
    exposure: calculatedExposure,
    risk: calculatedRisk,
    healthCondition: condition,
    returnTime: nowStr,
    stationId,
    requiresEmergencyAlert: calculatedRisk === 'HIGH',
  };

  broadcastEvent('SHIFT_COMPLETED_SCAN', eventData);

  res.json({
    success: true,
    message: `Return scan processed for ${targetWorker.name}. Exposure: ${calculatedExposure} ppm·h (${calculatedRisk})`,
    worker: targetWorker,
    scan: scanEntry,
  });
});

// 5. SSE stream for real-time synchronization with Host and Worker clients
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: string) => {
    res.write(data);
  };

  sseClients.push(send);

  // Send initial ping
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ message: 'Connected to H2S SafeSense Realtime Bus' })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(send);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 6. Reset demo data endpoint
app.post('/api/reset-demo', (req, res) => {
  // Resets W003 to clean state
  const w = workers['W003'];
  if (w) {
    w.status = 'ACTIVE_SHIFT';
    w.bandId = 'H2S-BAND-00482';
    w.healthCondition = 'HEALTHY';
    w.lastExposure = 2.0;
    w.lastRisk = 'LOW';
    w.checkInTime = '08:00 AM';
    w.returnTime = null;
  }
  broadcastEvent('DATA_RESET', { message: 'Reset demo data' });
  res.json({ success: true });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`H2S SafeSense Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
