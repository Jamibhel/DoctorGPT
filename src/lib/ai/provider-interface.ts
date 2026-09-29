import { Patient, SoapNote, ActionItem, DocumentType, GeneratedDocument } from "@/types/clinical";

export interface AIProvider {
  name: string;
  isAvailable: boolean;

  /**
   * Transcribe an audio recording buffer or simulate transcription
   */
  transcribeAudio(audioData: Blob | ArrayBuffer | string): Promise<{
    transcriptText: string;
    turns: { speaker: 'Clinician' | 'Patient' | 'Caregiver'; text: string; timestamp: string }[];
  }>;

  /**
   * Generate a structured SOAP clinical note grounded in patient context & encounter
   */
  generateClinicalNote(
    patient: Patient,
    transcriptText: string,
    additionalNotes?: string
  ): Promise<SoapNote>;

  /**
   * Extract actionable downstream clinical items (referrals, orders, prescriptions, follow-ups)
   */
  extractActions(
    patient: Patient,
    transcriptText: string,
    note: SoapNote
  ): Promise<ActionItem[]>;

  /**
   * Auto-draft a clinical document (e.g. Referral Letter, Patient Instructions, Discharge Summary)
   */
  generateDocument(
    docType: DocumentType,
    patient: Patient,
    note: SoapNote,
    actions: ActionItem[]
  ): Promise<GeneratedDocument>;

  /**
   * Question answering grounded in the patient's existing longitudinal record
   */
  queryPatientRecord(
    patient: Patient,
    question: string
  ): Promise<{ answer: string; evidence: string[] }>;
}
