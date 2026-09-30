/**
 * HospitalOS Deterministic SBAR Generator Service
 * Constructs Situation, Background, Assessment, Recommendation from clinical data.
 */

import { 
  CPOEOrder, 
  DiagnosticLabResult, 
  Encounter, 
  HospitalBed, 
  Patient, 
  VitalSignObservation 
} from "@/types/hospital";

export interface SBARStructuredSummary {
  patientHeader: {
    name: string;
    mrn: string;
    ageSex: string;
    bedLocation: string;
    codeStatus: string;
    attending: string;
  };
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  generatedAt: string;
}

export class SBARService {
  public static generateSBAR(
    patient: Patient,
    encounter: Encounter,
    bed: HospitalBed | undefined,
    latestVitals: VitalSignObservation | undefined,
    recentLabs: DiagnosticLabResult[],
    activeOrders: CPOEOrder[],
    reasonForHandover?: string
  ): SBARStructuredSummary {
    const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
    const bedName = bed ? `Bed ${bed.bedNumber} (Ward ${bed.wardId})` : "Outpatient / Unassigned";

    // 1. SITUATION
    const situation = reasonForHandover || 
      `${patient.firstName} ${patient.lastName}, a ${age}yo ${patient.sex} in ${bedName}, admitted for ${encounter.admittingDiagnosis}. Current clinical risk: ${latestVitals?.news2RiskTier || 'LOW'} (NEWS2 Score: ${latestVitals?.news2Score || 0}).`;

    // 2. BACKGROUND
    const allergiesStr = patient.allergies.length > 0 
      ? patient.allergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")
      : "No known drug allergies (NKDA)";
    
    const conditionsStr = patient.activeConditions.length > 0
      ? patient.activeConditions.join("; ")
      : "No chronic conditions recorded";

    const background = `Admitted ${new Date(encounter.admittedAt).toLocaleDateString()} with chief complaint of "${encounter.chiefComplaint}". Past Medical History: ${conditionsStr}. Documented Allergies: ${allergiesStr}. Code Status: ${encounter.codeStatus}.`;

    // 3. ASSESSMENT
    let assessment = "";
    if (latestVitals) {
      assessment += `Latest Vitals (${new Date(latestVitals.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}): BP ${latestVitals.systolicBP}/${latestVitals.diastolicBP} mmHg, HR ${latestVitals.heartRate} bpm, RR ${latestVitals.respirationRate} bpm, SpO2 ${latestVitals.spO2}% (${latestVitals.supplementalOxygen ? 'on O2' : 'Room Air'}), Temp ${latestVitals.temperatureCelsius.toFixed(1)}°C. Consciousness: ${latestVitals.consciousness}. `;
    }

    const abnormalLabs = recentLabs.filter(l => l.flag !== 'NORMAL');
    if (abnormalLabs.length > 0) {
      assessment += `Pertinent Lab Findings: ${abnormalLabs.map(l => `${l.testName} ${l.value} ${l.unit} [${l.flag}]`).join(", ")}.`;
    } else {
      assessment += "Recent laboratory panel within expected parameters.";
    }

    // 4. RECOMMENDATION
    const pendingOrders = activeOrders.filter(o => o.status === 'ORDERED' || o.status === 'PHARMACY_VERIFIED');
    let recommendation = `Continue current care plan under ${encounter.attendingPhysicianId}. `;
    if (latestVitals && latestVitals.news2Score >= 5) {
      recommendation += `Increase observation frequency to hourly. Ensure critical care team is notified if NEWS2 reaches 7. `;
    }
    if (pendingOrders.length > 0) {
      recommendation += `Follow up on pending orders: ${pendingOrders.map(o => o.title).join(", ")}.`;
    } else {
      recommendation += "Routine rounding and next scheduled medications per eMAR.";
    }

    return {
      patientHeader: {
        name: `${patient.firstName} ${patient.lastName}`,
        mrn: patient.mrn,
        ageSex: `${age}yo ${patient.sex}`,
        bedLocation: bedName,
        codeStatus: encounter.codeStatus,
        attending: encounter.attendingPhysicianId
      },
      situation,
      background,
      assessment,
      recommendation,
      generatedAt: new Date().toISOString()
    };
  }
}
