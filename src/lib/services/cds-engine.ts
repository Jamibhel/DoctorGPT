/**
 * HospitalOS Deterministic Clinical Decision Support (CDS) Safety Engine
 * Validates CPOE orders against Patient Allergies, Active Medications, and Renal Lab observations.
 */

import { 
  CDSAlert, 
  CDSDrugAllergyRule, 
  CDSDrugInteractionRule, 
  CPOEOrder, 
  DiagnosticLabResult, 
  Patient, 
  PatientAllergy 
} from "@/types/hospital";

export const STRUCTURED_DRUG_ALLERGY_RULES: CDSDrugAllergyRule[] = [
  {
    id: "RULE-ALLERGY-PENICILLIN",
    medication: "AMOXICILLIN",
    allergenClass: "PENICILLIN",
    crossReactives: ["AUGMENTIN", "AMPICILLIN", "PIPERACILLIN", "PENICILLIN V", "PENICILLIN G", "AMOXICILLIN-CLAVULANATE"],
    severity: "CRITICAL_CONTRAINDICATION",
    mechanism: "Beta-lactam core cross-reactivity with high risk of IgE-mediated anaphylaxis / angioedema.",
    recommendation: "Contraindicated. Select non-beta-lactam alternative (e.g. Azithromycin, Doxycycline, or Levofloxacin)."
  },
  {
    id: "RULE-ALLERGY-CEPHALOSPORIN-CROSS",
    medication: "CEFTRIAXONE",
    allergenClass: "PENICILLIN",
    crossReactives: ["CEFEPIME", "CEFAZOLIN", "CEPHALEXIN"],
    severity: "WARNING",
    mechanism: "Potential 2-5% cross-reactivity between penicillins and cephalosporins depending on R1 side-chain similarity.",
    recommendation: "Use with caution. If previous reaction was severe/anaphylaxis, avoid or consult Clinical Pharmacy / Allergy."
  },
  {
    id: "RULE-ALLERGY-SULFA",
    medication: "SULFAMETHOXAZOLE",
    allergenClass: "SULFA DRUGS",
    crossReactives: ["BACTRIM", "SEPTRA", "SULFASALAZINE"],
    severity: "CRITICAL_CONTRAINDICATION",
    mechanism: "Arylamine sulfonamide hypersensitivity; risk of severe maculopapular rash, DRESS, or Stevens-Johnson syndrome.",
    recommendation: "Contraindicated in documented sulfa allergy. Substitute with alternative antimicrobial regimen."
  },
  {
    id: "RULE-ALLERGY-CODEINE",
    medication: "CODEINE",
    allergenClass: "CODEINE",
    crossReactives: ["TRAMADOL", "MORPHINE", "OXYCODONE"],
    severity: "WARNING",
    mechanism: "Opiate hypersensitivity / histamine release.",
    recommendation: "Caution. Select non-opiate analgesic or evaluate severity before administration."
  }
];

export const STRUCTURED_DRUG_INTERACTION_RULES: CDSDrugInteractionRule[] = [
  {
    id: "RULE-DDI-WARFARIN-NSAID",
    drugA: "WARFARIN",
    drugB: "IBUPROFEN",
    severity: "CRITICAL_CONTRAINDICATION",
    mechanism: "Synergistic inhibition of platelet aggregation and gastric mucosal erosion with systemic anticoagulation. Major GI hemorrhage risk.",
    recommendation: "Avoid concomitant NSAIDs with Warfarin/DOACs. Utilize Acetaminophen (Tylenol) for analgesia."
  },
  {
    id: "RULE-DDI-ACEI-SPIRONOLACTONE",
    drugA: "LISINOPRIL",
    drugB: "SPIRONOLACTONE",
    severity: "WARNING",
    mechanism: "Dual blockade of aldosterone and renin-angiotensin-aldosterone axis leading to severe hyperkalemia.",
    recommendation: "Monitor serum potassium and renal function closely (within 3–5 days). Caution if baseline K+ > 4.8 mEq/L."
  },
  {
    id: "RULE-DDI-METFORMIN-CONTRAST",
    drugA: "METFORMIN",
    drugB: "IV IODINATED CONTRAST",
    severity: "WARNING",
    mechanism: "Contrast-induced acute kidney injury leading to toxic accumulation of Metformin and lactic acidosis.",
    recommendation: "Hold Metformin at time of or prior to iodinated radiocontrast procedure. Re-evaluate eGFR in 48 hours."
  },
  {
    id: "RULE-DDI-GLP1-INSULIN",
    drugA: "SEMAGLUTIDE",
    drugB: "GLARGINE INSULIN",
    severity: "INFO",
    mechanism: "Additive hypoglycemic action.",
    recommendation: "Consider a 20% reduction in basal insulin dose upon titrating GLP-1 agonist to prevent nocturnal hypoglycemia."
  },
  {
    id: "RULE-DDI-GABAPENTIN-OPIOID",
    drugA: "GABAPENTIN",
    drugB: "OXYCODONE",
    severity: "WARNING",
    mechanism: "Combined central nervous system and respiratory depression.",
    recommendation: "Start at lowest effective dose; monitor SpO2 and consciousness level closely."
  }
];

