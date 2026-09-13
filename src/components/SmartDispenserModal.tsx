import React, { useState } from 'react';
import {
  Sparkles,
  Smartphone,
  CheckCircle2,
  X,
  CreditCard,
  RefreshCw,
  Cpu,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { WorkerProfile } from '../types';

interface SmartDispenserModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  onDispenseSuccess: (newBandId: string) => void;
}

export const SmartDispenserModal: React.FC<SmartDispenserModalProps> = ({
  isOpen,
  onClose,
  worker,
  onDispenseSuccess,
}) => {
  const [dispenseState, setDispenseState] = useState<'ready' | 'dispensing' | 'completed'>('ready');
  const [generatedBandId, setGeneratedBandId] = useState<string>('');

  if (!isOpen) return null;

  const handleTriggerDispense = () => {
    setDispenseState('dispensing');
    const newId = `H2S-BAND-${Math.floor(10000 + Math.random() * 90000)}`;
    setGeneratedBandId(newId);

    setTimeout(() => {
      setDispenseState('completed');
    }, 1600);
  };

  const handleFinish = () => {
    onDispenseSuccess(generatedBandId);
    setDispenseState('ready');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 tracking-tight">Smart Wristband Dispenser</h3>
              <p className="text-xs text-slate-500">Hardware Automated Check-In & RFID Pairing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-6">
          {dispenseState === 'ready' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                  {worker.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">{worker.name}</p>
                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 font-mono text-[10px] rounded border border-blue-200 font-bold">
                      Badge: {worker.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{worker.dept}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">REST API Endpoint Contract</p>
                <div className="bg-slate-900 text-slate-200 font-mono text-[11px] p-3 rounded-lg overflow-x-auto">
                  <span className="text-emerald-400">POST</span> /api/dispense
                  <pre className="text-slate-400 mt-1">
{`{
  "badgeId": "${worker.id}",
  "workerName": "${worker.name}",
  "stationId": "DISPENSER-SECTOR4-A",
  "shiftHours": 8
}`}
                  </pre>
                </div>
              </div>

              <button
                onClick={handleTriggerDispense}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <CreditCard size={18} /> Simulate Badge Scan & Dispense Band
              </button>
            </div>
          )}

          {dispenseState === 'dispensing' && (
            <div className="text-center py-8 space-y-4">
              <RefreshCw size={44} className="animate-spin text-blue-600 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-base">Actuating Dispenser Mechanism...</h4>
                <p className="text-xs text-slate-500 mt-1">Pairing RFID strip, calibrating zero-point spectrophotometry.</p>
              </div>
            </div>
          )}

          {dispenseState === 'completed' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">New Wristband Assigned!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Chemical dosimeter strip successfully linked to worker record.
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-slate-100 rounded-lg text-slate-800 font-mono font-bold text-sm border border-slate-200">
                  {generatedBandId}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs flex items-center justify-center gap-2">
                <ShieldCheck size={16} />
                <span>Pristine yellow/white zero-exposure state verified.</span>
              </div>

              <button
                onClick={handleFinish}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-xs transition"
              >
                Accept Band & Update Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
