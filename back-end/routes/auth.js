const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const prisma = require('../prismaClient');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) return res.status(400).json({ error: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const newUser = await prisma.user.create({
            data: { full_name: fullName, email, password_hash: passwordHash },
            select: { id: true, full_name: true, email: true }
        });
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        if (user.is_suspended) return res.status(403).json({ message: 'Account suspended.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        
        await prisma.user.update({
            where: { id: user.id },
            data: { last_active: new Date() }
        });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Logged in successfully', token, user: { id: user.id, name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'البريد الإلكتروني غير مسجل.' });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryDate = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.user.update({
            where: { email },
            data: { reset_code: resetCode, reset_code_expiry: expiryDate }
        });

        const mailOptions = {
            from: `"AlgoMaster" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset',
            html: `<h1>${resetCode}</h1>`
        };
        await transporter.sendMail(mailOptions);
        res.json({ message: 'تم الإرسال.' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء الإرسال.' });
    }
});

router.post('/verify-reset-code', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.reset_code !== code) return res.status(400).json({ error: 'Incorrect code!' });
        if (new Date() > new Date(user.reset_code_expiry)) return res.status(400).json({ error: 'انتهت الصلاحية.' });

        res.json({ message: 'الكود صحيح' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.reset_code !== code || new Date() > new Date(user.reset_code_expiry)) {
            return res.status(400).json({ error: 'طلب غير صالح.' });
        }
        
        const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        await prisma.user.update({
            where: { email },
            data: { password_hash: passwordHash, reset_code: null, reset_code_expiry: null }
        });

        res.json({ message: 'تم التغيير بنجاح!' });
    } catch (err) {
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

router.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;
    if (!email.endsWith('@admin.com')) return res.status(403).json({ error: 'غير مصرح.' });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(400).json({ error: 'بيانات غير صحيحة.' });

        const token = jwt.sign({ id: user.id, email: user.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Welcome Admin', token, user: { name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;