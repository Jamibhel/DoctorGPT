import { auth, db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { FacilityType } from "@/lib/platform/mock-platform";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

type FirebaseOrganizationSetupResult = {
  organizationId: string;
  facilityId: string;
  adminId: string;
  adminEmail: string;
  organizationName: string;
  billingAddress: string;
  facilityName: string;
  facilityType: FacilityType;
  city: string;
  timezone: string;
  adminName: string;
  recovered: boolean;
};
export const isFirebaseReady = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && db && auth);
};

export async function getFirebaseWorkspaceSnapshot(): Promise<{
  organization: Record<string, unknown> | null;
  facility: Record<string, unknown> | null;
  staff: Record<string, unknown>[];
  patients: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
} | null> {
  const user = auth.currentUser;
  if (!isFirebaseReady() || !user) {
    return null;
  }

  const ownStaffSnapshot = await getDoc(doc(db, "staff", user.uid));
  if (!ownStaffSnapshot.exists()) {
    return null;
  }

  const ownStaff = ownStaffSnapshot.data();
  const facilityId = String(ownStaff.facilityId ?? "");
  const organizationId = String(ownStaff.organizationId ?? "");
  if (!facilityId || !organizationId || ownStaff.status !== "active") {
    return null;
  }

  const [organizationSnapshot, facilitySnapshot, staffSnapshot, patientSnapshot, appointmentSnapshot] = await Promise.all([
    getDoc(doc(db, "organizations", organizationId)),
    getDoc(doc(db, "facilities", facilityId)),
    getDocs(query(collection(db, "staff"), where("facilityId", "==", facilityId))),
    getDocs(query(collection(db, "patients"), where("facilityId", "==", facilityId))),
    getDocs(query(collection(db, "appointments"), where("facilityId", "==", facilityId))),
  ]);

  return {
    organization: organizationSnapshot.exists() ? organizationSnapshot.data() : null,
    facility: facilitySnapshot.exists() ? facilitySnapshot.data() : null,
    staff: staffSnapshot.docs.map((snapshot) => snapshot.data()),
    patients: patientSnapshot.docs.map((snapshot) => snapshot.data()),
    appointments: appointmentSnapshot.docs.map((snapshot) => snapshot.data()),
  };
}

export type FirebaseStaffRecord = {
  id: string;
  organizationId: string;
  facilityId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  facilityName?: string;
  facilityType?: string;
  status: "active" | "invited";
  mailingAddress?: string;
  createdAt: string;
};

export type FirebaseStaffProfile = {
  staff: FirebaseStaffRecord;
  facility: Record<string, unknown>;
};

export async function beginFirebaseAdminSignup({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  if (!evaluatePasswordStrength(password).isStrong) {
    throw new Error("Use at least 12 characters with lowercase and uppercase letters, a number, and a symbol.");
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await sendEmailVerification(credential.user);
  sessionStorage.setItem("bji_pending_admin_name", name.trim());
}

export async function resendFirebaseVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Sign in again to request a verification email.");
  }

  await sendEmailVerification(user);
}

export async function requestFirebasePasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.trim();
  if (!normalizedEmail) {
    throw new Error("Enter the email address for your account.");
  }

  await sendPasswordResetEmail(auth, normalizedEmail);
}

export async function refreshFirebaseEmailVerification(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  await user.reload();
  await user.getIdToken(true);
  return user.emailVerified;
}

