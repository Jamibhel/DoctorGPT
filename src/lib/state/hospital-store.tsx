"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  CDSAlert, 
  CPOEOrder, 
  ClinicalEvent, 
  ClinicalEventType, 
  ClinicalNote, 
  DiagnosticLabResult, 
  Encounter, 
  HospitalBed, 
  HospitalDepartment, 
  MedicationAdministration, 
  Patient, 
  PatientAllergy, 
  RadiologyStudy, 
  SimulatedEmergencyEvent, 
  StaffMember, 
  UserRole, 
  VitalSignObservation 
} from "@/types/hospital";
import { 
  SEED_ADMINISTRATIONS, 
  SEED_BEDS, 
  SEED_DEPARTMENTS, 
  SEED_ENCOUNTERS, 
  SEED_EVENTS, 
  SEED_IMAGING, 
  SEED_LABS, 
  SEED_NOTES, 
  SEED_ORDERS, 
  SEED_OBSERVATIONS, 
  SEED_PATIENTS, 
  SEED_STAFF 
} from "../data/hospital-seed";
import { calculateNEWS2 } from "../services/news2";
import { CDSSafetyEngine } from "../services/cds-engine";

interface HospitalContextType {
  // State
  departments: HospitalDepartment[];
  staff: StaffMember[];
  currentStaff: StaffMember;
  patients: Patient[];
  encounters: Encounter[];
  beds: HospitalBed[];
  observations: VitalSignObservation[];
  labs: DiagnosticLabResult[];
  orders: CPOEOrder[];
  administrations: MedicationAdministration[];
  imaging: RadiologyStudy[];
  notes: ClinicalNote[];
  events: ClinicalEvent[];
  activeEmergency: SimulatedEmergencyEvent | null;
  activePatientId: string;
  activeEncounterId: string;

  // Selected entities helper
  activePatient: Patient;
  activeEncounter: Encounter;
  activeBed: HospitalBed | undefined;
  activeDepartment: HospitalDepartment | undefined;

  // Selectors & Navigation
  setActivePatientId: (id: string) => void;
  switchUserRole: (role: UserRole) => void;

  // ADT Operations
  admitPatient: (params: {
    patientId: string;
    departmentId: string;
    bedId: string;
    admittingDiagnosis: string;
    chiefComplaint: string;
    triageLevel: 1 | 2 | 3 | 4 | 5;
    codeStatus: 'FULL_CODE' | 'DNR' | 'DNI';
  }) => void;
  transferPatient: (params: {
    encounterId: string;
    toDepartmentId: string;
    toBedId: string;
    reason: string;
  }) => void;
  dischargePatient: (params: {
    encounterId: string;
    dischargeSummaryText?: string;
  }) => void;
  completeBedCleaning: (bedId: string) => void;

  // Clinical Operations
  recordVitals: (params: {
    patientId: string;
    encounterId: string;
    respirationRate: number;
    spO2: number;
    spO2Scale: 1 | 2;
    supplementalOxygen: boolean;
    oxygenFlowLMin?: number;
    temperatureCelsius: number;
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
    consciousness: 'ALERT' | 'CVPU_VOICE' | 'CVPU_PAIN' | 'CVPU_UNRESPONSIVE';
    bloodGlucoseMgDl?: number;
  }) => VitalSignObservation;

  updatePatientAllergy: (patientId: string, allergy: PatientAllergy) => void;

  // CPOE & eMAR
  evaluateCandidateOrder: (title: string, type: string) => CDSAlert[];
  createCPOEOrder: (order: Omit<CPOEOrder, "id" | "orderedAt" | "orderedBy" | "status">) => CPOEOrder;
  verifyOrderPharmacy: (orderId: string) => void;
  dispenseOrderPharmacy: (orderId: string) => void;
  administerMedication: (params: {
    administrationId: string;
    status: 'GIVEN' | 'NOT_GIVEN' | 'HELD';
    heldReason?: string;
    cosignedBy?: string;
  }) => void;

