import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart2,
  Calendar,
  ClipboardList,
  DollarSign,
  ExternalLink,
  FileText,
  Github,
  Heart,
  Home as HomeIcon,
  LogIn,
  LogOut,
  Presentation,
  Shield,
  Stethoscope,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

import Appointment_page from "./pages/Appointment_page";
import Billing_page from "./pages/Billing_page";
import Calendar_page from "./pages/Calendar_page";
import Create_patient from "./pages/Create_patient";
import Login_page from "./pages/Login_page";
import Patient_list_page from "./pages/Patient_list_page";
import Plan_page from "./pages/Plan_page";
import Records_page from "./pages/Records_page";
import Reports_page from "./pages/Reports_page";
import Vitals_page from "./pages/Vitals_page";

const normalizeRole = (rawRole) => {
  const role = (rawRole || "").toString().trim().toLowerCase();
  if (!role) return "";
  if (role === "admin") return "admin";
  if (role === "doctor") return "doctor";
  if (role === "receptionist") return "receptionist";
  if (role === "nurse") return "nurse";
  return role;
};

const roleLabel = (role) => {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// ── Navbar ──────────────────────────────────────────────────
const RoleIcon = ({ role }) => {
  if (role === "admin") return <Shield size={12} />;
  if (role === "doctor") return <Stethoscope size={12} />;
  if (role === "receptionist") return <UserCheck size={12} />;
  return null;
};

const NavBar = ({ role, handleSignOut }) => {
  const { pathname } = useLocation();
  const cls = (path) => (pathname === path ? "nav-link active" : "nav-link");
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const label = roleLabel(role);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link to="/" className="navbar-brand" aria-label="ClinicHub home">
        <div className="navbar-brand-icon" aria-hidden="true">
          <Heart size={16} color="#fff" />
        </div>
        ClinicHub
      </Link>

      <ul className="navbar-nav" role="list">
        <li>
          <Link
            to="/"
            className={cls("/")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <HomeIcon size={14} /> Dashboard
          </Link>
        </li>
        {["admin", "doctor", "receptionist"].includes(role) && (
          <li>
            <Link to="/patients" className={cls("/patients")}>
              <Users size={14} /> Patients
            </Link>
          </li>
        )}
        {["admin", "receptionist"].includes(role) && (
          <li>
            <Link to="/create-patient" className={cls("/create-patient")}>
              <UserPlus size={14} /> New Patient
            </Link>
          </li>
        )}
        {["admin", "doctor", "receptionist"].includes(role) && (
          <li>
            <Link to="/appointment" className={cls("/appointment")}>
              <ClipboardList size={14} /> Appointments
            </Link>
          </li>
        )}
        {["admin", "doctor", "receptionist"].includes(role) && (
          <li>
            <Link to="/calendar" className={cls("/calendar")}>
              <Calendar size={14} /> Schedule
            </Link>
          </li>
        )}
        {["admin", "doctor"].includes(role) && (
          <li>
            <Link to="/vitals" className={cls("/vitals")}>
              <Activity size={14} /> Vitals
            </Link>
          </li>
        )}
        {["admin", "receptionist"].includes(role) && (
          <li>
            <Link to="/plan" className={cls("/plan")}>
              <FileText size={14} /> Plans
            </Link>
          </li>
        )}
        {["admin", "receptionist"].includes(role) && (
          <li>
            <Link to="/billing" className={cls("/billing")}>
              <DollarSign size={14} /> Billing
            </Link>
          </li>
        )}
        {role === "admin" && (
          <li>
            <Link to="/reports" className={cls("/reports")}>
              <BarChart2 size={14} /> Reports
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar-right">
        {role && (
          <span
            className="role-badge"
            style={{ marginRight: "var(--space-2)" }}
            aria-label={`Current role: ${label}`}
          >
            <RoleIcon role={role} />
            {label}
          </span>
        )}

        {isLoggedIn ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut size={13} aria-hidden="true" /> Sign Out
          </button>
        ) : (
          <Link to="/login" tabIndex={-1}>
            <button className="btn btn-primary btn-sm" aria-label="Sign in">
              <LogIn size={13} aria-hidden="true" /> Sign In
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

// ── Home / Dashboard ─────────────────────────────────────────
const NAV_CARDS = [
  {
    to: "/patients",
    label: "Patient List",
    icon: <Users size={20} />,
    iconClass: "icon-blue",
    desc: "Browse and manage patients",
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    to: "/create-patient",
    label: "New Patient",
    icon: <UserPlus size={20} />,
    iconClass: "icon-green",
    desc: "Register a new patient",
    roles: ["admin", "receptionist"],
  },
  {
    to: "/calendar",
    label: "Schedule",
    icon: <Calendar size={20} />,
    iconClass: "icon-purple",
    desc: "View and manage appointments",
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    to: "/appointment",
    label: "Appointments",
    icon: <ClipboardList size={20} />,
    iconClass: "icon-orange",
    desc: "Book a new appointment",
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    to: "/vitals",
    label: "Vitals",
    icon: <Activity size={20} />,
    iconClass: "icon-teal",
    desc: "Record patient measurements",
    roles: ["admin", "doctor"],
  },
  {
    to: "/plan",
    label: "Health Plans",
    icon: <FileText size={20} />,
    iconClass: "icon-blue",
    desc: "Manage billing & insurance",
    roles: ["admin", "receptionist"],
  },
  {
    to: "/billing",
    label: "Billing",
    icon: <DollarSign size={20} />,
    iconClass: "icon-green",
    desc: "Invoices and payments",
    roles: ["admin", "receptionist"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: <BarChart2 size={20} />,
    iconClass: "icon-orange",
    desc: "Financial revenue reports",
    roles: ["admin"],
  },
];

const Home = ({ role }) => {
  const visible = NAV_CARDS.filter((c) => {
    if (c.roles === null) return true; // public cards
    return c.roles.includes(role);
  });

  return (
    <main className="page-wrapper">
      <div className="page-container">
        {/* Hero */}
        <header
          style={{
            textAlign: "center",
            paddingBottom: "var(--space-8)",
            marginBottom: "var(--space-8)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              width: "60px",
              height: "60px",
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--radius-lg)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--space-4)",
            }}
            aria-hidden="true"
          >
            <Heart size={28} color="#fff" />
          </div>
          <h1 className="page-title" style={{ fontSize: "var(--text-3xl)" }}>
            Clinic Hub Management System
          </h1>
          <p className="page-subtitle">Secure Clinical Administration Portal</p>
        </header>

        {/* Auth notice */}
        {!role && (
          <div
            className="alert alert-info"
            style={{ marginBottom: "var(--space-6)" }}
            role="status"
          >
            <LogIn size={15} aria-hidden="true" />
            <span>
              {" "}
              <Link to="/login" style={{ fontWeight: "var(--font-semibold)" }}>
                Sign in
              </Link>{" "}
              with your account to view the rest of the dashboard and access
              your clinic's information.
            </span>
          </div>
        )}

        {/* Quick access */}
        <section
          aria-label="Quick access navigation"
          style={{ marginBottom: "var(--space-8)" }}
        >
          <p className="section-title">Quick Access</p>
          <div className="nav-card-grid">
            {visible.map((card) => (
              <Link
                to={card.to}
                className="nav-card"
                key={card.to}
                aria-label={card.label}
              >
                <div
                  className={`nav-card-icon ${card.iconClass}`}
                  aria-hidden="true"
                >
                  {card.icon}
                </div>
                <div className="nav-card-label">{card.label}</div>
                <div className="nav-card-desc">{card.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "var(--space-4)",
            alignItems: "stretch",
          }}
        >
          {/* Column 1: Tech Stack */}
          <div
            className="card"
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              className="card-header"
              style={{
                padding: "var(--space-2) var(--space-4)",
                display: "flex",
                alignItems: "center",
                minHeight: "37px",
              }}
            >
              <h2
                className="card-title"
                style={{ fontSize: "var(--text-sm)", margin: 0 }}
              >
                Tech Stack
              </h2>
            </div>
            <div
              className="card-body"
              style={{ padding: "var(--space-2) var(--space-4)", flex: 1 }}
            >
              <ul
                style={{
                  paddingLeft: "var(--space-4)",
                  fontSize: "var(--text-xs)",
                  lineHeight: "1.7",
                  color: "var(--color-text-secondary)",
                  listStyle: "disc",
                  margin: 0,
                }}
              >
                <li>
                  <strong style={{ color: "var(--color-text)" }}>
                    Frontend:
                  </strong>{" "}
                  React 19 + Vite
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>
                    Routing:
                  </strong>{" "}
                  React Router v7
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>
                    Backend:
                  </strong>{" "}
                  Flask + Waitress WSGI
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>
                    Database:
                  </strong>{" "}
                  PostgreSQL Engine
                </li>
                <li>
                  <strong style={{ color: "var(--color-text)" }}>Auth:</strong>{" "}
                  JWT Bearer Tokens
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Project Team */}
          <div
            className="card"
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              className="card-header"
              style={{
                padding: "var(--space-2) var(--space-4)",
                display: "flex",
                alignItems: "center",
                minHeight: "37px",
              }}
            >
              <h2
                className="card-title"
                style={{ fontSize: "var(--text-sm)", margin: 0 }}
              >
                Project Team
              </h2>
            </div>
            <div
              className="card-body"
              style={{ padding: "var(--space-2) var(--space-4)", flex: 1 }}
            >
              <ul
                style={{
                  paddingLeft: "var(--space-4)",
                  fontSize: "var(--text-xs)",
                  lineHeight: "1.7",
                  color: "var(--color-text-secondary)",
                  listStyle: "disc",
                  margin: 0,
                }}
              >
                <li>Alejandro A. Pérez Pabón</li>
                <li>Christian N. Rodríguez Figueroa</li>
                <li>Orlando G. Mercado Tellado</li>
                <li>Cristian Barreras Tatsenko</li>
              </ul>
            </div>
          </div>

          {/* Column 3: Deliverables */}
          <div
            className="card"
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              className="card-header"
              style={{
                padding: "var(--space-2) var(--space-4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: "37px",
              }}
            >
              <h2
                className="card-title"
                style={{ fontSize: "var(--text-sm)", margin: 0 }}
              >
                Deliverables
              </h2>
            </div>
            <div
              className="card-body"
              style={{ padding: "var(--space-2) var(--space-4)", flex: 1 }}
            >
              <ul
                style={{
                  paddingLeft: 0,
                  listStyle: "none",
                  fontSize: "var(--text-xs)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-1)",
                  margin: 0,
                }}
              >
                <li>
                  <a
                    href="https://docs.google.com/document/d/1nhnJKCCqy1WglL0vUUmTMAIHTmno4_g9t_rBls7df_8/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      fontWeight: "var(--font-medium)",
                    }}
                  >
                    <FileText size={13} /> Project Documentation{" "}
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/INSO4151-Spring2026/ClinicHub.git"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      fontWeight: "var(--font-medium)",
                    }}
                  >
                    <Github size={13} /> GitHub Repository{" "}
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      fontWeight: "var(--font-medium)",
                    }}
                  >
                    <Video size={13} /> System Demo Video{" "}
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.google.com/presentation/d/1TNwHPC-MJQhr0_7EmuwF5Nmo5wLwMsUa6BiyKVINPis/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      fontWeight: "var(--font-medium)",
                    }}
                  >
                    <Presentation size={13} /> Presentation Slides{" "}
                    <ExternalLink size={10} />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

function AppContent() {
  const location = useLocation();
  const [role, setRole] = useState(() => {
    const saved =
      localStorage.getItem("userRole") || localStorage.getItem("role");
    return normalizeRole(saved);
  });

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
    setRole("");
  };

  useEffect(() => {
    const saved =
      localStorage.getItem("userRole") || localStorage.getItem("role");
    const normalized = normalizeRole(saved);
    if (normalized !== role) setRole(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const ProtectedRoute = ({ allowedRoles, children }) => {
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <>
      <NavBar role={role} handleSignOut={handleSignOut} />
      <Routes>
        <Route path="/" element={<Home role={role} />} />
        <Route path="/login" element={<Login_page />} />

        <Route
          path="/plan"
          element={
            <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
              <Plan_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "receptionist"]}>
              <Calendar_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vitals"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <Vitals_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-patient"
          element={
            <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
              <Create_patient />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "receptionist"]}>
              <Patient_list_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
              <Billing_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointment"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "receptionist"]}>
              <Appointment_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Reports_page />
            </ProtectedRoute>
          }
        />

        <Route
          path="/records/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "receptionist"]}>
              <Records_page />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
