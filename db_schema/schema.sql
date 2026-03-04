-- =============================================================================
-- ClinicHUB - PostgreSQL Database Schema
-- Tables: ROLES, USERS, PATIENTS, CPT, DIAGNOSIS, APPOINTMENTS, MEDICAL_RECORDS
-- =============================================================================


-- =============================================================================
-- ROLES
-- Simple lookup table for user permission levels
-- =============================================================================
CREATE TABLE roles (
    role_id     SERIAL          PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL UNIQUE
);

-- Seed default roles
INSERT INTO roles (name) VALUES
    ('admin'),
    ('doctor'),
    ('nurse'),
    ('receptionist');


-- =============================================================================
-- USERS
-- Staff accounts; each user belongs to exactly one role
-- =============================================================================
CREATE TABLE users (
    user_id         SERIAL          PRIMARY KEY,
    role_id         INT             NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,   -- Store bcrypt hash only; never plaintext
    phone           VARCHAR(20),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);


-- =============================================================================
-- PATIENTS
-- Demographic and contact information for each patient
-- =============================================================================
CREATE TABLE patients (
    patient_id                  SERIAL          PRIMARY KEY,
    first_name                  VARCHAR(100)    NOT NULL,
    last_name                   VARCHAR(100)    NOT NULL,
    dob                         DATE            NOT NULL,
    sex                         VARCHAR(20),
    email                       VARCHAR(255)    UNIQUE,
    phone                       VARCHAR(20),
    address                     VARCHAR(255),
    emergency_contact_name      VARCHAR(150),
    emergency_contact_phone     VARCHAR(20),
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_email     ON patients(email);


-- =============================================================================
-- CPT  (Current Procedural Terminology)
-- Procedure/billing record per patient visit; referenced by APPOINTMENTS
-- =============================================================================
CREATE TABLE cpt (
    cpt_id          SERIAL          PRIMARY KEY,
    patient_id      INT             NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
    cpt_date        DATE,
    run_date        DATE,
    status          VARCHAR(30),
    quantity        INT             NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal        DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    tax             DECIMAL(10,2)   NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    total           DECIMAL(10,2)   GENERATED ALWAYS AS (subtotal + tax) STORED,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cpt_patient_id ON cpt(patient_id);
CREATE INDEX idx_cpt_cpt_date   ON cpt(cpt_date);


-- =============================================================================
-- DIAGNOSIS
-- Diagnostic codes (e.g. ICD-10) linked to a CPT billing entry
-- =============================================================================
CREATE TABLE diagnosis (
    diagnosis_id    SERIAL          PRIMARY KEY,
    cpt_id          INT             NOT NULL REFERENCES cpt(cpt_id) ON DELETE CASCADE,
    code            VARCHAR(20)     NOT NULL,
    description     VARCHAR(255),
    diagnosed_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    notes           TEXT
);

CREATE INDEX idx_diagnosis_cpt_id ON diagnosis(cpt_id);
CREATE INDEX idx_diagnosis_code   ON diagnosis(code);


-- =============================================================================
-- APPOINTMENTS
-- Core scheduling table; links patient, provider (user), and CPT billing entry
-- =============================================================================
CREATE TABLE appointments (
    appointment_id      SERIAL          PRIMARY KEY,
    patient_id          INT             NOT NULL REFERENCES patients(patient_id)     ON DELETE CASCADE,
    provider_user_id    INT             NOT NULL REFERENCES users(user_id)            ON DELETE RESTRICT,
    cpt_id              INT                      REFERENCES cpt(cpt_id)               ON DELETE SET NULL,
    scheduled_start     TIMESTAMPTZ     NOT NULL,
    scheduled_end       TIMESTAMPTZ     NOT NULL,
    status              VARCHAR(30)     NOT NULL DEFAULT 'scheduled'
                            CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
    reason              VARCHAR(255),
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Prevent double-booking: a provider cannot have two appointments at the same start time
    CONSTRAINT uq_provider_timeslot UNIQUE (provider_user_id, scheduled_start),

    -- End time must be after start time
    CONSTRAINT chk_appt_times CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX idx_appt_patient_id        ON appointments(patient_id);
CREATE INDEX idx_appt_provider_user_id  ON appointments(provider_user_id);
CREATE INDEX idx_appt_scheduled_start   ON appointments(scheduled_start);
CREATE INDEX idx_appt_status            ON appointments(status);
-- Composite index optimises the doctor's daily calendar view
CREATE INDEX idx_appt_provider_date     ON appointments(provider_user_id, scheduled_start);


-- =============================================================================
-- MEDICAL_RECORDS
-- Clinical notes and treatment plans written per visit
-- A patient accumulates many records over time
-- =============================================================================
CREATE TABLE medical_records (
    medical_record_id   SERIAL          PRIMARY KEY,
    patient_id          INT             NOT NULL REFERENCES patients(patient_id)         ON DELETE CASCADE,
    appointment_id      INT                      REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    provider_user_id    INT                      REFERENCES users(user_id)               ON DELETE SET NULL,
    record_date         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    diagnosis           VARCHAR(255),
    treatment_plan      TEXT,
    notes               TEXT
);

CREATE INDEX idx_medrec_patient_id     ON medical_records(patient_id);
CREATE INDEX idx_medrec_appointment_id ON medical_records(appointment_id);
CREATE INDEX idx_medrec_record_date    ON medical_records(record_date);


-- =============================================================================
-- AUDIT LOG
-- HIPAA-awareness: records every read/write on sensitive tables
-- =============================================================================
CREATE TABLE audit_log (
    log_id          BIGSERIAL       PRIMARY KEY,
    user_id         INT             REFERENCES users(user_id) ON DELETE SET NULL,
    action          VARCHAR(20)     NOT NULL CHECK (action IN ('READ','CREATE','UPDATE','DELETE')),
    target_table    VARCHAR(100)    NOT NULL,
    target_id       TEXT,           -- PK of the affected row stored as text
    ip_address      INET,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id   ON audit_log(user_id);
CREATE INDEX idx_audit_target    ON audit_log(target_table, target_id);
CREATE INDEX idx_audit_timestamp ON audit_log(created_at);


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
