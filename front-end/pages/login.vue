<script setup>
import { ref } from 'vue'
const email = ref('');
const password = ref('');
const tokenCookie = useCookie('auth_token', {
  maxAge: 60 * 60 * 24 * 7 // 60 ثانية × 60 دقيقة × 24 ساعة × 7 أيام
}); // تعريف الكوكي

const handleLogin = async () => {
  try {
    const response = await $fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    });

    // حفظ التوكن في الكوكيز
    tokenCookie.value = response.token;
    
    // توجيه المستخدم للصفحة المحمية
    navigateTo('/'); 
  } catch (error) {
    alert(error.data?.message || 'Login failed. Please check your credentials and try again.');
  }
};
</script>
<style>

    .auth-body { min-height: 100vh; display: flex; }
    .auth-container.split-screen { display: flex; width: 100%; min-height: 100vh; overflow: hidden; }

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

    .auth-content-wrapper { width: 100%; max-width: 440px; }
    .auth-logo { display: inline-block; margin-bottom: 40px; font-size: 1.8rem; color: var(--text-main); text-decoration: none; font-weight: bold; }
    .auth-logo span { color: var(--primary); }

    .auth-header { margin-bottom: 32px; }
    .auth-header h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 10px; }
    .auth-header p { color: var(--text-muted); }

    /* Social Buttons */
    .social-auth { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
    .btn-social {
        display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px;
        background: var(--card-bg); border: 1px solid var(--border-light); color: var(--text-main);
        border-radius: 8px; font-weight: 500; cursor: pointer; transition: 0.3s;
    }
    .btn-social:hover { background: rgba(255,255,255,0.05); border-color: var(--text-muted); }
    .btn-social.google i { color: #DB4437; }
    .btn-social.github i { color: var(--text-main); }

    /* Divider */
    .auth-divider { text-align: center; margin-bottom: 30px; position: relative; }
    .auth-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-light); }
    .auth-divider span { background: var(--bg-body); padding: 0 15px; color: var(--text-muted); font-size: 0.9rem; position: relative; }

    /* Form Inputs */
    .input-group { margin-bottom: 24px; }
    .input-group label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.95rem; }
    .input-wrapper { position: relative; width: 100%; }
    .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); transition: 0.3s; }
    
    .auth-form input {
        width: 100%; padding: 14px 16px 14px 45px; background: var(--card-bg);
        border: 1px solid var(--border-light); border-radius: 8px; color: var(--text-main);
        font-size: 1rem; transition: 0.3s;
    }
    .auth-form input::placeholder { color: rgba(148, 163, 184, 0.5); }
    .auth-form input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); background: rgba(99, 102, 241, 0.05); }
    .auth-form input:focus + .input-icon { color: var(--primary); }

    /* Buttons & Links */
    .btn-block { width: 100%; display: block; text-align: center; background: var(--gradient-main); color: white; border: none; cursor: pointer; }
    .btn-lg { padding: 16px; font-size: 1.1rem; border-radius: 8px; font-weight: bold; }
    .btn-lg:hover { opacity: 0.9; }

    .auth-footer { text-align: center; margin-top: 30px; color: var(--text-muted); }
    .link-primary { color: var(--primary); text-decoration: none; font-weight: 600; }
    .link-primary:hover { text-decoration: underline; }

    /* إضافة: تنسيق لرابط نسيت كلمة المرور */
    .forgot-password-link {
        display: block;
        text-align: right;
        margin-top: -15px;
        margin-bottom: 24px;
        font-size: 0.9rem;
        color: var(--text-muted);
        text-decoration: none;
    }
    .forgot-password-link:hover { color: var(--primary); }

    /* --- Right Side: Visual --- */
    .auth-visual-side {
        flex: 1.2; background: var(--bg-nav); position: relative;
        display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .abstract-auth-bg {
        position: absolute; top: -20%; right: -20%; width: 80%; height: 80%;
        background: var(--primary); filter: blur(150px); opacity: 0.2; border-radius: 50%;
    }
    .auth-visual-side .glass-card {
        width: 80%; max-width: 500px; padding: 50px; text-align: center;
        background: rgba(255, 255, 255, 0.03); z-index: 2; border-radius: 16px;
        backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
    }
    .visual-text h2 {
        font-size: 2.5rem; margin-bottom: 20px;
        background: var(--gradient-main); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .visual-text p { font-size: 1.1rem; line-height: 1.6; font-style: italic; color: var(--text-muted); }
    
    .visual-img.floating { margin-top: 50px; max-width: 80%; }

    @media (max-width: 992px) {
        .auth-container.split-screen { flex-direction: column; height: auto; }
        .auth-form-side { padding: 60px 24px; width: 100%; }
        .auth-visual-side { display: none; }
    }
</style>
<template>
    <div class="auth-container split-screen">
        <div class="auth-form-side">
            <div class="auth-content-wrapper">
                <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
                
                <header class="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Enter your details to access your coding dashboard</p>
                </header>

                <form @submit.prevent="handleLogin" class="auth-form">
                    <div class="input-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope input-icon"></i>
                            <input v-model="email" id="email" placeholder="john@example.com" required>
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input v-model="password" id="password" type="password" placeholder="Enter your password" required>
                        </div>
                    </div>

                    <nuxt-link :to="{name: 'reset-password'}" class="forgot-password-link">Forgot Password?</nuxt-link>

                    <button type="submit" class="btn-primary btn-block btn-lg">Log In</button>
                </form>

                <footer class="auth-footer">
                    <p>Don't have an account? <nuxt-link :to="{name: 'signup'}" class="link-primary">Sign up</nuxt-link></p>
                </footer>
            </div>
        </div>

        <div class="auth-visual-side">
            <div class="visual-content glass-card">
                <div class="visual-text">
                    <h2>Continue Learning.</h2>
                    <p>Consistency is the key to mastering algorithms. Pick up right where you left off.</p>
                </div>
                <img src="/code.png" alt="Pair Programming" class="visual-img floating">
            </div>
            <div class="abstract-auth-bg"></div>
        </div>
    </div>
</template>