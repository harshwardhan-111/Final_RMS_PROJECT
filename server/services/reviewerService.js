const User = require("../models/User");

/**
 * Updates a reviewer's rating based on their submission review data.
 * @param {string} reviewerId - The ID of the reviewer.
 * @param {Object} reviewData - The review data containing scores and timestamps.
 */
exports.updateReviewerRating = async (reviewerId, reviewData) => {
  try {
    const { reviewerScore = 0, aiScore = 0, assignedAt, submittedAt } = reviewData;

    // Fetch reviewer
    const reviewer = await User.findById(reviewerId);
    if (!reviewer || reviewer.role !== "reviewer") return;

    // Calculate accuracy: 10 - abs(reviewerScore - aiScore)
    // Scale is assumed to be 0-10 or 0-100. Assuming they are generally close. 
    // If diff is large, accuracy might go negative, so floor it at 0.
    const scoreDiff = Math.abs(Number(reviewerScore) - Number(aiScore));
    const accuracy = Math.max(0, 10 - scoreDiff);

    // Calculate timeliness: If submitted on time -> 10, Else reduce score based on delay
    let timeliness = 10;
    if (assignedAt && submittedAt) {
      const msDiff = new Date(submittedAt) - new Date(assignedAt);
      const hoursDiff = msDiff / (1000 * 60 * 60);
      
      // Let's assume standard allowed time is 48 hours for a review
      if (hoursDiff > 48) {
        // Reduce 1 point for every 24 hours of delay past the deadline
        const extraDaysDelay = Math.floor((hoursDiff - 48) / 24) + 1;
        timeliness = Math.max(0, 10 - extraDaysDelay);
      }
    }

    // Update running averages
    const totalReviews = reviewer.totalReviews || 0;
    const currentAvgAccuracy = reviewer.avgAccuracy || 0;
    const currentAvgTimeliness = reviewer.avgTimeliness || 0;

    const newTotalReviews = totalReviews + 1;
    const newAvgAccuracy = ((currentAvgAccuracy * totalReviews) + accuracy) / newTotalReviews;
    const newAvgTimeliness = ((currentAvgTimeliness * totalReviews) + timeliness) / newTotalReviews;

    // Final rating: 0.6 * avgAccuracy + 0.3 * avgTimeliness + 0.1 * totalReviews
    const rating = (0.6 * newAvgAccuracy) + (0.3 * newAvgTimeliness) + (0.1 * newTotalReviews);

    // Save to user model
    reviewer.totalReviews = newTotalReviews;
    reviewer.avgAccuracy = newAvgAccuracy;
    reviewer.avgTimeliness = newAvgTimeliness;
    reviewer.rating = rating;

    await reviewer.save();
  } catch (error) {
    console.error("Error updating reviewer rating:", error);
  }
};
