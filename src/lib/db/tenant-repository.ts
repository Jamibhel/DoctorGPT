/**
 * BJI MediSupport - Multi-Tenant Indexed Clinical Repository
 * Enforces strict server-side facility tenant isolation with indexed data structures.
 */

import { 
  HealthcareFacility,
  HospitalDepartment, 
  StaffMember, 
  Patient, 
  Encounter, 
  HospitalBed, 
  VitalSignObservation, 
  CPOEOrder, 
  MedicationAdministration, 
  DiagnosticLabResult, 
  RadiologyStudy, 
  ClinicalNote, 
  ClinicalEvent,
  AuditLogEntry,
  PatientAllergy,
  UserRole
} from "@/types/hospital";

import { 
  SEED_FACILITIES,
  SEED_MULTI_DEPARTMENTS,
  SEED_MULTI_STAFF,
  SEED_MULTI_PATIENTS,
  SEED_MULTI_BEDS,
  SEED_MULTI_ENCOUNTERS
} from "../data/multi-facility-seed";

import { 
  SEED_OBSERVATIONS,
  SEED_ORDERS,
  SEED_ADMINISTRATIONS,
  SEED_LABS,
  SEED_IMAGING,
  SEED_NOTES,
  SEED_EVENTS
} from "../data/hospital-seed";

export class TenantAccessDeniedError extends Error {
  constructor(facilityId: string, resourceType: string, resourceId: string) {
    super(`Tenant Isolation Violation: Facility '${facilityId}' attempted to access unauthorized ${resourceType} '${resourceId}'`);
    this.name = "TenantAccessDeniedError";
  }
}

export class TenantRepository {
  private static instance: TenantRepository;

  // Primary Entity Stores
  private facilities = new Map<string, HealthcareFacility>();
  private departments = new Map<string, HospitalDepartment>();
  private staff = new Map<string, StaffMember>();
  private patients = new Map<string, Patient>();
  private encounters = new Map<string, Encounter>();
  private beds = new Map<string, HospitalBed>();
  private observations = new Map<string, VitalSignObservation>();
  private orders = new Map<string, CPOEOrder>();
  private administrations = new Map<string, MedicationAdministration>();
  private labs = new Map<string, DiagnosticLabResult>();
  private imaging = new Map<string, RadiologyStudy>();
  private notes = new Map<string, ClinicalNote>();
  private events: ClinicalEvent[] = [];
  private auditLogs: AuditLogEntry[] = [];

  // ==========================================
  // HIGH-PERFORMANCE SECONDARY TENANT INDEXES
  // ==========================================
  // Composite Index: [facilityId:mrn] -> Patient
  private idxFacilityAndMrn = new Map<string, Patient>();

  // Composite Index: [facilityId:departmentId] -> Beds[]
  private idxBedsByFacilityAndWard = new Map<string, string[]>();

  // Composite Index: [facilityId:patientId] -> Observations[]
  private idxVitalsByFacilityAndPatient = new Map<string, string[]>();

  // Composite Index: [facilityId:patientId] -> Orders[]
  private idxOrdersByFacilityAndPatient = new Map<string, string[]>();

