import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync } from 'fs';

async function testAndLog() {
    const logLines: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logLines.push(msg);
    };

    log("🔑 API Key: " + (process.env.GEMINI_API_KEY ? "Present" : "MISSING"));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const aiBrain = "You are Abdelhak. You are a helpful digital assistant.";
    const message = "hi";
    const prompt = `${aiBrain}\n\nUser: ${message}\nAssistant:`;

    log("\n📝 Prompt: " + prompt);
    log("\n🚀 Requesting...\n");

    try {
        const result = await model.generateContentStream(prompt);

        let fullResponse = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                process.stdout.write(chunkText);
                logLines.push(chunkText);
            }
        }

        log("\n\n✅ Complete! Length: " + fullResponse.length);
    } catch (error: any) {
        log("\n❌ Error occurred!");
        log("Error name: " + error.name);
        log("Error message: " + error.message);
        log("Error stack: " + error.stack);
        log("\nFull error object:");
        log(JSON.stringify(error, null, 2));
    }

    writeFileSync('server/gemini_debug_log.txt', logLines.join('\n'));
    log("\n💾 Log saved to server/gemini_debug_log.txt");
}

testAndLog();
