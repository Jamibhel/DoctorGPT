import { Patient } from "@/types/clinical";

export const SYNTHETIC_PATIENTS: Patient[] = [
  {
    id: "pat-1001",
    mrn: "SYN-849201",
    firstName: "Eleanor",
    lastName: "Vance",
    dob: "1968-04-14",
    gender: "F",
    phone: "+1 (555) 382-9102",
    address: "42 Elmwood Ave, Boston, MA 02138",
    bloodType: "A+",
    allergies: [
      { allergen: "Penicillin", reaction: "Urticaria and mild dyspnea", severity: "SEVERE" },
      { allergen: "Sulfa Drugs", reaction: "Maculopapular rash", severity: "MODERATE" },
    ],
    conditions: [
      "Type 2 Diabetes Mellitus (Uncontrolled)",
      "Essential Hypertension",
      "Diabetic Peripheral Neuropathy",
      "Hyperlipidemia"
    ],
    medications: [
      { name: "Metformin HCl", dosage: "1000 mg", frequency: "Twice daily with meals", indication: "T2DM", startDate: "2021-03-12" },
      { name: "Glipizide", dosage: "5 mg", frequency: "Once daily before breakfast", indication: "T2DM", startDate: "2023-01-18" },
      { name: "Lisinopril", dosage: "20 mg", frequency: "Once daily in the morning", indication: "Hypertension", startDate: "2020-09-05" },
      { name: "Atorvastatin", dosage: "40 mg", frequency: "Once daily at bedtime", indication: "Hyperlipidemia", startDate: "2020-09-05" },
      { name: "Gabapentin", dosage: "300 mg", frequency: "Three times daily", indication: "Peripheral Neuropathy", startDate: "2024-05-10" },
    ],
    recentVitals: [
      { date: "2026-09-15", bloodPressure: "148/92 mmHg", heartRate: 78, respiratoryRate: 16, temperature: "98.4 °F (36.9 °C)", oxygenSaturation: 98, weightKg: 84.5, bmi: 31.2 },
      { date: "2026-06-10", bloodPressure: "142/88 mmHg", heartRate: 74, respiratoryRate: 16, temperature: "98.6 °F (37.0 °C)", oxygenSaturation: 99, weightKg: 85.0, bmi: 31.4 },
      { date: "2026-02-04", bloodPressure: "138/84 mmHg", heartRate: 72, respiratoryRate: 14, temperature: "98.2 °F (36.8 °C)", oxygenSaturation: 98, weightKg: 86.2, bmi: 31.8 },
    ],
    pastEncounters: [
      {
        id: "enc-801",
        date: "2026-06-10",
        clinician: "Dr. Sarah Lin, MD",
        type: "Routine Endocrine Review",
        chiefComplaint: "Follow-up for elevated morning fasting blood glucose (170-195 mg/dL).",
        diagnosis: "Suboptimal glycemic control in T2DM; Mild microalbuminuria.",
        notesSummary: "Discussed dietary adherence. Increased Metformin to 1000mg BID. Recommended diabetic foot exam and updated HbA1c in 3 months."
      },
      {
        id: "enc-744",
        date: "2026-02-04",
        clinician: "Dr. Marcus Reed, MD",
        type: "Annual Primary Care Check",
        chiefComplaint: "Complaints of burning sensation and pins-and-needles in bilateral feet.",
        diagnosis: "Diabetic Peripheral Neuropathy.",
        notesSummary: "Monofilament test demonstrated reduced sensation in distal 1st and 5th metatarsals bilaterally. Commenced Gabapentin 300mg TID."
      }
    ],
    outstandingInvestigations: [
      "HbA1c & Fasting Metabolic Panel (Due September 2026)",
      "Annual Diabetic Dilated Eye Examination (Overdue by 2 months)",
      "Urine Albumin-to-Creatinine Ratio (UACR)"
    ]
  },
  {
    id: "pat-1002",
    mrn: "SYN-194038",
    firstName: "James",
    lastName: "Montgomery",
    dob: "1954-11-29",
    gender: "M",
    phone: "+1 (555) 714-8821",
    address: "108 Oak Crest Dr, Brookline, MA 02445",
    bloodType: "O+",
    allergies: [
      { allergen: "Codeine", reaction: "Nausea and intense dizziness", severity: "MODERATE" },
    ],
    conditions: [
      "Chronic Obstructive Pulmonary Disease (COPD - GOLD Stage II)",
      "Coronary Artery Disease (s/p Stent to LAD 2022)",
      "Mild Cognitive Impairment",
      "Benign Prostatic Hyperplasia (BPH)"
    ],
    medications: [
      { name: "Tiotropium (Spiriva)", dosage: "18 mcg", frequency: "1 inhalation daily", indication: "COPD Maintenance", startDate: "2023-04-11" },
      { name: "Albuterol Inhaler (Ventolin)", dosage: "90 mcg/actuation", frequency: "1-2 puffs q4-6h PRN", indication: "Acute Bronchospasm", startDate: "2022-10-02" },
      { name: "Aspirin", dosage: "81 mg", frequency: "Once daily", indication: "Cardioprotection", startDate: "2022-05-19" },
      { name: "Metoprolol Succinate", dosage: "50 mg", frequency: "Once daily", indication: "CAD", startDate: "2022-05-20" },
      { name: "Tamsulosin", dosage: "0.4 mg", frequency: "Once daily with evening meal", indication: "BPH", startDate: "2021-08-14" },
    ],
    recentVitals: [
      { date: "2026-09-20", bloodPressure: "132/78 mmHg", heartRate: 82, respiratoryRate: 20, temperature: "99.1 °F (37.3 °C)", oxygenSaturation: 94, weightKg: 73.2, bmi: 24.1 },
      { date: "2026-05-12", bloodPressure: "128/76 mmHg", heartRate: 76, respiratoryRate: 18, temperature: "98.4 °F (36.9 °C)", oxygenSaturation: 96, weightKg: 74.0, bmi: 24.4 },
    ],
    pastEncounters: [
      {
        id: "enc-690",
        date: "2026-05-12",
        clinician: "Dr. Sarah Lin, MD",
        type: "Pulmonology Routine Follow-up",
        chiefComplaint: "Mild exertional shortness of breath when climbing stairs.",
        diagnosis: "Stable COPD without acute exacerbation.",
        notesSummary: "Lung auscultation: faint expiratory wheezes bilaterally, no crackles. Patient demonstrated correct inhaler technique."
      }
    ],
    outstandingInvestigations: [
      "Annual Spirometry / Pulmonary Function Test (PFT)",
      "Screening Low-Dose Chest CT (Due Fall 2026)"
    ]
  },
  {
    id: "pat-1003",
    mrn: "SYN-662914",
    firstName: "Amara",
    lastName: "Okonkwo",
    dob: "1992-08-19",
    gender: "F",
    phone: "+1 (555) 902-3341",
    address: "71 Beacon St, Cambridge, MA 02139",
    bloodType: "B+",
    allergies: [
      { allergen: "Latex", reaction: "Contact dermatitis and itching", severity: "MILD" },
    ],
    conditions: [
      "Migraine without Aura (Episodic)",
      "Iron Deficiency Anemia",
      "Generalized Anxiety Disorder"
    ],
    medications: [
      { name: "Sumatriptan", dosage: "50 mg", frequency: "1 tablet at onset of migraine, may repeat after 2h (max 200mg/24h)", indication: "Acute Migraine", startDate: "2024-02-15" },
      { name: "Ferrous Sulfate", dosage: "325 mg (65 mg elemental iron)", frequency: "Once daily with Vitamin C on empty stomach", indication: "Iron Deficiency", startDate: "2026-07-01" },
      { name: "Sertraline", dosage: "50 mg", frequency: "Once daily in morning", indication: "Anxiety", startDate: "2025-01-10" },
    ],
    recentVitals: [
      { date: "2026-09-22", bloodPressure: "114/72 mmHg", heartRate: 68, respiratoryRate: 14, temperature: "98.6 °F (37.0 °C)", oxygenSaturation: 100, weightKg: 59.0, bmi: 21.8 },
      { date: "2026-07-01", bloodPressure: "110/70 mmHg", heartRate: 72, respiratoryRate: 14, temperature: "98.4 °F (36.9 °C)", oxygenSaturation: 99, weightKg: 58.5, bmi: 21.6 },
    ],
    pastEncounters: [
      {
        id: "enc-512",
        date: "2026-07-01",
        clinician: "Dr. David Kim, MD",
        type: "Urgent Outpatient Consultation",
        chiefComplaint: "Fatigue, pale conjunctiva, increased migraine frequency (3-4 episodes/month).",
        diagnosis: "Microcytic hypochromic anemia (Ferritin 9 ng/mL). Migraine exacerbation secondary to fatigue.",
        notesSummary: "Started oral iron therapy. Advised avoiding NSAID overuse to prevent medication-overuse headaches."
      }
    ],
    outstandingInvestigations: [
      "Repeat CBC and Serum Ferritin (Due late October 2026)",
      "Headache Diary Review"
    ]
  }
];
