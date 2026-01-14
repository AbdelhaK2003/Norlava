
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking Database State...");

    // 1. Get the first user (likely the host)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("❌ No users found in DB.");
        return;
    }
    console.log(`👤 Found User: ${user.username} (ID: ${user.id})`);

    // 2. Check Profile
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
        console.log("❌ No profile found.");
        return;
    }
    console.log(`👤 Profile ID: ${profile.id}`);

    // 3. Check JSON Pending Facts
    // @ts-ignore
    const jsonFacts = profile.pendingFacts ? JSON.parse(profile.pendingFacts) : [];
    console.log(`📄 JSON 'pendingFacts' count: ${jsonFacts.length}`);
    console.log(`   - ${jsonFacts.join('\n   - ')}`);

    // 4. Check Memory Table (Pending Facts)
    const memories = await prisma.memory.findMany({
        where: {
            profileId: profile.id,
            type: 'LEARNED_FROM_GUEST'
        }
    });
    console.log(`🧠 Memory Table 'LEARNED_FROM_GUEST' count: ${memories.length}`);
    if (memories.length === 0 && jsonFacts.length > 0) {
        console.log("⚠️ DISCREPANCY: Facts exist in JSON but not in Memory Table. Run migration!");
    }

    // 5. Check Messages (Stats)
    const allMessages = await prisma.message.count({ where: { hostId: user.id } });
    const visitorMessages = await prisma.message.count({ where: { hostId: user.id, isUser: true } });
    const aiMessages = await prisma.message.count({ where: { hostId: user.id, isUser: false } });

    console.log(`📊 Message Stats:`);
    console.log(`   - Total: ${allMessages}`);
    console.log(`   - Visitor: ${visitorMessages}`);
    console.log(`   - AI: ${aiMessages}`);

    if (allMessages === 0) {
        console.log("⚠️ No messages found. '0' stats is correct.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
