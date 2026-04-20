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

# Authentication & Patients – System Overview

---

## 🔐 Authentication System

The authentication system in ClinicHub is built using JSON Web Tokens (JWT) to securely identify and authorize users across the application. When a user logs in, the system validates their credentials and generates an access token (and optionally a refresh token). This token contains encoded user information such as the user ID and role, and is used to authenticate subsequent API requests.

### How It Works

- Users authenticate using their email and password
- On successful login:
  - The system generates a JWT access token
  - The token includes:
    - `user_id`
    - `role`
    - expiration timestamp
- The token is signed using the server’s secret key
- The client must include this token in future requests

### Token Usage

- Tokens are sent in the request header:

Authorization: Bearer <access_token>

- The backend verifies:
- Token signature
- Expiration
- Embedded user data

### Role-Based Access Control (RBAC)

ClinicHub enforces permissions using roles stored in the database:

- `admin`
- `doctor`
- `nurse`
- `receptionist`

Each request is validated using:
- Authentication middleware (`require_auth`)
- Role-based authorization (`require_role`)

This ensures that only authorized users can access specific endpoints.

### Key Security Features

- Passwords are stored as hashed values (bcrypt)
- Tokens are stateless (no database storage required)
- Expired or invalid tokens are rejected
- Sensitive routes require authentication

---

## 🧑‍⚕️ Patients System

The patients module manages all patient-related data, including personal, contact, and emergency information. Each patient record is uniquely identified and can be linked to appointments, medical records, CPT entries, and invoices.

### Core Functionality

- Store patient demographic information
- Maintain contact and emergency details
- Link patients to appointments and medical history
- Serve as the central reference for all clinical and billing operations

### Patient Data Includes

- First and last name
- Date of birth
- Sex (with predefined valid values)
- Email and phone number
- Address
- Emergency contact information
- Timestamps for record creation and updates

### Data Integrity Rules

- Email must be unique (if provided)
- Required fields:
- First name
- Last name
- Date of birth
- Sex must match allowed values:
- male
- female
- other
- prefer_not_to_say

### Relationships

Patients are linked to multiple system components:

- **Appointments** → scheduling visits
- **Medical Records** → clinical history
- **CPT Records** → procedures performed
- **Invoices** → billing and payments

This makes the patient entity a central part of the system’s workflow.

---

## 🔄 System Integration

- Authentication ensures only authorized users can access patient data
- Patient records are required before creating appointments
- All billing (CPT + invoices) is tied back to a patient
- Audit logs may track access to patient data for compliance

---

# Authentication & Patients API Endpoints

---

## 🔐 Authentication Endpoints (`/api`)

---

### 1. Login

Authenticates a user and returns JWT tokens.

**Request**
```json
POST /api/login

{
  "email": "admin@clinichub.com",
  "password": "admin123"
}

Response (200)

{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
### 2. Protected Route Example

Used to verify authentication via token.

**Request**
```json
GET /api/protected
Authorization: Bearer <access_token>

Response (200)

{
  "message": "Access granted",
  "user_id": 1,
  "role": "admin"
}
```
Authentication Error Examples

```json
401 Unauthorized (Missing Token)

{
  "error": "Authorization token is missing"
}

401 Unauthorized (Invalid Token)

{
  "error": "Invalid or expired token"
}
```
🧑‍⚕️ Patients Endpoints (/api/patients)
### 1. Create Patient

**Request**
```json
POST /api/patients

{
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-05-10",
  "sex": "male",
  "email": "john.doe@email.com",
  "phone": "7871234567",
  "address": "123 Main St",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "7877654321"
}

Response (201)

{
  "message": "Patient created successfully",
  "patient": {
    "patient_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-05-10",
    "sex": "male"
  }
}
```
### 2. Get All Patients

**Request**
```json
GET /api/patients

Response (200)

[
  {
    "patient_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "dob": "1990-05-10",
    "sex": "male"
  }
]
```
### 3. Get Patient by ID

**Request**
```json
GET /api/patients/1

Response (200)

{
  "patient_id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-05-10",
  "sex": "male"
}
```
### 4. Update Patient

**Request**
```json
PUT /api/patients/1

