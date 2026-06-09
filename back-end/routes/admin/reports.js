const express = require('express');
const prisma = require('../../prismaClient');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('./adminMiddleware');
const router = express.Router();

router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const allAlgos = await prisma.$queryRaw`
            SELECT 
                COALESCE(a.algo_id, p.algo_id) AS algo_id, 
                COALESCE(a.title, p.algo_id) AS title, 
                CAST(COUNT(p.id) FILTER (WHERE p.is_completed = true) AS INTEGER) AS completion_count,
                CAST(COALESCE(ROUND(AVG(p.time_spent) FILTER (WHERE p.is_completed = true), 2), 0) AS FLOAT) AS avg_time
            FROM public.user_progress p
            FULL OUTER JOIN public.algorithms a ON p.algo_id = a.algo_id
            GROUP BY COALESCE(a.algo_id, p.algo_id), COALESCE(a.title, p.algo_id)
            ORDER BY avg_time DESC
        `;

        const globalAvg = await prisma.userProgress.aggregate({
            _avg: { time_spent: true },
            where: { is_completed: true }
        });

        const activeCompetitionsCount = await prisma.competition.count({
            where: { status: { in: ['live', 'ongoing'] } }
        });

        const totalEnrollments = await prisma.competition.aggregate({
            _sum: { enrolled_count: true }
        });

        const hardestAlgo = allAlgos.length > 0 && allAlgos[0].avg_time > 0 ? allAlgos[0] : { title: 'N/A', avg_time: 0 };
        
        res.json({
            success: true,
            analytics: {
                hardestAlgoName: hardestAlgo.title,
                avgExecutionTime: globalAvg._avg.time_spent ? parseFloat(globalAvg._avg.time_spent.toFixed(2)) : 0,
                activeCompetitionsCount,
                totalEnrollments: totalEnrollments._sum.enrolled_count || 0,
                comprehensiveReport: allAlgos
            }
        });
    } catch (err) {
        console.error("Error generating integrated analytics:", err.message);
        res.status(500).json({ error: 'Server error fetching analytics.' });
    }
});

module.exports = router;