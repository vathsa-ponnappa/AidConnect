const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      default: 'Emergency',
      trim: true,
    },

    status: {
      type: String,
      enum: [
        'finding_help',
        'responder_assigned',
        'responder_arrived',
        'completed',
        'cancelled',
      ],
      default: 'finding_help',
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },

      address: {
        type: String,
        default: '',
      },
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    voiceNote: {
  url: {
    type: String,
    default: '',
  },

  duration: {
    type: Number,
    default: 0,
  },

  uploadedAt: {
    type: Date,
    default: null,
  },
},

    aiAnalysis: {
      summary: {
        type: String,
        default: '',
      },

      severity: {
        type: String,
        default: '',
      },
    },

    assignedResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    responders: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },

        status: {
          type: String,
          enum: ['notified', 'accepted', 'declined'],
          default: 'notified',
        },

        acceptedAt: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Emergency = mongoose.model(
  'Emergency',
  emergencySchema
);

module.exports = Emergency;