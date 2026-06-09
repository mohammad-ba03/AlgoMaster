const express = require('express');
const prisma = require('../../prismaClient');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('./adminMiddleware');
const router = express.Router();

router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const studentsCount = await prisma.user.count({
            where: { email: { not: { endsWith: '@admin.com' } } }
        });
        
        const studentsList = await prisma.user.findMany({
            where: { email: { not: { endsWith: '@admin.com' } } },
            select: { id: true, full_name: true, email: true, total_points: true, current_level: true, help_points: true, solved_count: true, created_at: true, last_active: true, is_suspended: true },
            orderBy: { total_points: 'desc' }
        });

        res.json({ totalStudents: studentsCount, students: studentsList });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;