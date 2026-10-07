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
  HealthcareFacility,
  MedicationAdministration, 
  Patient, 
  PatientAllergy, 
  RadiologyStudy, 
  SimulatedEmergencyEvent, 
  StaffMember, 
  UserRole, 
  VitalSignObservation 
} from "@/types/hospital";
import { tenantRepository } from "../db/tenant-repository";
import { calculateNEWS2 } from "../services/news2";
import { CDSSafetyEngine } from "../services/cds-engine";

interface HospitalContextType {
  // Multi-Tenant Facilities
  facilities: HealthcareFacility[];
  activeFacilityId: string;
  activeFacility: HealthcareFacility;
  switchFacility: (facilityId: string) => void;

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

  // Clinical Actions
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
  }) => void;

  updatePatientAllergy: (allergy: PatientAllergy) => void;

  evaluateCandidateOrder: (order: Partial<CPOEOrder>) => CDSAlert[];
  createCPOEOrder: (order: Omit<CPOEOrder, 'id' | 'orderedAt' | 'orderedBy' | 'status' | 'facilityId'>) => {
    order: CPOEOrder;
    alerts: CDSAlert[];
  };
  verifyOrderPharmacy: (orderId: string) => void;
  dispenseOrderPharmacy: (orderId: string) => void;
  administerMedication: (params: {
    administrationId: string;
    status: 'GIVEN' | 'NOT_GIVEN' | 'REFUSED' | 'HELD';
    heldReason?: string;
    injectionSite?: string;
    cosignedBy?: string;
  }) => void;

  signClinicalNote: (noteId: string) => void;

  // Simulated Emergency Actions
  triggerEmergencyCode: (type: 'CODE_BLUE' | 'RAPID_RESPONSE' | 'CODE_STEMI', location: string) => void;
  acknowledgeEmergencyCode: (id: string) => void;
  resolveEmergencyCode: (id: string) => void;
}

