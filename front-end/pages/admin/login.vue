<template>
    <div class="admin-login-container">
        <div class="login-box">
            <div class="logo-wrapper">
                <i class="fas fa-user-shield admin-icon"></i>
                <h2>Algo<span>Master</span> <span class="badge">Admin Portal</span></h2>
            </div>

            <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

            <form @submit.prevent="handleAdminLogin" class="admin-form">
                <div class="input-group">
                    <label>Admin Email</label>
                    <div class="input-wrapper">
                        <i class="fas fa-envelope input-icon"></i>
                        <input v-model="email" type="email" placeholder="admin@admin.com" required :disabled="isLoading">
                    </div>
                </div>

                <div class="input-group">
                    <label>Admin Password</label>
                    <div class="input-wrapper">
                        <i class="fas fa-lock input-icon"></i>
                        <input v-model="password" type="password" placeholder="••••••••" required :disabled="isLoading">
                    </div>
                </div>

                <button type="submit" class="btn-primary" :disabled="isLoading">
                    {{ isLoading ? 'Authenticating...' : 'Login' }} <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </form>
            
            <nuxt-link to="/" class="back-link"><i class="fas fa-arrow-left"></i> Back to Main Site</nuxt-link>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

// استخدام اسم كوكي مختلف للآدمن لفصله عن حساب الطالب
const adminTokenCookie = useCookie('admin_token', { maxAge: 60 * 60 * 24 }) 

const handleAdminLogin = async () => {
    errorMessage.value = ''; isLoading.value = true;
    try {
        const response = await $fetch('http://localhost:5000/api/auth/admin-login', {
            method: 'POST',
            body: { email: email.value, password: password.value }
        });

        // حفظ التوكن وتوجيه للوحة
        adminTokenCookie.value = response.token;
        navigateTo('/admin'); 

    } catch (error) {
        errorMessage.value = error.data?.error || 'Invalid admin credentials.';
    } finally {
        isLoading.value = false;
    }
}
</script>

<style scoped>
.admin-login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0B0F19; font-family: 'Outfit', sans-serif; }
.login-box { background: rgba(14, 20, 34, 0.85); backdrop-filter: blur(10px); border: 1px solid #334155; padding: 40px; border-radius: 16px; width: 100%; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); text-align: center; }
.logo-wrapper { margin-bottom: 30px; }
.admin-icon { font-size: 3rem; color: #ef4444; margin-bottom: 15px; }
.logo-wrapper h2 { color: white; font-size: 1.5rem; align-items: center; gap: 10px;}
.logo-wrapper h2 span:not(.badge) { color: #3b82f6; }
.badge { background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.7rem; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3); text-transform: uppercase; letter-spacing: 2px;}

.input-group { margin-bottom: 20px; text-align: left; }
.input-group label { display: block; margin-bottom: 8px; color: #94a3b8; font-size: 0.9rem; }
.input-wrapper { position: relative; }
.input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; }
.input-wrapper input { width: 100%; padding: 12px 15px 12px 40px; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 8px; color: white; outline: none; transition: 0.3s;}
.input-wrapper input:focus { border-color: #ef4444; }

.btn-primary { width: 100%; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;}
.btn-primary:hover:not(:disabled) { background: #dc2626; transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.alert { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; }
.alert-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.back-link { display: inline-block; margin-top: 25px; color: #64748b; text-decoration: none; font-size: 0.9rem; transition: 0.3s; }
.back-link:hover { color: white; }
</style>