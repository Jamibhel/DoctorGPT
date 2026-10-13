"use client";

import React, { useState, useMemo } from "react";
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Sun, 
  Eye, 
  EyeOff, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  Sliders, 
  Maximize2,
  Minimize2,
  Ruler,
  SplitSquareVertical,
  Activity,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2
} from "lucide-react";
import { RadiologyStudy } from "@/types/hospital";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface PacsStyleViewerModalProps {
  study: RadiologyStudy | null;
  onClose: () => void;
}

export const PacsStyleViewerModal: React.FC<PacsStyleViewerModalProps> = ({ study, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Window / Level Presets (Hounsfield Unit simulations)
  const [windowLevel, setWindowLevel] = useState<'STANDARD' | 'BONE' | 'LUNG' | 'SOFT_TISSUE' | 'BRAIN'>('STANDARD');
  const [invertContrast, setInvertContrast] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  // Overlays
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showCrosshairs, setShowCrosshairs] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'ai' | 'metadata'>('report');

  if (!study) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setWindowLevel('STANDARD');
    setInvertContrast(false);
    setBrightness(100);
    setContrast(100);
    setSelectedBoxId(null);
  };

  // Compute CSS filter based on LUT window presets
  const computedFilter = useMemo(() => {
    let baseFilter = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (invertContrast) {
      baseFilter += ` invert(100%)`;
    }

    switch (windowLevel) {
      case 'BONE': // High contrast, high threshold
        return `${baseFilter} contrast(185%) brightness(90%) grayscale(100%)`;
      case 'LUNG': // Accentuate low-attenuation bronchial patterns
        return `${baseFilter} contrast(150%) brightness(125%) grayscale(100%)`;
      case 'SOFT_TISSUE': // Moderate contrast for viscera/musculature
        return `${baseFilter} contrast(120%) brightness(105%) grayscale(90%)`;
      case 'BRAIN': // Narrow window for gray/white matter differentiation
        return `${baseFilter} contrast(210%) brightness(95%) grayscale(100%)`;
      case 'STANDARD':
      default:
        return `${baseFilter} grayscale(100%)`;
    }
  }, [windowLevel, invertContrast, brightness, contrast]);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-[#0b0f19] border border-slate-800 text-slate-100 rounded-bji max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* TOP PACS HEADER BAR */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs font-mono">
              PACS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-white tracking-wide">{study.studyType}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {study.modality} • {study.bodySite}
                </span>
                {study.isCriticalAlert && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-700">
                    CRITICAL RADIOLOGY ALERT
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Acquired: {new Date(study.studyDate).toLocaleString()} • DICOM AE: BJI_RAD_CORE • Reader: {study.radiologistId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetView}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
            >
              Reset 1:1
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close PACS Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SECONDARY TOOLBAR: WINDOWING, CONTRAST, ZOOM & CAD TOOLS */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Zoom, Pan, Invert, Rotate */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-mono text-[10px]">Canvas:</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 3.5))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Rotate 90 Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setInvertContrast(!invertContrast)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition font-mono ${
                invertContrast ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Invert LUT
            </button>
            <button
              onClick={() => setShowCrosshairs(!showCrosshairs)}
              className={`p-1.5 rounded text-[11px] font-mono transition ${
                showCrosshairs ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Center Crosshairs"
            >
              <Ruler className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Window / Level HU Presets */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-mono text-[10px] mr-1">W/L Preset:</span>
            {(['STANDARD', 'BONE', 'LUNG', 'SOFT_TISSUE', 'BRAIN'] as const).map(w => (
              <button
                key={w}
                onClick={() => setWindowLevel(w)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition ${
                  windowLevel === w
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {w.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* AI CAD Overlays Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAiBoxes(!showAiBoxes)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1.5 ${
                showAiBoxes
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI CAD Overlays ({study.aiBoundingBoxes?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* MAIN VIEWPORT SPLIT: LEFT MEDICAL CANVAS / RIGHT RADIOLOGY REPORT */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* MEDICAL IMAGING VIEWPORT (Interactive Pan/Zoom Canvas) */}
          <div 
            className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Center Crosshairs Guide */}
            {showCrosshairs && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                <div className="w-full h-px bg-cyan-500/30" />
                <div className="h-full w-px bg-cyan-500/30 absolute" />
              </div>
            )}

            <div 
              className="relative transition-transform duration-100 ease-out select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                filter: computedFilter
              }}
            >
              <img
                src={study.imageThumbnailUrl}
                alt={study.studyType}
                className="max-h-[58vh] lg:max-h-[72vh] rounded object-contain shadow-2xl border border-slate-900 pointer-events-none"
                draggable={false}
              />

              {/* AI Bounding Box Overlays */}
              {showAiBoxes && study.aiBoundingBoxes?.map((box) => {
                const isSelected = selectedBoxId === box.id;
                return (
                  <div
                    key={box.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBoxId(isSelected ? null : box.id);
                    }}
                    className={`absolute rounded pointer-events-auto transition cursor-pointer group ${
                      isSelected
                        ? 'border-2 border-emerald-300 bg-emerald-500/25 ring-2 ring-emerald-400'
                        : 'border-2 border-emerald-400/80 bg-emerald-500/15 hover:bg-emerald-500/25'
                    }`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded text-[9px] font-mono whitespace-nowrap shadow-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{box.label} ({(box.confidence * 100).toFixed(0)}%)</span>
                    </div>

                    {/* Popover on hover or selection */}
                    <div className={`${isSelected ? 'block' : 'hidden group-hover:block'} absolute top-full left-0 mt-1 w-60 p-2.5 bg-slate-900/95 border border-emerald-600 rounded text-[10px] text-slate-200 z-30 shadow-2xl backdrop-blur-xs`}>
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="font-bold text-emerald-400">{box.label}</span>
                        <span className="font-mono text-[9px] text-slate-400">P={(box.confidence).toFixed(2)}</span>
                      </div>
                      <p className="text-slate-300 mt-1 leading-relaxed text-[10.5px]">{box.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Telemetry HUD */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
              <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded backdrop-blur-xs">
                Zoom: {(zoom * 100).toFixed(0)}% • Rot: {rotation}° • LUT: {windowLevel} {invertContrast ? '(Inverted)' : ''}
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded backdrop-blur-xs text-slate-400">
                DICOM 3.0 • 16-bit Matrix • Lossless Streaming
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: DIAGNOSTIC RADIOLOGY REPORT & CAD FINDINGS */}
          <div className="w-full lg:w-88 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between text-xs">
            {/* Header Tabs */}
            <div className="p-2 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('report')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    activeTab === 'report' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Radiology Report
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'ai' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>AI Detections</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {study.aiBoundingBoxes?.length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('metadata')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    activeTab === 'metadata' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  DICOM Tags
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {activeTab === 'report' && (
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Exam Findings
                    </span>
                    <div className="text-[11px] text-slate-200 leading-relaxed bg-slate-900/90 p-3 rounded border border-slate-800 font-sans">
                      {study.findings}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      Impression &amp; Recommendations
                    </span>
                    <div className="text-[11px] text-white font-medium leading-relaxed bg-slate-900/90 p-3 rounded border border-emerald-900/50 font-sans">
                      {study.impression}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Modality:</span>
                      <strong className="text-slate-200">{study.modality}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Body Site:</span>
                      <strong className="text-slate-200">{study.bodySite}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Study Date:</span>
                      <strong className="text-slate-200">{new Date(study.studyDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-2.5">
                  <div className="p-2 bg-emerald-950/30 border border-emerald-800/40 rounded text-[11px] text-emerald-300 leading-tight">
                    <strong>Computer-Aided Detection (CAD):</strong> Overlays represent neural visual analysis for anatomical lesions. Verify clinically.
                  </div>

                  {study.aiBoundingBoxes?.map(box => (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBoxId(box.id)}
                      className={`p-3 rounded border transition cursor-pointer ${
                        selectedBoxId === box.id
                          ? 'bg-emerald-950/50 border-emerald-500'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-400">{box.label}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {(box.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{box.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'metadata' && (
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">SOP Instance UID:</span>
                    <span className="text-slate-200">1.2.840.10008.5.1.4.1.1.2</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Patient ID / MRN:</span>
                    <span className="text-slate-200">{study.patientId}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Photometric:</span>
                    <span className="text-slate-200">MONOCHROME2</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Bits Allocated:</span>
                    <span className="text-slate-200">16 bits</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Transfer Syntax:</span>
                    <span className="text-slate-200">Explicit VR Little Endian</span>
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated Radiologist Signature Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Signed by {study.radiologistId}</span>
              </span>
              <span>ACR Peer-Reviewed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
