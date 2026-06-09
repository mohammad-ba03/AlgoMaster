<template>
    <div class="auth-container split-screen">
        <div class="auth-form-side">
            <div class="auth-content-wrapper">
                <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
                
                <header class="auth-header">
                    <h1>Reset Password</h1>
                    <p v-if="step === 1">Enter your email to receive a 6-digit recovery code.</p>
                    <p v-if="step === 2">We sent a verification code to <strong style="color: var(--text-main);">{{ email }}</strong>.</p>
                    <p v-if="step === 3" style="color: #22c55e;"><i class="fas fa-check-circle"></i> Code verified! Create a new password.</p>
                </header>

                <div v-if="errorMessage" class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ errorMessage }}</div>
                <div v-if="successMessage" class="alert alert-success"><i class="fas fa-check-circle"></i> {{ successMessage }}</div>

                <form v-if="step === 1" @submit.prevent="requestResetCode" class="auth-form">
                    <div class="input-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope input-icon"></i>
                            <input type="email" v-model="email" id="email" placeholder="john@example.com" required :disabled="isLoading">
                        </div>
                    </div>

                    <button type="submit" class="btn-primary btn-block btn-lg" :disabled="isLoading">
                        {{ isLoading ? 'Sending...' : 'Send Recovery Code' }}
                    </button>
                </form>

                <div v-if="step === 2" class="auth-form">
                    <div class="input-group code-input-group">
                        <label for="code">Verification Code</label>
                        <div class="input-wrapper">
                            <input 
                                type="text" 
                                v-model="resetCode" 
                                id="code"
                                maxlength="6" 
                                placeholder="• • • • • •" 
                                class="code-input"
                                autocomplete="off"
                                :disabled="isLoading"
                            >
                        </div>
                    </div>
                    <p v-if="isLoading" class="loading-text"><i class="fas fa-spinner fa-spin"></i> Verifying code...</p>
                </div>

                <form v-if="step === 3" @submit.prevent="updatePassword" class="auth-form">
                    <div class="input-group">
                        <label for="newPassword">New Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" v-model="newPassword" id="newPassword" placeholder="Enter new password" required :disabled="isLoading">
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" v-model="confirmPassword" id="confirmPassword" placeholder="Confirm your new password" required :disabled="isLoading">
                        </div>
                    </div>

                    <button type="submit" class="btn-primary btn-block btn-lg" :disabled="isLoading">
                        {{ isLoading ? 'Saving...' : 'Save New Password' }}
                    </button>
                </form>

                <footer class="auth-footer">
                    <p>Remember your password? <nuxt-link :to="{name: 'login'}" class="link-primary">Log In</nuxt-link></p>
                </footer>
            </div>
        </div>

        <div class="auth-visual-side">
            <div class="visual-content glass-card">
                <div class="visual-text">
                    <h2>Secure Your Account</h2>
                    <p>A strong password is your first line of defense in the digital world. Keep your algorithms safe.</p>
                </div>
                <img src="/code.png" alt="Security" class="visual-img floating">
            </div>
            <div class="abstract-auth-bg"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'

// State
const step = ref(1) // 1: Email, 2: Code, 3: New Password
const email = ref('')
const resetCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// Step 1: Request Code
const requestResetCode = async () => {
    errorMessage.value = ''; isLoading.value = true;
    try {
        await $fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST', body: { email: email.value }
        });
        step.value = 2;
    } catch (error) {
        // Translation applied here
        errorMessage.value = error.data?.error || 'An error occurred. Please check your email.';
    } finally {
        isLoading.value = false;
    }
}

// Step 2: Auto-verify Code
watch(resetCode, async (newVal) => {
    if (newVal.length === 6) {
        errorMessage.value = ''; isLoading.value = true;
        try {
            await $fetch('http://localhost:5000/api/auth/verify-reset-code', {
                method: 'POST', body: { email: email.value, code: newVal }
            });
            step.value = 3;
        } catch (error) {
            errorMessage.value = error.data?.error || 'Invalid or expired verification code.';
        } finally {
            isLoading.value = false;
        }
    } else {
        errorMessage.value = '';
    }
});

// Step 3: Update Password
const updatePassword = async () => {
    if (newPassword.value !== confirmPassword.value) {
        errorMessage.value = 'Passwords do not match!';
        return;
    }

    errorMessage.value = ''; isLoading.value = true;
    try {
        const res = await $fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST', 
            body: { email: email.value, code: resetCode.value, newPassword: newPassword.value }
        });
        successMessage.value = res.message || 'Password successfully reset!';
        
        setTimeout(() => { navigateTo('/login'); }, 2000);
    } catch (error) {
        errorMessage.value = error.data?.error || 'An error occurred while resetting the password.';
    } finally {
        isLoading.value = false;
    }
}
</script>

<style scoped>
    /* --- Base Split-Screen Styles --- */
    .auth-container.split-screen { display: flex; width: 100%; min-height: 100vh; overflow: hidden; background: var(--bg-body); font-family: 'Outfit', sans-serif;}

    .auth-form-side {
        flex: 1; display: flex; align-items: center; justify-content: center;
        padding: 40px; position: relative; z-index: 2;
    }

    .auth-content-wrapper { width: 100%; max-width: 440px; }
    .logo { display: inline-block; margin-bottom: 40px; font-size: 1.8rem; color: var(--text-main); text-decoration: none; font-weight: bold; }
    .logo span { color: var(--primary); }

    .auth-header { margin-bottom: 32px; }
    .auth-header h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 10px; color: var(--text-main); }
    .auth-header p { color: var(--text-muted); line-height: 1.5; }

    /* Form Inputs */
    .input-group { margin-bottom: 24px; }
    .input-group label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.95rem; color: var(--text-main); }
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
    .auth-form input:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Special Code Input Styling */
    .code-input-group .input-wrapper { display: flex; justify-content: center; }
    .code-input-group .code-input { 
        text-align: center; font-size: 2rem; letter-spacing: 12px; font-weight: bold; 
        padding: 1rem; padding-left: 2rem; /* override left padding since no icon is used */
    }

    /* Buttons & Links */
    .btn-block { width: 100%; display: block; text-align: center; background: var(--gradient-main); color: white; border: none; cursor: pointer; }
    .btn-lg { padding: 16px; font-size: 1.1rem; border-radius: 8px; font-weight: bold; transition: 0.3s; }
    .btn-lg:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-lg:disabled { background: var(--text-muted); cursor: not-allowed; }

    .auth-footer { text-align: center; margin-top: 30px; color: var(--text-muted); }
    .link-primary { color: var(--primary); text-decoration: none; font-weight: 600; }
    .link-primary:hover { text-decoration: underline; }

    /* Alerts & Loaders */
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px; }
    .alert-danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
    .alert-success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
    .loading-text { text-align: center; color: var(--primary); font-size: 0.95rem; margin-top: -10px; margin-bottom: 20px;}

    /* --- Right Side: Visual --- */
    .auth-visual-side {
        flex: 1.2; background: var(--bg-nav); position: relative;
        display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .abstract-auth-bg {
        position: absolute; top: -20%; right: -20%; width: 80%; height: 80%;
        background: var(--primary); filter: blur(150px); opacity: 0.2; border-radius: 50%;
    }
    .visual-content.glass-card {
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