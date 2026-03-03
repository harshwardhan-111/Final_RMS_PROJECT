const axios = require("axios");

const generateAIReview = async (submissionText) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a professional academic reviewer."
          },
          {
            role: "user",
            content: `Review the following student submission:\n\n${submissionText}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("AI Error:", error.message);
    return "AI review generation failed.";
  }
};

module.exports = generateAIReview;