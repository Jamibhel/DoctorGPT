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
  VitalSignObservation,
  AuditLogEntry,
  TraumaBay,
  DoorToMetric,
  ResuscitationRecord,
  MciPatientTag,
  EmergencyCodeType,
  SurgicalCase,
  WhoChecklist,
  IntraoperativeRecord
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

  // Patient Registry & EMPI
  registerPatient: (data: Omit<Patient, 'id' | 'facilityId' | 'mrn' | 'createdAt' | 'updatedAt'>) => Patient;
  updatePatientDemographics: (patientId: string, updates: Partial<Patient>) => void;
  updatePatientAllergy: (allergy: PatientAllergy) => void;
  searchPatientsGlobal: (query: string) => { patient: Patient; facility: HealthcareFacility }[];

  evaluateCandidateOrder: (orderOrTitle: Partial<CPOEOrder> | string, optionalType?: OrderType) => CDSAlert[];
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

  saveClinicalNote: (noteData: Omit<ClinicalNote, 'id' | 'facilityId' | 'createdAt' | 'version'> & { id?: string }) => ClinicalNote;
  signClinicalNote: (noteId: string) => ClinicalNote;

  // Facility Operations & Admin
  auditLogs: AuditLogEntry[];
  updateFacilityConfig: (updates: Partial<HealthcareFacility>) => void;
  createDepartment: (dept: Omit<HospitalDepartment, 'facilityId'>) => void;
  createBed: (bed: Omit<HospitalBed, 'facilityId'>) => void;

  // Emergency Management & Resuscitation
  traumaBays: TraumaBay[];
  doorToMetrics: DoorToMetric[];
  resuscitations: ResuscitationRecord[];
  mciTags: MciPatientTag[];
  updateTraumaBay: (bayId: string, updates: Partial<TraumaBay>) => void;
  updateDoorToMetric: (metricId: string, updates: Partial<DoorToMetric>) => void;
  recordResuscitationEvent: (record: ResuscitationRecord) => ResuscitationRecord;
  recordMciTag: (tagData: Omit<MciPatientTag, 'id' | 'facilityId' | 'taggedAt'>) => MciPatientTag;

  // Operating Theatre & Perioperative Safety
  surgicalCases: SurgicalCase[];
  scheduleSurgicalCase: (caseData: Omit<SurgicalCase, 'id' | 'facilityId'>) => SurgicalCase;
  updateSurgicalCase: (caseId: string, updates: Partial<SurgicalCase>) => SurgicalCase;
  updateWhoChecklist: (caseId: string, phase: 'signIn' | 'timeOut' | 'signOut', checks: any) => SurgicalCase;

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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => tenantRepository.getAuditLogs(activeFacilityId));
  const [activeEmergency, setActiveEmergency] = useState<SimulatedEmergencyEvent | null>(null);
  const [traumaBays, setTraumaBays] = useState<TraumaBay[]>(() => tenantRepository.getTraumaBays(activeFacilityId));
  const [doorToMetrics, setDoorToMetrics] = useState<DoorToMetric[]>(() => tenantRepository.getDoorToMetrics(activeFacilityId));
  const [resuscitations, setResuscitations] = useState<ResuscitationRecord[]>(() => tenantRepository.getResuscitations(activeFacilityId));
  const [mciTags, setMciTags] = useState<MciPatientTag[]>(() => tenantRepository.getMciTags(activeFacilityId));
  const [surgicalCases, setSurgicalCases] = useState<SurgicalCase[]>(() => tenantRepository.getSurgicalCases(activeFacilityId));

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
    const newAudits = tenantRepository.getAuditLogs(newFacilityId);
    const newBays = tenantRepository.getTraumaBays(newFacilityId);
    const newMetrics = tenantRepository.getDoorToMetrics(newFacilityId);
    const newResus = tenantRepository.getResuscitations(newFacilityId);
    const newMci = tenantRepository.getMciTags(newFacilityId);
    const newSurg = tenantRepository.getSurgicalCases(newFacilityId);

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
    setAuditLogs(newAudits);
    setTraumaBays(newBays);
    setDoorToMetrics(newMetrics);
    setResuscitations(newResus);
    setMciTags(newMci);
    setSurgicalCases(newSurg);
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
    const { totalScore, riskTier, hasSingleParameterRedAlert, clinicalResponse } = calculateNEWS2(vitalsParams);

    const newObservation: VitalSignObservation = {
      id: `Observation/obs-${Date.now()}`,
      facilityId: activeFacilityId,
      timestamp: new Date().toISOString(),
      recordedBy: currentStaff.name || currentStaff.id,
      ...vitalsParams,
      news2Score: totalScore,
      news2RiskTier: riskTier
    };

    // Persist to tenant repository with index update and audit trail
    tenantRepository.recordObservation(
      activeFacilityId,
      newObservation,
      currentStaff.name,
      currentStaff.role
    );

    // Refresh state
    setObservations(tenantRepository.getObservations(activeFacilityId));

    emitClinicalEvent(
      'VITAL_RECORDED',
      `NEWS2 Vitals Logged: Score ${totalScore} (${riskTier})`,
      `HR: ${vitalsParams.heartRate} bpm, BP: ${vitalsParams.systolicBP}/${vitalsParams.diastolicBP}, RR: ${vitalsParams.respirationRate}, SpO2: ${vitalsParams.spO2}% (${vitalsParams.spO2Scale === 2 ? 'Scale 2 Hypercapnic' : 'Scale 1'})`,
      vitalsParams.patientId,
      vitalsParams.encounterId
    );

    if (riskTier === 'HIGH' || hasSingleParameterRedAlert) {
      emitClinicalEvent(
        'CDS_ALERT_TRIGGERED',
        `🚨 CRITICAL NEWS2 ALERT: Score ${totalScore} (${riskTier})`,
        clinicalResponse || 'High physiological deterioration risk. Mandatory urgent medical team escalation required.',
        vitalsParams.patientId,
        vitalsParams.encounterId
      );
    }
  };

  const registerPatient = (data: Omit<Patient, 'id' | 'facilityId' | 'mrn' | 'createdAt' | 'updatedAt'>): Patient => {
    const created = tenantRepository.registerPatient(
      activeFacilityId,
      data,
      currentStaff.name,
      currentStaff.role
    );
    const updatedPatients = tenantRepository.getPatients(activeFacilityId);
    setPatients(updatedPatients);
    setActivePatientId(created.id);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    return created;
  };

  const updatePatientDemographics = (patientId: string, updates: Partial<Patient>) => {
    const updated = tenantRepository.updatePatient(
      activeFacilityId,
      patientId,
      updates,
      currentStaff.name,
      currentStaff.role
    );
    const updatedPatients = tenantRepository.getPatients(activeFacilityId);
    setPatients(updatedPatients);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);
  };

  const updatePatientAllergy = (allergy: PatientAllergy) => {
    const updated = tenantRepository.updatePatientAllergy(
      activeFacilityId,
      activePatientId,
      allergy,
      currentStaff.name,
      currentStaff.role
    );
    const updatedPatients = tenantRepository.getPatients(activeFacilityId);
    setPatients(updatedPatients);

    emitClinicalEvent(
      'ALLERGY_RECORDED',
      `Allergy Documented (v${allergy.version || 1}): ${allergy.allergen}`,
      `Severity: ${allergy.severity}. Reaction: ${allergy.reaction}`,
      activePatientId,
      activeEncounterId
    );

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);
  };

  const searchPatientsGlobal = (query: string) => {
    return tenantRepository.searchPatientsGlobal(query);
  };

  const evaluateCandidateOrder = (orderOrTitle: Partial<CPOEOrder> | string, optionalType?: OrderType): CDSAlert[] => {
    const title = typeof orderOrTitle === 'string' ? orderOrTitle : (orderOrTitle.title || "");
    const type = typeof orderOrTitle === 'string' ? (optionalType || "MEDICATION") : (orderOrTitle.orderType || "MEDICATION");

    return CDSSafetyEngine.evaluateOrder(
      title,
      type,
      activePatient,
      orders.filter(o => o.patientId === activePatientId && o.status === 'ACTIVE'),
      labs.filter(l => l.patientId === activePatientId)
    );
  };

  const createCPOEOrder = (orderData: Omit<CPOEOrder, 'id' | 'orderedAt' | 'orderedBy' | 'status' | 'facilityId'>) => {
    const alerts = evaluateCandidateOrder(orderData.title, orderData.orderType);

    const { order: newOrder, createdAdministrations } = tenantRepository.atomicCreateOrder(
      activeFacilityId,
      {
        ...orderData,
        orderedBy: currentStaff.id,
        status: 'ORDERED'
      },
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );

    // Refresh tenant-scoped orders & administrations & audits
    const updatedOrders = tenantRepository.getOrders(activeFacilityId);
    const updatedAdms = tenantRepository.getAdministrations(activeFacilityId);
    setOrders(updatedOrders);
    setAdministrations(updatedAdms);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    emitClinicalEvent(
      newOrder.orderType === 'MEDICATION' ? 'MEDICATION_ORDERED' : 'LAB_ORDERED',
      `Order Placed: ${newOrder.title}`,
      `Priority: ${newOrder.priority}. Ordered by ${currentStaff.name}${newOrder.cdsAlertsDismissed && newOrder.cdsAlertsDismissed.length > 0 ? ` (CDS Intercept Overridden: ${newOrder.cdsAlertsDismissed.length})` : ''}`,
      newOrder.patientId,
      newOrder.encounterId
    );

    return { order: newOrder, alerts };
  };

  const verifyOrderPharmacy = (orderId: string) => {
    const verifiedOrder = tenantRepository.atomicVerifyOrder(
      activeFacilityId,
      orderId,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );

    const updatedOrders = tenantRepository.getOrders(activeFacilityId);
    setOrders(updatedOrders);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    emitClinicalEvent(
      'PHARMACY_VERIFIED',
      `Pharmacy Verified: ${verifiedOrder.title}`,
      `Pharmacist review confirmed by ${currentStaff.name}. Safe for automated dispensing.`,
      verifiedOrder.patientId,
      verifiedOrder.encounterId
    );
  };

  const dispenseOrderPharmacy = (orderId: string) => {
    const dispensedOrder = tenantRepository.atomicDispenseOrder(
      activeFacilityId,
      orderId,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );

    const updatedOrders = tenantRepository.getOrders(activeFacilityId);
    setOrders(updatedOrders);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    emitClinicalEvent(
      'PHARMACY_DISPENSED',
      `Medication Dispensed: ${dispensedOrder.title}`,
      `Dispensed by automated pyxis / cart under pharmacy authorization by ${currentStaff.name}. Ready for bedside eMAR administration.`,
      dispensedOrder.patientId,
      dispensedOrder.encounterId
    );
  };

  const administerMedication = ({
    administrationId,
    status,
    doseGiven,
    routeGiven,
    heldReason,
    injectionSite,
    cosignedBy
  }: {
    administrationId: string;
    status: 'GIVEN' | 'NOT_GIVEN' | 'REFUSED' | 'HELD';
    doseGiven?: string;
    routeGiven?: string;
    heldReason?: string;
    injectionSite?: string;
    cosignedBy?: string;
  }) => {
    const updatedAdm = tenantRepository.atomicAdministerMedication(
      activeFacilityId,
      administrationId,
      status,
      currentStaff.id,
      currentStaff.name,
      {
        doseGiven,
        routeGiven,
        heldReason,
        injectionSite,
        cosignedBy
      }
    );

    const updatedAdms = tenantRepository.getAdministrations(activeFacilityId);
    setAdministrations(updatedAdms);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    const relatedOrder = orders.find(o => o.id === updatedAdm.orderId);
    emitClinicalEvent(
      'MEDICATION_ADMINISTERED',
      `eMAR Administration: ${relatedOrder?.title || 'Medication'} (${status})`,
      `Status: ${status} by ${currentStaff.name}${heldReason ? ` - Hold Reason: ${heldReason}` : ''}${cosignedBy ? ` - Cosigned by: ${cosignedBy}` : ''}`,
      updatedAdm.patientId,
      updatedAdm.encounterId
    );
  };

  const saveClinicalNote = (noteData: Omit<ClinicalNote, 'id' | 'facilityId' | 'createdAt' | 'version'> & { id?: string }): ClinicalNote => {
    const saved = tenantRepository.atomicSaveClinicalNote(
      activeFacilityId,
      noteData,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );

    const updatedNotes = tenantRepository.getNotes(activeFacilityId);
    setNotes(updatedNotes);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    emitClinicalEvent(
      'NOTE_DRAFTED',
      `Clinical Note Drafted: ${saved.noteType} (v${saved.version})`,
      `Drafted by ${currentStaff.name}. Status: ${saved.status}`,
      saved.patientId,
      saved.encounterId
    );

    return saved;
  };

  const signClinicalNote = (noteId: string): ClinicalNote => {
    const signed = tenantRepository.atomicSignClinicalNote(
      activeFacilityId,
      noteId,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );

    const updatedNotes = tenantRepository.getNotes(activeFacilityId);
    setNotes(updatedNotes);

    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);

    emitClinicalEvent(
      'NOTE_SIGNED',
      `Clinical Note Attested & Signed: ${signed.noteType}`,
      `Formally signed with electronic attestation by ${currentStaff.name} (${currentStaff.role}). Note permanently locked.`,
      signed.patientId,
      signed.encounterId
    );

    return signed;
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

  // Facility Admin Operations
  const updateFacilityConfig = (updates: Partial<HealthcareFacility>) => {
    const updated = tenantRepository.updateFacility(
      activeFacilityId,
      updates,
      currentStaff.name,
      currentStaff.role
    );
    // Refresh facilities array
    const facs = tenantRepository.listFacilities();
    // Refresh audit logs
    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);
  };

  const createDepartment = (dept: Omit<HospitalDepartment, 'facilityId'>) => {
    tenantRepository.addDepartment(
      activeFacilityId,
      dept,
      currentStaff.name,
      currentStaff.role
    );
    const updatedDepts = tenantRepository.getDepartments(activeFacilityId);
    setDepartments(updatedDepts);
    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);
  };

  const createBed = (bed: Omit<HospitalBed, 'facilityId'>) => {
    tenantRepository.addBed(
      activeFacilityId,
      bed,
      currentStaff.name,
      currentStaff.role
    );
    const updatedBeds = tenantRepository.getBeds(activeFacilityId);
    setBeds(updatedBeds);
    const audits = tenantRepository.getAuditLogs(activeFacilityId);
    setAuditLogs(audits);
  };

  // Emergency & Resuscitation Operations
  const updateTraumaBay = (bayId: string, updates: Partial<TraumaBay>) => {
    const updated = tenantRepository.updateTraumaBay(
      activeFacilityId,
      bayId,
      updates,
      currentStaff.name,
      currentStaff.role
    );
    setTraumaBays(tenantRepository.getTraumaBays(activeFacilityId));
    setAuditLogs(tenantRepository.getAuditLogs(activeFacilityId));
    return updated;
  };

  const updateDoorToMetric = (metricId: string, updates: Partial<DoorToMetric>) => {
    const updated = tenantRepository.updateDoorToMetric(activeFacilityId, metricId, updates);
    setDoorToMetrics(tenantRepository.getDoorToMetrics(activeFacilityId));
    return updated;
  };

  const recordResuscitationEvent = (record: ResuscitationRecord) => {
    const saved = tenantRepository.atomicRecordResuscitationEvent(
      activeFacilityId,
      record,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );
    setResuscitations(tenantRepository.getResuscitations(activeFacilityId));
    setAuditLogs(tenantRepository.getAuditLogs(activeFacilityId));

    if (record.status === 'ROSC_ACHIEVED') {
      emitClinicalEvent(
        'RESUSCITATION_ROSC_ACHIEVED',
        `ROSC ACHIEVED: Return of Spontaneous Circulation`,
        `ROSC documented by ${currentStaff.name} after ${record.currentCprCycle} CPR cycles. Shocks: ${record.shocksDelivered.length}. Post-arrest protocol initiated.`,
        record.patientId,
        record.encounterId
      );
    } else if (record.status === 'TERMINATED') {
      emitClinicalEvent(
        'RESUSCITATION_TERMINATED',
        `Resuscitation Efforts Ceased`,
        `Resuscitation ceased by Team Lead ${record.teamLead} after ${record.currentCprCycle} cycles. Time of death/cessation documented.`,
        record.patientId,
        record.encounterId
      );
    }
    return saved;
  };

  const recordMciTag = (tagData: Omit<MciPatientTag, 'id' | 'facilityId' | 'taggedAt'>) => {
    const saved = tenantRepository.atomicRecordMciTag(
      activeFacilityId,
      tagData,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );
    setMciTags(tenantRepository.getMciTags(activeFacilityId));
    setAuditLogs(tenantRepository.getAuditLogs(activeFacilityId));

    emitClinicalEvent(
      'MCI_TRIAGE_TAGGED',
      `MCI Triage Tag: ${saved.tagNumber} (${saved.triageCategory.replace('_', ' ')})`,
      `Disaster Code: ${saved.disasterCode}. Chief: ${saved.chiefInjuries}. Tagged by ${currentStaff.name}`,
      activePatientId,
      activeEncounterId
    );
    return saved;
  };

  // Operating Theatre & Perioperative Safety Operations
  const scheduleSurgicalCase = (caseData: Omit<SurgicalCase, 'id' | 'facilityId'>) => {
    const created = tenantRepository.atomicScheduleSurgicalCase(
      activeFacilityId,
      caseData,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );
    setSurgicalCases(tenantRepository.getSurgicalCases(activeFacilityId));
    setAuditLogs(tenantRepository.getAuditLogs(activeFacilityId));

    emitClinicalEvent(
      'SURGICAL_CASE_SCHEDULED',
      `Surgical Case Booked: ${created.procedureName}`,
      `Room: ${created.operatingRoom}. Surgeon: ${created.intraoperative.primarySurgeon}. Scheduled for ${new Date(created.scheduledStartTime).toLocaleTimeString()}`,
      created.patientId,
      activeEncounterId
    );
    return created;
  };

  const updateSurgicalCase = (caseId: string, updates: Partial<SurgicalCase>) => {
    const updated = tenantRepository.atomicUpdateSurgicalCase(
      activeFacilityId,
      caseId,
      updates,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );
    setSurgicalCases(tenantRepository.getSurgicalCases(activeFacilityId));
    setAuditLogs(tenantRepository.getAuditLogs(activeFacilityId));

    if (updates.status === 'COMPLETED') {
      emitClinicalEvent(
        'SURGICAL_CASE_COMPLETED',
        `Surgical Case Completed: ${updated.procedureName}`,
        `Procedure concluded in ${updated.operatingRoom}. Destination: ${updated.intraoperative.postOpDestination}. EBL: ${updated.intraoperative.eblMl}mL`,
        updated.patientId,
        activeEncounterId
      );
    }
    return updated;
  };

  const updateWhoChecklist = (caseId: string, phase: 'signIn' | 'timeOut' | 'signOut', checks: any) => {
    const updated = tenantRepository.atomicUpdateWhoChecklist(
      activeFacilityId,
      caseId,
      phase,
      checks,
      currentStaff.id,
      currentStaff.name,
      currentStaff.role
    );
    setSurgicalCases(tenantRepository.getSurgicalCases(activeFacilityId));
    setAuditLogs(tenantRepository.getAuditLogs(activeFacilityId));

    if (phase === 'timeOut') {
      emitClinicalEvent(
        'SURGICAL_TIME_OUT_COMPLETED',
        `WHO Surgical Safety Time-Out Verified`,
        `Formal verbal confirmation completed before incision by ${currentStaff.name} in ${updated.operatingRoom}. Antibiotics verified.`,
        updated.patientId,
        activeEncounterId
      );
    } else if (phase === 'signOut') {
      emitClinicalEvent(
        'SURGICAL_COUNTS_RECONCILED',
        `WHO Surgical Sign-Out & Counts Reconciled`,
        `Instruments, sponges, and needles formally reconciled correct. Specimen verified. Patient transferring to ${updated.intraoperative.postOpDestination}.`,
        updated.patientId,
        activeEncounterId
      );
    }
    return updated;
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
      traumaBays,
      doorToMetrics,
      resuscitations,
      mciTags,
      updateTraumaBay,
      updateDoorToMetric,
      recordResuscitationEvent,
      recordMciTag,
      surgicalCases,
      scheduleSurgicalCase,
      updateSurgicalCase,
      updateWhoChecklist,
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
      registerPatient,
      updatePatientDemographics,
      updatePatientAllergy,
      searchPatientsGlobal,
      evaluateCandidateOrder,
      createCPOEOrder,
      verifyOrderPharmacy,
      dispenseOrderPharmacy,
      administerMedication,
      saveClinicalNote,
      signClinicalNote,
      auditLogs,
      updateFacilityConfig,
      createDepartment,
      createBed,
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
