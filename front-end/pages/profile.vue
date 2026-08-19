<script setup>
import { ref, onMounted } from 'vue'
import { initTheme } from '~/assets/script'

const token = useCookie('auth_token')
const activeTab = ref('overview')
const fileInput = ref(null)

// حالة البيانات
const user = ref({
    full_name: '',
    email: '',
    total_points: 0,
    current_level: 1,
    solved_count: 0,
    help_points: 0,
    profile_image: '',
    created_at: ''
})
const submissions = ref([])

// نماذج التعديل
const editForm = ref({ full_name: '', email: '', profile_image: '' })
const passwordForm = ref({ currentPassword: '', newPassword: '' })
const statusMessage = ref({ text: '', type: '' })

// جلب بيانات البروفايل والحلول
const fetchProfileData = async () => {
    try {
        const res = await $fetch('http://localhost:5000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token.value}` }
        })
        user.value = res
        editForm.value = { full_name: res.full_name, email: res.email, profile_image: res.profile_image || '' }
        
        const subRes = await $fetch('http://localhost:5000/api/submissions/user', {
            headers: { 'Authorization': `Bearer ${token.value}` }
        })
        submissions.value = subRes
    } catch (error) {
        console.error('Error fetching profile:', error)
    }
}

// دالة فتح نافذة اختيار الصورة عند الضغط عليها
const triggerFileInput = () => {
    fileInput.value.click()
}
const onFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
        if (file.size > 2 * 1024 * 1024) { 
            statusMessage.value = { text: 'Image size should be less than 2MB', type: 'error' }
            setTimeout(() => statusMessage.value.text = '', 3000)
            return
        }
        
        const reader = new FileReader()
        reader.onload = async (event) => {
            const base64Image = event.target.result
            user.value.profile_image = base64Image
            editForm.value.profile_image = base64Image
            
            // حفظ تلقائي للصورة فور اختيارها لراحة المستخدم
            await updateProfile(true)
        }
        reader.readAsDataURL(file)
    }
}

// دالة تحديث البروفايل
const updateProfile = async (isAvatarOnly = false) => {
    try {
        await $fetch('http://localhost:5000/api/user/update', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: editForm.value
        })
        
        statusMessage.value = { 
            text: isAvatarOnly ? 'Profile picture updated successfully!' : 'Profile updated successfully!', 
            type: 'success' 
        }
        user.value.full_name = editForm.value.full_name
        user.value.email = editForm.value.email
        
        setTimeout(() => statusMessage.value.text = '', 3000)
    } catch (error) {
        statusMessage.value = { text: 'Failed to update profile.', type: 'error' }
        setTimeout(() => statusMessage.value.text = '', 3000)
    }
}

