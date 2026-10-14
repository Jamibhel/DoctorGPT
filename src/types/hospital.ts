/**
 * BJI MediSupport - Multi-Tenant Clinical & Healthcare Operations Types
 * Structured according to FHIR R4/R5 domain models with strict facility multi-tenancy.
 */

// ==========================================
// 1. FACILITIES & TENANTS (CORE MULTI-TENANCY)
// ==========================================

export type FacilityType = 
  | 'HOSPITAL' 
  | 'CLINIC' 
  | 'MEDICAL_CENTER' 
  | 'DIAGNOSTIC_CENTER' 
  | 'SPECIALIST_CENTER';

export type FacilityStatus = 'ACTIVE' | 'ONBOARDING' | 'SUSPENDED' | 'MAINTENANCE';

export interface HealthcareFacility {
  id: string; // e.g. "fac-st-jude", "fac-apex-valley", "fac-metro-diag"
  name: string;
  code: string; // e.g. "SJM", "APX", "MDC"
  type: FacilityType;
  status: FacilityStatus;
  mrnPrefix: string; // e.g. "BJI-SJM", "BJI-APX"
  address: string;
  phone: string;
  email: string;
  timezone: string;
  totalBedCapacity: number;
  activeCensus: number;
  operatingHours?: string;
  servicesCatalog?: string[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. IDENTIFIERS, ROLES & GRANULAR RBAC
// ==========================================

export type UserRole = 
  | 'PHYSICIAN' 
  | 'NURSE' 
  | 'PHARMACIST' 
  | 'RADIOLOGIST' 
  | 'HOSPITAL_ADMINISTRATOR';

export type Permission = 
  | 'patients:read'
  | 'patients:create'
  | 'patients:update'
  | 'encounters:read'
  | 'encounters:create'
  | 'encounters:update'
  | 'orders:read'
  | 'orders:create'
  | 'orders:cancel'
  | 'labs:read'
  | 'labs:create'
  | 'labs:verify'
  | 'medications:read'
  | 'medications:verify'
  | 'medications:dispense'
  | 'medications:administer'
  | 'vitals:read'
  | 'vitals:create'
  | 'notes:create'
  | 'notes:sign'
  | 'notes:amend'
  | 'beds:read'
  | 'beds:manage'
  | 'staff:read'
  | 'staff:manage'
  | 'facility:settings'
  | 'audit:read';

export interface RoleDefinition {
  id: string;
  facilityId: string;
  role: UserRole;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface StaffMember {
  id: string; // e.g. "Practitioner/dr-thorne"
  facilityId: string; // Tenant foreign key
  name: string;
  role: UserRole;
  departmentId: string;
  npi?: string;
  licenseNumber?: string;
  pagerNumber?: string;
  onCall: boolean;
  activeShift: 'DAY' | 'NIGHT' | 'SWING';
  permissions?: Permission[];
}

export type DepartmentType = 
  | 'EMERGENCY'
  | 'INTENSIVE_CARE'
  | 'MED_SURG'
  | 'STEP_DOWN'
  | 'ENDOCRINOLOGY'
  | 'CARDIOLOGY'
  | 'NEPHROLOGY'
  | 'RADIOLOGY'
  | 'PHARMACY';

export interface HospitalDepartment {
  id: string; // e.g. "Department/med-surg-3"
  facilityId: string; // Tenant foreign key
  name: string;
  type: DepartmentType;
  floor: number;
  building: string;
  totalBeds: number;
  occupiedBeds: number;
  leadPhysicianId: string;
  nurseManagerId: string;
}

// ==========================================
// 3. PATIENT & ALLERGIES (VERSIONED)
// ==========================================

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
export type AllergyCategory = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'BIOLOGICAL';

export interface PatientAllergy {
  id: string; // "AllergyIntolerance/all-01"
  allergen: string;
  substanceCode?: string; // RxNorm or SNOMED
  category: AllergyCategory;
  reaction: string;
  severity: AllergySeverity;
  verificationStatus: 'CONFIRMED' | 'SUSPECTED' | 'REFUTED' | 'RESOLVED';
  recordedAt: string;
  recordedBy: string; // Practitioner ID
  version: number;
}

export interface Patient {
  id: string; // "Patient/pat-1001"
  facilityId: string; // Tenant foreign key
  mrn: string; // e.g. "BJI-SJM-001001"
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'M' | 'F' | 'OTHER';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: PatientAllergy[];
  activeConditions: string[]; // ICD-10 text
  primaryLanguage: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. ENCOUNTERS, BEDS & ADT
// ==========================================

export type EncounterClass = 'INPATIENT' | 'EMERGENCY' | 'OUTPATIENT' | 'AMBULATORY';
export type EncounterStatus = 'PLANNED' | 'IN_TRIAGE' | 'ACTIVE' | 'DISCHARGE_PENDING' | 'DISCHARGED' | 'CANCELLED';

export interface Encounter {
  id: string; // "Encounter/enc-2026-001"
  facilityId: string; // Tenant foreign key
  patientId: string;
  encounterClass: EncounterClass;
  status: EncounterStatus;
  departmentId: string;
  admittedAt: string;
  dischargedAt?: string;
  attendingPhysicianId: string;
  admittingDiagnosis: string;
  chiefComplaint: string;
  triageLevel?: 1 | 2 | 3 | 4 | 5; // ESI 1-5
  codeStatus: 'FULL_CODE' | 'DNR' | 'DNI' | 'COMFORT_CARE';
  activeBedId?: string;
  careTeamIds: string[];
}

export type BedStatus = 'OCCUPIED' | 'CLEANING' | 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';

export interface HospitalBed {
  id: string; // "Bed/304-B"
  facilityId: string; // Tenant foreign key
  wardId: string;
  roomNumber: string;
  bedNumber: string;
  status: BedStatus;
  currentEncounterId?: string;
  currentPatientId?: string;
  cleaningStartedAt?: string;
  isIcuEquipped: boolean;
  telemetryEnabled: boolean;
}

export interface BedAssignment {
  id: string;
  facilityId: string; // Tenant foreign key
  encounterId: string;
  patientId: string;
  bedId: string;
  assignedAt: string;
  releasedAt?: string;
  assignedBy: string;
  reason: 'ADMISSION' | 'ROUTINE_TRANSFER' | 'ESCALATION_TO_ICU' | 'STEP_DOWN' | 'DISCHARGE';
}

// ==========================================
// 5. CLINICAL OBSERVATIONS & NEWS2
// ==========================================

export type ConsciousnessLevel = 'ALERT' | 'CVPU_VOICE' | 'CVPU_PAIN' | 'CVPU_UNRESPONSIVE';

export interface VitalSignObservation {
  id: string; // "Observation/obs-901"
  facilityId: string; // Tenant foreign key
  encounterId: string;
  patientId: string;
  timestamp: string;
  recordedBy: string; // Practitioner ID
  respirationRate: number; // breaths/min
  spO2: number; // percentage
  spO2Scale: 1 | 2; // Scale 1 = standard, Scale 2 = hypercapnic respiratory failure
  supplementalOxygen: boolean; // on room air vs supplemental O2
  oxygenFlowLMin?: number;
  temperatureCelsius: number;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number; // bpm
  consciousness: ConsciousnessLevel;
  bloodGlucoseMgDl?: number;
  news2Score: number;
  news2RiskTier: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';
}

// ==========================================
// 6. CPOE ORDERS & eMAR LIFECYCLE
// ==========================================

export type OrderType = 
  | 'MEDICATION' 
  | 'LAB' 
  | 'RADIOLOGY' 
  | 'CONSULT' 
  | 'NURSING' 
  | 'DIET';

export type OrderPriority = 'ROUTINE' | 'URGENT' | 'STAT';
export type OrderStatus = 
  | 'ORDERED' 
  | 'PHARMACY_VERIFIED' 
  | 'DISPENSED' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'DISCONTINUED' 
  | 'CANCELLED';

export interface CPOEOrder {
  id: string; // "MedicationRequest/med-801" or "ServiceRequest/lab-902"
  facilityId: string; // Tenant foreign key
  encounterId: string;
  patientId: string;
  orderType: OrderType;
  priority: OrderPriority;
  status: OrderStatus;
  orderedAt: string;
  orderedBy: string; // Practitioner ID
  verifiedAt?: string;
  verifiedBy?: string; // Pharmacist ID
  title: string;
  description: string;
  categoryCode?: string;
  // Medication Specific
  medicationDetails?: {
    drugName: string;
    genericName: string;
    rxNormCode?: string;
    dosage: string;
    route: 'ORAL' | 'IV' | 'SUBCUTANEOUS' | 'TOPICAL' | 'INHALATION';
    frequency: string;
    indication: string;
    scheduleTimes: string[]; // e.g. ["08:00", "20:00"]
  };
  // Lab / Diagnostic Specific
  labDetails?: {
    testCode: string;
    specimen: 'BLOOD' | 'URINE' | 'CSF' | 'SWAB';
  };
  // Radiology Specific
  radiologyDetails?: {
    modality: 'X_RAY' | 'CT' | 'MRI' | 'ULTRASOUND';
    bodySite: string;
    reasonForExam: string;
  };
  cdsAlertsDismissed?: {
    alertId: string;
    clinicianRationale: string;
    dismissedAt: string;
    dismissedBy: string;
  }[];
}

export type AdministrationStatus = 'GIVEN' | 'NOT_GIVEN' | 'REFUSED' | 'HELD' | 'DELAYED';

export interface MedicationAdministration {
  id: string; // "MedicationAdministration/adm-301"
  facilityId: string; // Tenant foreign key
  orderId: string;
  encounterId: string;
  patientId: string;
  scheduledTime: string;
  administeredTime?: string;
  status: AdministrationStatus;
  administeredBy?: string; // Nurse ID
  doseGiven?: string;
  routeGiven?: string;
  heldReason?: string;
  injectionSite?: string;
  cosignedBy?: string; // Double verification nurse for high-risk meds (Insulin, Heparin)
}

// ==========================================
// 7. CLINICAL DECISION SUPPORT (CDS)
// ==========================================

export type CDSAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL_CONTRAINDICATION';

export interface CDSAlert {
  id: string;
  type: 'DRUG_DRUG' | 'DRUG_ALLERGY' | 'DRUG_RENAL' | 'DUPLICATE_THERAPY' | 'DOSE_LIMIT';
  severity: CDSAlertSeverity;
  offendingOrderTitle: string;
  conflictingItem: string; // Triggering drug, allergen, or lab (e.g. "eGFR < 30")
  mechanism: string;
  clinicalRecommendation: string;
  sourceRuleId: string;
  canOverrideWithRationale: boolean;
  aiExplanation?: string; // Natural language context
}

export interface CDSDrugInteractionRule {
  id: string;
  drugA: string;
  drugB: string;
  severity: CDSAlertSeverity;
  mechanism: string;
  recommendation: string;
}

export interface CDSDrugAllergyRule {
  id: string;
  medication: string;
  allergenClass: string;
  crossReactives: string[];
  severity: CDSAlertSeverity;
  mechanism: string;
  recommendation: string;
}

// ==========================================
// 8. DIAGNOSTIC LABS & RADIOLOGY
// ==========================================

export type LabFlag = 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';

export interface DiagnosticLabResult {
  id: string; // "Observation/lab-501"
  facilityId: string; // Tenant foreign key
  encounterId: string;
  patientId: string;
  testName: string;
  category: 'CHEMISTRY' | 'HEMATOLOGY' | 'ENDOCRINE' | 'URINALYSIS' | 'MICROBIOLOGY';
  value: number | string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  flag: LabFlag;
  collectedAt: string;
  resultedAt: string;
  performingLab: string;
}

export interface RadiologyStudy {
  id: string; // "DiagnosticReport/rad-101"
  facilityId: string; // Tenant foreign key
  encounterId: string;
  patientId: string;
  studyType: string;
  modality: 'X_RAY' | 'CT' | 'MRI' | 'ULTRASOUND';
  bodySite: string;
  studyDate: string;
  radiologistId: string;
  imageThumbnailUrl: string;
  findings: string;
  impression: string;
  aiBoundingBoxes?: {
    id: string;
    label: string;
    confidence: number;
    x: number; // Percentage 0-100
    y: number;
    width: number;
    height: number;
    description: string;
  }[];
  isCriticalAlert: boolean;
}

// ==========================================
// 9. CLINICAL NOTES (VERSIONED LIFECYCLE)
// ==========================================

export type NoteStatus = 'DRAFT' | 'PHYSICIAN_REVIEW' | 'SIGNED' | 'AMENDED';

export interface ClinicalEvidence {
  id: string;
  sourceType: 'TRANSCRIPT' | 'LAB' | 'VITAL' | 'MEDICATION' | 'RADIOLOGY';
  sourceId: string;
  sourceTimestamp: string;
  quoteOrValue: string;
  confidence: number;
  verifiedByClinician: boolean;
}

export interface SoapNoteSection {
  text: string;
  evidences?: ClinicalEvidence[];
}

export interface ClinicalNote {
  id: string; // "DocumentReference/note-101"
  facilityId: string; // Tenant foreign key
  encounterId: string;
  patientId: string;
  authorId: string;
  noteType: 'SOAP_ENCOUNTER' | 'H_AND_P' | 'PROGRESS_NOTE' | 'DISCHARGE_SUMMARY' | 'CONSULT_NOTE';
  status: NoteStatus;
  subjective: SoapNoteSection;
  objective: SoapNoteSection;
  assessment: SoapNoteSection;
  plan: SoapNoteSection;
  createdAt: string;
  signedAt?: string;
  signedBy?: string;
  version: number;
  previousVersionId?: string;
}

// ==========================================
// 10. CLINICAL EVENT BUS & AUDIT LOG
// ==========================================

export type ClinicalEventType = 
  | 'PATIENT_ADMITTED'
  | 'PATIENT_TRANSFERRED'
  | 'PATIENT_DISCHARGED'
  | 'VITAL_RECORDED'
  | 'ALLERGY_RECORDED'
  | 'ALLERGY_UPDATED'
  | 'MEDICATION_ORDERED'
  | 'PHARMACY_VERIFIED'
  | 'MEDICATION_ADMINISTERED'
  | 'LAB_ORDERED'
  | 'LAB_RESULTED'
  | 'RADIOLOGY_RESULTED'
  | 'NOTE_DRAFTED'
  | 'NOTE_SIGNED'
  | 'CDS_ALERT_TRIGGERED'
  | 'CDS_ALERT_OVERRIDDEN'
  | 'EMERGENCY_CODE_TRIGGERED'
  | 'EMERGENCY_CODE_ACKNOWLEDGED'
  | 'EMERGENCY_CODE_RESOLVED'
  | 'RESUSCITATION_ROSC_ACHIEVED'
  | 'RESUSCITATION_TERMINATED'
  | 'MCI_TRIAGE_TAGGED';

export interface ClinicalEvent {
  id: string; // "Event/evt-001"
  facilityId: string; // Tenant foreign key
  patientId: string;
  encounterId: string;
  type: ClinicalEventType;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  departmentId: string;
  title: string;
  description: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  facilityId: string; // Tenant foreign key
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  patientId?: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  source: string;
}

// ==========================================
// 11. SIMULATED EMERGENCY CODE ACTIONS & RESUSCITATION
// ==========================================

export type EmergencyCodeType = 'CODE_BLUE' | 'RAPID_RESPONSE' | 'CODE_STEMI' | 'CODE_STROKE' | 'TRAUMA_STAT';
export type EmergencyCodeState = 'ACTIVE' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';

export interface SimulatedEmergencyEvent {
  id: string;
  facilityId: string; // Tenant foreign key
  codeType: EmergencyCodeType;
  patientId: string;
  encounterId: string;
  location: string;
  state: EmergencyCodeState;
  initiatedAt: string;
  initiatedBy: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  clinicalSummary: string;
}

export type ResuscitationRhythm = 
  | 'VENTRICULAR_FIBRILLATION' 
  | 'PULSELESS_VT' 
  | 'ASYSTOLE' 
  | 'PEA' 
  | 'ORGANIZED_SINUS' 
  | 'ROSC';

export interface ResuscitationShock {
  id: string;
  timestamp: string;
  cycleNumber: number;
  energyJoules: number;
  deliveredBy: string;
}

export interface ResuscitationMedication {
  id: string;
  timestamp: string;
  cycleNumber: number;
  drug: string;
  dose: string;
  route: string;
  givenBy: string;
}

export interface ResuscitationLogEntry {
  id: string;
  timestamp: string;
  category: 'RHYTHM' | 'SHOCK' | 'MEDICATION' | 'AIRWAY' | 'REVERSIBLE_CAUSE' | 'NOTE';
  text: string;
  cycleNumber: number;
}

export interface ReversibleCausesState {
  hypovolemia: boolean;
  hypoxia: boolean;
  hydrogenAcidosis: boolean;
  hypoHyperkalemia: boolean;
  hypothermia: boolean;
  tensionPneumothorax: boolean;
  tamponadeCardiac: boolean;
  toxins: boolean;
  thrombosisPulmonary: boolean;
  thrombosisCoronary: boolean;
}

export interface ResuscitationAirway {
  type: 'BAG_VALVE_MASK' | 'SUPRAGLOTTIC' | 'ENDOTRACHEAL_TUBE';
  tubeSize?: string;
  depthCm?: number;
  etco2MmHg?: number;
  verifiedMethod?: string;
}

export interface ResuscitationRecord {
  id: string;
  facilityId: string;
  patientId: string;
  encounterId: string;
  codeType: EmergencyCodeType;
  isDrill: boolean;
  status: 'ACTIVE' | 'ROSC_ACHIEVED' | 'TERMINATED' | 'TRANSFERRED';
  startedAt: string;
  endedAt?: string;
  currentCprCycle: number;
  currentCycleSeconds: number; // 0-120s timer
  totalElapsedSeconds: number;
  lastRhythm: ResuscitationRhythm;
  rhythmHistory: Array<{ timestamp: string; rhythm: ResuscitationRhythm; shockable: boolean }>;
  shocksDelivered: ResuscitationShock[];
  medicationsGiven: ResuscitationMedication[];
  airway: ResuscitationAirway;
  reversibleCauses: ReversibleCausesState;
  reversibleCausesNotes: string;
  teamLead: string;
  compressorStaff: string[];
  airwayStaff: string;
  recorderStaff: string;
  eventLogs: ResuscitationLogEntry[];
  outcomeNotes?: string;
}

export interface DoorToMetric {
  id: string;
  type: 'DOOR_TO_BALLOON' | 'DOOR_TO_NEEDLE';
  patientId: string;
  patientName: string;
  mrn: string;
  targetMinutes: number; // 90 for Balloon, 60 for Needle
  arrivalTime: string;
  interventionTime?: string;
  currentElapsedMinutes: number;
  status: 'ON_TARGET' | 'CRITICAL_WINDOW' | 'BREACHED' | 'ACHIEVED';
}

export interface TraumaBay {
  id: string;
  bayNumber: string;
  name: string;
  status: 'OCCUPIED' | 'AVAILABLE' | 'RESERVED' | 'CLEANING';
  patientId?: string;
  patientName?: string;
  mrn?: string;
  acuity: 1 | 2 | 3 | 4 | 5; // Emergency Severity Index (ESI) 1=Resuscitation to 5=Non-urgent
  chiefComplaint?: string;
  attendingPhysician?: string;
  primaryNurse?: string;
  arrivalTime?: string;
  activeCode?: EmergencyCodeType;
}

export type MciTriageCategory = 'RED_IMMEDIATE' | 'YELLOW_DELAYED' | 'GREEN_MINOR' | 'BLACK_EXPECTANT';

export interface MciPatientTag {
  id: string;
  facilityId: string;
  disasterCode: string;
  tagNumber: string;
  triageCategory: MciTriageCategory;
  estimatedAgeGroup: 'PEDIATRIC' | 'ADULT' | 'GERIATRIC';
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  chiefInjuries: string;
  isAmbulatory: boolean;
  spontaneousBreathing: boolean;
  respiratoryRate?: number;
  hasRadialPulse: boolean;
  followsCommands: boolean;
  assignedBayId?: string;
  taggedAt: string;
  taggedBy: string;
}

