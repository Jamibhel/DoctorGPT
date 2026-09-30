/**
 * HospitalOS Relational Synthetic Seed Data
 * Provides relational records for Patients, Encounters, Beds, Vitals, Labs, Imaging, Orders, Staff, and Events.
 */

import { 
  CPOEOrder, 
  ClinicalEvent, 
  ClinicalNote, 
  DiagnosticLabResult, 
  Encounter, 
  HospitalBed, 
  HospitalDepartment, 
  MedicationAdministration, 
  Patient, 
  RadiologyStudy, 
  StaffMember, 
  VitalSignObservation 
} from "@/types/hospital";
import { calculateNEWS2 } from "../services/news2";

// ==========================================
// 1. DEPARTMENTS & WARDS
// ==========================================

export const SEED_DEPARTMENTS: HospitalDepartment[] = [
  {
    id: "DEPT-MED-SURG",
    name: "3rd Floor Medical-Surgical Ward",
    type: "MED_SURG",
    floor: 3,
    building: "Main Pavilion",
    totalBeds: 12,
    occupiedBeds: 8,
    leadPhysicianId: "Practitioner/dr-thorne",
    nurseManagerId: "Practitioner/nurse-daniels"
  },
  {
    id: "DEPT-ICU",
    name: "Intensive Care Unit (ICU)",
    type: "INTENSIVE_CARE",
    floor: 4,
    building: "Critical Care Tower",
    totalBeds: 6,
    occupiedBeds: 4,
    leadPhysicianId: "Practitioner/dr-lin",
    nurseManagerId: "Practitioner/nurse-vaughn"
  },
  {
    id: "DEPT-EMERGENCY",
    name: "Emergency Department & Trauma",
    type: "EMERGENCY",
    floor: 1,
    building: "Trauma Center",
    totalBeds: 16,
    occupiedBeds: 11,
    leadPhysicianId: "Practitioner/dr-kim",
    nurseManagerId: "Practitioner/nurse-hayes"
  },
  {
    id: "DEPT-ENDOCRINE",
    name: "Endocrine & Metabolic Outpatient Clinic",
    type: "ENDOCRINOLOGY",
    floor: 2,
    building: "Ambulatory Center",
    totalBeds: 4,
    occupiedBeds: 2,
    leadPhysicianId: "Practitioner/dr-thorne",
    nurseManagerId: "Practitioner/nurse-daniels"
  }
];

// ==========================================
// 2. STAFF ROSTER
// ==========================================

export const SEED_STAFF: StaffMember[] = [
  {
    id: "Practitioner/dr-thorne",
    name: "Dr. Alexander Thorne, MD, FACE",
    role: "PHYSICIAN",
    departmentId: "DEPT-MED-SURG",
    npi: "1982736402",
    licenseNumber: "MA-MED-49102",
    pagerNumber: "4021",
    onCall: true,
    activeShift: "DAY"
  },
  {
    id: "Practitioner/nurse-daniels",
    name: "Sarah Daniels, RN, BSN",
    role: "NURSE",
    departmentId: "DEPT-MED-SURG",
    licenseNumber: "RN-892014",
    pagerNumber: "5102",
    onCall: false,
    activeShift: "DAY"
  },
  {
    id: "Practitioner/pharm-chen",
    name: "Dr. Marcus Chen, PharmD, BCPS",
    role: "PHARMACIST",
    departmentId: "DEPT-MED-SURG",
    licenseNumber: "RPH-39102",
    pagerNumber: "3301",
    onCall: true,
    activeShift: "DAY"
  },
  {
    id: "Practitioner/rad-vasquez",
    name: "Dr. Elena Vasquez, MD",
    role: "RADIOLOGIST",
    departmentId: "DEPT-EMERGENCY",
    licenseNumber: "MA-RAD-77192",
    pagerNumber: "8820",
    onCall: true,
    activeShift: "DAY"
  },
  {
    id: "Practitioner/admin-sterling",
    name: "Victoria Sterling, MHA",
    role: "HOSPITAL_ADMINISTRATOR",
    departmentId: "DEPT-MED-SURG",
    pagerNumber: "1001",
    onCall: false,
    activeShift: "DAY"
  }
];