// دالة تغيير كلمة المرور
const changePassword = async () => {
    try {
        const res = await $fetch('http://localhost:5000/api/user/change-password', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token.value}`,
                'Content-Type': 'application/json'
            },
            body: passwordForm.value
        })
        statusMessage.value = { text: res.message || 'Password changed successfully!', type: 'success' }
        passwordForm.value = { currentPassword: '', newPassword: '' }
        setTimeout(() => statusMessage.value.text = '', 3000)
    } catch (error) {
        statusMessage.value = { text: error.data?.error || 'Failed to change password.', type: 'error' }
        setTimeout(() => statusMessage.value.text = '', 3000)
    }
}

const handleLogout = () => {
    token.value = null
    navigateTo('/')
}

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
    initTheme()
    if (!token.value) {
        navigateTo('/login')
    } else {
        fetchProfileData()
    }
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
                <li><nuxt-link :to="{name: 'index'}">Home</nuxt-link></li>
                <li><nuxt-link :to="{name: 'learn-path'}">Learn</nuxt-link></li>
                <li><nuxt-link :to="{name: 'profile'}" class="active">Profile</nuxt-link></li>
                <li><nuxt-link :to="{name: 'about'}">About</nuxt-link></li>
            </ul>
            <div class="nav-actions">
                <button id="theme-toggle" class="icon-btn" aria-label="Toggle Theme">
                    <i class="fas fa-sun"></i>
                </button>
                <button @click="handleLogout" class="btn-login" style="cursor: pointer;">Logout</button>
            </div>
        </div>
    </nav>

    <main class="profile-page">
        <div class="container">
            <div v-if="statusMessage.text" :class="['alert-message', statusMessage.type]">
                {{ statusMessage.text }}
            </div>

            <div class="profile-layout">
                <aside class="profile-sidebar glass-card">
                    <div class="user-identity">
                        
                        <input type="file" ref="fileInput" @change="onFileChange" accept="image/*" style="display: none" />
                        
                        <div class="avatar-wrapper" @click="triggerFileInput" title="Click to change profile picture">
                            <img v-if="user.profile_image" :src="user.profile_image" alt="Profile" class="avatar-img">
                            <div v-else class="avatar-placeholder">
                                <i class="fas fa-user-astronaut"></i>
                            </div>
                            <div class="avatar-overlay">
                                <i class="fas fa-camera"></i>
                                <span>Change Photo</span>
                            </div>
                            <div class="level-badge">Lvl {{ user.current_level }}</div>
                        </div>

                        <h2>{{ user.full_name }}</h2>
                        <p class="text-muted">{{ user.email }}</p>
                        <p class="join-date">Joined: {{ formatDate(user.created_at) }}</p>
                    </div>

                    <div class="tab-menu">
                        <button :class="['tab-btn', { active: activeTab === 'overview' }]" @click="activeTab = 'overview'">
                            <i class="fas fa-chart-pie"></i> Overview
                        </button>
                        <button :class="['tab-btn', { active: activeTab === 'submissions' }]" @click="activeTab = 'submissions'">
                            <i class="fas fa-code"></i> Submissions
                        </button>
                        <button :class="['tab-btn', { active: activeTab === 'edit' }]" @click="activeTab = 'edit'">
                            <i class="fas fa-user-edit"></i> Edit Profile
                        </button>
                        <button :class="['tab-btn', { active: activeTab === 'security' }]" @click="activeTab = 'security'">
                            <i class="fas fa-shield-alt"></i> Security
                        </button>
                    </div>
                </aside>

                <div class="profile-content">
                    <transition name="fade" mode="out-in">
                        
                        <div v-if="activeTab === 'overview'" class="tab-pane" key="overview">
                            <h3 class="section-title">Your Progress</h3>
                            <div class="stats-grid">
                                <div class="stat-card glass-card">
                                    <div class="stat-icon" style="color: #f59e0b; background: rgba(245, 158, 11, 0.1);"><i class="fas fa-star"></i></div>
                                    <div class="stat-info">
                                        <h4>Total Points</h4>
                                        <span class="stat-value">{{ user.total_points }}</span>
                                    </div>
                                </div>
                                <div class="stat-card glass-card">
                                    <div class="stat-icon" style="color: #10b981; background: rgba(16, 185, 129, 0.1);"><i class="fas fa-check-circle"></i></div>
                                    <div class="stat-info">
                                        <h4>Solved Algos</h4>
                                        <span class="stat-value">{{ user.solved_count }}</span>
                                    </div>
                                </div>
                                <div class="stat-card glass-card">
                                    <div class="stat-icon" style="color: #6366f1; background: rgba(99, 102, 241, 0.1);"><i class="fas fa-lightbulb"></i></div>
                                    <div class="stat-info">
                                        <h4>Help Points</h4>
                                        <span class="stat-value">{{ user.help_points }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="quick-actions glass-card mt-5">
                                <h3>Ready for a challenge?</h3>
                                <p class="text-muted">Continue your journey and climb the leaderboard.</p>
                                <nuxt-link :to="{name: 'learn-path'}" class="btn-primary mt-3" style="display: inline-block;">Resume Learning</nuxt-link>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'submissions'" class="tab-pane" key="submissions">
                            <h3 class="section-title">Recent Submissions</h3>
                            <div class="glass-card table-responsive">
                                <table class="submissions-table" v-if="submissions.length > 0">
                                    <thead>
                                        <tr>
                                            <th>Algorithm / Competition</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="sub in submissions" :key="sub.id">
                                            <td style="font-weight: 600;">{{ sub.algo_id || `Competition #${sub.competition_id}` }}</td>
                                            <td>
                                                <span :class="['status-badge', sub.status]">
                                                    {{ sub.status.toUpperCase() }}
                                                </span>
                                            </td>
                                            <td class="text-muted">{{ formatDate(sub.submitted_at) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div v-else class="empty-state text-center mt-5">
                                    <i class="fas fa-folder-open mb-3" style="font-size: 3rem; color: var(--text-muted);"></i>
                                    <p>No submissions found yet. Start coding!</p>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'edit'" class="tab-pane" key="edit">
                            <h3 class="section-title">Edit Profile</h3>
                            <div class="glass-card form-container">
                                <form @submit.prevent="updateProfile(false)">
                                    <div class="form-group">
                                        <label>Full Name</label>
                                        <div class="input-icon">
                                            <i class="fas fa-user"></i>
                                            <input type="text" v-model="editForm.full_name" required>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>Email Address</label>
                                        <div class="input-icon">
                                            <i class="fas fa-envelope"></i>
                                            <input type="email" v-model="editForm.email" required>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn-primary w-100">Save Changes</button>
                                </form>
                            </div>
                        </div>

                        <div v-else-if="activeTab === 'security'" class="tab-pane" key="security">
                            <h3 class="section-title">Change Password</h3>
                            <div class="glass-card form-container">
                                <form @submit.prevent="changePassword">
                                    <div class="form-group">
                                        <label>Current Password</label>
                                        <div class="input-icon">
                                            <i class="fas fa-lock"></i>
                                            <input type="password" v-model="passwordForm.currentPassword" required>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label>New Password</label>
                                        <div class="input-icon">
                                            <i class="fas fa-key"></i>
                                            <input type="password" v-model="passwordForm.newPassword" required>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn-competition w-100">Update Password</button>
                                </form>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
/* إعدادات المتغيرات تتوافق مع القالب الأساسي للموقع */
:root {
    --bg-body: #0B0F19;
    --bg-nav: rgba(11, 15, 25, 0.85);
    --text-main: #FFFFFF;
    --text-muted: #94A3B8;
    --btn: #5658f5;
    --primary: #5658f5;
    --primary-glow: rgba(99, 102, 241, 0.5);
    --gradient-main: linear-gradient(135deg, #6366f1 0%, #a248ec 100%);
    --border-light: rgba(255, 255, 255, 0.08);
    --card-bg: rgba(255, 255, 255, 0.03);
}

[data-theme="light"] {
    --bg-body: #F8FAFC;
    --bg-nav: rgba(255, 255, 255, 0.85);
    --text-main: #0F172A;
    --text-muted: #475569;
    --border-light: rgba(0, 0, 0, 0.08);
    --card-bg: #FFFFFF;
}

.profile-page {
    padding: 120px 0 60px;
    min-height: 100vh;
}

.profile-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 30px;
    align-items: start;
}

@media (max-width: 768px) {
    .profile-layout { grid-template-columns: 1fr; }
}

.glass-card {
    background: var(--card-bg);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    padding: 30px;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.user-identity {
    text-align: center;
    padding-bottom: 25px;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 20px;
}

/* التعديل المتقدم لحاوية الصورة الشخصية */
.avatar-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 15px;
    cursor: pointer;
    border-radius: 50%;
    overflow: visible;
}

.avatar-img, .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary);
    box-shadow: 0 0 20px var(--primary-glow);
    transition: all 0.3s ease;
}

.avatar-placeholder {
    background: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: var(--text-muted);
}

/* طبقة الـ Hover فوق الصورة لتوضيح إمكانية التغيير بالضغط */
.avatar-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(11, 15, 25, 0.75);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    opacity: 0;
    transition: all 0.3s ease;
    border: 3px solid transparent;
}

.avatar-overlay i { font-size: 1.5rem; color: #fff; }
.avatar-overlay span { font-size: 0.75rem; color: #fff; font-weight: 600; }

.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
}

.avatar-wrapper:hover .avatar-img {
    transform: scale(1.02);
}

.level-badge {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gradient-main);
    color: #fff;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    z-index: 2;
}

.user-identity h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin-bottom: 5px; }
.join-date { font-size: 0.85rem; color: var(--text-muted); margin-top: 10px; }

