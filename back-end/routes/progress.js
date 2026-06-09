const express = require('express');
const prisma = require('../prismaClient');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

const progressionPath = [
    ['level_1', 'linear_search'], ['level_1', 'find_max'], ['level_1', 'array_reverse'], ['level_1', 'bubble_sort'], ['level_1', 'selection_sort'],
    ['level_2', 'binary_search'], ['level_2', 'valid_parens'], ['level_2', 'simple_queue'], ['level_2', 'insertion_sort'], ['level_2', 'recursion_basic'],
    ['level_3', 'merge_sort'], ['level_3', 'quick_sort'], ['level_3', 'linked_list'], ['level_3', 'bfs_graph'], ['level_3', 'dfs_graph'],
];

router.get('/', verifyToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { total_points: true } });
        const progress = await prisma.userProgress.findMany({
            where: { user_id: req.user.id },
            select: { level_id: true, algo_id: true, status: true, is_completed: true }
        });
        res.json({ totalPoints: user.total_points, progress });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/update', verifyToken, async (req, res) => {
    const { levelId, algoId, pointsEarned, timeSpent = 0, hintsUsed = 0 } = req.body;
    const levelNumber = parseInt(levelId.split('_')[1]);
    const userId = req.user.id;
    const parsedPointsEarned = parseInt(pointsEarned) || 0;
    const parsedHintsUsed = parseInt(hintsUsed) || 0;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            const newPoints = user.total_points + parsedPointsEarned;
            let earnedHelpPoints = 0;
            
            [100, 200, 500, 1000, 1900, 2200, 2250, 2300].forEach(m => {
                if (user.total_points < m && newPoints >= m) earnedHelpPoints++;
            });

            const finalHelpPoints = Math.max(0, user.help_points - parsedHintsUsed + earnedHelpPoints);

            await tx.user.update({
                where: { id: userId },
                data: {
                    total_points: { increment: parsedPointsEarned },
                    solved_count: { increment: 1 },
                    current_level: Math.max(user.current_level, levelNumber),
                    help_points: finalHelpPoints
                }
            });

            await tx.userProgress.upsert({
                where: { user_id_level_id_algo_id: { user_id: userId, level_id: levelId, algo_id: algoId } },
                update: { status: 'completed', is_completed: true, time_spent: timeSpent },
                create: { user_id: userId, level_id: levelId, algo_id: algoId, status: 'completed', is_completed: true, time_spent: timeSpent }
            });

            let currentIndex = progressionPath.findIndex(p => p[0] === levelId && p[1] === algoId);
            let nextUnlocked = null;

            if (currentIndex !== -1 && currentIndex + 1 < progressionPath.length) {
                let [nextLevel, nextAlgo] = progressionPath[currentIndex + 1];
                nextUnlocked = nextAlgo;

                const existingProgress = await tx.userProgress.findUnique({
                    where: { user_id_level_id_algo_id: { user_id: userId, level_id: nextLevel, algo_id: nextAlgo } }
                });

                if (!existingProgress) {
                    await tx.userProgress.create({
                        data: { user_id: userId, level_id: nextLevel, algo_id: nextAlgo, status: 'unlocked' }
                    });
                }
            }

            return { nextUnlocked, earnedHelpPoints, finalHelpPoints };
        });

        res.json({ 
            message: 'Progress updated', 
            unlockedNext: result.nextUnlocked,
            helpPointsAwarded: result.earnedHelpPoints,
            finalHelpPoints: result.finalHelpPoints
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during update' });
    }
});

module.exports = router;