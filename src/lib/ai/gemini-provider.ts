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
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a clinical documentation assistant for a physician.
Patient Context:
- Name: ${patient.firstName} ${patient.lastName}, DOB: ${patient.dob}, Gender: ${patient.gender}
- Conditions: ${patient.conditions.join(", ")}
- Allergies: ${patient.allergies.map(a => `${a.allergen} (${a.reaction})`).join(", ")}
- Medications: ${patient.medications.map(m => `${m.name} ${m.dosage}`).join(", ")}
- Recent Vitals: ${JSON.stringify(patient.recentVitals[0] || {})}

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
