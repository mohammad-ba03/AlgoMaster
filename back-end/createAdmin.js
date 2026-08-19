require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./prismaClient');

async function createSuperAdmin() {
    const fullName = 'System Administrator';
    const email = 'master@admin.com'; 
    const password = '123456789'; 
    // =======================================

    try {
        console.log('⏳ جاري التحقق من قاعدة البيانات...');

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            console.log(`❌ فشل: حساب المدير (${email}) موجود بالفعل.`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        await pool.query(
            'INSERT INTO users (full_name, email, password_hash, current_level) VALUES ($1, $2, $3, $4)',
            [fullName, email, passwordHash, 99]
        );

        console.log('✅ تم إنشاء حساب المدير بنجاح!');
        console.log(`✉️ الإيميل: ${email}`);
        console.log(`🔑 كلمة المرور: ${password}`);

    } catch (err) {
        console.error('❌ حدث خطأ:', err.message);
    } finally {
        pool.end();
    }
}

createSuperAdmin();