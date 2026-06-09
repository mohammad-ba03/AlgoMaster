const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const verifyToken = async (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access Denied' });

    try {

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        const userCheck = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { is_suspended: true }
        });

        if (!userCheck) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (userCheck.is_suspended) {
            return res.status(403).json({ error: 'Your account is suspended.' });
        }

        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid Token' });
    }
};

module.exports = verifyToken;