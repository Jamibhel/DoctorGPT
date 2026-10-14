"use client";

import React, { useEffect } from "react";
import { Keyboard, X, Command, CornerDownLeft, Sparkles, Shield, Activity } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      category: "Global Navigation & Workspaces",
      shortcuts: [
        { key: "Alt + 1", desc: "Command Center & Ward Census" },
        { key: "Alt + 2", desc: "Patient Chart & Vitals Flowsheet" },
        { key: "Alt + 3", desc: "Patient Registry & Master EMPI" },
        { key: "Alt + 4", desc: "CPOE Orders & eMAR Administration" },
        { key: "Alt + 5", desc: "Inpatient Bed Matrix & ADT" },
        { key: "Alt + 6", desc: "Emergency Trauma & Resuscitation" },
        { key: "Alt + 7", desc: "Operating Theatre (OT) & Surgery" },
        { key: "Alt + 8", desc: "PACS DICOM Radiology Worklist" },
        { key: "Alt + 9", desc: "Enterprise FHIR R4 Interoperability & HIE" },
        { key: "Alt + 0", desc: "Facility Operations & Tenant Admin" },
      ],
    },
    {
      category: "Clinical Speed & Terminal Actions",
      shortcuts: [
        { key: "Ctrl + K / ⌘ + K", desc: "Omni-Search (Patient, MRN, Bed, Doctor)" },
        { key: "? / Shift + /", desc: "Open this Keyboard Shortcuts cheat sheet" },
        { key: "Alt + L", desc: "Lock Clinical Session (Shared Terminal Lock)" },
        { key: "Alt + V", desc: "Quick-Record Inpatient Vitals (NEWS2)" },
        { key: "Alt + O", desc: "Direct CPOE Order Entry Modal" },
        { key: "Esc", desc: "Dismiss modal, overlay, or search palette" },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-bji w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-bji bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Clinical Keyboard Navigation
              </h2>
              <p className="text-[11px] text-slate-400">
                High-efficiency workstation shortcuts for rapid clinical entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-bji transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4 custom-scrollbar">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    className="p-2 bg-slate-950 border border-slate-800/80 rounded-bji flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <span className="text-slate-300 text-[11px] font-medium">{sc.desc}</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-bji text-[10px] font-mono font-semibold shadow-xs">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> BJI MediSupport Enterprise Workstation
          </span>
          <span className="text-slate-500">Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
