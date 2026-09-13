import React, { useState } from 'react';
import {
  History,
  Download,
  Filter,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { ScanResult } from '../types';

interface HistoryViewProps {
  scans: ScanResult[];
  onClearHistory?: () => void;
  onDeleteScan?: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  scans,
  onClearHistory,
  onDeleteScan,
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered scans
  const filteredScans = scans.filter((s) => {
    const matchesRisk = filterRisk === 'ALL' || s.risk === filterRisk;
    const matchesSearch =
      s.bandId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.workerId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  // Export CSV
  const exportCsv = () => {
    const headers = ['Scan_ID', 'Timestamp', 'Worker_ID', 'Band_ID', 'Exposure_ppmH', 'Risk_Level', 'L_Lightness', 'a_RedGreen', 'b_BlueYellow', 'Confidence'];
    const rows = filteredScans.map((s) => [
      s.id,
      s.timestamp,
      s.workerId,
      s.bandId,
      s.exposure,
      s.risk,
      s.lab.l,
      s.lab.a,
      s.lab.b,
      s.confidence,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `h2s_exposure_scans_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart preparation: chronological order
  const chartScans = [...scans].slice(-10);
  const chartData = {
    labels: chartScans.map((s) => s.timestamp || s.id),
    datasets: [
      {
        label: 'Measured Exposure (ppm·h)',
        data: chartScans.map((s) => s.exposure),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: chartScans.map((s) =>
          s.risk === 'HIGH' ? '#e11d48' : s.risk === 'MODERATE' ? '#d97706' : '#10b981'
        ),
        pointRadius: 5,
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
          label: (ctx: any) => `Exposure: ${ctx.parsed.y} ppm·h`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'ppm·h Exposure',
          font: { size: 11, weight: 'bold' as const },
        },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <History className="text-blue-600" size={24} />
            Exposure History & Safety Logs
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Complete colorimetric optical records, CIE L*a*b* coordinates, and threshold compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs text-xs transition"
            title="Download CSV for ML model training"
          >
            <Download size={15} /> Export Dataset (CSV)
          </button>
          {onClearHistory && scans.length > 0 && (
            <button
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-semibold transition"
            >
              <Trash2 size={15} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Industrial Safety Threshold Reference Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">OSHA PEL (8-hr TWA)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">&lt; 10 ppm·h</span>
          </div>
          <p className="text-xs text-emerald-900 mt-2 leading-relaxed">
            Permissible Exposure Limit for normal 8-hour work shift without respiratory protection.
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Action Threshold (STEL)</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">10 – 20 ppm·h</span>
          </div>
          <p className="text-xs text-amber-900 mt-2 leading-relaxed">
            Short-term limit. Mandates area ventilation check and notification to safety supervisor.
          </p>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">OSHA Ceiling / IDLH</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">&gt; 20 ppm·h</span>
          </div>
          <p className="text-xs text-rose-900 mt-2 leading-relaxed">
            Exceeds permissible ceiling. Immediate evacuation and emergency medical protocol activation.
          </p>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-800 text-base">Recent Exposure Sequence</h4>
            <p className="text-xs text-slate-500">Continuous optical densitometry readings</p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Showing {chartScans.length} recent scans
          </span>
        </div>
        <div className="h-64">
          {chartScans.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No scans logged yet. Use the scanner to record exposures.
            </div>
          )}
        </div>
      </div>

      {/* Filter and Log Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/60">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Band ID or Scan ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Risk filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase">Risk Level:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
              {['ALL', 'LOW', 'MODERATE', 'HIGH'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterRisk(level)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    filterRisk === level ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Scan ID & Time</th>
                <th className="px-5 py-3.5">Band ID</th>
                <th className="px-5 py-3.5">Exposure (ppm·h)</th>
                <th className="px-5 py-3.5">Risk Rating</th>
                <th className="px-5 py-3.5">Sampled Color</th>
                <th className="px-5 py-3.5 text-center">CIE L*a*b*</th>
                <th className="px-5 py-3.5 text-right">Confidence</th>
                {onDeleteScan && <th className="px-4 py-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScans.length > 0 ? (
                filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-medium">
                      <p className="font-semibold text-slate-800">{scan.id}</p>
                      <p className="text-[11px] text-slate-400">{scan.timestamp}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700">
                      {scan.bandId}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-black text-sm text-slate-900">{scan.exposure}</span>
                      <span className="text-slate-500 ml-1 text-[11px]">ppm·h</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          scan.risk === 'LOW'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scan.risk === 'MODERATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {scan.risk}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-xs border border-slate-300 shadow-2xs shrink-0"
                          style={{
                            backgroundColor: `rgb(${scan.rgb?.r ?? 220}, ${scan.rgb?.g ?? 190}, ${scan.rgb?.b ?? 150})`,
                          }}
                        />
                        <span className="font-mono text-[11px] text-slate-600">
                          {scan.rgb ? `rgb(${scan.rgb.r}, ${scan.rgb.g}, ${scan.rgb.b})` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-700">
                      L: {scan.lab.l} | a: {scan.lab.a} | b: {scan.lab.b}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-slate-600">
                      {(scan.confidence * 100).toFixed(0)}%
                    </td>
                    {onDeleteScan && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => onDeleteScan(scan.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No exposure scan logs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
