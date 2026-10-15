export type Role =
  | "organization_admin"
  | "facility_admin"
  | "physician"
  | "nurse"
  | "front_desk"
  | "patient";

export type FacilityType =
  | "clinic"
  | "hospital"
  | "diagnostic_center"
  | "specialist_center";

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "canceled";

export type Organization = {
  id: string;
  name: string;
  adminEmail: string;
  status: "active" | "pending";
  facilities: number;
  staff: number;
  patients: number;
};

export type Facility = {
  id: string;
  organizationId: string;
  name: string;
  facilityType: FacilityType;
  city: string;
  timezone: string;
  status: "active" | "review";
  beds: number;
};

export type StaffMember = {
  id: string;
  facilityId: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: "active" | "invited";
};

export type Patient = {
  id: string;
  facilityId: string;
  mrn: string;
  name: string;
  dob: string;
  status: "registered" | "active" | "archived";
  lastVisit: string;
};

export type Appointment = {
  id: string;
  facilityId: string;
  patientName: string;
  clinician: string;
  time: string;
  type: string;
  status: AppointmentStatus;
};

export const platformSummary = {
  organizations: 6,
  facilities: 14,
  staff: 128,
  activePatients: 1846,
};

export const organizations: Organization[] = [
  {
    id: "org-bji",
    name: "BJI Health Group",
    adminEmail: "admin@bjigroup.health",
    status: "active",
    facilities: 4,
    staff: 42,
    patients: 548,
  },
  {
    id: "org-riverview",
    name: "Riverview Care Network",
    adminEmail: "ops@riverviewcare.org",
    status: "active",
    facilities: 3,
    staff: 28,
    patients: 312,
  },
];

export const facilities: Facility[] = [
  {
    id: "fac-bji-center",
    organizationId: "org-bji",
    name: "BJI Community Medical Center",
    facilityType: "hospital",
    city: "Austin",
    timezone: "CT",
    status: "active",
    beds: 184,
  },
  {
    id: "fac-bji-clinic",
    organizationId: "org-bji",
    name: "BJI Family Clinic",
    facilityType: "clinic",
    city: "Round Rock",
    timezone: "CT",
    status: "active",
    beds: 18,
  },
  {
    id: "fac-riverview-south",
    organizationId: "org-riverview",
    name: "Riverview South Clinic",
    facilityType: "clinic",
    city: "Dallas",
    timezone: "CT",
    status: "review",
    beds: 12,
  },
  {
    id: "fac-riverview-specialty",
    organizationId: "org-riverview",
    name: "Riverview Specialty Center",
    facilityType: "specialist_center",
    city: "Plano",
    timezone: "CT",
    status: "active",
    beds: 30,
  },
];

export const staffMembers: StaffMember[] = [
  {
    id: "staff-1",
    facilityId: "fac-bji-center",
    name: "Dr. Alex Morgan",
    email: "alex.morgan@bjigroup.health",
    role: "physician",
    department: "Internal Medicine",
    status: "active",
  },
  {
    id: "staff-2",
    facilityId: "fac-bji-center",
    name: "Nina Patel",
    email: "nina.patel@bjigroup.health",
    role: "nurse",
    department: "Acute Care",
    status: "active",
  },
  {
    id: "staff-3",
    facilityId: "fac-bji-clinic",
    name: "Jenna Brooks",
    email: "jenna.brooks@bjigroup.health",
    role: "front_desk",
    department: "Operations",
    status: "active",
  },
  {
    id: "staff-4",
    facilityId: "fac-riverview-south",
    name: "Miguel Otto",
    email: "miguel.otto@riverviewcare.org",
    role: "facility_admin",
    department: "Administration",
    status: "invited",
  },
];

export const patients: Patient[] = [
  {
    id: "pat-1001",
    facilityId: "fac-bji-center",
    mrn: "MRN-1001",
    name: "Emma Thompson",
    dob: "1986-03-12",
    status: "active",
    lastVisit: "2026-10-15",
  },
  {
    id: "pat-1002",
    facilityId: "fac-bji-center",
    mrn: "MRN-1002",
    name: "Lucas Hart",
    dob: "1972-11-05",
    status: "registered",
    lastVisit: "2026-10-14",
  },
  {
    id: "pat-1003",
    facilityId: "fac-bji-clinic",
    mrn: "MRN-2001",
    name: "Alicia Green",
    dob: "1992-07-28",
    status: "active",
    lastVisit: "2026-10-13",
  },
];

export const appointments: Appointment[] = [
  {
    id: "appt-1",
    facilityId: "fac-bji-center",
    patientName: "Emma Thompson",
    clinician: "Dr. Alex Morgan",
    time: "09:00 AM",
    type: "Follow-up visit",
    status: "scheduled",
  },
  {
    id: "appt-2",
    facilityId: "fac-bji-center",
    patientName: "Lucas Hart",
    clinician: "Nina Patel",
    time: "10:30 AM",
    type: "Nurse assessment",
    status: "checked_in",
  },
  {
    id: "appt-3",
    facilityId: "fac-bji-clinic",
    patientName: "Alicia Green",
    clinician: "Jenna Brooks",
    time: "01:15 PM",
    type: "Wellness consult",
    status: "in_progress",
  },
];
