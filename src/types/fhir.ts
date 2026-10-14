/**
 * HL7 FHIR Release 4 (R4) Type Definitions for BJI MediSupport
 * Standardized schema definitions for clinical resources, bundles, and metadata.
 */

export type FhirResourceType = 
  | 'Patient' 
  | 'Encounter' 
  | 'Observation' 
  | 'Condition' 
  | 'MedicationRequest' 
  | 'DiagnosticReport' 
  | 'Bundle' 
  | 'OperationOutcome';

export interface FhirCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding: FhirCoding[];
  text?: string;
}

export interface FhirIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary';
  type?: FhirCodeableConcept;
  system: string;
  value: string;
}

export interface FhirHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'maiden';
  text?: string;
  family: string;
  given: string[];
  prefix?: string[];
}

export interface FhirTelecom {
  system: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  text?: string;
}

export interface FhirReference {
  reference: string; // e.g. "Patient/pat-1001"
  display?: string;
  type?: string;
}

export interface FhirQuantity {
  value: number;
  unit: string;
  system?: string;
  code?: string;
  comparator?: '<' | '<=' | '>=' | '>';
}

export interface FhirPeriod {
  start?: string;
  end?: string;
}

// 1. FHIR Patient
export interface FhirPatient {
  resourceType: 'Patient';
  id: string;
  identifier: FhirIdentifier[];
  active: boolean;
  name: FhirHumanName[];
  telecom?: FhirTelecom[];
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string; // YYYY-MM-DD
  address?: FhirAddress[];
  managingOrganization?: FhirReference;
}

// 2. FHIR Encounter
export interface FhirEncounter {
  resourceType: 'Encounter';
  id: string;
  identifier?: FhirIdentifier[];
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: FhirCoding; // e.g. code: "IMP" (inpatient encounter), "EMER", "AMB"
  type?: FhirCodeableConcept[];
  subject: FhirReference;
  participant?: Array<{
    type?: FhirCodeableConcept[];
    individual: FhirReference;
  }>;
  period: FhirPeriod;
  reasonCode?: FhirCodeableConcept[];
  hospitalization?: {
    preAdmissionIdentifier?: FhirIdentifier;
    admitSource?: FhirCodeableConcept;
    dischargeDisposition?: FhirCodeableConcept;
  };
  serviceProvider?: FhirReference;
}

// 3. FHIR Observation
export interface FhirObservation {
  resourceType: 'Observation';
  id: string;
  identifier?: FhirIdentifier[];
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected';
  category: FhirCodeableConcept[]; // vital-signs or laboratory
  code: FhirCodeableConcept; // LOINC code
  subject: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime: string;
  performer?: FhirReference[];
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueCodeableConcept?: FhirCodeableConcept;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
  }>;
}

// 4. FHIR Condition
export interface FhirCondition {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: FhirCodeableConcept; // active, recurrence, remission, resolved
  verificationStatus: FhirCodeableConcept; // confirmed, unconfirmed, provisional, differential
  category?: FhirCodeableConcept[];
  severity?: FhirCodeableConcept;
  code: FhirCodeableConcept; // ICD-10 or SNOMED
  subject: FhirReference;
  encounter?: FhirReference;
  onsetDateTime?: string;
  recordedDate?: string;
}

// 5. FHIR MedicationRequest
export interface FhirMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  identifier?: FhirIdentifier[];
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft';
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  medicationCodeableConcept: FhirCodeableConcept; // RxNorm
  subject: FhirReference;
  encounter?: FhirReference;
  authoredOn: string;
  requester?: FhirReference;
  dosageInstruction?: Array<{
    text?: string;
    route?: FhirCodeableConcept;
    doseAndRate?: Array<{
      doseQuantity?: FhirQuantity;
    }>;
  }>;
}

// 6. FHIR DiagnosticReport
export interface FhirDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  identifier?: FhirIdentifier[];
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected';
  category: FhirCodeableConcept[]; // LAB or RAD
  code: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime: string;
  issued: string;
  performer?: FhirReference[];
  result?: FhirReference[];
  conclusion?: string;
}

// 7. FHIR Bundle
export type FhirBundleType = 
  | 'document' 
  | 'message' 
  | 'transaction' 
  | 'transaction-response' 
  | 'batch' 
  | 'batch-response' 
  | 'history' 
  | 'searchset' 
  | 'collection';

export interface FhirBundleEntry {
  fullUrl?: string;
  resource: 
    | FhirPatient 
    | FhirEncounter 
    | FhirObservation 
    | FhirCondition 
    | FhirMedicationRequest 
    | FhirDiagnosticReport;
  request?: {
    method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
  };
  response?: {
    status: string;
    location?: string;
  };
}

export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: FhirBundleType;
  timestamp: string;
  total?: number;
  entry: FhirBundleEntry[];
}
