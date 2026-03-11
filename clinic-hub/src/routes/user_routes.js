const express = require('express');
const router = express.Router();
const authorize = require('./authorization_middleware');
const ROLES = require('./roles');

// 1. Admin Only: Manage System Users
router.get('/admin/stats', authorize([ROLES.ADMIN]), (req, res) => {
  res.json({ message: "Welcome, Admin. Here are the hospital analytics." });
});

// 2. Doctor & Admin: Access Medical Records
router.get('/patient/:id/records', authorize([ROLES.DOCTOR, ROLES.ADMIN]), (req, res) => {
  res.json({ message: "Accessing sensitive medical history..." });
});

// 3. Receptionist, Doctor, & Admin: View Appointments
router.get('/appointments', authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]), (req, res) => {
  res.json({ message: "Daily appointment schedule retrieved." });
});

module.exports = router;