import React, { useState } from 'react';
import {
  Smartphone,
  LayoutDashboard,
  Camera,
  History,
  Tag,
  User,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { WorkerProfile, CalibrationPoint, ScanResult, ActiveTab, NotificationItem } from '../types';
import { Scanner } from './Scanner';
import { DashboardCard } from './DashboardCard';

interface WorkerAppProps {
  activeWorker: WorkerProfile;
  allWorkers: WorkerProfile[];
  onSelectWorker: (workerId: string) => void;
  calibrationCurve: CalibrationPoint[];
  onScanLogged: (result: ScanResult) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onOpenDispenserTerminal: () => void;
}

export const WorkerApp: React.FC<WorkerAppProps> = ({
  activeWorker,
  allWorkers,
  onSelectWorker,
  calibrationCurve,
  onScanLogged,
  notifications,
  onMarkNotificationRead,
  onOpenDispenserTerminal,
}) => {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'daily' | 'weekly'>('all');

  const workerNotifications = notifications.filter(
    (n) => n.targetRole === 'all' || n.targetRole === 'worker' || n.workerId === activeWorker.id
  );
  const unreadCount = workerNotifications.filter((n) => !n.read).length;

  // Chart data for exposure trend
  const historyScans = activeWorker.history || [];
  const chartLabels = historyScans.length > 0
    ? [...historyScans].reverse().map((s) => s.timestamp.split(',')[0])
    : ['Baseline (0h)', 'Shift Mid (4h)', 'Current (8h)'];

  const chartExposureData = historyScans.length > 0
    ? [...historyScans].reverse().map((s) => s.exposure)
    : [0, 1.8, activeWorker.lastExposure];

  const trendData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Measured Exposure (ppm·h)',
        data: chartExposureData,
        borderColor: activeWorker.lastRisk === 'HIGH' ? '#e11d48' : activeWorker.lastRisk === 'MODERATE' ? '#f59e0b' : '#10b981',
        backgroundColor: activeWorker.lastRisk === 'HIGH' ? 'rgba(225, 29, 72, 0.1)' : activeWorker.lastRisk === 'MODERATE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 }, color: '#64748b' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#64748b' },
      },
    },
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-[750px] flex flex-col rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 text-white px-5 pt-4 pb-3">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <span className="font-mono">PWA MOBILE APP</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 text-[11px] font-semibold">ONLINE</span>
          </div>
        </div>

        {/* Worker Switcher & Profile Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-inner">
              {activeWorker.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">{activeWorker.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-cyan-300">
                  {activeWorker.id}
                </span>
                <span className="truncate max-w-[150px]">{activeWorker.dept}</span>
              </div>
            </div>
          </div>

          {/* Quick worker picker */}
          <select
            value={activeWorker.id}
            onChange={(e) => onSelectWorker(e.target.value)}
            aria-label="Switch Active Worker"
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 border border-slate-700 outline-none focus:ring-1 focus:ring-cyan-400"
          >
            {allWorkers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} - {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Band status pill */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Tag size={13} className="text-cyan-400" />
            <span className="text-slate-400">Assigned Band:</span>
            <span className="font-mono font-bold text-cyan-300">
              {activeWorker.bandId || 'None assigned'}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeWorker.bandId
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {activeWorker.bandId ? 'ACTIVE' : 'NEEDS DISPENSING'}
          </span>
        </div>
      </div>

      {/* Scientific Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-start gap-2">
        <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-tight">
          <span className="font-semibold">Important Scientific Notice:</span> The passive chemical patch responds to H₂S. The camera analyzes colour response against calibration data, not gas directly.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Health & Risk Status Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Current Safety Status
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-lg font-black tracking-tight ${
                        activeWorker.lastRisk === 'HIGH'
                          ? 'text-rose-600'
                          : activeWorker.lastRisk === 'MODERATE'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {activeWorker.lastRisk} RISK
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeWorker.healthCondition === 'HAZARD_ALERT'
                          ? 'bg-rose-100 text-rose-700'
                          : activeWorker.healthCondition === 'UNDER_OBSERVATION'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {activeWorker.healthCondition.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-2.5 rounded-xl ${
                    activeWorker.lastRisk === 'HIGH'
                      ? 'bg-rose-100 text-rose-600'
                      : activeWorker.lastRisk === 'MODERATE'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {activeWorker.lastRisk === 'HIGH' ? (
                    <ShieldAlert size={22} />
                  ) : (
                    <ShieldCheck size={22} />
                  )}
                </div>
              </div>

              {/* Primary exposure metric */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Latest Reading</span>
                  <p className="text-xl font-bold text-slate-800 mt-0.5">{activeWorker.lastExposure} <span className="text-xs font-normal text-slate-500">ppm·h</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Permissible: &lt;10 ppm·h</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Cumulative</span>
                  <p className="text-xl font-bold text-slate-800 mt-0.5">{activeWorker.cumulativeExposure || activeWorker.lastExposure} <span className="text-xs font-normal text-slate-500">ppm·h</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shift TWA: 8 Hours</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentTab('scan')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-colors"
              >
                <Camera size={16} />
                <span>Scan Strip Now</span>
              </button>
              <button
                onClick={onOpenDispenserTerminal}
                className="bg-slate-800 hover:bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-colors"
              >
                <QrCode size={16} />
                <span>Kiosk Terminal</span>
              </button>
            </div>

            {/* Exposure Trend Chart */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700">Exposure Trend (Shift Timeline)</span>
                <span className="text-[10px] text-slate-400">OSHA 8-hr TWA</span>
              </div>
              <div className="h-36 w-full">
                <Line data={trendData} options={chartOptions} />
              </div>
            </div>

            {/* Shift & Band Summary */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Wristband</span>
                <span className="font-mono font-bold text-slate-800">{activeWorker.bandId || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Band Status</span>
                <span className="font-semibold text-emerald-600">{activeWorker.shiftStatus === 'ACTIVE_SHIFT' ? 'ACTIVE (On Wrist)' : 'CHECKED IN'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Band Validity Expiry</span>
                <span className="font-semibold text-slate-700">{activeWorker.expiresInDays || 4} Days Remaining</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Last Colorimetric Scan</span>
                <span className="font-semibold text-slate-700">
                  {historyScans[0]?.timestamp || 'Shift Start (Baseline)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'scan' && (
          <div className="space-y-4">
            <Scanner
              onScanLogged={(res) => {
                onScanLogged(res);
                setCurrentTab('dashboard');
              }}
              calibrationCurve={calibrationCurve}
              currentBandId={activeWorker.bandId || 'H2S-BAND-DEMO'}
              workerId={activeWorker.id}
            />
          </div>
        )}

        {currentTab === 'history' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Exposure Scan Log</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    historyFilter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  All ({historyScans.length})
                </button>
              </div>
            </div>

            {historyScans.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center border border-slate-200 text-slate-500 text-xs">
                <History size={28} className="mx-auto mb-2 text-slate-400" />
                <p className="font-semibold">No scans recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Use the camera scanner or kiosk return to record exposure readings.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historyScans.map((scan) => {
                  const r = scan.rgb?.r ?? 220;
                  const g = scan.rgb?.g ?? 190;
                  const b = scan.rgb?.b ?? 150;
                  const labL = scan.lab?.l ?? '—';
                  return (
                    <div key={scan.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl border border-slate-300 shrink-0 shadow-inner"
                          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                          title={`RGB(${r}, ${g}, ${b})`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">{scan.exposure} ppm·h</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                scan.risk === 'HIGH'
                                  ? 'bg-rose-100 text-rose-700'
                                  : scan.risk === 'MODERATE'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {scan.risk}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{scan.timestamp} • CIE L* {labL}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {scan.type === 'RETURN_KIOSK' ? 'KIOSK' : 'PHONE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentTab === 'band_info' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="text-center pb-3 border-b border-slate-100">
              <div className="w-14 h-14 bg-cyan-50 text-cyan-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-200">
                <Tag size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Passive Colorimetric Wristband</h3>
              <p className="font-mono text-xs text-cyan-700 font-bold mt-0.5">{activeWorker.bandId || 'None'}</p>
            </div>

            {/* QR Code representation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="w-36 h-36 bg-white p-2.5 rounded-xl border border-slate-300 shadow-inner flex flex-col items-center justify-center relative">
                <QrCode size={110} className="text-slate-800" />
                <span className="text-[8px] font-mono text-slate-500 mt-1">SECURE BAND TOKEN</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-2 text-center break-all">
                {activeWorker.qrPayload || `H2S|${activeWorker.id}|${activeWorker.bandId || 'UNASSIGNED'}|TOKEN`}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Batch Identifier</span>
                <span className="font-mono text-slate-700">BATCH-2026-Q3-A</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Manufacturing Date</span>
                <span className="text-slate-700">01 Aug 2026</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Dispensed / Activated</span>
                <span className="text-slate-700">{activeWorker.checkInTime || 'Today, 08:00 AM'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Chemical Expiry</span>
                <span className="text-slate-700 font-semibold">{activeWorker.expiresInDays || 4} Days Remaining</span>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-lg">
                {activeWorker.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{activeWorker.name}</h3>
                <p className="text-xs text-slate-500">{activeWorker.role || 'Process Operator'}</p>
                <p className="text-[11px] font-mono text-cyan-600">{activeWorker.id}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{activeWorker.dept}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contact / Internal ID</span>
                <span className="font-mono text-slate-700">{activeWorker.contact || `${activeWorker.id.toLowerCase()}@plant.internal`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Shift Status</span>
                <span className="font-semibold text-emerald-600">{activeWorker.shiftStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Check-In Time</span>
                <span className="font-semibold text-slate-800">{activeWorker.checkInTime || '08:00 AM'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Plant Access Permit</span>
                <span className="font-bold text-emerald-600">AUTHORIZED (Level 2)</span>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'notifications' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Safety Alerts ({workerNotifications.length})
              </h3>
            </div>

            {workerNotifications.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center border border-slate-200 text-slate-400 text-xs">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-semibold text-slate-700">No active alerts</p>
                <p className="text-[11px] text-slate-400 mt-1">All atmospheric safety readings within normal thresholds.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workerNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkNotificationRead(n.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      n.type === 'CRITICAL'
                        ? 'bg-rose-50/80 border-rose-200'
                        : n.type === 'WARNING'
                        ? 'bg-amber-50/80 border-amber-200'
                        : 'bg-white border-slate-200'
                    } ${!n.read ? 'ring-1 ring-cyan-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {n.type === 'CRITICAL' ? (
                          <ShieldAlert size={14} className="text-rose-600" />
                        ) : n.type === 'WARNING' ? (
                          <AlertTriangle size={14} className="text-amber-600" />
                        ) : (
                          <Info size={14} className="text-cyan-600" />
                        )}
                        <span className={n.type === 'CRITICAL' ? 'text-rose-900' : 'text-slate-800'}>
                          {n.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="bg-white border-t border-slate-200 px-3 py-2 grid grid-cols-6 gap-1 shadow-lg">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
            currentTab === 'dashboard' ? 'text-cyan-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('scan')}
          className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
            currentTab === 'scan' ? 'text-cyan-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Camera size={18} />
          <span className="text-[9px] mt-0.5">Scan</span>
        </button>

        <button
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
            currentTab === 'history' ? 'text-cyan-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History size={18} />
          <span className="text-[9px] mt-0.5">History</span>
        </button>

        <button
          onClick={() => setCurrentTab('band_info')}
          className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
            currentTab === 'band_info' ? 'text-cyan-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Tag size={18} />
          <span className="text-[9px] mt-0.5">Band</span>
        </button>

        <button
          onClick={() => setCurrentTab('notifications')}
          className={`flex flex-col items-center py-1 rounded-xl relative transition-colors ${
            currentTab === 'notifications' ? 'text-cyan-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bell size={18} />
          <span className="text-[9px] mt-0.5">Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-3 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center py-1 rounded-xl transition-colors ${
            currentTab === 'profile' ? 'text-cyan-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={18} />
          <span className="text-[9px] mt-0.5">Profile</span>
        </button>
      </div>
    </div>
  );
};
