<template>
    <div class="glowing-lines-container">
        <div class="glow-line line-1"></div>
        <div class="glow-line line-2"></div>
        <div class="glow-line line-3"></div>
    </div>

    <nav class="navbar">
        <div class="container">
            <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
            <div class="nav-actions">
                <button id="theme-toggle" class="icon-btn"><i class="fas fa-sun"></i></button>
                <nuxt-link :to="{name: 'index'}" class="btn-login">Go Back</nuxt-link>
            </div>
        </div>
    </nav>

    <div v-if="isLoading" class="loading-screen">
        <i class="fas fa-spinner fa-spin fa-3x gradient-text"></i>
    </div>

            

    <main v-else class="arena-page">
        <div class="container">
            <div class="arena-header text-center animation-pop">
                <div class="badge mb-3"><i class="fas fa-trophy text-warning"></i> The Arena</div>
                <h1 class="page-title">Global <span class="gradient-text">Tournaments</span></h1>
                <p class="page-desc text-muted">Prove your algorithmic dominance. Compete in real-time and climb the leaderboard.</p>
                
                <div v-if="token" class="user-status mt-4">
                    <span class="level-indicator">Your Rank: Level {{ userLevel }}</span>
                </div>
            </div>

            <div v-if="competitions.length === 0" class="empty-state text-center glass-card">
                <i class="fas fa-ghost fa-3x text-muted mb-3"></i>
                <h3>The Arena is Quiet...</h3>
                <p class="text-muted">Admins are preparing the next big challenge.</p>
            </div>

            <div class="competitions-grid">
                <div v-for="comp in competitions" :key="comp.id" class="comp-card glass-card fade-in" :class="{ 'active-comp': comp.status === 'live' }">
                    <div :class="getStatusClass(comp.status)">{{ comp.status.toUpperCase() }}</div>
                    <div class="comp-icon" :style="{ color: comp.color || '#3b82f6' }">
                        <i class="fas" :class="comp.icon || 'fa-trophy'"></i>
                    </div>
                    <h3>{{ comp.title }}</h3>
                    <p class="text-muted">{{ comp.description }}</p>
                    <div class="comp-meta">
                        <span><i class="fas fa-layer-group"></i> Lvl {{ comp.level_required }}+ Req</span>
                        <span><i class="fas fa-tasks"></i> {{ (comp.questions?.length || 0) + (comp.coding_problems?.length || 0) }} Tasks</span>
                    </div>
                    <div class="comp-actions">
                        <nuxt-link v-if="!token" :to="{name: 'login'}" class="btn-comp outline">Login to Join</nuxt-link>
                        <button v-else-if="userLevel < comp.level_required" class="btn-comp secondary" disabled>
                            <i class="fas fa-lock"></i> Requires Level {{ comp.level_required }}
                        </button>
                        <button v-else-if="enrolledMap[String(comp.id)]" @click="openCompetition(comp)" class="btn-comp started">
                            <i class="fas fa-play"></i> Started
                        </button>
                        <button v-else @click="openCompetition(comp)" class="btn-comp primary">
                            Enter Arena <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <div v-if="selectedCompetition" class="arena-modal-overlay">
        <div class="arena-modal-content animation-pop">
            
            <aside class="arena-sidebar">
    <div class="arena-nav-header" style="justify-content: space-between;">
        <span><i class="fas fa-shield-alt"></i> Session</span>
        <div class="arena-timer" :class="{'critical-time': timeLeft <= 300}">
            <i class="fas fa-stopwatch"></i> {{ formattedTime }}
        </div>
    </div>
    <div class="arena-nav-items custom-scrollbar">
        <button v-for="(q, index) in selectedCompetition.questions" :key="'nav-q-'+index" 
            :class="{ active: currentTaskType === 'theory' && currentTaskIdx === index }"
            @click="setTask('theory', index)">
            <i class="fas fa-question-circle"></i> Theory Q{{ index + 1 }}
            <i v-if="studentAnswers[index]" class="fas fa-check-circle text-success" style="margin-left: auto; font-size: 0.8rem;"></i>
        </button>
        <button v-for="(p, index) in selectedCompetition.coding_problems" :key="'nav-p-'+index"
            :class="{ active: currentTaskType === 'coding' && currentTaskIdx === index }"
            @click="setTask('coding', index)">
            <i class="fas fa-code"></i> Coding P{{ index + 1 }}
        </button>
    </div>
    <div class="arena-sidebar-footer">
        <div class="potential-points mb-2 text-center text-warning" style="font-size: 0.85rem; font-weight: bold;">
            Max Reward: {{ selectedCompetition.max_points || 0 }} XP
        </div>
        <button @click="submitSolution(false)" class="btn-submit-arena">
            <i class="fas fa-paper-plane"></i> Final Submission
        </button>
        <button @click="closeCompetition" class="btn-exit-arena">Exit Arena</button>
    </div>
