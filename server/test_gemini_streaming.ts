import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testChatScenario() {
    console.log("🔑 API Key:", process.env.GEMINI_API_KEY ? "Present" : "MISSING");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const aiBrain = "You are Abdelhak. You are a helpful digital assistant.";
    const userMessage = "hi";
    const prompt = `${aiBrain}\n\nUser: ${userMessage}\nAssistant:`;

    console.log("🚀 Testing streaming with gemini-1.5-flash...\n");

    try {
        const result = await model.generateContentStream(prompt);

        let fullResponse = "";
        console.log("📝 AI Response:");

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                process.stdout.write(chunkText);
            }
        }

        console.log("\n\n✅ Stream Complete!");
        console.log("📊 Total characters:", fullResponse.length);
        console.log("\n🎉 Gemini is working correctly!");
    } catch (error: any) {
        console.error("\n❌ Error:");
        console.error(error.message);
    }
}

testChatScenario();
