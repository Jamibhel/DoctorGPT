"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { organizations, facilities, staffMembers as seedStaffMembers, patients as seedPatients, appointments as seedAppointments, ENABLE_PLATFORM_DEMO_DATA, type Organization, type Facility, type Patient, type StaffMember, type Appointment, type AppointmentStatus, type FacilityType } from "./mock-platform";
import { advanceAppointmentStatus, createAppointmentRecord, createBedAssignment, createPatientRecord, createStaffRecord, updateBedAssignmentStatus, validateFacilitySelection, resolveActiveFacilityId } from "./platform-operations";
import { getFirebaseWorkspaceSnapshot, upsertFirebaseAppointment, upsertFirebasePatient, upsertFirebaseStaffMember } from "@/lib/firebase/tenant-service";

export type PlatformBedAssignment = {
  id: string;
  facilityId: string;
  patientName: string;
  bedName: string;
  department: string;
  status: "admitted" | "transferred" | "discharged";
  assignedAt: string;
};

export type PlatformContextValue = {
  organizations: Organization[];
  facilities: Facility[];
  staffMembers: StaffMember[];
  patients: Patient[];
  appointments: Appointment[];
  bedAssignments: PlatformBedAssignment[];
  activeOrganizationId: string;
  activeFacilityId: string;
  activeOrganization: Organization | undefined;
  activeFacility: Facility | undefined;
  organizationFacilities: Facility[];
  setActiveOrganizationId: (organizationId: string) => void;
  setActiveFacilityId: (facilityId: string) => void;
  createOrganizationAndFacility: (input: {
    organizationName: string;
    adminEmail: string;
    billingAddress: string;
    facilityName: string;
    facilityType: FacilityType;
    city: string;
    timezone: string;
    adminName?: string;
    organizationId?: string;
    facilityId?: string;
  }) => { organization: Organization; facility: Facility };
  createStaffMember: (input: {
    facilityId?: string;
    name: string;
    email: string;
    role: StaffMember["role"];
    department: string;
    status?: StaffMember["status"];
  }) => Promise<StaffMember>;
  registerPatient: (input: {
    facilityId?: string;
    mrn: string;
    name: string;
    dob: string;
  }) => Promise<Patient>;
  scheduleAppointment: (input: {
    facilityId?: string;
    patientId: string;
    clinician: string;
    time: string;
    type: string;
    status?: AppointmentStatus;
  }) => Promise<Appointment>;
  updateAppointmentStatus: (appointmentId: string, nextStatus?: AppointmentStatus) => Appointment | undefined;
  admitPatientToBed: (input: {
    facilityId?: string;
    patientName: string;
    bedName: string;
    department?: string;
  }) => PlatformBedAssignment;
  transferPatientInBed: (assignmentId: string, input?: {
    bedName?: string;
    department?: string;
    status?: PlatformBedAssignment["status"];
  }) => PlatformBedAssignment | undefined;
  dischargePatientFromBed: (assignmentId: string) => PlatformBedAssignment | undefined;
};