// ==========================================
// 3. PATIENTS
// ==========================================

export const SEED_PATIENTS: Patient[] = [
  {
    id: "Patient/pat-1001",
    mrn: "SYN-849201",
    firstName: "Eleanor",
    lastName: "Vance",
    dateOfBirth: "1968-04-14",
    sex: "F",
    bloodType: "A+",
    phone: "+1 (555) 382-9102",
    address: "42 Elmwood Ave, Boston, MA 02138",
    emergencyContact: {
      name: "Robert Vance",
      relationship: "Spouse",
      phone: "+1 (555) 382-9109"
    },
    allergies: [
      {
        id: "Allergy/all-01",
        allergen: "Penicillin",
        category: "MEDICATION",
        reaction: "Urticaria, facial angioedema, and mild bronchospasm",
        severity: "SEVERE",
        verificationStatus: "CONFIRMED",
        recordedAt: "2024-01-15T10:00:00Z",
        recordedBy: "Practitioner/dr-thorne",
        version: 1
      },
      {
        id: "Allergy/all-02",
        allergen: "Sulfa Drugs",
        category: "MEDICATION",
        reaction: "Maculopapular rash",
        severity: "MODERATE",
        verificationStatus: "CONFIRMED",
        recordedAt: "2023-05-12T14:30:00Z",
        recordedBy: "Practitioner/dr-thorne",
        version: 1
      }
    ],
    activeConditions: [
      "Type 2 Diabetes Mellitus with Severe Hyperglycemia (E11.65)",
      "Diabetic Peripheral Neuropathy with Plantar Ulcer Risk (E11.42)",
      "Essential Primary Hypertension (I10)",
      "Stage 3a Chronic Kidney Disease - eGFR 54 (N18.31)"
    ],
    primaryLanguage: "English",
    createdAt: "2020-09-05T08:00:00Z",
    updatedAt: "2026-09-30T14:20:00Z"
  },
  {
    id: "Patient/pat-1002",
    mrn: "SYN-194038",
    firstName: "James",
    lastName: "Montgomery",
    dateOfBirth: "1954-11-29",
    sex: "M",
    bloodType: "O+",
    phone: "+1 (555) 714-8821",
    address: "108 Oak Crest Dr, Brookline, MA 02445",
    emergencyContact: {
      name: "Clara Montgomery",
      relationship: "Daughter",
      phone: "+1 (555) 714-8899"
    },
    allergies: [
      {
        id: "Allergy/all-03",
        allergen: "Codeine",
        category: "MEDICATION",
        reaction: "Severe nausea and mental confusion",
        severity: "MODERATE",
        verificationStatus: "CONFIRMED",
        recordedAt: "2022-04-10T11:00:00Z",
        recordedBy: "Practitioner/dr-lin",
        version: 1
      }
    ],
    activeConditions: [
      "Acute Exacerbation of COPD - GOLD Stage II (J44.1)",
      "Coronary Artery Disease s/p LAD Stent (I25.10)",
      "Benign Prostatic Hyperplasia (N40.0)"
    ],
    primaryLanguage: "English",
    createdAt: "2021-03-10T09:00:00Z",
    updatedAt: "2026-09-30T16:00:00Z"
  },
  {
    id: "Patient/pat-1003",
    mrn: "SYN-662914",
    firstName: "Amara",
    lastName: "Okonkwo",
    dateOfBirth: "1992-08-19",
    sex: "F",
    bloodType: "B+",
    phone: "+1 (555) 902-3341",
    address: "71 Beacon St, Cambridge, MA 02139",
    emergencyContact: {
      name: "Emeka Okonkwo",
      relationship: "Brother",
      phone: "+1 (555) 902-3349"
    },
    allergies: [
      {
        id: "Allergy/all-04",
        allergen: "Latex",
        category: "ENVIRONMENTAL",
        reaction: "Contact urticaria and pruritus",
        severity: "MILD",
        verificationStatus: "CONFIRMED",
        recordedAt: "2025-01-10T09:15:00Z",
        recordedBy: "Practitioner/dr-kim",
        version: 1
      }
    ],
    activeConditions: [
      "Intractable Migraine without Aura (G43.019)",
      "Microcytic Iron Deficiency Anemia (D50.9)",
      "Generalized Anxiety Disorder (F41.1)"
    ],
    primaryLanguage: "English",
    createdAt: "2024-02-15T11:00:00Z",
    updatedAt: "2026-09-30T10:00:00Z"
  }
];

