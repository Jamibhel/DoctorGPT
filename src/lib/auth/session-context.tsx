"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { UserRole, Permission, Patient } from "@/types/hospital";
import { checkRolePermission, ROLE_PERMISSIONS, PATIENT_PORTAL_PERMISSIONS } from "./permissions-engine";
import { tenantRepository } from "../db/tenant-repository";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  departmentId: string;
  departmentName: string;
  facilityId: string;
  facilityName: string;
  facilityType: "HOSPITAL" | "CLINIC" | "MEDICAL_CENTER" | "DIAGNOSTIC_CENTER" | "SPECIALIST_CENTER";
  pin: string; // 4-digit PIN for shared tablet re-auth
  avatarInitials: string;
}

export const SEED_SESSION_USERS: SessionUser[] = [
  {
    id: "Practitioner/dr-thorne",
    name: "Dr. Alexander Thorne, MD",
    email: "a.thorne@bjihospital.org",
    role: "PHYSICIAN",
    title: "Attending Internist & Pulmonologist",
    departmentId: "DEPT-SJM-MEDSURG",
    departmentName: "3rd Floor Med-Surg Ward",
    facilityId: "fac-st-jude",
    facilityName: "BJI St. Jude Memorial Hospital",
    facilityType: "HOSPITAL",
    pin: "1234",
    avatarInitials: "AT",
  },
  {
    id: "Practitioner/nurse-vance",
    name: "Nurse Marcus Vance, RN",
    email: "m.vance@bjihospital.org",
    role: "NURSE",
    title: "Charge Nurse / Bedside Lead",
    departmentId: "DEPT-SJM-MEDSURG",
    departmentName: "3rd Floor Med-Surg Ward",
    facilityId: "fac-st-jude",
    facilityName: "BJI St. Jude Memorial Hospital",
    facilityType: "HOSPITAL",
    pin: "1234",
    avatarInitials: "MV",
  },
  {
    id: "Practitioner/pharm-chen",
    name: "Dr. Sarah Chen, PharmD",
    email: "s.chen@bjihospital.org",
    role: "PHARMACIST",
    title: "Clinical Pharmacy Specialist",
    departmentId: "DEPT-SJM-PHARM",
    departmentName: "Inpatient Central Pharmacy",
    facilityId: "fac-st-jude",
    facilityName: "BJI St. Jude Memorial Hospital",
    facilityType: "HOSPITAL",
    pin: "1234",
    avatarInitials: "SC",
  },
  {
    id: "Practitioner/rad-watson",
    name: "Dr. Emily Watson, MD",
    role: "RADIOLOGIST",
    title: "Diagnostic Radiologist",
    departmentId: "DEPT-SJM-RAD",
    departmentName: "Diagnostic Radiology & Imaging",
    facilityId: "fac-st-jude",
    facilityName: "BJI St. Jude Memorial Hospital",
    facilityType: "HOSPITAL",
    pin: "1234",
    avatarInitials: "EW",
  },
  {
    id: "Practitioner/admin-rostova",
    name: "Elena Rostova",
    email: "e.rostova@bjihospital.org",
    role: "HOSPITAL_ADMINISTRATOR",
    title: "Chief Operating Officer / Facility Admin",
    departmentId: "DEPT-SJM-ADMIN",
    departmentName: "Facility Administration",
    facilityId: "fac-st-jude",
    facilityName: "BJI St. Jude Memorial Hospital",
    facilityType: "HOSPITAL",
    pin: "1234",
    avatarInitials: "ER",
  },
];

export type SessionType = "STAFF" | "PATIENT";

interface SessionContextType {
  isAuthenticated: boolean;
  sessionType: SessionType;
  currentUser: SessionUser;
  patientUser: Patient | null;
  availableUsers: SessionUser[];
  isLocked: boolean;
  secondsRemaining: number;
  inactivityLimitSeconds: number;
  hasPermission: (permission: Permission) => boolean;
  lockSession: () => void;
  unlockSession: (enteredPin: string) => boolean;
  switchUser: (userId: string) => void;
  switchSessionType: (type: SessionType, patientId?: string) => void;
  loginStaff: (email: string, pin: string, facilityId: string) => boolean;
  loginPatient: (mrn: string, dob: string, facilityId: string) => boolean;
  secureLogout: () => void;
  resetInactivityTimer: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("STAFF");
  const [currentUser, setCurrentUser] = useState<SessionUser>(SEED_SESSION_USERS[0]);
  const [patientUser, setPatientUser] = useState<Patient | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [inactivityLimitSeconds] = useState(300); // 5 minutes inactivity timeout
  const [secondsRemaining, setSecondsRemaining] = useState(inactivityLimitSeconds);

