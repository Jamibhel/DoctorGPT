/**
 * HospitalOS - Core Clinical & Hospital Information System Types
 * Structured according to FHIR R4/R5 domain models with full lifecycle semantics.
 */

// ==========================================
// 1. IDENTIFIERS & ROLES
// ==========================================

export type UserRole = 
  | 'PHYSICIAN' 
  | 'NURSE' 
  | 'PHARMACIST' 
  | 'RADIOLOGIST' 
  | 'HOSPITAL_ADMINISTRATOR';

export interface StaffMember {
  id: string; // e.g. "Practitioner/dr-thorne"
  name: string;
  role: UserRole;
  departmentId: string;
  npi?: string;
  licenseNumber?: string;
  pagerNumber?: string;
  onCall: boolean;
  activeShift: 'DAY' | 'NIGHT' | 'SWING';
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
// 2. PATIENT & ALLERGIES (VERSIONED)
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
  mrn: string; // "SYN-849201"
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
// 3. ENCOUNTERS, BEDS & ADT
// ==========================================

export type EncounterClass = 'INPATIENT' | 'EMERGENCY' | 'OUTPATIENT' | 'AMBULATORY';
export type EncounterStatus = 'PLANNED' | 'IN_TRIAGE' | 'ACTIVE' | 'DISCHARGE_PENDING' | 'DISCHARGED' | 'CANCELLED';

export interface Encounter {
  id: string; // "Encounter/enc-2026-001"
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
  encounterId: string;
  patientId: string;
  bedId: string;
  assignedAt: string;
  releasedAt?: string;
  assignedBy: string;
  reason: 'ADMISSION' | 'ROUTINE_TRANSFER' | 'ESCALATION_TO_ICU' | 'STEP_DOWN' | 'DISCHARGE';
}

// ==========================================
// 4. CLINICAL OBSERVATIONS & NEWS2
// ==========================================

export type ConsciousnessLevel = 'ALERT' | 'CVPU_VOICE' | 'CVPU_PAIN' | 'CVPU_UNRESPONSIVE';

export interface VitalSignObservation {
  id: string; // "Observation/obs-901"
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
// 5. CPOE ORDERS & eMAR LIFECYCLE
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
// 6. CLINICAL DECISION SUPPORT (CDS)
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
  aiExplanation?: string; // Natural language context from Gemini
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
// 7. DIAGNOSTIC LABS & RADIOLOGY
// ==========================================

export type LabFlag = 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL_HIGH' | 'CRITICAL_LOW';

export interface DiagnosticLabResult {
  id: string; // "Observation/lab-501"
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
// 8. CLINICAL NOTES (VERSIONED LIFECYCLE)
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
// 9. CLINICAL EVENT BUS & AUDIT LOG
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
  | 'EMERGENCY_CODE_RESOLVED';

export interface ClinicalEvent {
  id: string; // "Event/evt-001"
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

// ==========================================
// 10. SIMULATED EMERGENCY CODE ACTIONS
// ==========================================

export type EmergencyCodeType = 'CODE_BLUE' | 'RAPID_RESPONSE' | 'CODE_STEMI' | 'CODE_STROKE';
export type EmergencyCodeState = 'ACTIVE' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';

export interface SimulatedEmergencyEvent {
  id: string;
  codeType: EmergencyCodeType;
  patientId: string;
  encounterId: string;
  location: string; // e.g. "Med-Surg Ward Room 304-B"
  state: EmergencyCodeState;
  initiatedAt: string;
  initiatedBy: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  clinicalSummary: string;
}
