const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "reviewer", "admin"],
      default: "student", // Req 1: Defaults to student
    },
    plainPassword: {
      type: String, // Req 4: Store actual created password for admin view
      select: true,
    },

    organization: {
      type: String,
      default: "Default Organization",
    },

    assignedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