</aside>

            <main class="arena-workspace">
                <header class="workspace-header">
                    <div class="task-info">
                        <span class="task-type-badge">{{ currentTaskType.toUpperCase() }} Task</span>
                        <h2>Task {{ currentTaskIdx + 1 }}: {{ currentTaskTitle }}</h2>
                    </div>
                </header>

                <div class="workspace-body custom-scrollbar">
                    <div v-if="currentTaskType === 'theory'" class="theory-workspace animation-fade">
                        <div class="question-box">
                            <p class="question-text">{{ activeQuestion.question }}</p>
                            <div class="options-grid">
                                <div v-for="(opt, oIdx) in activeQuestion.options" :key="oIdx" 
                                    class="option-item" 
                                    :class="{ selected: studentAnswers[currentTaskIdx] === opt.text }"
                                    @click="studentAnswers[currentTaskIdx] = opt.text">
                                    <span class="option-marker">{{ String.fromCharCode(65 + oIdx) }}</span>
                                    {{ opt.text }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="currentTaskType === 'coding'" class="coding-workspace animation-fade">
                        <div class="problem-desc">
                            <h3><i class="fas fa-terminal"></i> Problem Prompt</h3>
                            <p>{{ activeProblem.prompt }}</p>
                        </div>
                        <div class="editor-box">
    <client-only>
        <Codemirror
            v-model="studentCodes[currentTaskIdx]"
            :style="{ height: '100%', minHeight: '400px' }"
            :autofocus="true"
            :indent-with-tab="true"
            :extensions="[javascript()]"
        />
    </client-only>
</div>
                    </div>

                    <div v-if="!selectedCompetition.questions?.length && !selectedCompetition.coding_problems?.length" class="placeholder-arena text-center">
                        <div class="icon-wrapper mb-3" :style="{ color: selectedCompetition.color || '#3b82f6' }">
                            <i class="fas fa-laptop-code fa-4x"></i>
                        </div>
                        <h3>Welcome to {{ selectedCompetition.title }}</h3>
                        <p class="text-muted mb-4">No specific questions or coding problems were added by the admin yet.</p>
                    </div>
                </div>
            </main>

        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { javascript } from '@codemirror/lang-javascript'
import '~/assets/learn.css'
import { initTheme } from '~/assets/script'
import { Codemirror } from 'vue-codemirror'
const token = useCookie('auth_token')
const isLoading = ref(true)
const competitions = ref([])
const userLevel = ref(1)
const enrolledMap = ref({})
const timeLeft = ref(0)
const timerInterval = ref(null)

const formattedTime = computed(() => {
    const m = Math.floor(timeLeft.value / 60)
    const s = timeLeft.value % 60
    return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`
})

// Arena Session State
const selectedCompetition = ref(null)
const currentTaskType = ref('theory') // 'theory' or 'coding'
const currentTaskIdx = ref(0)
const studentAnswers = ref([]) // MCQs
const studentCodes = ref([])   // Coding solutions

onMounted(async () => {
    initTheme()
    try {
        const compRes = await $fetch('http://localhost:5000/api/admin/competitions').catch(() => [])
        competitions.value = compRes
        if (token.value) {
            const userRes = await $fetch('http://localhost:5000/api/user/profile', { headers: { 'Authorization': `Bearer ${token.value}` } }).catch(() => null)
            if (userRes) userLevel.value = userRes.current_level || 1
        }
        // load user's submission/enrollment state after competitions are loaded
        await loadUserSubmissions()
    } finally { isLoading.value = false }
})

const openCompetition = async (comp) => {
    try {
        await $fetch('http://localhost:5000/api/submissions/enroll', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token.value}` },
            body: { competitionId: comp.id }
        });
        enrolledMap.value = { ...enrolledMap.value, [String(comp.id)]: 'started' };
    } catch (error) {
        alert(error?.data?.error || 'حدث خطأ أثناء محاولة الدخول للمسابقة.');
        return; 
    }

    selectedCompetition.value = comp;
    studentAnswers.value = new Array(comp.questions?.length || 0).fill(null);
    studentCodes.value = (comp.coding_problems || []).map(p => p.starter_code || '// solve here...');
    
    currentTaskType.value = comp.questions?.length > 0 ? 'theory' : 'coding';
    currentTaskIdx.value = 0;
    document.body.style.overflow = 'hidden';

    // --- تشغيل المؤقت بناءً على وقت المسابقة المعين من الآدمن (أو 60 دقيقة افتراضياً) ---
    timeLeft.value = (comp.time_limit || 60) * 60;
    clearInterval(timerInterval.value);
    timerInterval.value = setInterval(() => {
        if (timeLeft.value > 0) {
            timeLeft.value--;
        } else {
            clearInterval(timerInterval.value);
            alert('Time is up! Your answers are being automatically submitted.');
            submitSolution(true); // إرسال تلقائي
        }
    }, 1000);
}

