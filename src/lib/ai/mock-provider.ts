import { Patient, SoapNote, ActionItem, DocumentType, GeneratedDocument } from "@/types/clinical";
import { AIProvider } from "./provider-interface";

type LegacyOrHospitalPatient = Partial<Patient> & {
  activeConditions?: string[];
  sex?: 'M' | 'F' | 'OTHER';
  dateOfBirth?: string;
  gender?: 'M' | 'F' | 'OTHER';
  medications?: Array<{ name?: string; dosage?: string; frequency?: string; indication?: string }>;
  recentVitals?: Array<{ date?: string; bloodPressure?: string; heartRate?: number; oxygenSaturation?: number; bmi?: number }>;
  pastEncounters?: Array<{ type?: string; date?: string }>;
  outstandingInvestigations?: string[];
  mrn?: string;
};

const normalizePatientRecord = (patient: LegacyOrHospitalPatient | null | undefined) => {
  const conditions = Array.isArray(patient?.conditions)
    ? patient!.conditions
    : Array.isArray(patient?.activeConditions)
      ? patient.activeConditions
      : [];

  const normalizedAllergies = Array.isArray(patient?.allergies)
    ? patient.allergies.map((a: any) => ({
        allergen: a?.allergen ?? 'Unknown allergen',
        reaction: a?.reaction ?? 'Unspecified reaction',
        severity: a?.severity ?? 'MODERATE'
      }))
    : [];

  const normalizedMedications = Array.isArray(patient?.medications)
    ? patient.medications.map((m: any) => ({
        name: m?.name ?? 'Medication',
        dosage: m?.dosage ?? '',
        frequency: m?.frequency ?? 'as directed',
        indication: m?.indication ?? 'clinical management'
      }))
    : [];

  const normalizedVitals = Array.isArray(patient?.recentVitals)
    ? patient.recentVitals
    : [];

  const normalizedPastEncounters = Array.isArray(patient?.pastEncounters)
    ? patient.pastEncounters
    : [];

  return {
    firstName: patient?.firstName ?? 'Patient',
    lastName: patient?.lastName ?? '',
    mrn: patient?.mrn ?? 'MRN-UNKNOWN',
    dob: patient?.dob ?? patient?.dateOfBirth ?? 'Unknown',
    gender: (patient?.gender ?? patient?.sex ?? 'OTHER') as 'M' | 'F' | 'OTHER',
    conditions,
    allergies: normalizedAllergies,
    medications: normalizedMedications,
    recentVitals: normalizedVitals,
    outstandingInvestigations: Array.isArray(patient?.outstandingInvestigations) ? patient.outstandingInvestigations : [],
    pastEncounters: normalizedPastEncounters
  };
};

export class MockAIProvider implements AIProvider {
  name = "Synthea Clinical Mock Engine ($0 Zero-Spend Local)";
  isAvailable = true;

  async transcribeAudio(audioData: Blob | ArrayBuffer | string): Promise<{
    transcriptText: string;
    turns: { speaker: 'Clinician' | 'Patient' | 'Caregiver'; text: string; timestamp: string }[];
  }> {
    // Artificial slight delay for realistic processing feel
    await new Promise((r) => setTimeout(r, 600));

    if (typeof audioData === 'string' && audioData.length > 20) {
      // If text or preset transcript was passed
      return {
        transcriptText: audioData,
        turns: [
          { speaker: "Clinician", timestamp: "00:02", text: "Starting recorded clinical encounter." },
          { speaker: "Patient", timestamp: "00:08", text: audioData }
        ]
      };
    }

    return {
      transcriptText: "Clinician: Good morning. How have you been feeling since our last visit? Patient: My symptoms have been fairly stable, but I wanted to review my medication regimen and discuss the recent lab recommendations.",
      turns: [
        { speaker: "Clinician", timestamp: "00:02", text: "Good morning. How have you been feeling since our last visit?" },
        { speaker: "Patient", timestamp: "00:09", text: "My symptoms have been fairly stable, but I wanted to review my medication regimen and discuss the recent lab recommendations." }
      ]
    };
  }

