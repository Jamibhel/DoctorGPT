import { db } from "./config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  serverTimestamp 
} from "firebase/firestore";
import { Encounter, AuditEntry, Patient } from "@/types/clinical";

/**
 * Persist an approved or active encounter to Cloud Firestore
 */
export async function saveEncounterToFirestore(encounter: Encounter, facilityId: string): Promise<boolean> {
  try {
    const encounterRef = doc(db, "encounters", encounter.id);
    await setDoc(encounterRef, {
      ...encounter,
      facilityId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Failed to persist encounter to Firestore (offline fallback active):", err);
    return false;
  }
}

/**
 * Retrieve past encounters for a patient from Firestore
 */
export async function getPatientEncountersFromFirestore(patientId: string, facilityId: string): Promise<Encounter[]> {
  try {
    const encountersRef = collection(db, "encounters");
    const q = query(
      encountersRef, 
      where("patientId", "==", patientId),
      where("facilityId", "==", facilityId),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Encounter);
  } catch (err) {
    console.warn("Failed to fetch encounters from Firestore:", err);
    return [];
  }
}

/**
 * Log an audit trail item to Cloud Firestore for immutable remote compliance
 */
export async function logAuditToFirestore(entry: AuditEntry, facilityId: string, actorId: string): Promise<boolean> {
  try {
    const auditRef = collection(db, "audit_logs");
    await addDoc(auditRef, {
      ...entry,
      facilityId,
      actorId,
      serverTime: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn("Failed to log audit entry to Firestore:", err);
    return false;
  }
}
