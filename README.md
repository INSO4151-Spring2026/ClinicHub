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

## 🎯 Project Goals

- **Reduce Burnout:** Minimize administrative workload  
- **Centralize Data:** Eliminate disconnected systems  
- **Ensure Security:** High-level protection without requiring dedicated IT staff  

---