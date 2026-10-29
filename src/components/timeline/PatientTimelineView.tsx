"use client";

import React, { useState, useMemo } from "react";
import { 
  Activity, 
  Pill, 
  TestTube2, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  ArrowRightLeft, 
  LogOut, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  Eye,
  X,
  Stethoscope,
  Info
} from "lucide-react";
import { useHospital } from "@/lib/state/hospital-store";
import { ClinicalEvent, ClinicalEventType } from "@/types/hospital";
import { Button, Input, Badge, Dialog } from "@/components/ui";

export const PatientTimelineView: React.FC = () => {
  const { 
    events, 
    activePatientId, 
    activePatient,
    observations,
    labs,
    orders,
    imaging,
    notes,
    encounters
  } = useHospital();

  // State Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<ClinicalEvent | null>(null);

  // Compile Comprehensive Longitudinal Events:
  // Combines explicitly emitted clinical_events with vital observations, orders, labs, imaging, notes, and encounters
  const synthesizedEvents = useMemo(() => {
    const list: ClinicalEvent[] = [...events.filter(e => e.patientId === activePatientId)];

    // 1. Ingest vital observations with NEWS2 score
    observations
      .filter(o => o.patientId === activePatientId)
      .forEach(obs => {
        if (!list.some(e => e.id === `obs-event-${obs.id}`)) {
          list.push({
            id: `obs-event-${obs.id}`,
            facilityId: obs.facilityId,
            patientId: obs.patientId,
            encounterId: obs.encounterId,
            type: "VITAL_RECORDED",
            timestamp: obs.timestamp,
            authorId: obs.recordedBy,
            authorName: obs.recordedBy.split('/').pop() || "Clinician",
            authorRole: "NURSE",
            departmentId: "CLINICAL_UNIT",
            title: `Vitals Logged — NEWS2: ${obs.news2Score} (${obs.news2RiskTier})`,
            description: `BP: ${obs.systolicBP}/${obs.diastolicBP} mmHg, HR: ${obs.heartRate} bpm, RR: ${obs.respirationRate}/min, SpO2: ${obs.spO2}% (${obs.supplementalOxygen ? 'O2 Supplied' : 'Room Air'}), Temp: ${obs.temperatureCelsius}°C, AVPU: ${obs.consciousness}`,
            metadata: {
              news2Score: obs.news2Score,
              news2RiskTier: obs.news2RiskTier,
              systolicBP: obs.systolicBP,
              diastolicBP: obs.diastolicBP,
              heartRate: obs.heartRate,
              spO2: obs.spO2
            }
          });
        }
      });

    // 2. Ingest diagnostic lab results
    labs
      .filter(l => l.patientId === activePatientId)
      .forEach(lab => {
        if (!list.some(e => e.id === `lab-event-${lab.id}`)) {
          list.push({
            id: `lab-event-${lab.id}`,
            facilityId: lab.facilityId,
            patientId: lab.patientId,
            encounterId: "Encounter/current",
            type: "LAB_RESULTED",
            timestamp: lab.collectedAt,
            authorId: lab.performingLab,
            authorName: lab.performingLab.split('/').pop() || "Laboratory Technologist",
            authorRole: "LAB_TECH",
            departmentId: "DIAGNOSTIC_PATHOLOGY",
            title: `Laboratory: ${lab.testName} (${lab.flag || 'Normal'})`,
            description: `Result: ${lab.value} ${lab.unit} (Reference Range: ${lab.referenceRange}). Panel: ${lab.category}`,
            metadata: {
              category: lab.category,
              value: lab.value,
              unit: lab.unit,
              flag: lab.flag,
              isCritical: lab.flag === "CRITICAL_HIGH" || lab.flag === "CRITICAL_LOW"
            }
          });
        }
      });

    // 3. Ingest PACS Imaging
    imaging
      .filter(img => img.patientId === activePatientId)
      .forEach(study => {
        if (!list.some(e => e.id === `img-event-${study.id}`)) {
          list.push({
            id: `img-event-${study.id}`,
            facilityId: study.facilityId,
            patientId: study.patientId,
            encounterId: "Encounter/current",
            type: "NOTE_SIGNED",
            timestamp: study.studyDate,
            authorId: study.radiologistId,
            authorName: study.radiologistId.split('/').pop() || "Radiologist",
            authorRole: "RADIOLOGIST",
            departmentId: "RADIOLOGY",
            title: `Radiology Study: ${study.modality} ${study.studyType}`,
            description: `Impression: ${study.impression}. Findings: ${study.findings}`,
            metadata: {
              modality: study.modality,
              accessionNumber: study.id,
              isCriticalAlert: study.isCriticalAlert
            }
          });
        }
      });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, observations, labs, imaging, activePatientId]);

  // Filtered by Category and Search Text
  const filteredEvents = useMemo(() => {
    return synthesizedEvents.filter(evt => {
      // Category Filter
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "VITALS" && evt.type !== "VITAL_RECORDED") return false;
        if (selectedCategory === "MEDS" && !["MEDICATION_ORDERED", "PHARMACY_VERIFIED", "MEDICATION_ADMINISTERED"].includes(evt.type)) return false;
        if (selectedCategory === "LABS" && evt.type !== "LAB_RESULTED") return false;
        if (selectedCategory === "NOTES" && evt.type !== "NOTE_SIGNED") return false;
        if (selectedCategory === "ADT" && !["PATIENT_ADMITTED", "PATIENT_TRANSFERRED", "PATIENT_DISCHARGED"].includes(evt.type)) return false;
        if (selectedCategory === "ALERTS" && !["EMERGENCY_CODE_TRIGGERED", "CDS_ALERT_TRIGGERED", "ALLERGY_RECORDED"].includes(evt.type)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = evt.title.toLowerCase().includes(q);
        const descMatch = evt.description.toLowerCase().includes(q);
        const authorMatch = evt.authorName.toLowerCase().includes(q);
        return titleMatch || descMatch || authorMatch;
      }

      return true;
    });
  }, [synthesizedEvents, selectedCategory, searchQuery]);

  // Icon mapping
  const getEventBadge = (type: ClinicalEventType) => {
    switch (type) {
      case 'PATIENT_ADMITTED':
        return { icon: <UserCheck className="w-3.5 h-3.5 text-bji-green-700" />, tone: "success" as const, label: "ADT Admit" };
      case 'PATIENT_TRANSFERRED':
        return { icon: <ArrowRightLeft className="w-3.5 h-3.5 text-bji-blue-700" />, tone: "info" as const, label: "Transfer" };
      case 'PATIENT_DISCHARGED':
        return { icon: <LogOut className="w-3.5 h-3.5 text-bji-slate-700" />, tone: "neutral" as const, label: "Discharge" };
      case 'VITAL_RECORDED':
        return { icon: <Activity className="w-3.5 h-3.5 text-bji-blue-700" />, tone: "info" as const, label: "Vitals" };
      case 'ALLERGY_RECORDED':
        return { icon: <ShieldAlert className="w-3.5 h-3.5 text-bji-red-700" />, tone: "critical" as const, label: "Allergy Alert" };
      case 'MEDICATION_ORDERED':
        return { icon: <Pill className="w-3.5 h-3.5 text-bji-blue-700" />, tone: "info" as const, label: "CPOE Order" };
      case 'PHARMACY_VERIFIED':
        return { icon: <CheckCircle2 className="w-3.5 h-3.5 text-bji-green-700" />, tone: "success" as const, label: "Pharmacy" };
      case 'MEDICATION_ADMINISTERED':
        return { icon: <Pill className="w-3.5 h-3.5 text-bji-green-700" />, tone: "success" as const, label: "eMAR Given" };
      case 'LAB_RESULTED':
        return { icon: <TestTube2 className="w-3.5 h-3.5 text-bji-amber-700" />, tone: "warning" as const, label: "Diagnostic Lab" };
      case 'NOTE_SIGNED':
        return { icon: <FileText className="w-3.5 h-3.5 text-bji-slate-700" />, tone: "neutral" as const, label: "Clinical Note" };
      case 'EMERGENCY_CODE_TRIGGERED':
      case 'CDS_ALERT_TRIGGERED':
        return { icon: <AlertCircle className="w-3.5 h-3.5 text-bji-red-700" />, tone: "critical" as const, label: "Critical Safety" };
      default:
        return { icon: <Clock className="w-3.5 h-3.5 text-bji-slate-500" />, tone: "neutral" as const, label: "Event" };
    }
  };

  return (
    <div className="bg-white rounded-bji p-4 sm:p-5 border border-bji-slate-300 shadow-2xs space-y-4">
      {/* 1. Timeline Header & Summary Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-bji-slate-200">
        <div>
          <h3 className="font-bold text-sm text-bji-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-bji-green-700" />
            <span>Longitudinal Clinical Event Stream &amp; Timeline</span>
          </h3>
          <p className="text-meta text-bji-slate-500 mt-0.5">
            Unified chronological audit feed for <strong className="text-bji-slate-800">{activePatient.lastName}, {activePatient.firstName}</strong> ({activePatient.mrn})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="neutral" size="xs">
            {filteredEvents.length} Recorded Events
          </Badge>
          <span className="text-meta text-bji-slate-400 font-mono">
            {activePatient.activeConditions[0] || "Inpatient Care"}
          </span>
        </div>
      </div>

      {/* 2. Filter Ribbon & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-bji-slate-50 p-2.5 rounded-bji border border-bji-slate-200">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-meta">
          {[
            { id: "ALL", label: "All Events" },
            { id: "VITALS", label: "Vitals & NEWS2" },
            { id: "MEDS", label: "Orders & eMAR" },
            { id: "LABS", label: "Diagnostics & Labs" },
            { id: "NOTES", label: "Notes & PACS" },
            { id: "ADT", label: "ADT Movements" },
            { id: "ALERTS", label: "Safety Alerts" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-bji-xs font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? "bg-bji-slate-900 text-white shadow-2xs"
                  : "bg-white text-bji-slate-700 border border-bji-slate-300 hover:bg-bji-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-bji-slate-400 absolute left-2.5 top-2.5" />
          <Input
            placeholder="Search timeline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* 3. Chronological Vertical Feed */}
      <div className="relative pl-6 border-l-2 border-bji-slate-200 space-y-4 my-2">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-meta text-bji-slate-500 bg-bji-slate-50 rounded-bji border border-bji-slate-200">
            No clinical timeline events match the selected filters.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const badge = getEventBadge(evt.type);
            const news2Score = (evt.metadata as { news2Score?: number } | undefined)?.news2Score;
            const isHighPriority = evt.type === "EMERGENCY_CODE_TRIGGERED" || evt.type === "CDS_ALERT_TRIGGERED" || (typeof news2Score === "number" && news2Score >= 7);

            return (
              <div key={evt.id} className="relative group">
                {/* Timeline Dot Indicator */}
                <div className={`absolute -left-[33px] top-1.5 w-6 h-6 rounded-bji-xs bg-white border flex items-center justify-center shadow-2xs transition group-hover:scale-110 ${
                  isHighPriority ? "border-bji-red-500 bg-bji-red-50" : "border-bji-slate-300"
                }`}>
                  {badge.icon}
                </div>

                {/* Event Card / Row */}
                <div 
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-bji border transition cursor-pointer ${
                    isHighPriority 
                      ? "bg-bji-red-50/60 border-bji-red-300 hover:bg-bji-red-50" 
                      : "bg-white border-bji-slate-200 hover:bg-bji-slate-50/80 hover:border-bji-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={badge.tone} size="xs">
                        {badge.label}
                      </Badge>
                      <span className="font-bold text-xs text-bji-slate-900">{evt.title}</span>
                    </div>

                    <span className="font-mono text-meta text-bji-slate-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString([], { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-bji-slate-700 leading-relaxed font-sans">
                    {evt.description}
                  </p>

                  <div className="flex items-center justify-between text-meta text-bji-slate-500 font-mono mt-2 pt-2 border-t border-bji-slate-100">
                    <div className="flex items-center gap-2">
                      <span>Recorded by: <strong className="text-bji-slate-700">{evt.authorName}</strong> ({evt.authorRole})</span>
                      {evt.previousValue && evt.newValue && (
                        <span>• Delta: {evt.previousValue} &rarr; {evt.newValue}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-bji-green-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Inspect Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Event Detail Modal for In-Depth Clinical Inspection */}
      <Dialog
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? selectedEvent.title : "Clinical Event Details"}
        subtitle={selectedEvent ? `Timestamp: ${new Date(selectedEvent.timestamp).toLocaleString()} • Event ID: ${selectedEvent.id}` : ""}
        maxWidth="md"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" size="xs" onClick={() => setSelectedEvent(null)}>
              Close Inspection
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-bji-slate-50 rounded-bji border border-bji-slate-200 space-y-1.5">
              <div className="font-semibold text-bji-slate-900">Clinical Event Summary</div>
              <p className="text-bji-slate-700 leading-relaxed">{selectedEvent.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-white rounded-bji border border-bji-slate-200">
                <span className="text-meta text-bji-slate-400 block font-medium">Clinician Author</span>
                <span className="font-semibold text-bji-slate-900">{selectedEvent.authorName}</span>
                <span className="text-[10px] text-bji-slate-500 block">{selectedEvent.authorRole} • {selectedEvent.authorId}</span>
              </div>

              <div className="p-2.5 bg-white rounded-bji border border-bji-slate-200">
                <span className="text-meta text-bji-slate-400 block font-medium">Clinical Location</span>
                <span className="font-semibold text-bji-slate-900">{selectedEvent.departmentId}</span>
                <span className="text-[10px] text-bji-slate-500 block">Facility: {selectedEvent.facilityId}</span>
              </div>
            </div>

            {selectedEvent.metadata && (
              <div className="space-y-1">
                <span className="text-meta font-semibold text-bji-slate-700 block">Structured Clinical Payload (JSON)</span>
                <pre className="p-2.5 bg-bji-slate-900 text-bji-slate-100 rounded-bji font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