  // Notes & Scribe
  signClinicalNote: (note: Omit<ClinicalNote, "id" | "createdAt" | "version" | "status">) => ClinicalNote;

  // Emergency Code Blue Simulator
  triggerEmergencyCode: (codeType: 'CODE_BLUE' | 'RAPID_RESPONSE' | 'CODE_STEMI', location: string) => void;
  acknowledgeEmergencyCode: (codeId: string) => void;
  resolveEmergencyCode: (codeId: string) => void;
}

const HospitalContext = createContext<HospitalContextType | null>(null);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Master State Tables
  const [departments, setDepartments] = useState<HospitalDepartment[]>(SEED_DEPARTMENTS);
  const [staff] = useState<StaffMember[]>(SEED_STAFF);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(SEED_STAFF[0]); // Default to Dr. Thorne
  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [encounters, setEncounters] = useState<Encounter[]>(SEED_ENCOUNTERS);
  const [beds, setBeds] = useState<HospitalBed[]>(SEED_BEDS);
  const [observations, setObservations] = useState<VitalSignObservation[]>(SEED_OBSERVATIONS);
  const [labs, setLabs] = useState<DiagnosticLabResult[]>(SEED_LABS);
  const [orders, setOrders] = useState<CPOEOrder[]>(SEED_ORDERS);
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>(SEED_ADMINISTRATIONS);
  const [imaging] = useState<RadiologyStudy[]>(SEED_IMAGING);
  const [notes, setNotes] = useState<ClinicalNote[]>(SEED_NOTES);
  const [events, setEvents] = useState<ClinicalEvent[]>(SEED_EVENTS);
  const [activeEmergency, setActiveEmergency] = useState<SimulatedEmergencyEvent | null>(null);

  // Active selection
  const [activePatientId, setActivePatientId] = useState<string>("Patient/pat-1001");
  const [activeEncounterId, setActiveEncounterId] = useState<string>("Encounter/enc-1001");

  // Keep active encounter synced with active patient
  useEffect(() => {
    const enc = encounters.find(e => e.patientId === activePatientId && e.status === 'ACTIVE') || 
                encounters.find(e => e.patientId === activePatientId) || 
                encounters[0];
    if (enc) setActiveEncounterId(enc.id);
  }, [activePatientId, encounters]);

  // Derived active objects
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];
  const activeEncounter = encounters.find(e => e.id === activeEncounterId) || encounters[0];
  const activeBed = beds.find(b => b.id === activeEncounter?.activeBedId);
  const activeDepartment = departments.find(d => d.id === activeEncounter?.departmentId);

  // Helper to log structured clinical events
  const emitClinicalEvent = (
    type: ClinicalEventType,
    title: string,
    description: string,
    patientId: string,
    encounterId: string,
    previousValue?: string,
    newValue?: string
  ) => {
    const newEvent: ClinicalEvent = {
      id: `Event/evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      patientId,
      encounterId,
      type,
      timestamp: new Date().toISOString(),
      authorId: currentStaff.id,
      authorName: currentStaff.name,
      authorRole: currentStaff.role,
      departmentId: currentStaff.departmentId,
      title,
      description,
      previousValue,
      newValue
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  // Switch Role
  const switchUserRole = (role: UserRole) => {
    const matched = staff.find(s => s.role === role) || staff[0];
    setCurrentStaff(matched);
  };

  // ==========================================
  // ADT OPERATIONS
  // ==========================================

  const admitPatient = ({
    patientId,
    departmentId,
    bedId,
    admittingDiagnosis,
    chiefComplaint,
    triageLevel,
    codeStatus
  }: {
    patientId: string;
    departmentId: string;
    bedId: string;
    admittingDiagnosis: string;
    chiefComplaint: string;
    triageLevel: 1 | 2 | 3 | 4 | 5;
    codeStatus: 'FULL_CODE' | 'DNR' | 'DNI';
  }) => {
    const newEncounterId = `Encounter/enc-${Date.now()}`;
    const newEncounter: Encounter = {
      id: newEncounterId,
      patientId,
      encounterClass: 'INPATIENT',
      status: 'ACTIVE',
      departmentId,
      admittedAt: new Date().toISOString(),
      attendingPhysicianId: currentStaff.id,
      admittingDiagnosis,
      chiefComplaint,
      triageLevel,
      codeStatus,
      activeBedId: bedId,
      careTeamIds: [currentStaff.id]
    };

    // Update Bed state machine: AVAILABLE -> OCCUPIED
    setBeds(prev => prev.map(b => b.id === bedId ? {
      ...b,
      status: 'OCCUPIED',
      currentEncounterId: newEncounterId,
      currentPatientId: patientId
    } : b));

    // Update Departments census
    setDepartments(prev => prev.map(d => d.id === departmentId ? {
      ...d,
      occupiedBeds: d.occupiedBeds + 1
    } : d));

    setEncounters(prev => [newEncounter, ...prev]);
    setActivePatientId(patientId);
    setActiveEncounterId(newEncounterId);

    emitClinicalEvent(
      'PATIENT_ADMITTED',
      `Patient Admitted to ${bedId}`,
      `Admitted under ${currentStaff.name} for ${admittingDiagnosis}`,
      patientId,
      newEncounterId,
      undefined,
      bedId
    );
  };

  const transferPatient = ({
    encounterId,
    toDepartmentId,
    toBedId,
    reason
  }: {
    encounterId: string;
    toDepartmentId: string;
    toBedId: string;
    reason: string;
  }) => {
    const targetEnc = encounters.find(e => e.id === encounterId);
    if (!targetEnc) return;

    const oldBedId = targetEnc.activeBedId;
    const oldDeptId = targetEnc.departmentId;

    // Release old bed: OCCUPIED -> CLEANING
    if (oldBedId) {
      setBeds(prev => prev.map(b => b.id === oldBedId ? {
        ...b,
        status: 'CLEANING',
        currentEncounterId: undefined,
        currentPatientId: undefined,
        cleaningStartedAt: new Date().toISOString()
      } : b));
    }

    // Assign new bed: AVAILABLE -> OCCUPIED
    setBeds(prev => prev.map(b => b.id === toBedId ? {
      ...b,
      status: 'OCCUPIED',
      currentEncounterId: encounterId,
      currentPatientId: targetEnc.patientId
    } : b));

    // Update Encounter location
    setEncounters(prev => prev.map(e => e.id === encounterId ? {
      ...e,
      departmentId: toDepartmentId,
      activeBedId: toBedId
    } : e));

    // Update department counts
    setDepartments(prev => prev.map(d => {
      if (d.id === oldDeptId) return { ...d, occupiedBeds: Math.max(0, d.occupiedBeds - 1) };
      if (d.id === toDepartmentId) return { ...d, occupiedBeds: d.occupiedBeds + 1 };
      return d;
    }));

    emitClinicalEvent(
      'PATIENT_TRANSFERRED',
      `Patient Transferred to ${toBedId}`,
      `Transfer Reason: ${reason} (From ${oldBedId || 'Unknown'} to ${toBedId})`,
      targetEnc.patientId,
      encounterId,
      oldBedId,
      toBedId
    );
  };

  const dischargePatient = ({
    encounterId,
    dischargeSummaryText
  }: {
    encounterId: string;
    dischargeSummaryText?: string;
  }) => {
    const targetEnc = encounters.find(e => e.id === encounterId);
    if (!targetEnc) return;

    const oldBedId = targetEnc.activeBedId;

    // Release bed to CLEANING
    if (oldBedId) {
      setBeds(prev => prev.map(b => b.id === oldBedId ? {
        ...b,
        status: 'CLEANING',
        currentEncounterId: undefined,
        currentPatientId: undefined,
        cleaningStartedAt: new Date().toISOString()
      } : b));
    }

    // Close encounter
    setEncounters(prev => prev.map(e => e.id === encounterId ? {
      ...e,
      status: 'DISCHARGED',
      dischargedAt: new Date().toISOString(),
      activeBedId: undefined
    } : e));

    // Update census
    setDepartments(prev => prev.map(d => d.id === targetEnc.departmentId ? {
      ...d,
      occupiedBeds: Math.max(0, d.occupiedBeds - 1)
    } : d));

    emitClinicalEvent(
      'PATIENT_DISCHARGED',
      'Patient Formally Discharged',
      dischargeSummaryText || `Discharged by ${currentStaff.name}. Bed ${oldBedId || ''} queued for environmental sanitation.`,
      targetEnc.patientId,
      encounterId
    );
  };

  const completeBedCleaning = (bedId: string) => {
    setBeds(prev => prev.map(b => b.id === bedId ? {
      ...b,
      status: 'AVAILABLE',
      cleaningStartedAt: undefined
    } : b));
  };

  // ==========================================
  // CLINICAL OBSERVATIONS & NEWS2
  // ==========================================

  const recordVitals = (vitalsParams: {
    patientId: string;
    encounterId: string;
    respirationRate: number;
    spO2: number;
    spO2Scale: 1 | 2;
    supplementalOxygen: boolean;
    oxygenFlowLMin?: number;
    temperatureCelsius: number;
    systolicBP: number;
    diastolicBP: number;
    heartRate: number;
    consciousness: 'ALERT' | 'CVPU_VOICE' | 'CVPU_PAIN' | 'CVPU_UNRESPONSIVE';
    bloodGlucoseMgDl?: number;
  }): VitalSignObservation => {
    const { patientId, encounterId, ...vitalEntry } = vitalsParams;
    const calc = calculateNEWS2(vitalsParams);
    const newObs: VitalSignObservation = {
      id: `Observation/obs-${Date.now()}`,
      patientId,
      encounterId,
      timestamp: new Date().toISOString(),
      recordedBy: currentStaff.id,
      ...vitalEntry,
      news2Score: calc.totalScore,
      news2RiskTier: calc.riskTier
    };

    setObservations(prev => [newObs, ...prev]);

    emitClinicalEvent(
      'VITAL_RECORDED',
      `Vitals Recorded (NEWS2: ${calc.totalScore} - ${calc.riskTier})`,
      `BP ${vitalsParams.systolicBP}/${vitalsParams.diastolicBP} mmHg, HR ${vitalsParams.heartRate} bpm, SpO2 ${vitalsParams.spO2}%, RR ${vitalsParams.respirationRate} bpm, Temp ${vitalsParams.temperatureCelsius.toFixed(1)}°C. Response: ${calc.clinicalResponse}`,
      vitalsParams.patientId,
      vitalsParams.encounterId
    );

    return newObs;
  };

  const updatePatientAllergy = (patientId: string, allergy: PatientAllergy) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const existingIdx = p.allergies.findIndex(a => a.id === allergy.id);
      const updatedAllergies = [...p.allergies];
      if (existingIdx >= 0) {
        updatedAllergies[existingIdx] = { ...allergy, version: allergy.version + 1 };
      } else {
        updatedAllergies.push({ ...allergy, version: 1 });
      }
      return { ...p, allergies: updatedAllergies, updatedAt: new Date().toISOString() };
    }));

    emitClinicalEvent(
      'ALLERGY_RECORDED',
      `Allergy Documented: ${allergy.allergen}`,
      `Category: ${allergy.category}, Severity: ${allergy.severity}, Reaction: ${allergy.reaction}`,
      patientId,
      activeEncounterId
    );
  };

  // ==========================================
  // CPOE & eMAR
  // ==========================================

  const evaluateCandidateOrder = (title: string, type: string): CDSAlert[] => {
    const patientLabs = labs.filter(l => l.patientId === activePatientId);
    const patientOrders = orders.filter(o => o.patientId === activePatientId);
    return CDSSafetyEngine.evaluateOrder(title, type, activePatient, patientOrders, patientLabs);
  };

  const createCPOEOrder = (orderData: Omit<CPOEOrder, "id" | "orderedAt" | "orderedBy" | "status">): CPOEOrder => {
    const newOrder: CPOEOrder = {
      ...orderData,
      id: `${orderData.orderType === 'MEDICATION' ? 'MedicationRequest' : 'ServiceRequest'}/ord-${Date.now()}`,
      orderedAt: new Date().toISOString(),
      orderedBy: currentStaff.id,
      status: 'ORDERED'
    };

    setOrders(prev => [newOrder, ...prev]);

    // If medication order, automatically create eMAR scheduled administration slots
    if (orderData.orderType === 'MEDICATION' && orderData.medicationDetails) {
      const scheduleTimes = orderData.medicationDetails.scheduleTimes || ["08:00", "20:00"];
      const newAdms: MedicationAdministration[] = scheduleTimes.map((time, idx) => ({
        id: `MedicationAdministration/adm-${Date.now()}-${idx}`,
        orderId: newOrder.id,
        encounterId: newOrder.encounterId,
        patientId: newOrder.patientId,
        scheduledTime: `${new Date().toISOString().split('T')[0]}T${time}:00Z`,
        status: 'GIVEN' // will be marked GIVEN when nurse acts
      }));
      setAdministrations(prev => [...newAdms, ...prev]);
    }

    emitClinicalEvent(
      'MEDICATION_ORDERED',
      `CPOE Order: ${newOrder.title}`,
      `Type: ${newOrder.orderType}, Priority: ${newOrder.priority}. Description: ${newOrder.description}`,
      newOrder.patientId,
      newOrder.encounterId
    );

    return newOrder;
  };

  const verifyOrderPharmacy = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'PHARMACY_VERIFIED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: currentStaff.id
    } : o));

    const order = orders.find(o => o.id === orderId);
    if (order) {
      emitClinicalEvent(
        'PHARMACY_VERIFIED',
        `Pharmacy Verified: ${order.title}`,
        `Pharmacist ${currentStaff.name} verified order safety. Ready for Pyxis dispensing.`,
        order.patientId,
        order.encounterId
      );
    }
  };

  const dispenseOrderPharmacy = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o,
      status: 'DISPENSED'
    } : o));
  };

  const administerMedication = ({
    administrationId,
    status,
    heldReason,
    cosignedBy
  }: {
    administrationId: string;
    status: 'GIVEN' | 'NOT_GIVEN' | 'HELD';
    heldReason?: string;
    cosignedBy?: string;
  }) => {
    setAdministrations(prev => prev.map(a => a.id === administrationId ? {
      ...a,
      status,
      administeredTime: new Date().toISOString(),
      administeredBy: currentStaff.id,
      heldReason,
      cosignedBy
    } : a));

    const targetAdm = administrations.find(a => a.id === administrationId);
    const targetOrder = orders.find(o => o.id === targetAdm?.orderId);

    if (targetAdm && targetOrder) {
      emitClinicalEvent(
        'MEDICATION_ADMINISTERED',
        `eMAR: ${targetOrder.title} ${status}`,
        `Administered by ${currentStaff.name}. Status: ${status} ${heldReason ? `(Reason: ${heldReason})` : ''}`,
        targetAdm.patientId,
        targetAdm.encounterId
      );
    }
  };

  // ==========================================
  // CLINICAL NOTES
  // ==========================================

  const signClinicalNote = (noteData: Omit<ClinicalNote, "id" | "createdAt" | "version" | "status">): ClinicalNote => {
    const newNote: ClinicalNote = {
      ...noteData,
      id: `DocumentReference/note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      signedAt: new Date().toISOString(),
      signedBy: currentStaff.id,
      status: 'SIGNED',
      version: 1
    };

    setNotes(prev => [newNote, ...prev]);

    emitClinicalEvent(
      'NOTE_SIGNED',
      `Clinical Note Signed (${newNote.noteType})`,
      `Document formally signed and locked by ${currentStaff.name}. Attached ${newNote.subjective.evidences?.length || 0} citation evidence anchors.`,
      newNote.patientId,
      newNote.encounterId
    );

    return newNote;
  };

  // ==========================================
  // SIMULATED EMERGENCY CODES
  // ==========================================

  const triggerEmergencyCode = (codeType: 'CODE_BLUE' | 'RAPID_RESPONSE' | 'CODE_STEMI', location: string) => {
    const newCode: SimulatedEmergencyEvent = {
      id: `EMERGENCY-${Date.now()}`,
      codeType,
      patientId: activePatientId,
      encounterId: activeEncounterId,
      location,
      state: 'ACTIVE',
      initiatedAt: new Date().toISOString(),
      initiatedBy: currentStaff.name,
      clinicalSummary: `Emergency ${codeType.replace('_', ' ')} activated at ${location} for patient ${activePatient.firstName} ${activePatient.lastName}.`
    };

    setActiveEmergency(newCode);

    emitClinicalEvent(
      'EMERGENCY_CODE_TRIGGERED',
      `🚨 SIMULATED EMERGENCY: ${codeType.replace('_', ' ')} ACTIVATED`,
      `Location: ${location}. Initiated by ${currentStaff.name}. Rapid response team alerted.`,
      activePatientId,
      activeEncounterId
    );
  };

  const acknowledgeEmergencyCode = (codeId: string) => {
    if (activeEmergency && activeEmergency.id === codeId) {
      setActiveEmergency({
        ...activeEmergency,
        state: 'ACKNOWLEDGED',
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: currentStaff.name
      });
      emitClinicalEvent(
        'EMERGENCY_CODE_ACKNOWLEDGED',
        `Emergency Code Acknowledged`,
        `Response team acknowledged on-scene at ${activeEmergency.location}.`,
        activeEmergency.patientId,
        activeEmergency.encounterId
      );
    }
  };

  const resolveEmergencyCode = (codeId: string) => {
    if (activeEmergency && activeEmergency.id === codeId) {
      const resolved = {
        ...activeEmergency,
        state: 'RESOLVED' as const,
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentStaff.name
      };
      setActiveEmergency(null);
      emitClinicalEvent(
        'EMERGENCY_CODE_RESOLVED',
        `Emergency Code Resolved & Debriefed`,
        `Patient stabilized at ${resolved.location}. Code event closed by ${currentStaff.name}.`,
        resolved.patientId,
        resolved.encounterId
      );
    }
  };

  return (
    <HospitalContext.Provider value={{
      departments,
      staff,
      currentStaff,
      patients,
      encounters,
      beds,
      observations,
      labs,
      orders,
      administrations,
      imaging,
      notes,
      events,
      activeEmergency,
      activePatientId,
      activeEncounterId,
      activePatient,
      activeEncounter,
      activeBed,
      activeDepartment,
      setActivePatientId,
      switchUserRole,
      admitPatient,
      transferPatient,
      dischargePatient,
      completeBedCleaning,
      recordVitals,
      updatePatientAllergy,
      evaluateCandidateOrder,
      createCPOEOrder,
      verifyOrderPharmacy,
      dispenseOrderPharmacy,
      administerMedication,
      signClinicalNote,
      triggerEmergencyCode,
      acknowledgeEmergencyCode,
      resolveEmergencyCode
    }}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error("useHospital must be used within a HospitalProvider");
  }
  return context;
};
