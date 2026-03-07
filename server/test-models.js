// test-models.js
require('dotenv').config(); // Loads your .env file

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ Error: Could not find GEMINI_API_KEY in your .env file.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("🔍 Checking available models for your API key...\n");

fetch(url)
  .then(response => response.json())
  .then(data => {
    if (data.error) {
        console.error("❌ API Error:", data.error.message);
    } else {
        console.log("✅ SUCCESS! Here are the text-generation models you can use:");
        console.log("---------------------------------------------------------");
        
        data.models.forEach(model => {
            // We only care about models that can generate text/content
            if (model.supportedGenerationMethods.includes("generateContent")) {
                // Strip the "models/" prefix to give you the exact string you need
                const exactModelName = model.name.replace('models/', '');
                console.log(`➡️  ${exactModelName}`);
            }
        });
        console.log("---------------------------------------------------------");
        console.log("Copy one of the names above (like 'gemini-1.5-flash') and use it in your generateAIReview.js file.");
    }
  })
  .catch(err => console.error("❌ Network Error:", err));