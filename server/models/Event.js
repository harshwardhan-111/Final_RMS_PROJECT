const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["academic", "conference"],
      required: true,
    },

    eventCode: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],

    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming"
    },

    startDate: Date,
    endDate: Date
  },
  { timestamps: true }
);

// Index for faster eventCode lookup

module.exports = mongoose.model("Event", eventSchema);