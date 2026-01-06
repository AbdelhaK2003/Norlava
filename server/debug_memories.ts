import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listMemories() {
    console.log("🔍 Listing All Learned Memories...");
    const memories = await prisma.memory.findMany({
        include: {
            profile: {
                include: {
                    user: true
                }
            }
        }
    });

    memories.forEach(m => {
        console.log(`[${m.type}] For ${m.profile.user.username}: "${m.content}" (Source: ${m.prompt})`);
    });

    await prisma.$disconnect();
}

listMemories();
