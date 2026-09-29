"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  HelpCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Plus,
  Filter
} from "lucide-react";
import { ActionItem, ActionType, ActionStatus } from "@/types/clinical";

interface ActionExtractorTableProps {
  actions: ActionItem[];
  onUpdateActionStatus: (id: string, status: ActionStatus) => void;
  onModifyAction: (updated: ActionItem) => void;
  onAddAction: (newAction: ActionItem) => void;
  onLogAudit: (action: string, details: string, category: 'ACTION_DECISION') => void;
}

export const ActionExtractorTable: React.FC<ActionExtractorTableProps> = ({
  actions,
  onUpdateActionStatus,
  onModifyAction,
  onAddAction,
  onLogAudit,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // New action form fields
  const [newType, setNewType] = useState<ActionType>('LAB_ORDER');
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrgency, setNewUrgency] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE');
  const [newRecipient, setNewRecipient] = useState("");

  const handleAccept = (id: string, title: string) => {
    onUpdateActionStatus(id, 'ACCEPTED');
    onLogAudit("Clinical Action Accepted", `Clinician accepted action: "${title}"`, 'ACTION_DECISION');
  };

  const handleReject = (id: string, title: string) => {
    onUpdateActionStatus(id, 'REJECTED');
    onLogAudit("Clinical Action Rejected", `Clinician rejected/dismissed action: "${title}"`, 'ACTION_DECISION');
  };

  const handleStartEdit = (item: ActionItem) => {
    setEditingActionId(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description);
  };

  const handleSaveEdit = (item: ActionItem) => {
    const updated: ActionItem = {
      ...item,
      title: editTitle.trim(),
      description: editDesc.trim(),
      status: 'MODIFIED',
    };
    onModifyAction(updated);
    setEditingActionId(null);
    onLogAudit("Clinical Action Modified", `Clinician modified action details: "${item.title}" -> "${updated.title}"`, 'ACTION_DECISION');
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: ActionItem = {
      id: `act-manual-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      urgency: newUrgency,
      recipientOrTarget: newRecipient.trim() || undefined,
      status: 'ACCEPTED',
      rationale: "Manually added by attending clinician during review."
    };

    onAddAction(created);
    setShowAddForm(false);
    setNewTitle("");
    setNewDesc("");
    setNewRecipient("");
    onLogAudit("Manual Action Added", `Clinician manually created order/action: "${created.title}" (${created.type})`, 'ACTION_DECISION');
  };

  const filtered = actions.filter((a) => {
    if (filterType === 'ALL') return true;
    return a.type === filterType;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-300">STAT</span>;
      case 'URGENT':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300">URGENT</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-200">ROUTINE</span>;
    }
  };

  const getTypeColor = (type: ActionType) => {
    switch (type) {
      case 'REFERRAL':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'LAB_ORDER':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'PRESCRIPTION':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'FOLLOW_UP':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'PATIENT_INSTRUCTION':
        return 'text-teal-700 bg-teal-50 border-teal-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-800">
              Downstream Clinical Actions & Orders ({actions.length})
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            AI-extracted orders require professional review and explicit approval.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add Manual Action */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Action</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
        {['ALL', 'REFERRAL', 'LAB_ORDER', 'PRESCRIPTION', 'FOLLOW_UP', 'PATIENT_INSTRUCTION'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-0.5 rounded transition ${
              filterType === type
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Manual Add Action Drawer Form */}
      {showAddForm && (
        <form onSubmit={handleCreateNew} className="p-3 bg-blue-50/70 border-b border-blue-200 text-xs space-y-2">
          <div className="font-bold text-blue-900 flex items-center justify-between">
            <span>Add New Clinical Action</span>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ActionType)}
              className="p-1.5 text-xs bg-white rounded border border-slate-300"
            >
              <option value="LAB_ORDER">Lab Order</option>
              <option value="REFERRAL">Referral</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="PATIENT_INSTRUCTION">Patient Instruction</option>
            </select>
            <select
              value={newUrgency}
              onChange={(e) => setNewUrgency(e.target.value as any)}
              className="p-1.5 text-xs bg-white rounded border border-slate-300"
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT</option>
            </select>
            <input
              type="text"
              placeholder="Recipient (e.g. Podiatry, Lab)"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              className="p-1.5 text-xs bg-white rounded border border-slate-300"
            />
          </div>
          <input
            type="text"
            placeholder="Action Title (e.g. Repeat HbA1c & CMP)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full p-1.5 text-xs bg-white rounded border border-slate-300"
            required
          />
          <textarea
            placeholder="Clinical details / instructions..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
            className="w-full p-1.5 text-xs bg-white rounded border border-slate-300"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
            >
              Save Action
            </button>
          </div>
        </form>
      )}

      {/* Action Cards List */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No actions found in this category.
          </div>
        ) : (
          filtered.map((item) => {
            const isEditing = editingActionId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition ${
                  item.status === 'ACCEPTED'
                    ? 'bg-emerald-50/30 border-emerald-300'
                    : item.status === 'REJECTED'
                    ? 'bg-slate-50 border-slate-200 opacity-60 line-through'
                    : item.status === 'MODIFIED'
                    ? 'bg-blue-50/30 border-blue-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(item.type)}`}>
                      {item.type.replace('_', ' ')}
                    </span>
                    {getUrgencyBadge(item.urgency)}
                    {item.recipientOrTarget && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        → {item.recipientOrTarget}
                      </span>
                    )}
                  </div>

                  {/* Decision State Tag */}
                  <div>
                    {item.status === 'ACCEPTED' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Accepted
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        ✕ Dismissed
                      </span>
                    )}
                    {item.status === 'MODIFIED' && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        ✎ Modified
                      </span>
                    )}
                    {item.status === 'SUGGESTED' && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-blue-400 font-semibold"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-1.5 rounded border border-blue-400"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingActionId(null)}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item)}
                        className="text-[11px] px-2.5 py-0.5 bg-blue-600 text-white rounded font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.title}</div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
                    {item.rationale && (
                      <p className="text-[11px] text-slate-400 mt-1 italic flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-blue-500" />
                        Rationale: {item.rationale}
                      </p>
                    )}
                  </div>
                )}

                {/* Clinician Decision Buttons */}
                {!isEditing && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleReject(item.id, item.title)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                          item.status === 'REJECTED'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                        }`}
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleAccept(item.id, item.title)}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded transition ${
                          item.status === 'ACCEPTED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        Accept & Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
