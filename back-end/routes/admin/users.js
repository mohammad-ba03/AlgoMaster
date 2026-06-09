const express = require('express');
const prisma = require('../../prismaClient');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('./adminMiddleware');
const router = express.Router();

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await prisma.user.deleteMany({
            where: { id: parseInt(req.params.id), email: { not: { endsWith: '@admin.com' } } }
        });
        
        if (result.count === 0) return res.status(404).json({ error: 'المستخدم غير موجود أو لا يمكن حذفه.' });
        res.json({ message: 'تم حذف المستخدم بنجاح.' });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء محاولة الحذف.' });
    }
});

router.get('/:id/progress', verifyToken, isAdmin, async (req, res) => {
    try {
        const progress = await prisma.userProgress.findMany({
            where: { user_id: parseInt(req.params.id) },
            orderBy: { id: 'desc' }
        });
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching progress' });
    }
});

router.put('/:id/toggle-ban', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { is_suspended: !user.is_suspended }
        });

        res.json({ message: updatedUser.is_suspended ? 'Account Suspended' : 'Suspension Lifted', is_suspended: updatedUser.is_suspended });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;