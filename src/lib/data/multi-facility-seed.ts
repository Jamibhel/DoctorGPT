/**
 * BJI MediSupport - Multi-Facility Relational Seed Data
 * Provides isolated seed datasets across 3 distinct healthcare facility tenants:
 * 1. BJI St. Jude Memorial Hospital (HOSPITAL)
 * 2. Apex Valley Medical Center (MEDICAL_CENTER)
 * 3. Metro Health Diagnostic Center (DIAGNOSTIC_CENTER)
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
  ClinicalEvent 
} from "@/types/hospital";

// ==========================================
// 1. HEALTHCARE FACILITIES (TENANTS)
// ==========================================

export const SEED_FACILITIES: HealthcareFacility[] = [
  {
    id: "fac-st-jude",
    name: "BJI St. Jude Memorial Hospital",
    code: "SJM",
    type: "HOSPITAL",
    status: "ACTIVE",
    mrnPrefix: "BJI-SJM",
    address: "742 Evergreen Terrace, Metro Health District, NY 10021",
    phone: "+1 (212) 555-0199",
    email: "admissions@bjistjude.org",
    timezone: "America/New_York",
    totalBedCapacity: 48,
    activeCensus: 32,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "fac-apex-valley",
    name: "Apex Valley Medical Center",
    code: "APX",
    type: "MEDICAL_CENTER",
    status: "ACTIVE",
    mrnPrefix: "BJI-APX",
    address: "1200 Highland Valley Road, Suite 400, Boulder, CO 80302",
    phone: "+1 (303) 555-4820",
    email: "reception@apexvalleymed.org",
    timezone: "America/Denver",
    totalBedCapacity: 16,
    activeCensus: 8,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "fac-metro-diag",
    name: "Metro Health Diagnostic Center",
    code: "MDC",
    type: "DIAGNOSTIC_CENTER",
    status: "ACTIVE",
    mrnPrefix: "BJI-MDC",
    address: "450 Science & Health Parkway, Chicago, IL 60611",
    phone: "+1 (312) 555-8833",
    email: "imaging@metrohealthdiag.org",
    timezone: "America/Chicago",
    totalBedCapacity: 4,
    activeCensus: 2,
    createdAt: "2026-05-10T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

// ==========================================
// 2. FACILITY DEPARTMENTS
// ==========================================

export const SEED_MULTI_DEPARTMENTS: HospitalDepartment[] = [
  // --- BJI St. Jude Memorial Hospital (HOSPITAL) ---
  {
    id: "DEPT-SJM-MEDSURG",
    facilityId: "fac-st-jude",
    name: "3rd Floor Medical-Surgical Ward",
    type: "MED_SURG",
    floor: 3,
    building: "Main Pavilion",
    totalBeds: 12,
    occupiedBeds: 8,
    leadPhysicianId: "Practitioner/dr-thorne",
    nurseManagerId: "Practitioner/nurse-vance",
  },
  {
    id: "DEPT-SJM-ICU",
    facilityId: "fac-st-jude",
    name: "Intensive Care Unit (ICU)",
    type: "INTENSIVE_CARE",
    floor: 4,
    building: "Critical Care Tower",
    totalBeds: 6,
    occupiedBeds: 4,
    leadPhysicianId: "Practitioner/dr-thorne",
    nurseManagerId: "Practitioner/nurse-vance",
  },
  {
    id: "DEPT-SJM-ED",
    facilityId: "fac-st-jude",
    name: "Emergency Department & Trauma",
    type: "EMERGENCY",
    floor: 1,
    building: "Trauma Center",
    totalBeds: 16,
    occupiedBeds: 11,
    leadPhysicianId: "Practitioner/dr-thorne",
    nurseManagerId: "Practitioner/nurse-vance",
  },
  {
    id: "DEPT-SJM-PHARM",
    facilityId: "fac-st-jude",
    name: "Inpatient Central Pharmacy",
    type: "PHARMACY",
    floor: 1,
    building: "Clinical Services Wing",
    totalBeds: 0,
    occupiedBeds: 0,
    leadPhysicianId: "Practitioner/pharm-chen",
    nurseManagerId: "Practitioner/pharm-chen",
  },
  {
    id: "DEPT-SJM-RAD",
    facilityId: "fac-st-jude",
    name: "Diagnostic Radiology & Imaging",
    type: "RADIOLOGY",
    floor: 2,
    building: "Diagnostics Wing",
    totalBeds: 0,
    occupiedBeds: 0,
    leadPhysicianId: "Practitioner/rad-watson",
    nurseManagerId: "Practitioner/rad-watson",
  },

  // --- Apex Valley Medical Center (MEDICAL_CENTER) ---
  {
    id: "DEPT-APX-AMBULATORY",
    facilityId: "fac-apex-valley",
    name: "Ambulatory Short-Stay Suite",
    type: "MED_SURG",
    floor: 2,
    building: "West Medical Wing",
    totalBeds: 8,
    occupiedBeds: 4,
    leadPhysicianId: "Practitioner/dr-hayes",
    nurseManagerId: "Practitioner/nurse-song",
  },
  {
    id: "DEPT-APX-URGENT",
    facilityId: "fac-apex-valley",
    name: "Urgent Care & Rapid Triage",
    type: "EMERGENCY",
    floor: 1,
    building: "Pavilion A",
    totalBeds: 8,
    occupiedBeds: 4,
    leadPhysicianId: "Practitioner/dr-hayes",
    nurseManagerId: "Practitioner/nurse-song",
  },

  // --- Metro Health Diagnostic Center (DIAGNOSTIC_CENTER) ---
  {
    id: "DEPT-MDC-IMAGING",
    facilityId: "fac-metro-diag",
    name: "High-Field MRI / CT Imaging Suite",
    type: "RADIOLOGY",
    floor: 1,
    building: "Imaging Complex",
    totalBeds: 2,
    occupiedBeds: 1,
    leadPhysicianId: "Practitioner/dr-drake",
    nurseManagerId: "Practitioner/tech-cole",
  },
  {
    id: "DEPT-MDC-PATHOLOGY",
    facilityId: "fac-metro-diag",
    name: "Automated Molecular Pathology Lab",
    type: "NEPHROLOGY",
    floor: 2,
    building: "Diagnostics Complex",
    totalBeds: 2,
    occupiedBeds: 1,
    leadPhysicianId: "Practitioner/dr-drake",
    nurseManagerId: "Practitioner/tech-cole",
  },
];

// ==========================================
// 3. MULTI-TENANT STAFF MEMBERS
// ==========================================

export const SEED_MULTI_STAFF: StaffMember[] = [
  // St. Jude Staff
  {
    id: "Practitioner/dr-thorne",
    facilityId: "fac-st-jude",
    name: "Dr. Alexander Thorne, MD",
    role: "PHYSICIAN",
    departmentId: "DEPT-SJM-MEDSURG",
    npi: "1849204918",
    licenseNumber: "NY-MD-849201",
    pagerNumber: "Pager #4102",
    onCall: true,
    activeShift: "DAY",
  },
  {
    id: "Practitioner/nurse-vance",
    facilityId: "fac-st-jude",
    name: "Nurse Marcus Vance, RN",
    role: "NURSE",
    departmentId: "DEPT-SJM-MEDSURG",
    licenseNumber: "NY-RN-920412",
    pagerNumber: "Vocera #302",
    onCall: true,
    activeShift: "DAY",
  },
  {
    id: "Practitioner/pharm-chen",
    facilityId: "fac-st-jude",
    name: "Dr. Sarah Chen, PharmD",
    role: "PHARMACIST",
    departmentId: "DEPT-SJM-PHARM",
    licenseNumber: "NY-RPH-301928",
    pagerNumber: "Ext #7401",
    onCall: false,
    activeShift: "DAY",
  },
  {
    id: "Practitioner/rad-watson",
    facilityId: "fac-st-jude",
    name: "Dr. Emily Watson, MD",
    role: "RADIOLOGIST",
    departmentId: "DEPT-SJM-RAD",
    licenseNumber: "NY-MD-772910",
    pagerNumber: "Ext #8200",
    onCall: true,
    activeShift: "DAY",
  },

  // Apex Valley Staff
  {
    id: "Practitioner/dr-hayes",
    facilityId: "fac-apex-valley",
    name: "Dr. Julian Hayes, MD",
    role: "PHYSICIAN",
    departmentId: "DEPT-APX-AMBULATORY",
    npi: "1938201948",
    licenseNumber: "CO-MD-39201",
    pagerNumber: "Ext #201",
    onCall: true,
    activeShift: "DAY",
  },
  {
    id: "Practitioner/nurse-song",
    facilityId: "fac-apex-valley",
    name: "Nurse Brenda Song, RN",
    role: "NURSE",
    departmentId: "DEPT-APX-AMBULATORY",
    licenseNumber: "CO-RN-48201",
    pagerNumber: "Ext #204",
    onCall: true,
    activeShift: "DAY",
  },

  // Metro Diagnostic Staff
  {
    id: "Practitioner/dr-drake",
    facilityId: "fac-metro-diag",
    name: "Dr. Nathan Drake, MD",
    role: "RADIOLOGIST",
    departmentId: "DEPT-MDC-IMAGING",
    licenseNumber: "IL-MD-99120",
    pagerNumber: "Ext #900",
    onCall: true,
    activeShift: "DAY",
  },
  {
    id: "Practitioner/tech-cole",
    facilityId: "fac-metro-diag",
    name: "Amanda Cole, MLS",
    role: "NURSE",
    departmentId: "DEPT-MDC-PATHOLOGY",
    licenseNumber: "IL-MLS-49102",
    pagerNumber: "Ext #905",
    onCall: false,
    activeShift: "DAY",
  },
];

// ==========================================
// 4. MULTI-TENANT PATIENTS
// ==========================================

export const SEED_MULTI_PATIENTS: Patient[] = [
  // St. Jude Patients
  {
    id: "Patient/pat-sjm-1001",
    facilityId: "fac-st-jude",
    mrn: "BJI-SJM-001001",
    firstName: "Eleanor",
    lastName: "Vance",
    dateOfBirth: "1958-04-12",
    sex: "F",
    bloodType: "A+",
    phone: "+1 (212) 555-8392",
    address: "424 W 57th St, Apt 4B, New York, NY 10019",
    emergencyContact: {
      name: "Thomas Vance",
      relationship: "Spouse",
      phone: "+1 (212) 555-8393",
    },
    allergies: [
      {
        id: "Allergy/all-sjm-01",
        allergen: "Amoxicillin / Penicillin Class",
        substanceCode: "RxNorm:70618",
        category: "MEDICATION",
        reaction: "Anaphylaxis, severe broncho-constriction, urticaria",
        severity: "SEVERE",
        verificationStatus: "CONFIRMED",
        recordedAt: "2024-03-12T10:00:00Z",
        recordedBy: "Practitioner/dr-thorne",
        version: 1,
      },
    ],
    activeConditions: [
      "Type 2 Diabetes Mellitus with peripheral neuropathy",
      "Stage 3b Chronic Kidney Disease (baseline eGFR 38)",
      "Atrial Fibrillation (CHADS2-VASc: 4)",
      "Severe Community-Acquired Right Lower Lobe Pneumonia",
    ],
    primaryLanguage: "English",
    createdAt: "2026-02-10T08:00:00Z",
    updatedAt: "2026-09-28T14:00:00Z",
  },
  {
    id: "Patient/pat-sjm-1002",
    facilityId: "fac-st-jude",
    mrn: "BJI-SJM-001002",
    firstName: "James",
    lastName: "Montgomery",
    dateOfBirth: "1972-11-23",
    sex: "M",
    bloodType: "O+",
    phone: "+1 (212) 555-4019",
    address: "182 Columbus Ave, Apt 12, New York, NY 10023",
    emergencyContact: {
      name: "Sarah Montgomery",
      relationship: "Daughter",
      phone: "+1 (212) 555-4020",
    },
    allergies: [],
    activeConditions: [
      "Congestive Heart Failure (HFrEF, EF 32%)",
      "Essential Hypertension",
    ],
    primaryLanguage: "English",
    createdAt: "2026-03-01T09:00:00Z",
    updatedAt: "2026-09-28T10:00:00Z",
  },

  // Apex Valley Patients (Completely isolated tenant)
  {
    id: "Patient/pat-apx-2001",
    facilityId: "fac-apex-valley",
    mrn: "BJI-APX-002001",
    firstName: "Robert",
    lastName: "Sterling",
    dateOfBirth: "1984-06-15",
    sex: "M",
    bloodType: "B+",
    phone: "+1 (303) 555-9182",
    address: "940 Alpine Way, Boulder, CO 80304",
    emergencyContact: {
      name: "Karen Sterling",
      relationship: "Wife",
      phone: "+1 (303) 555-9183",
    },
    allergies: [
      {
        id: "Allergy/all-apx-01",
        allergen: "Sulfa Antibiotics",
        category: "MEDICATION",
        reaction: "Maculopapular rash, facial edema",
        severity: "MODERATE",
        verificationStatus: "CONFIRMED",
        recordedAt: "2025-08-10T11:00:00Z",
        recordedBy: "Practitioner/dr-hayes",
        version: 1,
      },
    ],
    activeConditions: [
      "Acute Lumbar Disc Herniation L4-L5",
      "Post-Surgical Arthroscopy Monitoring",
    ],
    primaryLanguage: "English",
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-09-30T16:00:00Z",
  },

  // Metro Diagnostic Patients (Completely isolated tenant)
  {
    id: "Patient/pat-mdc-3001",
    facilityId: "fac-metro-diag",
    mrn: "BJI-MDC-003001",
    firstName: "David",
    lastName: "Kim",
    dateOfBirth: "1991-09-08",
    sex: "M",
    bloodType: "AB+",
    phone: "+1 (312) 555-7711",
    address: "320 N Michigan Ave, Chicago, IL 60601",
    emergencyContact: {
      name: "Grace Kim",
      relationship: "Sister",
      phone: "+1 (312) 555-7712",
    },
    allergies: [],
    activeConditions: [
      "Rule out acute right internal carotid stenosis",
      "Recurrent atypical migraine with visual aura",
    ],
    primaryLanguage: "Korean",
    createdAt: "2026-07-15T14:00:00Z",
    updatedAt: "2026-09-29T11:00:00Z",
  },
];

// ==========================================
// 5. MULTI-TENANT BEDS & ENCOUNTERS
// ==========================================

export const SEED_MULTI_BEDS: HospitalBed[] = [
  // St. Jude Beds
  {
    id: "Bed/sjm-304-B",
    facilityId: "fac-st-jude",
    wardId: "DEPT-SJM-MEDSURG",
    roomNumber: "304",
    bedNumber: "B",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/sjm-enc-001",
    currentPatientId: "Patient/pat-sjm-1001",
    isIcuEquipped: false,
    telemetryEnabled: true,
  },
  {
    id: "Bed/sjm-304-A",
    facilityId: "fac-st-jude",
    wardId: "DEPT-SJM-MEDSURG",
    roomNumber: "304",
    bedNumber: "A",
    status: "AVAILABLE",
    isIcuEquipped: false,
    telemetryEnabled: true,
  },
  {
    id: "Bed/sjm-305-A",
    facilityId: "fac-st-jude",
    wardId: "DEPT-SJM-MEDSURG",
    roomNumber: "305",
    bedNumber: "A",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/sjm-enc-002",
    currentPatientId: "Patient/pat-sjm-1002",
    isIcuEquipped: false,
    telemetryEnabled: false,
  },
  {
    id: "Bed/sjm-305-B",
    facilityId: "fac-st-jude",
    wardId: "DEPT-SJM-MEDSURG",
    roomNumber: "305",
    bedNumber: "B",
    status: "CLEANING",
    cleaningStartedAt: "2026-09-30T13:45:00Z",
    isIcuEquipped: false,
    telemetryEnabled: false,
  },

  // Apex Valley Beds
  {
    id: "Bed/apx-201-A",
    facilityId: "fac-apex-valley",
    wardId: "DEPT-APX-AMBULATORY",
    roomNumber: "201",
    bedNumber: "A",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/apx-enc-001",
    currentPatientId: "Patient/pat-apx-2001",
    isIcuEquipped: false,
    telemetryEnabled: true,
  },
  {
    id: "Bed/apx-201-B",
    facilityId: "fac-apex-valley",
    wardId: "DEPT-APX-AMBULATORY",
    roomNumber: "201",
    bedNumber: "B",
    status: "AVAILABLE",
    isIcuEquipped: false,
    telemetryEnabled: false,
  },

  // Metro Diagnostic Recovery Beds
  {
    id: "Bed/mdc-rec-1",
    facilityId: "fac-metro-diag",
    wardId: "DEPT-MDC-IMAGING",
    roomNumber: "REC-1",
    bedNumber: "1",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/mdc-enc-001",
    currentPatientId: "Patient/pat-mdc-3001",
    isIcuEquipped: false,
    telemetryEnabled: true,
  },
];

export const SEED_MULTI_ENCOUNTERS: Encounter[] = [
  // St. Jude Encounter
  {
    id: "Encounter/sjm-enc-001",
    facilityId: "fac-st-jude",
    patientId: "Patient/pat-sjm-1001",
    encounterClass: "INPATIENT",
    status: "ACTIVE",
    departmentId: "DEPT-SJM-MEDSURG",
    admittedAt: "2026-09-28T09:14:00Z",
    attendingPhysicianId: "Practitioner/dr-thorne",
    admittingDiagnosis: "Severe Community-Acquired RLL Pneumonia with Sepsis Risk",
    chiefComplaint: "Severe productive cough with pleuritic chest pain, dyspnea on exertion, fever 39.1C",
    triageLevel: 2,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/sjm-304-B",
    careTeamIds: ["Practitioner/dr-thorne", "Practitioner/nurse-vance"],
  },
  {
    id: "Encounter/sjm-enc-002",
    facilityId: "fac-st-jude",
    patientId: "Patient/pat-sjm-1002",
    encounterClass: "INPATIENT",
    status: "ACTIVE",
    departmentId: "DEPT-SJM-MEDSURG",
    admittedAt: "2026-09-29T11:00:00Z",
    attendingPhysicianId: "Practitioner/dr-thorne",
    admittingDiagnosis: "Acute Decompensated Congestive Heart Failure",
    chiefComplaint: "Bilateral lower extremity pitting edema, orthopnea, paroxysmal nocturnal dyspnea",
    triageLevel: 3,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/sjm-305-A",
    careTeamIds: ["Practitioner/dr-thorne"],
  },

  // Apex Valley Encounter
  {
    id: "Encounter/apx-enc-001",
    facilityId: "fac-apex-valley",
    patientId: "Patient/pat-apx-2001",
    encounterClass: "AMBULATORY",
    status: "ACTIVE",
    departmentId: "DEPT-APX-AMBULATORY",
    admittedAt: "2026-09-30T08:00:00Z",
    attendingPhysicianId: "Practitioner/dr-hayes",
    admittingDiagnosis: "Post-Operative Lumbar Radiculopathy Management",
    chiefComplaint: "Recovery check after outpatient surgical intervention",
    triageLevel: 4,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/apx-201-A",
    careTeamIds: ["Practitioner/dr-hayes", "Practitioner/nurse-song"],
  },

  // Metro Diagnostic Encounter
  {
    id: "Encounter/mdc-enc-001",
    facilityId: "fac-metro-diag",
    patientId: "Patient/pat-mdc-3001",
    encounterClass: "OUTPATIENT",
    status: "ACTIVE",
    departmentId: "DEPT-MDC-IMAGING",
    admittedAt: "2026-09-30T10:30:00Z",
    attendingPhysicianId: "Practitioner/dr-drake",
    admittingDiagnosis: "Diagnostic Workup: Cerebral MRI/MRA with IV Contrast",
    chiefComplaint: "Scheduled brain MRI for evaluation of neurological symptoms",
    triageLevel: 5,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/mdc-rec-1",
    careTeamIds: ["Practitioner/dr-drake", "Practitioner/tech-cole"],
  },
];
