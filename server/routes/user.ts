import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db, prisma } from '../db';

const router = Router();

// Initial Onboarding (Create Profile)
router.post('/onboarding', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { interests, personality, funFacts, bio, writingStyle, philosophy } = req.body;

        // Parse personality to construct AI Context
        let aiContext = "";
        try {
            const pData = JSON.parse(personality);
            aiContext = `
You are ${pData.nickname || "an AI assistant"}. ${pData.tagline ? `Your tagline is: "${pData.tagline}".` : ""}

About you:
${bio ? `Bio: ${bio}` : ""}
${philosophy ? `Your Philosophy/Brain Dump: "${philosophy}"` : ""}

Your personality traits:
- Formality: ${pData.formalityLevel}
- Humor: ${pData.humorStyle}
- Response Length: ${pData.responseLength}

Your Expertise: ${interests}
Your Hobbies: ${funFacts}

${writingStyle ? `Here's a sample of your writing style (copy this style in your responses):\n"${writingStyle}"` : ""}

Instructions:
Respond to visitors using this persona. Stay in character.
If a visitor asks about something you don't know about the person you represent, respond with something like: "I'm still learning more about that! The ${pData.nickname} I represent hasn't shared those details with me yet, but once they do, I'll let you know!"
`.trim();
        } catch (e) {
            console.error("Error parsing personality for AI context", e);
            aiContext = `You are a helpful AI assistant with interests in: ${interests}.`;
        }

        const profile = await db.createProfile({
            userId: req.user!.id,
            interests,
            personality,
            funFacts,
            aiContext, // Save the "Brain"
            bio: bio || "", // Save bio
            writingStyle: writingStyle || "", // Save writing style
            philosophy: philosophy || "" // Save Brain Dump
        });

        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// Save Avatar Config
router.post('/avatar', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { gender, baseColor, eyeColor } = req.body;
        const userId = req.user!.id;

        const profile = await db.findProfileByUserId(userId);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found. Complete onboarding first.' });
        }

        const avatar = await db.upsertAvatar(profile.id, { gender, baseColor, eyeColor });
        res.json(avatar);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save avatar' });
    }
});

// Public Profile Fetch by Username
router.get('/username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const userData = await db.findUserByUsername(username);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return safe public data (excluding password)
        res.json({
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});


// Get My Profile (Protected)
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const userData = await db.getUserWithProfile(userId);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Exclude password from response
        const { password, ...safeUser } = userData;
        res.json(safeUser);
    } catch (e) {
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// Get Dashboard Stats (Protected)
router.get('/dashboard-stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        console.log("🔍 Stats request for user ID:", userId);

        // Debug: Check if any messages exist at all
        const sample = await prisma.message.findMany({ take: 5 });
        console.log("🔍 DB Sample Messages:", JSON.stringify(sample.map(m => ({ id: m.id, hostId: m.hostId })), null, 2));

        const stats = await db.getDashboardStats(userId);
        res.json(stats);
    } catch (error: any) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
            error: 'Failed to fetch dashboard stats',
            details: error?.message || String(error),
            stack: process.env.NODE_ENV === 'production' ? error?.stack : undefined
        });
    }
});

// Memory Management

// Get Pending Memories (Facts to review & Questions to answer)
router.get('/memories/pending', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const profile = await db.findProfileByUserId(userId);

        if (!profile) return res.json({ facts: [], questions: [] });

        const memories = await db.getMemories(profile.id);

        const facts = memories.filter((m: any) => m.type === 'LEARNED_FROM_GUEST');
        const questions = memories.filter((m: any) => m.type === 'GUEST_QUESTION');

        res.json({ facts, questions });
    } catch (error: any) {
        res.status(500).json({
            error: 'Failed to fetch memories',
            details: error?.message || String(error),
            stack: process.env.NODE_ENV === 'production' ? error?.stack : undefined
        });
    }
});

// Approve/Update Memory
// For Facts: Only ID needed (confirms it).
// For Questions: ID + Answer needed (converts to QUESTION type).
router.post('/memories/:id/approve', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body; // Only for questions

        // We need to fetch the memory first to know its type
        // Prisma limitation in our db class abstract, but we can just use prisma directly here or add a helper
        // For speed, let's assume we can update it directly based on provided data.

        if (answer) {
            // We want to change type to 'QUESTION' and content to 'answer'
            await prisma.memory.update({
                where: { id },
                data: {
                    type: 'QUESTION',
                    content: answer
                }
            });
        } else {
            // It was a fact, just keep it. 
            // Actually, 'LEARNED_FROM_GUEST' is already saved in DB. 
            // "Approving" might just mean changing type to 'BIOGRAPHY' so it shows as a core fact?
            // Or we just leave it. Let's change it to 'BIOGRAPHY' to make it "Official".
            await prisma.memory.update({
                where: { id },
                data: {
                    type: 'BIOGRAPHY'
                }
            });
        }

        // Refresh AI Context
        const userId = req.user!.id;
        const profile = await db.findProfileByUserId(userId);
        if (profile) await db.refreshAiContext(profile.id);

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to approve memory' });
    }
});

// Delete Memory (Reject fact or Ignore question)
router.delete('/memories/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        await db.deleteMemory(id);

        // Refresh AI Context? (Only if it was a fact involved in context)
        // Questions (GUEST_QUESTION) aren't in context yet, so no need.
        // But if we delete a fact, we should refresh.
        const userId = req.user!.id;
        const profile = await db.findProfileByUserId(userId);
        if (profile) await db.refreshAiContext(profile.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete memory' });
    }
});

// Public Profile Fetch by User ID
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = await db.getUserWithProfile(userId);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return safe public data (excluding password)
        res.json({
            firstName: userData.firstName,
            lastName: userData.lastName,
            profile: userData.profile
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get conversation history for a visitor
router.get('/messages/:username/:visitorId', async (req, res) => {
    try {
        const { username, visitorId } = req.params;

        // Find host user by username
        const hostUser = await db.findUserByUsername(username);
        if (!hostUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch messages for this visitor
        const messages = await db.getMessagesForVisitor(hostUser.id, visitorId);

        // Transform to match frontend format
        const formattedMessages = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.isUser,
            senderId: msg.senderId
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

export default router;
