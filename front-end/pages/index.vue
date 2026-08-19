<script setup>   
import { onMounted } from 'vue'
import { initTheme } from '~/assets/script'
const token = useCookie('auth_token')

const handleLogout = () => {
  token.value = null 
  navigateTo('/') 
}

onMounted(() => {
  initTheme()
})
</script>

<template>
    <div class="glowing-lines-container">
        <div class="glow-line line-1"></div>
        <div class="glow-line line-2"></div>
        <div class="glow-line line-3"></div>
        <div class="glow-line line-4"></div>
    </div>

    <nav class="navbar">
        <div class="container">
            <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
            
            <ul class="nav-links">
                <li><nuxt-link :to="{name: 'index'}" class="active">Home</nuxt-link></li>
                <li><nuxt-link :to="{name: 'learn-path'}">Learn</nuxt-link></li>
                <li v-if="token"><nuxt-link :to="{name: 'profile'}">Profile</nuxt-link></li>
                <li><nuxt-link :to="{name: 'about'}">About</nuxt-link></li>
            </ul>

            <div class="nav-actions">
                <button id="theme-toggle" class="icon-btn" aria-label="Toggle Theme">
                    <i class="fas fa-sun"></i>
                </button>
                
                <button v-if="token" @click="handleLogout" class="btn-login" style="cursor: pointer;">Logout</button>
                <nuxt-link v-else :to="{name: 'login'}" class="btn-login">Login</nuxt-link>
                
                <div class="mobile-menu-btn">
                    <i class="fas fa-bars"></i>
                </div>
            </div>
        </div>
    </nav>

    <header class="hero">
        <div class="container hero-content">
            <div class="text-section">
                <h3>Unlock the Logic<br> <span class="gradient-text">Behind Code</span></h3>
                <p>
                    The interactive platform to visualize Data Structures & Algorithms. 
                    From Binary Trees to Dynamic Programming, master the concepts that matter.
                </p>
                <div class="cta-group">
                    <nuxt-link v-if="!token" :to="{name: 'signup'}" class="btn-primary">Get Started Free</nuxt-link>
                    <nuxt-link v-else="!token" :to="{name: 'competitions'}" class="btn-competition">Join Competitions</nuxt-link>
                    <nuxt-link :to="{name: 'learn-path'}" class="btn-text">View Learning Path <i class="fas fa-arrow-right"></i></nuxt-link>
                </div>
                
                <div class="trust-metrics">
                    <div class="metric">
                        <strong>10k+</strong> <span>Students</span>
                    </div>
                    <div class="separator"></div>
                    <div class="metric">
                        <strong>50+</strong> <span>Algorithms</span>
                    </div>
                </div>
            </div>
            
            <div class="image-section">
                <div class="hero-visual">
                    <div class="abstract-bg"></div>
                    <img src="/coding.png" alt="Algorithm Coding" class="hero-img">
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
/* --- Variables & Theming --- */
:root {
    --bg-body: #0B0F19;
    --bg-nav: rgba(11, 15, 25, 0.85);
    --text-main: #FFFFFF;
    --text-muted: #94A3B8;
    --btn:#5658f5;
    --primary: #5658f5;
    --primary-glow: rgba(99, 102, 241, 0.5);
    --gradient-main: linear-gradient(135deg, #6366f1 0%, #a248ec 100%);
    
    --border-light: rgba(255, 255, 255, 0.08);
    --card-bg: rgba(255, 255, 255, 0.03);
}

[data-theme="light"] {
    --bg-body: #FFFFFF;
    --bg-nav: rgba(255, 255, 255, 0.85);
    --text-main: #0F172A;
    --text-muted: #475569;
    --btn:rgba(99, 102, 241);
    --border-light: rgba(0, 0, 0, 0.08);
    --card-bg: rgba(0, 0, 0, 0.03);
    --primary-glow: rgba(99, 102, 241);
}

/* --- Reset & Global --- */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Outfit', sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
    background-color: var(--bg-body);
    color: var(--text-main);
    overflow-x: hidden;
    line-height: 1.6;
}

.container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
}

/* ================= BACKGROUND GLOWING LINES ================= */
.glowing-lines-container {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    overflow: hidden;
    z-index: -1;
    pointer-events: none;
}

.glow-line {
    position: absolute;
    background: linear-gradient(to bottom, transparent, var(--primary), transparent);
    width: 1px;
    height: 300px;
    opacity: 0;
    animation: glowingDrop 8s infinite linear;
}

.line-1 { left: 15%; animation-delay: 0s; animation-duration: 7s; }
.line-2 { left: 45%; animation-delay: 3s; animation-duration: 9s; width: 2px; background: linear-gradient(to bottom, transparent, #a248ec, transparent); }
.line-3 { left: 75%; animation-delay: 1.5s; animation-duration: 8s; }
.line-4 { left: 90%; animation-delay: 5s; animation-duration: 10s; }

@keyframes glowingDrop {
    0% { top: -300px; opacity: 0; }
    20% { opacity: 0.5; box-shadow: 0 0 20px var(--primary); }
    80% { opacity: 0.5; box-shadow: 0 0 20px var(--primary); }
    100% { top: 100vh; opacity: 0; }
}

/* --- Navbar --- */
.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    padding: 18px 0;
    background: var(--bg-nav);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-light);
    z-index: 1000;
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-main);
    text-decoration: none;
    letter-spacing: -0.5px;
}
.logo span { color: var(--primary); }

