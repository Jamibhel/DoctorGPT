"use client";

import React, { useState } from "react";
import { 
  Pill, 
  TestTube2, 
  RotateCw, 
  Users, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Activity,
  FileText,
  Utensils,
  Stethoscope,
  Info,
  Clock,
  UserCheck
} from "lucide-react";
import { CDSAlert, CPOEOrder, OrderPriority, OrderType } from "@/types/hospital";
import { useHospital } from "@/lib/state/hospital-store";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";

interface CpoeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CpoeOrderModal: React.FC<CpoeOrderModalProps> = ({ isOpen, onClose }) => {
  const { 
    activePatient, 
    activeEncounter, 
    evaluateCandidateOrder, 
    createCPOEOrder,
    currentStaff
  } = useHospital();

  const [orderType, setOrderType] = useState<OrderType>('MEDICATION');
  const [priority, setPriority] = useState<OrderPriority>('ROUTINE');
  const [orderTitle, setOrderTitle] = useState("");
  
  // Medication Specific
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState<'ORAL' | 'IV' | 'SUBCUTANEOUS' | 'TOPICAL' | 'INHALATION'>('ORAL');
  const [frequency, setFrequency] = useState("Twice daily with meals");
  const [indication, setIndication] = useState("");
  
  // Lab Specific
  const [specimen, setSpecimen] = useState<'BLOOD' | 'URINE' | 'CSF' | 'SWAB'>('BLOOD');
  const [fasting, setFasting] = useState(false);
  
  // Radiology Specific
  const [modality, setModality] = useState<'X_RAY' | 'CT' | 'MRI' | 'ULTRASOUND'>('CT');
  const [bodySite, setBodySite] = useState("Chest");
  const [contrast, setContrast] = useState<'NONE' | 'IV' | 'ORAL'>('NONE');
  
  // Consult Specific
  const [consultSpecialty, setConsultSpecialty] = useState("Cardiology");
  const [clinicalQuestion, setClinicalQuestion] = useState("");

  // Nursing Specific
  const [nursingFrequency, setNursingFrequency] = useState("q4h");

  // Diet Specific
  const [dietType, setDietType] = useState("Diabetic (ADA 1800 kcal)");

  const [orderDescription, setOrderDescription] = useState("");
  const [overrideRationale, setOverrideRationale] = useState("");
  const [activeCdsAlerts, setActiveCdsAlerts] = useState<CDSAlert[]>([]);

  if (!isOpen || !activePatient || !activeEncounter) return null;

  // Real-time CDS checking as doctor types medication/order
  const handleTitleChange = (val: string, type: OrderType = orderType) => {
    setOrderTitle(val);
    if (val.trim().length >= 3) {
      const alerts = evaluateCandidateOrder(val, type);
      setActiveCdsAlerts(alerts);
    } else {
      setActiveCdsAlerts([]);
    }
  };

  const handleTypeChange = (newType: OrderType) => {
    setOrderType(newType);
    setActiveCdsAlerts([]);
    if (orderTitle.trim().length >= 3) {
      const alerts = evaluateCandidateOrder(orderTitle, newType);
      setActiveCdsAlerts(alerts);
    }
  };

