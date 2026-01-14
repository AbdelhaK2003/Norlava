
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Fact Migration...");

    const users = await prisma.user.findMany({ include: { profile: true } });

    for (const user of users) {
        if (!user.profile) continue;

        console.log(`Processing user: ${user.username}`);

        // @ts-ignore
        const jsonFactsRaw = user.profile.pendingFacts;
        if (!jsonFactsRaw) {
            console.log(" - No JSON facts found.");
            continue;
        }

        const jsonFacts = JSON.parse(jsonFactsRaw);
        console.log(` - Found ${jsonFacts.length} JSON facts.`);

        for (const fact of jsonFacts) {
            // Check if already in DB to avoid double migration
            const exists = await prisma.memory.findFirst({
                where: {
                    profileId: user.profile.id,
                    type: 'LEARNED_FROM_GUEST',
                    content: fact
                }
            });

            if (!exists) {
                await prisma.memory.create({
                    data: {
                        profileId: user.profile.id,
                        type: 'LEARNED_FROM_GUEST',
                        prompt: 'Extracted from previous conversation',
                        content: fact
                    }
                });
                console.log(`   ✅ Migrated: "${fact.substring(0, 30)}..."`);
            } else {
                console.log(`   ⚠️ Skipped (Already exists): "${fact.substring(0, 30)}..."`);
            }
        }

        // Optional: Clear JSON field after migration? 
        // Let's keep it for safety for now, but the app uses Memory table.
    }

    console.log("✅ Migration Complete.");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
