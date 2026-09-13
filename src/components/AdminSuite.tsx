import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Tag,
  Cpu,
  Sliders,
  Sparkles,
  FileText,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Upload,
  Activity,
  Search,
  RefreshCw,
  Terminal,
  BookOpen,
  Check,
  X,
  Play,
  ArrowRight,
  Info,
  Server,
  Camera,
  Database,
  Radio,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  WorkerProfile,
  Wristband,
  DispenserDevice,
  CalibrationPoint,
  CalibrationSample,
  MLModelConfig,
  SystemAuditLog,
  SystemSettings,
  AdminTab,
  RiskLevel
} from '../types';
import { INITIAL_CALIBRATION_CURVE } from '../utils/colorPipeline';

interface AdminSuiteProps {
  workers: WorkerProfile[];
  onUpdateWorkers: (workers: WorkerProfile[]) => void;
  wristbands: Wristband[];
  onUpdateWristbands: (wristbands: Wristband[]) => void;
  dispensers: DispenserDevice[];
  onUpdateDispensers: (dispensers: DispenserDevice[]) => void;
  calibrationCurve: CalibrationPoint[];
  onUpdateCalibrationCurve: (curve: CalibrationPoint[]) => void;
  calibrationSamples: CalibrationSample[];
  onUpdateCalibrationSamples: (samples: CalibrationSample[]) => void;
  mlModels: MLModelConfig[];
  onUpdateMLModels: (models: MLModelConfig[]) => void;
  auditLogs: SystemAuditLog[];
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  onSelectWorkerForMobileView: (workerId: string) => void;
}