  const handleQuickMedSelect = (
    name: string, 
    dose: string, 
    r: 'ORAL' | 'IV' | 'SUBCUTANEOUS', 
    freq: string, 
    ind: string
  ) => {
    setOrderType('MEDICATION');
    setOrderTitle(name);
    setDosage(dose);
    setRoute(r);
    setFrequency(freq);
    setIndication(ind);
    const alerts = evaluateCandidateOrder(name, 'MEDICATION');
    setActiveCdsAlerts(alerts);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    const hasHardContraindication = activeCdsAlerts.some(
      a => a.severity === 'CRITICAL_CONTRAINDICATION' && !a.canOverrideWithRationale
    );
    if (hasHardContraindication) {
      alert("Cannot place order: Critical contraindication detected (e.g., severe anaphylactic allergy or boxed warning). Please select an alternative therapy.");
      return;
    }

    if (activeCdsAlerts.length > 0 && !overrideRationale.trim()) {
      alert("Clinical Decision Support Safety Intercept: Please provide a clinical override rationale to sign this order with active alerts.");
      return;
    }

    // Build specialized title and description per domain
    let finalTitle = orderTitle;
    let finalDescription = orderDescription;

    if (orderType === 'MEDICATION') {
      finalTitle = `${orderTitle} ${dosage}`.trim();
      if (!finalDescription) {
        finalDescription = `${dosage} ${route} ${frequency}${indication ? ` for ${indication}` : ''}`;
      }
    } else if (orderType === 'LAB') {
      finalTitle = `${orderTitle} [${specimen}]${fasting ? ' (Fasting)' : ''}`;
      if (!finalDescription) {
        finalDescription = `Specimen: ${specimen}. Priority: ${priority}. Fasting: ${fasting ? 'Yes' : 'No'}.`;
      }
    } else if (orderType === 'RADIOLOGY') {
      finalTitle = `${modality} ${bodySite}${contrast !== 'NONE' ? ` with ${contrast} contrast` : ' without contrast'}`;
      if (!finalDescription) {
        finalDescription = `${modality} study of ${bodySite}. Contrast: ${contrast}. Clinical indication: ${orderTitle}`;
      }
    } else if (orderType === 'CONSULT') {
      finalTitle = `${consultSpecialty} Inpatient Consultation`;
      if (!finalDescription) {
        finalDescription = `Clinical reason: ${orderTitle}. Clinical question: ${clinicalQuestion || 'Evaluate and recommend management plan.'}`;
      }
    } else if (orderType === 'NURSING') {
      finalTitle = `Nursing: ${orderTitle} (${nursingFrequency})`;
      if (!finalDescription) {
        finalDescription = `Nursing intervention: ${orderTitle}. Frequency: ${nursingFrequency}.`;
      }
    } else if (orderType === 'DIET') {
      finalTitle = `Dietary: ${dietType}`;
      if (!finalDescription) {
        finalDescription = `Nutritional diet order: ${dietType}. Specific instructions: ${orderTitle || 'Standard inpatient diet guidelines'}`;
      }
    }

    createCPOEOrder({
      encounterId: activeEncounter.id,
      patientId: activePatient.id,
      orderType,
      priority,
      title: finalTitle,
      description: finalDescription,
      medicationDetails: orderType === 'MEDICATION' ? {
        drugName: orderTitle,
        genericName: orderTitle,
        dosage,
        route,
        frequency,
        indication,
        scheduleTimes: route === 'IV' ? ["06:00", "12:00", "18:00", "00:00"] : ["08:00", "20:00"]
      } : undefined,
      labDetails: orderType === 'LAB' ? {
        testCode: `LAB-${orderTitle.slice(0, 4).toUpperCase()}`,
        specimen
      } : undefined,
      radiologyDetails: orderType === 'RADIOLOGY' ? {
        modality,
        bodySite,
        reasonForExam: orderTitle
      } : undefined,
      cdsAlertsDismissed: activeCdsAlerts.map(a => ({
        alertId: a.id,
        clinicianRationale: overrideRationale,
        dismissedAt: new Date().toISOString(),
        dismissedBy: currentStaff.name
      }))
    });

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Computerized Physician Order Entry (CPOE)"
      subtitle={
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
          <span>Patient: <strong className="text-slate-800">{activePatient.lastName}, {activePatient.firstName}</strong></span>
          <span>•</span>
          <span className="font-mono">MRN: {activePatient.mrn}</span>
          <span>•</span>
          <Badge variant="blue" size="sm">CDS Protected</Badge>
        </div>
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* Domain Switcher */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Order Domain / Catalog Category
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { type: 'MEDICATION' as OrderType, label: 'Medication', icon: Pill },
              { type: 'LAB' as OrderType, label: 'Lab Test', icon: TestTube2 },
              { type: 'RADIOLOGY' as OrderType, label: 'Radiology', icon: Activity },
              { type: 'CONSULT' as OrderType, label: 'Consult', icon: Stethoscope },
              { type: 'NURSING' as OrderType, label: 'Nursing', icon: FileText },
              { type: 'DIET' as OrderType, label: 'Dietary', icon: Utensils },
            ].map(cat => {
              const Icon = cat.icon;
              const isSelected = orderType === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => handleTypeChange(cat.type)}
                  className={`p-2 rounded-bji border flex flex-col items-center gap-1 transition text-center text-xs font-semibold ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-[#D7DEE7] hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="text-[10px] leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as OrderPriority)}
              className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 font-mono outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="ROUTINE">ROUTINE (Standard Hospital Schedule)</option>
              <option value="URGENT">URGENT (Administer/Process within 2 Hours)</option>
              <option value="STAT">STAT (Immediate Emergency Intercept)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ordering Clinician Authorization
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-[#D7DEE7] rounded-bji text-xs text-slate-700">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{currentStaff.name}</span>
              <Badge variant="neutral" size="sm">{currentStaff.role}</Badge>
            </div>
          </div>
        </div>

        {/* Quick Presets for MEDICATION to test CDS safety */}
        {orderType === 'MEDICATION' && (
          <div className="p-2.5 bg-slate-50 rounded-bji border border-[#D7DEE7] space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              CDS Test Intercept Presets (Click to Validate Safety Engine):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickMedSelect("Amoxicillin-Clavulanate", "875 mg", "ORAL", "BID", "Acute Sinusitis")}
                className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium hover:bg-red-100 flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Amoxicillin (Penicillin Anaphylaxis)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickMedSelect("Ibuprofen", "600 mg", "ORAL", "TID PRN", "Joint Pain")}
                className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium hover:bg-amber-100 flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Ibuprofen (Warfarin Bleed DDI)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickMedSelect("Metformin", "1000 mg", "ORAL", "BID", "Type 2 Diabetes")}
                className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium hover:bg-red-100 flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                <span>Metformin (eGFR &lt; 30 Check)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickMedSelect("Insulin Lispro", "4 Units", "SUBCUTANEOUS", "TID AC", "Prandial Glucose")}
                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-100"
              >
                <span>Insulin Lispro (Prandial)</span>
              </button>
            </div>
          </div>
        )}

        {/* DOMAIN SPECIFIC FORM FIELDS */}
        {orderType === 'MEDICATION' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Medication / Drug Name
              </label>
              <input
                type="text"
                value={orderTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Amoxicillin, Lisinopril, Heparin, Cefepime"
                className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dosage &amp; Strength
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500 mg, 10 mg, 4 Units"
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Route
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value as any)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-mono"
                >
                  <option value="ORAL">Oral (PO)</option>
                  <option value="IV">Intravenous (IV)</option>
                  <option value="SUBCUTANEOUS">Subcutaneous (SubQ)</option>
                  <option value="INHALATION">Inhalation</option>
                  <option value="TOPICAL">Topical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once daily, BID, Q4H, PRN"
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Indication
              </label>
              <input
                type="text"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                placeholder="e.g. Acute bacterial pneumonia, hypertension control, post-op pain"
                className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>
        )}

        {orderType === 'LAB' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Laboratory Assay / Panel Name
              </label>
              <input
                type="text"
                value={orderTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Comprehensive Metabolic Panel (CMP), Troponin I, Blood Cultures x 2"
                className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specimen Type
                </label>
                <select
                  value={specimen}
                  onChange={(e) => setSpecimen(e.target.value as any)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="BLOOD">Whole Blood / Serum</option>
                  <option value="URINE">Clean Catch Urine</option>
                  <option value="CSF">Cerebrospinal Fluid (CSF)</option>
                  <option value="SWAB">Nasopharyngeal / Wound Swab</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fasting Requirement
                </label>
                <div className="flex items-center h-[38px] px-3 bg-white border border-[#D7DEE7] rounded-bji gap-2">
                  <input
                    type="checkbox"
                    id="fastingCheck"
                    checked={fasting}
                    onChange={(e) => setFasting(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="fastingCheck" className="text-xs text-slate-700 cursor-pointer">
                    Strict Inpatient Fasting (8-12 hours)
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {orderType === 'RADIOLOGY' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Modality
                </label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value as any)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="X_RAY">Diagnostic X-Ray</option>
                  <option value="CT">Computed Tomography (CT)</option>
                  <option value="MRI">Magnetic Resonance Imaging (MRI)</option>
                  <option value="ULTRASOUND">Ultrasound / Doppler</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Anatomical Body Site
                </label>
                <input
                  type="text"
                  value={bodySite}
                  onChange={(e) => setBodySite(e.target.value)}
                  placeholder="e.g. Chest, Abdomen/Pelvis, Head, Right Knee"
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Radiocontrast
                </label>
                <select
                  value={contrast}
                  onChange={(e) => setContrast(e.target.value as any)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="NONE">None (Without Contrast)</option>
                  <option value="IV">Intravenous (IV) Contrast</option>
                  <option value="ORAL">Oral Gastrografin / Barium</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Reason &amp; Exam Indication
              </label>
              <input
                type="text"
                value={orderTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Rule out pulmonary embolism, evaluate persistent cough, suspected acute appendicitis"
                className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
          </div>
        )}

        {orderType === 'CONSULT' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Consulting Specialty
                </label>
                <select
                  value={consultSpecialty}
                  onChange={(e) => setConsultSpecialty(e.target.value)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Infectious Disease">Infectious Disease</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Podiatry & Wound Care">Podiatry &amp; Wound Care</option>
                  <option value="Clinical Pharmacy">Clinical Pharmacy Specialist</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Concern / Primary Reason
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Refractory atrial fibrillation with RVR, acute limb ischemia"
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Specific Question for Consultant
              </label>
              <textarea
                value={clinicalQuestion}
                onChange={(e) => setClinicalQuestion(e.target.value)}
                rows={2}
                placeholder="State specific clinical question (e.g., Recommend antiarrhythmic regimen given patient's chronic kidney disease)."
                className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji p-2.5 outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        )}

        {orderType === 'NURSING' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nursing Protocol / Intervention
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Strict Intake & Output, Neurological Checks, Fall Precautions, Foley Care"
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Frequency / Recurrence
                </label>
                <select
                  value={nursingFrequency}
                  onChange={(e) => setNursingFrequency(e.target.value)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="q1h">Every 1 Hour (q1h - Critical)</option>
                  <option value="q2h">Every 2 Hours (q2h)</option>
                  <option value="q4h">Every 4 Hours (q4h)</option>
                  <option value="q8h">Every 8 Hours (Once per shift)</option>
                  <option value="Daily">Daily</option>
                  <option value="Continuous">Continuous Monitoring</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {orderType === 'DIET' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Diet Type
                </label>
                <select
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                >
                  <option value="Diabetic (ADA 1800 kcal)">Diabetic (ADA 1800 kcal)</option>
                  <option value="Cardiac Low-Sodium (2g Na)">Cardiac Low-Sodium (2g Na)</option>
                  <option value="Renal Diet (Low K/Phos/Protein)">Renal Diet (Low K/Phos/Protein)</option>
                  <option value="NPO (Nothing by Mouth)">NPO (Nothing by Mouth)</option>
                  <option value="Clear Liquids">Clear Liquids</option>
                  <option value="Full Liquids">Full Liquids</option>
                  <option value="Dysphagia Pureed (Level 1)">Dysphagia Pureed (Level 1)</option>
                  <option value="Regular Hospital Diet">Regular Hospital Diet</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Gluten-free, no pork, thickened liquids honey consistency"
                  className="w-full bg-white border border-[#D7DEE7] text-xs rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* REAL-TIME DETERMINISTIC CDS SAFETY ALERTS */}
        {activeCdsAlerts.length > 0 && (
          <div className="p-3.5 rounded-bji bg-red-50 border border-red-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Deterministic Clinical Decision Support Intercept ({activeCdsAlerts.length} Alert{activeCdsAlerts.length > 1 ? 's' : ''})</span>
              </div>
              <Badge variant="red" size="sm">Hard Safety Check</Badge>
            </div>

            {activeCdsAlerts.map(alert => (
              <div key={alert.id} className="p-2.5 rounded-bji bg-white border border-red-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-700">{alert.type.replace('_', ' ')} INTERCEPT</span>
                  <Badge 
                    variant={alert.severity === 'CRITICAL_CONTRAINDICATION' ? 'red' : 'amber'} 
                    size="sm"
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-slate-800 font-semibold">{alert.conflictingItem}</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">{alert.mechanism}</p>
                <p className="text-emerald-800 font-medium text-[11px] pt-0.5">
                  Recommendation: {alert.clinicalRecommendation}
                </p>
              </div>
            ))}

            {/* Clinician Override Rationale */}
            <div className="pt-1.5">
              <label className="block text-[11px] font-bold text-red-800 uppercase tracking-wider mb-1">
                Mandatory Clinician Override Justification &amp; Rationale:
              </label>
              <input
                type="text"
                value={overrideRationale}
                onChange={(e) => setOverrideRationale(e.target.value)}
                placeholder="State clinical justification, specialist approval, or desensitization protocol..."
                className="w-full bg-white border border-red-300 text-xs text-slate-800 rounded-bji px-3 py-2 outline-none focus:ring-1 focus:ring-red-600"
                required
              />
            </div>
          </div>
        )}

        {/* Form Submission Actions */}
        <div className="pt-3 border-t border-[#D7DEE7] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Attending: {currentStaff.name} ({currentStaff.role})
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="gap-1.5"
            >
              <span>Sign &amp; Transmit Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
