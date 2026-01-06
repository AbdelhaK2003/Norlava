import 'dotenv/config';

async function testDirectAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("🔑 API Key:", apiKey ? "Present" : "MISSING");

    // Test 1: List models using REST API directly
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    console.log("\n📡 Testing direct REST API call...");
    console.log("URL:", listUrl.replace(apiKey || '', 'API_KEY'));

    try {
        const response = await fetch(listUrl);
        const data = await response.json();

        if (response.ok) {
            console.log("\n✅ Successfully fetched models!");
            console.log("\nAvailable models:");
            for (const model of data.models || []) {
                console.log(`  📦 ${model.name}`);
                console.log(`     Display Name: ${model.displayName}`);
                console.log(`     Methods: ${model.supportedGenerationMethods?.join(', ')}`);
                console.log();
            }
        } else {
            console.log("\n❌ Error response:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error: any) {
        console.error("\n❌ Fetch error:", error.message);
    }

    // Test 2: Try generating content with v1 API
    console.log("\n🔧 Testing content generation with v1 API...");
    const genUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say hello' }] }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ v1 API generateContent works!");
            console.log("Response:", JSON.stringify(data, null, 2).substring(0, 200));
        } else {
            console.log("❌ v1 API failed:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error: any) {
        console.error("❌ Error:", error.message);
    }
}

testDirectAPI();
