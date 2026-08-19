<script setup>
import { onMounted } from 'vue'
import { initTheme } from '~/assets/script'

// استخدام أداة Nuxt لجلب التوكن بشكل آمن وموثوق
const tokenCookie = useCookie('auth_token');

// --- State Management ---
        let answeredCount = 0;
        let correctQuizCount = 0;
        let sessionPoints = 0;
        const totalQuizQuestions = 4;
        let isRunning = false;
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
const helpPoints = ref(0) // رصيد الطالب من نقاط المساعدة
const hintsUsedInSession = ref(0) // عدد التلميحات التي استخدمها في هذا الدرس

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

onMounted(async() => {
    initTheme();
    loadGlobalScore();
        // جلب نقاط المساعدة من البروفايل
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
                    if(b.textContent.includes('calls itself') || b.textContent.includes('STOP') || b.textContent.includes('Crash') || b.textContent.includes('5 * Factorial')) {
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

        // --- Visualizer Logic ---
        function resetVisual() {
            isRunning = false;
            document.getElementById('visual-stack').innerHTML = '';
            document.getElementById('status-msg').innerText = "Waiting for code...";
            document.getElementById('status-msg').style.color = "var(--text-muted)";
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
                levelId: 'level_2',
                algoId: 'recursion_basic',
                pointsEarned: sessionPoints,
                timeSpent: timeElapsed.value,          
                hintsUsed: hintsUsedInSession.value
            })
        });
        const data = await response.json();

        if (response.ok) {

            // 🎉 إظهار احتفال إذا ربح نقطة مساعدة جديدة بناءً على إنجازاته
        if (data.helpPointsAwarded > 0) {
            triggerToast(data.helpPointsAwarded);
            setTimeout(() => {
                navigateTo('/learn/merge-sort');
            }, 2000);
           
        } else{
        navigateTo('/learn/merge-sort'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
        } else {
            throw new Error("Failed to save");
        }
    } catch (error) {
        console.error("Error saving progress:", error);
        alert("Connection error. Could not save progress.");
        if(btn) {
            btn.innerHTML = 'Saving... <i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
        }
    }
}

        // --- The Core: Run Simulation ---
        async function runSimulation() {
            if(isRunning) return;
            
            const logicBaseCond = document.getElementById('code-base-cond').value;
            const logicBaseRet = document.getElementById('code-base-ret').value;
            const logicRecur = document.getElementById('code-recur').value;
            
            if(!logicBaseCond || !logicBaseRet || !logicRecur) {
                alert("Please complete the code first!");
                return;
            }

            isRunning = true;
            const stackContainer = document.getElementById('visual-stack');
            const status = document.getElementById('status-msg');
            stackContainer.innerHTML = ''; // Clear

            // --- Phase 1: Winding Up (Calling down) ---
            const startN = 4;
            
            // Check for Infinite Loop Logic
            if(logicRecur === "wrong_inf") {
                status.innerHTML = `<span style="color:#ef4444">Stack Overflow! Calling n * fact(n) never reduces problem size.</span>`;
                isRunning = false;
                return;
            }

            // Simulate correct recursion depth
            let frames = [];
            
            for(let i = startN; i >= 1; i--) {
                if(!isRunning) break;

                // Create Frame
                const frame = document.createElement('div');
                frame.className = 'stack-frame active';
                frame.id = `frame-${i}`;
                frame.innerHTML = `
                    <div class="frame-title">fact(${i})</div>
                    <div class="frame-val" id="val-${i}">Waiting...</div>
                    <div class="frame-result" id="res-${i}"></div>
                `;
                
                // Add Arrow if not first
                if(i < startN) {
                    const arrow = document.createElement('div');
                    arrow.className = 'arrow-connector';
                    arrow.innerHTML = '<i class="fas fa-arrow-right"></i>';
                    stackContainer.appendChild(arrow);
                }
                
                stackContainer.appendChild(frame);
                
                // Logic Check: Base Case
                if (i === 1) {
                    // Base case reached
                    status.innerHTML = `n=1. Base case hit! <span style="color:#eab308">Returning 1</span>`;
                    
                    if(logicBaseCond !== 'correct') {
                        status.innerHTML = `<span style="color:#ef4444">Bug! Wrong base condition. Recursion didn't stop correctly.</span>`;
                        isRunning = false; return;
                    }
                    if(logicBaseRet !== 'correct') {
                        status.innerHTML = `<span style="color:#ef4444">Bug! Base case returned wrong value. Calculation ruined.</span>`;
                        isRunning = false; return;
                    }

                    // Visualize Base Return
                    await new Promise(r => setTimeout(r, 1000));
                    document.getElementById(`val-${i}`).style.display = 'none';
                    const resDiv = document.getElementById(`res-${i}`);
                    resDiv.innerText = "1";
                    resDiv.style.display = 'block';
                    frame.classList.remove('active');
                    frame.classList.add('returning');

                } else {
                    // Recursive Step
                    status.innerHTML = `fact(${i}) calls fact(${i-1})... Paused.`;
                    document.getElementById(`val-${i}`).innerText = `Need fact(${i-1})`;
                    await new Promise(r => setTimeout(r, 800));
                    frame.classList.remove('active'); // Pause this frame
                }
            }

            // --- Phase 2: Unwinding (Returning up) ---
            if(isRunning) {
                let currentVal = 1;
                
                for(let i = 2; i <= startN; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    
                    const frame = document.getElementById(`frame-${i}`);
                    const prevRes = currentVal;
                    
                    frame.classList.add('active'); // Reactivate
                    
                    if(logicRecur === "correct") {
                        currentVal = i * prevRes;
                        status.innerHTML = `Returning: ${i} * ${prevRes} = <span style="color:#22c55e">${currentVal}</span>`;
                    } else if(logicRecur === "wrong_add") {
                        status.innerHTML = `<span style="color:#ef4444">Bug! You added instead of multiplied. Math error.</span>`;
                        isRunning = false; return;
                    }

                    document.getElementById(`val-${i}`).style.display = 'none';
                    const resDiv = document.getElementById(`res-${i}`);
                    resDiv.innerText = currentVal;
                    resDiv.style.display = 'block';
                    
                    frame.classList.remove('active');
                    frame.classList.add('returning');

                    // Remove child frame visually to clear clutter (optional, keeping them shows full chain)
                    // Let's fade out the child to show "popping"
                    const childFrame = document.getElementById(`frame-${i-1}`);
                    if(childFrame) childFrame.classList.add('popped');
                }

                await new Promise(r => setTimeout(r, 1000));
                
                status.innerHTML = `<span style="color:#22c55e"><i class="fas fa-check"></i> Finished! 4! = 24. Level 2 Complete!</span>`;
                sessionPoints += 50;
                setTimeout(showSuccess, 1000);
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
        .question-card:last-child { border-bottom: none; }
        .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .option-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--border-light); padding: 12px; border-radius: 8px; color: var(--text-main); cursor: pointer; text-align: left; transition: 0.2s; }
        .option-btn:hover { background: rgba(255,255,255,0.1); }
        .option-btn.correct { background: rgba(34, 197, 94, 0.2); border-color: #22c55e; pointer-events: none; }
        .option-btn.wrong { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; pointer-events: none; }

        .practice-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; position: relative; }
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 450px; border: 1px solid var(--border-light); position: relative; overflow-x: auto; }
        
        /* --- RECURSION VISUALS --- */
        .call-stack-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 15px;
            padding: 40px 10px;
            width: 100%;
            overflow-x: auto;
        }

        .stack-frame {
            min-width: 100px;
            height: 120px;
            background: #1e293b;
            border: 2px solid #475569;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transition: 0.3s;
        }
        
        /* Matryoshka Effect: Each frame gets smaller/lighter visually or conceptually */
        .stack-frame::before { content: 'FUNCTION CALL'; font-size: 0.6rem; color: #64748b; position: absolute; top: 5px; }
        .stack-frame.active { border-color: #eab308; box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); transform: scale(1.05); z-index: 10; }
        .stack-frame.returning { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
        .stack-frame.popped { animation: fadeOutUp 0.5s forwards; }

        .frame-title { font-weight: bold; color: #fff; margin-bottom: 5px; }
        .frame-val { font-size: 0.9rem; color: #94a3b8; }
        .frame-result { font-size: 1.2rem; color: #22c55e; font-weight: bold; display: none; }
        
        .arrow-connector { font-size: 1.5rem; color: #475569; animation: fadeIn 0.5s; }

        .code-select { background: #2d2d2d; color: #facc15; border: 1px solid #555; padding: 2px 5px; border-radius: 4px; font-family: monospace; cursor: pointer; max-width: 100%; }
        
        .info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
        .modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }

        .status-bar { margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }
        
        @keyframes zoomIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeOutUp { to { transform: translateY(-20px); opacity: 0; } }
        @keyframes popIn { from {transform: scale(0.8); opacity: 0;} to {transform: scale(1); opacity: 1;} }
        /* ================= تنسيقات رسالة الإشعار (Toast) ================= */
.toast-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid #eab308; /* إطار ذهبي */
    box-shadow: 0 10px 30px rgba(234, 179, 8, 0.2);
    border-radius: 12px;
    padding: 15px 25px;
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 9999; /* لضمان ظهورها فوق الـ Navbar */
    backdrop-filter: blur(10px);
}

.toast-icon {
    font-size: 2rem;
    color: #eab308;
    filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.6));
}

.toast-content h4 {
    color: #eab308;
    margin: 0 0 5px 0;
    font-size: 1.1rem;
    font-weight: bold;
}

.toast-content p {
    color: white;
    margin: 0;
    font-size: 0.95rem;
}

/* ================= حركات الظهور والاختفاء (Vue Transition) ================= */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); /* تأثير ارتداد خفيف */
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    top: -50px;
}

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
                <h1 class="gradient-text">Recursion</h1>
                <p>Functions calling themselves until they hit a wall.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-infinity" style="font-size: 4rem; color: #a855f7; margin-bottom: 20px;"></i>
                    <p class="text-muted">Like Matryoshka dolls. Open a doll to find a smaller one inside. Repeat until you reach the smallest doll.</p>
                </div>
                <button class="btn-primary" @click="nextStep(1)" style="border: none; cursor: pointer;">Start Challenge</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Knowledge Check</h2>
                <p style="margin-bottom: 20px;">Think recursively.</p>
                
                <div class="question-card">
                    <h4>1. What defines a Recursive Function?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">It uses a 'for' loop</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">It calls itself</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">It returns null</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. What is the "Base Case"?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">The condition to STOP recursion</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">The first function call</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">The largest input number</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What happens if you forget the Base Case?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">The code runs faster</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">It returns 0 automatically</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Stack Overflow (Crash)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. Factorial(5) is equal to:</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">5 + Factorial(4)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">5 * Factorial(4)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">5 * 5</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/4 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled @click="handleUnlockPractice()" style="border: none; cursor: pointer;">Next-></button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <h3 style="margin-bottom: 10px;">Calculating: Factorial(4)</h3>
                    
                    <div class="call-stack-container" id="visual-stack">
                        </div>

                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Implement Factorial</h4>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 1.8;">
                        <div class="code-line"><span style="color:#c586c0">function</span> factorial(n) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 1. Base Case: Stop at 1</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">if</span> ( <select id="code-base-cond" class="code-select">
                            <option value="" disabled selected>Condition?</option>
                            <option value="correct">n <= 1</option>
                            <option value="wrong_loop">n > 1</option>
                            <option value="wrong_zero">n === 0</option>
                        </select> ) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">return</span> <select id="code-base-ret" class="code-select">
                            <option value="" disabled selected>Value?</option>
                            <option value="wrong_n">n</option>
                            <option value="correct">1</option>
                            <option value="wrong_zero">0</option>
                        </select>;</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 2. Recursive Step</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">return</span> <select id="code-recur" class="code-select">
                            <option value="" disabled selected>Calculation?</option>
                            <option value="wrong_add">n + factorial(n-1)</option>
                            <option value="correct">n * factorial(n-1)</option>
                            <option value="wrong_inf">n * factorial(n)</option>
                        </select>;</div>
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
            <i class="fas fa-history fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>How Recursion Works</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                To calculate 4! (4 * 3 * 2 * 1):
                <br>
                1. Ask: What is 4 * 3!? (Don't know 3! yet, so pause).<br>
                2. Ask: What is 3 * 2!? (Pause).<br>
                3. Ask: What is 2 * 1!? (Pause).<br>
                4. Base Case: 1! is 1. (Return answer up).
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Level 2 Completed!</div>
            <p>You have mastered Recursion & Core Concepts.</p>
            
            <div class="score-circle" id="final-score">0</div>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Total Points Earned</p>

            <button class="btn-primary" style="width: 100%; border: none; cursor: pointer;" @click="saveAndExit()">Advance to Next Level! 🚀 <i class="fas fa-trophy"></i></button>
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