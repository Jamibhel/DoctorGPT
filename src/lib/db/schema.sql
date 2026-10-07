-- ============================================================================
-- BJI MediSupport - Enterprise Relational Multi-Tenant Database Schema
-- Connected healthcare. One platform.
-- Strict tenant isolation via facility_id with high-performance composite indexes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TENANT MANAGEMENT & FACILITIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(16) NOT NULL UNIQUE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('HOSPITAL', 'CLINIC', 'MEDICAL_CENTER', 'DIAGNOSTIC_CENTER', 'SPECIALIST_CENTER')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ONBOARDING', 'SUSPENDED', 'MAINTENANCE')),
    mrn_prefix VARCHAR(16) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(128) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    total_bed_capacity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facilities_code ON facilities(code);
CREATE INDEX idx_facilities_type_status ON facilities(type, status);

-- ----------------------------------------------------------------------------
-- 2. GRANULAR RBAC: ROLES & PERMISSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_facility_role UNIQUE(facility_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_roles_facility ON roles(facility_id);

-- ----------------------------------------------------------------------------
-- 3. STAFF & PRACTITIONERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_members (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    email VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('PHYSICIAN', 'NURSE', 'PHARMACIST', 'RADIOLOGIST', 'HOSPITAL_ADMINISTRATOR')),
    department_id VARCHAR(64) NOT NULL,
    npi VARCHAR(32),
    license_number VARCHAR(64),
    pager_number VARCHAR(32),
    on_call BOOLEAN NOT NULL DEFAULT FALSE,
    active_shift VARCHAR(16) NOT NULL DEFAULT 'DAY' CHECK (active_shift IN ('DAY', 'NIGHT', 'SWING')),
    pin_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_facility_staff_email UNIQUE(facility_id, email)
);

CREATE INDEX idx_staff_facility_role ON staff_members(facility_id, role);
CREATE INDEX idx_staff_facility_dept ON staff_members(facility_id, department_id);

-- ----------------------------------------------------------------------------
-- 4. DEPARTMENTS & WARDS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    floor INTEGER NOT NULL,
    building VARCHAR(128) NOT NULL,
    total_beds INTEGER NOT NULL DEFAULT 0,
    lead_physician_id VARCHAR(64),
    nurse_manager_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_facility ON departments(facility_id);
CREATE INDEX idx_departments_facility_type ON departments(facility_id, type);

-- ----------------------------------------------------------------------------
-- 5. BEDS & BED ASSIGNMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS beds (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    ward_id VARCHAR(64) NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    room_number VARCHAR(32) NOT NULL,
    bed_number VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESERVED', 'MAINTENANCE')),
    current_encounter_id VARCHAR(64),
    current_patient_id VARCHAR(64),
    cleaning_started_at TIMESTAMP WITH TIME ZONE,
    is_icu_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    telemetry_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_ward_room_bed UNIQUE(ward_id, room_number, bed_number)
);

-- HIGH PERFORMANCE BED MATRIX INDEXES
CREATE INDEX idx_beds_facility_status ON beds(facility_id, status);
CREATE INDEX idx_beds_facility_ward_status ON beds(facility_id, ward_id, status);
CREATE INDEX idx_beds_facility_patient ON beds(facility_id, current_patient_id);

-- ----------------------------------------------------------------------------
-- 6. PATIENT REGISTRY & ALLERGIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    mrn VARCHAR(32) NOT NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    date_of_birth DATE NOT NULL,
    sex VARCHAR(16) NOT NULL CHECK (sex IN ('M', 'F', 'OTHER')),
    blood_type VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
    phone VARCHAR(32) NOT NULL,
    address TEXT NOT NULL,
    primary_language VARCHAR(64) NOT NULL DEFAULT 'English',
    emergency_contact_json JSONB NOT NULL,
    active_conditions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_facility_mrn UNIQUE(facility_id, mrn)
);

