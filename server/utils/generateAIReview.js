const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateAIReview = async (textContent, fileInlineData = null) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const promptText = `You are a professional academic reviewer. Review the following student submission and provide constructive, detailed feedback. 
    
Please format your response strictly using the following structure:

### 📝 Overall Summary
(Provide a brief summary of the submission)

### ✅ Strengths
* (List key strengths)

### 🎯 Areas for Improvement
* (List specific areas needing improvement)

### 💡 Actionable Suggestions
* (Give concrete steps the student can take to improve)

### 📊 Suggested Grade/Rating
(Provide a qualitative rating, e.g., Excellent, Good, Needs Work)

Here is the student's submission:
--------------------------------------------------
${textContent || "(Please read the attached file)"}
--------------------------------------------------`;

    // Package the prompt and the file together
    const requestContent = [promptText];
    if (fileInlineData) {
        requestContent.push(fileInlineData);
    }

    let response;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(requestContent);
        response = await result.response;
    } catch (err1) {
        console.log("⚠️ gemini-2.5-flash failed. Falling back to gemini-2.0-flash...");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await fallbackModel.generateContent(requestContent);
        response = await result.response;
    }

    return response.text();

  } catch (error) {
    console.error("Gemini AI Error:", error.message);
    return "AI review generation failed. Please check your server console for details.";
  }
};

module.exports = generateAIReview;