  async generateClinicalNote(
    patient: Patient,
    transcriptText: string,
    additionalNotes?: string
  ): Promise<SoapNote> {
    await new Promise((r) => setTimeout(r, 700));

    const safePatient = normalizePatientRecord(patient as LegacyOrHospitalPatient);
    const conditions = safePatient.conditions ?? [];
    const isDiabetes = conditions.some(c => c.toLowerCase().includes("diabet") || c.toLowerCase().includes("glucose"));
    const isCopd = conditions.some(c => c.toLowerCase().includes("copd") || c.toLowerCase().includes("pulmonary"));

    if (isDiabetes) {
      return {
        subjective: `Patient Eleanor Vance (58yo F) presents for chronic disease management and routine follow-up of Type 2 Diabetes Mellitus and peripheral neuropathy. Reports persistent nocturnal dysesthesias/burning sensation in bilateral lower extremities despite Gabapentin 300mg TID. Denies missed doses of Metformin or Glipizide. Reports morning fasting fingerstick blood sugars consistently ranging between 175-190 mg/dL. Notes new tender calloused area on plantar aspect of right first metatarsal head without drainage or breakdown. Denies fevers, chills, or acute chest symptoms.`,
        objective: `Vitals reviewed: BP 148/92 mmHg, HR 78 bpm, RR 16, SpO2 98% on room air, BMI 31.2 kg/m².
Physical Examination:
- General: Alert, oriented x3, well-nourished in no acute distress.
- Cardiovascular: Regular rate and rhythm, S1/S2 present, no murmurs. Peripheral pulses: DP and PT are 2+ bilaterally.
- Lower Extremities: Right foot inspection reveals intact skin with focal hyperkeratosis and mild localized erythema over the plantar aspect of the right 1st metatarsal head. No ulceration, maceration, or fluctuance. Capillary refill < 2 seconds.
- Neurological: Semmes-Weinstein 10g monofilament testing demonstrates reduced protective sensation over distal 1st and 5th metatarsal heads bilaterally. Reflexes: Achilles 1+ bilaterally.`,
        assessment: `1. Type 2 Diabetes Mellitus with Hyperglycemia: Inadequate glycemic control (home fasting glucose persistently 175-190 mg/dL). Due for updated HbA1c and metabolic panel. Likely requires escalation to GLP-1 receptor agonist therapy pending lab results.
2. Diabetic Peripheral Neuropathy with High-Risk Foot Lesion: Plantar callosity with localized erythema without overt ulceration. Risk for skin breakdown secondary to decreased sensation.
3. Essential Hypertension: Elevated in clinic (148/92 mmHg), currently on Lisinopril 20mg daily.
4. Health Maintenance: Overdue for annual diabetic dilated retinal examination.`,
        plan: `1. Diagnostics & Labs:
   - Order STAT/Today: HbA1c, Comprehensive Metabolic Panel (CMP), and Urine Albumin-to-Creatinine Ratio (UACR).
2. Pharmacotherapy:
   - Continue Metformin 1000mg BID and Glipizide 5mg daily.
   - Continue Gabapentin 300mg TID for neuropathic symptoms.
   - Plan to initiate GLP-1 RA or adjust antihypertensive/hypoglycemic regimen after reviewing today's labs.
3. Referrals:
   - Routine referral to Podiatry for sharp debridement of callous and offloading footwear assessment.
   - Referral to Ophthalmology for overdue annual dilated eye exam.
4. Patient Education & Safety:
   - Instructed on daily foot self-inspection using mirror.
   - Avoid self-treatment/trimming of callous. Seek urgent evaluation for redness, warmth, or exudate.
5. Disposition & Follow-Up:
   - Return to clinic in 4 weeks for lab review and treatment escalation.`,
        summary: `58yo F with uncontrolled T2DM, hypertension, and peripheral neuropathy seen for routine check and tender right plantar callous. Labs ordered, podiatry/ophthalmology referrals placed, and 4-week follow-up arranged.`,
        citations: [
          { id: "c1", quote: "morning glucose log is still hovering around 175 to 190", source: "transcript", mappedSection: "subjective" },
          { id: "c2", quote: "mild erythema over the right first metatarsal head with hyperkeratosis", source: "transcript", mappedSection: "objective" },
          { id: "c3", quote: "putting in a referral to Podiatry for callous debridement", source: "transcript", mappedSection: "plan" }
        ],
        lastEditedAt: new Date().toISOString()
      };
    } else if (isCopd) {
      return {
        subjective: `Patient James Montgomery (71yo M) presents for evaluation of increased exertional dyspnea when walking uphill/stairs and morning cough productive of clear-to-white sputum over the past week. Denies fever, chills, purulent sputum, hemoptysis, or acute chest pain. Currently adherent to Spiriva and PRN Ventolin.`,
        objective: `Vitals: BP 132/78 mmHg, HR 82 bpm, RR 20 bpm, SpO2 94% on room air.
Physical Exam: Mild distant breath sounds with faint scattered expiratory wheezes bilaterally. No crackles or rhonchi. No jugular venous distention. No peripheral edema.`,
        assessment: `1. Chronic Obstructive Pulmonary Disease (COPD) with Mild Exertional Increase in Symptoms: Stable baseline with seasonal airway reactivity; no evidence of acute bacterial exacerbation.
2. Coronary Artery Disease: Stable on cardioprotective medications.`,
        plan: `1. Diagnostic: Order updated Spirometry (PFT) and schedule annual low-dose chest CT screening.
2. Pharmacotherapy: Continue Spiriva 18mcg daily. Use Ventolin 15-20 min pre-exertion.
3. Patient Education: Return precautions for fever, colored sputum, or resting dyspnea.
4. Follow-up: Recheck in clinic in 6 weeks with spirometry results.`,
        summary: `71yo M with COPD presenting with mild exertional dyspnea and wheezing. Ordered spirometry and LDCT, counseled on inhaler use, follow-up in 6 weeks.`,
        citations: [
          { id: "c1", quote: "increased shortness of breath when walking up the hill", source: "transcript", mappedSection: "subjective" },
          { id: "c2", quote: "scattered mild expiratory wheezes throughout both lung fields", source: "transcript", mappedSection: "objective" }
        ],
        lastEditedAt: new Date().toISOString()
      };
    } else {
      return {
        subjective: `Patient ${safePatient.firstName} ${safePatient.lastName} (${safePatient.gender}, ${safePatient.dob}) presents for follow-up review. Pertinent complaints and history discussed regarding: ${transcriptText.slice(0, 200)}...`,
        objective: `Patient appears comfortable in no acute distress. Vital signs reviewed: BP ${safePatient.recentVitals[0]?.bloodPressure || '120/80'}, HR ${safePatient.recentVitals[0]?.heartRate || 72} bpm, SpO2 ${safePatient.recentVitals[0]?.oxygenSaturation || 98}%. Examination findings consistent with baseline chronic history.`,
        assessment: `1. Clinical status stable under current therapeutic regimen.
2. Diagnostic monitoring indicated for routine preventive health maintenance.`,
        plan: `1. Continue current maintenance medications as tolerated.
2. Diagnostic screening and routine interval laboratory surveillance ordered.
3. Routine follow-up scheduled.`,
        summary: `Outpatient consultation completed for ${safePatient.firstName} ${safePatient.lastName}. Regimen reviewed and ongoing management confirmed.`,
        citations: [
          { id: "c1", quote: transcriptText.slice(0, 80), source: "transcript", mappedSection: "subjective" }
        ],
        lastEditedAt: new Date().toISOString()
      };
    }
  }

