const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendPasswordResetOTPEmail } = require('../utils/otpService');

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

const isValidPasswordLength = (password) =>
  typeof password === 'string' && password.length >= 6 && password.length <= 15;

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!isValidPasswordLength(password)) {
      return res.status(400).json({ 
        msg: "Password must be between 6 and 15 characters long." 
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && !existingUser.isVerified) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        existingUser.otp = newOtp;
        existingUser.otpExpires = Date.now() + 10 * 60 * 1000;
        await existingUser.save();
        await sendOTPEmail(email, newOtp);
        return res.status(200).json({ msg: "New OTP sent to your email." });
    }

    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false 
    });

    await newUser.save();

    await sendOTPEmail(email, otp);

    res.status(201).json({ 
      msg: "OTP sent to email. Please verify to activate account.",
      email: newUser.email 
    });
  } catch (err) {
    console.error("Signup Error:", err);

    const rawError = String(err.message || '');
    const lowerError = rawError.toLowerCase();

    if (lowerError.includes('smtp is not configured')) {
      return res.status(500).json({
        message: 'OTP email service is not configured on server. Please set SMTP credentials.'
      });
    }

    if (
      lowerError.includes('invalid login') ||
      lowerError.includes('username and password not accepted') ||
      lowerError.includes('535')
    ) {
      return res.status(500).json({
        message: 'SMTP authentication failed. Recheck SMTP_USER and SMTP_PASS (Gmail App Password).'
      });
    }

    if (
      lowerError.includes('etimedout') ||
      lowerError.includes('econnreset') ||
      lowerError.includes('smtp timeout') ||
      lowerError.includes('connection timeout')
    ) {
      return res.status(500).json({
        message: 'SMTP connection timed out. Verify SMTP host/port and try again.'
      });
    }

    res.status(500).json({
      message: 'Failed to process registration or send email.',
      debug: process.env.NODE_ENV === 'development' ? rawError : undefined
    });
  }
});

router.post('/forgot-password/request', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (user && user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtp = otp;
      user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      await sendPasswordResetOTPEmail(email, otp);
    }

    return res.status(200).json({
      message: 'If your email is registered, an OTP has been sent.'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Unable to process forgot password request.' });
  }
});

router.post('/forgot-password/verify', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required.' });
    }

    if (!isValidPasswordLength(newPassword)) {
      return res.status(400).json({ message: 'Password must be between 6 and 15 characters long.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    if (!user.resetOtp || user.resetOtp !== otp || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ msg: "User does not exist" });

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

router.get('/profile', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -otp -otpExpires -resetOtp -resetOtpExpires');
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
    ).select('-password -otp -otpExpires -resetOtp -resetOtpExpires');

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

router.patch('/change-password', authRequired, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (!isValidPasswordLength(newPassword)) {
      return res.status(400).json({ message: 'Password must be between 6 and 15 characters long.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return res.status(400).json({ message: 'New password must be different from current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to change password.' });
  }
});

module.exports = router;