// ==========================================
// 4. BEDS
// ==========================================

export const SEED_BEDS: HospitalBed[] = [
  // Med-Surg Ward (Floor 3)
  {
    id: "Bed/301-A",
    wardId: "DEPT-MED-SURG",
    roomNumber: "301",
    bedNumber: "301-A",
    status: "AVAILABLE",
    isIcuEquipped: false,
    telemetryEnabled: true
  },
  {
    id: "Bed/301-B",
    wardId: "DEPT-MED-SURG",
    roomNumber: "301",
    bedNumber: "301-B",
    status: "CLEANING",
    cleaningStartedAt: "2026-09-30T19:45:00Z",
    isIcuEquipped: false,
    telemetryEnabled: true
  },
  {
    id: "Bed/304-A",
    wardId: "DEPT-MED-SURG",
    roomNumber: "304",
    bedNumber: "304-A",
    status: "AVAILABLE",
    isIcuEquipped: false,
    telemetryEnabled: true
  },
  {
    id: "Bed/304-B",
    wardId: "DEPT-MED-SURG",
    roomNumber: "304",
    bedNumber: "304-B",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/enc-1001",
    currentPatientId: "Patient/pat-1001",
    isIcuEquipped: false,
    telemetryEnabled: true
  },
  // ICU (Floor 4)
  {
    id: "Bed/ICU-01",
    wardId: "DEPT-ICU",
    roomNumber: "ICU-1",
    bedNumber: "ICU-01",
    status: "AVAILABLE",
    isIcuEquipped: true,
    telemetryEnabled: true
  },
  {
    id: "Bed/ICU-02",
    wardId: "DEPT-ICU",
    roomNumber: "ICU-2",
    bedNumber: "ICU-02",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/enc-1002",
    currentPatientId: "Patient/pat-1002",
    isIcuEquipped: true,
    telemetryEnabled: true
  },
  // ED Bays
  {
    id: "Bed/ED-BAY-01",
    wardId: "DEPT-EMERGENCY",
    roomNumber: "BAY-1",
    bedNumber: "ED-01",
    status: "OCCUPIED",
    currentEncounterId: "Encounter/enc-1003",
    currentPatientId: "Patient/pat-1003",
    isIcuEquipped: false,
    telemetryEnabled: true
  },
  {
    id: "Bed/ED-BAY-02",
    wardId: "DEPT-EMERGENCY",
    roomNumber: "BAY-2",
    bedNumber: "ED-02",
    status: "AVAILABLE",
    isIcuEquipped: false,
    telemetryEnabled: true
  }
];

// ==========================================
// 5. ENCOUNTERS
// ==========================================

export const SEED_ENCOUNTERS: Encounter[] = [
  {
    id: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    encounterClass: "INPATIENT",
    status: "ACTIVE",
    departmentId: "DEPT-MED-SURG",
    admittedAt: "2026-09-29T14:30:00Z",
    attendingPhysicianId: "Practitioner/dr-thorne",
    admittingDiagnosis: "Hyperglycemic crisis with neuropathic foot complication",
    chiefComplaint: "Severe burning numbness in bilateral feet and home fasting blood sugar > 220 mg/dL",
    triageLevel: 3,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/304-B",
    careTeamIds: ["Practitioner/dr-thorne", "Practitioner/nurse-daniels", "Practitioner/pharm-chen"]
  },
  {
    id: "Encounter/enc-1002",
    patientId: "Patient/pat-1002",
    encounterClass: "INPATIENT",
    status: "ACTIVE",
    departmentId: "DEPT-ICU",
    admittedAt: "2026-09-30T02:15:00Z",
    attendingPhysicianId: "Practitioner/dr-lin",
    admittingDiagnosis: "Severe COPD Exacerbation with Acute Hypercapnic Respiratory Distress",
    chiefComplaint: "Progressive dyspnea, wheezing, and productive cough unimproved by home bronchodilators",
    triageLevel: 2,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/ICU-02",
    careTeamIds: ["Practitioner/dr-lin", "Practitioner/nurse-vaughn"]
  },
  {
    id: "Encounter/enc-1003",
    patientId: "Patient/pat-1003",
    encounterClass: "EMERGENCY",
    status: "ACTIVE",
    departmentId: "DEPT-EMERGENCY",
    admittedAt: "2026-09-30T18:40:00Z",
    attendingPhysicianId: "Practitioner/dr-kim",
    admittingDiagnosis: "Refractory Status Migrainosus & Microcytic Anemia",
    chiefComplaint: "Pulsatile hemicranial headache with photophobia and intractable nausea x 3 days",
    triageLevel: 3,
    codeStatus: "FULL_CODE",
    activeBedId: "Bed/ED-BAY-01",
    careTeamIds: ["Practitioner/dr-kim", "Practitioner/nurse-hayes"]
  }
];

