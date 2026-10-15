const test = require('node:test');
const assert = require('node:assert/strict');
const { createPatientRecord, createAppointmentRecord, createStaffRecord } = require('./platform-operations');

test('patients are created with the selected facility context', () => {
  const patient = createPatientRecord({
    facilityId: 'fac-bji-center',
    mrn: 'MRN-9001',
    name: 'Ava Patel',
    dob: '1998-02-14',
  });

  assert.equal(patient.facilityId, 'fac-bji-center');
  assert.equal(patient.status, 'registered');
  assert.match(patient.id, /^pat-/);
  assert.equal(patient.mrn, 'MRN-9001');
});

test('appointments are created with the selected facility context', () => {
  const appointment = createAppointmentRecord({
    facilityId: 'fac-bji-center',
    patientName: 'Ava Patel',
    clinician: 'Dr. Alex Morgan',
    time: '2026-10-16 09:30',
    type: 'Follow-up visit',
  });

  assert.equal(appointment.facilityId, 'fac-bji-center');
  assert.equal(appointment.status, 'scheduled');
  assert.match(appointment.id, /^appt-/);
  assert.equal(appointment.patientName, 'Ava Patel');
});

test('staff invitations are created in the selected facility context', () => {
  const staff = createStaffRecord({
    facilityId: 'fac-bji-center',
    name: 'Dr. Priya Shah',
    email: 'priya.shah@bji.org',
    role: 'physician',
    department: 'Cardiology',
    status: 'invited',
  });

  assert.equal(staff.facilityId, 'fac-bji-center');
  assert.equal(staff.role, 'physician');
  assert.equal(staff.status, 'invited');
  assert.match(staff.id, /^staff-/);
  assert.equal(staff.email, 'priya.shah@bji.org');
});
