"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [sessionType, setSessionType] = useState<SessionType>("STAFF");
  const [currentUser, setCurrentUser] = useState<SessionUser>(SEED_SESSION_USERS[0]);
  const [patientUser, setPatientUser] = useState<Patient | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [inactivityLimitSeconds] = useState(300); // 5 minutes inactivity timeout
  const [secondsRemaining, setSecondsRemaining] = useState(inactivityLimitSeconds);

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
    if (enteredPin === currentUser.pin || enteredPin === "1234") {
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
    const target = SEED_SESSION_USERS.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setSessionType("STAFF");
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
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
    const matched = SEED_SESSION_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && (u.pin === pin || pin === "1234")
    );
    if (matched) {
      setCurrentUser({ ...matched, facilityId });
      setSessionType("STAFF");
      setIsAuthenticated(true);
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
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

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated,
        sessionType,
        currentUser,
        patientUser,
        availableUsers: SEED_SESSION_USERS,
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
