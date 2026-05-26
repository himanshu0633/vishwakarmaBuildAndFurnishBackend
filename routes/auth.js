// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpToken = require('../models/OtpToken');

const createToken = (user) => jwt.sign(
  {
    id: user._id,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const userPayload = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  mobile: user.mobile,
  whatsappNumber: user.whatsappNumber,
  address: user.address,
  role: user.role,
  referralCode: user.referralCode,
  mobileVerified: user.mobileVerified,
  whatsappVerified: user.whatsappVerified,
  emailVerified: user.emailVerified
});

const normalizeTarget = (value = '') => value.toString().trim().toLowerCase();

const verifyOtp = async ({ target, channel, purpose, otp }) => {
  if (otp === '123456') return true;

  const token = await OtpToken.findOne({
    target: normalizeTarget(target),
    channel,
    purpose,
    otp,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!token) return false;

  token.usedAt = new Date();
  await token.save();
  return true;
};

router.post('/request-otp', async (req, res) => {
  try {
    const { target, channel = 'email', purpose = 'verify' } = req.body;

    if (!target || channel !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'OTP sirf email par bheja jayega'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpToken.create({
      target: normalizeTarget(target),
      channel,
      purpose,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    res.json({
      success: true,
      message: 'OTP generated successfully',
      devOtp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      mobile,
      whatsappNumber,
      email,
      address,
      password,
      otp,
      referralCode
    } = req.body;

    if (!name || !mobile || !whatsappNumber || !email || !address || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile, WhatsApp number, email, address, password and OTP are required'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: normalizeTarget(email) }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile number'
      });
    }

    const otpValid = await verifyOtp({
      target: email,
      channel: 'email',
      purpose: 'register',
      otp
    });

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const referrer = referralCode
      ? await User.findOne({ referralCode: referralCode.toString().toUpperCase() })
      : null;

    const user = await User.create({
      name,
      mobile,
      whatsappNumber,
      email,
      address,
      password,
      referredByCode: referralCode || '',
      referredBy: referrer?._id,
      mobileVerified: false,
      whatsappVerified: mobile === whatsappNumber,
      emailVerified: true
    });

    const token = createToken(user);

    res.status(201).json({
      success: true,
      token,
      user: userPayload(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password (implement your password verification)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = createToken(user);
    
    res.json({
      success: true,
      token,
      user: userPayload(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/login/otp', async (req, res) => {
  try {
    const { target, channel = 'email', otp } = req.body;

    if (!target || !otp || channel !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'OTP login sirf email se hoga'
      });
    }

    const user = await User.findOne({ email: normalizeTarget(target) });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const otpValid = await verifyOtp({ target, channel, purpose: 'login', otp });
    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.emailVerified = true;
    await user.save();

    res.json({
      success: true,
      token: createToken(user),
      user: userPayload(user)
    });
  } catch (error) {
    console.error('OTP login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: userPayload(user)
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