  async extractActions(
    patient: Patient,
    transcriptText: string,
    note: SoapNote
  ): Promise<ActionItem[]> {
    await new Promise((r) => setTimeout(r, 400));

    const safePatient = normalizePatientRecord(patient as LegacyOrHospitalPatient);
    const conditions = safePatient.conditions ?? [];
    const isDiabetes = conditions.some(c => c.toLowerCase().includes("diabet") || c.toLowerCase().includes("glucose"));
    const isCopd = conditions.some(c => c.toLowerCase().includes("copd") || c.toLowerCase().includes("pulmonary"));

    if (isDiabetes) {
      return [
        {
          id: "act-1",
          type: "LAB_ORDER",
          title: "Comprehensive Glycemic & Renal Panel",
          description: "HbA1c, Fasting CMP, Urine Albumin-to-Creatinine Ratio (UACR)",
          urgency: "ROUTINE",
          recipientOrTarget: "In-House Diagnostic Laboratory",
          status: "SUGGESTED",
          rationale: "Routine monitoring indicated by uncontrolled fasting blood sugars (175-190 mg/dL) and high-risk diabetic status."
        },
        {
          id: "act-2",
          type: "REFERRAL",
          title: "Podiatry Specialist Evaluation",
          description: "Callous debridement and diabetic foot offloading footwear prescription.",
          urgency: "URGENT",
          recipientOrTarget: "Department of Podiatric Surgery & Wound Care",
          status: "SUGGESTED",
          rationale: "Diminished protective monofilament sensation with tender right 1st metatarsal erythema carries ulceration risk."
        },
        {
          id: "act-3",
          type: "REFERRAL",
          title: "Diabetic Retinal Eye Examination",
          description: "Annual dilated ophthalmic exam for diabetic retinopathy screening.",
          urgency: "ROUTINE",
          recipientOrTarget: "Outpatient Ophthalmology Clinic",
          status: "SUGGESTED",
          rationale: "Patient chart indicates annual screening is overdue by 2 months."
        },
        {
          id: "act-4",
          type: "PATIENT_INSTRUCTION",
          title: "Diabetic Foot Care & Daily Inspection Protocol",
          description: "Use mirror daily to inspect plantar surfaces. Wash with mild soap, dry thoroughly between toes. Do not self-treat callous. Contact clinic immediately for warmth or redness.",
          urgency: "ROUTINE",
          recipientOrTarget: "Patient / Caregiver",
          status: "SUGGESTED",
          rationale: "Standard evidence-based guidance for peripheral neuropathy."
        },
        {
          id: "act-5",
          type: "FOLLOW_UP",
          title: "4-Week Clinical Follow-Up",
          description: "Review HbA1c/CMP results, check Podiatry notes, and finalize medication adjustment.",
          urgency: "ROUTINE",
          recipientOrTarget: "Primary Care Outpatient Clinic",
          status: "SUGGESTED",
          rationale: "Short interval needed to evaluate response to treatment and lab results."
        }
      ];
    } else if (isCopd) {
      return [
        {
          id: "act-1",
          type: "LAB_ORDER",
          title: "Diagnostic Spirometry / PFT",
          description: "Pre- and post-bronchodilator spirometry to assess FEV1 and FVC response.",
          urgency: "ROUTINE",
          recipientOrTarget: "Pulmonary Function Lab",
          status: "SUGGESTED",
          rationale: "Exertional dyspnea and wheezes warrant updated baseline lung volume assessment."
        },
        {
          id: "act-2",
          type: "LAB_ORDER",
          title: "Low-Dose Chest CT (LDCT)",
          description: "Annual lung cancer screening protocol.",
          urgency: "ROUTINE",
          recipientOrTarget: "Diagnostic Radiology Department",
          status: "SUGGESTED",
          rationale: "Annual screening due according to clinical preventative guidelines."
        },
        {
          id: "act-3",
          type: "FOLLOW_UP",
          title: "6-Week Pulmonology Review",
          description: "Follow-up visit with spirometry and CT imaging results.",
          urgency: "ROUTINE",
          recipientOrTarget: "Outpatient Pulmonology",
          status: "SUGGESTED",
          rationale: "Assess progression of symptoms and determine if maintenance inhaler step-up is required."
        }
      ];
    }

    return [
      {
        id: "act-gen-1",
        type: "FOLLOW_UP",
        title: "Routine Outpatient Recheck",
        description: "Standard interval consultation in 3 months.",
        urgency: "ROUTINE",
        recipientOrTarget: "Outpatient Clinic",
        status: "SUGGESTED",
        rationale: "Maintenance of chronic clinical stability."
      }
    ];
  }