async function recoverFirebaseOrganizationForVerifiedAdmin(
  user: NonNullable<typeof auth.currentUser>,
): Promise<FirebaseOrganizationSetupResult | null> {
  const normalizedEmail = user.email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const matchingOrganizations = await getDocs(query(
    collection(db, "organizations"),
    where("adminEmail", "==", normalizedEmail),
  ));
  if (matchingOrganizations.empty) return null;
  if (matchingOrganizations.size !== 1) {
    throw new Error("More than one existing organization uses this admin email. Contact support before continuing.");
  }

  const organizationDocument = matchingOrganizations.docs[0];
  const organizationId = organizationDocument.id;
  const organizationRef = doc(db, "organizations", organizationId);
  const organization = organizationDocument.data();
  const previousAdminId = String(organization.ownerUid ?? "");
  const previousStaffRef = doc(db, "staff", previousAdminId);

  if (!previousAdminId || organization.adminEmail?.trim().toLowerCase() !== normalizedEmail) {
    throw new Error("The existing organization owner could not be verified for this email.");
  }

  return runTransaction(db, async (transaction) => {
    const currentOrganizationSnapshot = await transaction.get(organizationRef);
    const currentOrganization = currentOrganizationSnapshot.data();
    if (!currentOrganizationSnapshot.exists() || currentOrganization?.adminEmail?.trim().toLowerCase() !== normalizedEmail) {
      throw new Error("The organization changed during account recovery. Try again.");
    }

    const currentOwnerId = String(currentOrganization.ownerUid ?? "");
    if (!currentOwnerId) {
      throw new Error("The existing organization has no owner profile to recover.");
    }
    const currentOwnerStaffRef = doc(db, "staff", currentOwnerId);
    const currentOwnerStaffSnapshot = await transaction.get(currentOwnerStaffRef);
    if (!currentOwnerStaffSnapshot.exists()) {
      throw new Error("The existing administrator profile is missing. Contact support before continuing.");
    }

    const currentOwnerStaff = currentOwnerStaffSnapshot.data();
    const facilityId = String(currentOwnerStaff.facilityId ?? "");
    const facilityRef = doc(db, "facilities", facilityId);
    const facilitySnapshot = await transaction.get(facilityRef);
    const facility = facilitySnapshot.data();

    if (
      currentOwnerStaff.email?.trim().toLowerCase() !== normalizedEmail
      || currentOwnerStaff.role !== "HOSPITAL_ADMINISTRATOR"
      || currentOwnerStaff.organizationId !== organizationId
      || !facilitySnapshot.exists()
      || facility?.organizationId !== organizationId
    ) {
      throw new Error("The existing organization records do not match this verified admin identity.");
    }

    if (currentOwnerId !== user.uid) {
      transaction.update(organizationRef, { ownerUid: user.uid });
      transaction.delete(currentOwnerStaffRef);
      transaction.set(doc(db, "staff", user.uid), {
        ...currentOwnerStaff,
        id: user.uid,
        email: user.email,
        recoveredAt: new Date().toISOString(),
      });
    }

    return {
      organizationId,
      facilityId,
      adminId: user.uid,
      adminEmail: user.email ?? normalizedEmail,
      organizationName: String(currentOrganization.name ?? ""),
      billingAddress: String(currentOrganization.billingAddress ?? ""),
      facilityName: String(facility?.name ?? ""),
      facilityType: String(facility?.facilityType ?? "clinic") as FacilityType,
      city: String(facility?.city ?? ""),
      timezone: String(facility?.timezone ?? "UTC"),
      adminName: String(currentOwnerStaff.name ?? "Administrator"),
      recovered: true,
    };
  });
}

export async function upsertFirebaseStaffMember(payload: {
  id: string;
  facilityId: string;
  organizationId?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status?: "invited";
  createdAt?: string;
}): Promise<void> {
  if (!isFirebaseReady() || !auth.currentUser) {
    throw new Error("Sign in to Firebase before saving a staff invitation.");
  }

  await setDoc(doc(db, "staff", payload.id), {
    id: payload.id,
    facilityId: payload.facilityId,
    organizationId: payload.organizationId ?? "",
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    department: payload.department.trim(),
    status: "invited",
    createdAt: payload.createdAt ?? new Date().toISOString(),
  }, { merge: true });
}

