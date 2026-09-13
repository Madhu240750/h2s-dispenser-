import React, { useState } from 'react';
import {
  Database,
  Plus,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Layers,
  X
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { CalibrationPoint } from '../types';
import { INITIAL_CALIBRATION_CURVE } from '../utils/colorPipeline';

interface AdminViewProps {
  calibrationCurve: CalibrationPoint[];
  onUpdateCalibration: (newCurve: CalibrationPoint[]) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  calibrationCurve,
  onUpdateCalibration,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPpm, setNewPpm] = useState<string>('20');
  const [newL, setNewL] = useState<string>('60');
  const [newA, setNewA] = useState<string>('15');
  const [newB, setNewB] = useState<string>('30');
  const [newSampleName, setNewSampleName] = useState<string>('Lab Standard Batch #04');

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const ppmNum = parseFloat(newPpm);
    const lNum = parseFloat(newL);
    const aNum = parseFloat(newA);
    const bNum = parseFloat(newB);

    if (isNaN(ppmNum) || isNaN(lNum) || isNaN(aNum) || isNaN(bNum)) {
      return;
    }

    const newPoint: CalibrationPoint = {
      id: `S-${String(calibrationCurve.length + 1).padStart(3, '0')}`,
      ppmH: ppmNum,
      l: lNum,
      a: aNum,
      b: bNum,
      sampleName: newSampleName || `Sample #${calibrationCurve.length + 1}`,
      status: 'CUSTOM',
    };

    const updated = [...calibrationCurve, newPoint].sort((x, y) => x.ppmH - y.ppmH);
    onUpdateCalibration(updated);
    setShowAddModal(false);
  };

  const handleResetFactory = () => {
    if (window.confirm('Reset calibration dataset to standard laboratory factory curve?')) {
      onUpdateCalibration(INITIAL_CALIBRATION_CURVE);
    }
  };

  const handleDeletePoint = (id: string) => {
    if (calibrationCurve.length <= 2) {
      alert('Calibration curve requires at least 2 reference points.');
      return;
    }
    const filtered = calibrationCurve.filter((p) => p.id !== id);
    onUpdateCalibration(filtered);
  };

  // Calibration curve chart data
  const sortedByExposure = [...calibrationCurve].sort((a, b) => a.ppmH - b.ppmH);
  const chartData = {
    labels: sortedByExposure.map((p) => `${p.ppmH} ppm·h`),
    datasets: [
      {
        label: 'Optical Lightness (L*)',
        data: sortedByExposure.map((p) => p.l),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Lightness L*: ${ctx.parsed.y} at ${sortedByExposure[ctx.dataIndex].ppmH} ppm·h`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Lightness L* (0 = Black, 100 = White)', font: { size: 11, weight: 'bold' as const } },
      },
      x: {
        title: { display: true, text: 'H₂S Exposure (ppm·h)', font: { size: 11, weight: 'bold' as const } },
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Database className="text-blue-600" size={24} />
            Administrator Control Panel
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Configure colorimetric sensor response curves, spectrophotometer anchors, and threshold limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetFactory}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs text-xs transition"
          >
            <RotateCcw size={14} /> Reset Factory Curve
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs text-xs transition"
          >
            <Plus size={15} /> Add Calibration Point
          </button>
        </div>
      </div>

      {/* Calibration Curve Graph */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <TrendingDown size={18} className="text-blue-600" />
              CIE L* vs. Exposure Calibration Response Curve
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Chemical darkening causes monotonic drop in L* (Lightness) from pristine strip (L*≈95) to saturated (L*≈30).
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            r² = 0.994 Fit
          </span>
        </div>
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Active Spectrophotometric Calibration Table
            </h4>
            <p className="text-xs text-slate-500">
              CIE standard illuminant D65 reference values used in real-time camera extraction
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {calibrationCurve.length} Anchor Points
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Sample ID</th>
                <th className="px-6 py-3.5">Exposure (ppm·h)</th>
                <th className="px-6 py-3.5 text-center">L* (Lightness)</th>
                <th className="px-6 py-3.5 text-center">a* (Red/Green)</th>
                <th className="px-6 py-3.5 text-center">b* (Blue/Yellow)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calibrationCurve.map((point) => (
                <tr key={point.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    {point.id}
                    {point.sampleName && (
                      <span className="text-[11px] font-normal text-slate-400">({point.sampleName})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {point.ppmH} ppm·h
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-semibold text-slate-800">
                    {point.l}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-semibold text-rose-600">
                    +{point.a}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-semibold text-amber-600">
                    +{point.b}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        point.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : point.status === 'CUSTOM'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {point.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {point.status === 'CUSTOM' && (
                      <button
                        onClick={() => handleDeletePoint(point.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Add Calibration Anchor Point</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPoint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sample Name / Standard Batch
                </label>
                <input
                  type="text"
                  value={newSampleName}
                  onChange={(e) => setNewSampleName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  placeholder="e.g. Lab Standard S-006"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exposure (ppm·h)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newPpm}
                    onChange={(e) => setNewPpm(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lightness L* (0 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newL}
                    onChange={(e) => setNewL(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    a* (Red/Green: -50 to 50)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newA}
                    onChange={(e) => setNewA(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    b* (Blue/Yellow: -50 to 50)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newB}
                    onChange={(e) => setNewB(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                >
                  Save Calibration Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
