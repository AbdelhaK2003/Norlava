import { db, prisma } from './db';

async function test() {
    console.log("🧪 Testing Memory Model...");
    try {
        // Just check if the property exists on the client object at runtime
        if ('memory' in prisma) {
            console.log("✅ prisma.memory exists at runtime!");
        } else {
            console.log("❌ prisma.memory is MISSING at runtime.");
            console.log("Keys on prisma:", Object.keys(prisma));
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
