import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking database content...");

    try {
        const userCount = await prisma.user.count();
        console.log(`📊 Total Users found: ${userCount}`);

        const users = await prisma.user.findMany();
        console.log("Users:", JSON.stringify(users, null, 2));

    } catch (e) {
        console.error("❌ Error connecting to DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