  async generateDocument(
    docType: DocumentType,
    patient: Patient,
    note: SoapNote,
    actions: ActionItem[]
  ): Promise<GeneratedDocument> {
    await new Promise((r) => setTimeout(r, 500));

    const safePatient = normalizePatientRecord(patient as LegacyOrHospitalPatient);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (docType === 'REFERRAL_LETTER') {
      const referralAction = actions.find(a => a.type === 'REFERRAL') || {
        title: "Specialist Consultation",
        description: "Comprehensive specialist review and clinical evaluation.",
        recipientOrTarget: "Consulting Specialist"
      };

      const content = `CLINICAL CONSULTATION & REFERRAL REQUEST
Date: ${today}

TO: ${referralAction.recipientOrTarget}
FROM: Dr. Alexander Thorne, MD (Attending Physician)
RE: Clinical Referral for ${safePatient.firstName} ${safePatient.lastName}
DOB: ${safePatient.dob} | MRN: ${safePatient.mrn}

CLINICAL REASON FOR REFERRAL:
${referralAction.title} - ${referralAction.description}

PERTINENT HISTORY & BACKGROUND:
${safePatient.firstName} is a ${safePatient.dob ? '58-year-old' : ''} patient with known history of:
${safePatient.conditions.map(c => `• ${c}`).join('\n')}

ALLERGIES:
${safePatient.allergies.map(a => `• ${a.allergen} (${a.severity}): ${a.reaction}`).join('\n') || 'None reported'}

CURRENT MEDICATIONS:
${safePatient.medications.map(m => `• ${m.name} ${m.dosage} - ${m.frequency}`).join('\n')}

RECENT CLINICAL ENCOUNTER SUMMARY:
${note.summary}

PHYSICAL FINDINGS & ASSESSMENT:
${note.assessment}

RECOMMENDED ACTION & REQUESTED CONSULTATION SCOPE:
We would appreciate your specialized evaluation and management recommendation. Please provide your clinical notes and plan back to our primary care service.

Sincerely,
Dr. Alexander Thorne, MD
Department of Medicine, Clinical Workbench AI Prototype`;

      return {
        id: `doc-${Date.now()}`,
        type: 'REFERRAL_LETTER',
        title: `Referral Letter: ${referralAction.title}`,
        content,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };
    } else if (docType === 'PATIENT_INSTRUCTIONS') {
      const content = `AFTER-VISIT CARE & PATIENT INSTRUCTIONS
Date: ${today}
Patient: ${safePatient.firstName} ${safePatient.lastName} (MRN: ${safePatient.mrn})

Dear ${safePatient.firstName},
Thank you for coming in today. Here is a summary of what we discussed during your visit, your updated care plan, and what you should watch out for at home.

1. YOUR CURRENT CARE PLAN & MEDICATION REMINDERS:
${safePatient.medications.map(m => `• ${m.name} (${m.dosage}): Take ${m.frequency.toLowerCase()} for ${m.indication}.`).join('\n')}

2. IMPORTANT AT-HOME INSTRUCTIONS:
• Daily Foot Checks: Inspect the tops, soles, and sides of both feet every day using a handheld mirror.
• Skin Care: Keep feet clean and dry. Do not attempt to cut, peel, or shave callouses or corns yourself.
• Blood Sugar Tracking: Please continue logging your morning fasting blood glucose readings and bring your log to your next appointment.

3. UPCOMING TESTS & APPOINTMENTS:
${actions.map(a => `• ${a.title}: ${a.description} (${a.urgency})`).join('\n')}

4. WHEN TO SEEK IMMEDIATE MEDICAL ATTENTION:
Contact our clinic immediately or go to the nearest emergency room if you develop:
• Increased redness, swelling, warmth, or red streaks on your foot or leg
• Any open sore, drainage, blister, or foul odor
• Chills, confusion, or a fever above 100.4 °F (38.0 °C)

Clinic Phone: +1 (555) 019-2834 | Emergency Services: 911`;

      return {
        id: `doc-${Date.now()}`,
        type: 'PATIENT_INSTRUCTIONS',
        title: `Patient After-Care Instructions (${patient.firstName} ${patient.lastName})`,
        content,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };
    } else {
      const content = `CLINICAL HANDOVER SUMMARY
Date: ${today}
Patient: ${safePatient.firstName} ${safePatient.lastName} (MRN: ${safePatient.mrn})

PRIMARY DIAGNOSIS & ENCOUNTER PURPOSE:
${note.summary}

ACTIVE CLINICAL ISSUES:
${note.assessment}

OUTSTANDING TASKS & TO-DO:
${actions.map(a => `[ ] ${a.title} (${a.urgency}): ${a.description}`).join('\n')}

CARE TEAM CONTACT:
Attending: Dr. Alexander Thorne, MD`;

      return {
        id: `doc-${Date.now()}`,
        type: docType,
        title: `Clinical Handover Summary`,
        content,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };
    }
  }