  // Composite Index: [facilityId:patientId] -> Encounters[]
  private idxEncountersByFacilityAndPatient = new Map<string, string[]>();

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): TenantRepository {
    if (!TenantRepository.instance) {
      TenantRepository.instance = new TenantRepository();
    }
    return TenantRepository.instance;
  }

  private seedInitialData() {
    // 1. Facilities
    SEED_FACILITIES.forEach((f) => this.facilities.set(f.id, f));

    // 2. Departments
    SEED_MULTI_DEPARTMENTS.forEach((d) => this.departments.set(d.id, d));

    // 3. Staff
    SEED_MULTI_STAFF.forEach((s) => this.staff.set(s.id, s));

    // 4. Patients
    SEED_MULTI_PATIENTS.forEach((p) => {
      this.patients.set(p.id, p);
      // Index by facilityId + MRN
      this.idxFacilityAndMrn.set(`${p.facilityId}:${p.mrn.toUpperCase()}`, p);
    });

    // 5. Encounters
    SEED_MULTI_ENCOUNTERS.forEach((enc) => {
      this.encounters.set(enc.id, enc);
      const key = `${enc.facilityId}:${enc.patientId}`;
      const existing = this.idxEncountersByFacilityAndPatient.get(key) || [];
      this.idxEncountersByFacilityAndPatient.set(key, [...existing, enc.id]);
    });

    // 6. Beds
    SEED_MULTI_BEDS.forEach((b) => {
      this.beds.set(b.id, b);
      const key = `${b.facilityId}:${b.wardId}`;
      const existing = this.idxBedsByFacilityAndWard.get(key) || [];
      this.idxBedsByFacilityAndWard.set(key, [...existing, b.id]);
    });

    // 7. Seed clinical data for St. Jude and other facility tenants
    const defaultFacilityId = "fac-st-jude";

    const allSeedObservations: VitalSignObservation[] = [
      ...SEED_OBSERVATIONS.map((obs) => ({ ...obs, facilityId: defaultFacilityId })),
      // St Jude Patient 1 longitudinal series
      {
        id: "Observation/obs-sjm-101",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1001",
        patientId: "Patient/pat-sjm-1001",
        timestamp: "2026-09-30T08:00:00Z",
        recordedBy: "Practitioner/nurse-daniels",
        respirationRate: 18,
        spO2: 96,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 37.8,
        systolicBP: 142,
        diastolicBP: 88,
        heartRate: 88,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 164,
        news2Score: 0,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-sjm-102",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1001",
        patientId: "Patient/pat-sjm-1001",
        timestamp: "2026-09-30T12:00:00Z",
        recordedBy: "Practitioner/nurse-daniels",
        respirationRate: 22,
        spO2: 94,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 38.4,
        systolicBP: 136,
        diastolicBP: 84,
        heartRate: 96,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 182,
        news2Score: 4,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-sjm-103",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1001",
        patientId: "Patient/pat-sjm-1001",
        timestamp: "2026-09-30T16:00:00Z",
        recordedBy: "Practitioner/nurse-vaughn",
        respirationRate: 26,
        spO2: 91,
        spO2Scale: 1,
        supplementalOxygen: true,
        oxygenFlowLMin: 2,
        temperatureCelsius: 39.2,
        systolicBP: 118,
        diastolicBP: 72,
        heartRate: 108,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 210,
        news2Score: 10,
        news2RiskTier: "HIGH",
      },
      {
        id: "Observation/obs-sjm-104",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1001",
        patientId: "Patient/pat-sjm-1001",
        timestamp: "2026-09-30T18:00:00Z",
        recordedBy: "Practitioner/nurse-daniels",
        respirationRate: 24,
        spO2: 95,
        spO2Scale: 1,
        supplementalOxygen: true,
        oxygenFlowLMin: 4,
        temperatureCelsius: 38.6,
        systolicBP: 106,
        diastolicBP: 66,
        heartRate: 112,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 188,
        news2Score: 7,
        news2RiskTier: "HIGH",
      },
      // Also link to alias pat-1001
      {
        id: "Observation/obs-sjm-105",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-1001",
        patientId: "Patient/pat-1001",
        timestamp: "2026-09-30T16:00:00Z",
        recordedBy: "Practitioner/nurse-vaughn",
        respirationRate: 26,
        spO2: 91,
        spO2Scale: 1,
        supplementalOxygen: true,
        oxygenFlowLMin: 2,
        temperatureCelsius: 39.2,
        systolicBP: 118,
        diastolicBP: 72,
        heartRate: 108,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 210,
        news2Score: 10,
        news2RiskTier: "HIGH",
      },
      // St Jude Patient 2 series
      {
        id: "Observation/obs-sjm-201",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1002",
        patientId: "Patient/pat-sjm-1002",
        timestamp: "2026-09-30T06:00:00Z",
        recordedBy: "Practitioner/nurse-vaughn",
        respirationRate: 16,
        spO2: 97,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 36.7,
        systolicBP: 110,
        diastolicBP: 68,
        heartRate: 64,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 115,
        news2Score: 1,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-sjm-202",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1002",
        patientId: "Patient/pat-sjm-1002",
        timestamp: "2026-09-30T14:00:00Z",
        recordedBy: "Practitioner/nurse-vaughn",
        respirationRate: 18,
        spO2: 96,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 36.9,
        systolicBP: 104,
        diastolicBP: 64,
        heartRate: 68,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 128,
        news2Score: 1,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-sjm-203",
        facilityId: "fac-st-jude",
        encounterId: "Encounter/enc-sjm-1002",
        patientId: "Patient/pat-sjm-1002",
        timestamp: "2026-09-30T20:00:00Z",
        recordedBy: "Practitioner/nurse-daniels",
        respirationRate: 19,
        spO2: 95,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 37.0,
        systolicBP: 98,
        diastolicBP: 60,
        heartRate: 72,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 132,
        news2Score: 3,
        news2RiskTier: "LOW",
      },
      // Apex Valley Patient 1 series
      {
        id: "Observation/obs-apx-201",
        facilityId: "fac-apex-valley",
        encounterId: "Encounter/enc-apx-2001",
        patientId: "Patient/pat-apx-2001",
        timestamp: "2026-09-30T08:00:00Z",
        recordedBy: "Practitioner/nurse-song",
        respirationRate: 16,
        spO2: 98,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 36.8,
        systolicBP: 124,
        diastolicBP: 78,
        heartRate: 74,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 102,
        news2Score: 0,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-apx-202",
        facilityId: "fac-apex-valley",
        encounterId: "Encounter/enc-apx-2001",
        patientId: "Patient/pat-apx-2001",
        timestamp: "2026-09-30T12:00:00Z",
        recordedBy: "Practitioner/nurse-song",
        respirationRate: 18,
        spO2: 97,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 37.1,
        systolicBP: 118,
        diastolicBP: 74,
        heartRate: 80,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 110,
        news2Score: 0,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-apx-203",
        facilityId: "fac-apex-valley",
        encounterId: "Encounter/enc-apx-2001",
        patientId: "Patient/pat-apx-2001",
        timestamp: "2026-09-30T16:00:00Z",
        recordedBy: "Practitioner/nurse-song",
        respirationRate: 19,
        spO2: 96,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 37.4,
        systolicBP: 130,
        diastolicBP: 82,
        heartRate: 84,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 116,
        news2Score: 0,
        news2RiskTier: "LOW",
      },
      // Metro Diagnostic Patient 1 series
      {
        id: "Observation/obs-mdc-301",
        facilityId: "fac-metro-diag",
        encounterId: "Encounter/enc-mdc-3001",
        patientId: "Patient/pat-mdc-3001",
        timestamp: "2026-09-30T09:00:00Z",
        recordedBy: "Practitioner/tech-cole",
        respirationRate: 14,
        spO2: 99,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 36.6,
        systolicBP: 128,
        diastolicBP: 80,
        heartRate: 68,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 98,
        news2Score: 0,
        news2RiskTier: "LOW",
      },
      {
        id: "Observation/obs-mdc-302",
        facilityId: "fac-metro-diag",
        encounterId: "Encounter/enc-mdc-3001",
        patientId: "Patient/pat-mdc-3001",
        timestamp: "2026-09-30T11:30:00Z",
        recordedBy: "Practitioner/tech-cole",
        respirationRate: 15,
        spO2: 98,
        spO2Scale: 1,
        supplementalOxygen: false,
        temperatureCelsius: 36.7,
        systolicBP: 122,
        diastolicBP: 78,
        heartRate: 70,
        consciousness: "ALERT",
        bloodGlucoseMgDl: 104,
        news2Score: 0,
        news2RiskTier: "LOW",
      },
    ];

    allSeedObservations.forEach((obs) => {
      this.observations.set(obs.id, obs);
      const key = `${obs.facilityId}:${obs.patientId}`;
      const existing = this.idxVitalsByFacilityAndPatient.get(key) || [];
      if (!existing.includes(obs.id)) {
        this.idxVitalsByFacilityAndPatient.set(key, [...existing, obs.id]);
      }
    });

    SEED_ORDERS.forEach((ord) => {
      const enriched: CPOEOrder = { ...ord, facilityId: defaultFacilityId };
      this.orders.set(enriched.id, enriched);
      const key = `${defaultFacilityId}:${enriched.patientId}`;
      const existing = this.idxOrdersByFacilityAndPatient.get(key) || [];
      this.idxOrdersByFacilityAndPatient.set(key, [...existing, enriched.id]);
    });

    SEED_ADMINISTRATIONS.forEach((adm) => {
      this.administrations.set(adm.id, { ...adm, facilityId: defaultFacilityId });
    });

    SEED_LABS.forEach((lab) => {
      this.labs.set(lab.id, { ...lab, facilityId: defaultFacilityId });
    });

    SEED_IMAGING.forEach((img) => {
      this.imaging.set(img.id, { ...img, facilityId: defaultFacilityId });
    });

    SEED_NOTES.forEach((note) => {
      this.notes.set(note.id, { ...note, facilityId: defaultFacilityId });
    });

    SEED_EVENTS.forEach((evt) => {
      this.events.push({ ...evt, facilityId: defaultFacilityId });
    });
  }

  // ==========================================
  // FACILITY / TENANT OPERATIONS
  // ==========================================

  public listFacilities(): HealthcareFacility[] {
    return Array.from(this.facilities.values());
  }

  public getFacility(facilityId: string): HealthcareFacility | null {
    return this.facilities.get(facilityId) || null;
  }

  public updateFacility(
    facilityId: string, 
    updates: Partial<HealthcareFacility>, 
    actorId: string, 
    actorRole: string
  ): HealthcareFacility {
    const existing = this.facilities.get(facilityId);
    if (!existing) throw new Error(`Facility ${facilityId} not found`);

    const updated: HealthcareFacility = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.facilities.set(facilityId, updated);

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "FACILITY_CONFIG_UPDATED",
      resourceType: "HealthcareFacility",
      resourceId: facilityId,
      timestamp: new Date().toISOString(),
      previousValue: JSON.stringify({ name: existing.name, status: existing.status }),
      newValue: JSON.stringify({ name: updated.name, status: updated.status }),
      source: "Facility_Operations"
    });

    return updated;
  }

  public addDepartment(
    facilityId: string,
    dept: Omit<HospitalDepartment, "facilityId">,
    actorId: string,
    actorRole: string
  ): HospitalDepartment {
    const newDept: HospitalDepartment = {
      ...dept,
      facilityId
    };
    this.departments.set(newDept.id, newDept);

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "DEPARTMENT_CREATED",
      resourceType: "HospitalDepartment",
      resourceId: newDept.id,
      timestamp: new Date().toISOString(),
      newValue: JSON.stringify(newDept),
      source: "Facility_Operations"
    });

    return newDept;
  }

  public addBed(
    facilityId: string,
    bed: Omit<HospitalBed, "facilityId">,
    actorId: string,
    actorRole: string
  ): HospitalBed {
    const newBed: HospitalBed = {
      ...bed,
      facilityId
    };
    this.beds.set(newBed.id, newBed);

    // Update index
    const key = `${facilityId}:${newBed.wardId}`;
    const existing = this.idxBedsByFacilityAndWard.get(key) || [];
    this.idxBedsByFacilityAndWard.set(key, [...existing, newBed.id]);

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "BED_INVENTORY_ADDED",
      resourceType: "HospitalBed",
      resourceId: newBed.id,
      timestamp: new Date().toISOString(),
      newValue: JSON.stringify(newBed),
      source: "Facility_Operations"
    });

    return newBed;
  }

  // ==========================================
  // TENANT-ISOLATED PATIENT QUERIES
  // ==========================================

  public getPatients(facilityId: string): Patient[] {
    return Array.from(this.patients.values()).filter((p) => p.facilityId === facilityId);
  }

  public getPatientById(facilityId: string, patientId: string): Patient | null {
    const patient = this.patients.get(patientId);
    if (!patient) return null;
    if (patient.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "Patient", patientId);
    }
    return patient;
  }

  /**
   * O(1) Indexed lookup by MRN scoped to facility
   */
  public findPatientByMrn(facilityId: string, mrn: string): Patient | null {
    const key = `${facilityId}:${mrn.trim().toUpperCase()}`;
    return this.idxFacilityAndMrn.get(key) || null;
  }

  /**
   * Enterprise Master Patient Index (EMPI) Cross-Facility Search
   * Allows searching across all tenant facilities for identity matching and record linkage
   */
  public searchPatientsGlobal(query: string): { patient: Patient; facility: HealthcareFacility }[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const matches: { patient: Patient; facility: HealthcareFacility }[] = [];
    for (const patient of this.patients.values()) {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const mrnMatch = patient.mrn.toLowerCase().includes(clean);
      const phoneMatch = patient.phone.includes(clean);
      const dobMatch = patient.dateOfBirth.includes(clean);

      if (fullName.includes(clean) || mrnMatch || phoneMatch || dobMatch) {
        const fac = this.facilities.get(patient.facilityId);
        if (fac) {
          matches.push({ patient, facility: fac });
        }
      }
    }
    return matches;
  }

  /**
   * Register new patient with facility MRN auto-generation
   */
  public registerPatient(
    facilityId: string,
    data: Omit<Patient, "id" | "facilityId" | "mrn" | "createdAt" | "updatedAt">,
    actorId: string,
    actorRole: string
  ): Patient {
    const facility = this.facilities.get(facilityId);
    if (!facility) throw new Error(`Facility ${facilityId} not found`);

    const seq = (this.patients.size + 1001).toString().padStart(6, "0");
    const mrn = `${facility.mrnPrefix}-${seq}`;
    const id = `Patient/pat-${Date.now().toString().slice(-6)}`;

    const newPatient: Patient = {
      ...data,
      id,
      facilityId,
      mrn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.patients.set(newPatient.id, newPatient);
    // Index by facility + MRN
    this.idxFacilityAndMrn.set(`${facilityId}:${mrn.toUpperCase()}`, newPatient);

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "PATIENT_REGISTERED",
      resourceType: "Patient",
      resourceId: newPatient.id,
      patientId: newPatient.id,
      timestamp: new Date().toISOString(),
      newValue: JSON.stringify({ mrn, name: `${newPatient.firstName} ${newPatient.lastName}` }),
      source: "EMPI_Registration"
    });

    return newPatient;
  }

  /**
   * Update existing patient demographics
   */
  public updatePatient(
    facilityId: string,
    patientId: string,
    updates: Partial<Patient>,
    actorId: string,
    actorRole: string
  ): Patient {
    const existing = this.patients.get(patientId);
    if (!existing) throw new Error(`Patient ${patientId} not found`);
    if (existing.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "Patient", patientId);
    }

    const updated: Patient = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.patients.set(patientId, updated);

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "PATIENT_DEMOGRAPHICS_UPDATED",
      resourceType: "Patient",
      resourceId: patientId,
      patientId,
      timestamp: new Date().toISOString(),
      previousValue: JSON.stringify({ phone: existing.phone, address: existing.address }),
      newValue: JSON.stringify({ phone: updated.phone, address: updated.address }),
      source: "Patient_Registry"
    });

    return updated;
  }

  /**
   * Versioned patient allergy addition/update
   */
  public updatePatientAllergy(
    facilityId: string,
    patientId: string,
    allergy: PatientAllergy,
    actorId: string,
    actorRole: string
  ): Patient {
    const patient = this.patients.get(patientId);
    if (!patient) throw new Error(`Patient ${patientId} not found`);
    if (patient.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "Patient", patientId);
    }

    const existingIndex = patient.allergies.findIndex((a) => a.id === allergy.id || a.allergen.toLowerCase() === allergy.allergen.toLowerCase());
    const updatedAllergies = [...patient.allergies];

    if (existingIndex >= 0) {
      const prev = updatedAllergies[existingIndex];
      updatedAllergies[existingIndex] = {
        ...allergy,
        version: prev.version + 1,
        recordedAt: new Date().toISOString(),
        recordedBy: actorId
      };
    } else {
      updatedAllergies.push({
        ...allergy,
        id: allergy.id || `AllergyIntolerance/all-${Date.now().toString().slice(-4)}`,
        version: 1,
        recordedAt: new Date().toISOString(),
        recordedBy: actorId
      });
    }

    patient.allergies = updatedAllergies;
    patient.updatedAt = new Date().toISOString();

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "PATIENT_ALLERGY_VERSIONED",
      resourceType: "PatientAllergy",
      resourceId: allergy.id || allergy.allergen,
      patientId,
      timestamp: new Date().toISOString(),
      newValue: JSON.stringify(allergy),
      source: "Allergy_Safety_Engine"
    });

    return patient;
  }

  // ==========================================
  // TENANT-ISOLATED BED & ENCOUNTER QUERIES
  // ==========================================

  public getDepartments(facilityId: string): HospitalDepartment[] {
    return Array.from(this.departments.values()).filter((d) => d.facilityId === facilityId);
  }

  public getBeds(facilityId: string, wardId?: string): HospitalBed[] {
    if (wardId) {
      const key = `${facilityId}:${wardId}`;
      const bedIds = this.idxBedsByFacilityAndWard.get(key) || [];
      return bedIds.map((id) => this.beds.get(id)!).filter(Boolean);
    }
    return Array.from(this.beds.values()).filter((b) => b.facilityId === facilityId);
  }

  public getEncounters(facilityId: string, patientId?: string): Encounter[] {
    if (patientId) {
      const key = `${facilityId}:${patientId}`;
      const encIds = this.idxEncountersByFacilityAndPatient.get(key) || [];
      return encIds.map((id) => this.encounters.get(id)!).filter(Boolean);
    }
    return Array.from(this.encounters.values()).filter((e) => e.facilityId === facilityId);
  }

  public getStaff(facilityId: string): StaffMember[] {
    return Array.from(this.staff.values()).filter((s) => s.facilityId === facilityId);
  }

  // ==========================================
  // TENANT-ISOLATED CLINICAL QUERIES
  // ==========================================

  public getObservations(facilityId: string, patientId?: string): VitalSignObservation[] {
    if (patientId) {
      const key = `${facilityId}:${patientId}`;
      const obsIds = this.idxVitalsByFacilityAndPatient.get(key) || [];
      return obsIds.map((id) => this.observations.get(id)!).filter(Boolean);
    }
    return Array.from(this.observations.values()).filter((o) => o.facilityId === facilityId);
  }

  public getOrders(facilityId: string, patientId?: string): CPOEOrder[] {
    if (patientId) {
      const key = `${facilityId}:${patientId}`;
      const ordIds = this.idxOrdersByFacilityAndPatient.get(key) || [];
      return ordIds.map((id) => this.orders.get(id)!).filter(Boolean);
    }
    return Array.from(this.orders.values()).filter((o) => o.facilityId === facilityId);
  }

  public getAdministrations(facilityId: string, patientId?: string): MedicationAdministration[] {
    const list = Array.from(this.administrations.values()).filter((a) => a.facilityId === facilityId);
    if (patientId) {
      return list.filter((a) => a.patientId === patientId);
    }
    return list;
  }

  public getLabs(facilityId: string, patientId?: string): DiagnosticLabResult[] {
    const list = Array.from(this.labs.values()).filter((l) => l.facilityId === facilityId);
    if (patientId) {
      return list.filter((l) => l.patientId === patientId);
    }
    return list;
  }

  public getImaging(facilityId: string, patientId?: string): RadiologyStudy[] {
    const list = Array.from(this.imaging.values()).filter((i) => i.facilityId === facilityId);
    if (patientId) {
      return list.filter((i) => i.patientId === patientId);
    }
    return list;
  }

  public getNotes(facilityId: string, patientId?: string): ClinicalNote[] {
    const list = Array.from(this.notes.values()).filter((n) => n.facilityId === facilityId);
    if (patientId) {
      return list.filter((n) => n.patientId === patientId);
    }
    return list;
  }

  public getEvents(facilityId: string, patientId?: string): ClinicalEvent[] {
    const list = this.events.filter((e) => e.facilityId === facilityId);
    if (patientId) {
      return list.filter((e) => e.patientId === patientId);
    }
    return list;
  }

  // ==========================================
  // ATOMIC MUTATIONS WITH AUDIT TRAIL LOGGING
  // ==========================================

  public atomicCreateOrder(
    facilityId: string,
    orderData: Omit<CPOEOrder, 'id' | 'orderedAt' | 'facilityId'>,
    actorId: string,
    actorName: string,
    actorRole: string
  ): { order: CPOEOrder; createdAdministrations: MedicationAdministration[] } {
    const orderId = `Order/ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newOrder: CPOEOrder = {
      ...orderData,
      id: orderId,
      facilityId,
      orderedAt: new Date().toISOString(),
      orderedBy: actorId,
    };

    this.orders.set(orderId, newOrder);

    // Update Composite Index: [facilityId:patientId]
    const key = `${facilityId}:${newOrder.patientId}`;
    const existing = this.idxOrdersByFacilityAndPatient.get(key) || [];
    this.idxOrdersByFacilityAndPatient.set(key, [orderId, ...existing.filter(id => id !== orderId)]);

    // Generate eMAR schedules if MEDICATION
    const createdAdministrations: MedicationAdministration[] = [];
    if (newOrder.orderType === 'MEDICATION' && newOrder.medicationDetails) {
      const scheduleTimes = newOrder.medicationDetails.scheduleTimes || ['08:00', '20:00'];
      const today = new Date().toISOString().split('T')[0];

      scheduleTimes.forEach((time, idx) => {
        const admId = `MedicationAdministration/adm-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`;
        const adm: MedicationAdministration = {
          id: admId,
          facilityId,
          orderId,
          encounterId: newOrder.encounterId,
          patientId: newOrder.patientId,
          scheduledTime: `${today}T${time}:00Z`,
          status: 'NOT_GIVEN'
        };
        this.administrations.set(admId, adm);
        createdAdministrations.push(adm);
      });
    }

    // Log Audit Trail
    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName,
      actorRole: (actorRole as UserRole) || 'PHYSICIAN',
      action: "CPOE_ORDER_TRANSMITTED",
      resourceType: "CPOEOrder",
      resourceId: orderId,
      patientId: newOrder.patientId,
      timestamp: new Date().toISOString(),
      previousValue: undefined,
      newValue: JSON.stringify({
        title: newOrder.title,
        orderType: newOrder.orderType,
        priority: newOrder.priority,
        status: newOrder.status,
        cdsAlertsCount: newOrder.cdsAlertsDismissed?.length || 0
      }),
      source: "CPOE_Order_Entry",
    });

    return { order: newOrder, createdAdministrations };
  }

  public atomicVerifyOrder(
    facilityId: string,
    orderId: string,
    actorId: string,
    actorName: string,
    actorRole: string
  ): CPOEOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "CPOEOrder", orderId);
    }

    const previousStatus = order.status;
    order.status = 'PHARMACY_VERIFIED';
    order.verifiedAt = new Date().toISOString();
    order.verifiedBy = actorId;

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName,
      actorRole: (actorRole as UserRole) || 'PHARMACIST',
      action: "PHARMACY_ORDER_VERIFIED",
      resourceType: "CPOEOrder",
      resourceId: orderId,
      patientId: order.patientId,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: 'PHARMACY_VERIFIED',
      source: "Central_Pharmacy_Queue",
    });

    return order;
  }

  public atomicDispenseOrder(
    facilityId: string,
    orderId: string,
    actorId: string,
    actorName: string,
    actorRole: string
  ): CPOEOrder {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "CPOEOrder", orderId);
    }

    const previousStatus = order.status;
    order.status = 'DISPENSED';

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName,
      actorRole: (actorRole as UserRole) || 'PHARMACIST',
      action: "PHARMACY_ORDER_DISPENSED",
      resourceType: "CPOEOrder",
      resourceId: orderId,
      patientId: order.patientId,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: 'DISPENSED',
      source: "Automated_Pyxis_Dispense",
    });

    return order;
  }

  public atomicAdministerMedication(
    facilityId: string,
    administrationId: string,
    status: 'GIVEN' | 'NOT_GIVEN' | 'REFUSED' | 'HELD',
    actorId: string,
    actorName?: string,
    extra?: {
      doseGiven?: string;
      routeGiven?: string;
      heldReason?: string;
      injectionSite?: string;
      cosignedBy?: string;
    }
  ): MedicationAdministration {
    const adm = this.administrations.get(administrationId);
    if (!adm) throw new Error(`Medication administration ${administrationId} not found`);
    if (adm.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "MedicationAdministration", administrationId);
    }

    const previousStatus = adm.status;
    adm.status = status;
    adm.administeredTime = status === 'GIVEN' ? new Date().toISOString() : undefined;
    adm.administeredBy = actorId;
    if (extra?.doseGiven) adm.doseGiven = extra.doseGiven;
    if (extra?.routeGiven) adm.routeGiven = extra.routeGiven;
    if (extra?.heldReason) adm.heldReason = extra.heldReason;
    if (extra?.injectionSite) adm.injectionSite = extra.injectionSite;
    if (extra?.cosignedBy) adm.cosignedBy = extra.cosignedBy;

    // Log Audit
    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorName || actorId,
      actorRole: "NURSE",
      action: "MEDICATION_ADMINISTERED",
      resourceType: "MedicationAdministration",
      resourceId: administrationId,
      patientId: adm.patientId,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: status,
      source: "eMAR_Workstation",
    });

    return adm;
  }

  /**
   * Record new Vital Sign Observation with tenant isolation, composite indexing, and audit trail
   */
  public recordObservation(
    facilityId: string,
    observation: VitalSignObservation,
    actorId: string,
    actorRole: string
  ): VitalSignObservation {
    const enriched: VitalSignObservation = {
      ...observation,
      facilityId,
      id: observation.id || `Observation/obs-${Date.now()}`
    };

    this.observations.set(enriched.id, enriched);

    // Update Composite Index: [facilityId:patientId]
    const key = `${facilityId}:${enriched.patientId}`;
    const existing = this.idxVitalsByFacilityAndPatient.get(key) || [];
    this.idxVitalsByFacilityAndPatient.set(key, [enriched.id, ...existing.filter(id => id !== enriched.id)]);

    // Log Audit Trail
    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
      actorRole: (actorRole as UserRole) || 'CLINICAL_STAFF',
      action: "OBSERVATION_RECORDED",
      resourceType: "VitalSignObservation",
      resourceId: enriched.id,
      patientId: enriched.patientId,
      timestamp: new Date().toISOString(),
      previousValue: undefined,
      newValue: JSON.stringify({
        news2Score: enriched.news2Score,
        news2RiskTier: enriched.news2RiskTier,
        heartRate: enriched.heartRate,
        systolicBP: enriched.systolicBP,
        diastolicBP: enriched.diastolicBP,
        spO2: enriched.spO2,
        spO2Scale: enriched.spO2Scale,
        respirationRate: enriched.respirationRate,
        consciousness: enriched.consciousness,
        temperatureCelsius: enriched.temperatureCelsius
      }),
      source: "Vitals_Flowsheet_Workstation"
    });

    return enriched;
  }

  /**
   * Draft or update a structured Clinical Note
   */
  public atomicSaveClinicalNote(
    facilityId: string,
    noteData: Omit<ClinicalNote, 'id' | 'facilityId' | 'createdAt' | 'version'> & { id?: string },
    actorId: string,
    actorName: string,
    actorRole: string
  ): ClinicalNote {
    const noteId = noteData.id || `DocumentReference/note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = this.notes.get(noteId);

    const savedNote: ClinicalNote = {
      ...noteData,
      id: noteId,
      facilityId,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      version: existing ? existing.version + 1 : 1,
      status: noteData.status || (existing ? existing.status : 'DRAFT')
    };

    this.notes.set(noteId, savedNote);

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName,
      actorRole: (actorRole as UserRole) || 'PHYSICIAN',
      action: "CLINICAL_NOTE_DRAFTED",
      resourceType: "ClinicalNote",
      resourceId: noteId,
      patientId: savedNote.patientId,
      timestamp: new Date().toISOString(),
      previousValue: existing ? `v${existing.version} (${existing.status})` : undefined,
      newValue: `v${savedNote.version} (${savedNote.status})`,
      source: "Ambient_AI_Scribe_Workspace"
    });

    return savedNote;
  }

  /**
   * Cryptographically / legally sign a clinical note and lock it against further edits
   */
  public atomicSignClinicalNote(
    facilityId: string,
    noteId: string,
    actorId: string,
    actorName: string,
    actorRole: string
  ): ClinicalNote {
    const note = this.notes.get(noteId);
    if (!note) throw new Error(`Clinical Note ${noteId} not found`);
    if (note.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "ClinicalNote", noteId);
    }

    const previousStatus = note.status;
    note.status = 'SIGNED';
    note.signedAt = new Date().toISOString();
    note.signedBy = actorId;

    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName,
      actorRole: (actorRole as UserRole) || 'PHYSICIAN',
      action: "CLINICAL_NOTE_SIGNED",
      resourceType: "ClinicalNote",
      resourceId: noteId,
      patientId: note.patientId,
      timestamp: new Date().toISOString(),
      previousValue: previousStatus,
      newValue: 'SIGNED',
      source: "Clinician_Electronic_Attestation"
    });

    return note;
  }

  private logAudit(entry: AuditLogEntry) {
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(facilityId: string): AuditLogEntry[] {
    return this.auditLogs.filter((a) => a.facilityId === facilityId);
  }
}

export const tenantRepository = TenantRepository.getInstance();
