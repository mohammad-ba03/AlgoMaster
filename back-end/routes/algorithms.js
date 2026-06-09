const express = require('express');
const prisma = require('../prismaClient');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const algorithms = await prisma.algorithm.findMany({
            select: { id: true, level: true, algo_id: true, title: true, description: true, icon: true, visual_pattern: true },
            orderBy: { id: 'asc' }
        });
        res.json(algorithms);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching algorithms' });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const algorithm = await prisma.algorithm.findUnique({
            where: { algo_id: req.params.id }
        });
        if (!algorithm) return res.status(404).json({ error: 'Algorithm not found' });
        res.json(algorithm);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;