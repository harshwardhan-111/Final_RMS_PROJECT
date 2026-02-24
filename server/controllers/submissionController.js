const Submission = require("../models/Submission");
const Event = require("../models/Event");

/* =========================================
   STUDENT UPLOAD SUBMISSION
========================================= */
exports.uploadSubmission = async (req, res) => {
  try {
    const eventCode = req.body.eventCode?.trim();

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!eventCode) {
      return res.status(400).json({ message: "Event code required" });
    }

    // Find event using eventCode
    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if student joined event
    if (!event.students.includes(req.user.id)) {
      return res.status(403).json({
        message: "You have not joined this event"
      });
    }

    const submission = await Submission.create({
      event: event._id,
      student: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path,
      status: "pending"
    });

    res.status(201).json({
      message: "Submission uploaded successfully",
      submission
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================
   GET LOGGED-IN STUDENT SUBMISSIONS
========================================= */
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      student: req.user.id
    })
      .populate("event", "title eventCode")
      .sort({ createdAt: -1 });

    res.status(200).json(submissions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================
   GET REVIEWER SUBMISSIONS
========================================= */
exports.getReviewerSubmissions = async (req, res) => {
  try {
    // Find events assigned to this reviewer
    const events = await Event.find({
      reviewers: req.user.id
    });

    const eventIds = events.map(event => event._id);

    const submissions = await Submission.find({
      event: { $in: eventIds }
    })
      .populate("student", "name email")
      .populate("event", "title eventCode")
      .sort({ createdAt: -1 });

    res.status(200).json(submissions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================
   REVIEWER APPROVE / REJECT SUBMISSION
========================================= */
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId, decision, feedback } = req.body;

    if (!submissionId || !decision) {
      return res.status(400).json({
        message: "Submission ID and decision required"
      });
    }

    const submission = await Submission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found"
      });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be approved or rejected"
      });
    }

    submission.status = decision;
    submission.reviewerFeedback = feedback || "";

    await submission.save();

    res.status(200).json({
      message: "Review completed successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