const HospitalContext = createContext<HospitalContextType | null>(null);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Facilities
  const [facilities] = useState<HealthcareFacility[]>(() => tenantRepository.listFacilities());
  const [activeFacilityId, setActiveFacilityId] = useState<string>("fac-st-jude");
  const activeFacility = facilities.find((f) => f.id === activeFacilityId) || facilities[0];

  // 2. Tenant Scoped Entities
  const [departments, setDepartments] = useState<HospitalDepartment[]>(() => tenantRepository.getDepartments(activeFacilityId));
  const [staff, setStaff] = useState<StaffMember[]>(() => tenantRepository.getStaff(activeFacilityId));
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(() => tenantRepository.getStaff(activeFacilityId)[0]);
  const [patients, setPatients] = useState<Patient[]>(() => tenantRepository.getPatients(activeFacilityId));
  const [encounters, setEncounters] = useState<Encounter[]>(() => tenantRepository.getEncounters(activeFacilityId));
  const [beds, setBeds] = useState<HospitalBed[]>(() => tenantRepository.getBeds(activeFacilityId));
  const [observations, setObservations] = useState<VitalSignObservation[]>(() => tenantRepository.getObservations(activeFacilityId));
  const [labs, setLabs] = useState<DiagnosticLabResult[]>(() => tenantRepository.getLabs(activeFacilityId));
  const [orders, setOrders] = useState<CPOEOrder[]>(() => tenantRepository.getOrders(activeFacilityId));
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>(() => tenantRepository.getAdministrations(activeFacilityId));
  const [imaging, setImaging] = useState<RadiologyStudy[]>(() => tenantRepository.getImaging(activeFacilityId));
  const [notes, setNotes] = useState<ClinicalNote[]>(() => tenantRepository.getNotes(activeFacilityId));
  const [events, setEvents] = useState<ClinicalEvent[]>(() => tenantRepository.getEvents(activeFacilityId));
  const [activeEmergency, setActiveEmergency] = useState<SimulatedEmergencyEvent | null>(null);

  // Active selection
  const [activePatientId, setActivePatientId] = useState<string>(() => tenantRepository.getPatients(activeFacilityId)[0]?.id || "");
  const [activeEncounterId, setActiveEncounterId] = useState<string>(() => tenantRepository.getEncounters(activeFacilityId)[0]?.id || "");

  // Switch Facility Tenant
  const switchFacility = (newFacilityId: string) => {
    setActiveFacilityId(newFacilityId);
    const newDepts = tenantRepository.getDepartments(newFacilityId);
    const newStaff = tenantRepository.getStaff(newFacilityId);
    const newPatients = tenantRepository.getPatients(newFacilityId);
    const newEncounters = tenantRepository.getEncounters(newFacilityId);
    const newBeds = tenantRepository.getBeds(newFacilityId);
    const newObs = tenantRepository.getObservations(newFacilityId);
    const newLabs = tenantRepository.getLabs(newFacilityId);
    const newOrders = tenantRepository.getOrders(newFacilityId);
    const newAdms = tenantRepository.getAdministrations(newFacilityId);
    const newImg = tenantRepository.getImaging(newFacilityId);
    const newNotes = tenantRepository.getNotes(newFacilityId);
    const newEvents = tenantRepository.getEvents(newFacilityId);

    setDepartments(newDepts);
    setStaff(newStaff);
    if (newStaff.length > 0) setCurrentStaff(newStaff[0]);
    setPatients(newPatients);
    setEncounters(newEncounters);
    setBeds(newBeds);
    setObservations(newObs);
    setLabs(newLabs);
    setOrders(newOrders);
    setAdministrations(newAdms);
    setImaging(newImg);
    setNotes(newNotes);
    setEvents(newEvents);
    setActiveEmergency(null);

    if (newPatients.length > 0) {
      setActivePatientId(newPatients[0].id);
    } else {
      setActivePatientId("");
    }
    if (newEncounters.length > 0) {
      setActiveEncounterId(newEncounters[0].id);
    } else {
      setActiveEncounterId("");
    }
  };

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
      facilityId: activeFacilityId,
      patientId,
      encounterId,
      type,
      timestamp: new Date().toISOString(),
      authorId: currentStaff?.id || "Practitioner/system",
      authorName: currentStaff?.name || "System",
      authorRole: currentStaff?.role || "PHYSICIAN",
      departmentId: currentStaff?.departmentId || "DEPT-DEFAULT",
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
    if (matched) setCurrentStaff(matched);
  };

  // ADT Operations
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
      facilityId: activeFacilityId,
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

    setBeds(prev => prev.map(b => b.id === bedId ? {
      ...b,
      status: 'OCCUPIED',
      currentEncounterId: newEncounterId,
      currentPatientId: patientId
    } : b));

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

    if (oldBedId) {
      setBeds(prev => prev.map(b => b.id === oldBedId ? {
        ...b,
        status: 'CLEANING',
        currentEncounterId: undefined,
        currentPatientId: undefined,
        cleaningStartedAt: new Date().toISOString()
      } : b));
    }

    setBeds(prev => prev.map(b => b.id === toBedId ? {
      ...b,
      status: 'OCCUPIED',
      currentEncounterId: encounterId,
      currentPatientId: targetEnc.patientId
    } : b));

    setEncounters(prev => prev.map(e => e.id === encounterId ? {
      ...e,
      departmentId: toDepartmentId,
      activeBedId: toBedId
    } : e));

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

    if (oldBedId) {
      setBeds(prev => prev.map(b => b.id === oldBedId ? {
        ...b,
        status: 'CLEANING',
        currentEncounterId: undefined,
        currentPatientId: undefined,
        cleaningStartedAt: new Date().toISOString()
      } : b));
    }

    setEncounters(prev => prev.map(e => e.id === encounterId ? {
      ...e,
      status: 'DISCHARGED',
      dischargedAt: new Date().toISOString(),
      activeBedId: undefined
    } : e));

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

  // Clinical Observations & NEWS2
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
  }) => {
    const { score, riskTier } = calculateNEWS2(vitalsParams);

    const newObservation: VitalSignObservation = {
      id: `Observation/obs-${Date.now()}`,
      facilityId: activeFacilityId,
      timestamp: new Date().toISOString(),
      recordedBy: currentStaff.id,
      ...vitalsParams,
      news2Score: score,
      news2RiskTier: riskTier
    };

    setObservations(prev => [newObservation, ...prev]);

    emitClinicalEvent(
      'VITAL_RECORDED',
      `NEWS2 Vitals Logged: Score ${score} (${riskTier})`,
      `HR: ${vitalsParams.heartRate} bpm, BP: ${vitalsParams.systolicBP}/${vitalsParams.diastolicBP}, RR: ${vitalsParams.respirationRate}, SpO2: ${vitalsParams.spO2}%`,
      vitalsParams.patientId,
      vitalsParams.encounterId
    );

    if (riskTier === 'HIGH') {
      emitClinicalEvent(
        'CDS_ALERT_TRIGGERED',
        '🚨 CRITICAL NEWS2 ALERT: Score >= 7',
        'High physiological deterioration risk. Mandatory urgent medical team escalation required.',
        vitalsParams.patientId,
        vitalsParams.encounterId
      );
    }
  };

  const updatePatientAllergy = (allergy: PatientAllergy) => {
    setPatients(prev => prev.map(p => {
      const existingAllergies = p.allergies || [];
      const updated = existingAllergies.filter(a => a.id !== allergy.id).concat({
        ...allergy,
        version: allergy.version + 1
      });
      return { ...p, allergies: updated };
    }));

    emitClinicalEvent(
      'ALLERGY_RECORDED',
      `Allergy Documented: ${allergy.allergen}`,
      `Severity: ${allergy.severity}. Reaction: ${allergy.reaction}`,
      activePatientId,
      activeEncounterId
    );
  };

  const evaluateCandidateOrder = (order: Partial<CPOEOrder>): CDSAlert[] => {
    return CDSSafetyEngine.evaluateOrder({
      candidateOrder: order,
      patient: activePatient,
      activeOrders: orders.filter(o => o.patientId === activePatientId && o.status === 'ACTIVE'),
      recentLabs: labs.filter(l => l.patientId === activePatientId)
    });
  };

  const createCPOEOrder = (orderData: Omit<CPOEOrder, 'id' | 'orderedAt' | 'orderedBy' | 'status' | 'facilityId'>) => {
    const newOrderId = `Order/ord-${Date.now()}`;
    const newOrder: CPOEOrder = {
      id: newOrderId,
      facilityId: activeFacilityId,
      ...orderData,
      orderedAt: new Date().toISOString(),
      orderedBy: currentStaff.id,
      status: 'ORDERED'
    };

    const alerts = evaluateCandidateOrder(newOrder);

    setOrders(prev => [newOrder, ...prev]);

    if (newOrder.orderType === 'MEDICATION' && newOrder.medicationDetails) {
      const newAdms: MedicationAdministration[] = (newOrder.medicationDetails.scheduleTimes || ['08:00', '20:00']).map((time, idx) => ({
        id: `MedicationAdministration/adm-${Date.now()}-${idx}`,
        facilityId: activeFacilityId,
        orderId: newOrderId,
        encounterId: newOrder.encounterId,
        patientId: newOrder.patientId,
        scheduledTime: `${new Date().toISOString().split('T')[0]}T${time}:00Z`,
        status: 'NOT_GIVEN'
      }));
      setAdministrations(prev => [...prev, ...newAdms]);
    }

    emitClinicalEvent(
      newOrder.orderType === 'MEDICATION' ? 'MEDICATION_ORDERED' : 'LAB_ORDERED',
      `Order Placed: ${newOrder.title}`,
      `Priority: ${newOrder.priority}. Ordered by ${currentStaff.name}`,
      newOrder.patientId,
      newOrder.encounterId
    );

    return { order: newOrder, alerts };
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
        `Verified by ${currentStaff.name}`,
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
    injectionSite,
    cosignedBy
  }: {
    administrationId: string;
    status: 'GIVEN' | 'NOT_GIVEN' | 'REFUSED' | 'HELD';
    heldReason?: string;
    injectionSite?: string;
    cosignedBy?: string;
  }) => {
    setAdministrations(prev => prev.map(adm => adm.id === administrationId ? {
      ...adm,
      status,
      administeredTime: status === 'GIVEN' ? new Date().toISOString() : undefined,
      administeredBy: currentStaff.id,
      heldReason,
      injectionSite,
      cosignedBy
    } : adm));

    const adm = administrations.find(a => a.id === administrationId);
    if (adm) {
      const relatedOrder = orders.find(o => o.id === adm.orderId);
      emitClinicalEvent(
        'MEDICATION_ADMINISTERED',
        `eMAR Administration: ${relatedOrder?.title || 'Medication'} (${status})`,
        `Status: ${status} by ${currentStaff.name}${heldReason ? ` - Reason: ${heldReason}` : ''}`,
        adm.patientId,
        adm.encounterId
      );
    }
  };

  const signClinicalNote = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? {
      ...n,
      status: 'SIGNED',
      signedAt: new Date().toISOString(),
      signedBy: currentStaff.id
    } : n));

    const note = notes.find(n => n.id === noteId);
    if (note) {
      emitClinicalEvent(
        'NOTE_SIGNED',
        `Clinical Note Signed: ${note.noteType}`,
        `Formally signed by ${currentStaff.name}. Locked against future edits.`,
        note.patientId,
        note.encounterId
      );
    }
  };

  // Simulated Emergency Code Execution
  const triggerEmergencyCode = (type: 'CODE_BLUE' | 'RAPID_RESPONSE' | 'CODE_STEMI', location: string) => {
    const newEmergency: SimulatedEmergencyEvent = {
      id: `Emergency/emg-${Date.now()}`,
      facilityId: activeFacilityId,
      codeType: type,
      patientId: activePatientId,
      encounterId: activeEncounterId,
      location,
      state: 'ACTIVE',
      initiatedAt: new Date().toISOString(),
      initiatedBy: currentStaff.id,
      clinicalSummary: `Active medical escalation initiated by ${currentStaff.name} for ${activePatient.lastName}, ${activePatient.firstName}.`
    };

    setActiveEmergency(newEmergency);

    emitClinicalEvent(
      'EMERGENCY_CODE_TRIGGERED',
      `🚨 STAT ${type.replace('_', ' ')} ACTIVATED`,
      `Location: ${location}. Initiated by ${currentStaff.name}`,
      activePatientId,
      activeEncounterId
    );
  };

  const acknowledgeEmergencyCode = (id: string) => {
    if (activeEmergency && activeEmergency.id === id) {
      setActiveEmergency(prev => prev ? {
        ...prev,
        state: 'ACKNOWLEDGED',
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: currentStaff.id
      } : null);

      emitClinicalEvent(
        'EMERGENCY_CODE_ACKNOWLEDGED',
        `Emergency Team Acknowledged On-Scene`,
        `Arrival logged by ${currentStaff.name}`,
        activeEmergency.patientId,
        activeEmergency.encounterId
      );
    }
  };

  const resolveEmergencyCode = (id: string) => {
    if (activeEmergency && activeEmergency.id === id) {
      const resolved = { ...activeEmergency };
      setActiveEmergency(null);

      emitClinicalEvent(
        'EMERGENCY_CODE_RESOLVED',
        `Emergency Code Debrief & Resolution`,
        `Event debriefed and marked resolved by ${currentStaff.name}. Patient stabilized.`,
        resolved.patientId,
        resolved.encounterId
      );
    }
  };

  return (
    <HospitalContext.Provider value={{
      facilities,
      activeFacilityId,
      activeFacility,
      switchFacility,
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
