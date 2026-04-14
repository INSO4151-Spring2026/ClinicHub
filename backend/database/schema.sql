-- Active: 1772580328224@@127.0.0.1@5432@clinichub
-- =============================================================================
-- ClinicHUB - PostgreSQL Database Schema
-- Tables: ROLES, USERS, PATIENTS, CPT, DIAGNOSIS, APPOINTMENTS, MEDICAL_RECORDS
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- Required for exclusion constraints involving scalar equality (e.g., INT WITH =)
-- NOTE: May require elevated privileges depending on your Postgres setup.
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================================================
-- ROLES
-- Simple lookup table for user permission levels
-- =============================================================================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Seed default roles
INSERT INTO
    roles (name)
VALUES ('admin'),
    ('doctor'),
    ('nurse'),
    ('receptionist');

-- =============================================================================
-- USERS
-- Staff accounts; each user belongs to exactly one role
-- =============================================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles (role_id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash BYTEA NOT NULL, -- Store bcrypt hash bytes only!!
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_role_id ON users (role_id);

-- =============================================================================
-- PATIENTS
-- Demographic and contact information for each patient
-- =============================================================================
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    sex VARCHAR(20) CHECK (
        sex IN (
            'male',
            'female',
            'other',
            'prefer_not_to_say'
        )
    ),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_last_name ON patients (last_name);

CREATE INDEX idx_patients_email ON patients (email);

-- =============================================================================
-- CPT_CODES
-- Standard CPT code definitions for procedures and services
-- Used by frontend for dropdowns and price lookups
-- =============================================================================
CREATE TABLE cpt_codes (
    cpt_code_id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- e.g., '99213'
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- e.g., 'Office Visit', 'Lab Test'
    default_price DECIMAL(10, 2) NOT NULL CHECK (default_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cpt_codes_code ON cpt_codes (code);

CREATE INDEX idx_cpt_codes_category ON cpt_codes (category);

CREATE INDEX idx_cpt_codes_active ON cpt_codes (is_active);

-- Seed common CPT codes
INSERT INTO
    cpt_codes (
        code,
        description,
        category,
        default_price
    )
VALUES (
        '99213',
        'Office visit - established patient',
        'Office Visit',
        150.00
    ),
    (
        '99214',
        'Office visit - detailed',
        'Office Visit',
        200.00
    ),
    (
        '99215',
        'Office visit - comprehensive',
        'Office Visit',
        250.00
    ),
    (
        '80053',
        'Comprehensive metabolic panel',
        'Lab Test',
        45.00
    ),
    (
        '85025',
        'Complete blood count',
        'Lab Test',
        35.00
    ),
    (
        '36415',
        'Routine venipuncture',
        'Lab Test',
        25.00
    ),
    (
        '90471',
        'Immunization administration',
        'Immunization',
        30.00
    ),
    (
        '90715',
        'Tetanus, diphtheria toxoids vaccine',
        'Immunization',
        50.00
    );

-- =============================================================================
-- CPT  (Current Procedural Terminology)
-- Procedure/billing record per patient visit; referenced by APPOINTMENTS
-- =============================================================================
CREATE TABLE cpt (
    cpt_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients (patient_id) ON DELETE RESTRICT,
    cpt_code_id INT NOT NULL REFERENCES cpt_codes (cpt_code_id) ON DELETE RESTRICT,
    service_date DATE NOT NULL,
    billing_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'submitted',
            'paid',
            'overdue',
            'cancelled'
        )
    ),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    total DECIMAL(10, 2) GENERATED ALWAYS AS (subtotal + tax) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cpt_patient_id ON cpt (patient_id);

CREATE INDEX idx_cpt_code_id ON cpt (cpt_code_id);

CREATE INDEX idx_cpt_service_date ON cpt (service_date);

-- =============================================================================
-- DIAGNOSIS
-- Diagnostic codes (e.g. ICD-10) linked to a CPT billing entry
-- =============================================================================
CREATE TABLE diagnosis (
    diagnosis_id SERIAL PRIMARY KEY,
    cpt_id INT NOT NULL REFERENCES cpt (cpt_id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description VARCHAR(255),
    diagnosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX idx_diagnosis_cpt_id ON diagnosis (cpt_id);

CREATE INDEX idx_diagnosis_code ON diagnosis (code);

-- =============================================================================
-- APPOINTMENTS
-- Core scheduling table; links patient, provider (user), and CPT billing entry
-- =============================================================================
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients (patient_id) ON DELETE CASCADE,
    provider_user_id INT NOT NULL REFERENCES users (user_id) ON DELETE RESTRICT,
    cpt_id INT REFERENCES cpt (cpt_id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (
        status IN (
            'scheduled',
            'confirmed',
            'in_progress',
            'completed',
            'cancelled',
            'no_show'
        )
    ),
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Prevent double-booking: a provider cannot have two appointments at the same start time
    CONSTRAINT uq_provider_timeslot UNIQUE (
        provider_user_id,
        scheduled_start
    ),
    -- End time must be after start time
    CONSTRAINT chk_appt_times CHECK (
        scheduled_end > scheduled_start
    )
);

-- Prevent overlapping appointments for a provider.
-- Allows overlaps only when prior appointments are cancelled/no-show.
ALTER TABLE appointments
ADD CONSTRAINT ex_appt_no_overlap EXCLUDE USING gist (
    provider_user_id
    WITH
        =,
        tstzrange (
            scheduled_start,
            scheduled_end,
            '[)'
        )
    WITH
        &&
)
WHERE (
        status NOT IN ('cancelled', 'no_show')
    );

CREATE INDEX idx_appt_patient_id ON appointments (patient_id);

CREATE INDEX idx_appt_provider_user_id ON appointments (provider_user_id);

CREATE INDEX idx_appt_scheduled_start ON appointments (scheduled_start);

CREATE INDEX idx_appt_status ON appointments (status);
-- Composite index optimises the doctor's daily calendar view
CREATE INDEX idx_appt_provider_date ON appointments (
    provider_user_id,
    scheduled_start
);

-- =============================================================================
-- INVOICES
-- Represents a finalized bill for an appointment / CPT record
-- =============================================================================
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,

    appointment_id INT NOT NULL REFERENCES appointments (appointment_id) ON DELETE CASCADE,
    cpt_id INT NOT NULL REFERENCES cpt (cpt_id) ON DELETE RESTRICT,

    patient_id INT NOT NULL REFERENCES patients (patient_id) ON DELETE RESTRICT,

    status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (status IN ('unpaid', 'paid')),

    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate invoices for same appointment
    CONSTRAINT uq_invoice_appointment UNIQUE (appointment_id)
);

CREATE INDEX idx_invoices_patient_id ON invoices (patient_id);
CREATE INDEX idx_invoices_status ON invoices (status);

-- =============================================================================
-- MEDICAL_RECORDS
-- Clinical notes and treatment plans written per visit
-- A patient accumulates many records over time
-- =============================================================================
CREATE TABLE medical_records (
    medical_record_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients (patient_id) ON DELETE CASCADE,
    appointment_id INT REFERENCES appointments (appointment_id) ON DELETE SET NULL,
    provider_user_id INT REFERENCES users (user_id) ON DELETE SET NULL,
    record_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diagnosis VARCHAR(255),
    treatment_plan TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medrec_patient_id ON medical_records (patient_id);

CREATE INDEX idx_medrec_appointment_id ON medical_records (appointment_id);

CREATE INDEX idx_medrec_record_date ON medical_records (record_date);

-- =============================================================================
-- AUDIT LOG
-- HIPAA-awareness: records every read/write on sensitive tables
-- =============================================================================
CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users (user_id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (
        action IN (
            'READ',
            'CREATE',
            'UPDATE',
            'DELETE'
        )
    ),
    target_table VARCHAR(100) NOT NULL,
    target_id TEXT, -- PK of the affected row stored as text
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_log (user_id);

CREATE INDEX idx_audit_target ON audit_log (target_table, target_id);

CREATE INDEX idx_audit_timestamp ON audit_log (created_at);

-- =============================================================================
-- AUTO updated_at TRIGGER FUNCTION
-- Apply to any table that needs change-tracking (extend as needed)
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();