const PlatformContext = createContext<PlatformContextValue | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [organizationRecords, setOrganizationRecords] = useState<Organization[]>(() => (ENABLE_PLATFORM_DEMO_DATA ? organizations : []));
  const [facilityRecords, setFacilityRecords] = useState<Facility[]>(() => (ENABLE_PLATFORM_DEMO_DATA ? facilities : []));
  const [staffRecords, setStaffRecords] = useState<StaffMember[]>(() => (ENABLE_PLATFORM_DEMO_DATA ? seedStaffMembers : []));
  const [organizationId, setOrganizationId] = useState<string>(() => (ENABLE_PLATFORM_DEMO_DATA ? organizations[0]?.id ?? "" : ""));
  const [facilityId, setFacilityId] = useState<string>(() => (
    ENABLE_PLATFORM_DEMO_DATA
      ? facilities.find((facility) => facility.organizationId === organizations[0]?.id)?.id ?? facilities[0]?.id ?? ""
      : ""
  ));
  const [patientRecords, setPatientRecords] = useState<Patient[]>(() => (ENABLE_PLATFORM_DEMO_DATA ? seedPatients : []));
  const [appointmentRecords, setAppointmentRecords] = useState<Appointment[]>(() => (ENABLE_PLATFORM_DEMO_DATA ? seedAppointments : []));
  const [bedAssignmentRecords, setBedAssignmentRecords] = useState<PlatformBedAssignment[]>(() => (
    ENABLE_PLATFORM_DEMO_DATA
      ? [
          createBedAssignment({
            facilityId: "fac-bji-center",
            patientName: "Emma Thompson",
            bedName: "Med-Surg 3A-14",
            department: "Medical-Surgical",
            status: "admitted",
          }) as PlatformBedAssignment,
          createBedAssignment({
            facilityId: "fac-bji-center",
            patientName: "Lucas Hart",
            bedName: "ICU 1B-02",
            department: "Intensive Care",
            status: "transferred",
          }) as PlatformBedAssignment,
        ]
      : []
  ));
  useEffect(() => {
    if (ENABLE_PLATFORM_DEMO_DATA) {
      return;
    }

    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setOrganizationRecords([]);
        setFacilityRecords([]);
        setStaffRecords([]);
        setPatientRecords([]);
        setAppointmentRecords([]);
        setOrganizationId("");
        setFacilityId("");
        return;
      }

      void (async () => {
      try {
        const snapshot = await getFirebaseWorkspaceSnapshot();
        const nextOrganizations = snapshot?.organization
          ? [{
              ...snapshot.organization,
              facilities: snapshot.facility ? 1 : 0,
              staff: snapshot.staff.length,
              patients: snapshot.patients.length,
            } as Organization]
          : [];
        const nextFacilities = snapshot?.facility
          ? [{ ...snapshot.facility, beds: Number(snapshot.facility.beds ?? 24) } as Facility]
          : [];

        setOrganizationRecords(nextOrganizations);
        setFacilityRecords(nextFacilities);
        setStaffRecords((snapshot?.staff ?? []) as StaffMember[]);
        setPatientRecords((snapshot?.patients ?? []) as Patient[]);
        setAppointmentRecords((snapshot?.appointments ?? []) as Appointment[]);
        setOrganizationId(nextOrganizations[0]?.id ?? "");
        setFacilityId(nextFacilities[0]?.id ?? "");
      } catch (error) {
        console.warn("Could not restore Firebase workspace state:", error);
      }
      })();
    });
  }, []);

  const activeOrganization = organizationRecords.find((organization) => organization.id === organizationId) ?? organizationRecords[0];
  const organizationFacilities = facilityRecords.filter((facility) => facility.organizationId === organizationId);
  const activeFacility = organizationFacilities.find((facility) => facility.id === facilityId)
    ?? facilityRecords.find((facility) => facility.id === facilityId)
    ?? organizationFacilities[0]
    ?? facilityRecords[0];

  const safeFacilityId = resolveActiveFacilityId({
    currentFacilityId: facilityId,
    preferredFacilityId: activeFacility?.id ?? "",
    fallbackFacilityId: facilityRecords[0]?.id ?? "",
    organizationFacilities: organizationFacilities.map((facility) => facility.id),
  });

  useEffect(() => {
    if (!safeFacilityId) {
      return;
    }
    if (facilityId !== safeFacilityId) {
      setFacilityId(safeFacilityId);
    }
  }, [facilityId, safeFacilityId]);

  const setActiveOrganizationId = (nextOrganizationId: string) => {
    setOrganizationId(nextOrganizationId);
    const nextFacility = facilityRecords.find((facility) => facility.organizationId === nextOrganizationId)?.id ?? facilityRecords[0]?.id ?? "";
    setFacilityId(nextFacility);
  };

  const setActiveFacilityId = (nextFacilityId: string) => {
    setFacilityId(nextFacilityId);
    const matchedFacility = facilityRecords.find((facility) => facility.id === nextFacilityId);
    if (matchedFacility) {
      setOrganizationId(matchedFacility.organizationId);
    }
  };

  const createOrganizationAndFacility = ({
    organizationName,
    adminEmail,
    billingAddress,
    facilityName,
    facilityType,
    city,
    timezone,
    adminName,
    organizationId: providedOrganizationId,
    facilityId: providedFacilityId,
  }: {
    organizationName: string;
    adminEmail: string;
    billingAddress: string;
    facilityName: string;
    facilityType: FacilityType;
    city: string;
    timezone: string;
    adminName?: string;
    organizationId?: string;
    facilityId?: string;
  }) => {
    const orgId = providedOrganizationId ?? `org-${Date.now()}`;
    const facilityIdValue = providedFacilityId ?? `fac-${Date.now()}`;

    const organization: Organization = {
      id: orgId,
      name: organizationName.trim(),
      adminEmail: adminEmail.trim(),
      status: "active",
      facilities: 1,
      staff: 1,
      patients: 0,
    };

    const facility: Facility = {
      id: facilityIdValue,
      organizationId: orgId,
      name: facilityName.trim() || `${organizationName.trim()} Facility`,
      facilityType,
      city: city.trim() || "Austin",
      timezone: timezone || "CT",
      status: "active",
      beds: 24,
    };

    setOrganizationRecords((current) => [organization, ...current]);
    setFacilityRecords((current) => [facility, ...current]);
    setOrganizationId(orgId);
    setFacilityId(facilityIdValue);

    if (typeof window !== "undefined") {
      const summary = {
        organizationName,
        adminEmail,
        billingAddress,
        facilityName: facility.name,
        facilityType,
        city,
        timezone,
        adminName: adminName || organizationName,
      };
      localStorage.setItem("doctorgpt_onboarding_summary", JSON.stringify(summary));
    }

    return { organization, facility };
  };

  const createStaffMember = async ({ facilityId: targetFacilityId, name, email, role, department }: {
    facilityId?: string;
    name: string;
    email: string;
    role: StaffMember["role"];
    department: string;
  }) => {
    const memberFacilityId = validateFacilitySelection({ facilityId: targetFacilityId ?? activeFacility?.id ?? facilityId, actionName: "creating a staff member" });
    const staff = createStaffRecord({
      facilityId: memberFacilityId,
      name,
      email,
      role,
      department,
      status: "invited",
    }) as StaffMember;

    await upsertFirebaseStaffMember({
      id: staff.id,
      facilityId: memberFacilityId,
      organizationId: organizationId,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      status: "invited",
      createdAt: new Date().toISOString(),
    });
    setStaffRecords((current) => [staff, ...current]);

    return staff;
  };

  const registerPatient = async ({ facilityId: targetFacilityId, mrn, name, dob }: {
    facilityId?: string;
    mrn: string;
    name: string;
    dob: string;
  }) => {
    const patientFacilityId = validateFacilitySelection({ facilityId: targetFacilityId ?? activeFacility?.id ?? facilityId, actionName: "registering a patient" });
    const patient = createPatientRecord({
      facilityId: patientFacilityId,
      mrn,
      name,
      dob,
      status: "registered",
    }) as Patient;

    const intakeAppointment = createAppointmentRecord({
      facilityId: patientFacilityId,
      patientId: patient.id,
      patientName: name,
      clinician: "Front desk intake",
      time: "Now",
      type: "New patient intake",
      status: "checked_in",
    }) as Appointment;

    await Promise.all([
      upsertFirebasePatient({
      id: patient.id,
      facilityId: patientFacilityId,
      mrn: patient.mrn,
      name: patient.name,
      dob: patient.dob,
      status: patient.status,
      lastVisit: patient.lastVisit,
      }),
      upsertFirebaseAppointment({
      id: intakeAppointment.id,
      facilityId: patientFacilityId,
      patientId: intakeAppointment.patientId,
      patientName: intakeAppointment.patientName,
      clinician: intakeAppointment.clinician,
      time: intakeAppointment.time,
      type: intakeAppointment.type,
      status: intakeAppointment.status,
      }),
    ]);
    setPatientRecords((current) => [patient, ...current]);
    setAppointmentRecords((current) => [intakeAppointment, ...current]);
    return patient;
  };

  const scheduleAppointment = async ({ facilityId: targetFacilityId, patientId, clinician, time, type, status = "scheduled" }: {
    facilityId?: string;
    patientId: string;
    clinician: string;
    time: string;
    type: string;
    status?: AppointmentStatus;
  }) => {
    const appointmentFacilityId = validateFacilitySelection({ facilityId: targetFacilityId ?? activeFacility?.id ?? facilityId, actionName: "scheduling an appointment" });
    const appointmentPatient = patientRecords.find(
      (patient) => patient.id === patientId && patient.facilityId === appointmentFacilityId
    );
    if (!appointmentPatient) {
      throw new Error("Select a patient registered at this facility.");
    }

    const appointment = createAppointmentRecord({
      facilityId: appointmentFacilityId,
      patientId,
      patientName: appointmentPatient.name,
      clinician,
      time,
      type,
      status,
    }) as Appointment;

    await upsertFirebaseAppointment({
      id: appointment.id,
      facilityId: appointmentFacilityId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      clinician: appointment.clinician,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
    });
    setAppointmentRecords((current) => [appointment, ...current]);
    return appointment;
  };

  const updateAppointmentStatus = (appointmentId: string, nextStatus?: AppointmentStatus) => {
    const appointment = appointmentRecords.find((record) => record.id === appointmentId);
    if (!appointment) return undefined;

    const updatedAppointment = {
      ...appointment,
      status: advanceAppointmentStatus(appointment.status, nextStatus),
    };
    setAppointmentRecords((current) => current.map((record) => record.id === appointmentId ? updatedAppointment : record));
    void upsertFirebaseAppointment(updatedAppointment)
      .catch((error) => console.error("Could not update Firebase appointment:", error));
    return updatedAppointment;
  };

  const admitPatientToBed = ({ facilityId: targetFacilityId, patientName, bedName, department = "Medical-Surgical" }: {
    facilityId?: string;
    patientName: string;
    bedName: string;
    department?: string;
  }) => {
    const assignmentFacilityId = targetFacilityId ?? activeFacility?.id ?? facilityId;
    const assignment = createBedAssignment({
      facilityId: assignmentFacilityId,
      patientName,
      bedName,
      department,
      status: "admitted",
    }) as PlatformBedAssignment;

    setBedAssignmentRecords((current) => [assignment, ...current.filter((item) => item.patientName !== patientName)]);
    return assignment;
  };

  const transferPatientInBed = (assignmentId: string, input?: {
    bedName?: string;
    department?: string;
    status?: PlatformBedAssignment["status"];
  }) => {
    let updatedAssignment: PlatformBedAssignment | undefined;

    setBedAssignmentRecords((current) => current.map((assignment) => {
      if (assignment.id !== assignmentId) {
        return assignment;
      }

      updatedAssignment = {
        ...assignment,
        bedName: input?.bedName ?? assignment.bedName,
        department: input?.department ?? assignment.department,
        status: updateBedAssignmentStatus(assignment.status, input?.status ?? "transferred"),
      };
      return updatedAssignment;
    }));

    return updatedAssignment;
  };

  const dischargePatientFromBed = (assignmentId: string) => {
    let updatedAssignment: PlatformBedAssignment | undefined;

    setBedAssignmentRecords((current) => current.map((assignment) => {
      if (assignment.id !== assignmentId) {
        return assignment;
      }

      updatedAssignment = {
        ...assignment,
        status: updateBedAssignmentStatus(assignment.status, "discharged"),
      };
      return updatedAssignment;
    }));

    return updatedAssignment;
  };

  const value = useMemo<PlatformContextValue>(
    () => ({
      organizations: organizationRecords,
      facilities: facilityRecords,
      staffMembers: staffRecords,
      patients: patientRecords,
      appointments: appointmentRecords,
      bedAssignments: bedAssignmentRecords.filter((assignment) => assignment.facilityId === facilityId),
      activeOrganizationId: organizationId,
      activeFacilityId: safeFacilityId || facilityId,
      activeOrganization,
      activeFacility,
      organizationFacilities,
      setActiveOrganizationId,
      setActiveFacilityId,
      createOrganizationAndFacility,
      createStaffMember,
      registerPatient,
      scheduleAppointment,
      updateAppointmentStatus,
      admitPatientToBed,
      transferPatientInBed,
      dischargePatientFromBed,
    }),
    [organizationId, facilityId, patientRecords, appointmentRecords, bedAssignmentRecords, organizationRecords, facilityRecords, staffRecords, activeOrganization, activeFacility, organizationFacilities]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within PlatformProvider");
  }
  return context;
}
