const express = require('express');
const prisma = require('../../prismaClient');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('./adminMiddleware');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const competitions = await prisma.$queryRaw`
            SELECT * FROM competitions 
            ORDER BY 
              CASE WHEN status = 'live' THEN 1 
                   WHEN status = 'ongoing' THEN 2 
                   ELSE 3 END, 
              start_date ASC
        `;
        res.json(competitions);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching competitions' });
    }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const data = req.body;

        const formattedData = {
            title: data.title,
            description: data.description,
            status: data.status,
            icon: data.icon,
            color: data.color,
            level_required: parseInt(data.level_required) || 1,
            time_limit: parseInt(data.time_limit) || 60,
            max_points: parseInt(data.max_points) || 500,
            start_date: data.start_date ? new Date(data.start_date) : null,
            end_date: data.end_date ? new Date(data.end_date) : null,
            questions: data.questions || [],
            coding_problems: data.coding_problems || []
        };

        const result = await prisma.competition.create({ 
            data: formattedData 
        });
        
        res.json(result);
    } catch (err) {
        console.error("Error adding competition:", err.message);
        res.status(500).json({ error: 'Server error adding competition' });
    }
});

module.exports = router;