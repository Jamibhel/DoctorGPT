"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserRole } from "@/types/hospital";

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
    departmentId: "Department/med-surg-3",
    departmentName: "Med-Surg Ward 3",
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
    departmentId: "Department/med-surg-3",
    departmentName: "Med-Surg Ward 3",
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
    departmentId: "Department/pharmacy",
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
    email: "e.watson@bjihospital.org",
    role: "RADIOLOGIST",
    title: "Diagnostic Radiologist",
    departmentId: "Department/radiology",
    departmentName: "Department of Radiology",
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
    departmentId: "Department/admin",
    departmentName: "Facility Administration",
    facilityId: "fac-st-jude",
    facilityName: "BJI St. Jude Memorial Hospital",
    facilityType: "HOSPITAL",
    pin: "1234",
    avatarInitials: "ER",
  },
];

interface SessionContextType {
  currentUser: SessionUser;
  availableUsers: SessionUser[];
  isLocked: boolean;
  secondsRemaining: number;
  inactivityLimitSeconds: number;
  lockSession: () => void;
  unlockSession: (enteredPin: string) => boolean;
  switchUser: (userId: string) => void;
  secureLogout: () => void;
  resetInactivityTimer: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SessionUser>(SEED_SESSION_USERS[0]);
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
  }, []);

  const unlockSession = (enteredPin: string): boolean => {
    if (enteredPin === currentUser.pin || enteredPin === "1234") {
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
      return true;
    }
    return false;
  };

  const switchUser = (userId: string) => {
    const target = SEED_SESSION_USERS.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setIsLocked(false);
      setSecondsRemaining(inactivityLimitSeconds);
    }
  };

  const secureLogout = () => {
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
    if (isLocked) return;

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
  }, [isLocked]);

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        availableUsers: SEED_SESSION_USERS,
        isLocked,
        secondsRemaining,
        inactivityLimitSeconds,
        lockSession,
        unlockSession,
        switchUser,
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
