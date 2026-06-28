const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fileName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    aiFeedback: {
      type: String,
      default: ""
    },

    reviewerFeedback: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["pending", "ai-reviewed", "approved", "rejected", "AI Review Accepted", "AI Review Rejected"],
      default: "pending"
    },
    aiReviewStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    reviewerDecisionTimestamp: {
      type: Date
    },
    reviewerScore: {
      type: Number,
      default: 0
    },
    aiScore: {
      type: Number,
      default: 0
    },
    assignedAt: {
      type: Date
    },
    submittedAt: {
      type: Date
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
