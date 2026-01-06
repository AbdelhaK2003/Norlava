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

export default router;
