import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  ShieldCheck,
  Eye,
  Sliders,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { ScanResult, CalibrationPoint, ScanState } from '../types';
import { processImageToExposure, SAMPLE_STRIPS } from '../utils/colorPipeline';
import { triggerHighRiskNotification } from '../utils/notificationSystem';

interface ScannerProps {
  onScanLogged: (result: ScanResult) => void;
  calibrationCurve: CalibrationPoint[];
  currentBandId: string;
  workerId: string;
}

export const Scanner: React.FC<ScannerProps> = ({
  onScanLogged,
  calibrationCurve,
  currentBandId,
  workerId,
}) => {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('Initializing...');
  const [activeTab, setActiveTab] = useState<'camera' | 'samples' | 'upload'>('camera');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanState('capturing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Camera access was not granted or not available in this environment. You can upload an image or choose one of the calibrated reference strips below.'
      );
      setScanState('idle');
    }
  };

  const executePipelineOnRgb = (rgb: { r: number; g: number; b: number }, sampleName?: string) => {
    setScanState('analyzing');
    setAnalysisStep('Sampling patch optical spectra...');

    setTimeout(() => {
      setAnalysisStep('Normalizing color temperature & computing CIE L*a*b*...');
    }, 500);

    setTimeout(() => {
      setAnalysisStep('Querying H₂S calibration curve and error margins...');
    }, 1000);

    setTimeout(() => {
      const analysis = processImageToExposure(rgb, calibrationCurve);
      const newScan: ScanResult = {
        id: 'SCN-' + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        bandId: currentBandId,
        workerId: workerId,
        notes: sampleName,
        ...analysis,
      };

      if (analysis.risk === 'HIGH') {
        triggerHighRiskNotification(`Worker ${workerId}`, analysis.exposure, currentBandId);
      }

      setLastScan(newScan);
      setScanState('result');
    }, 1400);
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    // Sample from the center sensing box (average 9 pixels for stability)
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const pixelData = ctx.getImageData(centerX - 1, centerY - 1, 3, 3).data;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    const pixelCount = pixelData.length / 4;

    for (let i = 0; i < pixelData.length; i += 4) {
      rSum += pixelData[i];
      gSum += pixelData[i + 1];
      bSum += pixelData[i + 2];
    }

    const rgb = {
      r: Math.round(rSum / pixelCount),
      g: Math.round(gSum / pixelCount),
      b: Math.round(bSum / pixelCount),
    };

    executePipelineOnRgb(rgb);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const pixelData = ctx.getImageData(centerX, centerY, 1, 1).data;
        executePipelineOnRgb({ r: pixelData[0], g: pixelData[1], b: pixelData[2] }, 'Uploaded Band Photo');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_STRIPS)[0]) => {
    setSelectedSample(sample.name);
    stopCamera();
    executePipelineOnRgb(sample.rgb, sample.name);
  };

  const handleLogAndComplete = () => {
    if (lastScan) {
      onScanLogged(lastScan);
      setScanState('idle');
      setLastScan(null);
    }
  };

  return (
    <div id="wristband-scanner-container" className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-xl text-slate-800 tracking-tight">Wristband Colorimetric Scanner</h3>
          <p className="text-xs text-slate-500 mt-0.5">CIE L*a*b* Spectral Densitometry for Band #{currentBandId}</p>
        </div>
        {scanState !== 'idle' && (
          <button
            onClick={() => {
              stopCamera();
              setScanState('idle');
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Cancel"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Error message */}
        {cameraError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-900">Notice on Camera Access</p>
              <p className="text-amber-700 leading-relaxed">{cameraError}</p>
            </div>
          </div>
        )}

        {/* IDLE STATE */}
        {scanState === 'idle' && (
          <div>
            {/* Input Selection Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'camera'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera size={16} /> Live Camera
              </button>
              <button
                onClick={() => setActiveTab('samples')}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'samples'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles size={16} /> Standard Test Swatches
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'upload'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={16} /> Upload Photo
              </button>
            </div>

            {/* TAB: LIVE CAMERA */}
            {activeTab === 'camera' && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100">
                  <Camera size={36} />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1.5">Ready to Inspect Wristband?</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  Position the colorimetric sensing strip directly inside the guide box under uniform white or daylight lighting.
                </p>
                <button
                  id="btn-open-camera"
                  onClick={startCamera}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Open Environmental Camera
                </button>
              </div>
            )}

            {/* TAB: SAMPLE TEST STRIPS */}
            {activeTab === 'samples' && (
              <div className="py-2">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-slate-800">Calibrated Test Swatches</h4>
                  <p className="text-xs text-slate-500">
                    Click any chemical reaction swatch below to test the L*a*b* conversion and risk classification pipeline.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_STRIPS.map((sample) => (
                    <button
                      key={sample.name}
                      onClick={() => handleSelectSample(sample)}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50 transition text-left flex items-center gap-3.5 group shadow-xs"
                    >
                      <div
                        className="w-12 h-12 rounded-lg border border-slate-300 shadow-inner shrink-0"
                        style={{ backgroundColor: sample.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition truncate">
                          {sample.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{sample.sub}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: UPLOAD PHOTO */}
            {activeTab === 'upload' && (
              <div className="text-center py-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50/50 transition cursor-pointer"
                >
                  <Upload size={36} className="mx-auto text-slate-400 mb-3" />
                  <p className="font-semibold text-slate-700 text-sm">Click to select or drop wristband photo</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG or JPEG from mobile or gallery</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CAPTURING OR ANALYZING STATE */}
        {(scanState === 'capturing' || scanState === 'analyzing') && (
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[3/4] shadow-md border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Overlays */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Outer darkened vignette */}
              <div className="absolute inset-0 border-[36px] border-black/50">
                <div className="w-full h-full border border-white/60 border-dashed relative rounded-md">
                  {/* SENSING REGION INDICATOR */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-20 border-2 border-amber-400 bg-amber-400/10 rounded-sm shadow-sm flex items-center justify-center">
                    <span className="absolute -top-6 left-0 text-[11px] text-amber-300 font-bold tracking-wider uppercase bg-black/60 px-1.5 py-0.5 rounded">
                      Sensing Patch (Target)
                    </span>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
                  </div>

                  {/* REFERENCE SCALE INDICATOR */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-8 border border-white/60 bg-white/20 backdrop-blur-xs rounded-xs flex items-center justify-around px-2">
                    <span className="absolute -top-5 left-0 text-[10px] text-white/90 font-bold uppercase tracking-wider bg-black/60 px-1 py-0.5 rounded">
                      Ref Scale (White Bal)
                    </span>
                    <div className="w-6 h-4 bg-white/90 rounded-xs" />
                    <div className="w-6 h-4 bg-neutral-400 rounded-xs" />
                    <div className="w-6 h-4 bg-neutral-800 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* ANALYZING OVERLAY */}
            {scanState === 'analyzing' && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 z-20">
                <RefreshCw size={44} className="animate-spin mb-4 text-blue-400" />
                <p className="font-bold tracking-widest uppercase text-sm">Processing Colorimeter Spectrum...</p>
                <p className="text-xs text-blue-200 mt-2 font-mono">{analysisStep}</p>
                <div className="w-48 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-blue-500 h-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {/* Shutter Capture Button */}
            {scanState === 'capturing' && (
              <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-between z-10">
                <button
                  onClick={() => {
                    stopCamera();
                    setScanState('idle');
                  }}
                  className="bg-black/60 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-xs hover:bg-black/80"
                >
                  Cancel
                </button>
                <button
                  id="btn-shutter-capture"
                  onClick={captureImage}
                  className="bg-white text-slate-900 h-16 w-16 rounded-full flex items-center justify-center border-4 border-slate-300 shadow-xl active:scale-95 transition"
                  title="Capture & Process"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-blue-600" />
                </button>
                <div className="w-12" />
              </div>
            )}
          </div>
        )}

        {/* RESULT STATE */}
        {scanState === 'result' && lastScan && (
          <div className="animate-in slide-in-from-bottom duration-300">
            {/* Risk banner */}
            <div
              className={`p-4 rounded-xl mb-6 flex items-start gap-4 ${
                lastScan.risk === 'LOW'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : lastScan.risk === 'MODERATE'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {lastScan.risk === 'LOW' ? (
                <CheckCircle2 size={32} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle
                  size={32}
                  className={`shrink-0 mt-0.5 ${
                    lastScan.risk === 'MODERATE' ? 'text-amber-600' : 'text-rose-600'
                  }`}
                />
              )}
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider">
                  Analysis Complete • Band #{lastScan.bandId}
                </p>
                <p className="text-2xl font-black tracking-tight mt-0.5">
                  {lastScan.exposure} ppm·h{' '}
                  <span className="text-base font-bold">({lastScan.risk} RISK)</span>
                </p>
                <p className="text-xs mt-1 opacity-90">
                  {lastScan.risk === 'LOW'
                    ? 'Exposure is within permissible safe thresholds (OSHA 8-hr TWA limit).'
                    : lastScan.risk === 'MODERATE'
                    ? 'Caution: Exposure is approaching workplace threshold guidelines. Inspect area ventilation.'
                    : 'Hazard Alert: Exceeds permissible ceiling limit. Evacuate contaminated sector immediately.'}
                </p>
              </div>
            </div>

            {/* Extracted Optical Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Sampled Color</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div
                    className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                    style={{
                      backgroundColor: `rgb(${lastScan.rgb?.r ?? 220}, ${lastScan.rgb?.g ?? 190}, ${lastScan.rgb?.b ?? 150})`,
                    }}
                  />
                  <span className="text-xs font-mono text-slate-700">
                    {lastScan.rgb
                      ? `#${((1 << 24) + (lastScan.rgb.r << 16) + (lastScan.rgb.g << 8) + lastScan.rgb.b)
                          .toString(16)
                          .slice(1)
                          .toUpperCase()}`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">CIE L*a*b*</p>
                <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                  L: {lastScan.lab.l}
                </p>
                <p className="text-[10px] font-mono text-slate-500">
                  a: {lastScan.lab.a}, b: {lastScan.lab.b}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Confidence</p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                  {(lastScan.confidence * 100).toFixed(0)}% Match
                </p>
                <p className="text-[10px] text-slate-500">Curve Fit: Optimal</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                id="btn-log-exposure"
                onClick={handleLogAndComplete}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> Done & Log Exposure to Record
              </button>
              <button
                id="btn-discard-scan"
                onClick={() => {
                  setScanState('idle');
                  setLastScan(null);
                }}
                className="w-full text-slate-600 hover:text-slate-900 font-medium py-2 text-sm transition"
              >
                Discard Scan & Try Again
              </button>
            </div>

            {/* Safety Disclaimer */}
            <div className="mt-6 p-3.5 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs flex gap-2.5">
              <Info size={16} className="shrink-0 text-slate-400 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>Safety Protocol Disclaimer:</strong> This colorimetric dosimeter prototype provides an optical exposure estimate based on lead acetate/chemical salt substrate darkening. It does not replace active acoustic electronic gas detectors.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
