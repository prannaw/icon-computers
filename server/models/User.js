const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Matches your Frontend and authRoutes logic
  username: { 
    type: String, 
    required: true,
    trim: true
  }, 
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
    // Note: We validate the 6-15 length in the Route, 
    // because here the password will be a long hashed string.
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  isBlocked: { 
    type: Boolean, 
    default: false 
  },
  
  // --- OTP & VERIFICATION FIELDS ---
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  otp: { 
    type: String 
  },
  otpExpires: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);