const express = require('express');
const prisma = require('../../prismaClient');
const verifyToken = require('../../middleware/verifyToken');
const isAdmin = require('./adminMiddleware');
const router = express.Router();

router.post('/', verifyToken, isAdmin, async (req, res) => {
    const payload = req.body;
    try {
        await prisma.algorithm.upsert({
            where: { algo_id: payload.algo_id },
            update: { title: payload.title, description: payload.description, icon: payload.icon, visual_pattern: payload.visual_pattern, payload: payload },
            create: { level: payload.level, algo_id: payload.algo_id, title: payload.title, description: payload.description, icon: payload.icon, visual_pattern: payload.visual_pattern, payload: payload }
        });
        res.json({ message: 'تم حفظ الخوارزمية بنجاح!' });
    } catch (err) {
        res.status(500).json({ error: 'حدث خطأ أثناء حفظ الخوارزمية.' });
    }
});

// ملاحظة: في ملفك الأصلي، هذا المسار لم يكن يحتوي على verifyToken أو isAdmin
router.delete('/:algo_id', async (req, res) => {
    try {
        const deletedAlgo = await prisma.algorithm.delete({
            where: { algo_id: req.params.algo_id }
        });
        res.status(200).json({ message: 'Algorithm deleted successfully!', deletedAlgo });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error while deleting algorithm.' });
    }
});

module.exports = router;