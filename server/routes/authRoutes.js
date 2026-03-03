const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/otpService');

const authRequired = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const getSafeUserPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  address: user.address || {
    fullAddress: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: ''
  }
});

// --- SIGNUP (Creates Pending User & Sends OTP) ---
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. PASSWORD LENGTH VALIDATION (6-15 Characters)
    if (password.length < 6 || password.length > 15) {
      return res.status(400).json({ 
        msg: "Password must be between 6 and 15 characters long." 
      });
    }
    
    // 2. Check if user exists
    const existingUser = await User.findOne({ email });
    
    // Logic for Resending OTP if user exists but isn't verified
    if (existingUser && !existingUser.isVerified) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.otp = newOtp;
        existingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        await existingUser.save();
        await sendOTPEmail(email, newOtp);
        return res.status(200).json({ msg: "New OTP sent to your email." });
    }

    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 5. Create new user
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false 
    });

    await newUser.save();

    // 6. Send the OTP Email
    await sendOTPEmail(email, otp);

    res.status(201).json({ 
      msg: "OTP sent to email. Please verify to activate account.",
      email: newUser.email 
    });
  } catch (err) {
    console.error("Signup Error:", err);

    if (String(err.message || '').includes('SMTP is not configured')) {
      return res.status(500).json({
        error: 'OTP email service is not configured on server. Please set SMTP credentials.'
      });
    }

    res.status(500).json({ error: "Failed to process registration or send email." });
  }
});

// --- VERIFY OTP (Activates Account) ---
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Check if OTP matches and is not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Success: Verify User and Clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Create Token (Using data.user structure to match your App.jsx)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      msg: "Account verified successfully!",
      token,
      user: getSafeUserPayload(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOGIN (Checks if Verified) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    // Block login if not verified
    if (!user.isVerified) {
      return res.status(401).json({ msg: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: getSafeUserPayload(user)
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- PROFILE (Authenticated) ---
router.get('/profile', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: getSafeUserPayload(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load profile' });
  }
});

router.put('/profile', authRequired, async (req, res) => {
  try {
    const { username, phone, address } = req.body;

    const updateData = {};
    if (typeof username === 'string' && username.trim()) {
      updateData.username = username.trim();
    }
    if (typeof phone === 'string') {
      updateData.phone = phone.trim();
    }
    if (address && typeof address === 'object') {
      updateData.address = {
        fullAddress: address.fullAddress?.trim?.() || '',
        city: address.city?.trim?.() || '',
        state: address.state?.trim?.() || '',
        country: address.country?.trim?.() || 'India',
        pinCode: address.pinCode?.trim?.() || ''
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'Profile updated successfully',
      user: getSafeUserPayload(updatedUser)
    });
  } catch (err) {
    return res.status(400).json({ message: 'Failed to update profile', error: err.message });
  }
});

module.exports = router;
