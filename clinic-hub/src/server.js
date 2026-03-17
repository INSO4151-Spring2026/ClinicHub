const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');

// Use the routes we just created
app.use('/api', userRoutes);
app.use((req, res, next) => {
  req.user = { role: 'Doctor' }; // Change this to 'Admin' or 'Receptionist' to test
  next();
});
app.listen(5173, () => console.log('Server is running!'));