// ==========================================
// 6. VITALS OBSERVATIONS (WITH COMPUTED NEWS2)
// ==========================================

const rawObs1 = {
  respirationRate: 18,
  spO2: 97,
  spO2Scale: 1 as const,
  supplementalOxygen: false,
  temperatureCelsius: 37.1,
  systolicBP: 138,
  diastolicBP: 82,
  heartRate: 78,
  consciousness: 'ALERT' as const,
  bloodGlucoseMgDl: 188
};
const news1 = calculateNEWS2(rawObs1);

const rawObs2 = {
  respirationRate: 26,
  spO2: 89,
  spO2Scale: 2 as const, // Scale 2 for COPD
  supplementalOxygen: true,
  oxygenFlowLMin: 4,
  temperatureCelsius: 38.3,
  systolicBP: 146,
  diastolicBP: 90,
  heartRate: 104,
  consciousness: 'ALERT' as const,
  bloodGlucoseMgDl: 132
};
const news2 = calculateNEWS2(rawObs2);

export const SEED_OBSERVATIONS: VitalSignObservation[] = [
  {
    id: "Observation/obs-1001",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    timestamp: "2026-09-30T18:00:00Z",
    recordedBy: "Practitioner/nurse-daniels",
    ...rawObs1,
    news2Score: news1.totalScore,
    news2RiskTier: news1.riskTier
  },
  {
    id: "Observation/obs-1002",
    encounterId: "Encounter/enc-1002",
    patientId: "Patient/pat-1002",
    timestamp: "2026-09-30T19:30:00Z",
    recordedBy: "Practitioner/nurse-vaughn",
    ...rawObs2,
    news2Score: news2.totalScore,
    news2RiskTier: news2.riskTier
  }
];

// ==========================================
// 7. DIAGNOSTIC LABS
// ==========================================

export const SEED_LABS: DiagnosticLabResult[] = [
  // Eleanor Vance
  {
    id: "Observation/lab-101",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    testName: "Hemoglobin A1c",
    category: "ENDOCRINE",
    value: "8.4",
    numericValue: 8.4,
    unit: "%",
    referenceRange: "< 5.7 %",
    flag: "HIGH",
    collectedAt: "2026-09-30T06:00:00Z",
    resultedAt: "2026-09-30T07:45:00Z",
    performingLab: "Central Inpatient Core Lab"
  },
  {
    id: "Observation/lab-102",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    testName: "Fasting Serum Glucose",
    category: "CHEMISTRY",
    value: "188",
    numericValue: 188,
    unit: "mg/dL",
    referenceRange: "70 - 99 mg/dL",
    flag: "HIGH",
    collectedAt: "2026-09-30T06:00:00Z",
    resultedAt: "2026-09-30T07:15:00Z",
    performingLab: "Central Inpatient Core Lab"
  },
  {
    id: "Observation/lab-103",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    testName: "Estimated GFR (CKD-EPI)",
    category: "CHEMISTRY",
    value: "54",
    numericValue: 54,
    unit: "mL/min/1.73m²",
    referenceRange: "> 60 mL/min",
    flag: "LOW",
    collectedAt: "2026-09-30T06:00:00Z",
    resultedAt: "2026-09-30T07:15:00Z",
    performingLab: "Central Inpatient Core Lab"
  },
  {
    id: "Observation/lab-104",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    testName: "Serum Potassium",
    category: "CHEMISTRY",
    value: "4.7",
    numericValue: 4.7,
    unit: "mEq/L",
    referenceRange: "3.5 - 5.0 mEq/L",
    flag: "NORMAL",
    collectedAt: "2026-09-30T06:00:00Z",
    resultedAt: "2026-09-30T07:15:00Z",
    performingLab: "Central Inpatient Core Lab"
  },
  {
    id: "Observation/lab-105",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    testName: "Urine Albumin-to-Creatinine Ratio (UACR)",
    category: "URINALYSIS",
    value: "142",
    numericValue: 142,
    unit: "mg/g",
    referenceRange: "< 30 mg/g",
    flag: "HIGH",
    collectedAt: "2026-09-30T08:00:00Z",
    resultedAt: "2026-09-30T10:15:00Z",
    performingLab: "Central Inpatient Core Lab"
  }
];

