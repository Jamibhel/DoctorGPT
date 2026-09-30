/**
 * HospitalOS Automated Test Suite for Clinical Services
 * Tests NEWS2 Scoring Engine, Deterministic CDS Safety Engine, and SBAR Generation.
 */

import { calculateNEWS2 } from "../news2";
import { CDSSafetyEngine } from "../cds-engine";
import { SBARService } from "../sbar-service";
import { Patient, CPOEOrder, DiagnosticLabResult, Encounter, HospitalBed } from "@/types/hospital";

export function runClinicalUnitTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // TEST 1: NEWS2 Normal Vitals -> Score 0, LOW risk
  try {
    const normal = calculateNEWS2({
      respirationRate: 16,
      spO2: 98,
      spO2Scale: 1,
      supplementalOxygen: false,
      temperatureCelsius: 37.0,
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 72,
      consciousness: 'ALERT'
    });
    if (normal.totalScore !== 0 || normal.riskTier !== 'LOW') {
      throw new Error(`Expected score 0 and LOW, got ${normal.totalScore} and ${normal.riskTier}`);
    }
    results.push({ name: "NEWS2: Normal vitals calculate score 0 (LOW risk)", passed: true });
  } catch (err: any) {
    results.push({ name: "NEWS2: Normal vitals calculate score 0 (LOW risk)", passed: false, error: err.message });
  }

  // TEST 2: NEWS2 Critical Sepsis / Shock -> Score >= 7, HIGH risk
  try {
    const critical = calculateNEWS2({
      respirationRate: 28, // +3
      spO2: 90, // +3 (Scale 1)
      spO2Scale: 1,
      supplementalOxygen: true, // +2
      temperatureCelsius: 39.4, // +2
      systolicBP: 88, // +3
      diastolicBP: 50,
      heartRate: 135, // +3
      consciousness: 'CVPU_VOICE' // +3
    });
    // Expected: 3+3+2+2+3+3+3 = 19 points
    if (critical.totalScore < 7 || critical.riskTier !== 'HIGH') {
      throw new Error(`Expected score >= 7 and HIGH risk, got ${critical.totalScore} and ${critical.riskTier}`);
    }
    results.push({ name: "NEWS2: Critical sepsis vitals calculate score >= 7 (HIGH risk)", passed: true });
  } catch (err: any) {
    results.push({ name: "NEWS2: Critical sepsis vitals calculate score >= 7 (HIGH risk)", passed: false, error: err.message });
  }

  // TEST 3: NEWS2 Scale 2 Hypercapnic COPD on target 90% SpO2 -> 0 points for SpO2
  try {
    const copdOnTarget = calculateNEWS2({
      respirationRate: 18,
      spO2: 90, // 88-92% target on Scale 2 = 0 points
      spO2Scale: 2,
      supplementalOxygen: false,
      temperatureCelsius: 36.8,
      systolicBP: 128,
      diastolicBP: 76,
      heartRate: 80,
      consciousness: 'ALERT'
    });
    if (copdOnTarget.totalScore !== 0) {
      throw new Error(`Expected score 0 on COPD Scale 2 with 90% SpO2, got ${copdOnTarget.totalScore}`);
    }
    results.push({ name: "NEWS2: Scale 2 Hypercapnic target 88-92% calculates 0 points", passed: true });
  } catch (err: any) {
    results.push({ name: "NEWS2: Scale 2 Hypercapnic target 88-92% calculates 0 points", passed: false, error: err.message });
  }

  // TEST 4: CDS Drug-Allergy Intercept (Penicillin allergy vs Amoxicillin)
  try {
    const patientWithPenicillinAllergy: Patient = {
      id: "Patient/test-1",
      mrn: "TEST-001",
      firstName: "Test",
      lastName: "Patient",
      dateOfBirth: "1980-01-01",
      sex: "F",
      bloodType: "A+",
      phone: "555-0000",
      address: "123 Test St",
      emergencyContact: { name: "Contact", relationship: "Spouse", phone: "555-0001" },
      allergies: [
        {
          id: "all-1",
          allergen: "Penicillin",
          category: "MEDICATION",
          reaction: "Anaphylaxis",
          severity: "SEVERE",
          verificationStatus: "CONFIRMED",
          recordedAt: "2026-01-01",
          recordedBy: "doc-1",
          version: 1
        }
      ],
      activeConditions: [],
      primaryLanguage: "English",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01"
    };

    const alerts = CDSSafetyEngine.evaluateOrder(
      "Amoxicillin-Clavulanate 875 mg Oral Tablet",
      "MEDICATION",
      patientWithPenicillinAllergy,
      [],
      []
    );

    const hasCriticalAllergyAlert = alerts.some(
      a => a.type === 'DRUG_ALLERGY' && a.severity === 'CRITICAL_CONTRAINDICATION'
    );
    if (!hasCriticalAllergyAlert) {
      throw new Error("Expected CRITICAL_CONTRAINDICATION for Amoxicillin with Penicillin allergy");
    }
    results.push({ name: "CDS Engine: Penicillin allergy triggers critical contraindication on Amoxicillin", passed: true });
  } catch (err: any) {
    results.push({ name: "CDS Engine: Penicillin allergy triggers critical contraindication on Amoxicillin", passed: false, error: err.message });
  }

  // TEST 5: CDS Drug-Drug Interaction (Warfarin + Ibuprofen)
  try {
    const activeOrders: CPOEOrder[] = [
      {
        id: "ord-1",
        encounterId: "enc-1",
        patientId: "Patient/test-1",
        orderType: "MEDICATION",
        priority: "ROUTINE",
        status: "ACTIVE",
        orderedAt: "2026-01-01",
        orderedBy: "doc-1",
        title: "Warfarin Sodium 5 mg Oral Tablet",
        description: "Anticoagulation",
        medicationDetails: {
          drugName: "Warfarin",
          genericName: "Warfarin Sodium",
          dosage: "5 mg",
          route: "ORAL",
          frequency: "Daily",
          indication: "Afib",
          scheduleTimes: ["18:00"]
        }
      }
    ];

    const alerts = CDSSafetyEngine.evaluateOrder(
      "Ibuprofen 600 mg Oral Tablet",
      "MEDICATION",
      { id: "p1", allergies: [] } as any,
      activeOrders,
      []
    );

    const hasDDI = alerts.some(a => a.type === 'DRUG_DRUG');
    if (!hasDDI) {
      throw new Error("Expected DRUG_DRUG alert for Warfarin + Ibuprofen");
    }
    results.push({ name: "CDS Engine: Warfarin + Ibuprofen triggers DDI bleeding risk alert", passed: true });
  } catch (err: any) {
    results.push({ name: "CDS Engine: Warfarin + Ibuprofen triggers DDI bleeding risk alert", passed: false, error: err.message });
  }

  return results;
}
