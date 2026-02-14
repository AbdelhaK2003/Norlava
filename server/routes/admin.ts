import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db, prisma } from '../db';

const router = Router();

// Middleware to check if user is admin
const isAdmin = async (req: AuthRequest, res: any, next: any) => {
    try {
        const userEmail = (req.user?.email || '').trim().toLowerCase();
        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

        console.log(`👮 Admin Check: User [${userEmail}] vs Admin [${adminEmail}]`);

        if (!adminEmail || userEmail !== adminEmail) {
            console.log("❌ Admin Access Denied");
            return res.status(403).json({
                error: `Access Denied. Logged in: '${userEmail}'. Server expects: '${adminEmail}' (Check Railway Variable for typo/spaces)`
            });
        }
        console.log("✅ Admin Access Granted");
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

router.get('/statistics', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
    try {
        // 1. Total Stats
        const totalUsers = await prisma.user.count();
        const totalMessages = await prisma.message.count();
        const totalProfiles = await prisma.profile.count();

        // 2. Messages per day (Last 30 days)
        // Group by date - Prisma doesn't support easy date grouping in all DBs, 
        // using raw query for better performance or simple JS mapping for compatibility

        // Let's fetch last 30 days messages and group in JS to be safe across DB types
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

        const messagesByDay: Record<string, number> = {};
        recentMessages.forEach(msg => {
            const date = msg.createdAt.toISOString().split('T')[0];
            messagesByDay[date] = (messagesByDay[date] || 0) + 1;
        });

        // Fill in missing days
        const activityData = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            activityData.push({
                date: dateStr,
                count: messagesByDay[dateStr] || 0
            });
        }

        res.json({
            overview: {
                users: totalUsers,
                messages: totalMessages,
                profiles: totalProfiles
            },
            activity: activityData.reverse() // Oldest first for graph
        });

    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
});

export default router;
