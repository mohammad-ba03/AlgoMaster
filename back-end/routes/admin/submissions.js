const express = require('express');
const prisma = require('../../prismaClient');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('./adminMiddleware');
const router = express.Router();

router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const submissions = await prisma.studentSubmission.findMany({
            include: { user: { select: { full_name: true, email: true } } },
            orderBy: { submitted_at: 'desc' }
        });
        
        const formattedSubmissions = submissions.map(s => ({
            ...s, student_name: s.user.full_name, student_email: s.user.email
        }));
        res.json(formattedSubmissions);
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ في الخادم أثناء جلب الحلول المرسلة.' });
    }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    const { status, admin_feedback } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'حالة التقييم غير صالحة.' });

    try {
        const submission = await prisma.studentSubmission.update({
            where: { id: parseInt(req.params.id) },
            data: { status, admin_feedback }
        });
        res.json({ message: 'تم تسجيل التقييم.', submission });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث التقييم.' });
    }
});

module.exports = router;