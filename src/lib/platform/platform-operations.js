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

function createAppointmentRecord({ facilityId, patientName, clinician, time, type, status = "scheduled" }) {
  return {
    id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilityId,
    patientName,
    clinician,
    time,
    type,
    status,
  };
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

module.exports = {
  createPatientRecord,
  createAppointmentRecord,
  createStaffRecord,
};