// ==========================================
// 8. CPOE ORDERS
// ==========================================

export const SEED_ORDERS: CPOEOrder[] = [
  {
    id: "MedicationRequest/ord-101",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    orderType: "MEDICATION",
    priority: "ROUTINE",
    status: "DISPENSED",
    orderedAt: "2026-09-29T15:00:00Z",
    orderedBy: "Practitioner/dr-thorne",
    verifiedAt: "2026-09-29T15:20:00Z",
    verifiedBy: "Practitioner/pharm-chen",
    title: "Metformin HCl 1000 mg Oral Tablet",
    description: "1000 mg PO BID with morning and evening meals for Glycemic Control",
    medicationDetails: {
      drugName: "Metformin HCl",
      genericName: "Metformin",
      dosage: "1000 mg",
      route: "ORAL",
      frequency: "Twice daily with meals",
      indication: "Type 2 Diabetes Mellitus",
      scheduleTimes: ["08:00", "20:00"]
    }
  },
  {
    id: "MedicationRequest/ord-102",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    orderType: "MEDICATION",
    priority: "ROUTINE",
    status: "DISPENSED",
    orderedAt: "2026-09-29T15:00:00Z",
    orderedBy: "Practitioner/dr-thorne",
    verifiedAt: "2026-09-29T15:25:00Z",
    verifiedBy: "Practitioner/pharm-chen",
    title: "Gabapentin 300 mg Oral Capsule",
    description: "300 mg PO TID for Diabetic Peripheral Neuropathy",
    medicationDetails: {
      drugName: "Gabapentin",
      genericName: "Gabapentin",
      dosage: "300 mg",
      route: "ORAL",
      frequency: "Three times daily",
      indication: "Diabetic Neuropathy",
      scheduleTimes: ["08:00", "14:00", "20:00"]
    }
  },
  {
    id: "MedicationRequest/ord-103",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    orderType: "MEDICATION",
    priority: "ROUTINE",
    status: "PHARMACY_VERIFIED",
    orderedAt: "2026-09-30T14:00:00Z",
    orderedBy: "Practitioner/dr-thorne",
    verifiedAt: "2026-09-30T14:30:00Z",
    verifiedBy: "Practitioner/pharm-chen",
    title: "Insulin Glargine (Lantus) 14 Units Subcutaneous",
    description: "14 Units SubQ once daily at bedtime (21:00) for basal coverage",
    medicationDetails: {
      drugName: "Insulin Glargine",
      genericName: "Insulin Glargine (rDNA origin)",
      dosage: "14 Units",
      route: "SUBCUTANEOUS",
      frequency: "Once daily at bedtime",
      indication: "Basal Glycemic Optimization",
      scheduleTimes: ["21:00"]
    }
  },
  {
    id: "ServiceRequest/ord-104",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    orderType: "LAB",
    priority: "ROUTINE",
    status: "ORDERED",
    orderedAt: "2026-09-30T16:00:00Z",
    orderedBy: "Practitioner/dr-thorne",
    title: "Comprehensive Metabolic Panel (CMP) Fasting",
    description: "Evaluate electrolytes, renal function (BUN/Creatinine), and hepatic enzymes.",
    labDetails: {
      testCode: "CMP-80053",
      specimen: "BLOOD"
    }
  },
  {
    id: "ServiceRequest/ord-105",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    orderType: "CONSULT",
    priority: "URGENT",
    status: "ORDERED",
    orderedAt: "2026-09-30T16:15:00Z",
    orderedBy: "Practitioner/dr-thorne",
    title: "Inpatient Podiatry / Wound Care Consultation",
    description: "Bilateral diabetic foot sensory deficit with focal right 1st metatarsal callosity and erythema."
  }
];

