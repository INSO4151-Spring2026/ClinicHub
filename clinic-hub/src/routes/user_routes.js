import express from 'express';
const router = express.Router();
import authorize from '../middleware/authorization_middleware.js';
import ROLES from '../constants/roles.js';

// 1. Admin Only: Manage System Users
router.get('/admin/stats', authorize([ROLES.ADMIN]), (req, res) => {
  res.json({ message: "Welcome, Admin. Here are the hospital analytics." });
});

// 2. Doctor & Admin: Access Medical Records
router.get('/patient/:id/records', authorize([ROLES.DOCTOR, ROLES.ADMIN]), (req, res) => {
  res.json({ message: "Accessing sensitive medical history..." });
});

// 3. Receptionist, Doctor, & Admin: View Appointments
router.post('/appointments', authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]), (req, res) => {
  console.log("New Appointment Request:", req.body);
  
  //  check for double-booking here
  res.status(201).json({ 
    message: "Appointment confirmed!",
    appointment: req.body 
  });
});

// 4. Vitals Submission
router.post('/vitals', authorize([ROLES.DOCTOR, ROLES.ADMIN]), (req, res) => {
  const vitalsData = req.body;
  console.log("Saving to Database:", vitalsData);
  res.status(201).json({ message: "Vitals saved successfully!" });
});

// 5. Billing Information (Receptionist & Admin)
router.post('/billing', authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]), (req, res) => {
  const billingData = req.body;
  console.log("Saving Billing Info:", billingData);
  res.status(201).json({ message: "Billing information saved successfully!" });
});

// 6. Create New Patient (Receptionist & Admin)
router.post('/patients', authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]), (req, res) => {
  const patientData = req.body;
  console.log("Creating New Patient:", patientData);
  res.status(201).json({ message: "Patient created successfully!" });
});

// 7 logins for testing
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Simple simulation logic
  if (email === 'admin@clinic.com' && password === '123') {
    res.json({ token: 'mock-token-admin', role: 'Admin' });
  } else if (email === 'doctor@clinic.com' && password === '123') {
    res.json({ token: 'mock-token-doctor', role: 'Doctor' });
  } else if (email === 'reception@clinic.com' && password === '123') {
    res.json({ token: 'mock-token-receptionist', role: 'Receptionist' });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});
export default router;