export async function upsertFirebasePatient(payload: {
  id: string;
  facilityId: string;
  mrn: string;
  name: string;
  dob: string;
  status?: "registered" | "active" | "archived";
  lastVisit?: string;
}): Promise<void> {
  if (!isFirebaseReady() || !auth.currentUser) {
    throw new Error("Sign in to Firebase before saving a patient record.");
  }

  await setDoc(doc(db, "patients", payload.id), {
    id: payload.id,
    facilityId: payload.facilityId,
    mrn: payload.mrn.trim(),
    name: payload.name.trim(),
    dob: payload.dob,
    status: payload.status ?? "registered",
    lastVisit: payload.lastVisit ?? new Date().toISOString().slice(0, 10),
  }, { merge: true });
}

export async function upsertFirebaseAppointment(payload: {
  id: string;
  facilityId: string;
  patientId?: string;
  patientName: string;
  clinician: string;
  time: string;
  type: string;
  status?: string;
}): Promise<void> {
  if (!isFirebaseReady() || !auth.currentUser) {
    throw new Error("Sign in to Firebase before saving an appointment.");
  }

  await setDoc(doc(db, "appointments", payload.id), {
    id: payload.id,
    facilityId: payload.facilityId,
    ...(payload.patientId ? { patientId: payload.patientId } : {}),
    patientName: payload.patientName.trim(),
    clinician: payload.clinician.trim(),
    time: payload.time,
    type: payload.type.trim(),
    status: payload.status ?? "scheduled",
  }, { merge: true });
}

export async function completeFirebaseOrganizationSetup({
  organizationName,
  adminName,
  billingAddress,
  facilityName,
  facilityType,
  city,
  timezone,
}: {
  organizationName: string;
  adminName: string;
  billingAddress: string;
  facilityName: string;
  facilityType: FacilityType;
  city: string;
  timezone: string;
}): Promise<FirebaseOrganizationSetupResult> {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("Create an administrator account before completing organization setup.");
  }

  await user.reload();
  await user.getIdToken(true);
  if (!user.emailVerified) {
    throw new Error("Verify your email address before completing organization setup.");
  }

  const recoveredOrganization = await recoverFirebaseOrganizationForVerifiedAdmin(user);
  if (recoveredOrganization) {
    sessionStorage.removeItem("bji_pending_admin_name");
    sessionStorage.removeItem("bji_pending_organization_name");
    return recoveredOrganization;
  }

  if (!organizationName.trim() || !facilityName.trim()) {
    throw new Error("Enter your organization and facility details to create a new workspace.");
  }

  const existingStaffProfile = await getDoc(doc(db, "staff", user.uid));
  if (existingStaffProfile.exists()) {
    throw new Error("This account already has a staff profile that is not linked to an organization it owns.");
  }

  const organizationId = doc(collection(db, "organizations")).id;
  const facilityId = doc(collection(db, "facilities")).id;
  const adminId = user.uid;
  const adminEmail = user.email.trim().toLowerCase();
  const createdAt = new Date().toISOString();
  const batch = writeBatch(db);

  batch.set(doc(db, "organizations", organizationId), {
    id: organizationId,
    name: organizationName.trim(),
    ownerUid: adminId,
    adminEmail,
    billingAddress: billingAddress.trim(),
    status: "active",
    createdAt,
  });
  batch.set(doc(db, "facilities", facilityId), {
    id: facilityId,
    organizationId,
    name: facilityName.trim(),
    facilityType,
    city: city.trim(),
    timezone,
    status: "active",
    createdAt,
  });
  batch.set(doc(db, "staff", adminId), {
    id: adminId,
    organizationId,
    facilityId,
    name: adminName.trim(),
    email: adminEmail,
    role: "HOSPITAL_ADMINISTRATOR",
    department: "Administration",
    status: "active",
    createdAt,
  });

  await batch.commit();
  sessionStorage.removeItem("bji_pending_admin_name");
  return {
    organizationId,
    facilityId,
    adminId,
    adminEmail,
    organizationName: organizationName.trim(),
    billingAddress: billingAddress.trim(),
    facilityName: facilityName.trim(),
    facilityType,
    city: city.trim(),
    timezone,
    adminName: adminName.trim(),
    recovered: false,
  };
}

