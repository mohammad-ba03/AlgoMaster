const express = require('express');
const router = express.Router();

// استيراد جميع الملفات
const dashboardRoutes = require('./dashboard');
const usersRoutes = require('./users');
const algorithmsRoutes = require('./algorithms');
const competitionsRoutes = require('./competitions');
const reportsRoutes = require('./reports');
const submissionsRoutes = require('./submissions');

// ربط المسارات 

router.use('/dashboard-data', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/algorithms', algorithmsRoutes);
router.use('/competitions', competitionsRoutes);
router.use('/analytics-reports', reportsRoutes);
router.use('/submissions', submissionsRoutes);

module.exports = router;