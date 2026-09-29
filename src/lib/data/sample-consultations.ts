export interface ConsultationPreset {
  id: string;
  patientId: string;
  title: string;
  encounterType: string;
  date: string;
  clinician: string;
  audioDurationSeconds: number;
  dialogue: {
    timestamp: string;
    speaker: 'Clinician' | 'Patient' | 'Caregiver';
    text: string;
  }[];
}

export const SAMPLE_CONSULTATIONS: ConsultationPreset[] = [
  {
    id: "preset-eleanor-followup",
    patientId: "pat-1001",
    title: "Post-Discharge Diabetic & Neuropathy Review",
    encounterType: "In-Person Comprehensive Consultation",
    date: "2026-09-29",
    clinician: "Dr. Alexander Thorne, MD (Attending Physician)",
    audioDurationSeconds: 198,
    dialogue: [
      {
        timestamp: "00:05",
        speaker: "Clinician",
        text: "Good morning, Mrs. Vance. Good to see you again. I have your chart open here. How have you been feeling over the last couple of months, particularly with your blood sugar readings and the numbness in your feet?"
      },
      {
        timestamp: "00:19",
        speaker: "Patient",
        text: "Good morning, Dr. Thorne. Well, the tingling in my toes is still bothering me, especially at night when I'm trying to sleep. The Gabapentin helps take the sharp edge off, but it's not completely gone. Also, my morning glucose log is still hovering around 175 to 190."
      },
      {
        timestamp: "00:41",
        speaker: "Clinician",
        text: "I see. Are you taking your Metformin 1000mg twice daily with meals and the Glipizide every morning before breakfast without missing any doses?"
      },
      {
        timestamp: "00:52",
        speaker: "Patient",
        text: "Yes, I'm very consistent with them. I also noticed a slight calloused patch on the bottom of my right big toe that looks a bit red. No open wound or drainage, but it feels tender when I wear my walking sneakers."
      },
      {
        timestamp: "01:10",
        speaker: "Clinician",
        text: "Let me examine that. [Clinician pauses to perform foot examination]. The skin is intact, but there is mild erythema over the right first metatarsal head with hyperkeratosis. Peripheral pulses (dorsalis pedis and posterior tibial) are 2+ bilaterally, and capillary refill is under two seconds. Monofilament sensation remains diminished at the distal phalanges."
      },
      {
        timestamp: "01:38",
        speaker: "Clinician",
        text: "Given that your blood sugars remain elevated and you're due for routine testing, here is what we are going to do: First, I will order a repeat HbA1c, comprehensive metabolic panel, and urine microalbumin ratio today. Second, because your morning sugars are high despite oral therapy, I want to initiate a low-dose GLP-1 receptor agonist or adjust your evening regimen once the lab results are back."
      },
      {
        timestamp: "02:04",
        speaker: "Clinician",
        text: "For your right foot, I'm putting in a referral to Podiatry for callous debridement and custom diabetic footwear offloading. I also notice you are two months overdue for your annual dilated diabetic retinal exam, so I'm ordering an Ophthalmology referral."
      },
      {
        timestamp: "02:25",
        speaker: "Patient",
        text: "Understood, Doctor. Should I continue with the Gabapentin 300mg three times daily?"
      },
      {
        timestamp: "02:32",
        speaker: "Clinician",
        text: "Yes, continue Gabapentin as prescribed. For home care, inspect your feet daily with a handheld mirror, do not attempt to trim or shave the callous yourself, and wash gently with mild soap. I want to see you back in the clinic in 4 weeks once we review your HbA1c and Podiatry notes. If you notice any increased swelling, redness, fever, or skin breakdown on that foot, call our clinic line immediately."
      },
      {
        timestamp: "03:02",
        speaker: "Patient",
        text: "Thank you, Dr. Thorne. That sounds very reassuring. I'll get the blood drawn downstairs right after this."
      }
    ]
  },
  {
    id: "preset-james-copd",
    patientId: "pat-1002",
    title: "COPD Exacerbation Risk & Breathlessness Assessment",
    encounterType: "Outpatient Chronic Disease Management",
    date: "2026-09-29",
    clinician: "Dr. Alexander Thorne, MD (Attending Physician)",
    audioDurationSeconds: 145,
    dialogue: [
      {
        timestamp: "00:04",
        speaker: "Clinician",
        text: "Hello Mr. Montgomery. Your oxygen saturation today is 94% on room air, and blood pressure is 132 over 78. You mentioned having some increased shortness of breath when walking up the hill from the parking garage?"
      },
      {
        timestamp: "00:18",
        speaker: "Patient",
        text: "Yes Doctor, over the past week I've had to stop and catch my breath twice while walking up the stairs. Also coughing up a small amount of clear-to-whitish phlegm in the mornings, but no fever or chest pain."
      },
      {
        timestamp: "00:36",
        speaker: "Clinician",
        text: "On chest auscultation, breath sounds are somewhat distant with scattered mild expiratory wheezes throughout both lung fields. No crackles or signs of fluid overload; no lower extremity edema."
      },
      {
        timestamp: "00:54",
        speaker: "Clinician",
        text: "Your symptoms represent a mild increase in airway reactivity, likely triggered by seasonal changes. You are currently taking Spiriva once daily. Let's make sure you use your Ventolin inhaler 15 to 20 minutes before strenuous walking. I will order a repeat Spirometry / Pulmonary Function Test to gauge whether we should step up your maintenance therapy to a combined LAMA/LABA/ICS inhaler."
      },
      {
        timestamp: "01:22",
        speaker: "Clinician",
        text: "I also want to schedule your annual low-dose chest CT screening. Please monitor sputum color; if it turns yellowish-green or if you develop a fever, contact us promptly. We'll plan a follow-up visit in 6 weeks."
      },
      {
        timestamp: "01:38",
        speaker: "Patient",
        text: "Thank you Dr. Thorne, I will pick up the new spacer for the inhaler and schedule the breathing test."
      }
    ]
  },
  {
    id: "preset-amara-anemia",
    patientId: "pat-1003",
    title: "Fatigue & Iron Deficiency Response Evaluation",
    encounterType: "Outpatient Routine Review",
    date: "2026-09-29",
    clinician: "Dr. Alexander Thorne, MD (Attending Physician)",
    audioDurationSeconds: 120,
    dialogue: [
      {
        timestamp: "00:03",
        speaker: "Clinician",
        text: "Good afternoon, Amara. You have been taking Ferrous Sulfate 325mg daily with orange juice for about three months now. How has your energy level been, and how are the migraines?"
      },
      {
        timestamp: "00:15",
        speaker: "Patient",
        text: "Dr. Thorne, my energy has improved significantly—I'm no longer falling asleep at 3 PM! Migraines have also dropped down to about once every two weeks instead of multiple times a week. The only issue is some mild constipation from the iron."
      },
      {
        timestamp: "00:35",
        speaker: "Clinician",
        text: "That is great clinical progress. For the constipation, increase dietary fiber, maintain hydration (at least 2 liters of water daily), and we can add docusate sodium 100mg PRN if needed. Your vital signs today are excellent: BP 114/72, pulse 68."
      },
      {
        timestamp: "00:56",
        speaker: "Clinician",
        text: "I will order a repeat Complete Blood Count (CBC) and Serum Ferritin today to confirm that your iron stores are properly restored. We'll review those numbers, continue your Sumatriptan PRN for acute attacks, and do a telehealth check in 3 months."
      },
      {
        timestamp: "01:15",
        speaker: "Patient",
        text: "Sounds great, Doctor. I'll get the blood drawn today."
      }
    ]
  }
];
