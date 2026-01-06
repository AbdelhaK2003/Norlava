import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db, prisma } from '../db';

const router = Router();

// Initial Onboarding (Create Profile)
router.post('/onboarding', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { interests, personality, funFacts } = req.body;

        // Parse personality to construct AI Context
        let aiContext = "";
        try {
            const pData = JSON.parse(personality);
            aiContext = `
You are ${pData.nickname || "an AI assistant"}. ${pData.tagline ? `Your tagline is: "${pData.tagline}".` : ""}
Your personality traits:
- Formality: ${pData.formalityLevel}
- Humor: ${pData.humorStyle}
- Response Length: ${pData.responseLength}

Your Expertise: ${interests}
Your Hobbies: ${funFacts}

Here are some examples of how you speak (Q&A pairs):
${pData.sampleQA ? pData.sampleQA.map((qa: any) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n") : "No samples provided."}

Instructions:
Respond to visitors using this persona. Stay in character.
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
            aiContext // Save the "Brain"
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
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        console.log("🔍 Stats request for user ID:", userId);

        // Debug: Check if any messages exist at all
        const sample = await prisma.message.findMany({ take: 5 });
        console.log("🔍 DB Sample Messages:", JSON.stringify(sample.map(m => ({ id: m.id, hostId: m.hostId })), null, 2));

        const stats = await db.getDashboardStats(userId);
        res.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch memories' });
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

export default router;