// ==========================================
// 9. eMAR MEDICATION ADMINISTRATIONS
// ==========================================

export const SEED_ADMINISTRATIONS: MedicationAdministration[] = [
  {
    id: "MedicationAdministration/adm-101",
    orderId: "MedicationRequest/ord-101",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    scheduledTime: "2026-09-30T08:00:00Z",
    administeredTime: "2026-09-30T08:12:00Z",
    status: "GIVEN",
    administeredBy: "Practitioner/nurse-daniels",
    doseGiven: "1000 mg",
    routeGiven: "ORAL"
  },
  {
    id: "MedicationAdministration/adm-102",
    orderId: "MedicationRequest/ord-102",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    scheduledTime: "2026-09-30T08:00:00Z",
    administeredTime: "2026-09-30T08:14:00Z",
    status: "GIVEN",
    administeredBy: "Practitioner/nurse-daniels",
    doseGiven: "300 mg",
    routeGiven: "ORAL"
  },
  {
    id: "MedicationAdministration/adm-103",
    orderId: "MedicationRequest/ord-102",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    scheduledTime: "2026-09-30T14:00:00Z",
    administeredTime: "2026-09-30T14:05:00Z",
    status: "GIVEN",
    administeredBy: "Practitioner/nurse-daniels",
    doseGiven: "300 mg",
    routeGiven: "ORAL"
  },
  {
    id: "MedicationAdministration/adm-104",
    orderId: "MedicationRequest/ord-101",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    scheduledTime: "2026-09-30T20:00:00Z",
    status: "GIVEN",
    administeredTime: "2026-09-30T20:05:00Z",
    administeredBy: "Practitioner/nurse-daniels",
    doseGiven: "1000 mg",
    routeGiven: "ORAL"
  },
  {
    id: "MedicationAdministration/adm-105",
    orderId: "MedicationRequest/ord-103",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    scheduledTime: "2026-09-30T21:00:00Z",
    status: "GIVEN",
    administeredTime: "2026-09-30T21:02:00Z",
    administeredBy: "Practitioner/nurse-daniels",
    doseGiven: "14 Units",
    routeGiven: "SUBCUTANEOUS",
    cosignedBy: "Practitioner/nurse-hayes"
  }
];

// ==========================================
// 10. RADIOLOGY STUDIES
// ==========================================

export const SEED_IMAGING: RadiologyStudy[] = [
  {
    id: "DiagnosticReport/rad-101",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    studyType: "Radiograph Bilateral Feet 3-Views",
    modality: "X_RAY",
    bodySite: "Bilateral Lower Extremity / Plantar Metatarsals",
    studyDate: "2026-09-30T09:30:00Z",
    radiologistId: "Practitioner/rad-vasquez",
    imageThumbnailUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=600&q=80",
    findings: "Soft tissue thickening along the plantar aspect of the right first metatarsal head. No evidence of cortical erosion, periosteal reaction, osteomyelitis, or soft tissue gas.",
    impression: "Plantar hyperkeratosis / soft tissue callosity without underlying osteomyelitis or acute osseous fracture. Recommended clinical correlation and podiatric offloading.",
    aiBoundingBoxes: [
      {
        id: "box-1",
        label: "Focal Plantar Soft Tissue Thickening",
        confidence: 0.94,
        x: 42,
        y: 68,
        width: 18,
        height: 14,
        description: "Increased soft tissue density adjacent to 1st metatarsophalangeal joint without cortical violation."
      }
    ],
    isCriticalAlert: false
  },
  {
    id: "DiagnosticReport/rad-102",
    encounterId: "Encounter/enc-1002",
    patientId: "Patient/pat-1002",
    studyType: "Chest Radiograph 2-Views (PA & Lateral)",
    modality: "X_RAY",
    bodySite: "Thorax / Lungs",
    studyDate: "2026-09-30T03:00:00Z",
    radiologistId: "Practitioner/rad-vasquez",
    imageThumbnailUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80",
    findings: "Hyperinflated lungs with flattened diaphragmatic contours consistent with severe chronic obstructive pulmonary disease. Increased retrosternal airspace. Bronchovascular crowding at right lower lobe without consolidated lobar infiltrate.",
    impression: "Severe pulmonary emphysema with acute bronchitic changes. No pneumothorax or pleural effusion.",
    aiBoundingBoxes: [
      {
        id: "box-2",
        label: "Hyperinflation & Flattened Diaphragm",
        confidence: 0.98,
        x: 20,
        y: 50,
        width: 60,
        height: 35,
        description: "Diaphragmatic depression and increased AP thoracic diameter."
      }
    ],
    isCriticalAlert: false
  }
];

