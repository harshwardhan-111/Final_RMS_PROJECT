const fs = require("fs");
const path = require("path");
const Submission = require("../models/Submission");
const Event = require("../models/Event");
const generateAIReview = require("../utils/generateAIReview");

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

    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (!event.students.includes(req.user.id)) {
      return res.status(403).json({ message: "You have not joined this event" });
    }

    if (event.status !== "submissions" && event.status !== "active") {
      return res.status(400).json({ message: `Submissions are closed. Status: ${event.status}` });
    }

    if (!event.allowMultipleSubmissions) {
      const existingSubmission = await Submission.findOne({ event: event._id, student: req.user.id });
      if (existingSubmission) {
        return res.status(400).json({ message: "Multiple submissions are not allowed." });
      }
    }

    const submission = await Submission.create({
      event: event._id,
      student: req.user.id,
      fileName: req.file.filename,
      filePath: req.file.path,
      status: "pending"
    });

    res.status(201).json({ message: "Submission uploaded successfully", submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   GET SUBMISSIONS
========================================= */
exports.getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id }).populate("event", "title");
    res.status(200).json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate("event", "title eventCode").sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getReviewerSubmissions = async (req, res) => {
  try {
    const events = await Event.find({ reviewers: req.user.id });
    const eventIds = events.map(event => event._id);
    const submissions = await Submission.find({ event: { $in: eventIds } })
      .populate("student", "name email").populate("event", "title eventCode").sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

/* =========================================
   REVIEWER APPROVE / REJECT SUBMISSION
========================================= */
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.body;

    // 1. UPDATED: Populate the event title and description
    const submission = await Submission.findById(submissionId).populate("event", "title description");

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const filePath = path.join(__dirname, "..", submission.filePath);
    let extractedText = "";
    let fileInlineData = null;

    if (fs.existsSync(filePath)) {
      const ext = path.extname(submission.fileName).toLowerCase();

      if (ext === '.pdf') {
        const fileBuffer = fs.readFileSync(filePath);
        fileInlineData = { inlineData: { data: fileBuffer.toString("base64"), mimeType: "application/pdf" } };
      } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = ext === '.png' ? 'image/png' : (ext === '.webp' ? 'image/webp' : 'image/jpeg');
        fileInlineData = { inlineData: { data: fileBuffer.toString("base64"), mimeType: mimeType } };
      } else if (['.txt', '.md', '.html', '.js', '.css', '.csv'].includes(ext)) {
        extractedText = fs.readFileSync(filePath, 'utf8');
      } else {
        extractedText = `[System Note: File format (${ext}) not supported. File Name: ${submission.fileName}]`;
      }
    } else {
      extractedText = `[System Note: File not found on server. File Name: ${submission.fileName}]`;
    }

    const textToReview = extractedText.substring(0, 25000);

    // 2. UPDATED: Create the event context object
    const eventDetails = {
      title: submission.event.title,
      description: submission.event.description
    };

    // 3. UPDATED: Pass the event details to the AI
    const aiFeedback = await generateAIReview(textToReview, fileInlineData, eventDetails);

    submission.aiFeedback = aiFeedback;
    submission.status = "ai-reviewed";
    await submission.save();

    res.status(200).json({
      message: "AI review generated successfully",
      feedback: aiFeedback
    });

  } catch (error) {
    console.error("Review Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   REVIEWER ACCEPT / REJECT AI REVIEW
======================================== */
exports.acceptAIReview = async (req, res) => {
  try {
    const { submissionId } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.aiReviewStatus = "accepted";
    submission.status = "AI Review Accepted";
    submission.reviewerDecisionTimestamp = new Date();
    await submission.save();

    res.status(200).json({ message: "AI review accepted successfully", submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectAIReview = async (req, res) => {
  try {
    const { submissionId } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.aiReviewStatus = "rejected";
    submission.status = "AI Review Rejected";
    submission.reviewerDecisionTimestamp = new Date();
    await submission.save();

    res.status(200).json({ message: "AI review rejected successfully", submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitManualReview = async (req, res) => {
  try {
    const { submissionId, feedback } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.reviewerFeedback = feedback;
    submission.status = "AI Review Rejected";
    await submission.save();

    res.status(200).json({ message: "Manual review updated successfully", submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   STUDENT DELETE SUBMISSION
======================================== */
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Only the student who submitted can delete it
    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to delete this submission" });
    }

    // Prevent deletion if already reviewed
    const lockedStatuses = ["AI Review Accepted", "AI Review Rejected", "approved", "ai-reviewed"];
    if (lockedStatuses.includes(submission.status) || submission.reviewerFeedback) {
      return res.status(400).json({ message: "This submission has already been reviewed and cannot be deleted." });
    }

    await Submission.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};