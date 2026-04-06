import express from 'express';
const router = express.Router();
import authorize from '../middleware/authorization_middleware.js';
import ROLES from '../constants/roles.js';

// import pg from 'pg';

// // Setup database connection 
// const pool = new pg.Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'clinic_db',
//   password: 'your_password',
//   port: 5432,
// });

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
  console.log(`Vitals recorded by: ${req.user.role}`);
  console.log('Data received:', req.body);
  res.status(201).json({ message: "Vitals saved to patient record." });
});

// 5. Billing Information (Receptionist & Admin)
router.post('/billing', authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]), (req, res) => {
  // Extract text fields from req.body
  const { memberId, carrierName, copay } = req.body;
  
  // Extract photo from req.files (if uploaded)
  const files = req.files;

  console.log(`💳 Billing updated by ${req.user.role}: ${req.user.name}`);
  console.log(`Carrier: ${carrierName}, MemberID: ${memberId}`);

  if (files && files.length > 0) {
    console.log("📄 Insurance Card Image received.");
  }

  // Database logic would go here
  
  res.status(201).json({ 
    message: "Billing information saved successfully!",
    carrier: carrierName 
  });
});

// 6. Create New Patient (Receptionist & Admin)
router.post('/patients', authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]), (req, res) => {
  const patientData = req.body;
  const files = req.files;

  console.log(`👤 New patient being created by: ${req.user.name} (${req.user.role})`);
  console.log("Patient Info:", patientData);
  
  if (files && files.length > 0) {
    console.log("ID Photo received:", files[0].originalname);
  }

  // logic to save to database goes here
  
  res.status(201).json({ 
    message: "Patient created successfully!",
    patientName: `${patientData.first_name} ${patientData.last_name}`
  });
});

// 7 logins for testing
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Simple simulation logic
  if (email === 'admin@clinic.com' && password === '123') {
    res.json({ token: 'mock-token-admin', role: ROLES.ADMIN });
  } else if (email === 'doctor@clinic.com' && password === '123') {
    res.json({ token: 'mock-token-doctor', role: ROLES.DOCTOR });
  } else if (email === 'reception@clinic.com' && password === '123') {
    res.json({ token: 'mock-token-receptionist', role: ROLES.RECEPTIONIST });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});
// 8. Financial Reports (Admin Only) 
router.get('/reports/daily-revenue', authorize([ROLES.ADMIN]), async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: "Date parameter is required." });
  }

  console.log(`📊 Generating Report for: ${date}`);

  try {
    // db query
    // const query = `
    //   SELECT 
    //     COUNT(*) as count,
    //     COALESCE(SUM(subtotal), 0) as subtotal,
    //     COALESCE(SUM(tax), 0) as tax,
    //     COALESCE(SUM(total_revenue), 0) as total
    //   FROM billing_records 
    //   WHERE DATE(service_date) = $1
    // `;
    
    // const result = await pool.query(query, [date]);
    // const row = result.rows[0];

    // Simulated Database Response (Replace with your pool.query later)
    const result = {
      date: date,
      transaction_count: 5, // Example data
      data: {
        subtotal: 450.00,
        tax: 31.50,
        total_revenue: 481.50
      }
    };

  // Send the structured JSON exactly how the React page expects it
    res.json({
      date: date,
      transaction_count: parseInt(row.count),
      data: {
        subtotal: parseFloat(row.subtotal),
        tax: parseFloat(row.tax),
        total_revenue: parseFloat(row.total)
      }
    });

  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Error processing report logic." });
  }
});
export default router;