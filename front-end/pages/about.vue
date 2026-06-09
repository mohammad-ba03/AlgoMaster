<script setup>
import '~/assets/about.css'
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

    <nav class="navbar">
        <div class="container">
            <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
            
            <ul class="nav-links">
                <li><nuxt-link :to="{name: 'index'}">Home</nuxt-link></li>
                <li><nuxt-link :to="{name: 'learn-path'}">Learn</nuxt-link></li>
                <li v-if="token"><nuxt-link :to="{name: 'profile'}">Profile</nuxt-link></li>
                <li><nuxt-link :to="{name: 'about'}" class="active">About</nuxt-link></li>
            </ul>
            <div class="nav-actions">
                <button id="theme-toggle" class="icon-btn"><i class="fas fa-sun"></i></button>
                <button v-if="token" @click="handleLogout" class="btn-login" style="cursor: pointer;">Logout</button>
                <nuxt-link v-else :to="{name: 'login'}" class="btn-login">Login</nuxt-link>
                <div class="mobile-menu-btn"><i class="fas fa-bars"></i></div>
            </div>
        </div>
    </nav>

    <header class="about-hero">
        <div class="container">
            <span class="badge">Our Mission</span>
            <h1>Bridging Theory & <span class="gradient-text">Practice</span></h1>
            <p>We believe that algorithms shouldn't be scary. AlgoMaster is designed to make complex computer science concepts accessible, visual, and fun.</p>
        </div>
    </header>

    <section class="about-content">
        <div class="container">
            
            <div class="story-grid">
                <div class="story-text">
                    <h2>What is AlgoMaster?</h2>
                    <p>
                        AlgoMaster is an interactive learning platform built for developers, by developers. 
                        Traditional textbooks make algorithms feel abstract and difficult. We change that by turning code into **visual animations**.
                    </p>
                    <p>
                        Whether you are a student preparing for exams or a professional getting ready for FAANG interviews, our structured path helps you understand the "Why" behind the code.
                    </p>
                </div>
                <div class="story-image">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Team collaborating">
                    <div class="glow-box"></div>
                </div>
            </div>

            <div class="how-it-works">
                <h2 class="section-title">How It Works</h2>
                <div class="steps-grid">
                    <div class="step-card">
                        <div class="step-icon"><i class="fas fa-book-open"></i></div>
                        <h3>1. Learn the Logic</h3>
                        <p>Read concise explanations and watch animations to understand how the algorithm behaves.</p>
                    </div>
                    <div class="step-card">
                        <div class="step-icon"><i class="fas fa-play-circle"></i></div>
                        <h3>2. Visualize</h3>
                        <p>Use our interactive playground. Input your own data and watch the sorting or search happen step-by-step.</p>
                    </div>
                    <div class="step-card">
                        <div class="step-icon"><i class="fas fa-code"></i></div>
                        <h3>3. Write Code</h3>
                        <p>Solve challenges in our built-in code editor (Python, JS, C++) to cement your knowledge.</p>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <section class="contact-section">
        <div class="container">
            <div class="contact-card">
                <h2>Get in Touch</h2>
                <p>Have a question, feedback, or just want to say hi? Connect with us on our social platforms.</p>
                
                <div class="social-links">
                    <a href="#" class="social-item facebook" title="Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="#" class="social-item gmail" title="Send Email">
                        <i class="fas fa-envelope"></i>
                    </a>
                    <a href="#" class="social-item github" title="GitHub">
                        <i class="fab fa-github"></i>
                    </a>
                    <a href="#" class="social-item linkedin" title="LinkedIn">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                </div>
            </div>
        </div>
    </section>

</template>