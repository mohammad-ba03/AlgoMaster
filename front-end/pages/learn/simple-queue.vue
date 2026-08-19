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
                    if(b.textContent.includes('First In') || b.textContent.includes('Enqueue') || b.textContent.includes('A')) {
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
            document.getElementById('queue-container').innerHTML = '';
            document.getElementById('status-msg').innerText = "Waiting for code...";
            document.getElementById('status-msg').style.color = "var(--text-muted)";
            document.getElementById('printer').classList.remove('printing');
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
                algoId: 'simple_queue',
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
                navigateTo('/learn/insertion-sort');
            }, 2000);
           
        } else{
        navigateTo('/learn/insertion-sort'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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
            
            const logicEnq = document.getElementById('code-enq').value;
            const logicDeq = document.getElementById('code-deq').value;
            const logicFront = document.getElementById('code-front').value;
            
            if(!logicEnq || !logicDeq || !logicFront) {
                alert("Please fill in all blanks!");
                return;
            }

            isRunning = true;
            const status = document.getElementById('status-msg');
            const queueContainer = document.getElementById('queue-container');
            const printer = document.getElementById('printer');

            // Simulation Sequence
            const actions = [
                { type: 'enq', name: 'Report.pdf', icon: 'fa-file-pdf' },
                { type: 'enq', name: 'Img.jpg', icon: 'fa-file-image' },
                { type: 'deq' }, // Should print Report
                { type: 'enq', name: 'Notes.txt', icon: 'fa-file-alt' },
                { type: 'deq' }  // Should print Img
            ];

            let logicValid = true;
            if(logicEnq !== 'correct' || logicDeq !== 'correct' || logicFront !== 'correct') logicValid = false;

            // Step through actions
            for (let act of actions) {
                if(!isRunning) break;

                if (act.type === 'enq') {
                    status.innerText = `Enqueue: ${act.name}`;
                    
                    if (logicEnq === "wrong_unshift") {
                        status.innerHTML = `<span style="color:#ef4444">Bug! 'unshift' adds to Front. Not a Queue!</span>`;
                        isRunning = false; return;
                    } else if (logicEnq === "wrong_pop") {
                        status.innerHTML = `<span style="color:#ef4444">Bug! 'pop' removes items. Can't add!</span>`;
                        isRunning = false; return;
                    }

                    // Visual Enqueue
                    const file = document.createElement('div');
                    file.className = 'file-item';
                    file.innerHTML = `<i class="fas ${act.icon}"></i> ${act.name}`;
                    queueContainer.appendChild(file); // Adds to end (Right side visually due to flex)
                    
                    await new Promise(r => setTimeout(r, 1000));

                } else if (act.type === 'deq') {
                    status.innerText = "Printing (Dequeue)...";
                    
                    if (logicDeq === "wrong_pop") {
                        status.innerHTML = `<span style="color:#ef4444">Bug! 'pop' takes from Back (Stack). Printer starved!</span>`;
                        isRunning = false; return;
                    }

                    // Check if empty
                    if (queueContainer.children.length === 0) {
                        status.innerHTML = `<span style="color:#eab308">Queue Underflow (Empty)!</span>`;
                    } else {
                        // Visual Dequeue
                        const frontFile = queueContainer.firstElementChild; // The one at left
                        
                        // Check Logic Front
                        if (logicFront === "wrong_last") {
                             status.innerHTML = `<span style="color:#eab308">Warning: peek() is looking at the wrong end!</span>`;
                             await new Promise(r => setTimeout(r, 1000));
                        }

                        // Animate
                        frontFile.classList.add('printing-anim');
                        printer.classList.add('printing');
                        
                        await new Promise(r => setTimeout(r, 800));
                        
                        frontFile.remove();
                        printer.classList.remove('printing');
                    }
                }
            }

            if(isRunning) {
                status.innerHTML = `<span style="color:#22c55e"><i class="fas fa-check"></i> Jobs Done! Queue Processed.</span>`;
                sessionPoints += 40;
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
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; border: 1px solid var(--border-light); position: relative; overflow: hidden; }
        
        /* --- QUEUE VISUALIZER STYLES --- */
        
        .printer-zone {
            display: flex;
            align-items: center;
            width: 100%;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 0 20px;
        }

        .printer-machine {
            width: 80px; height: 80px;
            background: #334155;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            flex-direction: column;
            border: 2px solid #475569;
            position: relative;
            z-index: 10;
        }
        .printer-machine i { font-size: 2.5rem; color: #94a3b8; }
        .printer-machine.printing { animation: printShake 0.5s infinite; border-color: #22c55e; }
        .printer-machine.printing i { color: #22c55e; }

        .queue-track {
            flex-grow: 1;
            height: 100px;
            border-bottom: 2px dashed #475569;
            margin-left: 20px;
            display: flex;
            align-items: center;
            justify-content: flex-start; /* Items start from left (Front) */
            padding-right: 20px;
            gap: 10px;
            position: relative;
        }
        .queue-track::after {
            content: "FRONT (Dequeue)"; position: absolute; left: 0; bottom: -25px; font-size: 0.7rem; color: #64748b;
        }
        .queue-track::before {
            content: "REAR (Enqueue)"; position: absolute; right: 0; bottom: -25px; font-size: 0.7rem; color: #64748b;
        }

        .file-item {
            width: 60px; height: 70px;
            background: #fff;
            border-radius: 5px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #0f172a; font-weight: bold; font-size: 0.8rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            position: relative;
            transition: all 0.5s ease;
            animation: slideInRight 0.5s ease-out;
        }
        .file-item i { font-size: 1.5rem; color: var(--primary); margin-bottom: 5px; }
        .file-item.printing-anim { animation: flyToPrinter 0.8s forwards; }

        .code-select { background: #2d2d2d; color: #facc15; border: 1px solid #555; padding: 2px 5px; border-radius: 4px; font-family: monospace; cursor: pointer; max-width: 100%; }
        
        .info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
        .modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }

        .status-bar { margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }
        
        @keyframes slideInRight { from { transform: translateX(50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes flyToPrinter { to { transform: translateX(-120px) scale(0.5); opacity: 0; } }
        @keyframes printShake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
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
                <h1 class="gradient-text">Simple Queue</h1>
                <p>First In, First Out (FIFO). Like a line at a coffee shop.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-print" style="font-size: 4rem; color: #3b82f6; margin-bottom: 20px;"></i>
                    <p class="text-muted">Files enter the queue from the back (Enqueue) and print from the front (Dequeue).</p>
                </div>
                <button class="btn-primary" @click="nextStep(1)" style="border: none; cursor: pointer;">Start Quiz</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Knowledge Check</h2>
                <p style="margin-bottom: 20px;">Understand the Flow.</p>
                
                <div class="question-card">
                    <h4>1. What does FIFO mean?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">First In, First Out</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Fast In, Fast Out</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">File In, File Out</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. Which operation adds an item to the BACK?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Dequeue</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Enqueue</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Pop</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. If you Enqueue A, then B, then C. Which prints first?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">A</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">B</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">C</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/3 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled @click="handleUnlockPractice()" style="border: none; cursor: pointer;">Next-></button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <div class="printer-zone">
                        <div class="printer-machine" id="printer">
                            <i class="fas fa-print"></i>
                            <span style="font-size:0.6rem; color:#ccc; margin-top:5px;">PRINTER</span>
                        </div>
                        
                        <div class="queue-track" id="queue-container">
                            </div>
                    </div>

                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Implement Queue</h4>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 1.8;">
                        <div class="code-line"><span style="color:#c586c0">class</span> Queue {</div>
                        <div class="code-line"> &nbsp; constructor() { <span style="color:#569cd6">this</span>.items = []; }</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#dcdcaa">enqueue</span>(item) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#6a9955">// Add to the end (Rear)</span></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#569cd6">this</span>.items.<select id="code-enq" class="code-select">
                            <option value="" disabled selected>Method?</option>
                            <option value="correct">push(item)</option>
                            <option value="wrong_unshift">unshift(item)</option>
                            <option value="wrong_pop">pop()</option>
                        </select>;</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#dcdcaa">dequeue</span>() {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#6a9955">// Remove from the front</span></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">return</span> <span style="color:#569cd6">this</span>.items.<select id="code-deq" class="code-select">
                            <option value="" disabled selected>Method?</option>
                            <option value="wrong_pop">pop()</option>
                            <option value="correct">shift()</option>
                            <option value="wrong_splice">splice()</option>
                        </select>;</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#dcdcaa">peek</span>() {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">return</span> <span style="color:#569cd6">this</span>.items[<select id="code-front" class="code-select">
                            <option value="" disabled selected>Index?</option>
                            <option value="correct">0</option>
                            <option value="wrong_last">this.items.length-1</option>
                        </select>];</div>
                        <div class="code-line"> &nbsp; }</div>
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
            <i class="fas fa-people-arrows fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>Queue Logic</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                Just like a line at the supermarket.
                <br><br>
                1. <strong>Enqueue</strong>: Join the line at the back. (JavaScript: `push`)<br>
                2. <strong>Dequeue</strong>: The person at the front leaves. (JavaScript: `shift`)
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Excellent Work!</div>
            <p>You kept the printer running smoothly.</p>
            
            <div class="score-circle" id="final-score">0</div>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Total Points Earned</p>

            <button class="btn-primary" style="width: 100%; border: none; cursor: pointer;" @click="saveAndExit()">Start Next Algorithm <i class="fas fa-arrow-right"></i></button>
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