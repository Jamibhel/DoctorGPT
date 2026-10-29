const test = require('node:test');
const assert = require('node:assert/strict');
const { createPatientRecord, createAppointmentRecord, createStaffRecord, advanceAppointmentStatus, createBedAssignment, updateBedAssignmentStatus, createPlatformSnapshot, formatAppointmentTime, findMatchingPlatformPatient, validateFacilitySelection, resolveActiveFacilityId } = require('./platform-operations');

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
    patientId: 'pat-ava-patel',
    patientName: 'Ava Patel',
    clinician: 'Dr. Alex Morgan',
    time: '2026-10-16 09:30',
    type: 'Follow-up visit',
  });

  assert.equal(appointment.facilityId, 'fac-bji-center');
  assert.equal(appointment.patientId, 'pat-ava-patel');
  assert.equal(appointment.status, 'scheduled');
  assert.match(appointment.id, /^appt-/);
  assert.equal(appointment.patientName, 'Ava Patel');
});

test('portal patient identity matches the facility-scoped platform patient even when record shapes differ', () => {
  const platformPatients = [
    {
      id: 'pat-1001',
      facilityId: 'fac-bji-center',
      mrn: 'MRN-1001',
      name: 'Emma Thompson',
      dob: '1986-03-12',
      status: 'active',
      lastVisit: '2026-10-15',
    },
  ];

  const patientContext = {
    facilityId: 'fac-bji-center',
    mrn: 'BJI-SJM-001001',
    firstName: 'Emma',
    lastName: 'Thompson',
  };

  const matched = findMatchingPlatformPatient(platformPatients, patientContext);

  assert.ok(matched);
  assert.equal(matched.id, 'pat-1001');
  assert.equal(matched.name, 'Emma Thompson');
});

test('appointment timestamps render locally while legacy labels remain readable', () => {
  const formatted = formatAppointmentTime('2026-10-16T09:30:00.000Z');

  assert.match(formatted, /2026/);
  assert.notEqual(formatted, '2026-10-16T09:30:00.000Z');
  assert.equal(formatAppointmentTime('Now'), 'Now');
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

test('facility-scoped operations reject empty facility context before mutating records', () => {
  assert.throws(() => validateFacilitySelection({ facilityId: '', actionName: 'registering a patient' }), /Select a facility before registering a patient\./);
  assert.throws(() => validateFacilitySelection({ facilityId: '   ', actionName: 'scheduling an appointment' }), /Select a facility before scheduling an appointment\./);
});

test('session facility selection wins when the workspace facility is out of sync', () => {
  const active = resolveActiveFacilityId({
    currentFacilityId: 'fac-bji-clinic',
    preferredFacilityId: 'fac-riverview-south',
    fallbackFacilityId: 'fac-bji-center',
    organizationFacilities: ['fac-bji-center', 'fac-bji-clinic', 'fac-riverview-south'],
  });

  assert.equal(active, 'fac-riverview-south');
});

test('appointment queue status advances through the checked-in and active care states', () => {
  assert.equal(advanceAppointmentStatus('scheduled'), 'checked_in');
  assert.equal(advanceAppointmentStatus('checked_in'), 'in_progress');
  assert.equal(advanceAppointmentStatus('in_progress'), 'completed');
  assert.equal(advanceAppointmentStatus('completed'), 'completed');
});

test('admission bed assignments are created and discharge / transfer states remain valid', () => {
  const assignment = createBedAssignment({
    facilityId: 'fac-bji-center',
    patientName: 'Emma Thompson',
    bedName: 'Med-Surg 3A-14',
    department: 'Medical-Surgical',
  });

  assert.equal(assignment.facilityId, 'fac-bji-center');
  assert.equal(assignment.status, 'admitted');
  assert.equal(assignment.bedName, 'Med-Surg 3A-14');
  assert.equal(updateBedAssignmentStatus('admitted', 'transferred'), 'transferred');
  assert.equal(updateBedAssignmentStatus('transferred', 'discharged'), 'discharged');
  assert.equal(updateBedAssignmentStatus('admitted', 'discharged'), 'discharged');
  assert.equal(updateBedAssignmentStatus('discharged', 'transferred'), 'discharged');
});

test('platform snapshots keep patient, appointment, and bed state together for persistence', () => {
  const patient = createPatientRecord({
    facilityId: 'fac-bji-center',
    mrn: 'MRN-9002',
    name: 'Lucas Hart',
    dob: '1988-11-06',
  });

  const appointment = createAppointmentRecord({
    facilityId: 'fac-bji-center',
    patientName: 'Lucas Hart',
    clinician: 'Dr. Priya Shah',
    time: '2026-10-16 10:15',
    type: 'Consultation',
    status: 'scheduled',
  });

  const assignment = createBedAssignment({
    facilityId: 'fac-bji-center',
    patientName: 'Lucas Hart',
    bedName: 'ICU 1B-02',
    department: 'Intensive Care',
    status: 'admitted',
  });

  const snapshot = createPlatformSnapshot({
    organizations: [{ id: 'org-bji', name: 'BJI', adminEmail: 'info@bji.org' }],
    facilities: [{ id: 'fac-bji-center', organizationId: 'org-bji', name: 'BJI Center' }],
    staffMembers: [{ id: 'staff-1', facilityId: 'fac-bji-center', name: 'Dr. Priya Shah', email: 'priya@bji.org', role: 'physician', department: 'Cardiology', status: 'active' }],
    patients: [patient],
    appointments: [appointment],
    bedAssignments: [assignment],
    activeOrganizationId: 'org-bji',
    activeFacilityId: 'fac-bji-center',
  });

  assert.equal(snapshot.activeFacilityId, 'fac-bji-center');
  assert.equal(snapshot.patients.length, 1);
  assert.equal(snapshot.appointments[0].patientName, 'Lucas Hart');
  assert.equal(snapshot.bedAssignments[0].status, 'admitted');
});
