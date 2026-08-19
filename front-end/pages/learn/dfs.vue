<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { initTheme } from '~/assets/script'

// استخدام أداة Nuxt لجلب التوكن بشكل آمن وموثوق
const tokenCookie = useCookie('auth_token');

// --- State Management ---
let answeredCount = 0;
let correctQuizCount = 0;
let sessionPoints = 0;
const totalQuizQuestions = 6; 
let hintsUsed = { 'check': false, 'mark': false, 'recur': false };
let isRunning = false;

// --- متغيرات التنقل الذكي ---
const nextAlgoId = ref(null);
const btnNextText = ref('Go to Dashboard');

// Maze Data: 5 rows, 6 cols. 0=Empty, 1=Wall, 2=Start, 3=End
// Designed to force backtracking (Dead ends)
const mazeLayout = [
    [2, 0, 1, 0, 0, 0],
    [1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 1, 0], // Long path
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 3]
];
const startPos = {r:0, c:0};
const endPos = {r:4, c:5};

// متغيرات رسالة الإشعار
const showToast = ref(false);
const earnedPointsToast = ref(0);

// دالة تشغيل الرسالة العلوية
const triggerToast = (points) => {
    earnedPointsToast.value = points;
    showToast.value = true;
};

// متغيرات الوقت والمساعدة
const timeElapsed = ref(0)
let timerInterval = null
const helpPoints = ref(0) 
const hintsUsedInSession = ref(0) 

// تنسيق الوقت ليظهر بشكل 00:00
const formattedTime = computed(() => {
    const m = Math.floor(timeElapsed.value / 60)
    const s = timeElapsed.value % 60
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
})

// تشغيل وإيقاف المؤقت
const startTimer = () => {
    if (!timerInterval) {
        timerInterval = setInterval(() => { timeElapsed.value++ }, 1000)
    }
}
const stopTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
    }
}

const showQuizModal = ref(false);
const quizEarnedPoints = ref(0);

const handleUnlockPractice = () => {
    // حساب النقاط بناءً على الإجابات الصحيحة
    quizEarnedPoints.value = correctQuizCount * 10;
    // إظهار النافذة المنبثقة
    showQuizModal.value = true;
};

const proceedToPractice = () => {
    // إخفاء النافذة والانتقال للقسم التالي
    showQuizModal.value = false;
    nextStep(2);
};
// تنظيف المؤقت عند الخروج من الصفحة فجأة
onUnmounted(() => { stopTimer() })

// --- دالة التنقل الذكي (للبحث عن الخوارزمية التالية في كل المستويات) ---
async function fetchGlobalNextStep() {
    if (!tokenCookie.value) return;
    try {
        const allAlgos = await $fetch('http://localhost:5000/api/algorithms', {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });

        // ترتيب شامل: حسب رقم المستوى أولاً، ثم حسب المعرف (ID)
        const sorted = allAlgos.sort((a, b) => {
            const lvA = parseInt(a.level.split('_')[1]);
            const lvB = parseInt(b.level.split('_')[1]);
            if (lvA !== lvB) return lvA - lvB;
            return a.id - b.id;
        });

        // البحث عن ترتيب الخوارزمية الحالية (dfs_graph)
        const currentIndex = sorted.findIndex(a => a.algo_id === 'dfs_graph');

        // تحديد الخوارزمية التالية
        if (currentIndex !== -1 && currentIndex < sorted.length - 1) {
            const nextAlgo = sorted[currentIndex + 1];
            nextAlgoId.value = nextAlgo.algo_id;
            
            // التحقق إذا كان الانتقال لمستوى جديد لتغيير نص الزر
            const isNextLevel = nextAlgo.level !== 'level_3';
            btnNextText.value = isNextLevel ? 'Advance to Next Level! 🚀' : 'Start Next Algorithm';
        } else {
            nextAlgoId.value = null;
            btnNextText.value = 'Finish & Go to Map';
        }
    } catch (e) {
        console.error("Error finding next algorithm", e);
    }
}

