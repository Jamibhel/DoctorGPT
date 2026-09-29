export type ActionType = 
  | 'REFERRAL' 
  | 'LAB_ORDER' 
  | 'PRESCRIPTION' 
  | 'FOLLOW_UP' 
  | 'PATIENT_INSTRUCTION';

export type ActionStatus = 'SUGGESTED' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED';

export interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  urgency: 'ROUTINE' | 'URGENT' | 'STAT';
  recipientOrTarget?: string;
  status: ActionStatus;
  rationale?: string;
  dosageOrSpec?: string;
}

export interface ClinicalCitation {
  id: string;
  quote: string;
  source: 'transcript' | 'record';
  mappedSection: 'subjective' | 'objective' | 'assessment' | 'plan';
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  differentialDiagnoses?: string[];
  summary: string;
  citations?: ClinicalCitation[];
  lastEditedAt?: string;
}

export type DocumentType = 
  | 'REFERRAL_LETTER' 
  | 'PATIENT_INSTRUCTIONS' 
  | 'HANDOVER_SUMMARY' 
  | 'DISCHARGE_SUMMARY';

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  status: 'DRAFT' | 'APPROVED';
  createdAt: string;
  approvedAt?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  category: 'AI_GENERATION' | 'USER_EDIT' | 'ACTION_DECISION' | 'APPROVAL' | 'QUERY';
}

export interface VitalSign {
  date: string;
  bloodPressure: string;
  heartRate: number;
  respiratoryRate: number;
  temperature: string;
  oxygenSaturation: number;
  weightKg: number;
  bmi: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  indication: string;
  startDate: string;
}

export interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
}

export interface PastEncounter {
  id: string;
  date: string;
  clinician: string;
  type: string;
  chiefComplaint: string;
  diagnosis: string;
  notesSummary: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'M' | 'F' | 'OTHER';
  phone: string;
  address: string;
  bloodType: string;
  allergies: Allergy[];
  conditions: string[];
  medications: Medication[];
  recentVitals: VitalSign[];
  pastEncounters: PastEncounter[];
  outstandingInvestigations: string[];
}

export interface Encounter {
  id: string;
  patientId: string;
  date: string;
  clinician: string;
  encounterType: string;
  audioDurationSeconds?: number;
  transcript: {
    speaker: 'Clinician' | 'Patient' | 'Caregiver';
    text: string;
    timestamp: string;
  }[];
  rawTranscriptText: string;
  clinicalNote: SoapNote;
  actions: ActionItem[];
  documents: GeneratedDocument[];
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  auditTrail: AuditEntry[];
}
