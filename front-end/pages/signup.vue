<script setup>
import { ref, Text } from 'vue'

const fullName = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  errorMessage.value = '' // تفريغ رسالة الخطأ السابقة
  successMessage.value = '' // تفريغ رسالة النجاح السابقة
  isLoading.value = true

  try {
    // إرسال الطلب إلى الباك إند (Express)
    const response = await $fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      body: {
        fullName: fullName.value,
        email: email.value,
        password: password.value
      }
    });

    // إذا تم النجاح
    successMessage.value = response.message || 'تم إنشاء الحساب بنجاح! سيتم تحويلك لصفحة تسجيل الدخول...';
    
    // تفريغ المدخلات
    fullName.value = ''
    email.value = ''
    password.value = ''

    // تحويل المستخدم لصفحة تسجيل الدخول بعد 2 ثانية
    setTimeout(() => {
      navigateTo('/login');
    }, 2000);

  } catch (error) {
    // التعامل مع الأخطاء القادمة من الباك إند
    if (error.data && error.data.error) {
      errorMessage.value = error.data.error; // مثال: "Email already exists"
    } else {
      errorMessage.value = 'حدث خطأ غير متوقع أثناء إنشاء الحساب. حاول مرة أخرى.';
    }
  } finally {
    isLoading.value = false; // إعادة تفعيل زر الإرسال
  }
}
</script>
<style>

/* تعديل خاص لجسم الصفحة لإزالة التمرير إذا لم يكن ضرورياً */
.auth-body {
    min-height: 100vh;
    display: flex;
}

.auth-container.split-screen {
    display: flex;
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
}

/* --- Left Side: Form --- */
.auth-form-side {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: var(--bg-body);
    position: relative;
    z-index: 2;
}

.auth-content-wrapper {
    width: 100%;
    max-width: 440px;
}

.auth-logo {
    display: inline-block;
    margin-bottom: 40px;
    font-size: 1.8rem;
}

.auth-header { margin-bottom: 32px; }
.auth-header h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 10px; }
.auth-header p { color: var(--text-muted); }

/* Social Buttons */
.social-auth {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 30px;
}

.btn-social {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    background: var(--card-bg);
    border: 1px solid var(--border-light);
    color: var(--text-main);
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.3s;
}

.btn-social:hover {
    background: rgba(255,255,255,0.05);
    border-color: var(--text-muted);
}

.btn-social.google i { color: #DB4437; }
.btn-social.github i { color: var(--text-main); }

/* Divider */
.auth-divider {
    text-align: center;
    margin-bottom: 30px;
    position: relative;
}

.auth-divider::before {
    content: '';
    position: absolute;
    top: 50%; left: 0; right: 0;
    height: 1px;
    background: var(--border-light);
}

.auth-divider span {
    background: var(--bg-body);
    padding: 0 15px;
    color: var(--text-muted);
    font-size: 0.9rem;
    position: relative;
}

/* Form Inputs */
.input-group { margin-bottom: 24px; }

.input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 0.95rem;
}

.input-wrapper {
    position: relative;
    width: 100%;
}

.input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    transition: 0.3s;
}

.auth-form input {
    width: 100%;
    padding: 14px 16px 14px 45px; /* مساحة للأيقونة */
    background: var(--card-bg);
    border: 1px solid var(--border-light);
    border-radius: 8px;
    color: var(--text-main);
    font-size: 1rem;
    transition: 0.3s;
}

.auth-form input::placeholder { color: rgba(148, 163, 184, 0.5); }

/* تأثير التركيز المتوهج */
.auth-form input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
    background: rgba(99, 102, 241, 0.05);
}

.auth-form input:focus + .input-icon, /* إذا كانت الأيقونة بعد الإنبوت */
.input-wrapper:focus-within .input-icon { /* الطريقة الأحدث */
    color: var(--primary);
}

/* أزرار وروابط */
.btn-block { width: 100%; display: block; text-align: center; }
.btn-lg { padding: 16px; font-size: 1.1rem; }

.auth-footer {
    text-align: center;
    margin-top: 30px;
    color: var(--text-muted);
}

.link-primary { color: var(--primary); text-decoration: none; font-weight: 600; }
.link-primary:hover { text-decoration: underline; }

/* --- Right Side: Visual --- */
.auth-visual-side {
    flex: 1.2; /* تأخذ مساحة أكبر قليلاً */
    background: var(--bg-nav);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.abstract-auth-bg {
    position: absolute;
    top: -20%; right: -20%;
    width: 80%; height: 80%;
    background: var(--primary);
    filter: blur(150px);
    opacity: 0.2;
    border-radius: 50%;
}

.auth-visual-side .glass-card {
    width: 80%;
    max-width: 500px;
    padding: 50px;
    text-align: center;
    background: rgba(255, 255, 255, 0.03); /* أكثر شفافية هنا */
    z-index: 2;
}

.visual-text h2 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    background: var(--gradient-main);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.visual-text p { font-size: 1.1rem; line-height: 1.6; font-style: italic; }

.testimonial-author {
    margin-top: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    font-weight: 600;
}

.author-avatar {
    width: 40px; height: 40px;
    background: var(--gradient-main);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
}

.visual-img.floating {
    margin-top: 50px;
    max-width: 80%;
    animation: float 6s ease-in-out infinite;
}

/* Responsive */
@media (max-width: 992px) {
    .auth-container.split-screen {
        flex-direction: column;
        height: auto;
    }
    
    .auth-form-side {
        padding: 60px 24px;
        width: 100%;
    }
    
    /* إخفاء الجانب البصري في الموبايل لتبسيط الصفحة */
    .auth-visual-side {
        display: none; 
        /* أو يمكن جعلها تظهر تحت النموذج بارتفاع محدد */
        /* height: 400px; flex: none; width: 100%; */
    }
}
</style>
<template>
    <div class="auth-container split-screen">
        <div class="auth-form-side">
            <div class="auth-content-wrapper">
                <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
                
                <header class="auth-header">
                    <h1>Create your free account</h1>
                    <p>Start your journey to mastering algorithms today</p>
                </header>
                <form @submit.prevent="handleRegister" class="auth-form">
                    <div class="input-group">
                        <label for="fullname">Full Name</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user input-icon"></i>
                            <input v-model="fullName" type="text" id="fullname" placeholder="John Doe" required>
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope input-icon"></i>
                            <input v-model="email" type="email" id="email" placeholder="john@example.com" required>
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input v-model="password" id="password" type="password" placeholder="Must be at least 8 characters" required>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary btn-block btn-lg">Create Account</button>
                </form>

                <footer class="auth-footer">
                    <p>Already have an account? <nuxt-link :to="{name: 'login'}" class="link-primary">Log in</nuxt-link></p>
                </footer>
            </div>
        </div>

        <div class="auth-visual-side">
            <div class="visual-content glass-card">
                <div class="visual-text">
                    <h2>Unlock Your Potential.</h2>
                    <p>AlgoMaster helped me crack my dream job interview at a FAANG company. The visualizations are a game-changer!</p>
                </div>
                <img src="/code.png" class="visual-img floating">
            </div>
            <div class="abstract-auth-bg"></div>
        </div>
    </div>
</template>