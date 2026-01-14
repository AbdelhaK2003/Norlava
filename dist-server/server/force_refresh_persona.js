import { db, prisma } from './db';
async function refreshAll() {
    console.log("🔄 Force Refreshing AI Context for ALL Profiles...");
    const profiles = await prisma.profile.findMany();
    for (const p of profiles) {
        console.log(`Processing profile for User ID: ${p.userId}...`);
        // We need the profile ID, not User ID, for refreshAiContext based on db.ts signature
        // Wait, looking at db.ts: async refreshAiContext(profileId: string)
        await db.refreshAiContext(p.id);
        console.log(`✅ Refreshed!`);
    }
    console.log("🎉 All profiles updated with NEW PERSONA rules.");
    await prisma.$disconnect();
}
refreshAll();
