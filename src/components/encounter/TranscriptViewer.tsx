"use client";

import React, { useState } from "react";
import { MessageSquare, User, Stethoscope, Copy, Check, Search, Edit3 } from "lucide-react";

interface Turn {
  speaker: 'Clinician' | 'Patient' | 'Caregiver';
  text: string;
  timestamp: string;
}

interface TranscriptViewerProps {
  turns: Turn[];
  onUpdateTurn: (index: number, newText: string) => void;
  onLogAudit: (action: string, details: string, category: 'USER_EDIT') => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  turns,
  onUpdateTurn,
  onLogAudit,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditText(currentText);
  };

  const handleSaveEdit = (index: number) => {
    if (editText.trim() && editText !== turns[index].text) {
      onUpdateTurn(index, editText.trim());
      onLogAudit(
        "Transcript Correction",
        `Clinician manually edited turn ${index + 1} (${turns[index].speaker}): "${turns[index].text.slice(0, 35)}..." -> "${editText.trim().slice(0, 35)}..."`,
        'USER_EDIT'
      );
    }
    setEditingIndex(null);
  };

  const handleCopyTranscript = () => {
    const full = turns.map(t => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join("\n\n");
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTurns = turns.filter(t => 
    t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-xs text-slate-800">
            Consultation Transcript ({turns.length} turns)
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-7 pr-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 bg-white"
            />
          </div>

          <button
            onClick={handleCopyTranscript}
            className="flex items-center space-x-1 text-xs px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Transcript Turns List */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {turns.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active transcript. Choose a consultation scenario above or click record to start.
          </div>
        ) : (
          filteredTurns.map((turn, idx) => {
            const isClinician = turn.speaker === 'Clinician';
            const isEditing = editingIndex === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition ${
                  isClinician
                    ? 'bg-blue-50/40 border-blue-100'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isClinician
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isClinician ? <Stethoscope className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {turn.speaker}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {turn.timestamp}
                    </span>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(idx, turn.text)}
                      className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1 transition"
                      title="Edit transcript text"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span className="text-[10px]">Edit</span>
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="text-[11px] px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      >
                        Save Correction
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-800 leading-relaxed font-normal">
                    {turn.text}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
