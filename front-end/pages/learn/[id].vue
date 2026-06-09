<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { initTheme } from '~/assets/script'

const route = useRoute()
const router = useRouter()
const tokenCookie = useCookie('auth_token')

// --- State Management ---
const algoData = ref(null)
const currentStep = ref(0)
const sessionPoints = ref(0)
const helpPoints = ref(0)
const hintsUsedInSession = ref(0)

// --- ✅ تعريف المتغيرات التي كانت تسبب خطأ ---
const levelAlgorithms = ref([]) 
const nextAlgoId = ref(null)
const nextBtnText = ref('Finish & Go to Map')

// Quiz State
const quizAnswers = ref({})
const isQuizPassed = computed(() => {
    if (!algoData.value?.quiz) return false
    const total = algoData.value.quiz.length
    const correct = Object.values(quizAnswers.value).filter(a => a === true).length
    return correct === total
})

// Code State
const userCodeInputs = ref({})
const codeErrors = ref({})
const codeSuccess = ref({})
const hintsUsed = ref({})
const isSimulationRunning = ref(false)
const visualStatus = ref('Waiting for code...')

// Timer
const timeElapsed = ref(0)
let timerInterval = null

// Modals & Toasts
const showInfoModal = ref(false)
const showSuccessModal = ref(false)
const showToast = ref(false)
const earnedPointsToast = ref(0)

// --- جلب البيانات الأولي مع Nuxt ---
const { data: fetchedData, pending: isLoading } = await useAsyncData(`algo-${route.params.id}`, () =>
    $fetch(`http://localhost:5000/api/algorithms/${route.params.id}`, {
        headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
    })
)

// مراقبة الرابط للانتقال بين الخوارزميات بدون Reload
watch(() => route.params.id, async (newId) => {
    if (newId) {
        algoData.value = null; // تصفير البيانات لإظهار شاشة التحميل
        await fetchAlgorithmData(); 
        currentStep.value = 0; 
    }
});

onMounted(async () => {
    initTheme()
    await fetchUserProfile()
    await fetchAlgorithmData(); 
})

onUnmounted(() => { stopTimer() })

