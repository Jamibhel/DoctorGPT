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
  AuditLogEntry
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

    // 7. Seed clinical data for St. Jude
    const defaultFacilityId = "fac-st-jude";

    SEED_OBSERVATIONS.forEach((obs) => {
      const enriched: VitalSignObservation = { ...obs, facilityId: defaultFacilityId };
      this.observations.set(enriched.id, enriched);
      const key = `${defaultFacilityId}:${enriched.patientId}`;
      const existing = this.idxVitalsByFacilityAndPatient.get(key) || [];
      this.idxVitalsByFacilityAndPatient.set(key, [...existing, enriched.id]);
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

  public atomicAdministerMedication(
    facilityId: string,
    administrationId: string,
    status: 'GIVEN' | 'NOT_GIVEN' | 'REFUSED' | 'HELD',
    actorId: string
  ): MedicationAdministration {
    const adm = this.administrations.get(administrationId);
    if (!adm) throw new Error(`Medication administration ${administrationId} not found`);
    if (adm.facilityId !== facilityId) {
      throw new TenantAccessDeniedError(facilityId, "MedicationAdministration", administrationId);
    }

    const previousStatus = adm.status;
    adm.status = status;
    adm.administeredTime = new Date().toISOString();
    adm.administeredBy = actorId;

    // Log Audit
    this.logAudit({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facilityId,
      actorId,
      actorName: actorId,
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
