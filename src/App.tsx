import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  Cpu,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Bell,
  BellRing,
  Volume2,
  Sparkles,
  Settings as SettingsIcon,
  BookOpen,
  Info,
  Radio,
  ExternalLink
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';

import {
  WorkerProfile,
  Wristband,
  DispenserDevice,
  CalibrationPoint,
  CalibrationSample,
  MLModelConfig,
  SystemAuditLog,
  SystemSettings,
  NotificationItem,
  ScanResult,
  ViewMode,
  HealthCondition,
  RiskLevel
} from './types';

import { INITIAL_10_WORKERS, INITIAL_20_WRISTBANDS } from './data/mockEcosystem';
import {
  INITIAL_CALIBRATION_CURVE,
  DEMO_CALIBRATION_SAMPLES,
  INITIAL_DISPENSERS,
  INITIAL_MODELS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS
} from './utils/colorPipeline';

import { WorkerApp } from './components/WorkerApp';
import { HostSafetyStation } from './components/HostSafetyStation';
import { AdminSuite } from './components/AdminSuite';
import { RaspberryPiKiosk } from './components/RaspberryPiKiosk';
import { HighRiskAlertBanner, AlertData } from './components/HighRiskAlertBanner';
import {
  requestNotificationPermission,
  triggerHighRiskNotification,
  playHazardAlarmSound
} from './utils/notificationSystem';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const App: React.FC = () => {
  // Global View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('worker_app');

  // Core Data States
  const [workers, setWorkers] = useState<WorkerProfile[]>(INITIAL_10_WORKERS);
  const [currentWorkerId, setCurrentWorkerId] = useState<string>('W003');
  const [wristbands, setWristbands] = useState<Wristband[]>(INITIAL_20_WRISTBANDS);
  const [dispensers, setDispensers] = useState<DispenserDevice[]>(INITIAL_DISPENSERS);
  const [calibrationCurve, setCalibrationCurve] = useState<CalibrationPoint[]>(INITIAL_CALIBRATION_CURVE);
  const [calibrationSamples, setCalibrationSamples] = useState<CalibrationSample[]>(DEMO_CALIBRATION_SAMPLES);
  const [mlModels, setMlModels] = useState<MLModelConfig[]>(INITIAL_MODELS);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Notification and Emergency Alert State
  const [notifPermissionGranted, setNotifPermissionGranted] = useState<boolean>(false);
  const [highRiskAlert, setHighRiskAlert] = useState<AlertData | null>(null);

  // Selected Worker profile for mobile app view
  const activeWorker = workers.find((w) => w.id === currentWorkerId) || workers[0];

  // Fetch workers from backend on load
  const loadWorkersFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/workers');
      if (res.ok) {
        const data = await res.json();
        if (data.workers && Array.isArray(data.workers)) {
          setWorkers((prev) => {
            const map = new Map<string, WorkerProfile>(prev.map((w) => [w.id, w]));
            data.workers.forEach((bw: any) => {
              const existing = map.get(bw.id);
              if (bw.history && Array.isArray(bw.history)) {
                bw.history = bw.history.map((h: any) => ({
                  ...h,
                  rgb: h.rgb || { r: 230, g: 210, b: 180 },
                  lab: h.lab || { l: '85.0', a: '4.0', b: '10.0' },
                }));
              }
              const lastRgb = bw.lastRgb || existing?.lastRgb || { r: 236, g: 220, b: 190 };
              const lastLab = bw.lastLab || existing?.lastLab || { l: '88.0', a: '3.0', b: '8.0' };
              const merged: WorkerProfile = Object.assign({}, existing, bw, {
                shiftStatus: bw.status || bw.shiftStatus,
                lastRgb,
                lastLab,
              });
              map.set(bw.id, merged);
            });
            return Array.from(map.values());
          });
        }
      }
    } catch {
      // Backend not yet running or local mode
    }
  }, []);

  // Listen to Server-Sent Events (SSE) from /api/events for instant sync
  useEffect(() => {
    loadWorkersFromBackend();

    if (typeof window !== 'undefined') {
      try {
        if ('Notification' in window) {
          setNotifPermissionGranted(Notification.permission === 'granted');
        }
      } catch {
        // Restricted in iframe
      }
    }

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('BAND_DISPENSED', (e: MessageEvent) => {
        const payload = JSON.parse(e.data);
        setWorkers((prev) =>
          prev.map((w) => {
            if (w.id === payload.workerId) {
              return {
                ...w,
                bandId: payload.bandId,
                qrPayload: payload.qrPayload,
                checkInTime: payload.checkInTime,
                returnTime: null,
                shiftStatus: 'ACTIVE_SHIFT',
                healthCondition: 'HEALTHY',
                lastExposure: 0,
                lastRisk: 'LOW',
              };
            }
            return w;
          })
        );
      });

      eventSource.addEventListener('SHIFT_COMPLETED_SCAN', (e: MessageEvent) => {
        const payload = JSON.parse(e.data);
        setWorkers((prev) =>
          prev.map((w) => {
            if (w.id === payload.workerId) {
              return {
                ...w,
                returnTime: payload.returnTime,
                shiftStatus: 'COMPLETED_SHIFT',
                healthCondition: payload.healthCondition,
                lastExposure: payload.exposure,
                lastRisk: payload.risk,
                history: [
                  {
                    id: 'SCN-EVT-' + Math.floor(1000 + Math.random() * 9000),
                    timestamp: payload.returnTime,
                    exposure: payload.exposure,
                    risk: payload.risk,
                    confidence: 0.95,
                    bandId: payload.bandId,
                    workerId: payload.workerId,
                    lab: { l: '50.0', a: '15.0', b: '30.0' },
                    rgb: { r: 120, g: 85, b: 50 },
                    type: 'RETURN_KIOSK',
                  },
                  ...(w.history || []),
                ],
              };
            }
            return w;
          })
        );

        if (payload.risk === 'HIGH' || payload.requiresEmergencyAlert) {
          triggerHighRiskNotification(
            payload.workerName || payload.workerId,
            payload.exposure,
            payload.bandId
          );
          setHighRiskAlert({
            workerName: payload.workerName || payload.workerId,
            workerId: payload.workerId,
            dept: payload.dept || 'Plant Operations',
            bandId: payload.bandId,
            exposure: payload.exposure,
            time: payload.returnTime || 'Now',
          });
        }
      });
    } catch {
      // SSE fallback
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [loadWorkersFromBackend]);

  // Request browser notification permissions
  const handleEnableAlerts = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermissionGranted(granted);
    if (granted) {
      try {
        new Notification('H₂S SAFE-SENSE System Alert', {
          body: 'Local browser emergency notification channel verified and active.',
          icon: '/favicon.ico',
        });
      } catch {
        // Restricted in iframe
      }
    }
  };

  // Test Emergency Alarm
  const handleTriggerSimulatedAlarm = () => {
    playHazardAlarmSound(4);
    triggerHighRiskNotification('Test Hazard Alarm', 35.0, 'H2S-BAND-TEST');
    setHighRiskAlert({
      workerName: 'Simulated Hazard Evacuation Drill',
      workerId: 'SIM-ALERT',
      dept: 'Sector 4 Tank Farm & CDU-2',
      bandId: 'H2S-BAND-DEMO',
      exposure: 42.5,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  // Handlers for Kiosk Dispense & Return
  const handleDispenseSuccess = (workerId: string, newBandId: string, checkInTime: string) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          return {
            ...w,
            bandId: newBandId,
            checkInTime,
            returnTime: null,
            shiftStatus: 'ACTIVE_SHIFT',
            healthCondition: 'HEALTHY',
            lastExposure: 0,
            lastRisk: 'LOW',
          };
        }
        return w;
      })
    );

    // Update wristband status in inventory
    setWristbands((prev) =>
      prev.map((b) =>
        b.bandId === newBandId
          ? { ...b, status: 'ACTIVE', assignedWorkerId: workerId, activationDate: new Date().toISOString().split('T')[0] }
          : b
      )
    );

    // Add audit log
    const newLog: SystemAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: checkInTime,
      action: 'Band Dispensed & Check-in',
      category: 'DISPENSER',
      details: `Wristband ${newBandId} dispensed to worker ${workerId}`,
      user: 'RPI-DISP-01',
      level: 'INFO',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleReturnScanSuccess = (
    workerId: string,
    bandId: string,
    exposure: number,
    risk: RiskLevel,
    returnTime: string,
    lab: { l: string; a: string; b: string },
    rgb: { r: number; g: number; b: number }
  ) => {
    const condition: HealthCondition =
      risk === 'HIGH' ? 'HAZARD_ALERT' : risk === 'MODERATE' ? 'UNDER_OBSERVATION' : 'HEALTHY';

    const newScanEntry: ScanResult = {
      id: 'SCN-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: returnTime,
      exposure,
      risk,
      confidence: 0.95,
      bandId,
      workerId,
      lab,
      rgb,
      type: 'RETURN_KIOSK',
    };

    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === workerId) {
          return {
            ...w,
            returnTime,
            shiftStatus: 'COMPLETED_SHIFT',
            healthCondition: condition,
            lastExposure: exposure,
            lastRisk: risk,
            lastLab: lab,
            lastRgb: rgb,
            history: [newScanEntry, ...(w.history || [])],
          };
        }
        return w;
      })
    );

    // Update wristband status to RETURNED
    setWristbands((prev) =>
      prev.map((b) => (b.bandId === bandId ? { ...b, status: 'RETURNED' } : b))
    );

    // If high risk, trigger notification & acoustic alarm
    if (risk === 'HIGH') {
      const targetWorker = workers.find((w) => w.id === workerId);
      triggerHighRiskNotification(targetWorker?.name || workerId, exposure, bandId);
      setHighRiskAlert({
        workerName: targetWorker?.name || workerId,
        workerId,
        dept: targetWorker?.dept || 'Sector 4',
        bandId,
        exposure,
        time: returnTime,
      });

      // Add high risk notification
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        title: `⚠️ CRITICAL H₂S ALERT: ${targetWorker?.name || workerId}`,
        message: `Worker ${targetWorker?.name || workerId} scanned ${exposure} ppm·h on band ${bandId}. Immediate medical evaluation required.`,
        timestamp: returnTime,
        type: 'CRITICAL',
        read: false,
        targetRole: 'all',
        workerId,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // Mobile App manual scan handler
  const handleManualScanLogged = (newScan: ScanResult) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === activeWorker.id) {
          const condition: HealthCondition =
            newScan.risk === 'HIGH'
              ? 'HAZARD_ALERT'
              : newScan.risk === 'MODERATE'
              ? 'UNDER_OBSERVATION'
              : 'HEALTHY';

          return {
            ...w,
            healthCondition: condition,
            lastExposure: newScan.exposure,
            lastRisk: newScan.risk,
            lastLab: newScan.lab,
            lastRgb: newScan.rgb,
            history: [newScan, ...(w.history || [])],
          };
        }
        return w;
      })
    );

    if (newScan.risk === 'HIGH') {
      triggerHighRiskNotification(activeWorker.name, newScan.exposure, newScan.bandId);
      setHighRiskAlert({
        workerName: activeWorker.name,
        workerId: activeWorker.id,
        dept: activeWorker.dept,
        bandId: newScan.bandId,
        exposure: newScan.exposure,
        time: newScan.timestamp,
      });
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* High-Risk Emergency Alarm Banner */}
      <HighRiskAlertBanner
        alert={highRiskAlert}
        onDismiss={() => setHighRiskAlert(null)}
      />

      {/* Top Global Ecosystem Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Hackathon Tag */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/30">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight">H₂S SAFE-SENSE</span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                  DEMO ECOSYSTEM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Passive Colorimetric Dosimeter & Smart Raspberry Pi Dispenser
              </p>
            </div>
          </div>

          {/* Primary View Switcher Navigation */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setViewMode('worker_app')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'worker_app'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone size={14} />
              <span>Worker App</span>
            </button>

            <button
              onClick={() => setViewMode('supervisor_portal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'supervisor_portal'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 size={14} />
              <span>Supervisor Station</span>
            </button>

            <button
              onClick={() => setViewMode('admin_suite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'admin_suite'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SettingsIcon size={14} />
              <span>Admin Console</span>
            </button>

            <button
              onClick={() => setViewMode('rpi_terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'rpi_terminal'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu size={14} />
              <span>Raspberry Pi Kiosk</span>
            </button>
          </div>

          {/* Notification & Alarm Test Controls */}
          <div className="flex items-center gap-2">
            {!notifPermissionGranted ? (
              <button
                onClick={handleEnableAlerts}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Enable browser push notifications for high-risk gas exposure"
              >
                <Bell size={13} />
                <span>Enable Alerts</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                <BellRing size={12} />
                <span>Alerts Active</span>
              </span>
            )}

            <button
              onClick={handleTriggerSimulatedAlarm}
              className="bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700/60 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Test the acoustic alarm buzzer & evacuation banner"
            >
              <Volume2 size={13} />
              <span>Test Alarm</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dynamic Viewport */}
      <main className="flex-1 py-6">
        {viewMode === 'worker_app' && (
          <WorkerApp
            activeWorker={activeWorker}
            allWorkers={workers}
            onSelectWorker={(id) => setCurrentWorkerId(id)}
            calibrationCurve={calibrationCurve}
            onScanLogged={handleManualScanLogged}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onOpenDispenserTerminal={() => setViewMode('rpi_terminal')}
          />
        )}

        {viewMode === 'supervisor_portal' && (
          <HostSafetyStation
            workers={workers}
            onRefreshWorkers={loadWorkersFromBackend}
            onSelectWorker={(workerId) => {
              setCurrentWorkerId(workerId);
              setViewMode('worker_app');
            }}
            onOpenDispenser={() => setViewMode('rpi_terminal')}
            onTriggerSimulatedAlert={handleTriggerSimulatedAlarm}
          />
        )}

        {viewMode === 'admin_suite' && (
          <AdminSuite
            workers={workers}
            onUpdateWorkers={setWorkers}
            wristbands={wristbands}
            onUpdateWristbands={setWristbands}
            dispensers={dispensers}
            onUpdateDispensers={setDispensers}
            calibrationCurve={calibrationCurve}
            onUpdateCalibrationCurve={setCalibrationCurve}
            calibrationSamples={calibrationSamples}
            onUpdateCalibrationSamples={setCalibrationSamples}
            mlModels={mlModels}
            onUpdateMLModels={setMlModels}
            auditLogs={auditLogs}
            settings={settings}
            onUpdateSettings={setSettings}
            onSelectWorkerForMobileView={(workerId) => {
              setCurrentWorkerId(workerId);
              setViewMode('worker_app');
            }}
          />
        )}

        {viewMode === 'rpi_terminal' && (
          <div className="max-w-4xl mx-auto px-4">
            <RaspberryPiKiosk
              workers={workers}
              calibrationCurve={calibrationCurve}
              onDispenseSuccess={handleDispenseSuccess}
              onReturnScanSuccess={handleReturnScanSuccess}
            />
          </div>
        )}
      </main>

      {/* Industrial Safety Disclaimer Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
        <p>
          <strong>H₂S Safe-Sense Industrial Dosimeter Prototype</strong> • Built for Smart India Hackathon.
          The passive chemical patch responds to H₂S gas; camera analysis performs quantitative spectrophotometry. Not a certified industrial gas detector.
        </p>
      </footer>
    </div>
  );
};

export default App;
