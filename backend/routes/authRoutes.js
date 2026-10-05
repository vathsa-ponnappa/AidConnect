const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      password,
      emergencyContacts,
    } = req.body;

    // Check required personal details
    if (
      !fullName ||
      !email ||
      !mobile ||
      !password
    ) {
      return res.status(400).json({
        message: 'All personal details are required',
      });
    }

    // Check emergency contacts
    if (
      !Array.isArray(emergencyContacts) ||
      emergencyContacts.length !== 2
    ) {
      return res.status(400).json({
        message:
          'Exactly 2 emergency contacts are required',
      });
    }

    // Validate each emergency contact
    for (const contact of emergencyContacts) {
      if (
        !contact.name ||
        !contact.mobile ||
        !contact.relationship
      ) {
        return res.status(400).json({
          message:
            'All emergency contact fields are required',
        });
      }
    }

    // Prevent duplicate emergency contact numbers
    if (
      emergencyContacts[0].mobile.trim() ===
      emergencyContacts[1].mobile.trim()
    ) {
      return res.status(400).json({
        message:
          'Emergency contacts must have different mobile numbers',
      });
    }

    // Check existing account
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          'An account with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const user = await User.create({
      fullName,
      email,
      mobile,
      passwordHash,

      emergencyContacts: [
        {
          name: emergencyContacts[0].name.trim(),
          mobile: emergencyContacts[0].mobile.trim(),
          relationship:
            emergencyContacts[0].relationship,
        },
        {
          name: emergencyContacts[1].name.trim(),
          mobile: emergencyContacts[1].mobile.trim(),
          relationship:
            emergencyContacts[1].relationship,
        },
      ],
    });

    res.status(201).json({
      message: 'Account created successfully',

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        emergencyContacts:
          user.emergencyContacts,
      },
    });
  } catch (error) {
    console.error(
      'Signup error:',
      error.message
    );

    res.status(500).json({
      message:
        'Server error while creating account',
    });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message:
          'Email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    // Send response
    res.status(200).json({
      message: 'Login successful',

      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        emergencyContacts:
          user.emergencyContacts,
      },
    });
  } catch (error) {
    console.error(
      'Login error:',
      error.message
    );

    res.status(500).json({
      message:
        'Server error while logging in',
    });
  }
});

module.exports = router;