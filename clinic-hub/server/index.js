import express from "express";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import userRoutes from "./routes/user_routes.js";

const app = express();
const upload = multer();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

// JWT verification middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.user_id, role: decoded.role };
  } catch (err) {
    req.user = null;
  }
  next();
});

// Multer handles the parsing before it hits the routes
app.use("/api", upload.any(), userRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Node Server: http://localhost:${PORT}`));
