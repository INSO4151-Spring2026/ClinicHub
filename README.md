# ClinicHub
### Comprehensive Management System for Small to Medium-Sized Clinics

Clinic Hub is a specialized healthcare management system designed to transition small healthcare practices—such as family practices, dental offices, and physical therapy centers—from fragmented paper-based or disconnected digital tools to a unified, secure platform.

---

## 📋 Project Context & Problem Statement

Small to medium-sized clinics handle a large portion of everyday healthcare but often struggle with outdated systems. While big hospitals have moved to integrated digital platforms, smaller clinics often can’t afford the same solutions.

- **Financial Barrier:** Traditional EHR implementation averages $162,000 in the first year for a small practice.
- **Administrative Chaos:** Family physicians spend nearly 50% of their workday on administrative tasks, leading to a 44% burnout rate.
- **Lean Technology Needs:** These clinics require low-maintenance but high-security systems suited for Ambulatory Care and Outpatient Management.

---

## 💡 The Solution

Clinic Hub provides a unified system to streamline operations and improve patient care by integrating:

- **Patient Records (EHR):** Secure, centralized digital health history  
- **Intelligent Scheduling:** Unified appointment management with conflict detection  
- **Integrated Billing:** Streamlined reconciliation  
- **Telemedicine Support:** Infrastructure for remote consultations  

---

## 🔐 Security & Authentication

The system implements a robust security layer to protect sensitive medical records (HIPAA-aligned principles), utilizing **JSON Web Tokens (JWT)** for stateless, secure communication.

### Authentication Logic

- **Dual-Token System:**
  - Access Token 
  - Refresh Token

- **Encryption Standard:**
  - Tokens signed using the **HS256 algorithm** with a server-side secret key

- **Authorization Middleware:**
  - `@require_auth` → Validates Bearer token and injects user into `flask.g`
  - `@require_role(*roles)` → Role-Based Access Control (RBAC)

---

## 🔑 Auth Endpoints (`/api/auth`)

| Method | Endpoint        | Description |
|--------|---------------|-------------|
| POST   | `/api/login`   | Authenticate user and return JWT pair |
| POST   | `/api/refresh` | Get new access token using refresh token |
| GET    | `/api/profile` | Retrieve authenticated user info |
| POST   | `/api/logout`  | Terminate session |

---

## 🏥 Patient Management API (`/api/patients`)

Manages Electronic Health Records (EHR) via a secure RESTful API.

| Method | Endpoint              | Description | Access |
|--------|----------------------|------------|--------|
| GET    | `/api/patients`      | List patients (pagination + search) | All Staff |
| POST   | `/api/patients`      | Create patient record | All Staff |
| GET    | `/api/patients/:id`  | Retrieve patient details | All Staff |
| PUT    | `/api/patients/:id`  | Update patient data | Admin, Doctor, Nurse |
| DELETE | `/api/patients/:id`  | Delete patient record | Admin |

### Key Features

- Server-side pagination  
- Global search (name/email)  
- Strict validation (DOB, gender identity)  

---

## 📅 Appointment Scheduling API (`/api/appointments`)

A scheduling engine designed to manage provider availability.

| Method | Endpoint                  | Description | Access |
|--------|--------------------------|------------|--------|
| GET    | `/api/appointments`      | List appointments with filters | All Staff |
| POST   | `/api/appointments`      | Create appointment | All Staff |
| GET    | `/api/appointments/:id`  | View appointment details | All Staff |
| PUT    | `/api/appointments/:id`  | Update/reschedule | All Staff |
| DELETE | `/api/appointments/:id`  | Cancel appointment (soft delete) | Admin, Doctor, Receptionist |

### Advanced Logic

- **Conflict Detection:** Prevents overlapping appointments (returns `409 Conflict`)
- **Soft-Cancel:** Marks appointments as `cancelled` instead of deleting
- **UTC Standardization:** Uses ISO-8601 (UTC) for time consistency

---

# ClinicHub – Scheduling & Billing API Documentation

## Overview

ClinicHub provides a RESTful API for managing patient appointments and billing workflows, including automatic CPT generation and invoice processing. The system enforces strict business rules to ensure data integrity across scheduling and financial records.

---

## Appointments API (`/api/appointments`)

The appointments module manages booking, updating, retrieving, and cancelling patient visits between providers and patients.

### Core Functionality

- Create, list, retrieve, update, and cancel appointments
- Prevent provider schedule conflicts
- Enforce valid time ranges (end time must be after start time)
- Support filtering, sorting, and pagination for appointment queries

### Business Rules

- An appointment requires:
  - `patient_id`
  - `provider_user_id`
  - `scheduled_start`
  - `scheduled_end`
- Only active providers can be assigned
- Overlapping appointments for the same provider are not allowed
- Completed or cancelled appointments cannot be rescheduled
- Cancelling an appointment performs a soft delete (status = `cancelled`)

### Automatic Billing Trigger

When an appointment status is updated to `completed`:
- A CPT record is automatically generated
- The CPT is linked to the appointment
- This CPT becomes the basis for invoice generation

---

## Invoices API (`/api/invoices`)

The invoices module manages billing records generated from completed appointments and CPT entries.

### Core Functionality

- Create invoices from completed appointments
- Update invoice payment status
- Retrieve all invoices

### Business Rules

- An invoice can only be created if:
  - The appointment exists
  - The appointment status is `completed`
  - A CPT record exists for the appointment
- Only one invoice is allowed per appointment
- Invoice status must be either:
  - `paid`
  - `unpaid`

### Payment Handling

- When an invoice is marked as `paid`:
  - The `paid_at` timestamp is automatically set
- When marked as `unpaid`:
  - The `paid_at` field is cleared

---

## System Workflow

1. **Appointment Created**
   - Patient books an appointment with a provider

2. **Appointment Completed**
   - Status updated to `completed`
   - System automatically generates CPT record

3. **Invoice Generation**
   - Invoice is created from CPT data
   - Linked to appointment and patient

4. **Payment Processing**
   - Invoice marked as `paid` or `unpaid`
   - Payment timestamp tracked automatically

---

## Key Edge Cases

- Provider scheduling conflicts are blocked automatically
- Completed/cancelled appointments cannot be modified for scheduling
- Invoice creation is blocked if CPT is missing
- Only one invoice per appointment is allowed
- Invalid status values are rejected for both appointments and invoices
- All time inputs must follow ISO-8601 format

---

## 🎯 Project Goals

- **Reduce Burnout:** Minimize administrative workload  
- **Centralize Data:** Eliminate disconnected systems  
- **Ensure Security:** High-level protection without requiring dedicated IT staff  

---