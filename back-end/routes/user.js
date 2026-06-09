const express = require('express');
const prisma = require('../prismaClient');
const verifyToken = require('../middleware/verifyToken');
const bcrypt = require('bcrypt');
const router = express.Router();

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, full_name: true, email: true, total_points: true, current_level: true, solved_count: true, created_at: true, help_points: true, profile_image: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/update', verifyToken, async (req, res) => {
    const { full_name, email, profile_image } = req.body;
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { full_name, email, profile_image }
        });
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

router.put('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
        }

        const newHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password_hash: newHash }
        });
        res.json({ message: 'تم التغيير بنجاح.' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ في الخادم.' });
    }
});

router.post('/ping', verifyToken, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { last_active: new Date() }
        });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;