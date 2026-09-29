"use client";

import React from "react";
import { History, X, Shield, CheckCircle, Edit, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
import { AuditEntry } from "@/types/clinical";

interface AuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AuditEntry[];
}

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  entries,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI_GENERATION':
        return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
      case 'USER_EDIT':
        return <Edit className="w-3.5 h-3.5 text-amber-500" />;
      case 'ACTION_DECISION':
        return <AlertCircle className="w-3.5 h-3.5 text-purple-500" />;
      case 'APPROVAL':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'QUERY':
        return <MessageCircle className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Clinical Workflow Audit Trail</h3>
              <p className="text-[11px] text-slate-500">Immutable trace of human-AI collaboration & approvals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trail List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No audit records logged yet.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    {getCategoryIcon(entry.category)}
                    <span>{entry.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{entry.details}</p>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Actor: <strong className="text-slate-700">{entry.actor}</strong></span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{entry.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
