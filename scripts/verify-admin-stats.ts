import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminStats() {
    console.log("🔍 Verifying Admin Stats Logic...");

    try {
        // 1. Total Stats
        const totalUsers = await prisma.user.count();
        console.log(`✅ Total Users: ${totalUsers}`);

        const totalMessages = await prisma.message.count();
        console.log(`✅ Total Messages: ${totalMessages}`);

        const totalProfiles = await prisma.profile.count();
        console.log(`✅ Total Profiles: ${totalProfiles}`);

        // 2. Messages per day (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMessages = await prisma.message.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true
            }
        });

        console.log(`✅ Recent Messages (Last 30 days): ${recentMessages.length}`);

        const messagesByDay: Record<string, number> = {};
        recentMessages.forEach(msg => {
            const date = msg.createdAt.toISOString().split('T')[0];
            messagesByDay[date] = (messagesByDay[date] || 0) + 1;
        });

        console.log("📊 Daily Activity Sample:", JSON.stringify(messagesByDay, null, 2));

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAdminStats();