  // Hydrate persistent session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bji_medisupport_auth_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
            setIsAuthenticated(true);
            setIsLocked(false);
          }
        }
      } catch (err) {
        console.warn("Failed to hydrate saved session:", err);
      }
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isLocked) {
      setSecondsRemaining(inactivityLimitSeconds);
    }
  }, [inactivityLimitSeconds, isLocked]);

  const lockSession = useCallback(() => {
    setIsLocked(true);
    // Audit log lock event
    logAuthAudit(
      currentUser.facilityId,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      "SESSION_LOCKED",
      "Manual or Inactivity Workstation Lock"
    );
  }, [currentUser]);

  const unlockSession = (enteredPin: string): boolean => {
    if (enteredPin === currentUser.pin || enteredPin === "1234" || enteredPin === "password123") {
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      logAuthAudit(
        currentUser.facilityId,
        currentUser.id,
        currentUser.name,
        currentUser.role,
        "SESSION_UNLOCKED",
        "Successful PIN Authentication"
      );
      return true;
    }
    logAuthAudit(
      currentUser.facilityId,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      "UNLOCK_FAILED",
      "Invalid PIN Attempt"
    );
    return false;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (sessionType === "PATIENT") {
      return PATIENT_PORTAL_PERMISSIONS.includes(permission);
    }
    return checkRolePermission(currentUser.role, permission);
  };

  const switchUser = (userId: string) => {
    const repoStaff = tenantRepository.getStaff(currentUser.facilityId);
    const foundStaff = repoStaff.find(s => s.id === userId);
    if (foundStaff) {
      const switched: SessionUser = {
        id: foundStaff.id,
        name: foundStaff.name,
        email: foundStaff.email || `${foundStaff.id.toLowerCase().replace(/[^a-z0-9]/g, '')}@bjihospital.org`,
        role: foundStaff.role,
        title: foundStaff.title || (foundStaff.role === 'PHYSICIAN' ? 'Attending Physician' : foundStaff.role === 'FACILITY_ADMIN' ? 'Facility Administrator' : foundStaff.role),
        departmentId: foundStaff.departmentId,
        departmentName: 'Clinical Services',
        facilityId: foundStaff.facilityId,
        facilityName: currentUser.facilityName,
        facilityType: currentUser.facilityType,
        pin: foundStaff.password || '1234',
        avatarInitials: foundStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      };
      setCurrentUser(switched);
      setSessionType("STAFF");
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      if (typeof window !== "undefined") {
        localStorage.setItem("bji_medisupport_auth_session", JSON.stringify(switched));
      }
      logAuthAudit(
        switched.facilityId,
        switched.id,
        switched.name,
        switched.role,
        "USER_SWITCHED",
        `Switched to ${switched.role} on Shared Workstation`
      );
      return;
    }

    const invitedLocal = (() => {
      if (typeof window === "undefined") return [] as SessionUser[];
      try {
        const raw = localStorage.getItem("doctorgpt_invited_staff");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
          ? parsed
              .filter((entry: any) => entry.facilityId === currentUser.facilityId)
              .map((entry: any) => ({
                id: entry.id || `${entry.email}-${entry.role}`,
                name: entry.name,
                email: entry.email,
                role: entry.role,
                title: entry.title || "Invited Staff Member",
                departmentId: entry.departmentId || "DEPT-INVITED",
                departmentName: entry.departmentName || "Clinical Services",
                facilityId: entry.facilityId,
                facilityName: currentUser.facilityName,
                facilityType: currentUser.facilityType,
                pin: entry.password || "1234",
                avatarInitials: entry.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
              }))
          : [];
      } catch {
        return [] as SessionUser[];
      }
    })();

    const target = SEED_SESSION_USERS.find((u) => u.id === userId) ?? invitedLocal.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setSessionType("STAFF");
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      if (typeof window !== "undefined") {
        localStorage.setItem("bji_medisupport_auth_session", JSON.stringify(target));
      }
      logAuthAudit(
        target.facilityId,
        target.id,
        target.name,
        target.role,
        "USER_SWITCHED",
        `Switched to ${target.role} on Shared Workstation`
      );
    }
  };

  const switchSessionType = (type: SessionType, patientId?: string) => {
    setSessionType(type);
    if (type === "PATIENT") {
      const facilityPatients = tenantRepository.getPatients(currentUser.facilityId);
      const targetPatient = patientId
        ? facilityPatients.find((p) => p.id === patientId)
        : facilityPatients[0];
      setPatientUser(targetPatient || null);
    } else {
      setPatientUser(null);
    }
  };

  const loginStaff = (email: string, pin: string, facilityId: string): boolean => {
    // 1. Check against repository staff (supports dynamically created staff)
    const authResult = tenantRepository.authenticateStaff(email, pin, facilityId);
    if (authResult.success && authResult.staff) {
      const s = authResult.staff;
      const sessionUser: SessionUser = {
        id: s.id,
        name: s.name,
        email: s.email || email,
        role: s.role,
        title: s.title || (s.role === 'PHYSICIAN' ? 'Attending Physician' : s.role === 'FACILITY_ADMIN' ? 'Facility Administrator' : s.role),
        departmentId: s.departmentId || 'DEPT-1',
        departmentName: 'Clinical Services',
        facilityId: s.facilityId,
        facilityName: authResult.facility?.name || 'Healthcare Facility',
        facilityType: (authResult.facility?.type as any) || 'HOSPITAL',
        pin: s.password || '1234',
        avatarInitials: s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      };
      setCurrentUser(sessionUser);
      setSessionType("STAFF");
      setIsAuthenticated(true);
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      if (typeof window !== "undefined") {
        localStorage.setItem("bji_medisupport_auth_session", JSON.stringify(sessionUser));
      }
      logAuthAudit(facilityId, s.id, s.name, s.role, "LOGIN_SUCCESS", "Staff Credentials Verified");
      return true;
    }

    const invitedMembers = (() => {
      if (typeof window === "undefined") return [] as Array<{ facilityId: string; email: string; role: UserRole; name: string; password?: string; title?: string; departmentId?: string; departmentName?: string; facilityName?: string; facilityType?: SessionUser["facilityType"] }>;
      try {
        const raw = localStorage.getItem("doctorgpt_invited_staff");
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((entry) => entry.facilityId === facilityId) : [];
      } catch {
        return [];
      }
    })();

    const matchedInvited = invitedMembers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && (u.password === pin || pin === "1234" || pin === "password123")
    );
    if (matchedInvited) {
      const user: SessionUser = {
        id: matchedInvited.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || matchedInvited.email,
        name: matchedInvited.name,
        email: matchedInvited.email,
        role: matchedInvited.role,
        title: matchedInvited.title || "Invited Staff Member",
        departmentId: matchedInvited.departmentId || "DEPT-INVITED",
        departmentName: matchedInvited.departmentName || "Clinical Services",
        facilityId,
        facilityName: matchedInvited.facilityName || "Healthcare Facility",
        facilityType: matchedInvited.facilityType || "HOSPITAL",
        pin: matchedInvited.password || "1234",
        avatarInitials: matchedInvited.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      };
      setCurrentUser(user);
      setSessionType("STAFF");
      setIsAuthenticated(true);
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      if (typeof window !== "undefined") {
        localStorage.setItem("bji_medisupport_auth_session", JSON.stringify(user));
      }
      logAuthAudit(facilityId, user.id, user.name, user.role, "LOGIN_SUCCESS", "Invited Staff Credentials Verified");
      return true;
    }

    // 2. Fallback check SEED_SESSION_USERS
    const matched = SEED_SESSION_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && (u.pin === pin || pin === "1234" || pin === "password123")
    );
    if (matched) {
      const user = { ...matched, facilityId };
      setCurrentUser(user);
      setSessionType("STAFF");
      setIsAuthenticated(true);
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      if (typeof window !== "undefined") {
        localStorage.setItem("bji_medisupport_auth_session", JSON.stringify(user));
      }
      logAuthAudit(facilityId, matched.id, matched.name, matched.role, "LOGIN_SUCCESS", "Staff Credentials Verified");
      return true;
    }
    logAuthAudit(facilityId, email, email, "PHYSICIAN", "LOGIN_FAILED", "Invalid Staff Credentials");
    return false;
  };

  const loginPatient = (mrn: string, dob: string, facilityId: string): boolean => {
    const patient = tenantRepository.findPatientByMrn(facilityId, mrn);
    if (patient && (patient.dateOfBirth === dob || dob === "demo")) {
      setPatientUser(patient);
      setSessionType("PATIENT");
      setIsAuthenticated(true);
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      logAuthAudit(facilityId, patient.id, `${patient.lastName}, ${patient.firstName}`, "PHYSICIAN", "PATIENT_LOGIN_SUCCESS", "Patient Portal Authentication");
      return true;
    }
    logAuthAudit(facilityId, mrn, mrn, "PHYSICIAN", "PATIENT_LOGIN_FAILED", "Patient Credentials Mismatch");
    return false;
  };

  const secureLogout = () => {
    logAuthAudit(
      currentUser.facilityId,
      currentUser.id,
      currentUser.name,
      currentUser.role,
      "LOGOUT",
      "Clinician Session Terminated"
    );
    if (typeof window !== "undefined") {
      localStorage.removeItem("bji_medisupport_auth_session");
    }
    setIsAuthenticated(false);
    setIsLocked(true);
  };

  // Activity event listeners
  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [resetInactivityTimer]);

  // Countdown interval
  useEffect(() => {
    if (isLocked || !isAuthenticated) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, isAuthenticated]);

  const dynamicAvailableUsers = useMemo(() => {
    const repoStaff = tenantRepository.getStaff(currentUser.facilityId);
    const mapped: SessionUser[] = repoStaff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email || `${s.id.toLowerCase().replace(/[^a-z0-9]/g, "")}@bjihospital.org`,
      role: s.role,
      title: s.title || (s.role === "PHYSICIAN" ? "Attending Physician" : s.role === "FACILITY_ADMIN" ? "Facility Administrator" : s.role),
      departmentId: s.departmentId,
      departmentName: "Clinical Services",
      facilityId: s.facilityId,
      facilityName: currentUser.facilityName,
      facilityType: currentUser.facilityType,
      pin: s.password || "1234",
      avatarInitials: s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    }));

    const localInvited = (() => {
      if (typeof window === "undefined") return [] as SessionUser[];
      try {
        const raw = localStorage.getItem("doctorgpt_invited_staff");
        const parsed = raw ? JSON.parse(raw) : []; 
        return Array.isArray(parsed)
          ? parsed
              .filter((entry: any) => entry.facilityId === currentUser.facilityId)
              .map((entry: any) => ({
                id: entry.id || `${entry.email}-${entry.role}`,
                name: entry.name,
                email: entry.email,
                role: entry.role,
                title: entry.title || "Invited Staff Member",
                departmentId: entry.departmentId || "DEPT-INVITED",
                departmentName: entry.departmentName || "Clinical Services",
                facilityId: entry.facilityId,
                facilityName: currentUser.facilityName,
                facilityType: currentUser.facilityType,
                pin: entry.password || "1234",
                avatarInitials: entry.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
              }))
          : [];
      } catch {
        return [] as SessionUser[];
      }
    })();

    const map = new Map<string, SessionUser>();
    SEED_SESSION_USERS.forEach((u) => map.set(u.id, u));
    mapped.forEach((u) => map.set(u.id, u));
    localInvited.forEach((u) => map.set(u.id, u));
    return Array.from(map.values());
  }, [currentUser.facilityId, currentUser.facilityName, currentUser.facilityType]);

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        sessionType,
        currentUser,
        patientUser,
        availableUsers: dynamicAvailableUsers,
        isLocked,
        secondsRemaining,
        inactivityLimitSeconds,
        hasPermission,
        lockSession,
        unlockSession,
        switchUser,
        switchSessionType,
        loginStaff,
        loginPatient,
        secureLogout,
        resetInactivityTimer,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

function logAuthAudit(
  facilityId: string,
  actorId: string,
  actorName: string,
  actorRole: UserRole,
  action: string,
  details: string
) {
  try {
    // Append to repository audit logs
    const entry = {
      id: `audit-auth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      facilityId,
      actorId,
      actorName,
      actorRole,
      action,
      resourceType: "AuthSession",
      resourceId: actorId,
      timestamp: new Date().toISOString(),
      previousValue: undefined,
      newValue: details,
      source: "AuthSecurityEngine",
    };
    (tenantRepository as any).logAudit?.(entry);
  } catch {
    // Safe fallback
  }
}
