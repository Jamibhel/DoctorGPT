function toDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function createPatientRecord({ facilityId, mrn, name, dob, status = "registered" }) {
  return {
    id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityId,
    mrn,
    name,
    dob,
    status,
    lastVisit: toDateStamp(),
  };
}

function advanceAppointmentStatus(currentStatus, nextStatus) {
  const order = ["scheduled", "checked_in", "in_progress", "completed", "canceled"];
  const currentIndex = order.indexOf(currentStatus);

  if (nextStatus && order.includes(nextStatus)) {
    return nextStatus;
  }

  if (currentIndex === -1) {
    return currentStatus;
  }

  if (currentStatus === "completed" || currentStatus === "canceled") {
    return currentStatus;
  }

  const nextIndex = Math.min(currentIndex + 1, order.length - 2);
  return order[nextIndex];
}

function createBedAssignment({ facilityId, patientName, bedName, department = "Medical-Surgical", status = "admitted" }) {
  return {
    id: `bed-assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityId,
    patientName,
    bedName,
    department,
    status,
    assignedAt: new Date().toISOString(),
  };
}

function updateBedAssignmentStatus(currentStatus, nextStatus) {
  const order = ["admitted", "transferred", "discharged"];
  const currentIndex = order.indexOf(currentStatus);

  if (currentStatus === "discharged") {
    return "discharged";
  }

  if (nextStatus && order.includes(nextStatus)) {
    if (nextStatus === "discharged") {
      return "discharged";
    }

    if (nextStatus === "transferred") {
      return "transferred";
    }

    if (nextStatus === "admitted") {
      return "admitted";
    }
  }

  if (currentIndex === -1) {
    return currentStatus;
  }

  const nextIndex = Math.min(currentIndex + 1, order.length - 1);
  return order[nextIndex];
}

function formatAppointmentTime(value) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function createAppointmentRecord({ facilityId, patientId, patientName, clinician, time, type, status = "scheduled" }) {
  return {
    id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityId,
    ...(patientId ? { patientId } : {}),
    patientName,
    clinician,
    time,
    type,
    status,
  };
}

function validateFacilitySelection({ facilityId, actionName }) {
  const resolvedFacilityId = facilityId?.trim?.() || "";
  if (!resolvedFacilityId) {
    throw new Error(`Select a facility before ${actionName}.`);
  }
  return resolvedFacilityId;
}

function resolveActiveFacilityId({
  currentFacilityId,
  preferredFacilityId,
  fallbackFacilityId,
  organizationFacilities = [],
}) {
  const allowedFacilities = Array.isArray(organizationFacilities) ? organizationFacilities.filter(Boolean) : [];
  const preferred = preferredFacilityId?.trim?.() || "";
  const current = currentFacilityId?.trim?.() || "";
  const fallback = fallbackFacilityId?.trim?.() || "";

  if (preferred && allowedFacilities.includes(preferred)) {
    return preferred;
  }

  if (current && allowedFacilities.includes(current)) {
    return current;
  }

  if (fallback && allowedFacilities.includes(fallback)) {
    return fallback;
  }

  return allowedFacilities[0] || preferred || current || fallback || "";
}

function normalizePatientName(patientLike) {
  const name = typeof patientLike?.name === "string" && patientLike.name.trim()
    ? patientLike.name.trim()
    : [patientLike?.firstName, patientLike?.lastName].filter(Boolean).join(" ").trim();

  return name.replace(/\s+/g, " ");
}

function findMatchingPlatformPatient(platformPatients = [], portalPatientContext = {}) {
  if (!Array.isArray(platformPatients) || platformPatients.length === 0) {
    return null;
  }

  const facilityId = portalPatientContext.facilityId;
  const portalMrn = typeof portalPatientContext.mrn === "string" ? portalPatientContext.mrn.trim().toUpperCase() : "";
  const firstName = typeof portalPatientContext.firstName === "string" ? portalPatientContext.firstName.trim() : "";
  const lastName = typeof portalPatientContext.lastName === "string" ? portalPatientContext.lastName.trim() : "";
  const candidateName = `${firstName} ${lastName}`.trim();

  return platformPatients.find((patient) => {
    if (facilityId && patient.facilityId !== facilityId) {
      return false;
    }

    const patientName = normalizePatientName(patient);
    const patientMrn = typeof patient.mrn === "string" ? patient.mrn.trim().toUpperCase() : "";

    if (portalMrn && patientMrn && patientMrn === portalMrn) {
      return true;
    }

    if (candidateName && patientName && patientName.toLowerCase() === candidateName.toLowerCase()) {
      return true;
    }

    if (portalMrn && patientMrn && patientMrn.replace(/[^A-Z0-9]/g, "") === portalMrn.replace(/[^A-Z0-9]/g, "")) {
      return true;
    }

    return false;
  }) || null;
}

function createStaffRecord({ facilityId, name, email, role, department, status = "invited" }) {
  return {
    id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityId,
    name,
    email,
    role,
    department,
    status,
  };
}

function createPlatformSnapshot({
  organizations = [],
  facilities = [],
  staffMembers = [],
  patients = [],
  appointments = [],
  bedAssignments = [],
  activeOrganizationId = "",
  activeFacilityId = "",
}) {
  return {
    organizations,
    facilities,
    staffMembers,
    patients,
    appointments,
    bedAssignments,
    activeOrganizationId,
    activeFacilityId,
  };
}

module.exports = {
  advanceAppointmentStatus,
  createBedAssignment,
  updateBedAssignmentStatus,
  formatAppointmentTime,
  createPatientRecord,
  createAppointmentRecord,
  createStaffRecord,
  createPlatformSnapshot,
  findMatchingPlatformPatient,
  validateFacilitySelection,
  resolveActiveFacilityId,
};
