const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String, select: true }, // Used to show actual password
    role: {
      type: String,
      enum: ["admin", "reviewer", "student"],
      required: true,
    },
    organization: { type: String, default: "Default Organization" },

    // Reviewer Rating Fields
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    avgAccuracy: { type: Number, default: 0 },
    avgTimeliness: { type: Number, default: 0 },
    technicalDomains: { type: [String], default: [] },

    // Additional Student Profile Fields
    collegeName: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    degree: { type: String, default: "" },

    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