const loadUserSubmissions = async () => {
    if (!token.value) return
    try {
        const subs = await $fetch('http://localhost:5000/api/submissions/user', { headers: { 'Authorization': `Bearer ${token.value}` } });
        if (Array.isArray(subs)) {
            const map = {};
            subs.forEach(s => {
                if (s.competition_id) map[String(s.competition_id)] = s.status || 'started';
            });
            enrolledMap.value = map;
        }
    } catch (e) { console.warn('Could not load user submissions', e) }
}

// load submissions after initial data
onMounted(() => { loadUserSubmissions() })
const setTask = (type, idx) => {
    currentTaskType.value = type
    currentTaskIdx.value = idx
}

const activeQuestion = computed(() => selectedCompetition.value?.questions?.[currentTaskIdx.value] || {})
const activeProblem = computed(() => selectedCompetition.value?.coding_problems?.[currentTaskIdx.value] || {})
const currentTaskTitle = computed(() => currentTaskType.value === 'theory' ? 'Conceptual Check' : 'Implementation Challenge')

const submitSolution = async (isAuto = false) => {
    if (!isAuto && !confirm('Are you sure you want to finalize your submission? You cannot change your answers after this.')) return
    
    clearInterval(timerInterval.value); // إيقاف العداد عند التسليم

    // حساب الوقت المستغرق الفعلي (بالثواني)
    const totalTimeSeconds = (selectedCompetition.value.time_limit || 60) * 60;
    const timeSpent = totalTimeSeconds - timeLeft.value;

    try {
        const payload = JSON.stringify({
            mcq_results: studentAnswers.value,
            code_results: studentCodes.value
        })
        await $fetch(`http://localhost:5000/api/submissions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token.value}` },
            body: { 
                competitionId: selectedCompetition.value.id,
                submittedCode: payload,
                executionTime: timeSpent // <--- إرسال الوقت المستغرق للسيرفر
            }
        })
        alert(isAuto ? 'Solutions auto-submitted successfully.' : 'Your solutions have been sent to the Grand Masters for review!')
        closeCompetition()
    } catch (err) { 
        alert('Submission error. Please check your connection.') 
        console.error(err);
    }
}

const closeCompetition = () => {
    selectedCompetition.value = null
    document.body.style.overflow = 'auto'
    clearInterval(timerInterval.value); // إيقاف العداد
}

const getStatusClass = (status) => status === 'live' ? 'comp-status live' : status === 'ongoing' ? 'comp-status ongoing' : 'comp-status upcoming'
</script>

<style scoped>
/* =========================================
   1. Base & Layout Styles (Original)
   ========================================= */
.loading-screen { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-body); }
.arena-page { min-height: 100vh; background: var(--bg-body); padding: 120px 0 80px; position: relative; z-index: 1;}