-- HIGH PERFORMANCE PATIENT TENANT INDEXES
CREATE INDEX idx_patients_facility_mrn ON patients(facility_id, mrn);
CREATE INDEX idx_patients_facility_names ON patients(facility_id, last_name, first_name);
CREATE INDEX idx_patients_facility_dob ON patients(facility_id, date_of_birth);

CREATE TABLE IF NOT EXISTS patient_allergies (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen VARCHAR(128) NOT NULL,
    substance_code VARCHAR(64),
    category VARCHAR(32) NOT NULL CHECK (category IN ('MEDICATION', 'FOOD', 'ENVIRONMENTAL', 'BIOLOGICAL')),
    reaction TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_allergies_facility_patient ON patient_allergies(facility_id, patient_id);

-- ----------------------------------------------------------------------------
-- 7. ENCOUNTERS & ADT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encounters (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_class VARCHAR(32) NOT NULL CHECK (encounter_class IN ('INPATIENT', 'EMERGENCY', 'OUTPATIENT', 'AMBULATORY')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PLANNED', 'IN_TRIAGE', 'ACTIVE', 'DISCHARGE_PENDING', 'DISCHARGED', 'CANCELLED')),
    department_id VARCHAR(64) NOT NULL REFERENCES departments(id),
    admitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at TIMESTAMP WITH TIME ZONE,
    attending_physician_id VARCHAR(64) NOT NULL,
    admitting_diagnosis TEXT NOT NULL,
    chief_complaint TEXT NOT NULL,
    triage_level SMALLINT CHECK (triage_level BETWEEN 1 AND 5),
    code_status VARCHAR(32) NOT NULL DEFAULT 'FULL_CODE' CHECK (code_status IN ('FULL_CODE', 'DNR', 'DNI', 'COMFORT_CARE')),
    active_bed_id VARCHAR(64),
    care_team_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_encounters_facility_status ON encounters(facility_id, status);
CREATE INDEX idx_encounters_facility_patient ON encounters(facility_id, patient_id);
CREATE INDEX idx_encounters_facility_dept ON encounters(facility_id, department_id);

-- ----------------------------------------------------------------------------
-- 8. VITALS & NEWS2 OBSERVATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vital_signs (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64) NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(64) NOT NULL,
    respiration_rate NUMERIC(5,2) NOT NULL,
    spo2 NUMERIC(5,2) NOT NULL,
    spo2_scale SMALLINT NOT NULL DEFAULT 1 CHECK (spo2_scale IN (1, 2)),
    supplemental_oxygen BOOLEAN NOT NULL DEFAULT FALSE,
    oxygen_flow_l_min NUMERIC(5,2),
    temperature_celsius NUMERIC(5,2) NOT NULL,
    systolic_bp NUMERIC(5,2) NOT NULL,
    diastolic_bp NUMERIC(5,2) NOT NULL,
    heart_rate NUMERIC(5,2) NOT NULL,
    consciousness VARCHAR(32) NOT NULL DEFAULT 'ALERT',
    blood_glucose_mg_dl NUMERIC(5,2),
    news2_score INTEGER NOT NULL,
    news2_risk_tier VARCHAR(16) NOT NULL CHECK (news2_risk_tier IN ('LOW', 'LOW_MEDIUM', 'MEDIUM', 'HIGH'))
);

CREATE INDEX idx_vitals_facility_patient_time ON vital_signs(facility_id, patient_id, timestamp DESC);
CREATE INDEX idx_vitals_facility_encounter ON vital_signs(facility_id, encounter_id);

-- ----------------------------------------------------------------------------
-- 9. CPOE ORDERS & eMAR ADMINISTRATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cpoe_orders (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64) NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    order_type VARCHAR(32) NOT NULL CHECK (order_type IN ('MEDICATION', 'LAB', 'RADIOLOGY', 'CONSULT', 'NURSING', 'DIET')),
    priority VARCHAR(16) NOT NULL DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'STAT')),
    status VARCHAR(32) NOT NULL DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'PHARMACY_VERIFIED', 'DISPENSED', 'ACTIVE', 'COMPLETED', 'DISCONTINUED', 'CANCELLED')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    ordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ordered_by VARCHAR(64) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(64),
    details_json JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_orders_facility_patient_status ON cpoe_orders(facility_id, patient_id, status);
