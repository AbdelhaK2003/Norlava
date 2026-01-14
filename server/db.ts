import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Database Adapter Class
// This abstracts the Prisma calls so the rest of the app doesn't need to change much
class Database {
    // User Methods
    async createUser(user: { email: string; username: string; password: string; firstName: string; lastName: string; birthday?: string }) {
        return await prisma.user.create({
            data: {
                email: user.email,
                username: user.username,
                password: user.password,
                firstName: user.firstName,
                lastName: user.lastName,
                birthday: user.birthday ? new Date(user.birthday) : null
            }
        });
    }

    async findUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email }
        });
    }

    async findUserById(id: string) {
        return await prisma.user.findUnique({
            where: { id }
        });
    }

    async findUserByUsername(username: string) {
        return await prisma.user.findUnique({
            where: { username }
        });
    }

    // Password Reset Methods
    async setResetCode(email: string, code: string, expires: Date) {
        return await prisma.user.update({
            where: { email },
            data: {
                resetCode: code,
                resetCodeExpires: expires,
                failedResetAttempts: 0,
                lockedUntil: null
            }
        });
    }

    async getResetData(email: string) {
        return await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                resetCode: true,
                resetCodeExpires: true,
                failedResetAttempts: true,
                lockedUntil: true
            }
        });
    }

    async incrementResetAttempts(email: string, lock: boolean = false) {
        const data: any = { failedResetAttempts: { increment: 1 } };
        if (lock) {
            data.lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        }
        return await prisma.user.update({
            where: { email },
            data
        });
    }

    async updatePassword(email: string, passwordHash: string) {
        return await prisma.user.update({
            where: { email },
            data: {
                password: passwordHash,
                resetCode: null,
                resetCodeExpires: null,
                failedResetAttempts: 0,
                lockedUntil: null
            }
        });
    }

    // Profile Methods
    async createProfile(profile: { userId: string; interests: string; personality: string; funFacts: string; aiContext?: string; bio?: string; writingStyle?: string; philosophy?: string }) {
        return await prisma.profile.create({
            data: {
                userId: profile.userId,
                interests: profile.interests,
                personality: profile.personality,
                funFacts: profile.funFacts,
                aiContext: profile.aiContext,
                bio: profile.bio,
                writingStyle: profile.writingStyle,
                philosophy: profile.philosophy
            }
        });
    }

    async findProfileByUserId(userId: string) {
        return await prisma.profile.findUnique({
            where: { userId }
        });
    }

    async updateProfile(userId: string, data: any) {
        return await prisma.profile.update({
            where: { userId },
            data
        });
    }

    // Avatar Methods
    async upsertAvatar(profileId: string, data: { gender: string; baseColor?: string; eyeColor?: string }) {
        return await prisma.avatar.upsert({
            where: { profileId },
            update: data,
            create: {
                profileId,
                ...data
            }
        });
    }

    async findAvatarByUserId(userId: string) {
        const profile = await this.findProfileByUserId(userId);
        if (!profile) return null;

        return await prisma.avatar.findUnique({
            where: { profileId: profile.id }
        });
    }

    // Message Methods
    async createMessage(msg: { content: string; isUser: boolean; hostId: string; senderId?: string; visitorId?: string }) {
        return await prisma.message.create({
            data: {
                content: msg.content,
                isUser: msg.isUser,
                hostId: msg.hostId,
                senderId: msg.senderId,
                visitorId: msg.visitorId
            }
        });
    }

    async getMessagesForHost(hostId: string) {
        return await prisma.message.findMany({
            where: { hostId },
            orderBy: { createdAt: 'asc' }
        });
    }

    // Helper: Get full user data
    async getUserWithProfile(userId: string) {
        const user = await this.findUserById(userId);
        if (!user) return null;

        const profile = await prisma.profile.findUnique({
            where: { userId },
            include: { avatar: true }
        });

        return {
            ...user,
            profile: profile
        };
    }
    // Memory Methods (The Digital Brain)
    async createMemory(data: { profileId: string; type: string; prompt: string; content: string }) {
        // @ts-ignore: Prisma client type mismatch in dev
        return await prisma.memory.create({
            data: {
                profileId: data.profileId,
                type: data.type,
                prompt: data.prompt,
                content: data.content
            }
        });
    }

    async getMemories(profileId: string) {
        // @ts-ignore: Prisma client type mismatch in dev
        return await prisma.memory.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteMemory(id: string) {
        // @ts-ignore: Prisma client type mismatch in dev
        return await prisma.memory.delete({
            where: { id }
        });
    }

    // New Helper: Get messages for a specific interaction context (Host + Visitor)
    async getMessagesForVisitor(hostId: string, visitorId: string) {
        // We fetch messages where:
        // 1. hostId is the host
        // 2. AND (visitorId matches OR senderId matches visitorID OR it's a legacy message without ID)
        // For MVP strict isolation:
        // Message where hostId = hostId AND visitorId = visitorId
        return await prisma.message.findMany({
            where: {
                hostId: hostId,
                visitorId: visitorId
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    // New Helper: Get Dashboard Stats
    async getDashboardStats(hostId: string) {
        console.log(`📊 DB: Fetching stats for Host ID: ${hostId}`);
        // 1. Total Messages (both user and AI)
        const totalMessages = await prisma.message.count({
            where: {
                hostId
            }
        });

        // 2. Unique Visitors
        // We count distinct visitorIds where hostId matches
        const uniqueVisitors = await prisma.message.groupBy({
            by: ['visitorId'],
            where: {
                hostId,
                visitorId: { not: null } // Exclude nulls if any
            }
        });

        console.log(`📊 DB: Found ${totalMessages} messages and ${uniqueVisitors.length} unique visitors.`);

        return {
            totalMessages,
            totalVisitors: uniqueVisitors.length
        };
    }

    // Helper: Re-generate the AI System Prompt based on all memories
    // This aggregates all the little facts into one big persona description
    async refreshAiContext(profileId: string) {
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            include: { user: true }
        });

        const memories = await this.getMemories(profileId);

        // Simple aggregation strategy for MVP
        let context = `You are a Digital Twin of ${profile?.user.firstName}. 
Rules for your interaction:
1. PERMANENT INSTRUCTION: You are NOT an AI assistant. You are a digital version of ${profile?.user.firstName}.
2. TONE: MIMIC THE USER'S STYLE EXACTLY.
    - Analyze the "Brain Dump" and "Core Biography" sections below to catch the specific vibe.
    - Use the exact same capitalization, slang, and sentence structures as the user.
    - If the user uses "lol" or "haha", use them. If they are formal, be formal.
3. KNOWLEDGE: Use the "Digital Brain" facts below as your primary memory.
4. UNKNOWN FACTS (CRITICAL):
    - If asked something you DO NOT know about ${profile?.user.firstName}, DO NOT LIE OR GUESS.
    - Instead, say something like: "I am still learning from ${profile?.user.firstName}, I'll ask them about that and let you know!"
    - NEVER make up biographical facts (like where they live or exact age) if it's not in the brain.
5. INTERACTION:
    - Don't be a robot. Be a person.
    - Ratio: Make 4 statements for every 1 question.
    - NEVER end a message with "What about you?" or "How are you?" unless absolutely necessary.
6. FORMAT: Keep answers short, like a text message (unless the user writes long paragraphs).

Here is your "Digital Brain" (Your life story):
`;

        // Group by type
        const bios = memories.filter((m: any) => m.type === 'BIOGRAPHY').map((m: any) => m.content).join(" ");
        const qa = memories.filter((m: any) => m.type === 'QUESTION').map((m: any) => `Q: ${m.prompt}\nA: ${m.content}`).join("\n\n");
        const thoughts = memories.filter((m: any) => m.type === 'FREE_TEXT').map((m: any) => `- ${m.content}`).join("\n");
        const learned = memories.filter((m: any) => m.type === 'LEARNED_FROM_GUEST').map((m: any) => `- ${m.content}`).join("\n");

        context += `## Brain Dump (My Philosophy & Way of Thinking)\n${(profile as any).philosophy || "No specific philosophy provided."}\n\n`;
        context += `## Core Biography\n${bios}\n\n`;
        context += `## Learned Q&A (Your truths)\n${qa}\n\n`;
        context += `## Inner Thoughts\n${thoughts}\n\n`;
        context += `## Things friends have reminded you about (Your forgotten memories)\n${learned}\n`;

        // Update the Profile with this new synthesized brain
        await this.updateProfile(profile!.userId, { aiContext: context });

        return context;
    }
}

export const db = new Database();