.navbar { position: fixed; top: 0; width: 100%; padding: 18px 0; background: var(--bg-nav); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-light); z-index: 1000; }
.container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.navbar .container { display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 1.5rem; font-weight: 800; color: var(--text-main); text-decoration: none; letter-spacing: -0.5px; }
.logo span { color: var(--primary); }
.nav-actions { display: flex; align-items: center; gap: 24px; }
.icon-btn { background: none; border: none; color: var(--text-muted); font-size: 1.1rem; cursor: pointer; padding: 8px; border-radius: 50%; }
.icon-btn:hover { color: var(--text-main); background: var(--card-bg); }
.btn-login { color: var(--text-main); background: var(--btn); text-decoration: none; font-weight: 600; padding: 6px 24px; border-radius: 20px; border: 1px solid var(--border-light); font-size: 0.9rem; cursor: pointer;}
.btn-login:hover { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }

/* Background Glowing Lines */
.glowing-lines-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; pointer-events: none; }
.glow-line { position: absolute; background: linear-gradient(to bottom, transparent, var(--primary), transparent); width: 1px; height: 300px; opacity: 0; animation: glowingDrop 8s infinite linear; }
.line-1 { left: 20%; animation-delay: 0s; animation-duration: 7s; }
.line-2 { left: 50%; animation-delay: 3s; animation-duration: 9s; width: 2px; background: linear-gradient(to bottom, transparent, #a248ec, transparent); }
.line-3 { left: 80%; animation-delay: 1.5s; animation-duration: 8s; }
@keyframes glowingDrop { 0% { top: -300px; opacity: 0; } 20% { opacity: 0.3; box-shadow: 0 0 15px var(--primary); } 80% { opacity: 0.3; } 100% { top: 100vh; opacity: 0; } }

/* Header */
.arena-header { margin-bottom: 60px; }
.page-title { font-size: 3.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 20px; letter-spacing: -1px;}
.page-desc { font-size: 1.15rem; max-width: 600px; margin: 0 auto; }
.level-indicator { background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 8px 24px; border-radius: 20px; font-weight: bold; border: 1px solid var(--primary-glow); font-size: 1rem;}
.badge { display: inline-block; background: rgba(99, 102, 241, 0.1); padding: 8px 16px; border-radius: 100px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border: 1px solid var(--border-light);}

/* Competition Cards */
.competitions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
.glass-card { background: var(--card-bg); border: 1px solid var(--border-light); border-radius: 16px; padding: 30px; backdrop-filter: blur(12px); display: flex; flex-direction: column; position: relative; overflow: hidden; transition: 0.3s;}
.comp-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.2);}
.active-comp { border-color: rgba(239, 68, 68, 0.3); box-shadow: 0 10px 30px rgba(239, 68, 68, 0.05); }

