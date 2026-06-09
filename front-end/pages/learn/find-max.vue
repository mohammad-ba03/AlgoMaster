<script setup>
import { onMounted } from 'vue'
import { initTheme } from '~/assets/script'

// استخدام أداة Nuxt لجلب التوكن بشكل آمن وموثوق
const tokenCookie = useCookie('auth_token');

 // --- State Management ---
        let answeredCount = 0;
        let correctQuizCount = 0;
        let sessionPoints = 0;
        const totalQuizQuestions = 3;
        
        const dataArray = [12, 45, 7, 89, 23, 56]; // Max is 89
        const trueMax = 89;
        
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

// تنظيف المؤقت عند الخروج من الصفحة فجأة
onUnmounted(() => { stopTimer() })


onMounted(async () => {
    initTheme();
    initVisual();
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
            if (step === 2) {
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
                    if(b.textContent.includes('Index 0') || b.textContent.includes('current number > max') || b.textContent.includes('O(N)')) {
                        b.classList.add('correct');
                    }
                });
            }

            document.getElementById('quiz-progress-text').innerText = `${correctQuizCount}/${totalQuizQuestions} Correct`;

            if(answeredCount === totalQuizQuestions) { 
                const btnNext = document.getElementById('btn-to-practice');
                btnNext.disabled = false;
                btnNext.innerText = `Unlock Practice (+${correctQuizCount*10} pts)`;
            }
        }

        // --- Visualizer Logic ---
        function initVisual() {
            const container = document.getElementById('visual-array');
            container.innerHTML = '';
            dataArray.forEach((num, index) => {
                const box = document.createElement('div');
                box.className = 'array-box';
                box.id = `box-${index}`;
                // First element is initially assumed max in our logic text, but visually we start clean
                box.innerHTML = `${num} <span class="index-label">${index}</span>`;
                container.appendChild(box);
            });
            document.getElementById('current-max-val').innerText = dataArray[0]; // Logic starts with index 0
        }

        function resetVisual() {
            isRunning = false;
            initVisual();
            document.getElementById('status-msg').innerText = "Waiting for code...";
            document.getElementById('status-msg').style.color = "var(--text-muted)";
            document.getElementById('current-max-val').innerText = dataArray[0];
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
                levelId: 'level_1',
                algoId: 'find_max',
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
                navigateTo('/learn/array-reverse'); // توجيه المستخدم إلى الدرس التالي بعد عرض الرسالة
            }, 2000);
           
        } else{
        navigateTo('/learn/array-reverse'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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
            const logic = document.getElementById('code-logic').value;
            
            if(!logic) {
                alert("Please select a logic condition from the dropdown!");
                return;
            }

            isRunning = true;
            document.getElementById('status-msg').innerText = "Running...";
            
            // Initial State
            let currentMax = dataArray[0];
            document.getElementById('current-max-val').innerText = currentMax;
            
            // Mark first element as current max visually
            document.getElementById(`box-0`).classList.add('is-max');
            await new Promise(r => setTimeout(r, 800));

            // Loop starting from 1
            for (let i = 1; i < dataArray.length; i++) {
                if(!isRunning) break;

                const box = document.getElementById(`box-${i}`);
                const val = dataArray[i];
                
                // Visualize: Currently Checking
                box.classList.add('checking');
                await new Promise(r => setTimeout(r, 800));

                // --- EVALUATE LOGIC ---
                let conditionMet = false;
                let errorMsg = "";

                if (logic === "correct") {
                    conditionMet = (val > currentMax); // Check for Max
                } 
                else if (logic === "wrong_less") {
                    conditionMet = (val < currentMax); // Checks for Min (Logic Error)
                    if(conditionMet) errorMsg = "Bug! You are finding the MINIMUM, not Maximum.";
                }
                else if (logic === "wrong_index") {
                    conditionMet = (i > currentMax); 
                    if(conditionMet) errorMsg = "Bug! Comparing Index with Value.";
                }

                // --- Handle Comparison ---
                if (conditionMet) {
                    // Update Max Visuals
                    if (logic === "correct") {
                        // Remove old max class
                        document.querySelector('.is-max').classList.remove('is-max');
                        
                        currentMax = val;
                        document.getElementById('current-max-val').innerText = currentMax;
                        box.classList.add('is-max');
                        document.getElementById('status-msg').innerHTML = `<span style="color:#a855f7">New Max Found: ${val}</span>`;
                        
                    } else {
                        // Wrong Logic Triggered
                        box.classList.add('wrong-found');
                        document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">${errorMsg}</span>`;
                        
                        // We continue visualizing the error to show them the result of their logic
                        // Remove old max class to show the "new" wrong max
                        const oldMax = document.querySelector('.is-max');
                        if(oldMax) oldMax.classList.remove('is-max');
                        
                        currentMax = val;
                        document.getElementById('current-max-val').innerText = currentMax;
                        box.classList.add('is-max'); // Visually mark it even if wrong logic
                    }
                    await new Promise(r => setTimeout(r, 1000));
                } 

                box.classList.remove('checking');
            }

            // Loop Finished
            if(isRunning) {
                if (logic === "correct") {
                    document.getElementById('status-msg').innerHTML = `<span style="color:#22c55e"><i class="fas fa-check"></i> Finished! Max is ${currentMax}.</span>`;
                    sessionPoints += 30;
                    setTimeout(showSuccess, 1000);
                } else {
                    document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Finished with Wrong Logic. Result: ${currentMax} (Not ${trueMax})</span>`;
                }
            }
            isRunning = false;
        }
</script>

<style>
        /* نفس التنسيقات السابقة تماماً */
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
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 350px; border: 1px solid var(--border-light); position: relative; }
        
        .array-container { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; justify-content: center;}
        .array-box { width: 50px; height: 50px; border: 2px solid #475569; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; border-radius: 8px; transition: 0.3s; position: relative; }
        .array-box.checking { border-color: #eab308; background: rgba(234, 179, 8, 0.1); transform: scale(1.1); box-shadow: 0 0 10px rgba(234, 179, 8, 0.3); }
        .array-box.is-max { border-color: #a855f7; background: #a855f7; color: white; transform: translateY(-10px); box-shadow: 0 5px 15px rgba(168, 85, 247, 0.4); } /* Purple for Max */
        .array-box.wrong-found { border-color: #ef4444; background: #ef4444; color: white; animation: shake 0.5s; }
        
        .index-label { position: absolute; bottom: -25px; font-size: 0.7rem; color: #94a3b8; }

        .code-select {
            background: #2d2d2d; color: #facc15; border: 1px solid #555;
            padding: 2px 5px; border-radius: 4px; font-family: monospace; cursor: pointer;
        }
        .code-select:focus { outline: none; border-color: var(--primary); }

        .info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
        .modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }

        .status-bar { margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }
        
        /* Max Value Display Box */
        .max-value-display {
            margin-bottom: 20px; padding: 10px 20px; 
            background: rgba(168, 85, 247, 0.2); border: 1px solid #a855f7; 
            border-radius: 8px; color: #d8b4fe; font-weight: bold;
        }

        @keyframes shake { 0%, 100% {transform: translateX(0);} 25% {transform: translateX(-5px);} 75% {transform: translateX(5px);} }
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
                <h1 class="gradient-text">Find Maximum</h1>
                <p>Who is the champion of the list?</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-trophy" style="font-size: 4rem; color: #a855f7; margin-bottom: 20px;"></i>
                    <p class="text-muted">Iterate through the array, keeping track of the largest number found "so far".</p>
                </div>
                <button class="btn-primary" style="border: none; cursor: pointer;" @click="nextStep(1)">Start Quiz</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Knowledge Check</h2>
                <p style="margin-bottom: 20px;">Answer correctly to proceed.</p>
                
                <div class="question-card">
                    <h4>1. What is the best initial value for "max" before checking?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">100</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">The first element (Index 0)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">0 (Zero)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. When should we update the "max" value?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">When current number > max</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">When current number < max</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">When current number == max</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What is the Time Complexity?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(1)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(log N)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(N)</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/3 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled @click="nextStep(2)" style="border: none; cursor: pointer;">Go to Code Practice</button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <div class="max-value-display">
                        Current Max: <span id="current-max-val" style="color: white; font-size: 1.2rem;">-</span>
                    </div>
                    
                    <div class="array-container" id="visual-array"></div>
                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Logic Puzzle</h4>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 1.8;">
                        <div class="code-line"><span style="color:#c586c0">function</span> findMax(arr) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> maxVal = arr[0];</div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">for</span> (<span style="color:#569cd6">let</span> i = 1; i < arr.length; i++) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#6a9955">// Check if found a bigger number</span></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">if</span> ( <select id="code-logic" class="code-select">
                            <option value="" disabled selected>Select Logic...</option>
                            <option value="wrong_less">arr[i] < maxVal</option>
                            <option value="correct">arr[i] > maxVal</option>
                            <option value="wrong_index">i > maxVal</option>
                        </select> ) {</div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; maxVal = arr[i]; <span style="color:#6a9955">// Update Max</span></div>
                        <div class="code-line"> &nbsp; &nbsp; }</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">return</span> maxVal;</div>
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
            <i class="fas fa-robot fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>How Find Max Works</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                The robot assumes the first item is the biggest. Then it walks down the line.
                If it sees a number bigger than what it's holding, it drops the old one and picks up the new one.
            </p>
            <ul style="text-align: left; margin: 15px auto; display: inline-block; color: #fff;">
                <li>1. Start with max = arr[0].</li>
                <li>2. Compare with next item.</li>
                <li>3. If new item > max, update max.</li>
            </ul>
            <br>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Level Completed!</div>
            <p>You found the maximum value!</p>
            
            <div class="score-circle" id="final-score">0</div>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Total Points Earned</p>

            <button class="btn-primary" style="width: 100%;border: none; cursor: pointer;" @click="saveAndExit()">Start Next Algorithm <i class="fas fa-arrow-right"></i></button>
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