  async queryPatientRecord(
    patient: Patient,
    question: string
  ): Promise<{ answer: string; evidence: string[] }> {
    await new Promise((r) => setTimeout(r, 450));
    const safePatient = normalizePatientRecord(patient as LegacyOrHospitalPatient);
    const q = question.toLowerCase();

    if (q.includes("hba1c") || q.includes("sugar") || q.includes("glucose")) {
      return {
        answer: `${safePatient.firstName}'s fasting blood sugars have been documented between 175 and 195 mg/dL. Her routine HbA1c is currently due (scheduled for September 2026), with the previous encounter noting suboptimal glycemic control and recommendation for updated testing.`,
        evidence: [
          "Past Encounter (2026-06-10): Suboptimal glycemic control in T2DM. Fasting sugars 170-195 mg/dL.",
          "Outstanding Investigations: HbA1c & Fasting Metabolic Panel due September 2026.",
          "Current Meds: Metformin 1000mg BID, Glipizide 5mg QD."
        ]
      };
    }

    if (q.includes("allerg") || q.includes("penicillin") || q.includes("reaction")) {
      const allergyList = safePatient.allergies.map(a => `${a.allergen} (${a.severity}: ${a.reaction})`).join(", ");
      return {
        answer: `${safePatient.firstName} has documented allergies to: ${allergyList || "None reported"}. Autonomous antibiotic prescribing must strictly respect these contraindications.`,
        evidence: safePatient.allergies.map(a => `Allergy Record: ${a.allergen} - ${a.reaction} (${a.severity})`)
      };
    }

    if (q.includes("medication") || q.includes("drugs") || q.includes("dose")) {
      const medList = safePatient.medications.map(m => `${m.name} ${m.dosage} (${m.frequency})`).join(", ");
      return {
        answer: `Active medications for ${safePatient.firstName} are: ${medList}.`,
        evidence: safePatient.medications.map(m => `Active Rx: ${m.name} ${m.dosage} ${m.frequency} for ${m.indication}`)
      };
    }

    if (q.includes("vital") || q.includes("bp") || q.includes("blood pressure")) {
      const latest = safePatient.recentVitals[0];
      return {
        answer: `Most recent vitals on ${latest?.date || 'record'}: Blood Pressure: ${latest?.bloodPressure || 'N/A'}, Heart Rate: ${latest?.heartRate || 'N/A'} bpm, SpO2: ${latest?.oxygenSaturation || 'N/A'}%, BMI: ${latest?.bmi || 'N/A'}.`,
        evidence: [
          `Vitals (${latest?.date}): BP ${latest?.bloodPressure}, HR ${latest?.heartRate} bpm, O2 ${latest?.oxygenSaturation}%`
        ]
      };
    }

    return {
      answer: `Based on ${safePatient.firstName}'s longitudinal record, active conditions include ${safePatient.conditions.join(", ") || "No documented conditions"}. She is managed with ${safePatient.medications.length} active prescriptions and has ${safePatient.outstandingInvestigations.length} outstanding investigations due.`,
      evidence: [
        `Conditions: ${safePatient.conditions.join("; ") || "None documented"}`,
        `Recent visit: ${safePatient.pastEncounters[0]?.type || "N/A"} (${safePatient.pastEncounters[0]?.date || "N/A"})`
      ]
    };
  }
}
