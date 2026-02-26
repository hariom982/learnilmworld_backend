require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');
const profileRoutes = require('./routes/profile');

const tokenRoutes = require('./routes/token')

app.use(cors());
app.use(express.json());
app.use('/api/profile', profileRoutes);
app.use('/api/token', tokenRoutes);

// Connect to MongoDB – NEW CLEAN WAY
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));


app.listen(port, '0.0.0.0', () => {
    console.log(`Token server running on http://0.0.0.0:${port}`);
});
