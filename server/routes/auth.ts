import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// Register
router.post('/register', async (req, res) => {
    console.log("👉 Register endpoint hit!");
    console.log("Received body:", req.body);
    try {
        const { email, password, firstName, lastName, birthday } = req.body;

        console.log("Checking if user exists...");
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            console.log("❌ User already exists:", email);
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const username = `${firstName.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`;

        console.log("Creating new user...");
        const user = await db.createUser({
            email,
            username,
            password: hashedPassword,
            firstName,
            lastName,
            birthday: birthday ? new Date(birthday).toISOString() : undefined
        });
        console.log("✅ User created successfully:", user.id);

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error("🔥 Error in register route:", error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.findUserByEmail(email);

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log("👉 Forgot Password request for:", email);

        const user = await db.findUserByEmail(email);
        if (!user) {
            // Security: Don't reveal if user exists
            console.log("❌ User not found, modifying response to mimic success.");
            return res.json({ message: 'If an account exists, a code has been sent.' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Save to DB
        await db.setResetCode(email, code, expires);

        // Send Email
        const emailResult = await sendEmail({
            to: email,
            subject: 'Your Norlava Reset Code',
            html: `<p>Your password reset code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`
        });

        if (!emailResult.success) {
            console.error("❌ Failed to send email:", emailResult.error);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        console.log("✅ Reset code sent via email.");
        res.json({ message: 'Reset code sent' });
    } catch (error) {
        console.error("🔥 Error in forgot-password:", error);
        res.status(500).json({ error: 'Internal error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        console.log("👉 Reset Password request for:", email);

        const user = await db.getResetData(email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Check if locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
            console.log("🔒 Account locked until:", user.lockedUntil);
            return res.status(429).json({ error: 'Too many attempts. Try again later.' });
        }

        // Check code
        if (!user.resetCode || user.resetCode !== code) {
            console.log("❌ Invalid code provided.");
            await db.incrementResetAttempts(email, (user.failedResetAttempts || 0) >= 2);
            return res.status(400).json({ error: 'Invalid code' });
        }

        // Check expiration
        if (!user.resetCodeExpires || new Date() > user.resetCodeExpires) {
            console.log("❌ Code expired.");
            return res.status(400).json({ error: 'Code expired' });
        }

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.updatePassword(email, hashedPassword);

        console.log("✅ Password reset successfully.");
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error("🔥 Error in reset-password:", error);
        res.status(500).json({ error: 'Reset failed' });
    }
});

export default router;