.tab-menu { display: flex; flex-direction: column; gap: 10px; }
.tab-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 12px 20px;
    border-radius: 10px;
    text-align: left;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 12px;
}
.tab-btn i { width: 20px; text-align: center; }
.tab-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }
.tab-btn.active {
    background: var(--primary);
    color: #fff;
    box-shadow: 0 4px 15px var(--primary-glow);
}

.section-title { font-size: 1.8rem; font-weight: 800; margin-bottom: 25px; color: var(--text-main); }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
.stat-card { display: flex; align-items: center; gap: 20px; padding: 20px; }
.stat-icon {
    width: 60px; height: 60px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem;
}
.stat-info h4 { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; margin-bottom: 5px; }
.stat-value { font-size: 1.8rem; font-weight: 800; color: var(--text-main); }

.form-container { max-width: 500px; margin: 0 auto; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-muted); font-size: 0.9rem;}
.input-icon { position: relative; }
.input-icon i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
.input-icon input {
    width: 100%; padding: 12px 15px 12px 45px;
    background: rgba(0,0,0,0.2); border: 1px solid var(--border-light);
    border-radius: 8px; color: var(--text-main); font-size: 1rem;
    transition: all 0.3s;
}
.input-icon input:focus { outline: none; border-color: var(--primary); background: rgba(0,0,0,0.4); box-shadow: 0 0 10px var(--primary-glow); }

.table-responsive { overflow-x: auto; padding: 0; }
.submissions-table { width: 100%; border-collapse: collapse; }
.submissions-table th, .submissions-table td { padding: 15px 20px; text-align: left; border-bottom: 1px solid var(--border-light); }
.submissions-table th { color: var(--text-muted); font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
.submissions-table tbody tr:hover { background: rgba(255,255,255,0.02); }

.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
.status-badge.approved, .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
.status-badge.pending, .status-badge.started { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.status-badge.rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.text-muted { color: var(--text-muted); }
.text-center { text-align: center; }
.mt-3 { margin-top: 15px; }
.mt-5 { margin-top: 30px; }
.mb-3 { margin-bottom: 15px; }
.w-100 { width: 100%; }

.btn-primary { background: var(--gradient-main); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s;}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--primary-glow); }

.btn-competition { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s;}
.btn-competition:hover { box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4); }

.alert-message { padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 600; animation: fadeInDown 0.3s ease; }
.alert-message.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
.alert-message.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from { opacity: 0; transform: translateY(10px); }
.fade-leave-to { opacity: 0; transform: translateY(-10px); }

@keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>