// --- Init ---
onMounted(async() => {
    initTheme();
    initVisual();
    loadGlobalScore();
    
    // جلب نقاط المساعدة
    if (tokenCookie.value) { 
        try {
            const profile = await $fetch('http://localhost:5000/api/user/profile', {
                headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
            });
            if (profile) helpPoints.value = profile.help_points || 0;
        } catch (e) {
            console.error("Could not fetch help points");
        }
    }

    // 🔥 استدعاء دالة التنقل الذكي
    await fetchGlobalNextStep();
});

// --- Fetch score from backend ---
async function loadGlobalScore() {
    const token = tokenCookie.value;
    if (!token) {
        console.warn("User not logged in.");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/progress', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const scoreDisplay = document.getElementById('score-display');
            if (scoreDisplay) scoreDisplay.innerText = `Score: ${data.totalPoints}`;
        }
    } catch (error) {
        console.error("Error fetching score:", error);
    }
}

function nextStep(step) {
    document.querySelectorAll('.section-view').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    
    document.querySelectorAll('.step-dot').forEach((d, i) => {
        if(i <= step) d.classList.add('active');
        if(i < step) d.classList.add('completed');
    });
    if (step === 1) {startTimer();}
    if(step === 2) {
        setTimeout(showInfo, 500);
    }
}

// --- Quiz Logic ---
function checkAnswer(event, isCorrect) {
    const btn = event.currentTarget;
    if(btn.classList.contains('correct') || btn.classList.contains('wrong')) return;

    const siblings = btn.parentElement.querySelectorAll('.option-btn');
    siblings.forEach(b => b.disabled = true);

    answeredCount++;

    if(isCorrect) {
        btn.classList.add('correct');
        correctQuizCount++;
        sessionPoints += 10;
    } else {
        btn.classList.add('wrong');
        siblings.forEach(b => {
            if(b.textContent.includes('Stack') || b.textContent.includes('finds *a* path') || b.textContent.includes('Returning') || b.textContent.includes('DFS uses more') || b.textContent.includes('Infinite') || b.textContent.includes('DFS (Creates')) {
                b.classList.add('correct');
            }
        });
    }

    document.getElementById('quiz-progress-text').innerText = `${correctQuizCount}/${totalQuizQuestions} Correct`;

    if(answeredCount === totalQuizQuestions) { 
        const btnNext = document.getElementById('btn-to-practice');
        btnNext.disabled = false;
    }
}

// --- Hint Logic ---
function toggleHint(key) {
    if (hintsUsed[key]) return; 

    if (helpPoints.value - hintsUsedInSession.value <= 0) {
        alert('You do not have enough Help Points! 💡 Solve more algorithms to earn them.');
        return;
    }
    
    hintsUsed[key] = true;
    hintsUsedInSession.value++; 
    const hintButton = document.getElementById(`${key}`);
    if (hintButton) {
        hintButton.classList.add('active'); 
    }
    
    const hintElement = document.getElementById(`hint-${key}`);
    if (hintElement) {
        hintElement.style.display = 'inline-block';
    }
}

// --- Visualizer Logic ---
function initVisual() {
    const container = document.getElementById('maze-container');
    container.innerHTML = '';
    
    mazeLayout.forEach((row, r) => {
        row.forEach((cellType, c) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            
            if (cellType === 1) cell.classList.add('wall');
            if (cellType === 2) { cell.classList.add('start'); cell.innerText = 'S'; }
            if (cellType === 3) { cell.classList.add('end'); cell.innerText = 'E'; }
            
            container.appendChild(cell);
        });
    });
}

function resetVisual() {
    isRunning = false;
    initVisual();
    document.getElementById('status-msg').innerText = "Waiting for code...";
    document.getElementById('status-msg').style.color = "var(--text-muted)";
    document.querySelectorAll('.code-input').forEach(i => i.classList.remove('error', 'success'));
}

// --- Modal ---
function showInfo() { document.getElementById('info-modal').style.display = 'flex'; }
function closeInfo() { document.getElementById('info-modal').style.display = 'none'; }

