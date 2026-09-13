import React from 'react';
import { AlertOctagon, VolumeX, ShieldAlert, CheckCircle2, PhoneCall, ExternalLink } from 'lucide-react';
import { silenceAlarm } from '../utils/notificationSystem';

export interface AlertData {
  workerName: string;
  workerId: string;
  dept: string;
  bandId: string;
  exposure: number;
  time: string;
}

interface HighRiskAlertBannerProps {
  alert: AlertData | null;
  onDismiss: () => void;
}

export const HighRiskAlertBanner: React.FC<HighRiskAlertBannerProps> = ({ alert, onDismiss }) => {
  if (!alert) return null;

  const handleSilence = () => {
    silenceAlarm();
  };

  return (
    <div
      id="high-risk-emergency-banner"
      className="bg-rose-600 text-white shadow-2xl border-b border-rose-700 relative z-50 animate-bounce-short"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse shrink-0">
              <AlertOctagon size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-950/60 text-rose-200 text-xs font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                  OSHA Ceiling Exceeded
                </span>
                <span className="text-xs text-rose-100 font-mono">
                  Station Timestamp: {alert.time}
                </span>
              </div>
              <h4 className="text-base font-extrabold tracking-tight mt-0.5">
                CRITICAL H₂S EXPOSURE ALERT: {alert.workerName} ({alert.workerId}) — {alert.exposure} ppm·h
              </h4>
              <p className="text-xs text-rose-100 mt-0.5">
                Band: <span className="font-mono font-bold text-white">{alert.bandId}</span> | Unit: {alert.dept}. Immediate medical assessment and sector respiratory review mandated.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
            <button
              id="silence-alarm-button"
              onClick={handleSilence}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-rose-500/40"
              title="Mute siren audio"
            >
              <VolumeX size={15} /> Silence Siren
            </button>
            <button
              id="acknowledge-alert-button"
              onClick={() => {
                silenceAlarm();
                onDismiss();
              }}
              className="px-4 py-1.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <CheckCircle2 size={15} /> Acknowledge & Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
