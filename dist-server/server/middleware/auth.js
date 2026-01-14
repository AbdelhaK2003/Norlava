import jwt from 'jsonwebtoken';
// Handle ESM/CommonJS default export mismatch
// @ts-ignore
const jwtVerify = jwt.verify || (jwt.default && jwt.default.verify) || jwt;
export const SECRET_KEY = process.env.JWT_SECRET || 'voxterna-secret-key';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    jwtVerify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
