/**
 * HL7 FHIR R4 Standardization & Mapping Service
 * Converts internal clinical models to and from compliant FHIR Release 4 JSON representations.
 */

import { 
  Patient, 
  Encounter, 
  VitalSignObservation, 
  CPOEOrder, 
  DiagnosticLabResult, 
  RadiologyStudy 
} from "@/types/hospital";
import { 
  FhirPatient, 
  FhirEncounter, 
  FhirObservation, 
  FhirCondition, 
  FhirMedicationRequest, 
  FhirDiagnosticReport, 
  FhirBundle, 
  FhirBundleEntry 
} from "@/types/fhir";

export class FhirMapperService {

  /**
   * Maps BJI internal Patient model to FHIR R4 Patient Resource
   */
  public static mapPatientToFhir(patient: Patient): FhirPatient {
    return {
      resourceType: "Patient",
      id: patient.id.replace("Patient/", ""),
      identifier: [
        {
          use: "official",
          system: "http://bji.health/mrn",
          value: patient.mrn,
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR",
                display: "Medical Record Number"
              }
            ],
            text: "Hospital Master MRN"
          }
        }
      ],
      active: true,
      name: [
        {
          use: "official",
          family: patient.lastName,
          given: [patient.firstName],
          text: `${patient.lastName}, ${patient.firstName}`
        }
      ],
      telecom: patient.phone ? [
        {
          system: "phone",
          value: patient.phone,
          use: "mobile"
        }
      ] : undefined,
      gender: patient.sex === "M" ? "male" : patient.sex === "F" ? "female" : "other",
      birthDate: patient.dateOfBirth,
      address: patient.address ? [
        {
          use: "home",
          line: [patient.address],
          city: "New York",
          state: "NY",
          country: "USA",
          text: patient.address
        }
      ] : undefined,
      managingOrganization: {
        reference: `Organization/${patient.facilityId}`,
        display: "BJI Healthcare System"
      }
    };
  }

  /**
   * Maps BJI Encounter model to FHIR R4 Encounter Resource
   */
  public static mapEncounterToFhir(encounter: Encounter, patient: Patient): FhirEncounter {
    const classCode = 
      encounter.encounterClass === "INPATIENT" ? "IMP" :
      encounter.encounterClass === "EMERGENCY" ? "EMER" : "AMB";

    const classDisplay = 
      encounter.encounterClass === "INPATIENT" ? "inpatient encounter" :
      encounter.encounterClass === "EMERGENCY" ? "emergency" : "ambulatory";

    const statusMap: Record<string, FhirEncounter['status']> = {
      PLANNED: "planned",
      IN_TRIAGE: "triaged",
      ACTIVE: "in-progress",
      DISCHARGE_PENDING: "in-progress",
      DISCHARGED: "finished",
      CANCELLED: "cancelled"
    };

    return {
      resourceType: "Encounter",
      id: encounter.id.replace("Encounter/", ""),
      status: statusMap[encounter.status] || "in-progress",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: classCode,
        display: classDisplay
      },
      subject: {
        reference: `Patient/${patient.id.replace("Patient/", "")}`,
        display: `${patient.lastName}, ${patient.firstName}`
      },
      period: {
        start: encounter.admittedAt,
        end: encounter.dischargedAt
      },
      reasonCode: [
        {
          text: encounter.admittingDiagnosis
        }
      ],
      hospitalization: {
        dischargeDisposition: encounter.dischargedAt ? {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/discharge-disposition",
              code: "home",
              display: "Home or Community Care"
            }
          ]
        } : undefined
      },
      serviceProvider: {
        reference: `Organization/${encounter.facilityId}`,
        display: "BJI Healthcare Facility"
      }
    };
  }

  /**
   * Maps BJI VitalSignObservation to a set of LOINC-coded FHIR Observations
   */
  public static mapObservationToFhir(obs: VitalSignObservation, patient: Patient): FhirObservation[] {
    const patientRef = {
      reference: `Patient/${patient.id.replace("Patient/", "")}`,
      display: `${patient.lastName}, ${patient.firstName}`
    };
    const encounterRef = {
      reference: `Encounter/${obs.encounterId.replace("Encounter/", "")}`
    };

    const vitalCategory = [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs"
          }
        ]
      }
    ];

    const results: FhirObservation[] = [];

    // 1. Heart Rate (LOINC 8867-4)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-hr`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
        text: "Heart Rate"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.heartRate,
        unit: "beats/minute",
        system: "http://unitsofmeasure.org",
        code: "/min"
      }
    });

    // 2. Systolic Blood Pressure (LOINC 8480-6)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-sbp`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
        text: "Systolic Blood Pressure"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.systolicBP,
        unit: "mmHg",
        system: "http://unitsofmeasure.org",
        code: "mm[Hg]"
      }
    });

    // 3. Diastolic Blood Pressure (LOINC 8462-4)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-dbp`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
        text: "Diastolic Blood Pressure"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.diastolicBP,
        unit: "mmHg",
        system: "http://unitsofmeasure.org",
        code: "mm[Hg]"
      }
    });

    // 4. Oxygen Saturation (LOINC 2708-6)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-spo2`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "2708-6", display: "Oxygen saturation in Arterial blood" }],
        text: "SpO2 (Pulse Oximetry)"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.spO2,
        unit: "%",
        system: "http://unitsofmeasure.org",
        code: "%"
      }
    });

    // 5. Respiration Rate (LOINC 9279-1)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-rr`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "9279-1", display: "Respiratory rate" }],
        text: "Respiratory Rate"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.respirationRate,
        unit: "breaths/minute",
        system: "http://unitsofmeasure.org",
        code: "/min"
      }
    });

    // 6. Body Temperature (LOINC 8310-5)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-temp`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "8310-5", display: "Body temperature" }],
        text: "Body Temperature"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.temperatureCelsius,
        unit: "Cel",
        system: "http://unitsofmeasure.org",
        code: "Cel"
      }
    });

    // 7. National Early Warning Score (NEWS2) (LOINC 96552-5)
    results.push({
      resourceType: "Observation",
      id: `${obs.id.replace("Observation/", "")}-news2`,
      status: "final",
      category: vitalCategory,
      code: {
        coding: [{ system: "http://loinc.org", code: "96552-5", display: "National Early Warning Score 2" }],
        text: "NEWS2 Total Clinical Deterioration Score"
      },
      subject: patientRef,
      encounter: encounterRef,
      effectiveDateTime: obs.timestamp,
      valueQuantity: {
        value: obs.news2Score,
        unit: "score",
        system: "http://unitsofmeasure.org",
        code: "{score}"
      },
      interpretation: [
        {
          text: obs.news2RiskTier
        }
      ]
    });

    return results;
  }

  /**
   * Maps Patient conditions to FHIR R4 Condition Resources
   */
  public static mapConditionsToFhir(patient: Patient): FhirCondition[] {
    const patientRef = {
      reference: `Patient/${patient.id.replace("Patient/", "")}`,
      display: `${patient.lastName}, ${patient.firstName}`
    };

    return (patient.activeConditions || []).map((condText, idx) => ({
      resourceType: "Condition",
      id: `cond-${patient.id.replace("Patient/", "")}-${idx + 1}`,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active"
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed",
            display: "Confirmed"
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "problem-list-item",
              display: "Problem List Item"
            }
          ]
        }
      ],
      code: {
        text: condText
      },
      subject: patientRef,
      recordedDate: patient.createdAt
    }));
  }

  /**
   * Maps CPOEOrder to FHIR R4 MedicationRequest
   */
  public static mapOrderToFhirMedicationRequest(order: CPOEOrder, patient: Patient): FhirMedicationRequest | null {
    if (order.orderType !== "MEDICATION") return null;

    const patientRef = {
      reference: `Patient/${patient.id.replace("Patient/", "")}`,
      display: `${patient.lastName}, ${patient.firstName}`
    };

    return {
      resourceType: "MedicationRequest",
      id: order.id.replace("Order/", "").replace("MedicationRequest/", ""),
      status: order.status === "COMPLETED" ? "completed" :
              order.status === "DISCONTINUED" || order.status === "CANCELLED" ? "stopped" : "active",
      intent: "order",
      priority: order.priority === "STAT" ? "stat" : order.priority === "URGENT" ? "urgent" : "routine",
      medicationCodeableConcept: {
        coding: [
          {
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            code: order.medicationDetails?.rxNormCode || "RxNorm-BJI",
            display: order.medicationDetails?.drugName || order.title
          }
        ],
        text: order.title
      },
      subject: patientRef,
      encounter: {
        reference: `Encounter/${order.encounterId.replace("Encounter/", "")}`
      },
      authoredOn: order.orderedAt,
      requester: {
        reference: `Practitioner/${order.orderedBy}`,
        display: order.orderedBy
      },
      dosageInstruction: [
        {
          text: order.description,
          route: {
            text: order.medicationDetails?.route || "ORAL"
          }
        }
      ]
    };
  }

  /**
   * Maps Lab Result to FHIR DiagnosticReport
   */
  public static mapLabToDiagnosticReport(lab: DiagnosticLabResult, patient: Patient): FhirDiagnosticReport {
    return {
      resourceType: "DiagnosticReport",
      id: lab.id.replace("DiagnosticReport/", "").replace("Lab/", ""),
      status: lab.status === "FINAL" ? "final" : "preliminary",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0074",
              code: "LAB",
              display: "Laboratory"
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: lab.testCode,
            display: lab.testName
          }
        ],
        text: lab.testName
      },
      subject: {
        reference: `Patient/${patient.id.replace("Patient/", "")}`,
        display: `${patient.lastName}, ${patient.firstName}`
      },
      encounter: {
        reference: `Encounter/${lab.encounterId.replace("Encounter/", "")}`
      },
      effectiveDateTime: lab.collectedAt,
      issued: lab.resultedAt,
      conclusion: `${lab.testName}: ${lab.value} ${lab.unit} (${lab.interpretation})`
    };
  }

  /**
   * Generates a complete, compliant FHIR R4 Bundle for an active patient
   */
  public static generatePatientBundle(
    patient: Patient,
    encounters: Encounter[],
    observations: VitalSignObservation[],
    labs: DiagnosticLabResult[],
    orders: CPOEOrder[],
    bundleType: 'collection' | 'transaction' = 'collection'
  ): FhirBundle {
    const entries: FhirBundleEntry[] = [];

    // 1. Patient Resource
    const fhirPatient = this.mapPatientToFhir(patient);
    entries.push({
      fullUrl: `urn:uuid:${fhirPatient.id}`,
      resource: fhirPatient,
      request: bundleType === 'transaction' ? { method: 'POST', url: 'Patient' } : undefined
    });

    // 2. Encounters
    encounters.forEach(enc => {
      const fhirEnc = this.mapEncounterToFhir(enc, patient);
      entries.push({
        fullUrl: `urn:uuid:${fhirEnc.id}`,
        resource: fhirEnc,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'Encounter' } : undefined
      });
    });

    // 3. Conditions
    const conditions = this.mapConditionsToFhir(patient);
    conditions.forEach(cond => {
      entries.push({
        fullUrl: `urn:uuid:${cond.id}`,
        resource: cond,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'Condition' } : undefined
      });
    });

    // 4. Observations (Vitals)
    observations.forEach(obs => {
      const fhirObsList = this.mapObservationToFhir(obs, patient);
      fhirObsList.forEach(item => {
        entries.push({
          fullUrl: `urn:uuid:${item.id}`,
          resource: item,
          request: bundleType === 'transaction' ? { method: 'POST', url: 'Observation' } : undefined
        });
      });
    });

    // 5. MedicationRequests
    orders.forEach(order => {
      const medReq = this.mapOrderToFhirMedicationRequest(order, patient);
      if (medReq) {
        entries.push({
          fullUrl: `urn:uuid:${medReq.id}`,
          resource: medReq,
          request: bundleType === 'transaction' ? { method: 'POST', url: 'MedicationRequest' } : undefined
        });
      }
    });

    // 6. Diagnostic Reports (Labs)
    labs.forEach(lab => {
      const diagRep = this.mapLabToDiagnosticReport(lab, patient);
      entries.push({
        fullUrl: `urn:uuid:${diagRep.id}`,
        resource: diagRep,
        request: bundleType === 'transaction' ? { method: 'POST', url: 'DiagnosticReport' } : undefined
      });
    });

    return {
      resourceType: "Bundle",
      id: `bundle-pat-${patient.mrn}-${Date.now()}`,
      type: bundleType,
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries
    };
  }

  /**
   * Fast FHIR R4 Schema Validator
   */
  public static validateFhirResource(resource: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!resource || typeof resource !== 'object') {
      return { isValid: false, issues: ["Resource is null or not a valid JSON object"] };
    }

    if (!resource.resourceType) {
      issues.push("Missing required top-level property 'resourceType'");
    }

    if (!resource.id && resource.resourceType !== 'Bundle') {
      issues.push("Missing required field 'id'");
    }

    if (resource.resourceType === 'Patient') {
      if (!resource.name || !Array.isArray(resource.name) || resource.name.length === 0) {
        issues.push("Patient must have at least one 'name' array entry");
      }
      if (!resource.gender) {
        issues.push("Patient must have 'gender'");
      }
    }

    if (resource.resourceType === 'Observation') {
      if (!resource.code || !resource.code.coding) {
        issues.push("Observation requires a valid 'code' with LOINC/SNOMED codings");
      }
      if (!resource.status) {
        issues.push("Observation requires 'status'");
      }
      if (!resource.subject) {
        issues.push("Observation requires 'subject' reference");
      }
    }

    if (resource.resourceType === 'Bundle') {
      if (!resource.type) {
        issues.push("Bundle requires 'type' (e.g. collection, transaction)");
      }
      if (!Array.isArray(resource.entry)) {
        issues.push("Bundle requires 'entry' array");
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * SMART-on-FHIR REST API Query Engine Simulation
   */
  public static simulateFhirRestQuery(
    endpoint: string,
    params: Record<string, string>,
    context: {
      patient: Patient;
      encounters: Encounter[];
      observations: VitalSignObservation[];
      labs: DiagnosticLabResult[];
      orders: CPOEOrder[];
    }
  ): {
    status: number;
    statusText: string;
    latencyMs: number;
    headers: Record<string, string>;
    data: any;
  } {
    const startTime = Date.now();
    const cleanEndpoint = endpoint.trim().split("?")[0].replace(/^\//, "");

    let responseData: any = null;
    let status = 200;
    let statusText = "OK";

    if (cleanEndpoint === "Patient" || cleanEndpoint === `Patient/${context.patient.id.replace("Patient/", "")}`) {
      responseData = this.mapPatientToFhir(context.patient);
    } else if (cleanEndpoint === "Observation") {
      const allObs = context.observations.flatMap(o => this.mapObservationToFhir(o, context.patient));
      responseData = {
        resourceType: "Bundle",
        type: "searchset",
        total: allObs.length,
        entry: allObs.map(obs => ({ resource: obs }))
      };
    } else if (cleanEndpoint === "Condition") {
      const conditions = this.mapConditionsToFhir(context.patient);
      responseData = {
        resourceType: "Bundle",
        type: "searchset",
        total: conditions.length,
        entry: conditions.map(c => ({ resource: c }))
      };
    } else if (cleanEndpoint === "MedicationRequest") {
      const medRequests = context.orders
        .map(o => this.mapOrderToFhirMedicationRequest(o, context.patient))
        .filter(Boolean);
      responseData = {
        resourceType: "Bundle",
        type: "searchset",
        total: medRequests.length,
        entry: medRequests.map(m => ({ resource: m }))
      };
    } else if (cleanEndpoint === "DiagnosticReport") {
      const reports = context.labs.map(l => this.mapLabToDiagnosticReport(l, context.patient));
      responseData = {
        resourceType: "Bundle",
        type: "searchset",
        total: reports.length,
        entry: reports.map(r => ({ resource: r }))
      };
    } else if (cleanEndpoint === "Bundle" || cleanEndpoint === "$everything") {
      responseData = this.generatePatientBundle(
        context.patient,
        context.encounters,
        context.observations,
        context.labs,
        context.orders,
        'collection'
      );
    } else {
      status = 404;
      statusText = "Not Found";
      responseData = {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "not-found",
            diagnostics: `Resource or search path '/${cleanEndpoint}' not supported on this FHIR R4 server.`
          }
        ]
      };
    }

    const latencyMs = Math.floor(Math.random() * 25) + 12;

    return {
      status,
      statusText,
      latencyMs,
      headers: {
        "content-type": "application/fhir+json;charset=utf-8",
        "x-fhir-version": "4.0.1",
        "x-powered-by": "BJI MediSupport FHIR R4 Engine",
        "access-control-allow-origin": "*",
        "etag": `W/"${Date.now()}"`
      },
      data: responseData
    };
  }

}