function showSuccess() {
    document.getElementById('final-score').innerText = sessionPoints;
    document.getElementById('success-modal').style.display = 'flex';
    stopTimer();
}

// --- Save progress to backend ---
async function saveAndExit() {
    const token = tokenCookie.value;
    if (!token) {
        alert("Please log in to save your progress.");
        navigateTo('/login');
        return;
    }

    const btn = document.querySelector('#success-modal .btn-primary');
    if(btn) {
        btn.innerText = "Saving...";
        btn.disabled = true;
    }

    try {
        const response = await fetch('http://localhost:5000/api/progress/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                levelId: 'level_3',
                algoId: 'dfs_graph',
                pointsEarned: sessionPoints,
                timeSpent: timeElapsed.value,          
                hintsUsed: hintsUsedInSession.value
            })
        });
        const data = await response.json();

        if (response.ok) {
            // 🔥 مسار التوجيه الذكي
            const performNavigation = () => {
                if (nextAlgoId.value) {
                    navigateTo(`/learn/${nextAlgoId.value}`);
                } else {
                    navigateTo('/learn-path');
                }
            };

            if (data.helpPointsAwarded > 0) {
                triggerToast(data.helpPointsAwarded);
                setTimeout(performNavigation, 2000);
            } else {
                performNavigation();
            }
        } else {
            throw new Error("Failed to save");
        }
    } catch (error) {
        console.error("Error saving progress:", error);
        alert("Connection error. Could not save progress.");
        if(btn) {
            btn.innerHTML = `${btnNextText.value} <i class="fas fa-arrow-right"></i>`;
            btn.disabled = false;
        }
    }
}