// ==========================================
// 11. CLINICAL NOTES (VERSIONED)
// ==========================================

export const SEED_NOTES: ClinicalNote[] = [
  {
    id: "DocumentReference/note-1001",
    encounterId: "Encounter/enc-1001",
    patientId: "Patient/pat-1001",
    authorId: "Practitioner/dr-thorne",
    noteType: "SOAP_ENCOUNTER",
    status: "SIGNED",
    subjective: {
      text: "Patient Eleanor Vance is a 58-year-old female with long-standing Type 2 Diabetes Mellitus admitted for evaluation of severe persistent numbness, burning sensations, and nocturnal pain in bilateral lower extremities. Reports home blood sugars ranging 180-220 mg/dL despite Metformin 1000mg BID and Glipizide 5mg QD. Denies fever, chest pain, or dyspnea.",
      evidences: [
        {
          id: "ev-01",
          sourceType: "TRANSCRIPT",
          sourceId: "dialogue-turn-1",
          sourceTimestamp: "2026-09-30T14:02:10Z",
          quoteOrValue: "The burning in my toes and soles keeps me awake at night, and my fasting morning sugar is always over 180.",
          confidence: 0.99,
          verifiedByClinician: true
        }
      ]
    },
    objective: {
      text: "Vitals: BP 138/82 mmHg, HR 78 bpm, RR 18 bpm, SpO2 97% on room air, Temp 37.1 °C. Blood Glucose on arrival 188 mg/dL.\nPhysical Exam:\n- Lower Extremities: Bilateral symmetrical sensory loss to 10g Semmes-Weinstein monofilament across all 5 metatarsal heads. Absent Achilles reflexes bilaterally.\n- Right Foot: Focal hyperkeratotic callus under 1st metatarsal head with surrounding erythema. No ulceration, drainage, or fluctuance.\n- Labs: HbA1c 8.4% (H), eGFR 54 mL/min (L), Serum Potassium 4.7 mEq/L (N).",
      evidences: [
        {
          id: "ev-02",
          sourceType: "LAB",
          sourceId: "Observation/lab-101",
          sourceTimestamp: "2026-09-30T07:45:00Z",
          quoteOrValue: "HbA1c = 8.4 % (High)",
          confidence: 1.0,
          verifiedByClinician: true
        },
        {
          id: "ev-03",
          sourceType: "LAB",
          sourceId: "Observation/lab-103",
          sourceTimestamp: "2026-09-30T07:15:00Z",
          quoteOrValue: "eGFR = 54 mL/min/1.73m² (Low)",
          confidence: 1.0,
          verifiedByClinician: true
        }
      ]
    },
    assessment: {
      text: "1. Uncontrolled Type 2 Diabetes Mellitus with secondary diabetic peripheral neuropathy (E11.42).\n2. Stage 3a Chronic Kidney Disease secondary to diabetic nephropathy (eGFR 54, UACR 142).\n3. High risk for diabetic plantar foot ulceration given monofilament anesthesia and focal callus.\n4. Primary Essential Hypertension, currently stable.",
      evidences: []
    },
    plan: {
      text: "1. Glycemic Optimization: Initiate basal Insulin Glargine 14 Units SubQ qHS. Continue Metformin 1000mg BID (monitor renal function closely).\n2. Neuropathic Pain: Maintain Gabapentin 300mg TID.\n3. Podiatry & Wound Care: Urgent inpatient podiatry consult for callus debridement and custom offloading orthotics.\n4. Preventive Care: Order dilated retinal eye exam and diabetic nutrition counseling upon discharge.",
      evidences: []
    },
    createdAt: "2026-09-30T15:00:00Z",
    signedAt: "2026-09-30T15:15:00Z",
    signedBy: "Practitioner/dr-thorne",
    version: 1
  }
];