export async function signInFirebaseStaff({
  email,
  password,
  facilityId,
}: {
  email: string;
  password: string;
  facilityId?: string;
}): Promise<FirebaseStaffRecord | null> {
  if (!isFirebaseReady()) {
    return null;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!credential.user.emailVerified) {
    await signOut(auth);
    return null;
  }

  const staffSnapshot = await getDoc(doc(db, "staff", credential.user.uid));
  if (!staffSnapshot.exists()) {
    await signOut(auth);
    return null;
  }

  const record = staffSnapshot.data() as FirebaseStaffRecord;
  if (
    record.id !== credential.user.uid
    || (facilityId !== undefined && record.facilityId !== facilityId)
    || record.email.toLowerCase() !== email.toLowerCase()
    || record.status !== "active"
  ) {
    await signOut(auth);
    return null;
  }

  const facilitySnapshot = await getDoc(doc(db, "facilities", record.facilityId));
  if (!facilitySnapshot.exists()) {
    await signOut(auth);
    return null;
  }

  const facility = facilitySnapshot.data();
  return {
    ...record,
    email: record.email.toLowerCase(),
    facilityName: String(facility.name || "Healthcare Facility"),
    facilityType: String(facility.facilityType || "hospital"),
  };
}

export async function reauthenticateFirebaseStaff(password: string): Promise<boolean> {
  if (!isFirebaseReady() || !auth.currentUser?.email) {
    return false;
  }

  try {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
    return true;
  } catch (error) {
    console.warn("Firebase staff reauthentication failed:", error);
    return false;
  }
}

export async function getFirebaseStaffProfile(uid: string): Promise<FirebaseStaffProfile | null> {
  if (!isFirebaseReady()) {
    return null;
  }

  try {
    const staffSnapshot = await getDoc(doc(db, "staff", uid));
    if (!staffSnapshot.exists()) {
      return null;
    }

    const staff = staffSnapshot.data() as FirebaseStaffRecord;
    if (staff.id !== uid || staff.status !== "active") {
      return null;
    }

    const facilitySnapshot = await getDoc(doc(db, "facilities", staff.facilityId));
    if (!facilitySnapshot.exists()) {
      return null;
    }

    return { staff, facility: facilitySnapshot.data() };
  } catch (error) {
    console.warn("Firebase staff profile restore failed:", error);
    return null;
  }
}

export async function signOutFirebaseStaff(): Promise<void> {
  if (isFirebaseReady() && auth.currentUser) {
    await signOut(auth);
  }
}

export async function getStaffFromFirebaseByEmail({
  email,
  facilityId,
}: {
  email: string;
  facilityId: string;
}): Promise<FirebaseStaffRecord | null> {
  if (!isFirebaseReady()) {
    return null;
  }

  try {
    const staffQuery = query(
      collection(db, "staff"),
      where("facilityId", "==", facilityId),
      where("email", "==", email.toLowerCase())
    );
    const snapshot = await getDocs(staffQuery);
    return snapshot.empty ? null : snapshot.docs[0].data() as FirebaseStaffRecord;
  } catch (error) {
    console.warn("Firebase staff lookup failed:", error);
    return null;
  }
}

export async function getOrganizationAndFacilitySnapshot({
  organizationId,
  facilityId,
}: {
  organizationId: string;
  facilityId: string;
}): Promise<{ organization: Record<string, unknown> | null; facility: Record<string, unknown> | null }> {
  if (!isFirebaseReady()) {
    return { organization: null, facility: null };
  }

  try {
    const [organizationSnap, facilitySnap] = await Promise.all([
      getDoc(doc(db, "organizations", organizationId)),
      getDoc(doc(db, "facilities", facilityId)),
    ]);

    return {
      organization: organizationSnap.exists() ? organizationSnap.data() : null,
      facility: facilitySnap.exists() ? facilitySnap.data() : null,
    };
  } catch (error) {
    console.warn("Firebase snapshot load failed:", error);
    return { organization: null, facility: null };
  }
}
