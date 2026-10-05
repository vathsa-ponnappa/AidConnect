const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const Emergency = require('../models/Emergency');

const router = express.Router();

//OPEN AI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//MULTER CONFIGURATION
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});


// AUTHENTICATION MIDDLEWARE
const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};


// CREATE EMERGENCY
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      type,
      latitude,
      longitude,
      address,
      description,
    } = req.body;

    // Validate location
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message: 'Location is required',
      });
    }

    const emergency = await Emergency.create({
      requester: req.userId,

      type: type || 'Emergency',

      status: 'finding_help',

      location: {
        latitude,
        longitude,
        address: address || '',
      },

      description: description || '',
    });

    res.status(201).json({
      message: 'Emergency request created successfully',

      emergency: {
        id: emergency._id,
        requester: emergency.requester,
        type: emergency.type,
        status: emergency.status,
        location: emergency.location,
        description: emergency.description,
        createdAt: emergency.createdAt,
      },
    });

  } catch (error) {
    console.error(
      'Create emergency error:',
      error.message
    );

    res.status(500).json({
      message: 'Server error while creating emergency',
    });
  }
});

// GET ACTIVE EMERGENCIES FOR RESPONDERS
router.get(
  '/nearby',
  authenticateUser,
  async (req, res) => {
    try {
      const emergencies = await Emergency.find({
        status: 'finding_help',
        requester: {
          $ne: req.userId,
        },
      })
        .sort({ createdAt: -1 })
        .limit(20);

      res.status(200).json({
        message: 'Nearby emergencies fetched successfully',

        emergencies: emergencies.map(
          (emergency) => ({
            id: emergency._id,
            type: emergency.type,
            status: emergency.status,
            location: emergency.location,
            description: emergency.description,
            createdAt: emergency.createdAt,
          })
        ),
      });

    } catch (error) {
      console.error(
        'Fetch nearby emergencies error:',
        error.message
      );

      res.status(500).json({
        message:
          'Server error while fetching emergencies',
      });
    }
  }
);

// RESPOND TO EMERGENCY
router.post(
  '/:id/respond',
  authenticateUser,
  async (req, res) => {
    try {
      const { action } = req.body;

      // Validate action
      if (
        action !== 'accept' &&
        action !== 'decline'
      ) {
        return res.status(400).json({
          message:
            'Action must be either accept or decline',
        });
      }

      const emergency =
        await Emergency.findById(
          req.params.id
        );

      if (!emergency) {
        return res.status(404).json({
          message: 'Emergency not found',
        });
      }

      // Requester cannot respond to their own emergency
      if (
        emergency.requester.toString() ===
        req.userId.toString()
      ) {
        return res.status(403).json({
          message:
            'You cannot respond to your own emergency',
        });
      }

      // Emergency must still be looking for help
      if (
        emergency.status !== 'finding_help'
      ) {
        return res.status(400).json({
          message:
            'This emergency is no longer accepting responders',
        });
      }

      // Check whether this user has already responded
      const existingResponder =
        emergency.responders.find(
          (responder) =>
            responder.user &&
            responder.user.toString() ===
              req.userId.toString()
        );

      if (existingResponder) {
        return res.status(400).json({
          message:
            'You have already responded to this emergency',
        });
      }

      // DECLINE
      if (action === 'decline') {
        emergency.responders.push({
          user: req.userId,
          status: 'declined',
          acceptedAt: null,
        });

        await emergency.save();

        return res.status(200).json({
          message:
            'Emergency declined successfully',
          response: {
            emergencyId: emergency._id,
            action: 'decline',
            status: 'declined',
          },
        });
      }

      // ACCEPT
      emergency.responders.push({
        user: req.userId,
        status: 'accepted',
        acceptedAt: new Date(),
      });

      emergency.assignedResponder =
        req.userId;

      emergency.status =
        'responder_assigned';

      await emergency.save();

      return res.status(200).json({
        message:
          'Emergency accepted successfully',

        response: {
          emergencyId: emergency._id,
          action: 'accept',
          status: 'accepted',
        },

        emergency: {
          id: emergency._id,
          status: emergency.status,
          assignedResponder:
            emergency.assignedResponder,
        },
      });

    } catch (error) {
      console.error(
        'Emergency response error:',
        error.message
      );

      res.status(500).json({
        message:
          'Server error while responding to emergency',
      });
    }
  }
);


