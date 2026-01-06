import 'dotenv/config';
import OpenAI from 'openai';

async function test() {
    console.log("🔑 Checking OpenAI Key:", process.env.OPENAI_API_KEY ? "Present" : "MISSING");

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    try {
        console.log("🚀 Sending test request...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Say 'Hello' if you can hear me." }],
            model: "gpt-4o",
        });
        console.log("✅ Success! Response:", completion.choices[0].message.content);
    } catch (error: any) {
        console.error("❌ Failed!");
        console.error("Code:", error.code);
        console.error("Type:", error.type);
        console.error("Message:", error.message);
    }
}

test();
