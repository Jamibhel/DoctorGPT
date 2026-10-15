"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { organizations, facilities, staffMembers as seedStaffMembers, patients as seedPatients, appointments as seedAppointments, type Organization, type Facility, type Patient, type StaffMember, type Appointment, type AppointmentStatus, type FacilityType } from "./mock-platform";
import { createAppointmentRecord, createPatientRecord, createStaffRecord } from "./platform-operations";

export type PlatformContextValue = {
  organizations: Organization[];
  facilities: Facility[];
  staffMembers: StaffMember[];
  patients: Patient[];
  appointments: Appointment[];
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
  }) => { organization: Organization; facility: Facility };
  createStaffMember: (input: {
    facilityId?: string;
    name: string;
    email: string;
    role: StaffMember["role"];
    department: string;
    status?: StaffMember["status"];
  }) => StaffMember;
  registerPatient: (input: {
    facilityId?: string;
    mrn: string;
    name: string;
    dob: string;
  }) => Patient;
  scheduleAppointment: (input: {
    facilityId?: string;
    patientName: string;
    clinician: string;
    time: string;
    type: string;
    status?: AppointmentStatus;
  }) => Appointment;
};

const PlatformContext = createContext<PlatformContextValue | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [organizationRecords, setOrganizationRecords] = useState<Organization[]>(organizations);
  const [facilityRecords, setFacilityRecords] = useState<Facility[]>(facilities);
  const [staffRecords, setStaffRecords] = useState<StaffMember[]>(seedStaffMembers);
  const [organizationId, setOrganizationId] = useState<string>(organizations[0]?.id ?? "");
  const [facilityId, setFacilityId] = useState<string>(
    facilities.find((facility) => facility.organizationId === organizations[0]?.id)?.id ?? facilities[0]?.id ?? ""
  );
  const [patientRecords, setPatientRecords] = useState<Patient[]>(seedPatients);
  const [appointmentRecords, setAppointmentRecords] = useState<Appointment[]>(seedAppointments);

  const activeOrganization = organizationRecords.find((organization) => organization.id === organizationId) ?? organizationRecords[0];
  const organizationFacilities = facilityRecords.filter((facility) => facility.organizationId === organizationId);
  const activeFacility = organizationFacilities.find((facility) => facility.id === facilityId)
    ?? facilityRecords.find((facility) => facility.id === facilityId)
    ?? organizationFacilities[0]
    ?? facilityRecords[0];

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
  }: {
    organizationName: string;
    adminEmail: string;
    billingAddress: string;
    facilityName: string;
    facilityType: FacilityType;
    city: string;
    timezone: string;
    adminName?: string;
  }) => {
    const orgId = `org-${Date.now()}`;
    const facilityIdValue = `fac-${Date.now()}`;

    const organization: Organization = {
      id: orgId,
      name: organizationName.trim(),
      adminEmail: adminEmail.trim(),
      status: "pending",
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
      status: "review",
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

  const syncInvitedStaff = (staff: StaffMember) => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = localStorage.getItem("doctorgpt_invited_staff");
    const currentList = raw ? JSON.parse(raw) : [] as Array<StaffMember & { password?: string; title?: string; departmentName?: string }>;
    const nextList = [...currentList.filter((member: any) => member.facilityId !== staff.facilityId || member.email !== staff.email), {
      ...staff,
      password: "1234",
      title: "Invited Staff Member",
      departmentName: "Clinical Services",
    }];
    localStorage.setItem("doctorgpt_invited_staff", JSON.stringify(nextList));
  };

  const createStaffMember = ({ facilityId: targetFacilityId, name, email, role, department, status = "invited" }: {
    facilityId?: string;
    name: string;
    email: string;
    role: StaffMember["role"];
    department: string;
    status?: StaffMember["status"];
  }) => {
    const memberFacilityId = targetFacilityId ?? activeFacility?.id ?? facilityId;
    const staff: StaffMember = createStaffRecord({
      facilityId: memberFacilityId,
      name,
      email,
      role,
      department,
      status,
    });

    setStaffRecords((current) => [staff, ...current]);
    syncInvitedStaff(staff);
    return staff;
  };

  const registerPatient = ({ facilityId: targetFacilityId, mrn, name, dob }: {
    facilityId?: string;
    mrn: string;
    name: string;
    dob: string;
  }) => {
    const patientFacilityId = targetFacilityId ?? activeFacility?.id ?? facilityId;
    const patient: Patient = createPatientRecord({
      facilityId: patientFacilityId,
      mrn,
      name,
      dob,
      status: "registered",
    });

    setPatientRecords((current) => [patient, ...current]);
    return patient;
  };

  const scheduleAppointment = ({ facilityId: targetFacilityId, patientName, clinician, time, type, status = "scheduled" }: {
    facilityId?: string;
    patientName: string;
    clinician: string;
    time: string;
    type: string;
    status?: AppointmentStatus;
  }) => {
    const appointmentFacilityId = targetFacilityId ?? activeFacility?.id ?? facilityId;
    const appointment: Appointment = createAppointmentRecord({
      facilityId: appointmentFacilityId,
      patientName,
      clinician,
      time,
      type,
      status,
    });

    setAppointmentRecords((current) => [appointment, ...current]);
    return appointment;
  };

  const value = useMemo<PlatformContextValue>(
    () => ({
      organizations: organizationRecords,
      facilities: facilityRecords,
      staffMembers: staffRecords,
      patients: patientRecords,
      appointments: appointmentRecords,
      activeOrganizationId: organizationId,
      activeFacilityId: facilityId,
      activeOrganization,
      activeFacility,
      organizationFacilities,
      setActiveOrganizationId,
      setActiveFacilityId,
      createOrganizationAndFacility,
      createStaffMember,
      registerPatient,
      scheduleAppointment,
    }),
    [organizationId, facilityId, patientRecords, appointmentRecords, organizationRecords, facilityRecords, staffRecords, activeOrganization, activeFacility, organizationFacilities]
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
