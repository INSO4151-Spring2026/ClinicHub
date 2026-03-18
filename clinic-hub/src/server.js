import express from 'express';
import cors from 'cors';
import multer from 'multer';
import userRoutes from './routes/user_routes.js'; 

const app = express();
const upload = multer();

app.use(express.json()); 

app.use(cors({
  origin: 'http://localhost:5173', 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// token verification and role extraction, then attach to req.user

const MOCK_TOKENS = {
  'mock-token-admin': { id: 1, name: 'Alice', role: 'Admin' },
  'mock-token-doctor': { id: 2, name: 'Dr. Smith', role: 'Doctor' },
  'mock-token-receptionist': { id: 3, name: 'Bob', role: 'Receptionist' }
};

app.use((req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // user not identified
    req.user = null; 
    return next();
  }

  // Extract the string after "Bearer "
  const token = authHeader.split(' ')[1]; 
  
  // Look up the user in our mock database
  const user = MOCK_TOKENS[token];

  if (user) {
    req.user = user; // Attach the user object to the request
    console.log(`✅ Authenticated as: ${user.role}`);
  } else {
    req.user = null;
    console.log(`❌ Invalid Token: ${token}`);
  }

  next();
});

app.use('/api',upload.any(), userRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));