// ==========================================
// 12. CLINICAL EVENT BUS SEED LOGS
// ==========================================

export const SEED_EVENTS: ClinicalEvent[] = [
  {
    id: "Event/evt-001",
    patientId: "Patient/pat-1001",
    encounterId: "Encounter/enc-1001",
    type: "PATIENT_ADMITTED",
    timestamp: "2026-09-29T14:30:00Z",
    authorId: "Practitioner/dr-thorne",
    authorName: "Dr. Alexander Thorne, MD",
    authorRole: "PHYSICIAN",
    departmentId: "DEPT-MED-SURG",
    title: "Patient Admitted to Med-Surg Bed 304-B",
    description: "Admitted from endocrine clinic for glycemic stabilization and foot exam."
  },
  {
    id: "Event/evt-002",
    patientId: "Patient/pat-1001",
    encounterId: "Encounter/enc-1001",
    type: "ALLERGY_RECORDED",
    timestamp: "2026-09-29T14:35:00Z",
    authorId: "Practitioner/nurse-daniels",
    authorName: "Sarah Daniels, RN",
    authorRole: "NURSE",
    departmentId: "DEPT-MED-SURG",
    title: "Severe Penicillin Allergy Re-verified",
    description: "Confirmed patient has history of facial angioedema and urticaria to penicillins."
  },
  {
    id: "Event/evt-003",
    patientId: "Patient/pat-1001",
    encounterId: "Encounter/enc-1001",
    type: "VITAL_RECORDED",
    timestamp: "2026-09-29T15:00:00Z",
    authorId: "Practitioner/nurse-daniels",
    authorName: "Sarah Daniels, RN",
    authorRole: "NURSE",
    departmentId: "DEPT-MED-SURG",
    title: "Admission Vitals Logged (NEWS2: 1)",
    description: "BP 138/82, HR 78, RR 18, SpO2 97% Room Air, Glucose 188 mg/dL."
  },
  {
    id: "Event/evt-004",
    patientId: "Patient/pat-1001",
    encounterId: "Encounter/enc-1001",
    type: "MEDICATION_ORDERED",
    timestamp: "2026-09-29T15:10:00Z",
    authorId: "Practitioner/dr-thorne",
    authorName: "Dr. Alexander Thorne, MD",
    authorRole: "PHYSICIAN",
    departmentId: "DEPT-MED-SURG",
    title: "CPOE: Insulin Glargine 14U Ordered",
    description: "Basal coverage order signed by attending physician."
  },
  {
    id: "Event/evt-005",
    patientId: "Patient/pat-1001",
    encounterId: "Encounter/enc-1001",
    type: "PHARMACY_VERIFIED",
    timestamp: "2026-09-29T15:25:00Z",
    authorId: "Practitioner/pharm-chen",
    authorName: "Dr. Marcus Chen, PharmD",
    authorRole: "PHARMACIST",
    departmentId: "DEPT-MED-SURG",
    title: "Pharmacy Verification Completed",
    description: "No drug-drug contraindications identified; order dispensed to Med-Surg automated pyxis."
  },
  {
    id: "Event/evt-006",
    patientId: "Patient/pat-1001",
    encounterId: "Encounter/enc-1001",
    type: "NOTE_SIGNED",
    timestamp: "2026-09-30T15:15:00Z",
    authorId: "Practitioner/dr-thorne",
    authorName: "Dr. Alexander Thorne, MD",
    authorRole: "PHYSICIAN",
    departmentId: "DEPT-MED-SURG",
    title: "Clinical SOAP Note Formally Signed",
    description: "Attending note version 1 authenticated with 3 evidence citations."
  }
];