// UPLOAD VOICE NOTE + AI ANALYSIS
router.post(
  '/:id/voice',
  authenticateUser,
  upload.single('voiceNote'),
  async (req, res) => {
    try {
      const emergency = await Emergency.findById(
        req.params.id
      );

      if (!emergency) {
        return res.status(404).json({
          message: 'Emergency not found',
        });
      }

      // Make sure the emergency belongs to the logged-in user
      if (
        emergency.requester.toString() !==
        req.userId.toString()
      ) {
        return res.status(403).json({
          message:
            'You are not authorized to update this emergency',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'Voice note file is required',
        });
      }

      // ================= SAVE VOICE NOTE =================

      emergency.voiceNote.url =
        `/uploads/${req.file.filename}`;

      emergency.voiceNote.uploadedAt =
        new Date();

      await emergency.save();

      // ================= AI TRANSCRIPTION =================
// ================= AI TRANSCRIPTION =================

const audioFilePath = req.file.path;

console.log('Starting AI transcription...');

let transcript = '';

try {
  const transcription =
    await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'gpt-4o-mini-transcribe',
    });

  transcript =
    transcription.text?.trim() || '';

  console.log(
    'AI transcription:',
    transcript
  );

} catch (aiError) {

  console.error(
    'AI transcription unavailable:',
    aiError.message
  );

  return res.status(200).json({
    message:
      'Voice note uploaded successfully, but AI analysis is temporarily unavailable.',

    voiceNote: {
      url: emergency.voiceNote.url,
      uploadedAt:
        emergency.voiceNote.uploadedAt,
    },

    aiAnalysis: null,

    aiStatus: 'unavailable',
  });
}

      // ================= AI EMERGENCY ANALYSIS =================

      console.log(
        'Starting AI emergency analysis...'
      );

      const analysisResponse =
        await openai.responses.create({
          model: 'gpt-5.6-luna',

          input: `
You are an emergency-assistance AI for AidConnect.

Analyze the following emergency voice transcript.

Your task is ONLY to:
1. Determine the severity level.
2. Write a short factual summary explaining what the caller appears to be experiencing.

Severity must be exactly one of:
LOW
MEDIUM
HIGH
CRITICAL

Return ONLY valid JSON in this exact format:

{
  "severity": "HIGH",
  "summary": "Short factual summary of the emergency."
}

Do not provide medical advice.
Do not diagnose the caller.
Do not invent information that was not stated.
If the information is unclear, reflect that uncertainty in the summary.

Transcript:
${transcript}
`,
        });

      const aiText =
        analysisResponse.output_text?.trim();

      console.log(
        'AI analysis:',
        aiText
      );

      let aiAnalysis;

      try {
        aiAnalysis =
          JSON.parse(aiText);
      } catch (parseError) {
        console.error(
          'AI JSON parsing failed:',
          parseError.message
        );

        aiAnalysis = {
          severity: 'MEDIUM',
          summary:
            'Emergency details were detected from the voice recording, but the AI analysis could not be formatted correctly.',
        };
      }

      // ================= SAVE AI ANALYSIS =================

      emergency.aiAnalysis = {
        summary:
          aiAnalysis.summary || '',
        severity:
          aiAnalysis.severity || '',
      };

      await emergency.save();

      // ================= RESPONSE =================

      res.status(200).json({
        message:
          'Voice note uploaded and analyzed successfully',

        voiceNote: {
          url: emergency.voiceNote.url,
          uploadedAt:
            emergency.voiceNote.uploadedAt,
        },

        aiAnalysis: {
          summary:
            emergency.aiAnalysis.summary,

          severity:
            emergency.aiAnalysis.severity,
        },
      });

    } catch (error) {
      console.error(
        'Voice upload and AI analysis error:',
        error
      );

      res.status(500).json({
        message:
          'Server error while processing voice note',
      });
    }
  }
);

// CANCEL EMERGENCY
router.post(
  '/:id/cancel',
  authenticateUser,
  async (req, res) => {
    try {
      const emergency = await Emergency.findById(
        req.params.id
      );

      if (!emergency) {
        return res.status(404).json({
          message: 'Emergency not found',
        });
      }

      // Make sure the emergency belongs to the logged-in user
      if (
        emergency.requester.toString() !==
        req.userId.toString()
      ) {
        return res.status(403).json({
          message:
            'You are not authorized to cancel this emergency',
        });
      }

      // Only active emergencies can be cancelled
      if (
        emergency.status === 'completed' ||
        emergency.status === 'cancelled'
      ) {
        return res.status(400).json({
          message:
            'This emergency can no longer be cancelled',
        });
      }

      emergency.status = 'cancelled';

      await emergency.save();

      res.status(200).json({
        message: 'Emergency cancelled successfully',

        emergency: {
          id: emergency._id,
          status: emergency.status,
        },
      });

    } catch (error) {
      console.error(
        'Cancel emergency error:',
        error.message
      );

      res.status(500).json({
        message:
          'Server error while cancelling emergency',
      });
    }
  }
);

module.exports = router;