CREATE INDEX idx_orders_facility_priority_time ON cpoe_orders(facility_id, priority, ordered_at DESC);
CREATE INDEX idx_orders_facility_type_status ON cpoe_orders(facility_id, order_type, status);

CREATE TABLE IF NOT EXISTS medication_administrations (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    order_id VARCHAR(64) NOT NULL REFERENCES cpoe_orders(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64) NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    administered_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'NOT_GIVEN' CHECK (status IN ('GIVEN', 'NOT_GIVEN', 'REFUSED', 'HELD', 'DELAYED')),
    administered_by VARCHAR(64),
    dose_given VARCHAR(64),
    route_given VARCHAR(64),
    held_reason TEXT,
    injection_site VARCHAR(64),
    cosigned_by VARCHAR(64)
);

CREATE INDEX idx_administrations_facility_scheduled ON medication_administrations(facility_id, scheduled_time, status);
CREATE INDEX idx_administrations_facility_patient ON medication_administrations(facility_id, patient_id);

-- ----------------------------------------------------------------------------
-- 10. DIAGNOSTIC LABS & RADIOLOGY STUDIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostic_labs (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64) NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name VARCHAR(128) NOT NULL,
    category VARCHAR(32) NOT NULL,
    value VARCHAR(64) NOT NULL,
    numeric_value NUMERIC(10,2),
    unit VARCHAR(32) NOT NULL,
    reference_range VARCHAR(64) NOT NULL,
    flag VARCHAR(16) NOT NULL DEFAULT 'NORMAL' CHECK (flag IN ('NORMAL', 'HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW')),
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resulted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    performing_lab VARCHAR(128) NOT NULL
);

CREATE INDEX idx_labs_facility_patient_time ON diagnostic_labs(facility_id, patient_id, resulted_at DESC);
CREATE INDEX idx_labs_facility_flag ON diagnostic_labs(facility_id, flag);

CREATE TABLE IF NOT EXISTS radiology_studies (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64) NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    study_type VARCHAR(128) NOT NULL,
    modality VARCHAR(32) NOT NULL CHECK (modality IN ('X_RAY', 'CT', 'MRI', 'ULTRASOUND')),
    body_site VARCHAR(128) NOT NULL,
    study_date TIMESTAMP WITH TIME ZONE NOT NULL,
    radiologist_id VARCHAR(64) NOT NULL,
    image_thumbnail_url TEXT NOT NULL,
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    is_critical_alert BOOLEAN NOT NULL DEFAULT FALSE,
    ai_annotations_json JSONB
);

CREATE INDEX idx_radiology_facility_patient_date ON radiology_studies(facility_id, patient_id, study_date DESC);

-- ----------------------------------------------------------------------------
-- 11. CLINICAL EVENT BUS & AUDIT LOGS (IMMUTABLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_events (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id VARCHAR(64) NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    author_role VARCHAR(32) NOT NULL,
    department_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    metadata JSONB
);

CREATE INDEX idx_events_facility_patient_time ON clinical_events(facility_id, patient_id, timestamp DESC);
CREATE INDEX idx_events_facility_type ON clinical_events(facility_id, type);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(128) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    previous_value TEXT,
    new_value TEXT,
    source VARCHAR(64) NOT NULL
);

CREATE INDEX idx_audit_logs_facility_time ON audit_logs(facility_id, timestamp DESC);
CREATE INDEX idx_audit_logs_facility_resource ON audit_logs(facility_id, resource_type, resource_id);
CREATE INDEX idx_audit_logs_facility_actor ON audit_logs(facility_id, actor_id);
