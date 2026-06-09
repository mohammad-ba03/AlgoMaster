const express = require('express');
const prisma = require('../prismaClient');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.post('/enroll', verifyToken, async (req, res) => {
    const { competitionId } = req.body;
    const userId = req.user.id;

    try {
        const existing = await prisma.studentSubmission.findFirst({
            where: { user_id: userId, competition_id: parseInt(competitionId) }
        });

        if (existing) {
            if (existing.status !== 'started') return res.status(403).json({ error: 'لا يمكنك الدخول مجدداً.' });
            return res.json({ message: 'Welcome back to the Arena.' });
        }

        await prisma.studentSubmission.create({
            data: { user_id: userId, algo_id: `Comp_#${competitionId}`, competition_id: parseInt(competitionId), submitted_code: '', execution_time: 0, status: 'started' }
        });

        await prisma.competition.update({
            where: { id: parseInt(competitionId) },
            data: { enrolled_count: { increment: 1 } }
        });

        res.json({ message: 'تم التسجيل في المسابقة.' });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل.' });
    }
});

router.get('/user', verifyToken, async (req, res) => {
    try {
        const submissions = await prisma.studentSubmission.findMany({
            where: { user_id: req.user.id },
            select: { id: true, competition_id: true, algo_id: true, status: true, submitted_at: true }
        });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    const { algoId, competitionId, submittedCode, executionTime } = req.body;
    const userId = req.user.id;

    try {
        if (competitionId) {
            const existing = await prisma.studentSubmission.findFirst({
                where: { user_id: userId, competition_id: parseInt(competitionId) }
            });

            if (existing) {
                const updated = await prisma.studentSubmission.update({
                    where: { id: existing.id },
                    data: { submitted_code: submittedCode, execution_time: executionTime || 0, status: 'pending', submitted_at: new Date() }
                });
                return res.json({ success: true, message: 'تم الرفع بنجاح.', submission: updated });
            }
        } else {
            const submission = await prisma.studentSubmission.create({
                data: { user_id: userId, algo_id: algoId, submitted_code: submittedCode, execution_time: executionTime || 0, status: 'pending' }
            });
            return res.status(201).json({ success: true, message: 'تم الرفع بنجاح.', submission });
        }
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء الإرسال.' });
    }
});

module.exports = router;