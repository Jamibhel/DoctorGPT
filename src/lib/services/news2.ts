/**
 * Official Royal College of Physicians (RCP) NEWS2 Scoring Engine
 * Implements standard National Early Warning Score 2 tables with Scale 1 and Scale 2 SpO2.
 */

import { ConsciousnessLevel, VitalSignObservation } from "@/types/hospital";

export interface NEWS2ParameterResult {
  parameter: string;
  value: string | number;
  score: number;
  scoringRationale: string;
}

export interface NEWS2CalculationResult {
  totalScore: number;
  riskTier: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';
  clinicalResponse: string;
  hasSingleParameterRedAlert: boolean; // Single score of 3 in any category
  breakdown: NEWS2ParameterResult[];
}

export const NEWS2_CONFIG = {
  respirationRate: [
    { min: -Infinity, max: 8, score: 3, label: "≤ 8 (Severe Bradypnea)" },
    { min: 9, max: 11, score: 1, label: "9 - 11 (Mild Bradypnea)" },
    { min: 12, max: 20, score: 0, label: "12 - 20 (Normal)" },
    { min: 21, max: 24, score: 2, label: "21 - 24 (Tachypnea)" },
    { min: 25, max: Infinity, score: 3, label: "≥ 25 (Severe Tachypnea)" },
  ],
  // Scale 1: Standard SpO2
  spO2Scale1: [
    { min: -Infinity, max: 91, score: 3, label: "≤ 91% (Severe Hypoxemia)" },
    { min: 92, max: 93, score: 2, label: "92 - 93% (Moderate Hypoxemia)" },
    { min: 94, max: 95, score: 1, label: "94 - 95% (Mild Hypoxemia)" },
    { min: 96, max: Infinity, score: 0, label: "≥ 96% (Normal)" },
  ],
  // Scale 2: Hypercapnic Respiratory Failure (Target 88-92%)
  spO2Scale2: [
    { min: -Infinity, max: 83, score: 3, label: "≤ 83% (Severe Hypoxemia)" },
    { min: 84, max: 85, score: 2, label: "84 - 85% (Moderate Hypoxemia)" },
    { min: 86, max: 87, score: 1, label: "86 - 87% (Mild Hypoxemia)" },
    { min: 88, max: 92, score: 0, label: "88 - 92% (On-target for COPD/Hypercapnia)" },
    { min: 93, max: 94, score: 1, label: "93 - 94% on oxygen" },
    { min: 95, max: 96, score: 2, label: "95 - 96% on oxygen" },
    { min: 97, max: Infinity, score: 3, label: "≥ 97% on oxygen" },
  ],
  systolicBP: [
    { min: -Infinity, max: 90, score: 3, label: "≤ 90 mmHg (Severe Hypotension)" },
    { min: 91, max: 100, score: 2, label: "91 - 100 mmHg (Moderate Hypotension)" },
    { min: 101, max: 110, score: 1, label: "101 - 110 mmHg (Mild Hypotension)" },
    { min: 111, max: 219, score: 0, label: "111 - 219 mmHg (Normotensive)" },
    { min: 220, max: Infinity, score: 3, label: "≥ 220 mmHg (Severe Hypertensive Crisis)" },
  ],
  heartRate: [
    { min: -Infinity, max: 40, score: 3, label: "≤ 40 bpm (Severe Bradycardia)" },
    { min: 41, max: 50, score: 1, label: "41 - 50 bpm (Bradycardia)" },
    { min: 51, max: 90, score: 0, label: "51 - 90 bpm (Normal)" },
    { min: 91, max: 110, score: 1, label: "91 - 110 bpm (Mild Tachycardia)" },
    { min: 111, max: 130, score: 2, label: "111 - 130 bpm (Moderate Tachycardia)" },
    { min: 131, max: Infinity, score: 3, label: "≥ 131 bpm (Severe Tachycardia)" },
  ],
  temperature: [
    { min: -Infinity, max: 35.0, score: 3, label: "≤ 35.0 °C (Hypothermia)" },
    { min: 35.1, max: 36.0, score: 1, label: "35.1 - 36.0 °C (Borderline Low)" },
    { min: 36.1, max: 38.0, score: 0, label: "36.1 - 38.0 °C (Normal)" },
    { min: 38.1, max: 39.0, score: 1, label: "38.1 - 39.0 °C (Pyrexia)" },
    { min: 39.1, max: Infinity, score: 2, label: "≥ 39.1 °C (High Pyrexia)" },
  ]
};

