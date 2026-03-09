const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateAIReview = async (textContent, fileInlineData = null, eventDetails = null) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Inject event context if available
    const eventContext = eventDetails 
      ? `\n\n### 🏢 EVENT CONTEXT\n**Event Title:** ${eventDetails.title}\n**Event Description:** ${eventDetails.description}\n\nIMPORTANT INSTRUCTION: Evaluate the student's submission specifically against the Event Context provided above. Does the submission fulfill the requirements and goals of this specific event?`
      : '';

    const promptText = `You are an expert academic and professional reviewer. Review the following student submission.
    ${eventContext}
    
Please format your response strictly using the following Markdown structure:

### 📝 Overall Summary
(Provide a brief, objective summary of the submission)

### 🎯 Relevance to Event
(Evaluate how well the submission aligns with the Event Title and Description. Does it follow the brief?)

### 💡 Novelty & Innovation
(Assess the uniqueness, creativity, and original thinking in the proposed solution/research)

### 📈 Expected Outcomes & Impact
(Evaluate the potential real-world impact, feasibility, and expected outcomes of this work)

### ✅ Strengths & 🛠 Areas for Improvement
* **Strength:** (List a key strength)
* **Strength:** (List a key strength)
* **Improvement:** (Give a concrete, actionable step to improve)
* **Improvement:** (Give a concrete, actionable step to improve)

### 📊 Scoring Breakdown
* **Relevance:** x/10
* **Novelty:** x/10
* **Impact/Feasibility:** x/10
* **Execution/Clarity:** x/10
* **Overall Score:** x/10

Here is the student's submission:
--------------------------------------------------
${textContent || "(Please read the attached file)"}
--------------------------------------------------`;

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