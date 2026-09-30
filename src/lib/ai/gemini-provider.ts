import { GoogleGenerativeAI } from "@google/generative-ai";
import { Patient, SoapNote, ActionItem, DocumentType, GeneratedDocument } from "@/types/clinical";
import { AIProvider } from "./provider-interface";
import { MockAIProvider } from "./mock-provider";

export class GeminiAIProvider implements AIProvider {
  name = "Google Gemini Clinical Intelligence";
  isAvailable = false;
  private genAI?: GoogleGenerativeAI;
  private fallbackMock = new MockAIProvider();

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (key && key.trim().length > 0) {
      try {
        this.genAI = new GoogleGenerativeAI(key);
        this.isAvailable = true;
      } catch (e) {
        console.warn("Failed to init Gemini, falling back to local provider:", e);
      }
    }
  }

  async transcribeAudio(audioData: Blob | ArrayBuffer | string): Promise<{
    transcriptText: string;
    turns: { speaker: 'Clinician' | 'Patient' | 'Caregiver'; text: string; timestamp: string }[];
  }> {
    // For audio transcription, we use fallback mock or text parse
    return this.fallbackMock.transcribeAudio(audioData);
  }

  async generateClinicalNote(
    patient: Patient,
    transcriptText: string,
    additionalNotes?: string
  ): Promise<SoapNote> {
    if (!this.isAvailable || !this.genAI) {
      return this.fallbackMock.generateClinicalNote(patient, transcriptText, additionalNotes);
    }

    try {
      const patientConditions = Array.isArray((patient as any)?.conditions)
        ? (patient as any).conditions
        : Array.isArray((patient as any)?.activeConditions)
          ? (patient as any).activeConditions
          : [];
      const patientAllergies = Array.isArray((patient as any)?.allergies) ? (patient as any).allergies : [];
      const patientMedications = Array.isArray((patient as any)?.medications) ? (patient as any).medications : [];
      const patientRecentVitals = Array.isArray((patient as any)?.recentVitals) ? (patient as any).recentVitals : [];
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a clinical documentation assistant for a physician.
Patient Context:
- Name: ${patient.firstName ?? 'Patient'} ${patient.lastName ?? ''}, DOB: ${patient.dob ?? (patient as any)?.dateOfBirth ?? 'Unknown'}, Gender: ${patient.gender ?? (patient as any)?.sex ?? 'OTHER'}
- Conditions: ${patientConditions.join(", ") || "None documented"}
- Allergies: ${patientAllergies.map((a: any) => `${a.allergen ?? 'Unknown'} (${a.reaction ?? 'Unspecified'})`).join(", ") || "None reported"}
- Medications: ${patientMedications.map((m: any) => `${m.name ?? 'Medication'} ${m.dosage ?? ''}`).join(", ") || "None on file"}
- Recent Vitals: ${JSON.stringify(patientRecentVitals[0] || {})}

Encounter Transcript:
"""
${transcriptText}
"""

Generate a clinical SOAP note in pure JSON format matching this schema:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "...",
  "summary": "...",
  "citations": [
    {"id": "c1", "quote": "...", "source": "transcript", "mappedSection": "subjective|objective|assessment|plan"}
  ]
}
Return only valid JSON without markdown wrapping.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/^```json/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        ...parsed,
        lastEditedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn("Gemini generation failed, falling back to mock provider:", err);
      return this.fallbackMock.generateClinicalNote(patient, transcriptText, additionalNotes);
    }
  }

  async extractActions(
    patient: Patient,
    transcriptText: string,
    note: SoapNote
  ): Promise<ActionItem[]> {
    if (!this.isAvailable || !this.genAI) {
      return this.fallbackMock.extractActions(patient, transcriptText, note);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extract all downstream clinical actions from this note and encounter.
Categories: REFERRAL, LAB_ORDER, PRESCRIPTION, FOLLOW_UP, PATIENT_INSTRUCTION.
Urgencies: ROUTINE, URGENT, STAT.
Return JSON array of items:
[
  {
    "id": "act-1",
    "type": "REFERRAL",
    "title": "...",
    "description": "...",
    "urgency": "ROUTINE",
    "recipientOrTarget": "...",
    "status": "SUGGESTED",
    "rationale": "..."
  }
]
Note:
${JSON.stringify(note)}

Return only valid JSON.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const cleaned = text.replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      return this.fallbackMock.extractActions(patient, transcriptText, note);
    }
  }

  async generateDocument(
    docType: DocumentType,
    patient: Patient,
    note: SoapNote,
    actions: ActionItem[]
  ): Promise<GeneratedDocument> {
    return this.fallbackMock.generateDocument(docType, patient, note, actions);
  }

  async queryPatientRecord(
    patient: Patient,
    question: string
  ): Promise<{ answer: string; evidence: string[] }> {
    return this.fallbackMock.queryPatientRecord(patient, question);
  }
}
