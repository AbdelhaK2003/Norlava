import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../db';
const router = Router();
// Get pending facts for approval
router.get('/pending-facts', authenticateToken, async (req, res) => {
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: req.user.id }
        });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const pendingFacts = profile.pendingFacts ? JSON.parse(profile.pendingFacts) : [];
        res.json(pendingFacts);
    }
    catch (error) {
        console.error('Failed to fetch pending facts:', error);
        res.status(500).json({ error: 'Failed to fetch pending facts' });
    }
});
// Get statistics
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: req.user.id }
        });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        // Count messages for this profile
        const messageCount = await prisma.message.count({
            where: { hostId: req.user.id }
        });
        // Count unique visitors
        const uniqueVisitors = await prisma.message.findMany({
            where: { hostId: req.user.id },
            select: { visitorId: true },
            distinct: ['visitorId']
        });
        // Count learned facts
        const learnedFacts = profile.learnedFacts ? JSON.parse(profile.learnedFacts).length : 0;
        // Count pending facts
        const pendingFacts = profile.pendingFacts ? JSON.parse(profile.pendingFacts).length : 0;
        res.json({
            totalMessages: messageCount,
            uniqueVisitors: uniqueVisitors.length,
            learnedFacts,
            pendingFacts,
            conversationsTrained: learnedFacts
        });
    }
    catch (error) {
        console.error('Failed to fetch statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
// Approve a pending fact (move to learned)
router.post('/approve-fact', authenticateToken, async (req, res) => {
    try {
        const { factIndex } = req.body;
        const profile = await prisma.profile.findUnique({
            where: { userId: req.user.id }
        });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const pendingFacts = profile.pendingFacts ? JSON.parse(profile.pendingFacts) : [];
        const learnedFacts = profile.learnedFacts ? JSON.parse(profile.learnedFacts) : [];
        if (factIndex < 0 || factIndex >= pendingFacts.length) {
            return res.status(400).json({ error: 'Invalid fact index' });
        }
        // Move fact from pending to learned
        const approvedFact = pendingFacts.splice(factIndex, 1)[0];
        learnedFacts.push(approvedFact);
        // Build updated AI context with learned facts
        let updatedAiContext = profile.aiContext || '';
        // Append learned facts section to AI context if it doesn't exist
        if (!updatedAiContext.includes('FACTS I\'VE LEARNED:')) {
            updatedAiContext += `\n\nFACTS I'VE LEARNED FROM VISITORS:\n${learnedFacts.map((fact) => `• ${fact}`).join('\n')}`;
        }
        else {
            // Update the learned facts section
            updatedAiContext = updatedAiContext.replace(/FACTS I'VE LEARNED FROM VISITORS:[\s\S]*?(?=\n\n|$)/, `FACTS I'VE LEARNED FROM VISITORS:\n${learnedFacts.map((fact) => `• ${fact}`).join('\n')}`);
        }
        // Update profile with new facts and context
        await prisma.profile.update({
            where: { userId: req.user.id },
            data: {
                pendingFacts: JSON.stringify(pendingFacts),
                learnedFacts: JSON.stringify(learnedFacts),
                aiContext: updatedAiContext
            }
        });
        console.log(`✅ Fact approved and added to AI context: "${approvedFact}"`);
        res.json({ success: true, pendingFacts, learnedFacts });
    }
    catch (error) {
        console.error('Failed to approve fact:', error);
        res.status(500).json({ error: 'Failed to approve fact' });
    }
});
// Reject a pending fact (delete)
router.post('/reject-fact', authenticateToken, async (req, res) => {
    try {
        const { factIndex } = req.body;
        const profile = await prisma.profile.findUnique({
            where: { userId: req.user.id }
        });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        const pendingFacts = profile.pendingFacts ? JSON.parse(profile.pendingFacts) : [];
        if (factIndex < 0 || factIndex >= pendingFacts.length) {
            return res.status(400).json({ error: 'Invalid fact index' });
        }
        // Remove fact from pending
        pendingFacts.splice(factIndex, 1);
        // Update profile
        await prisma.profile.update({
            where: { userId: req.user.id },
            data: {
                pendingFacts: JSON.stringify(pendingFacts)
            }
        });
        res.json({ success: true, pendingFacts });
    }
    catch (error) {
        console.error('Failed to reject fact:', error);
        res.status(500).json({ error: 'Failed to reject fact' });
    }
});
export default router;
