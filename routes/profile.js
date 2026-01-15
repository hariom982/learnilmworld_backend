const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');

// Simple schema
const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  fullName: { type: String },
  lastName: { type: String },
  phoneNumber: { type: String },
  userType: { type: String, enum: ['STUDENT', 'TRAINER'], required: true },

  // Student fields
  nativeLanguage: { type: String },
  languagesToLearn: [{ type: String }],
  learningLevel: { type: String },
  location: { type: String },
  qualification: { type: String },
  college: { type: String },

  // Trainer fields
  bio: { type: String },
  yearsOfExperience: { type: Number },
  hourlyRate: { type: Number },
  teachingStyle: { type: String },
  languagesToTeach: [{ type: String }],
  specializations: [{ type: String }],
  certification: { type: String },
  nationality: { type: String },
  isAvailableForBookings: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', profileSchema);

// GET current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.uid });
    res.json(profile || { name: '', bio: '' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE / UPDATE profile
router.post('/', authMiddleware, async (req, res) => {
  console.log('Profile save request reached');
  console.log('UID:', req.user.uid);
  console.log('Body:', req.body);

  try {
    const profileData = {
      ...req.body,
      userId: req.user.uid,
      updatedAt: new Date()
    };

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.uid },
      profileData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Profile saved to MongoDB:', profile);
    res.json(profile);
  } catch (err) {
    console.error('MongoDB save error:', err);
    res.status(500).json({ message: 'Failed to save profile', error: err.message });
  }
});

module.exports = router;