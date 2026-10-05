const mongoose = require('mongoose');

const emergencyContactSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      mobile: {
        type: String,
        required: true,
        trim: true,
      },

      relationship: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );


const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    emergencyContacts: {
      type: [emergencyContactSchema],

      required: true,

      validate: {
        validator: function (contacts) {
          return (
            Array.isArray(contacts) &&
            contacts.length === 2
          );
        },

        message:
          'Exactly 2 emergency contacts are required',
      },
    },

    isVerified: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);


const User = mongoose.model(
  'User',
  userSchema
);

module.exports = User;