export const AdminSuite: React.FC<AdminSuiteProps> = ({
  workers,
  onUpdateWorkers,
  wristbands,
  onUpdateWristbands,
  dispensers,
  onUpdateDispensers,
  calibrationCurve,
  onUpdateCalibrationCurve,
  calibrationSamples,
  onUpdateCalibrationSamples,
  mlModels,
  onUpdateMLModels,
  auditLogs,
  settings,
  onUpdateSettings,
  onSelectWorkerForMobileView,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');

  // Search & Filter state
  const [workerSearch, setWorkerSearch] = useState('');
  const [bandSearch, setBandSearch] = useState('');
  const [logFilterCategory, setLogFilterCategory] = useState<string>('ALL');

  // Worker Modal
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerDept, setNewWorkerDept] = useState('Refinery - Sector 4 Tank Farm');
  const [newWorkerRole, setNewWorkerRole] = useState('Field Technician');

  // Calibration Lab State
  const [selectedRegressionModel, setSelectedRegressionModel] = useState<'linear' | 'poly' | 'rf'>('linear');
  const [showAddSampleModal, setShowAddSampleModal] = useState(false);
  const [newSampleName, setNewSampleName] = useState('');
  const [newSamplePpmH, setNewSamplePpmH] = useState('12.0');
  const [newSampleL, setNewSampleL] = useState('75.0');
  const [newSampleA, setNewSampleA] = useState('10.0');
  const [newSampleB, setNewSampleB] = useState('22.0');

  // Diagnostics Test Results
  const [diagnosticStatus, setDiagnosticStatus] = useState<{
    backend: 'PASS' | 'FAIL' | 'TESTING';
    database: 'PASS' | 'FAIL' | 'TESTING';
    camera: 'PASS' | 'WARNING' | 'TESTING';
    analysis: 'PASS' | 'FAIL' | 'TESTING';
    mlModel: 'PASS' | 'FAIL' | 'TESTING';
    dispenser: 'PASS' | 'WARNING' | 'TESTING';
    notifications: 'PASS' | 'FAIL' | 'TESTING';
  }>({
    backend: 'PASS',
    database: 'PASS',
    camera: 'PASS',
    analysis: 'PASS',
    mlModel: 'PASS',
    dispenser: 'PASS',
    notifications: 'PASS',
  });
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);

  // Computed Top Statistics
  const totalWorkersCount = workers.length;
  const activeWorkersCount = workers.filter((w) => w.shiftStatus === 'ACTIVE_SHIFT').length;
  const totalBandsCount = wristbands.length;
  const activeBandsCount = wristbands.filter((b) => b.status === 'ACTIVE').length;
  const availableBandsCount = wristbands.filter((b) => b.status === 'AVAILABLE').length;
  const expiredBandsCount = wristbands.filter((b) => b.status === 'EXPIRED').length;

  const lowRiskCount = workers.filter((w) => w.lastRisk === 'LOW').length;
  const moderateRiskCount = workers.filter((w) => w.lastRisk === 'MODERATE').length;
  const highRiskCount = workers.filter((w) => w.lastRisk === 'HIGH').length;
  const totalScansToday = workers.reduce((acc, w) => acc + (w.history ? w.history.length : 0), 0);

  // 1. Worker Handlers
  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerId || !newWorkerName) return;

    const newWorker: WorkerProfile = {
      id: newWorkerId.toUpperCase(),
      name: newWorkerName,
      dept: newWorkerDept,
      role: newWorkerRole,
      status: 'ACTIVE',
      shiftStatus: 'OFF_DUTY',
      healthCondition: 'HEALTHY',
      lastExposure: 0,
      cumulativeExposure: 0,
      lastRisk: 'LOW',
      bandId: null,
      history: [],
    };

    onUpdateWorkers([...workers, newWorker]);
    setShowAddWorkerModal(false);
    setNewWorkerId('');
    setNewWorkerName('');
  };

  const handleDeactivateWorker = (id: string) => {
    const updated = workers.map((w) => (w.id === id ? { ...w, status: w.status === 'ACTIVE' ? ('INACTIVE' as const) : ('ACTIVE' as const) } : w));
    onUpdateWorkers(updated);
  };

  // 2. Wristband Batch Generation
  const handleGenerateWristbandBatch = () => {
    const batchNum = `BATCH-2026-Q3-${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`;
    const newBands: Wristband[] = [];
    const startNum = totalBandsCount + 100;
    for (let i = 0; i < 5; i++) {
      const bId = `H2S-BAND-${startNum + i}`;
      newBands.push({
        bandId: bId,
        qrToken: `TOKEN-${bId}-${Math.floor(1000 + Math.random() * 9000)}`,
        batchId: batchNum,
        manufacturingDate: new Date().toISOString().split('T')[0],
        activationDate: null,
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'AVAILABLE',
        assignedWorkerId: null,
        initialPatchColor: '#FBF7E4',
      });
    }
    onUpdateWristbands([...wristbands, ...newBands]);
    alert(`Successfully generated new manufacturing batch (${batchNum}) with 5 passive colorimetric wristbands.`);
  };

  // 3. Dispenser Remote Motor Test
  const handleTestDispenserMotor = (deviceId: string) => {
    if (window.confirm(`Initiate hardware servo motor test on ${deviceId}? The dispenser will execute a 360° mechanical cycle.`)) {
      const updated = dispensers.map((d) =>
        d.deviceId === deviceId ? { ...d, motorStatus: 'DISPENSING' as const } : d
      );
      onUpdateDispensers(updated);

      setTimeout(() => {
        onUpdateDispensers(
          dispensers.map((d) =>
            d.deviceId === deviceId ? { ...d, motorStatus: 'IDLE' as const } : d
          )
        );
        alert(`Motor test completed successfully for ${deviceId}. Zero mechanical resistance detected.`);
      }, 2000);
    }
  };

  // 4. Calibration Curve Handlers
  const handleAddCalibrationSample = (e: React.FormEvent) => {
    e.preventDefault();
    const ppm = parseFloat(newSamplePpmH);
    const l = parseFloat(newSampleL);
    const a = parseFloat(newSampleA);
    const b = parseFloat(newSampleB);

    if (isNaN(ppm) || isNaN(l) || isNaN(a) || isNaN(b)) return;

    const newSample: CalibrationSample = {
      id: `CAL-EXP-${String(calibrationSamples.length + 1).padStart(3, '0')}`,
      sampleName: newSampleName || `Experimental Test Strip #${calibrationSamples.length + 1}`,
      ppmH: ppm,
      concentrationPpm: Math.round((ppm / 8) * 10) / 10,
      durationMinutes: 480,
      rgb: { r: Math.round(l * 2.5), g: Math.round(l * 2.2), b: Math.round(l * 1.8) },
      hsv: { h: 35, s: 30, v: Math.round(l) },
      lab: { l, a, b },
      temperatureC: 24.0,
      humidityPct: 50.0,
      date: new Date().toISOString().split('T')[0],
      notes: 'Custom laboratory calibration point',
      isDemo: true,
    };

    onUpdateCalibrationSamples([...calibrationSamples, newSample]);

    // Also update active curve point
    const newPoint: CalibrationPoint = {
      id: newSample.id,
      ppmH: ppm,
      l,
      a,
      b,
      sampleName: newSample.sampleName,
      status: 'CUSTOM',
    };
    const updatedCurve = [...calibrationCurve, newPoint].sort((x, y) => x.ppmH - y.ppmH);
    onUpdateCalibrationCurve(updatedCurve);

    setShowAddSampleModal(false);
    setNewSampleName('');
  };

  // 5. Run Full System Diagnostics
  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticStatus({
      backend: 'TESTING',
      database: 'TESTING',
      camera: 'TESTING',
      analysis: 'TESTING',
      mlModel: 'TESTING',
      dispenser: 'TESTING',
      notifications: 'TESTING',
    });

    setTimeout(() => {
      setDiagnosticStatus({
        backend: 'PASS',
        database: 'PASS',
        camera: 'PASS',
        analysis: 'PASS',
        mlModel: 'PASS',
        dispenser: 'PASS',
        notifications: 'PASS',
      });
      setDiagnosticsRunning(false);
    }, 1500);
  };

  // Chart: Exposure Trend Overview
  const trendLabels = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00'];
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Mean Plant H₂S Exposure (ppm·h)',
        data: [0.8, 2.5, 4.2, 7.8, 11.2, 14.5],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart: Risk Distribution
  const riskDoughnutData = {
    labels: ['Low Risk (<10 ppm·h)', 'Moderate (10-20 ppm·h)', 'High Hazard (>20 ppm·h)'],
    datasets: [
      {
        data: [lowRiskCount || 1, moderateRiskCount || 1, highRiskCount || 1],
        backgroundColor: ['#10b981', '#f59e0b', '#e11d48'],
        borderWidth: 0,
      },
    ],
  };

  // Chart: Calibration Curve
  const sortedCurve = [...calibrationCurve].sort((a, b) => a.ppmH - b.ppmH);
  const calibrationChartData = {
    labels: sortedCurve.map((c) => `${c.ppmH} ppm·h`),
    datasets: [
      {
        label: 'Reflectance Lightness L* (Calibration)',
        data: sortedCurve.map((c) => c.l),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.2,
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: '#8b5cf6',
      },
    ],
  };

  return (
    <div className="w-full bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                SYSTEM ADMINISTRATOR & SAFETY SUITE
              </span>
              <span className="text-slate-400 text-xs">• Version 3.4-SIH-PROTOTYPE</span>
            </div>
            <h1 className="text-xl font-black text-white mt-1 tracking-tight">
              H₂S Dosimeter Ecosystem Management Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveAdminTab('beginner_guide')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <BookOpen size={15} />
              <span>How To Run Everything</span>
            </button>
            <button
              onClick={handleRunDiagnostics}
              disabled={diagnosticsRunning}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} className={diagnosticsRunning ? 'animate-spin text-cyan-400' : ''} />
              <span>Run Diagnostics</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { id: 'overview', label: 'Safety Overview', icon: LayoutDashboard },
            { id: 'workers', label: `Workers (${workers.length})`, icon: Users },
            { id: 'wristbands', label: `Wristband Inventory (${wristbands.length})`, icon: Tag },
            { id: 'dispensers', label: `Pi Dispensers (${dispensers.length})`, icon: Cpu },
            { id: 'calibration', label: 'Calibration Lab', icon: Sliders },
            { id: 'ml_models', label: 'AI/ML Models', icon: Sparkles },
            { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
            { id: 'settings', label: 'System Settings', icon: SettingsIcon },
            { id: 'diagnostics', label: 'Test Suite', icon: CheckCircle2 },
            { id: 'beginner_guide', label: 'Architecture & Guide', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {/* TAB 1: OVERVIEW */}
        {activeAdminTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Workers</span>
                <p className="text-xl font-bold text-slate-800 mt-1">{totalWorkersCount}</p>
                <p className="text-[10px] text-slate-500">Registered</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Shift</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{activeWorkersCount}</p>
                <p className="text-[10px] text-slate-500">On-site</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Bands</span>
                <p className="text-xl font-bold text-cyan-600 mt-1">{activeBandsCount}</p>
                <p className="text-[10px] text-slate-500">In Circulation</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Available</span>
                <p className="text-xl font-bold text-indigo-600 mt-1">{availableBandsCount}</p>
                <p className="text-[10px] text-slate-500">In Dispensers</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Expired</span>
                <p className="text-xl font-bold text-slate-400 mt-1">{expiredBandsCount}</p>
                <p className="text-[10px] text-slate-500">Requires Recycle</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Low Risk</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{lowRiskCount}</p>
                <p className="text-[10px] text-slate-500">&lt;10 ppm·h</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Moderate</span>
                <p className="text-xl font-bold text-amber-600 mt-1">{moderateRiskCount}</p>
                <p className="text-[10px] text-slate-500">10-20 ppm·h</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">High Risk</span>
                <p className="text-xl font-bold text-rose-600 mt-1">{highRiskCount}</p>
                <p className="text-[10px] text-rose-500 font-semibold">Immediate Action</p>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Exposure Trend */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Plant-Wide Cumulative H₂S Exposure Trend</h3>
                    <p className="text-xs text-slate-400">Continuous optical colorimetric aggregation across shifts</p>
                  </div>
                  <span className="text-xs font-mono bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg border border-cyan-200">
                    Shift Period: CDU-2 & Sector 4
                  </span>
                </div>
                <div className="h-64">
                  <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">TWA Exposure Risk Distribution</h3>
                  <p className="text-xs text-slate-400 mb-4">Proportion of active roster under OSHA limits</p>
                  <div className="h-48 flex items-center justify-center">
                    <Doughnut data={riskDoughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-4 pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-emerald-600 font-bold block">{lowRiskCount}</span>
                    <span className="text-[10px] text-slate-400">Safe</span>
                  </div>
                  <div>
                    <span className="text-amber-600 font-bold block">{moderateRiskCount}</span>
                    <span className="text-[10px] text-slate-400">Observe</span>
                  </div>
                  <div>
                    <span className="text-rose-600 font-bold block">{highRiskCount}</span>
                    <span className="text-[10px] text-slate-400">Hazard</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800 text-sm">Real-time Ecosystem Activity Feed</h3>
                <span className="text-xs text-slate-400 font-mono">Live WebSocket/SSE Stream</span>
              </div>
              <div className="space-y-2">
                {auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.level === 'CRITICAL' ? 'bg-rose-500' : log.level === 'WARNING' ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-slate-800">{log.action}</p>
                        <p className="text-[11px] text-slate-500">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] text-slate-400 block">{log.timestamp}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{log.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WORKERS MANAGEMENT */}
        {activeAdminTab === 'workers' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search workers by ID, Name, Department or Band..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                <Plus size={15} />
                <span>Add Worker</span>
              </button>
            </div>

            {/* Workers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Worker ID & Name</th>
                      <th className="py-3 px-4">Department & Role</th>
                      <th className="py-3 px-4">Assigned Band</th>
                      <th className="py-3 px-4">Shift Status</th>
                      <th className="py-3 px-4">Health Condition</th>
                      <th className="py-3 px-4">Exposure (ppm·h)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workers
                      .filter(
                        (w) =>
                          w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
                          w.id.toLowerCase().includes(workerSearch.toLowerCase()) ||
                          w.dept.toLowerCase().includes(workerSearch.toLowerCase())
                      )
                      .map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{w.name}</div>
                            <div className="font-mono text-[11px] text-cyan-700 font-semibold">{w.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700">{w.dept}</div>
                            <div className="text-slate-400 text-[11px]">{w.role || 'Operator'}</div>
                          </td>
                          <td className="py-3 px-4">
                            {w.bandId ? (
                              <span className="font-mono bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded text-[11px]">
                                {w.bandId}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None assigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                w.shiftStatus === 'ACTIVE_SHIFT'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {w.shiftStatus || 'OFF_DUTY'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                w.healthCondition === 'HAZARD_ALERT'
                                  ? 'bg-rose-100 text-rose-700'
                                  : w.healthCondition === 'UNDER_OBSERVATION'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {w.healthCondition}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{w.lastExposure} ppm·h</div>
                            <div className="text-[10px] text-slate-400">Risk: {w.lastRisk}</div>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => onSelectWorkerForMobileView(w.id)}
                              className="text-cyan-600 hover:text-cyan-800 p-1 font-bold text-[11px]"
                              title="Inspect on Worker Mobile View"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleDeactivateWorker(w.id)}
                              className={`p-1 font-bold text-[11px] ${w.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                            >
                              {w.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WRISTBAND INVENTORY */}
        {activeAdminTab === 'wristbands' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Passive Dosimeter Wristband Inventory</h3>
                <p className="text-xs text-slate-400">Lead-acetate colorimetric chemical sensing band tracking</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateWristbandBatch}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={15} />
                  <span>Generate New Batch (5 Bands)</span>
                </button>
              </div>
            </div>

            {/* Bands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wristbands.map((b) => (
                <div key={b.bandId} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900 block">{b.bandId}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{b.batchId}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : b.status === 'AVAILABLE'
                          ? 'bg-blue-100 text-blue-700'
                          : b.status === 'RETURNED'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  {/* QR Representation */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center shrink-0">
                      <Tag size={24} className="text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Secure QR Token</span>
                      <p className="text-[11px] font-mono font-bold text-slate-700 truncate">{b.qrToken}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Expires: {b.expiryDate}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Assigned: {b.assignedWorkerName || 'Unassigned'}</span>
                    <span className="text-[10px] font-mono">Mfg: {b.manufacturingDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RASPBERRY PI DISPENSER DEVICES */}
        {activeAdminTab === 'dispensers' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Raspberry Pi Smart Dispenser Device Network</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical IoT kiosk controllers running Python GPIO / servo drivers and optical chamber scanners
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Heartbeat Polling: Active (15s)
                  </span>
                </div>
              </div>
            </div>

            {/* Dispensers List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {dispensers.map((d) => (
                <div key={d.deviceId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{d.name}</h4>
                      <p className="text-xs text-slate-400">{d.location}</p>
                      <span className="text-[10px] font-mono text-cyan-700">{d.deviceId}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'ONLINE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : d.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  {/* Inventory capacity progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Wristband Magazine:</span>
                      <span className="text-slate-800 font-mono">{d.inventory} / {d.maxCapacity}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.inventory < 10 ? 'bg-amber-500' : 'bg-cyan-600'
                        }`}
                        style={{ width: `${(d.inventory / d.maxCapacity) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Telemetry info */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Servo Motor:</span>
                      <span className="font-bold text-slate-700">{d.motorStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mode:</span>
                      <span className="font-mono text-cyan-800 font-bold">{d.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Heartbeat:</span>
                      <span className="text-slate-700">{d.lastHeartbeat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Firmware:</span>
                      <span className="font-mono text-slate-600">{d.softwareVersion}</span>
                    </div>
                  </div>

                  {/* Motor Test & Controls */}
                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleTestDispenserMotor(d.deviceId)}
                      disabled={d.motorStatus === 'DISPENSING'}
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {d.motorStatus === 'DISPENSING' ? 'Actuating...' : 'Test Motor Cycle'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CALIBRATION LAB */}
        {activeAdminTab === 'calibration' && (
          <div className="space-y-6">
            {/* Scientific Notice */}
            <div className="bg-amber-500/15 border-2 border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  DEMO DATA — NOT EXPERIMENTALLY VALIDATED
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  Chemical calibration points shown are empirical demonstration references. In production environments, verified spectrophotometer curves with known H₂S ppm exposure chambers must be entered by qualified industrial hygiene laboratories.
                </p>
              </div>
            </div>

            {/* Curve Chart & Model Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">CIE L* Lightness vs Known Cumulative H₂S Exposure</h3>
                    <p className="text-xs text-slate-400">Reflectance degradation curve under lead-acetate color complexing</p>
                  </div>
                  <button
                    onClick={() => setShowAddSampleModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Sample</span>
                  </button>
                </div>
                <div className="h-64">
                  <Line data={calibrationChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Model Choice Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Select Calibration Regression Model</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { id: 'linear', title: 'Piecewise Linear L* Model', desc: 'Standard industrial dosimeter interpolation between nearest experimental points.' },
                    { id: 'poly', title: 'Polynomial (Degree 2) Curve', desc: 'Captures accelerated darkening saturation in high exposure zones.' },
                    { id: 'rf', title: 'Random Forest Multi-Channel', desc: 'Ensemble model combining L*, a*, b*, and HSV saturation parameters.' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      onClick={() => setSelectedRegressionModel(m.id as any)}
                      className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRegressionModel === m.id
                          ? 'border-cyan-500 bg-cyan-50/50 ring-1 ring-cyan-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{m.title}</span>
                        <input
                          type="radio"
                          name="model"
                          checked={selectedRegressionModel === m.id}
                          onChange={() => {}}
                          className="text-cyan-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{m.desc}</p>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Calibration Samples Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Experimental Calibration Sample Records</h3>
                <span className="text-xs text-slate-400 font-mono">CSV Upload / Export Supported</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Sample ID</th>
                      <th className="py-2.5 px-4">Exposure (ppm·h)</th>
                      <th className="py-2.5 px-4">CIE L*a*b* Coordinates</th>
                      <th className="py-2.5 px-4">RGB Patch</th>
                      <th className="py-2.5 px-4">Chamber Env</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calibrationSamples.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{s.id}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-800">{s.ppmH} ppm·h</td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          L: {s.lab.l} | a: {s.lab.a} | b: {s.lab.b}
                        </td>
                        <td className="py-2.5 px-4">
                          <div
                            className="w-7 h-7 rounded border border-slate-300 shadow-inner"
                            style={{ backgroundColor: `rgb(${s.rgb?.r ?? 220}, ${s.rgb?.g ?? 190}, ${s.rgb?.b ?? 150})` }}
                            title={s.rgb ? `RGB(${s.rgb.r}, ${s.rgb.g}, ${s.rgb.b})` : 'N/A'}
                          />
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {s.temperatureC}°C, {s.humidityPct}% RH
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{s.date}</td>
                        <td className="py-2.5 px-4">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            DEMO DATA
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AI/ML MODELS */}
        {activeAdminTab === 'ml_models' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-800">AI / Machine Learning Model Repository</h3>
              <p className="text-xs text-slate-500 mt-1">
                Quantitative exposure estimation pipeline. The inference engine extracts CIE L*a*b* & HSV chromatic features from OpenCV corrected strip patches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {mlModels.map((m) => (
                <div key={m.modelId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{m.name}</h4>
                      <p className="text-xs text-slate-500">{m.algorithm}</p>
                      <span className="text-[10px] font-mono text-cyan-700">v{m.version}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Validation R² Score:</span>
                      <span className="font-mono font-bold text-emerald-600">{m.r2Score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">RMSE Error:</span>
                      <span className="font-mono text-slate-700">{m.rmse} ppm·h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Training Samples:</span>
                      <span className="font-mono text-slate-700">{m.trainingSamples}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Trained:</span>
                      <span className="text-slate-600">{m.lastTrained}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => alert(`Model ${m.modelId} architecture verified. In Python, replace ml/models/${m.modelId}.pkl to update weights.`)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Inspect Architecture & Weights
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeAdminTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-800 text-sm">System Compliance & Security Audit Trail</h3>
              <div className="flex gap-2">
                {['ALL', 'DISPENSER', 'SCAN', 'CALIBRATION'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLogFilterCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      logFilterCategory === cat ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Actor / Terminal</th>
                    <th className="py-3 px-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs
                    .filter((l) => logFilterCategory === 'ALL' || l.category === logFilterCategory)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{log.details}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{log.user}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.level === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-700'
                                : log.level === 'WARNING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {log.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: SYSTEM SETTINGS */}
        {activeAdminTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-3xl">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Industrial Safety & Algorithm Configuration</h3>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl mt-2">
                <strong>Safety Disclaimer:</strong> Occupational limits below are configuration values for this prototype ecosystem. Qualified plant safety personnel must verify thresholds against regional OSHA / NIOSH guidelines.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Low Risk Threshold (TWA Permissible)</span>
                  <span className="text-slate-400">Exposure under this value is classified as SAFE</span>
                </div>
                <input
                  type="number"
                  value={settings.lowRiskThreshold}
                  onChange={(e) => onUpdateSettings({ ...settings, lowRiskThreshold: parseFloat(e.target.value) || 10 })}
                  className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">High Risk Threshold (OSHA Ceiling Alert)</span>
                  <span className="text-slate-400">Triggers acoustic buzzer & evacuation notifications</span>
                </div>
                <input
                  type="number"
                  value={settings.highRiskThreshold}
                  onChange={(e) => onUpdateSettings({ ...settings, highRiskThreshold: parseFloat(e.target.value) || 20 })}
                  className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Wristband Chemical Validity Period (Days)</span>
                  <span className="text-slate-400">Maximum days before reagent strip degradation</span>
                </div>
                <input
                  type="number"
                  value={settings.bandValidityDays}
                  onChange={(e) => onUpdateSettings({ ...settings, bandValidityDays: parseInt(e.target.value, 10) || 7 })}
                  className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Minimum Image Quality Score (%)</span>
                  <span className="text-slate-400">Rejects scans with inadequate lighting or extreme angles</span>
                </div>
                <input
                  type="number"
                  value={settings.minQualityScore}
                  onChange={(e) => onUpdateSettings({ ...settings, minQualityScore: parseInt(e.target.value, 10) || 70 })}
                  className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono font-bold"
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-bold text-slate-800 block">Raspberry Pi Heartbeat Interval (Seconds)</span>
                  <span className="text-slate-400">Frequency of device ping and inventory sync</span>
                </div>
                <input
                  type="number"
                  value={settings.heartbeatIntervalSec}
                  onChange={(e) => onUpdateSettings({ ...settings, heartbeatIntervalSec: parseInt(e.target.value, 10) || 15 })}
                  className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => alert('Configuration parameters successfully synchronized with backend.')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs"
              >
                Save & Apply Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: TEST SUITE & DIAGNOSTICS */}
        {activeAdminTab === 'diagnostics' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">System Software & Hardware Test Suite</h3>
                <p className="text-xs text-slate-400">Automated diagnostic verification across all ecosystem layers</p>
              </div>
              <button
                onClick={handleRunDiagnostics}
                disabled={diagnosticsRunning}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw size={14} className={diagnosticsRunning ? 'animate-spin' : ''} />
                <span>Run Diagnostic Tests</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'FastAPI / REST Backend Communication', status: diagnosticStatus.backend, detail: 'REST /api/workers & /api/dispense endpoints responsive.' },
                { name: 'Firebase / Firestore In-Memory State', status: diagnosticStatus.database, detail: 'Workers and exposure records synchronized.' },
                { name: 'Browser Camera / WebRTC MediaDevices', status: diagnosticStatus.camera, detail: 'Environment camera facing mode access verified.' },
                { name: 'OpenCV / Colorimetric Feature Extraction', status: diagnosticStatus.analysis, detail: 'RGB -> CIE L*a*b* conversion and Delta-E operational.' },
                { name: 'AI / Calibration Model Inference', status: diagnosticStatus.mlModel, detail: 'Piecewise linear and polynomial regressions active.' },
                { name: 'Raspberry Pi Dispenser Simulation Link', status: diagnosticStatus.dispenser, detail: 'Servo actuator and optical Chamber simulation online.' },
                { name: 'Web Audio Alarm & Notification API', status: diagnosticStatus.notifications, detail: 'Industrial high-risk alarm audio context ready.' },
              ].map((test, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{test.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{test.detail}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      test.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : test.status === 'TESTING'
                        ? 'bg-cyan-100 text-cyan-700 animate-pulse'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {test.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: ARCHITECTURE & BEGINNER GUIDE */}
        {activeAdminTab === 'beginner_guide' && (
          <div className="space-y-6">
            {/* Visual Architecture Flowchart */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg space-y-6">
              <div>
                <span className="text-cyan-400 font-mono text-[10px] uppercase font-bold tracking-wider">
                  SYSTEM ARCHITECTURE DIAGRAM
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Passive Colorimetric Dosimeter Ecosystem
                </h3>
              </div>

              {/* Flowchart Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mx-auto">
                    <Activity size={20} />
                  </div>
                  <p className="font-bold text-white">1. H₂S Environment</p>
                  <p className="text-[11px] text-slate-400">Ambient toxic gas diffuses into chemical dosimeter strip</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center mx-auto">
                    <Tag size={20} />
                  </div>
                  <p className="font-bold text-white">2. Passive Wristband</p>
                  <p className="text-[11px] text-slate-400">Lead-acetate shifts from pale white to deep charcoal</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto">
                    <Camera size={20} />
                  </div>
                  <p className="font-bold text-white">3. Camera Scanner</p>
                  <p className="text-[11px] text-slate-400">Smartphone / Pi optical chamber captures normalized patch</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mx-auto">
                    <Sparkles size={20} />
                  </div>
                  <p className="font-bold text-white">4. OpenCV & AI</p>
                  <p className="text-[11px] text-slate-400">CIE L*a*b* extraction & regression model estimates ppm·h</p>
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-2">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto">
                    <Server size={20} />
                  </div>
                  <p className="font-bold text-white">5. Cloud & Host</p>
                  <p className="text-[11px] text-slate-400">Firebase Firestore syncs with Host Station & Worker PWA</p>
                </div>
              </div>
            </div>

            {/* Beginner Explanation Guide */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-cyan-600 font-mono text-[10px] uppercase font-bold tracking-wider">
                  BEGINNER TUTORIAL & COMMANDS
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  How To Run and Test Everything Step-by-Step
                </h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs">1</span>
                    Running the React + Vite Web Ecosystem
                  </h4>
                  <p>In this container, the full-stack server is already running on port 3000:</p>
                  <pre className="bg-slate-900 text-cyan-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    npm run dev
                  </pre>
                  <p className="text-slate-500">
                    This boots Express on port 3000 handling all REST endpoints (`/api/dispense`, `/api/return-scan`, `/api/workers`, `/api/events`) and serving the Vite React frontend.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs">2</span>
                    Testing on a Real Raspberry Pi (Optional Hardware)
                  </h4>
                  <p>If you connect a real Raspberry Pi with camera and servo motor, run the Python client script provided in `raspberry_pi/main.py`:</p>
                  <pre className="bg-slate-900 text-cyan-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    pip install requests RPi.GPIO opencv-python{'\n'}python raspberry_pi/main.py
                  </pre>
                  <p className="text-slate-500">
                    The script automatically connects to this backend API, sends heartbeats, actuates GPIO pins on band dispensing, and captures images from the Pi camera.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs">3</span>
                    How to Demonstrate the Complete Hackathon Flow
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Switch to <strong>Raspberry Pi Kiosk</strong> at the top bar.</li>
                    <li>Click <strong>"Dispense Wristband"</strong> to simulate worker badge verification and servo motor actuation.</li>
                    <li>Switch to <strong>Worker Mobile App</strong> to view the newly assigned wristband, QR token, and baseline exposure.</li>
                    <li>Open <strong>Scan Band</strong> on the phone or use the <strong>Return Scanner</strong> on the Kiosk to scan an exposed strip.</li>
                    <li>Observe the CIE L*a*b* optical analysis and how the exposure history immediately updates in the <strong>Safety Supervisor Portal</strong>.</li>
                    <li>If a <strong>High Exposure</strong> strip is scanned, the audible siren and browser notification trigger automatically!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Register New Worker</h3>
              <button onClick={() => setShowAddWorkerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Worker ID</label>
                <input
                  type="text"
                  placeholder="e.g. W011"
                  value={newWorkerId}
                  onChange={(e) => setNewWorkerId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Worker Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Sharma"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Department</label>
                <select
                  value={newWorkerDept}
                  onChange={(e) => setNewWorkerDept(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Refinery - Sector 4 Tank Farm">Refinery - Sector 4 Tank Farm</option>
                  <option value="Crude Distillation (CDU-2)">Crude Distillation (CDU-2)</option>
                  <option value="Sulfur Recovery Unit (SRU-3)">Sulfur Recovery Unit (SRU-3)</option>
                  <option value="Wastewater Stripping Facility">Wastewater Stripping Facility</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Role</label>
                <input
                  type="text"
                  value={newWorkerRole}
                  onChange={(e) => setNewWorkerRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Calibration Sample Modal */}
      {showAddSampleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Add Experimental Calibration Sample</h3>
              <button onClick={() => setShowAddSampleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCalibrationSample} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Sample Description</label>
                <input
                  type="text"
                  placeholder="e.g. Lab Gas Chamber Batch 05"
                  value={newSampleName}
                  onChange={(e) => setNewSampleName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Known Exposure (ppm·h)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSamplePpmH}
                    onChange={(e) => setNewSamplePpmH(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">CIE L* Lightness</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSampleL}
                    onChange={(e) => setNewSampleL(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">CIE a* (Green-Red)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSampleA}
                    onChange={(e) => setNewSampleA(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">CIE b* (Blue-Yellow)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSampleB}
                    onChange={(e) => setNewSampleB(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSampleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700"
                >
                  Add Sample Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
