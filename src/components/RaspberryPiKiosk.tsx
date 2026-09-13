import React, { useState } from 'react';
import {
  Cpu,
  CreditCard,
  QrCode,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Clock,
  Radio,
  Sparkles,
  Sliders,
  Maximize2
} from 'lucide-react';
import { WorkerProfile, HealthCondition, RiskLevel, CalibrationPoint } from '../types';
import { SAMPLE_STRIPS, processImageToExposure } from '../utils/colorPipeline';
import { triggerHighRiskNotification, playHazardAlarmSound } from '../utils/notificationSystem';

interface RaspberryPiKioskProps {
  workers: WorkerProfile[];
  calibrationCurve: CalibrationPoint[];
  onDispenseSuccess: (workerId: string, newBandId: string, checkInTime: string) => void;
  onReturnScanSuccess: (
    workerId: string,
    bandId: string,
    exposure: number,
    risk: RiskLevel,
    returnTime: string,
    lab: { l: string; a: string; b: string },
    rgb: { r: number; g: number; b: number }
  ) => void;
}

export const RaspberryPiKiosk: React.FC<RaspberryPiKioskProps> = ({
  workers,
  calibrationCurve,
  onDispenseSuccess,
  onReturnScanSuccess,
}) => {
  const [stationMode, setStationMode] = useState<'DISPENSER' | 'RETURN_SCANNER'>('DISPENSER');

  // DISPENSER STATE
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || 'W001');
  const [dispenseProgress, setDispenseProgress] = useState<'idle' | 'actuating' | 'completed'>('idle');
  const [lastDispensedBand, setLastDispensedBand] = useState<{
    bandId: string;
    workerId: string;
    workerName: string;
    checkInTime: string;
    qrPayload: string;
  } | null>(null);

  // RETURN SCANNER STATE
  const [returnStep, setReturnStep] = useState<'insert' | 'reading_qr' | 'analyzing_color' | 'finished'>('insert');
  const [returnWorkerId, setReturnWorkerId] = useState<string>(
    workers.find((w) => w.shiftStatus === 'ACTIVE_SHIFT')?.id || workers[0]?.id || 'W001'
  );
  const [selectedStripIndex, setSelectedStripIndex] = useState<number>(3); // Defaults to High Exposure for demoing the notification!
  const [lastReturnResult, setLastReturnResult] = useState<{
    workerName: string;
    workerId: string;
    bandId: string;
    exposure: number;
    risk: RiskLevel;
    returnTime: string;
    condition: HealthCondition;
  } | null>(null);

  // 1. Handle Dispense Actuation
  const handleDispenseActuation = async () => {
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return;

    setDispenseProgress('actuating');

    try {
      const response = await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          stationId: 'RPI-DISPENSER-SECTOR4',
        }),
      });

      const data = await response.json();
      const newBand = data.worker?.bandId || `H2S-BAND-${Math.floor(10000 + Math.random() * 90000)}`;
      const checkInTime = data.worker?.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const qrPayload = `H2S|${worker.id}|${newBand}|${Date.now()}`;

      setTimeout(() => {
        setLastDispensedBand({
          bandId: newBand,
          workerId: worker.id,
          workerName: worker.name,
          checkInTime,
          qrPayload,
        });
        setDispenseProgress('completed');
        onDispenseSuccess(worker.id, newBand, checkInTime);
      }, 1200);
    } catch (err) {
      // Fallback local simulation
      const newBand = `H2S-BAND-${Math.floor(10000 + Math.random() * 90000)}`;
      const checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const qrPayload = `H2S|${worker.id}|${newBand}|${Date.now()}`;

      setTimeout(() => {
        setLastDispensedBand({
          bandId: newBand,
          workerId: worker.id,
          workerName: worker.name,
          checkInTime,
          qrPayload,
        });
        setDispenseProgress('completed');
        onDispenseSuccess(worker.id, newBand, checkInTime);
      }, 1200);
    }
  };

  // 2. Handle Return Scan & Colorimetric Patch Analysis
  const handleProcessReturnScan = async () => {
    const worker = workers.find((w) => w.id === returnWorkerId) || workers[0];
    const bandId = worker.bandId || 'H2S-BAND-DEFAULT';
    const sample = SAMPLE_STRIPS[selectedStripIndex];

    setReturnStep('reading_qr');

    // Step 1: QR decode simulation
    setTimeout(() => {
      setReturnStep('analyzing_color');

      // Step 2: Optical color extraction
      setTimeout(async () => {
        const processed = processImageToExposure(sample.rgb, calibrationCurve);
        const returnTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Trigger local notification + siren if HIGH risk
        if (processed.risk === 'HIGH') {
          triggerHighRiskNotification(worker.name, processed.exposure, bandId);
        }

        try {
          await fetch('/api/return-scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qrPayload: `H2S|${worker.id}|${bandId}|${Date.now()}`,
              workerId: worker.id,
              bandId,
              rgb: sample.rgb,
              lab: processed.lab,
              exposure: processed.exposure,
              risk: processed.risk,
              stationId: 'RPI-KIOSK-RETURN-01',
            }),
          });
        } catch {
          // ignore network error in fallback
        }

        const condition: HealthCondition =
          processed.risk === 'HIGH'
            ? 'HAZARD_ALERT'
            : processed.risk === 'MODERATE'
            ? 'UNDER_OBSERVATION'
            : 'HEALTHY';

        setLastReturnResult({
          workerName: worker.name,
          workerId: worker.id,
          bandId,
          exposure: processed.exposure,
          risk: processed.risk,
          returnTime,
          condition,
        });

        onReturnScanSuccess(
          worker.id,
          bandId,
          processed.exposure,
          processed.risk,
          returnTime,
          processed.lab,
          sample.rgb
        );

        setReturnStep('finished');
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Industrial Kiosk Chassis Frame */}
      <div className="bg-slate-900 rounded-3xl p-6 border-4 border-slate-800 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Hardware Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Cpu size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  RPI-OS KIOSK V2.4 ONLINE
                </span>
                <span className="text-xs text-slate-400 font-mono">IP: 192.168.1.105</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                Raspberry Pi Wristband Dispenser & Optical Return Kiosk
              </h2>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              id="kiosk-mode-dispenser"
              onClick={() => {
                setStationMode('DISPENSER');
                setDispenseProgress('idle');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                stationMode === 'DISPENSER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard size={15} /> 1. Shift Start: Dispenser
            </button>
            <button
              id="kiosk-mode-return"
              onClick={() => {
                setStationMode('RETURN_SCANNER');
                setReturnStep('insert');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                stationMode === 'RETURN_SCANNER'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode size={15} /> 2. Shift Return: Spectro-Scan
            </button>
          </div>
        </div>

        {/* MODE 1: DISPENSER (Shift Start) */}
        {stationMode === 'DISPENSER' && (
          <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: RFID Registration */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-400" />
                    RFID Badge Tap & Worker ID Check-In
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">RC522 Sensor: READY</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-2">
                    Select Worker registering ID card at dispenser:
                  </label>
                  <select
                    id="worker-dispenser-select"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        [{w.id}] {w.name} — {w.dept} ({w.shiftStatus === 'ACTIVE_SHIFT' ? 'Already on shift' : 'Off-duty'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Worker Info Preview */}
                {(() => {
                  const sel = workers.find((w) => w.id === selectedWorkerId);
                  if (!sel) return null;
                  return (
                    <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Worker Name:</span>
                        <span className="font-bold text-white text-sm">{sel.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Department Unit:</span>
                        <span className="font-medium text-slate-300">{sel.dept}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Current Health Condition:</span>
                        <span className="font-bold text-emerald-400">{sel.healthCondition}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  id="actuate-dispenser-btn"
                  disabled={dispenseProgress === 'actuating'}
                  onClick={handleDispenseActuation}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 text-sm"
                >
                  {dispenseProgress === 'actuating' ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Actuating Dispenser Servo...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} /> Tap ID Card & Dispense Band
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Dispenser Chute / Physical Output */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center min-h-[340px] flex flex-col items-center justify-center">
                {dispenseProgress === 'idle' && (
                  <div className="space-y-3 max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <CreditCard size={32} />
                    </div>
                    <h4 className="font-bold text-base text-slate-300">Dispenser Slot Ready</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tap the worker's RFID badge to register the shift, actuate the mechanical servo, and map a fresh colorimetric dosimeter wristband.
                    </p>
                  </div>
                )}

                {dispenseProgress === 'actuating' && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto" />
                    <h4 className="font-bold text-base text-blue-400">Actuating Mechanical Ejection Chute...</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Generating unique QR barcode & logging start time to Host Station.
                    </p>
                  </div>
                )}

                {dispenseProgress === 'completed' && lastDispensedBand && (
                  <div className="space-y-4 w-full animate-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-600">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Wristband Dispensed Successfully
                      </span>
                      <h4 className="font-bold text-lg text-white mt-0.5">
                        Assigned to {lastDispensedBand.workerName}
                      </h4>
                    </div>

                    {/* Band Preview & QR Code Representation */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 max-w-md mx-auto flex items-center justify-between gap-4 text-left">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Allocated Band ID</div>
                        <div className="font-mono font-extrabold text-blue-400 text-base">{lastDispensedBand.bandId}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Check-In: <span className="text-white font-mono">{lastDispensedBand.checkInTime}</span>
                        </div>
                      </div>

                      {/* Chemical Patch Preview */}
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Colorimetric Patch</div>
                        <div className="w-10 h-10 rounded-lg bg-[#FBF7E4] border-2 border-slate-600 shadow-inner flex items-center justify-center text-[9px] font-bold text-slate-700">
                          0 ppm·h
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      Synced with Host Supervisor Network & Worker Mobile App.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: RETURN SCANNER (Shift End Optical Spectro-Scan) */}
        {stationMode === 'RETURN_SCANNER' && (
          <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Band Return Insertion & Test Exposure Selection */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <QrCode size={16} className="text-purple-400" />
                    Post-Shift Band Return & Camera Slot
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Pi Camera v3: READY</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Worker returning wristband:</label>
                  <select
                    id="return-worker-select"
                    value={returnWorkerId}
                    onChange={(e) => setReturnWorkerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        [{w.id}] {w.name} — Band: {w.bandId || 'None'} ({w.dept})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optical Patch Simulation Selector */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400">Select Chemical Patch State to Scan:</label>
                    <span className="text-[10px] text-purple-400 font-mono">Colorimetric Reaction</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SAMPLE_STRIPS.map((strip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedStripIndex(idx)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          selectedStripIndex === idx
                            ? 'border-purple-500 bg-purple-950/40 text-white ring-2 ring-purple-500/30'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-4 h-4 rounded-md border border-slate-600 shrink-0"
                            style={{ backgroundColor: strip.color }}
                          />
                          <span className="text-xs font-bold truncate text-slate-200">{strip.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{strip.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="process-return-scan-btn"
                  disabled={returnStep === 'reading_qr' || returnStep === 'analyzing_color'}
                  onClick={handleProcessReturnScan}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 text-sm"
                >
                  {returnStep === 'reading_qr' ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Step 1: Scanning Band QR Code...
                    </>
                  ) : returnStep === 'analyzing_color' ? (
                    <>
                      <Camera size={18} className="animate-pulse" /> Step 2: CIE L*a*b* Optical Spectrophotometry...
                    </>
                  ) : (
                    <>
                      <QrCode size={18} /> Insert Band & Scan Optical Exposure
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Optical Analysis Camera Screen & Results */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 min-h-[340px] flex flex-col items-center justify-center text-center">
                {returnStep === 'insert' && (
                  <div className="space-y-3 max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-purple-400">
                      <Camera size={32} />
                    </div>
                    <h4 className="font-bold text-base text-slate-300">Optical Inspection Chamber Ready</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Worker slides the used wristband into the slot. The Raspberry Pi camera first decodes the QR code to resolve the registered Worker ID, then samples the colorimetric patch to calculate total ppm·h exposure.
                    </p>
                  </div>
                )}

                {returnStep === 'reading_qr' && (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500 flex items-center justify-center mx-auto text-purple-300 animate-pulse">
                      <QrCode size={34} />
                    </div>
                    <h4 className="font-bold text-base text-purple-300">Reading Band QR Code...</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Resolving Worker ID & verifying band registration hash...
                    </p>
                  </div>
                )}

                {returnStep === 'analyzing_color' && (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-950/80 border border-blue-500 flex items-center justify-center mx-auto text-blue-300">
                      <RefreshCw size={34} className="animate-spin text-blue-400" />
                    </div>
                    <h4 className="font-bold text-base text-blue-300">CIE L*a*b* Optical Spectrophotometry...</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Interpolating lightness delta against calibration curve...
                    </p>
                  </div>
                )}

                {returnStep === 'finished' && lastReturnResult && (
                  <div className="space-y-4 w-full animate-in zoom-in-95 duration-200">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border ${
                        lastReturnResult.risk === 'HIGH'
                          ? 'bg-rose-950 text-rose-400 border-rose-600 animate-bounce'
                          : lastReturnResult.risk === 'MODERATE'
                          ? 'bg-amber-950 text-amber-400 border-amber-600'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-600'
                      }`}
                    >
                      {lastReturnResult.risk === 'HIGH' ? (
                        <ShieldAlert size={32} />
                      ) : (
                        <CheckCircle2 size={32} />
                      )}
                    </div>

                    <div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          lastReturnResult.risk === 'HIGH'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                            : lastReturnResult.risk === 'MODERATE'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {lastReturnResult.risk === 'HIGH' ? '⚠️ CRITICAL HIGH RISK DETECTED' : `${lastReturnResult.risk} RISK`}
                      </span>
                      <h4 className="font-bold text-lg text-white mt-1">
                        {lastReturnResult.workerName} ({lastReturnResult.workerId})
                      </h4>
                    </div>

                    {/* Result breakdown */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left max-w-md mx-auto grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Measured Exposure:</span>
                        <span className="text-lg font-black text-white">{lastReturnResult.exposure} ppm·h</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Shift Return Clock:</span>
                        <span className="text-lg font-mono font-bold text-slate-200">{lastReturnResult.returnTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Band Scanned:</span>
                        <span className="font-mono text-purple-400">{lastReturnResult.bandId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Health Condition:</span>
                        <span className={`font-bold ${lastReturnResult.risk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {lastReturnResult.condition}
                        </span>
                      </div>
                    </div>

                    {lastReturnResult.risk === 'HIGH' && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 text-left space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-rose-300">
                          <ShieldAlert size={14} /> Local Notification & Siren Triggered!
                        </div>
                        <p className="text-[11px] text-rose-300">
                          Host safety portal has received critical hazard alert. Immediate respiratory check-up required.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