// --- The Core: Run Simulation (Recursive DFS) ---
async function runSimulation() {
    if(isRunning) return;
    
    const valCheck = document.getElementById('inp-check').value.replace(/\s/g, ''); 
    const valMark = document.getElementById('inp-mark').value.replace(/\s/g, '');
    const valRecur = document.getElementById('inp-recur').value.replace(/\s/g, '');

    let errors = false;

    if (!valCheck.includes('visited.has(node)')) {
        document.getElementById('inp-check').classList.add('error');
        errors = true;
    } else {
        document.getElementById('inp-check').classList.add('success');
    }

    if (!valMark.includes('visited.add(node)')) {
        document.getElementById('inp-mark').classList.add('error');
        errors = true;
    } else {
        document.getElementById('inp-mark').classList.add('success');
    }

    if (!valRecur.includes('dfs(neighbor)')) {
        document.getElementById('inp-recur').classList.add('error');
        errors = true;
    } else {
        document.getElementById('inp-recur').classList.add('success');
    }

    if(errors) {
        document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Syntax Error! Review logic.</span>`;
        return;
    }

    isRunning = true;
    const status = document.getElementById('status-msg');
    const visited = new Set();
    
    status.innerText = "Starting DFS Adventure...";
    
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    async function dfsRecursive(r, c) {
        if(!isRunning) return false;

        if(r < 0 || c < 0 || r >= 5 || c >= 6 || mazeLayout[r][c] === 1) return false;
        
        const key = `${r},${c}`;
        if(visited.has(key)) return false;

        const cellDiv = document.getElementById(`cell-${r}-${c}`);
        if(mazeLayout[r][c] !== 2 && mazeLayout[r][c] !== 3) {
            cellDiv.classList.add('visiting');
        }
        status.innerText = `Visiting [${r}, ${c}]`;
        await sleep(500);

        if(r === endPos.r && c === endPos.c) {
            status.innerHTML = `<span style="color:#22c55e">Target Found!</span>`;
            return true;
        }

        visited.add(key);
        if(mazeLayout[r][c] !== 2 && mazeLayout[r][c] !== 3) {
            cellDiv.classList.remove('visiting');
            cellDiv.classList.add('visited');
        }

        const dirs = [[0,1], [1,0], [0,-1], [-1,0]];
        
        for(let d of dirs) {
            const found = await dfsRecursive(r + d[0], c + d[1]);
            if(found) {
                if(mazeLayout[r][c] !== 2 && mazeLayout[r][c] !== 3) cellDiv.classList.add('path');
                return true;
            }
        }

        status.innerText = `Dead end at [${r}, ${c}]. Backtracking...`;
        if(mazeLayout[r][c] !== 2 && mazeLayout[r][c] !== 3) {
            cellDiv.classList.remove('visited');
            cellDiv.classList.add('backtrack');
        }
        await sleep(400);
        
        return false;
    }

    const result = await dfsRecursive(startPos.r, startPos.c);

    if(result) {
        status.innerHTML = `<span style="color:#22c55e"><i class="fas fa-trophy"></i> Victory! Path Found.</span>`;
        sessionPoints += 30;
        setTimeout(showSuccess, 1000);
    } else {
        status.innerHTML = "No Path Found.";
    }
    
    isRunning = false;
}
</script>

<style>
/* Base Styles */
body { overflow-y: auto; }
.lesson-wrapper { max-width: 1000px; margin: 100px auto 40px; padding: 0 20px; }

.step-progress { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; }
.step-dot { width: 40px; height: 40px; border-radius: 50%; background: var(--card-bg); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: 0.3s; }
.step-dot.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
.step-dot.completed { background: #22c55e; border-color: #22c55e; color: white;}

.section-view { display: none; animation: fadeIn 0.5s ease; }
.section-view.active { display: block; }

.quiz-container { background: var(--card-bg); border: 1px solid var(--border-light); padding: 40px; border-radius: 16px; }
.question-card { margin-bottom: 30px; border-bottom: 1px solid var(--border-light); padding-bottom: 20px; }
.options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
.option-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; color: var(--text-main); cursor: pointer; text-align: left; transition: 0.2s; }
.option-btn:hover { background: rgba(255,255,255,0.1); }
.option-btn.correct { background: rgba(34, 197, 94, 0.2); border-color: #22c55e; pointer-events: none; }
.option-btn.wrong { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; pointer-events: none; }

.practice-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; position: relative; }
.visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 500px; border: 1px solid var(--border-light); position: relative; }

/* --- DFS MAZE STYLES --- */
.maze-grid {
    display: grid;
    grid-template-columns: repeat(6, 50px);
    grid-template-rows: repeat(5, 50px);
    gap: 5px;
    margin-bottom: 20px;
}

.cell {
    width: 50px; height: 50px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; color: #64748b;
    transition: 0.3s;
    position: relative;
}

.cell.wall { background: #475569; border-color: #64748b; background-image: repeating-linear-gradient(45deg, #334155 0, #334155 5px, #475569 5px, #475569 10px); }
.cell.start { background: #22c55e; color: white; box-shadow: 0 0 15px rgba(34, 197, 94, 0.5); z-index: 2; }
.cell.end { background: #ef4444; color: white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); z-index: 2; }

/* DFS Specific Animations */
.cell.visiting { 
    background: #a855f7; border-color: #c084fc; /* Purple */
    animation: pulse 0.5s infinite;
    z-index: 5;
    color: white;
}
.cell.visited { 
    background: #6366f1; border-color: #818cf8; /* Indigo */
    transition: 0.5s;
}
.cell.backtrack {
    background: #334155; border-color: #475569; /* Grayed out */
    opacity: 0.5;
    transform: scale(0.9);
}
.cell.path { background: #eab308; border-color: #facc15; animation: popIn 0.4s; z-index: 3; color: black; font-weight: bold; }

/* Input & Hints */
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
.hint-text { display: none; font-size: 0.75rem; color: #94a3b8; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; border: 1px solid #334155; margin-left: 5px; animation: fadeIn 0.3s ease; }

.info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: none; align-items: center; justify-content: center; }
.info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
.modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
.score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }

.status-bar { margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }

@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes popIn { from {transform: scale(0.8); opacity: 0;} to {transform: scale(1); opacity: 1;} }
@keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }

/* ================= تنسيقات رسالة الإشعار (Toast) ================= */
.toast-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid #eab308;
    box-shadow: 0 10px 30px rgba(234, 179, 8, 0.2);
    border-radius: 12px;
    padding: 15px 25px;
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 9999;
    backdrop-filter: blur(10px);
}
.toast-icon { font-size: 2rem; color: #eab308; filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.6)); }
.toast-content h4 { color: #eab308; margin: 0 0 5px 0; font-size: 1.1rem; font-weight: bold; }
.toast-content p { color: white; margin: 0; font-size: 0.95rem; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -50px; }
/* تنسيق لجعل خلفية النافذة واضحة وبدون ضبابية */
.clear-overlay {
    background: rgba(0, 0, 0, 0.3) !important; 
    backdrop-filter: none !important; 
}
</style>

<template>
    <nav class="navbar">
        <div class="container">
            <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
            <div class="nav-actions">
                <div class="badge" style="background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid #eab308;" title="Help Points">
                    <i class="fas fa-lightbulb"></i> {{ helpPoints - hintsUsedInSession }}
                </div>
                <div id="score-display" class="badge">Score: 0</div>
            </div>
        </div>
    </nav>

    <div class="lesson-wrapper">
        <div class="step-progress">
            <div class="step-dot active" id="dot-0"><i class="fas fa-book"></i></div>
            <div class="step-dot" id="dot-1"><i class="fas fa-question"></i></div>
            <div class="step-dot" id="dot-2"><i class="fas fa-code"></i></div>
        </div>

        <div id="step-0" class="section-view active">
            <div class="quiz-container" style="text-align: center;">
                <h1 class="gradient-text">Depth-First Search (DFS)</h1>
                <p>The Bold Explorer.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-route" style="font-size: 4rem; color: #a855f7; margin-bottom: 20px;"></i>
                    <p class="text-muted">Go as deep as possible into the maze. If you hit a wall, backtrack and try another path. Uses Recursion (Stack).</p>
                </div>
                <button class="btn-primary" @click="nextStep(1)" style="border: none; cursor: pointer;">Start Final Challenge</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Expert Knowledge Check</h2>
                <p style="margin-bottom: 20px;">6 Questions. The Final Test.</p>
                
                <div class="question-card">
                    <h4>1. Which Data Structure does DFS implicitly use?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Stack (Recursion)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Queue (FIFO)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Hash Table</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. Does DFS guarantee the shortest path?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Yes, always</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">No, it finds *a* path</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Only in weighted graphs</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What is "Backtracking"?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Going forward faster</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Restarting from scratch</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Returning to previous node when stuck</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. Space Complexity of DFS vs BFS on a Deep Graph?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">DFS uses more space (Stack depth)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">BFS uses more space</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">They are equal</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>5. What happens if we don't mark nodes as 'Visited'?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Infinite Loop (Cycles)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Algorithm stops early</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Nothing bad happens</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>6. Which is better for Maze Generation?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">DFS (Creates long winding paths)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">BFS (Creates short paths)</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/6 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled @click="handleUnlockPractice()" style="border: none; cursor: pointer;">Next-></button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <h3 style="margin-bottom: 10px;">Solve Maze (DFS)</h3>
                    <div class="maze-grid" id="maze-container"></div>
                    
                    <div style="display: flex; gap: 20px; font-size: 0.8rem; color: var(--text-muted);">
                        <span><i class="fas fa-square" style="color: #6366f1;"></i> Visited</span>
                        <span><i class="fas fa-square" style="color: #475569;"></i> Backtrack</span>
                        <span><i class="fas fa-square" style="color: #a855f7;"></i> Current</span>
                    </div>

                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Recursive DFS</h4>
                    <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Hint usage: <span style="color:#ef4444">-1 Help Point</span></p>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 2;">
                        <div class="code-line"><span style="color:#c586c0">function</span> dfs(node) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">if</span> (node === target) <span style="color:#c586c0">return</span> <span style="color:#569cd6">true</span>;</div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 1. Check if already visited or wall</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">if</span> ( 
                            <div class="input-wrapper">
                                <input type="text" id="inp-check" class="code-input" placeholder="condition?" autocomplete="off">
                                <button class="hint-btn" id="check" @click="toggleHint('check')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-check">visited.has(node)</span>
                            </div> 
                        ) <span style="color:#c586c0">return</span> <span style="color:#569cd6">false</span>;</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 2. Mark as visited</span></div>
                        <div class="code-line"> &nbsp; 
                            <div class="input-wrapper">
                                <input type="text" id="inp-mark" class="code-input" placeholder="action?" autocomplete="off">
                                <button class="hint-btn" id="mark" @click="toggleHint('mark')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-mark">visited.add(node)</span>
                            </div>
                        ;</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 3. Explore Neighbors Recursively</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">for</span> (<span style="color:#569cd6">let</span> neighbor <span style="color:#c586c0">of</span> getNeighbors(node)) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">if</span> ( 
                            <div class="input-wrapper">
                                <input type="text" id="inp-recur" class="code-input" placeholder="call?" autocomplete="off">
                                <button class="hint-btn" id="recur" @click="toggleHint('recur')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-recur">dfs(neighbor)</span>
                            </div>
                        ) <span style="color:#c586c0">return</span> <span style="color:#569cd6">true</span>;</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">return</span> <span style="color:#569cd6">false</span>; <span style="color:#6a9955">// Backtrack</span></div>
                        <div class="code-line">}</div>
                    </div>

                    <div class="controls" style="margin-top: 20px; display: flex; justify-content: space-between;">
                        <button class="btn-login" @click="resetVisual()" style="cursor: pointer;">Reset</button>
                        <button class="btn-primary" @click="runSimulation()" style="border: none; cursor: pointer;">Run Code <i class="fas fa-play"></i></button>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div class="info-modal" id="info-modal">
        <div class="info-content">
            <i class="fas fa-route fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>DFS Strategy</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                1. <strong>Visit:</strong> Mark current cell as visited.<br>
                2. <strong>Explore:</strong> Recursively call DFS on neighbor (Up, Right, Down, Left).<br>
                3. <strong>Backtrack:</strong> If all neighbors are blocked or visited, return False and step back to try another path.
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Champion! 🏆</div>
            <p>You have completed the algorithm.</p>
            
            <div class="score-circle" id="final-score">0</div>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Total XP Earned</p>

            <button class="btn-primary" style="width: 100%; border: none; cursor: pointer;" @click="saveAndExit()">
                {{ btnNextText }} <i class="fas fa-arrow-right ml-2"></i>
            </button>
        </div>
    </div>
        <!-- نافذة عرض نقاط الكويز -->
<div class="modal-overlay clear-overlay" :style="{ display: showQuizModal ? 'flex' : 'none' }">
    <div class="modal-content" style="max-width: 400px; padding: 30px;">
        <i class="fas fa-check-circle fa-3x" style="color: #22c55e; margin-bottom: 15px; filter: drop-shadow(0 0 10px rgba(34,197,94,0.4));"></i>
        <div class="modal-header gradient-text" style="font-size: 1.5rem;">Great effort! </div>
        <p>Here are the points you earned.</p>
        
        <div class="score-circle" style="width: 80px; height: 80px; font-size: 1.5rem; margin: 15px auto;">
            +{{ quizEarnedPoints }}
        </div>
        <p style="color: var(--text-muted); margin-bottom: 25px;">Points Earned</p>

        <button class="btn-primary" style="width: 100%; border: none; cursor: pointer;" @click="proceedToPractice()">
            Keep Going!
        </button>
    </div>
</div>
    <transition name="slide-down">
        <div v-if="showToast" class="toast-notification">
            <i class="fas fa-star toast-icon"></i>
            <div class="toast-content">
                <h4>Milestone Reached! 🎉</h4>
                <p>You earned <strong>+{{ earnedPointsToast }}</strong> Help Point(s) 💡</p>
            </div>
        </div>
    </transition>
</template>