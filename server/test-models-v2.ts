
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { console.error('No API Key'); process.exit(1); }

    const genAI = new GoogleGenerativeAI(apiKey);

    // High probability models last to ensure they are printed at bottom
    const candidates = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    console.log("--- START TESTING ---");

    for (const modelName of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            await model.generateContent("Hi");
            console.log(`>>> SUCCESS: ${modelName} <<<`);
        } catch (e) {
            // console.log(`Fail: ${modelName}`);
        }
    }
    console.log("--- END TESTING ---");
}

listModels();