.nav-links {
    display: flex;
    list-style: none;
    gap: 48px;
}

.nav-links a {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
}

.nav-links a:hover, .nav-links a.active {
    color: var(--text-main);
}

.nav-actions {
    display: flex;
    align-items: center;
    gap: 24px;
}

.icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
}
.icon-btn:hover { color: var(--text-main); background: var(--card-bg); }

.btn-login {
    color: var(--text-main);
    background: var(--btn);
    text-decoration: none;
    font-weight: 600;
    padding: 6px 24px;
    border-radius: 20px;
    border: 1px solid var(--border-light);
    font-size: 0.9rem;
}

.btn-login:hover {
    border-color: var(--primary);
    background: rgba(99, 102, 241, 0.1);
}

.mobile-menu-btn { display: none; color: var(--text-main); font-size: 1.4rem; }

/* --- Hero Section --- */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding-top: 80px;
    position: relative;
    overflow: hidden;
}

.hero-content::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: var(--primary);
    filter: blur(150px);
    opacity: 0.15;
    top: -100px;
    left: -100px;
    border-radius: 50%;
    z-index: -1;
}

.hero-content {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 60px;
    align-items: center;
}

.badge {
    color: var(--text-main);
    background: rgba(99, 102, 241, 0.1);
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.text-section h3 {
    font-size: 3rem;
    line-height: 1.1;
    margin: 24px 0;
    font-weight: 800;
    letter-spacing: -1.5px;
}

.gradient-text {
    background: var(--gradient-main);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
 
.text-section p {
    color: var(--text-muted);
    font-size: 1.125rem;
    margin-bottom: 40px;
    max-width: 540px;
}

.cta-group {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 48px;
}

.btn-primary {
    background: var(--gradient-main);
    color: white;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
}

.btn-competition {
    background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
    color: white;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
}

.btn-competition:hover { box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4); }

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px var(--primary-glow);
}

.btn-text {
    color: var(--text-main);
    text-decoration: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
}

.trust-metrics {
    display: flex;
    align-items: center;
    gap: 30px;
}
.metric strong { font-size: 1.5rem; display: block; line-height: 1; }
.metric span { font-size: 0.85rem; color: var(--text-muted); }
.separator { width: 1px; height: 40px; background: var(--border-light); }

.image-section {
    position: relative;
    display: flex;
    justify-content: center;
}

.hero-visual {
    position: relative;
    width: 100%;
    max-width: 500px;
}

.hero-img {
    height: 100%;
    width: 100%;
    animation: float 6s ease-in-out infinite;
    z-index: 2;
    position: relative;
}

.abstract-bg {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 130%; height: 130%;
    background: radial-gradient(circle, var(--primary-glow) 0%, transparent 60%);
    z-index: 1;
}

/* ================= COMPETITIONS SECTION ================= */
.competitions-section {
    padding: 100px 0;
    position: relative;
    z-index: 1;
}

.section-header { margin-bottom: 50px; }
.section-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 15px; }
.section-desc { font-size: 1.1rem; max-width: 600px; margin: 0 auto; }
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-warning { color: #facc15; }
.mb-2 { margin-bottom: 10px; }
.mt-5 { margin-top: 40px; }

.competitions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

.glass-card {
    background: var(--card-bg);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    padding: 30px;
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.comp-card:hover {
    border-color: var(--primary);
    transform: translateY(-5px);
}

.active-comp {
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 10px 30px rgba(239, 68, 68, 0.1);
}

.comp-status {
    position: absolute;
    top: 20px; right: 20px;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 20px;
    letter-spacing: 1px;
}
.comp-status.live { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); animation: pulse 2s infinite; }
.comp-status.upcoming { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
.comp-status.ongoing { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }

.comp-icon {
    font-size: 2.5rem;
    color: #ef4444;
    margin-bottom: 20px;
}

.comp-card h3 { font-size: 1.4rem; color: var(--text-main); margin-bottom: 10px; }
.comp-card p { font-size: 0.95rem; margin-bottom: 25px; flex-grow: 1; }

.comp-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 25px;
    padding-top: 15px;
    border-top: 1px solid var(--border-light);
}

.btn-comp {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-weight: bold;
    text-align: center;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.btn-comp.primary { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; border: none; }
.btn-comp.primary:hover { box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4); }
.btn-comp.secondary { background: var(--card-bg); color: var(--text-muted); border: 1px solid var(--border-light); cursor: not-allowed; }
.btn-comp.outline { background: transparent; color: var(--text-main); border: 1px solid var(--border-light); }
.btn-comp.outline:hover { background: var(--card-bg); border-color: var(--primary); }

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}
</style>