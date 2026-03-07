const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["Academic", "Conference", "academic", "conference"], required: true },
    eventCode: { type: String, unique: true, required: true, trim: true },
    bannerImageUrl: { type: String, default: "https://via.placeholder.com/800x400?text=Event+Banner" },
    allowMultipleSubmissions: { type: Boolean, default: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: ["upcoming", "registration", "submissions", "active", "completed"],
      default: "upcoming"
    },

    // Overall Event Dates
    startDate: Date,
    endDate: Date,

    // Phase Dates
    registrationStartDate: Date,
    registrationEndDate: Date,
    submissionStartDate: Date,
    submissionEndDate: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);