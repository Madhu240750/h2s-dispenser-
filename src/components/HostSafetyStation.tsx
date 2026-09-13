import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  AlertTriangle,
  Clock,
  Cpu,
  Search,
  RefreshCw,
  Eye,
  Radio,
  Download,
  Flame,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  QrCode,
  ArrowUpRight,
  Sparkles,
  Volume2
} from 'lucide-react';
import { WorkerProfile, HealthCondition, RiskLevel } from '../types';
import { triggerHighRiskNotification, playHazardAlarmSound } from '../utils/notificationSystem';

interface HostSafetyStationProps {
  workers: WorkerProfile[];
  onRefreshWorkers: () => void;
  onSelectWorker: (workerId: string) => void;
  onOpenDispenser: () => void;
  onTriggerSimulatedAlert: () => void;
}

export const HostSafetyStation: React.FC<HostSafetyStationProps> = ({
  workers,
  onRefreshWorkers,
  onSelectWorker,
  onOpenDispenser,
  onTriggerSimulatedAlert,
}) => {
  const [filterCondition, setFilterCondition] = useState<'ALL' | HealthCondition>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<WorkerProfile | null>(null);
  const [showPythonScript, setShowPythonScript] = useState(false);

  // Computed metrics
  const totalWorkers = workers.length;
  const activeOnShift = workers.filter((w) => w.shiftStatus === 'ACTIVE_SHIFT').length;
  const hazardCount = workers.filter((w) => w.healthCondition === 'HAZARD_ALERT').length;
  const observationCount = workers.filter((w) => w.healthCondition === 'UNDER_OBSERVATION').length;
  const safeCount = workers.filter((w) => w.healthCondition === 'HEALTHY').length;

  const filteredWorkers = workers.filter((w) => {
    const matchesFilter = filterCondition === 'ALL' || w.healthCondition === filterCondition;
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.bandId && w.bandId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getConditionBadge = (condition: HealthCondition, exposure: number) => {
    switch (condition) {
      case 'HAZARD_ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <ShieldAlert size={13} className="text-rose-600" />
            CRITICAL HAZARD ({exposure} ppm·h)
          </span>
        );
      case 'UNDER_OBSERVATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle size={13} className="text-amber-600" />
            Under Observation ({exposure} ppm·h)
          </span>
        );
      case 'HEALTHY':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck size={13} className="text-emerald-600" />
            Safe / Normal ({exposure} ppm·h)
          </span>
        );
    }
  };

  const pythonScript = `# rpi_dispenser_return_kiosk.py
# Raspberry Pi Wristband Dispenser & Optical Return Kiosk
# Connects with Host Safety Server via REST endpoints

import time
import json
import requests
import cv2
import numpy as np
# from mfrc522 import SimpleMFRC522 # For physical RC522 RFID reader
# import RPi.GPIO as GPIO           # For dispenser motor / servo actuator

HOST_SERVER_URL = "http://localhost:3000"
STATION_ID = "RPI-KIOSK-SECTOR4-01"

def register_and_dispense_band(worker_id):
    """
    Triggered when worker scans their RFID badge at shift start.
    Maps Worker ID <-> New Wristband, notes start time.
    """
    print(f"[*] Registering Worker ID: {worker_id}...")
    endpoint = f"{HOST_SERVER_URL}/api/dispense"
    payload = {
        "workerId": worker_id,
        "stationId": STATION_ID
    }
    
    try:
        res = requests.post(endpoint, json=payload, timeout=5)
        data = res.json()
        if data.get("success"):
            band_id = data["worker"]["bandId"]
            check_in = data["worker"]["checkInTime"]
            print(f"[SUCCESS] Dispensed Band {band_id} for {data['worker']['name']}")
            print(f"[CLOCK-IN] Shift Start Time Recorded: {check_in}")
            # Actuate Servo to dispense physical wristband:
            # actuate_dispenser_servo()
            return data
    except Exception as e:
        print(f"[ERROR] Dispense communication failed: {e}")
    return None

def scan_return_band_and_analyze(image_frame):
    """
    Triggered after shift when worker inserts band into return slot.
    1. Reads QR code on band to identify worker & band
    2. Optical colorimetry on chemical patch to measure H2S ppm·h
    """
    print("[*] Wristband inserted into return chamber. Initiating scan...")
    # 1. Decode QR code
    detector = cv2.QRCodeDetector()
    qr_data, bbox, _ = detector.detectAndDecode(image_frame)
    
    if not qr_data:
        print("[!] QR code scan failed. Please reposition band.")
        return None
        
    print(f"[+] Decoded Band QR: {qr_data}")
    
    # 2. Extract Colorimetric Reaction Patch (Center ROI)
    h, w, _ = image_frame.shape
    patch_roi = image_frame[int(h*0.4):int(h*0.6), int(w*0.4):int(w*0.6)]
    avg_b = float(np.mean(patch_roi[:, :, 0]))
    avg_g = float(np.mean(patch_roi[:, :, 1]))
    avg_r = float(np.mean(patch_roi[:, :, 2]))
    
    # 3. Post to Host Safety Server
    endpoint = f"{HOST_SERVER_URL}/api/return-scan"
    payload = {
        "qrPayload": qr_data,
        "rgb": {"r": int(avg_r), "g": int(avg_g), "b": int(avg_b)},
        "stationId": STATION_ID
    }
    
    res = requests.post(endpoint, json=payload, timeout=5)
    result = res.json()
    print(f"[+] Shift Returned! Exposure: {result.get('worker', {}).get('lastExposure')} ppm·h")
    return result

if __name__ == "__main__":
    print(f"H2S SafeSense Raspberry Pi Station [{STATION_ID}] Online.")
`;

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Radio size={12} className="text-blue-600 animate-pulse" />
                Live Plant Supervisor Network
              </span>
              <span className="text-xs text-slate-500 font-mono">Terminal: HOST-SRV-MAIN</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              Host Safety Station & Worker Health Command
            </h2>
            <p className="text-sm text-slate-500">
              Real-time monitoring of all plant workforce personnel, shift check-in/out timings, assigned H₂S wristbands, and health exposure conditions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="refresh-workers-btn"
              onClick={onRefreshWorkers}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
            >
              <RefreshCw size={15} /> Refresh Network
            </button>
            <button
              id="rpi-script-toggle-btn"
              onClick={() => setShowPythonScript(!showPythonScript)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 transition"
            >
              <Cpu size={15} /> {showPythonScript ? 'Hide RPi Script' : 'RPi Hardware Script'}
            </button>
            <button
              id="test-sound-alarm-btn"
              onClick={() => {
                playHazardAlarmSound();
                triggerHighRiskNotification('Simulated Test Worker', 42.5, 'H2S-BAND-DEMO');
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Test the local browser audio siren and notification"
            >
              <Volume2 size={15} /> Test Siren & Notif
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Registered</span>
              <Users size={16} className="text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalWorkers}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Plant workforce roster</div>
          </div>

          <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Active On Shift</span>
              <Clock size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-800 mt-1">{activeOnShift}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Bands actively deployed</div>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Safe / Normal</span>
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-1">{safeCount}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">&lt; 10 ppm·h (PEL safe)</div>
          </div>

          <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Under Observation</span>
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-800 mt-1">{observationCount}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">10 - 20 ppm·h threshold</div>
          </div>

          <div className={`rounded-xl p-3.5 border ${hazardCount > 0 ? 'bg-rose-100 border-rose-300 text-rose-900 animate-pulse' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${hazardCount > 0 ? 'text-rose-800' : 'text-slate-500'}`}>Hazard Alerts</span>
              <ShieldAlert size={16} className={hazardCount > 0 ? 'text-rose-600' : 'text-slate-400'} />
            </div>
            <div className={`text-2xl font-black mt-1 ${hazardCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>{hazardCount}</div>
            <div className={`text-[11px] mt-0.5 ${hazardCount > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
              {hazardCount > 0 ? 'REQUIRES MEDICAL EVAC' : 'Zero critical exposures'}
            </div>
          </div>
        </div>
      </div>

      {/* Raspberry Pi Hardware Client Code Drawer */}
      {showPythonScript && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Raspberry Pi Hardware Client Script</h3>
                <p className="text-xs text-slate-400">
                  Runs directly on the Raspberry Pi 4 / 5 equipped with Pi Camera Module v2/v3 + RC522 RFID Reader.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([pythonScript], { type: 'text/x-python' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'rpi_dispenser_return_kiosk.py';
                a.click();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download size={14} /> Download .py Script
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs overflow-x-auto text-emerald-400 border border-slate-800 max-h-72">
            <pre>{pythonScript}</pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="font-bold text-white block mb-1">1. Shift Start (Check-In)</span>
              Worker taps RFID badge. The Pi calls <code className="text-blue-300">POST /api/dispense</code>, turns the dispenser motor, and assigns the band with QR code.
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="font-bold text-white block mb-1">2. Shift Return (Check-Out)</span>
              Worker inserts band into optical chamber. Pi Camera reads the QR code and analyzes the chemical patch spectrophotometrically.
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="font-bold text-white block mb-1">3. Live Host Sync</span>
              Calls <code className="text-blue-300">POST /api/return-scan</code>. Host website and worker mobile app update instantly with exposure and health state.
            </div>
          </div>
        </div>
      )}

      {/* Main Roster and Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Worker Roster & Real-time Health Conditions</h3>
              <p className="text-xs text-slate-500">Live feed from plant check-in kiosks and dosimeter scan stations</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worker, ID, band..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setFilterCondition('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${filterCondition === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'hover:text-slate-900'}`}
              >
                All ({workers.length})
              </button>
              <button
                onClick={() => setFilterCondition('HEALTHY')}
                className={`px-2.5 py-1 rounded-lg transition ${filterCondition === 'HEALTHY' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
              >
                Safe
              </button>
              <button
                onClick={() => setFilterCondition('UNDER_OBSERVATION')}
                className={`px-2.5 py-1 rounded-lg transition ${filterCondition === 'UNDER_OBSERVATION' ? 'bg-amber-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
              >
                Observation
              </button>
              <button
                onClick={() => setFilterCondition('HAZARD_ALERT')}
                className={`px-2.5 py-1 rounded-lg transition ${filterCondition === 'HAZARD_ALERT' ? 'bg-rose-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
              >
                Hazard Alert
              </button>
            </div>
          </div>
        </div>

        {/* Worker Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Worker Profile</th>
                <th className="px-4 py-3.5">Unit / Sector</th>
                <th className="px-4 py-3.5">Assigned Band & QR</th>
                <th className="px-4 py-3.5">Shift Timings</th>
                <th className="px-4 py-3.5">Health Condition</th>
                <th className="px-4 py-3.5">Last Exposure</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map((w) => {
                const isHigh = w.healthCondition === 'HAZARD_ALERT';
                return (
                  <tr
                    key={w.id}
                    className={`hover:bg-slate-50/80 transition ${isHigh ? 'bg-rose-50/50' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isHigh
                              ? 'bg-rose-600 text-white'
                              : w.shiftStatus === 'ACTIVE_SHIFT'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {w.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{w.name}</div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                            <span>ID: {w.id}</span>
                            <span>•</span>
                            <span className="text-slate-500">{w.role || 'Operator'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-700">{w.dept}</span>
                    </td>

                    <td className="px-4 py-4">
                      {w.bandId ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                              {w.bandId}
                            </span>
                            <QrCode size={13} className="text-slate-400" />
                          </div>
                          {w.qrPayload && (
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={w.qrPayload}>
                              QR: {w.qrPayload}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No band assigned</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="text-[10px] text-slate-400 font-medium">START:</span>
                          <span className="font-mono">{w.checkInTime || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="text-[10px] text-slate-400 font-medium">RETURN:</span>
                          <span className="font-mono">{w.returnTime || (w.shiftStatus === 'ACTIVE_SHIFT' ? 'On Shift (Pending)' : '—')}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {getConditionBadge(w.healthCondition, w.lastExposure)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {w.lastRgb && typeof w.lastRgb.r === 'number' ? (
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-xs"
                            style={{ backgroundColor: `rgb(${w.lastRgb.r}, ${w.lastRgb.g}, ${w.lastRgb.b})` }}
                            title={`Patch Color RGB(${w.lastRgb.r}, ${w.lastRgb.g}, ${w.lastRgb.b})`}
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {w.lastExposure} ppm·h
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {w.lastLab ? `L* ${w.lastLab.l}` : 'Zero point'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setSelectedWorkerDetail(w)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> View Health Log
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Detail Modal */}
      {selectedWorkerDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {selectedWorkerDetail.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">{selectedWorkerDetail.name}</h3>
                  <p className="text-xs text-slate-500">{selectedWorkerDetail.dept} • ID: {selectedWorkerDetail.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorkerDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Current Band & QR</span>
                  <span className="font-mono font-bold text-sm text-slate-800">
                    {selectedWorkerDetail.bandId || 'None'}
                  </span>
                  <div className="text-[10px] text-slate-500 truncate mt-1">
                    {selectedWorkerDetail.qrPayload || 'No QR generated'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Shift Health Condition</span>
                  <div className="mt-1">
                    {getConditionBadge(selectedWorkerDetail.healthCondition, selectedWorkerDetail.lastExposure)}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shift Clock Timings</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Dispenser Check-in:</span>
                    <p className="font-mono font-bold text-slate-800">{selectedWorkerDetail.checkInTime || 'Not recorded'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Kiosk Return Scan:</span>
                    <p className="font-mono font-bold text-slate-800">{selectedWorkerDetail.returnTime || 'Still on shift'}</p>
                  </div>
                </div>
              </div>

              {/* Exposure History Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chemical Dosimeter Exposure Log
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedWorkerDetail.history && selectedWorkerDetail.history.length > 0 ? (
                    selectedWorkerDetail.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>Scan {h.id}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{h.timestamp}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Band: {h.bandId} • L*: {h.lab?.l} a*: {h.lab?.a} b*: {h.lab?.b}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-800">{h.exposure} ppm·h</div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              h.risk === 'HIGH'
                                ? 'bg-rose-100 text-rose-700'
                                : h.risk === 'MODERATE'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {h.risk}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2">No past return scans recorded for this worker.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedWorkerDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
