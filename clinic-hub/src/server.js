import express from 'express';
import cors from 'cors';
import multer from 'multer';
import userRoutes from './routes/user_routes.js'; 

const app = express();
const upload = multer();

app.use(express.json()); 

app.use(cors());

// in here do token verification and role extraction, then attach to req.user
app.use((req, res, next) => {


//     const authHeader = req.headers.authorization;
  
//   if (authHeader) {
//     const token = authHeader.split(' ')[1]; // Get 'mock-token-doctor'
    
//     // Map the token to a role (In the future, you'll use JWT here)
//     if (token === 'mock-token-admin') req.user = { role: 'Admin' };
//     if (token === 'mock-token-doctor') req.user = { role: 'Doctor' };
//     if (token === 'mock-token-receptionist') req.user = { role: 'Receptionist' };
//   }
    // req.user = { role: 'Admin' }; 
    req.user = { role: 'Doctor' }; 
    // req.user = { role: 'Receptionist' }; 
  console.log(`Current Request User Role: ${req.user.role}`);
  next();
});

app.use('/api',upload.any(), userRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));