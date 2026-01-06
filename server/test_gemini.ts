import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
    console.log("🔑 Checking Gemini API Key:", process.env.GEMINI_API_KEY ? "Present" : "MISSING");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
        console.log("🚀 Sending test request to Gemini Pro...");
        const result = await model.generateContent("Say 'Hello' if you can hear me.");
        const response = await result.response;
        const text = response.text();
        console.log("✅ Success! Response:", text);
    } catch (error: any) {
        console.error("❌ Failed!");
        console.error("Error:", error.message || error);
    }
}

test();