.comp-status { position: absolute; top: 20px; right: 20px; font-size: 0.75rem; font-weight: 800; padding: 5px 12px; border-radius: 20px; letter-spacing: 1px; }
.comp-status.live { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); animation: pulse 2s infinite; }
.comp-status.upcoming { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
.comp-status.ongoing { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }

.comp-icon { font-size: 2.5rem; margin-bottom: 20px; }
.comp-card h3 { font-size: 1.5rem; color: var(--text-main); margin-bottom: 12px; }
.comp-card p { font-size: 0.95rem; margin-bottom: 25px; flex-grow: 1; }
.comp-meta { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 25px; padding-top: 15px; border-top: 1px solid var(--border-light); }

/* Buttons */
.comp-actions { margin-top: auto; }
.btn-comp { width: 100%; padding: 14px; border-radius: 8px; font-weight: bold; text-align: center; cursor: pointer; text-decoration: none; display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s; font-size: 1rem;}
.btn-comp.primary { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; border: none; }
.btn-comp.primary:hover { box-shadow: 0 5px 20px rgba(239, 68, 68, 0.4); transform: scale(1.02);}
/* Started button style (green) */
.btn-comp.started { background: linear-gradient(135deg, #10b981 0%, #22c55e 100%); color: white; border: none; }
.btn-comp.started:hover { box-shadow: 0 5px 20px rgba(16,185,129,0.25); transform: scale(1.02);}
.btn-comp.secondary { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border-light); cursor: not-allowed; }
.btn-comp.outline { background: transparent; color: var(--text-main); border: 1px solid var(--border-light); }
.btn-comp.outline:hover { background: rgba(255,255,255,0.05); border-color: var(--text-main); }

/* Utilities */
.text-center { text-align: center; }
.text-muted { color: var(--text-muted); }
.text-warning { color: #facc15; }
.text-success { color: #22c55e; }
.mb-3 { margin-bottom: 15px; }
.mb-4 { margin-bottom: 20px; }
.mt-4 { margin-top: 25px; }


/* =========================================
   2. Arena Session Modal Styles (New UI)
   ========================================= */
.arena-modal-overlay { 
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
    background: rgba(0,0,0,0.9); z-index: 9999; display: flex; 
    align-items: center; justify-content: center; backdrop-filter: blur(10px); 
}
.arena-modal-content { 
    width: 95vw; height: 90vh; background: #0f172a; 
    border: 1px solid #334155; border-radius: 16px; 
    display: flex; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); 
}

/* Sidebar Navigation */
.arena-sidebar { width: 280px; background: #1e293b; border-right: 1px solid #334155; display: flex; flex-direction: column; }
.arena-nav-header { padding: 25px; font-weight: 800; font-size: 1.2rem; color: #3b82f6; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 10px; }
.arena-nav-items { flex: 1; padding: 15px; overflow-y: auto; }
.arena-nav-items button { 
    width: 100%; text-align: left; padding: 12px 15px; background: none; border: none; 
    color: #94a3b8; border-radius: 8px; margin-bottom: 8px; transition: 0.3s; 
    cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 0.95rem; 
}
.arena-nav-items button:hover { background: rgba(255,255,255,0.05); color: white; }
.arena-nav-items button.active { background: #3b82f6; color: white; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }

.arena-sidebar-footer { padding: 20px; border-top: 1px solid #334155; display: flex; flex-direction: column; gap: 12px; }
.btn-submit-arena { background: #22c55e; color: white; padding: 14px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1rem; }
.btn-submit-arena:hover { background: #16a34a; transform: translateY(-2px); }
.btn-exit-arena { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s; }
.btn-exit-arena:hover { background: #ef4444; color: white; }

/* Main Workspace */
.arena-workspace { flex: 1; display: flex; flex-direction: column; background: #020617; position: relative; }
.workspace-header { padding: 25px 40px; border-bottom: 1px solid #334155; background: rgba(30, 41, 59, 0.5); }
.task-info { display: flex; flex-direction: column; gap: 8px; }
.task-type-badge { background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; width: fit-content; text-transform: uppercase; letter-spacing: 1px; }
.workspace-header h2 { color: white; margin: 0; font-size: 1.5rem; }
.workspace-body { flex: 1; padding: 40px; overflow-y: auto; }

/* Theory Styling (MCQs) */
.theory-workspace { max-width: 900px; margin: 0 auto; }
.question-box { padding: 40px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; }
.question-text { font-size: 1.4rem; color: white; margin-bottom: 35px; font-weight: 500; line-height: 1.5; }
.options-grid { display: grid; gap: 15px; }
.option-item { 
    background: #0f172a; border: 1px solid #334155; padding: 20px 25px; 
    border-radius: 12px; cursor: pointer; transition: 0.3s; display: flex; 
    align-items: center; gap: 20px; color: #cbd5e1; font-size: 1.1rem; 
}
.option-item:hover { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); color: white; }
.option-item.selected { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.option-marker { width: 35px; height: 35px; background: #334155; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold; color: white; flex-shrink: 0; }
.selected .option-marker { background: #22c55e; box-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }

/* Coding Workspace */
.coding-workspace { display: flex; flex-direction: column; gap: 20px; height: 100%; }
.problem-desc { padding: 25px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; }
.problem-desc h3 { margin-bottom: 12px; color: #3b82f6; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; margin-top:0; }
.problem-desc p { color: #cbd5e1; line-height: 1.6; margin: 0; font-size: 1.05rem; }
.editor-box { flex: 1; border: 1px solid #334155; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; background: #0f172a; }

.placeholder-arena { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }

/* Scrollbars & Animations */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-body); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

.animation-pop { animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
.animation-fade { animation: fadeIn 0.3s ease; }
.fade-in { animation: fadeIn 0.5s ease; }

@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

.arena-timer {
    background: rgba(0,0,0,0.3);
    padding: 6px 12px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 1.1rem;
    color: #4ade80;
    border: 1px solid #22c55e;
    transition: all 0.3s ease;
}
.arena-timer.critical-time {
    color: #ef4444;
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
    animation: pulse 1s infinite;
}
</style>