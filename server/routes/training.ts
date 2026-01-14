import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all memories for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const profile = await db.findProfileByUserId(userId);

        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const memories = await db.getMemories(profile.id);
        res.json(memories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
});

// Add a new memory (Answer a question, add a thought)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { type, prompt, content } = req.body;

        const profile = await db.findProfileByUserId(userId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const memory = await db.createMemory({
            profileId: profile.id,
            type,     // 'QUESTION', 'FREE_TEXT', etc.
            prompt,   // The question asked
            content   // The user's answer
        });
 
        // Auto-update the "Brain" context
        await db.refreshAiContext(profile.id); 

        res.json(memory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save memory' });
    }
});

// Delete a memory
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await db.deleteMemory(req.params.id);

        // Ideally we should refresh context here too, but skipping for speed
        const userId = (req as any).user.id;
        const profile = await db.findProfileByUserId(userId);
        if (profile) await db.refreshAiContext(profile.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete memory' });
    }
});

export default router;