const fetchUserProfile = async () => {
    if (!tokenCookie.value) return
    try {
        const profile = await $fetch('http://localhost:5000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        })
        if (profile) helpPoints.value = profile.help_points || 0
    } catch (e) { console.error("Could not fetch profile", e) }
}

// --- Navigation & Timer ---
const nextStep = (step) => {
    currentStep.value = step
    if (step === 1) startTimer()
    if (step === 2) setTimeout(() => showInfoModal.value = true, 500)
}

const startTimer = () => {
    if (!timerInterval) timerInterval = setInterval(() => { timeElapsed.value++ }, 1000)
}
const stopTimer = () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// --- Quiz Logic ---
const checkQuizAnswer = (qIndex, isCorrect, oIndex) => {
    if (quizAnswers.value[qIndex] !== undefined) return;
    quizAnswers.value[qIndex] = isCorrect;
    quizAnswers.value['selected_'+qIndex] = oIndex;
    if (isCorrect) sessionPoints.value += 10;
}

// --- جلب سياق المستوى لتحديد الخوارزمية التالية ---
const fetchLevelContext = async (levelId) => {
    try {
        const allAlgos = await $fetch(`http://localhost:5000/api/algorithms`, {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        })
        levelAlgorithms.value = allAlgos.filter(a => a.level === levelId)
    } catch (e) {
        console.error("Error fetching level context", e)
    }
}

const fetchAlgorithmData = async () => {
    try {
        const response = await $fetch(`http://localhost:5000/api/algorithms/${route.params.id}`, {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });
        
        const data = response.payload ? { ...response, ...response.payload } : response;
        algoData.value = data;

        await fetchLevelContext(data.level);
        await fetchNavigationLogic(); 

        userCodeInputs.value = {};
        if (data.practice?.codeLines) {
            data.practice.codeLines.forEach((line, index) => {
                if (line.isBlank) userCodeInputs.value[index] = '';
            });
        }
    } catch (error) {
        console.error("Fetch error:", error);
        router.push('/learn-path');
    }
};

const fetchNavigationLogic = async () => {
    try {
        const allAlgos = await $fetch(`http://localhost:5000/api/algorithms`, {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        })

        const sortedAlgos = allAlgos.sort((a, b) => {
            const levelA = parseInt(a.level.split('_')[1])
            const levelB = parseInt(b.level.split('_')[1])
            if (levelA !== levelB) return levelA - levelB
            return a.id - b.id 
        })

        const currentIndex = sortedAlgos.findIndex(a => a.algo_id === route.params.id)

        if (currentIndex !== -1 && currentIndex < sortedAlgos.length - 1) {
            const nextAlgo = sortedAlgos[currentIndex + 1]
            nextAlgoId.value = nextAlgo.algo_id
            
            if (nextAlgo.level !== algoData.value.level) {
                nextBtnText.value = 'Advance to Next Level! 🚀'
            } else {
                nextBtnText.value = 'Start Next Algorithm'
            }
        } else {
            nextAlgoId.value = null
            nextBtnText.value = 'Finish & Go to Map'
        }
    } catch (e) {
        console.error("Navigation logic error", e)
    }
}

// --- Hints Logic ---
const toggleHint = (hintIndex) => {
    if (hintsUsed.value[hintIndex]) return
    if (helpPoints.value - hintsUsedInSession.value <= 0) {
        alert('You do not have enough Help Points! 💡 Solve more algorithms to earn them.')
        return
    }
    hintsUsed.value[hintIndex] = true
    hintsUsedInSession.value++
}

const getHintText = (index) => {
    if (!algoData.value?.practice?.hints) return 'No specific hint'
    return algoData.value.practice.hints[Math.min(index, algoData.value.practice.hints.length - 1)]
}

// --- Simulation Logic ---
const runSimulation = async () => {
    if (isSimulationRunning.value) return
    isSimulationRunning.value = true
    visualStatus.value = 'Compiling and checking syntax...'

    let hasErrors = false
    codeErrors.value = {}
    codeSuccess.value = {}

    algoData.value.practice.codeLines.forEach((line, index) => {
        if (line.isBlank) {
            const userInput = (userCodeInputs.value[index] || '').replace(/\s/g, '')
            const correctAnswer = (line.correctAnswer || '').replace(/\s/g, '')
            
            if (userInput !== correctAnswer) {
                hasErrors = true
                codeErrors.value[index] = true
            } else {
                codeSuccess.value[index] = true
            }
        }
    })

    if (hasErrors) {
        visualStatus.value = `<span style="color:#ef4444">Syntax Error! Review your code inputs.</span>`
        isSimulationRunning.value = false
        return
    }

    visualStatus.value = `<span style="color:#22c55e">Code Correct! Running Simulation...</span>`
    await triggerVisualizerAnimation(algoData.value.visual_pattern)

    sessionPoints.value += 50
    setTimeout(() => {
        showSuccessModal.value = true
        stopTimer()
    }, 1500)
    
    isSimulationRunning.value = false
}

const triggerVisualizerAnimation = async (pattern) => {
    return new Promise(resolve => {
        if (pattern === 'crypto') {
            visualStatus.value = `<span style="color:#3b82f6">Encrypting: ${algoData.value.practice.initialState} ➔ ${algoData.value.practice.targetState}</span>`
            setTimeout(resolve, 2000)
        } else {
            visualStatus.value = `<span style="color:#3b82f6">Executing Pattern: ${pattern}...</span>`
            setTimeout(resolve, 1500)
        }
    })
}

const saveAndExit = async () => {
    if (!tokenCookie.value) { router.push('/login'); return; }
    try {
        await $fetch('http://localhost:5000/api/progress/update', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` },
            body: {
                levelId: algoData.value.level,
                algoId: algoData.value.algo_id,
                pointsEarned: sessionPoints.value,
                timeSpent: timeElapsed.value,          
                hintsUsed: hintsUsedInSession.value
            }
        })

        if (nextAlgoId.value) {
            router.push(`/learn/${nextAlgoId.value}`)
            // Reset local states for the next algo
            currentStep.value = 0
            showSuccessModal.value = false
            quizAnswers.value = {}
            userCodeInputs.value = {}
            codeErrors.value = {}
            codeSuccess.value = {}
            hintsUsed.value = {}
            timeElapsed.value = 0
        } else {
            router.push('/learn-path')
        }
    } catch (error) {
        console.error("Error saving progress:", error)
        router.push('/learn-path')
    }
}
</script>

<style scoped>
/* التنسيقات ثابتة كما هي في طلبك السابق */
body { overflow-y: auto; }
.lesson-wrapper { max-width: 1000px; margin: 100px auto 40px; padding: 0 20px; }
.loading-state { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-size: 1.2rem; }
.step-progress { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; }
.step-dot { width: 40px; height: 40px; border-radius: 50%; background: var(--card-bg); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: 0.3s; }
.step-dot.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
.step-dot.completed { background: #22c55e; border-color: #22c55e; color: white;}
.section-view { animation: fadeIn 0.5s ease; }
.quiz-container { background: var(--card-bg); border: 1px solid var(--border-light); padding: 40px; border-radius: 16px; }
.question-card { margin-bottom: 30px; border-bottom: 1px solid var(--border-light); padding-bottom: 20px; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
.option-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; color: var(--text-main); cursor: pointer; text-align: left; transition: 0.2s; }
.option-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
.option-btn.correct { background: rgba(34, 197, 94, 0.2) !important; border-color: #22c55e !important; pointer-events: none; }
.option-btn.wrong { background: rgba(239, 68, 68, 0.2) !important; border-color: #ef4444 !important; pointer-events: none; }
.practice-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; position: relative; }
.visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 500px; border: 1px solid var(--border-light); position: relative; }
.visual-engine-crypto { display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; gap: 30px; width: 100%;}
.crypto-box { background: rgba(255,255,255,0.05); padding: 20px 40px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); font-family: monospace; font-size: 2rem; letter-spacing: 5px; color: white; text-align: center; }
.crypto-target { border-color: var(--primary); color: var(--primary); text-shadow: 0 0 15px rgba(86,88,245,0.5); }
.input-wrapper { display: inline-flex; align-items: center; gap: 5px; position: relative; width: auto; }
.code-input {
    background: transparent; border: none; border-bottom: 1px solid #777;
    color: #eab308; font-family: 'Consolas', monospace; font-size: 0.9rem;
    width: 140px; text-align: center; outline: none; transition: 0.3s;
}
.code-input:focus { border-bottom-color: var(--primary); }
.code-input.error { border-bottom-color: #ef4444; color: #ef4444; }
.code-input.success { border-bottom-color: #22c55e; color: #22c55e; }
.hint-btn { background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 0.9rem; transition: 0.3s; padding: 2px; }
.hint-btn:hover { color: #fff; }
.hint-btn.active { color: #eab308; pointer-events: none; }
.hint-text { font-size: 0.75rem; color: #94a3b8; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; margin-left: 5px; animation: fadeIn 0.3s ease; }
.info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
.modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
.score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }
.status-bar { margin-top: auto; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }
.btn-primary { background: var(--primary); color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
.btn-primary:hover:not(:disabled) { box-shadow: 0 0 15px var(--primary-glow); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-login { background: transparent; border: 1px solid #777; color: white; padding: 10px 20px; border-radius: 8px; transition: 0.3s; }
.btn-login:hover { background: rgba(255,255,255,0.1); }
@keyframes popIn { from {transform: scale(0.8); opacity: 0;} to {transform: scale(1); opacity: 1;} }
@keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }
.toast-notification { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.95); border: 1px solid #eab308; box-shadow: 0 10px 30px rgba(234, 179, 8, 0.2); border-radius: 12px; padding: 15px 25px; display: flex; align-items: center; gap: 15px; z-index: 9999; backdrop-filter: blur(10px); }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -50px; }
</style>

<template>
    <div v-if="isLoading || !algoData" class="loading-state">
        <i class="fas fa-spinner fa-spin fa-3x mb-3" style="color: var(--primary)"></i>
        <h2>Loading Algorithm Matrix...</h2>
    </div>

    <div v-else>
        <nav class="navbar">
            <div class="container">
                <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
                <div class="nav-actions">
                    <div class="badge" style="background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid #eab308;" title="Help Points">
                        <i class="fas fa-lightbulb"></i> {{ helpPoints - hintsUsedInSession }}
                    </div>
                </div>
            </div>
        </nav>

        <div class="lesson-wrapper">
            <div class="step-progress">
                <div class="step-dot" :class="{'active': currentStep === 0, 'completed': currentStep > 0}" id="dot-0"><i class="fas fa-book"></i></div>
                <div class="step-dot" :class="{'active': currentStep === 1, 'completed': currentStep > 1}" id="dot-1"><i class="fas fa-question"></i></div>
                <div class="step-dot" :class="{'active': currentStep === 2, 'completed': currentStep > 2}" id="dot-2"><i class="fas fa-code"></i></div>
            </div>

            <div v-if="currentStep === 0" class="section-view active">
                <div class="quiz-container" style="text-align: center;">
                    <h1 class="gradient-text">{{ algoData.title }}</h1>
                    <p>Algorithm ID: {{ algoData.algo_id }}</p>
                    <div style="margin: 40px 0;">
                        <i :class="['fas', algoData.icon || 'fa-brain']" style="font-size: 4rem; color: #3b82f6; margin-bottom: 20px;"></i>
                        <p class="text-muted">{{ algoData.description }}</p>
                    </div>
                    <button class="btn-primary" @click="nextStep(1)">Start Challenge</button>
                </div>
            </div>

            <div v-if="currentStep === 1" class="section-view active">
                <div class="quiz-container">
                    <h2>Expert Knowledge Check</h2>
                    <p style="margin-bottom: 20px;">{{ algoData.quiz?.length || 0 }} Questions. Theory Verification.</p>
                    <div v-for="(q, qIndex) in algoData.quiz" :key="qIndex" class="question-card">
                        <h4>{{ qIndex + 1 }}. {{ q.question }}</h4>
                        <div class="options-grid">
                            <button v-for="(opt, oIndex) in q.options" :key="oIndex" 
                                    class="option-btn" 
                                    :class="{
                                        'correct': (quizAnswers[qIndex] !== undefined && opt.isCorrect),
                                        'wrong': quizAnswers[qIndex] === false && quizAnswers['selected_'+qIndex] === oIndex
                                    }"
                                    :disabled="quizAnswers[qIndex] !== undefined"
                                    @click="checkQuizAnswer(qIndex, opt.isCorrect, oIndex)">
                                {{ opt.text }}
                            </button>
                        </div>
                    </div>
                    <div id="quiz-status" style="margin-top:20px; text-align:right;">
                        <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">
                            {{ Object.values(quizAnswers).filter(a => a === true).length }}/{{ algoData.quiz?.length || 0 }} Correct
                        </span>
                        <button class="btn-primary" id="btn-to-practice" :disabled="!isQuizPassed" @click="nextStep(2)">
                            {{ isQuizPassed ? `Unlock Practice (+${Object.values(quizAnswers).filter(a => a === true).length * 10} pts)` : 'Complete Quiz to Continue' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="currentStep === 2" class="section-view active">
                <div class="practice-layout">
                    <button @click="showInfoModal = true" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                    <div class="visual-panel">
                        
                        <div v-if="algoData.visual_pattern === 'crypto'" class="visual-engine-crypto">
                            <div style="color: #94a3b8; font-size: 0.8rem;">Initial State</div>
                            <div class="crypto-box">{{ algoData.practice?.initialState || 'DATA' }}</div>
                            <i class="fas fa-arrow-down fa-2x" style="color: #475569"></i>
                            <div style="color: #94a3b8; font-size: 0.8rem;">Target Goal</div>
                            <div class="crypto-box crypto-target">{{ algoData.practice?.targetState || 'SECRET' }}</div>
                        </div>
                        
                        <div v-else class="visual-engine-crypto" style="text-align: center; color: #64748b; margin: auto;">
                            <i class="fas fa-eye fa-4x mb-3"></i>
                            <p>Visual Engine: {{ algoData.visual_pattern || 'Array' }}</p>
                        </div>
                        <div class="status-bar" v-html="visualStatus"></div>
                    </div>

                    <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                        <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Implement The Algorithm</h4>
                        <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 2;">
                            <div v-for="(line, index) in algoData.practice?.codeLines" :key="index" class="code-line">
                                <template v-if="line.isBlank">
                                    <span>&nbsp; {{ line.text }} </span>
                                    <div class="input-wrapper">
    <input v-if="!line.blankType || line.blankType === 'input'" 
           type="text" v-model="userCodeInputs[index]" 
           class="code-input" :class="{'error': codeErrors[index], 'success': codeSuccess[index]}" 
           autocomplete="off" placeholder="type here...">
    
    <select v-else-if="line.blankType === 'select'" 
            v-model="userCodeInputs[index]" 
            class="code-input" :class="{'error': codeErrors[index], 'success': codeSuccess[index]}"
            style="background: #1e293b; color: #eab308; border: 1px solid #475569; border-radius: 4px; font-family: 'Consolas', monospace; outline: none; padding: 2px 5px; cursor: pointer;">
        <option value="" disabled selected>Select code...</option>
        <option v-for="(opt, oIdx) in line.options" :key="oIdx" :value="opt" style="background: #0f172a; color: white;">
            {{ opt }}
        </option>
    </select>

    <button v-if="!hintsUsed[index]" class="hint-btn" @click="toggleHint(index)"><i class="fas fa-lightbulb"></i></button>
    <span v-else class="hint-text">{{ getHintText(index) }}</span>
</div>
                                    <span>;</span>
                                </template>
                                <template v-else>
                                    <span>&nbsp; <span style="color:#569cd6">{{ line.text.split(' ')[0] }}</span> {{ line.text.substring(line.text.indexOf(' ') + 1) }}</span>
                                </template>
                            </div>
                        </div>
                        <div class="controls" style="margin-top: 20px; display: flex; justify-content: space-between;">
                            <button class="btn-login" @click="visualStatus = 'Waiting for code...'; codeErrors = {}; codeSuccess = {};">Reset</button>
                            <button class="btn-primary" @click="runSimulation" :disabled="isSimulationRunning">Run Code <i class="fas fa-play"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showInfoModal" class="info-modal" @click.self="showInfoModal = false">
            <div class="info-content">
                <i class="fas fa-info-circle fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
                <h3>Algorithm Strategy</h3>
                <button class="btn-primary" @click="showInfoModal = false">Got it!</button>
            </div>
        </div>

        <div v-if="showSuccessModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header gradient-text">Logic Mastered!</div>
                <div class="score-circle">{{ sessionPoints }}</div>
                <button class="btn-primary" style="width: 100%;" @click="saveAndExit">
                    {{ nextBtnText }} <i class="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    </div>
</template>