import express from "express";
import fetch from "node-fetch";
import authorize from "../middleware/authorization_middleware.js";
import ROLES from "../constants/roles.js";

const router = express.Router();

const FLASK_BASE = "http://localhost:5002";

// --- 1. ADMIN ONLY: ANALYTICS ---
router.get("/admin/stats", authorize([ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/admin/stats`, {
      headers: { Authorization: req.headers.authorization },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Flask service unreachable" });
  }
});

// --- 2. DOCTOR & ADMIN: MEDICAL RECORDS ---
router.get(
  "/patient/:id/records",
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(
        `${FLASK_BASE}/api/patient/${req.params.id}/records`,
        {
          headers: { Authorization: req.headers.authorization },
        },
      );
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

// --- 3. APPOINTMENTS ---
router.get(
  "/appointments",
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/appointments`, {
        method: "GET",
        headers: { Authorization: req.headers.authorization },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask unreachable" });
    }
  },
);

router.post(
  "/appointments",
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.delete(
  "/appointments/:id",
  authorize([ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(
        `${FLASK_BASE}/api/appointments/${req.params.id}`,
        {
          method: "DELETE",
          headers: { Authorization: req.headers.authorization },
        },
      );
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

// --- 4. VITALS SUBMISSION ---
router.post(
  "/vitals",
  authorize([ROLES.DOCTOR, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/vitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

// --- 5. BILLING ---
router.post(
  "/billing",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

// --- 6. PATIENTS ---
router.get(
  "/patients",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/patients`, {
        method: "GET",
        headers: { Authorization: req.headers.authorization },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.get(
  "/patients/:id",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  async (req, res) => {
    try {
      const patientId = req.params.id;
      const response = await fetch(`${FLASK_BASE}/api/patients/${patientId}`, {
        method: "GET",
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
      });
      // Handle non-JSON responses safely
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      return res.status(response.status).json(data);
    } catch (err) {
      console.error("Proxy error:", err);
      return res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.post(
  "/patients",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.put(
  "/patients/:id",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  async (req, res) => {
    try {
      const patientId = req.params.id;
      const response = await fetch(`${FLASK_BASE}/api/patients/${patientId}`, {
        method: "PUT",
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      return res.status(response.status).json(data);
    } catch (err) {
      console.error("Proxy error:", err);
      return res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.delete(
  "/patients/:id",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.DOCTOR]),
  async (req, res) => {
    try {
      const patientId = req.params.id;
      const response = await fetch(`${FLASK_BASE}/api/patients/${patientId}`, {
        method: "DELETE",
        headers: {
          Authorization: req.headers.authorization,
        },
      });
      // Safely handle response (JSON or text)
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      return res.status(response.status).json(data);
    } catch (err) {
      console.error("Delete patient error:", err);
      return res.status(502).json({
        message: "Flask service unreachable",
      });
    }
  },
);
// --- 7. LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const response = await fetch(`${FLASK_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Auth service (Flask) is down" });
  }
});

// --- 8. FINANCIAL REPORTS ---
router.get(
  "/reports/daily-revenue",
  authorize([ROLES.ADMIN]),
  async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required." });

    try {
      const response = await fetch(
        `${FLASK_BASE}/api/reports/daily-revenue?date=${date}`,
        {
          headers: { Authorization: req.headers.authorization },
        },
      );
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

// --- 9. INVOICES ---
router.get(
  "/invoices",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/invoices`, {
        method: "GET",
        headers: { Authorization: req.headers.authorization },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.post(
  "/invoices",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(`${FLASK_BASE}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify(req.body),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.put(
  "/invoices/:id",
  authorize([ROLES.RECEPTIONIST, ROLES.ADMIN]),
  async (req, res) => {
    try {
      const response = await fetch(
        `${FLASK_BASE}/api/invoices/${req.params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
          body: JSON.stringify(req.body),
        },
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(502).json({ message: "Flask service unreachable" });
    }
  },
);

router.delete("/invoices/:id", authorize([ROLES.ADMIN]), async (req, res) => {
  try {
    const response = await fetch(
      `${FLASK_BASE}/api/invoices/${req.params.id}`,
      {
        method: "DELETE",
        headers: { Authorization: req.headers.authorization },
      },
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ message: "Flask service unreachable" });
  }
});

export default router;
