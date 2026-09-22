// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const OtpToken = require('../models/OtpToken');
const { sendOtpEmail } = require('../utils/sendEmail');
const authMiddleware = require('../middleware/authMiddleware');

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
  clientId: user.clientId,
  referralCode: user.referralCode,
  mobileVerified: user.mobileVerified,
  whatsappVerified: user.whatsappVerified,
  emailVerified: user.emailVerified
});

const normalizeTarget = (value = '') => value.toString().trim().toLowerCase();

const verifyOtp = async ({ target, channel, purpose, otp }) => {
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
    const { target, channel = 'email', purpose = 'login' } = req.body;

    if (!target || channel !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'OTP can only be sent by email.'
      });
    }

    const cleanEmail = normalizeTarget(target);
    const existingUser = await User.findOne({ email: cleanEmail });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered on the Vishwakarma portal. Please enter your registered email or contact support.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpToken.create({
      target: cleanEmail,
      channel,
      purpose,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP directly to email via SMTP. Do not report success if delivery fails.
    const emailSent = await sendOtpEmail({ toEmail: cleanEmail, otp, purpose });
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'We could not send the OTP email right now. Please try again in a few minutes.'
      });
    }

    res.json({
      success: true,
      message: 'OTP has been sent to your registered email.'
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
    const normalizedEmail = (email || '').trim().toLowerCase();
    
    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
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
        message: 'OTP login is available only by email.'
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

    await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
    user.emailVerified = true;

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

// @route   GET /api/auth/profile
// @desc    Get current user profile + linked client project info
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let client = null;
    if (user.clientId) {
      client = await Client.findById(user.clientId);
    }
    if (!client) {
      client = await Client.findOne({
        $or: [
          { user: user._id },
          { email: user.email },
          ...(user.mobile ? [{ phone: user.mobile }] : [])
        ]
      });
      if (client && !user.clientId) {
        user.clientId = client._id;
        if (user.role !== 'client' && user.role !== 'admin') {
          user.role = 'client';
        }
        await user.save();
      }
    }

    res.json({
      success: true,
      user: userPayload(user),
      client: client || null
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, mobile, whatsappNumber, address } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) user.name = name.trim();
    if (mobile) {
      const cleanMobile = mobile.toString().trim();
      const duplicate = await User.findOne({ mobile: cleanMobile, _id: { $ne: user._id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Mobile number already registered by another account' });
      }
      user.mobile = cleanMobile;
    }
    if (whatsappNumber !== undefined) {
      user.whatsappNumber = whatsappNumber ? whatsappNumber.toString().trim() : '';
    }
    if (address !== undefined) {
      user.address = address ? address.toString().trim() : '';
    }

    await user.save();

    // If client exists, sync basic name, phone and location
    if (user.clientId) {
      await Client.findByIdAndUpdate(user.clientId, {
        ...(name && name.trim() ? { name: name.trim() } : {}),
        ...(mobile ? { phone: mobile.toString().trim() } : {}),
        ...(address && address.trim() ? { location: address.toString().trim() } : {})
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userPayload(user)
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
