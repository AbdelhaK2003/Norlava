import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db, prisma } from '../db';

const router = Router();

// Middleware to check if user is admin
const isAdmin = async (req: AuthRequest, res: any, next: any) => {
    try {
        const userEmail = (req.user?.email || '').trim().toLowerCase();
        // Use environment variable OR hardcoded fallback for immediate access
        const adminEmail = (process.env.ADMIN_EMAIL || 'abdelhakmahfoud2003@gmail.com').trim().toLowerCase();

        if (!adminEmail || userEmail !== adminEmail) {
            console.log(`❌ Admin Access Denied: ${userEmail}`);
            return res.status(403).json({
                error: `Access Denied. You are logged in as: ${req.user?.email || 'Unknown'}. Expected Admin.`
            });
        }
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

        // 3. User Growth (Users joined by month)
        const allUsers = await prisma.user.findMany({
            select: { createdAt: true }
        });

        const usersByMonth: Record<string, number> = {};
        allUsers.forEach(user => {
            const date = new Date(user.createdAt);
            const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
        });

        const userGrowthData = Object.entries(usersByMonth).map(([month, count]) => ({
            month,
            count
        }));

        // Sort by date roughly (this is simple, for production might need better sorting)
        // For now, let's just reverse if needed or trust insertion order if created chronologically
        // A better way is to generate the last 6 months keys and fill them.

        // 4. Top Profiles (Most Messages)
        // detailed groupBy is not always easy with Prisma + Relations, so we do it in two steps
        const topHostIds = await prisma.message.groupBy({
            by: ['hostId'],
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 5
        });

        const topProfiles = [];
        for (const item of topHostIds) {
            const user = await prisma.user.findUnique({
                where: { id: item.hostId },
                select: { username: true, firstName: true }
            });
            if (user) {
                topProfiles.push({
                    username: user.username,
                    name: user.firstName,
                    messageCount: item._count.id
                });
            }
        }

        res.json({
            overview: {
                users: totalUsers,
                messages: totalMessages,
                profiles: totalProfiles
            },
            activity: activityData.reverse(), // Oldest first for graph
            userGrowth: userGrowthData,
            topProfiles: topProfiles
        });

    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
});

export default router;
