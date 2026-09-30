"use client";

import React, { useState } from "react";
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
  Maximize2 
} from "lucide-react";
import { RadiologyStudy } from "@/types/hospital";

interface PacsStyleViewerModalProps {
  study: RadiologyStudy | null;
  onClose: () => void;
}

export const PacsStyleViewerModal: React.FC<PacsStyleViewerModalProps> = ({ study, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [windowLevel, setWindowLevel] = useState<'STANDARD' | 'BONE' | 'LUNG' | 'SOFT_TISSUE'>('STANDARD');
  const [invertContrast, setInvertContrast] = useState(false);
  const [showAiBoxes, setShowAiBoxes] = useState(true);

  if (!study) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg max-w-6xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* PACS Header Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs font-mono">
              PACS
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-white">{study.studyType}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {study.modality} • {study.bodySite}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Study Date: {new Date(study.studyDate).toLocaleString()} • Radiologist: {study.radiologistId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PACS Controls Toolbar */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Zoom & Rotate */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-mono text-[10px] mr-1">Controls:</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              title="Rotate 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setInvertContrast(!invertContrast)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                invertContrast ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              Invert
            </button>
          </div>

          {/* Window / Level Presets */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-mono text-[10px] mr-1">Preset:</span>
            {(['STANDARD', 'BONE', 'LUNG', 'SOFT_TISSUE'] as const).map(w => (
              <button
                key={w}
                onClick={() => setWindowLevel(w)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  windowLevel === w
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {w.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* AI Overlays Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAiBoxes(!showAiBoxes)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                showAiBoxes
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Detections ({study.aiBoundingBoxes?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Viewport Split: Left Viewer, Right Radiologist Report */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Imaging Canvas */}
          <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden select-none">
            <div 
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: invertContrast 
                  ? 'invert(100%) contrast(140%)' 
                  : windowLevel === 'BONE'
                  ? 'contrast(180%) brightness(90%)'
                  : windowLevel === 'LUNG'
                  ? 'contrast(150%) brightness(120%)'
                  : 'contrast(115%)'
              }}
            >
              <img
                src={study.imageThumbnailUrl}
                alt={study.studyType}
                className="max-h-[55vh] lg:max-h-[70vh] rounded object-contain shadow-2xl border border-slate-800"
              />

              {/* AI Bounding Box Overlays */}
              {showAiBoxes && study.aiBoundingBoxes?.map((box) => (
                <div
                  key={box.id}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/15 rounded pointer-events-auto group cursor-pointer"
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

                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-56 p-2 bg-slate-900/95 border border-emerald-600 rounded text-[10px] text-slate-200 z-30 shadow-xl">
                    <p className="font-bold text-emerald-400">{box.label}</p>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{box.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scale indicator */}
            <div className="absolute bottom-2 left-3 text-[9px] font-mono text-slate-500 bg-black/60 px-1.5 py-0.5 rounded">
              Zoom: {(zoom * 100).toFixed(0)}% • W/L: {windowLevel} • Lossless DICOM
            </div>
          </div>

          {/* Right Column: Formal Radiologist Report */}
          <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 overflow-y-auto flex flex-col justify-between text-xs">
            <div className="space-y-3.5">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-xs text-white">Diagnostic Radiology Report</h3>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Clinical Findings
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  {study.findings}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Radiologist Impression
                </span>
                <p className="text-[11px] text-white font-medium leading-relaxed bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  {study.impression}
                </p>
              </div>

              {study.aiBoundingBoxes && study.aiBoundingBoxes.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                    AI Computer-Aided Observations
                  </span>
                  <div className="space-y-1.5">
                    {study.aiBoundingBoxes.map(box => (
                      <div key={box.id} className="p-2 rounded bg-cyan-950/30 border border-cyan-800/40 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-300">{box.label}</span>
                          <span className="text-[9px] font-mono text-cyan-400">{(box.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{box.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[9px] text-slate-500 font-mono">
              Authenticated by {study.radiologistId} • ACR Standards
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