{
  "phone": "7879998888",
  "address": "456 Updated St"
}

Response (200)

{
  "message": "Patient updated successfully",
  "patient": {
    "patient_id": 1,
    "phone": "7879998888",
    "address": "456 Updated St"
  }
}
```
### 5. Delete Patient

**Request**
```json
DELETE /api/patients/1

Response (200)

{
  "message": "Patient deleted successfully"
}
```
Patient Error Examples
```json
404 Not Found
{
  "error": "Patient not found"
}
400 Bad Request
{
  "error": "Missing required field: first_name"
}
409 Conflict (Duplicate Email)
{
  "error": "Email already exists"
}
```

---

# ClinicHub – Scheduling & Billing - System Overview

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

# API Request & Response Examples

---

## Appointments API Examples

---

### 1. Create Appointment

**Request**
```json
POST /api/appointments

{
  "patient_id": 1,
  "provider_user_id": 2,
  "scheduled_start": "2026-04-15T10:00:00",
  "scheduled_end": "2026-04-15T10:30:00",
  "status": "scheduled",
  "reason": "General checkup",
  "notes": "First visit"
}

Response (201)

{
  "message": "Appointment created successfully",
  "appointment": {
    "appointment_id": 1,
    "patient_id": 1,
    "provider_user_id": 2,
    "scheduled_start": "2026-04-15T10:00:00",
    "scheduled_end": "2026-04-15T10:30:00",
    "status": "scheduled"
  }
}

```

### 2. Update Appointment (Mark as Completed → triggers CPT creation)

**Request**
```json
PUT /api/appointments/1

{
  "status": "completed"
}

Response (200)

{
  "message": "Appointment updated successfully",
  "appointment": {
    "appointment_id": 1,
    "status": "completed",
    "cpt_id": 5
  }
}
```

### 3. Get Appointments (List)

**Request**
```json
GET /api/appointments?page=1&per_page=10&status=scheduled

Response (200)

{
  "appointments": [
    {
      "appointment_id": 1,
      "patient_id": 1,
      "provider_user_id": 2,
      "status": "scheduled"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "per_page": 10,
    "has_next": false,
    "has_prev": false
  }
}
```
### 4. Cancel Appointment

**Request**
```json
DELETE /api/appointments/1

Response (200)

{
  "message": "Appointment cancelled successfully",
  "appointment_id": 1
}
```


Invoices API Examples
---
### 1. Create Invoice (from completed appointment)

**Request**
```json
POST /api/invoices

{
  "appointment_id": 1
}

Response (201)

{
  "message": "Invoice created successfully",
  "invoice": {
    "invoice_id": 1,
    "appointment_id": 1,
    "patient_id": 1,
    "cpt_id": 5,
    "status": "unpaid"
  }
}
```

### 2. Update Invoice Status (Pay Invoice)

**Request**
```json
PUT /api/invoices/1

{
  "status": "paid"
}

Response (200)

{
  "message": "Invoice updated",
  "invoice": {
    "invoice_id": 1,
    "status": "paid",
    "paid_at": "2026-04-14T22:30:00"
  }
}
```
### 3. Update Invoice Status (Mark Unpaid)

**Request**
```json
PUT /api/invoices/1

{
  "status": "unpaid"
}

Response (200)

{
  "message": "Invoice updated",
  "invoice": {
    "invoice_id": 1,
    "status": "unpaid",
    "paid_at": null
  }
}
```
### 4. List Invoices

**Request**
```json
GET /api/invoices

Response (200)

[
  {
    "invoice_id": 1,
    "appointment_id": 1,
    "patient_id": 1,
    "cpt_id": 5,
    "status": "paid"
  }
]
```

Error Response Examples
---
```json
404 Not Found
{
  "error": "Appointment not found"
}
400 Bad Request
{
  "error": "Appointment must be completed"
}
409 Conflict
{
  "error": "Invoice already exists"
}
```
---

## 🎯 Project Goals

- **Reduce Burnout:** Minimize administrative workload  
- **Centralize Data:** Eliminate disconnected systems  
- **Ensure Security:** High-level protection without requiring dedicated IT staff  

---