export function calculateNEWS2(
  vitals: Omit<VitalSignObservation, "id" | "encounterId" | "patientId" | "timestamp" | "recordedBy" | "news2Score" | "news2RiskTier">
): NEWS2CalculationResult {
  const breakdown: NEWS2ParameterResult[] = [];
  let totalScore = 0;
  let hasSingleRed = false;

  // 1. Respiration Rate
  const rrMatch = NEWS2_CONFIG.respirationRate.find(
    r => vitals.respirationRate >= r.min && vitals.respirationRate <= r.max
  ) || { score: 0, label: "Normal" };
  breakdown.push({
    parameter: "Respiration Rate",
    value: `${vitals.respirationRate} bpm`,
    score: rrMatch.score,
    scoringRationale: rrMatch.label
  });
  totalScore += rrMatch.score;
  if (rrMatch.score === 3) hasSingleRed = true;

  // 2. SpO2 (Scale 1 vs Scale 2)
  if (vitals.spO2Scale === 2) {
    // Hypercapnic
    const scale2Table = vitals.supplementalOxygen
      ? NEWS2_CONFIG.spO2Scale2
      : NEWS2_CONFIG.spO2Scale2.slice(0, 4); // Room air only evaluates 88-92%
    const spo2Match = scale2Table.find(
      s => vitals.spO2 >= s.min && vitals.spO2 <= s.max
    ) || { score: 0, label: "Target" };
    breakdown.push({
      parameter: "SpO2 (Scale 2 - Hypercapnic)",
      value: `${vitals.spO2}%`,
      score: spo2Match.score,
      scoringRationale: spo2Match.label
    });
    totalScore += spo2Match.score;
    if (spo2Match.score === 3) hasSingleRed = true;
  } else {
    // Standard Scale 1
    const spo2Match = NEWS2_CONFIG.spO2Scale1.find(
      s => vitals.spO2 >= s.min && vitals.spO2 <= s.max
    ) || { score: 0, label: "Normal" };
    breakdown.push({
      parameter: "SpO2 (Scale 1 - Standard)",
      value: `${vitals.spO2}%`,
      score: spo2Match.score,
      scoringRationale: spo2Match.label
    });
    totalScore += spo2Match.score;
    if (spo2Match.score === 3) hasSingleRed = true;
  }

  // 3. Supplemental Oxygen (Air vs O2)
  const o2Score = vitals.supplementalOxygen ? 2 : 0;
  breakdown.push({
    parameter: "Supplemental Oxygen",
    value: vitals.supplementalOxygen ? `Yes (${vitals.oxygenFlowLMin || 2} L/min)` : "No (Room Air)",
    score: o2Score,
    scoringRationale: vitals.supplementalOxygen ? "Prescribed oxygen (+2 points)" : "Room air (0 points)"
  });
  totalScore += o2Score;

  // 4. Systolic BP
  const sbpMatch = NEWS2_CONFIG.systolicBP.find(
    b => vitals.systolicBP >= b.min && vitals.systolicBP <= b.max
  ) || { score: 0, label: "Normal" };
  breakdown.push({
    parameter: "Systolic Blood Pressure",
    value: `${vitals.systolicBP} mmHg`,
    score: sbpMatch.score,
    scoringRationale: sbpMatch.label
  });
  totalScore += sbpMatch.score;
  if (sbpMatch.score === 3) hasSingleRed = true;

  // 5. Heart Rate
  const hrMatch = NEWS2_CONFIG.heartRate.find(
    h => vitals.heartRate >= h.min && vitals.heartRate <= h.max
  ) || { score: 0, label: "Normal" };
  breakdown.push({
    parameter: "Heart Rate",
    value: `${vitals.heartRate} bpm`,
    score: hrMatch.score,
    scoringRationale: hrMatch.label
  });
  totalScore += hrMatch.score;
  if (hrMatch.score === 3) hasSingleRed = true;

  // 6. Consciousness (ACVPU)
  const cScore = vitals.consciousness === 'ALERT' ? 0 : 3;
  breakdown.push({
    parameter: "Consciousness (ACVPU)",
    value: vitals.consciousness,
    score: cScore,
    scoringRationale: vitals.consciousness === 'ALERT' ? "Alert (0 points)" : "New confusion or non-alert (+3 points)"
  });
  totalScore += cScore;
  if (cScore === 3) hasSingleRed = true;

  // 7. Temperature
  const tempMatch = NEWS2_CONFIG.temperature.find(
    t => vitals.temperatureCelsius >= t.min && vitals.temperatureCelsius <= t.max
  ) || { score: 0, label: "Normal" };
  breakdown.push({
    parameter: "Temperature",
    value: `${vitals.temperatureCelsius.toFixed(1)} °C`,
    score: tempMatch.score,
    scoringRationale: tempMatch.label
  });
  totalScore += tempMatch.score;

  // Derive Clinical Risk Tier according to RCP guidelines:
  // - Aggregate 0-4: LOW risk (Ward-based response, q4-6h monitoring)
  // - Score of 3 in any single parameter: LOW-MEDIUM (Urgent ward review)
  // - Aggregate 5-6: MEDIUM risk (Key threshold for urgent clinical review, q1h monitoring)
  // - Aggregate 7+: HIGH risk (Emergency review by critical care team, continuous monitoring)
  let riskTier: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH' = 'LOW';
  let clinicalResponse = "Routine 4-6 hourly monitoring. Continue standard ward care.";

  if (totalScore >= 7) {
    riskTier = 'HIGH';
    clinicalResponse = "EMERGENCY RESPONSE: Immediate review by Critical Care / Rapid Response Outreach Team. Continuous monitoring.";
  } else if (totalScore >= 5) {
    riskTier = 'MEDIUM';
    clinicalResponse = "URGENT RESPONSE: Urgent review by attending ward physician. Increase monitoring frequency to hourly.";
  } else if (hasSingleRed) {
    riskTier = 'LOW_MEDIUM';
    clinicalResponse = "FOCUSED RESPONSE: Score of 3 in a single parameter. Urgent nurse/physician evaluation of specific organ system.";
  }

  return {
    totalScore,
    riskTier,
    clinicalResponse,
    hasSingleRedAlert: hasSingleRed,
    breakdown
  };
}