export class CDSSafetyEngine {
  /**
   * Deterministically evaluate a candidate CPOE order against patient chart data.
   */
  public static evaluateOrder(
    candidateOrderTitle: string,
    orderType: string,
    patient: Patient,
    activeOrders: CPOEOrder[],
    recentLabs: DiagnosticLabResult[]
  ): CDSAlert[] {
    const alerts: CDSAlert[] = [];
    const normalizedCandidate = candidateOrderTitle.toUpperCase();

    // 1. DRUG-ALLERGY CHECK
    if (patient.allergies && patient.allergies.length > 0) {
      for (const allergy of patient.allergies) {
        const allergenNormalized = allergy.allergen.toUpperCase();

        for (const rule of STRUCTURED_DRUG_ALLERGY_RULES) {
          const matchesAllergenClass = 
            rule.allergenClass.includes(allergenNormalized) || 
            allergenNormalized.includes(rule.allergenClass);

          const matchesCandidate = 
            normalizedCandidate.includes(rule.medication) ||
            rule.crossReactives.some(cr => normalizedCandidate.includes(cr));

          if (matchesAllergenClass && matchesCandidate) {
            alerts.push({
              id: `CDS-ALLERGY-${Date.now()}-${rule.id}`,
              type: "DRUG_ALLERGY",
              severity: rule.severity,
              offendingOrderTitle: candidateOrderTitle,
              conflictingItem: `Allergy: ${allergy.allergen} (${allergy.reaction})`,
              mechanism: rule.mechanism,
              clinicalRecommendation: rule.recommendation,
              sourceRuleId: rule.id,
              canOverrideWithRationale: rule.severity !== 'CRITICAL_CONTRAINDICATION'
            });
          }
        }
      }
    }

    // 2. DRUG-DRUG INTERACTION CHECK
    const activeDrugNames = activeOrders
      .filter(o => o.orderType === 'MEDICATION' && o.status !== 'DISCONTINUED' && o.status !== 'CANCELLED')
      .map(o => (o.medicationDetails?.drugName || o.title).toUpperCase());

    for (const activeDrug of activeDrugNames) {
      for (const rule of STRUCTURED_DRUG_INTERACTION_RULES) {
        const matchesPair = 
          (normalizedCandidate.includes(rule.drugA) && activeDrug.includes(rule.drugB)) ||
          (normalizedCandidate.includes(rule.drugB) && activeDrug.includes(rule.drugA));

        if (matchesPair) {
          alerts.push({
            id: `CDS-DDI-${Date.now()}-${rule.id}`,
            type: "DRUG_DRUG",
            severity: rule.severity,
            offendingOrderTitle: candidateOrderTitle,
            conflictingItem: `Active Medication: ${activeDrug}`,
            mechanism: rule.mechanism,
            clinicalRecommendation: rule.recommendation,
            sourceRuleId: rule.id,
            canOverrideWithRationale: true
          });
        }
      }
    }

    // 3. RENAL DOSE / CONTRAINDICATION CHECK (eGFR < 30 & Metformin)
    const egfrLab = recentLabs.find(l => l.testName.toLowerCase().includes("egfr"));
    if (egfrLab && typeof egfrLab.value === 'number' && egfrLab.value < 30) {
      if (normalizedCandidate.includes("METFORMIN")) {
        alerts.push({
          id: `CDS-RENAL-METFORMIN-${Date.now()}`,
          type: "DRUG_RENAL",
          severity: "CRITICAL_CONTRAINDICATION",
          offendingOrderTitle: candidateOrderTitle,
          conflictingItem: `Renal Lab: eGFR = ${egfrLab.value} mL/min (Severely Reduced)`,
          mechanism: "Metformin is cleared renally; eGFR < 30 mL/min carries boxed warning for fatal lactic acidosis.",
          recommendation: "Contraindicated. Discontinue Metformin and manage glycemic control with insulin or safe oral alternatives.",
          sourceRuleId: "RULE-RENAL-METFORMIN-EGFR30",
          canOverrideWithRationale: false
        });
      }
    }

    // 4. DUPLICATE THERAPY CHECK
    const exactDuplicate = activeOrders.find(
      o => o.orderType === 'MEDICATION' && 
           o.title.toUpperCase().includes(normalizedCandidate) && 
           o.status !== 'DISCONTINUED'
    );
    if (exactDuplicate) {
      alerts.push({
        id: `CDS-DUP-${Date.now()}`,
        type: "DUPLICATE_THERAPY",
        severity: "WARNING",
        offendingOrderTitle: candidateOrderTitle,
        conflictingItem: `Active duplicate: ${exactDuplicate.title}`,
        mechanism: "Patient currently has an active order for identical medication/class.",
        recommendation: "Verify whether this is intended as a dose adjustment or continuation before signing.",
        sourceRuleId: "RULE-DUPLICATE-MED",
        canOverrideWithRationale: true
      });
    }

    return alerts;
  }
}
