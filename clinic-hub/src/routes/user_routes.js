import express from 'express';
import fetch from 'node-fetch';
import authorize from '../middleware/authorization_middleware.js';
import ROLES from '../constants/roles.js';

const router = express.Router();

// SETTING THIS TO THE BASE PORT
// We will manually add '/api' to the fetch calls to ensure transparency
const FLASK_BASE = 'http://localhost:5002';

// --- 1. ADMIN ONLY: ANALYTICS ---
router.get('/admin/stats', authorize([ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/admin/stats`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 2. DOCTOR & ADMIN: MEDICAL RECORDS ---
router.get('/patient/:id/records', authorize([ROLES.DOCTOR, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/patient/${req.params.id}/records`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 3. APPOINTMENTS (Receptionist, Doctor, Admin) ---
router.get('/appointments', authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/appointments`, {
      method: 'GET',
      headers: { 
        'Authorization': req.headers.authorization 
      }
    });
    const data = await response.json();
    res.status(response.status).json(data); 
  } catch (err) {
    res.status(502).json({ message: "Flask unreachable" });
  }
});

router.post('/appointments', authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/appointments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization 
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 3.5 DELETE APPOINTMENT ---
router.delete('/appointments/:id', authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/appointments/${req.params.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': req.headers.authorization }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 4. VITALS SUBMISSION (Doctor & Admin) ---
router.post('/vitals', authorize([ROLES.DOCTOR, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/vitals`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization 
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 5. BILLING (Receptionist & Admin) ---
router.post('/billing', authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/billing`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization 
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 6. CREATE NEW PATIENT (Receptionist & Admin) ---
router.post('/patients', authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/patients`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization 
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 7. LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Auth service (Flask) is down" });
  }
});

// --- 8. FINANCIAL REPORTS (Admin Only) ---
router.get('/reports/daily-revenue', authorize([ROLES.ADMIN]), async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Date is required." });

  try {
    const response = await fetch(`${FLASK_BASE}/api/reports/daily-revenue?date=${date}`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

export default router;