<script setup>
import { onMounted } from 'vue'
import { initTheme } from '~/assets/script'

// استخدام أداة Nuxt لجلب التوكن بشكل آمن وموثوق
const tokenCookie = useCookie('auth_token');

// --- State Management ---
        let answeredCount = 0;
        let correctQuizCount = 0;
        let sessionPoints = 0;
        const totalQuizQuestions = 5; // Updated to 5
        
        // SORTED Array
        const dataArray = [4, 8, 15, 16, 23, 30, 42, 50, 65, 71, 88];
        const targetValue = 42;
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

onMounted(async() => {
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
                    if(b.textContent.includes('SORTED') || b.textContent.includes('Low = Mid + 1') || b.textContent.includes('O(log N)') || b.textContent.includes('miss the last element') || b.textContent.includes('5 checks')) {
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
                
                // Labels (Low/High/Mid)
                const lblLow = document.createElement('div');
                lblLow.className = 'ptr-label ptr-low'; lblLow.id = `ptr-low-${index}`; lblLow.innerText = 'L';
                
                const lblHigh = document.createElement('div');
                lblHigh.className = 'ptr-label ptr-high'; lblHigh.id = `ptr-high-${index}`; lblHigh.innerText = 'H';
                
                const lblMid = document.createElement('div');
                lblMid.className = 'ptr-label ptr-mid'; lblMid.id = `ptr-mid-${index}`; lblMid.innerText = 'Mid';

                box.innerHTML = `${num} <span class="index-label">${index}</span>`;
                box.appendChild(lblLow); box.appendChild(lblHigh); box.appendChild(lblMid);
                container.appendChild(box);
            });
        }

        function resetVisual() {
            isRunning = false;
            initVisual();
            document.getElementById('status-msg').innerText = "Waiting for code...";
            document.getElementById('status-msg').style.color = "var(--text-muted)";
        }

        function updatePointers(low, high, mid) {
            document.querySelectorAll('.array-box').forEach((box, i) => {
                box.classList.remove('active-range', 'discarded', 'mid-point');
                document.getElementById(`ptr-low-${i}`).style.opacity = '0';
                document.getElementById(`ptr-high-${i}`).style.opacity = '0';
                document.getElementById(`ptr-mid-${i}`).style.opacity = '0';

                if (i < low || i > high) {
                    box.classList.add('discarded');
                } else {
                    box.classList.add('active-range');
                }
            });

            if (low < dataArray.length && low >=0) document.getElementById(`ptr-low-${low}`).style.opacity = '1';
            if (high >= 0 && high < dataArray.length) document.getElementById(`ptr-high-${high}`).style.opacity = '1';
            
            if (mid !== null && mid >= 0 && mid < dataArray.length) {
                 const midBox = document.getElementById(`box-${mid}`);
                 midBox.classList.remove('active-range');
                 midBox.classList.add('mid-point');
                 document.getElementById(`ptr-mid-${mid}`).style.opacity = '1';
            }
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
                algoId: 'binary_search',
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
                navigateTo('/learn/valid-parentheses');
            }, 2000);
           
        } else{
        navigateTo('/learn/valid-parentheses'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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

        // --- The Core: Run Simulation (Updated for 3 Inputs) ---
        async function runSimulation() {
            if(isRunning) return;
            
            const logicLoop = document.getElementById('code-loop').value;
            const logicRight = document.getElementById('code-right').value; // When arr[mid] < target
            const logicLeft = document.getElementById('code-left').value;  // When arr[mid] > target
            
            if(!logicLoop || !logicRight || !logicLeft) {
                alert("Please fill in ALL the blanks!");
                return;
            }

            isRunning = true;
            document.getElementById('status-msg').innerText = "Running Binary Search...";
            
            let low = 0;
            let high = dataArray.length - 1;
            let steps = 0;

            // Loop logic based on user selection
            while (true) {
                if(!isRunning) break;
                if(steps > 10) { // Safety break for infinite loops
                     document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Infinite Loop detected! Check your pointer updates.</span>`;
                     isRunning = false; return;
                }
                steps++;

                // Evaluate Loop Condition
                let conditionMet = false;
                if(logicLoop === "correct") conditionMet = (low <= high);
                else if(logicLoop === "wrong_strict") conditionMet = (low < high);
                else if(logicLoop === "wrong_reverse") conditionMet = (low >= high);

                if(!conditionMet) {
                     if(low > high && logicLoop === "correct") {
                        // Correct termination
                     } else {
                        // Premature or wrong termination
                     }
                     break; 
                }

                // Calculate Mid
                let mid = Math.floor((low + high) / 2);
                
                // Visualize
                updatePointers(low, high, mid);
                document.getElementById('status-msg').innerHTML = `Range [${low}-${high}]. Mid: <span style="color:#eab308; font-weight:bold">${dataArray[mid]}</span>`;
                
                await new Promise(r => setTimeout(r, 1200));

                // Check Found
                if (dataArray[mid] === targetValue) {
                    document.getElementById(`box-${mid}`).classList.add('found');
                    document.getElementById('status-msg').innerHTML = `<span style="color:#22c55e"><i class="fas fa-check"></i> Found 42 at index ${mid}!</span>`;
                    
                    if(logicLoop === "correct" && logicRight === "correct" && logicLeft === "correct") {
                        sessionPoints += 50; // Higher points for harder code
                        setTimeout(showSuccess, 1000);
                    } else {
                         document.getElementById('status-msg').innerHTML += ` <span style="color:#eab308">(But logic was shaky!)</span>`;
                    }
                    isRunning = false;
                    return;
                }

                // Update Logic based on User Input
                if (dataArray[mid] < targetValue) {
                    // Target is Greater (Should go Right)
                     document.getElementById('status-msg').innerText = `${dataArray[mid]} < 42. Need to go Right...`;
                     await new Promise(r => setTimeout(r, 800));

                     if(logicRight === "correct") {
                         low = mid + 1; 
                     } else if(logicRight === "wrong_dir") { // high = mid - 1
                         high = mid - 1; // Wrong way
                     } else if(logicRight === "wrong_inf") { // low = mid
                         low = mid; // Potential infinite loop if high is close
                     }
                } else {
                    // Target is Smaller (Should go Left)
                     document.getElementById('status-msg').innerText = `${dataArray[mid]} > 42. Need to go Left...`;
                     await new Promise(r => setTimeout(r, 800));

                     if(logicLeft === "correct") {
                         high = mid - 1;
                     } else if(logicLeft === "wrong_dir") { // low = mid + 1
                         low = mid + 1; // Wrong way
                     } else if(logicLeft === "wrong_inf") { // high = mid
                         high = mid; // Potential infinite loop
                     }
                }
            }
            
            // If loop finishes without finding (should not happen for 42 if logic is correct)
            if(isRunning) {
                 document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Loop finished. Target lost or logic incorrect.</span>`;
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
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; border: 1px solid var(--border-light); position: relative; }
        
        .array-container { display: flex; gap: 5px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center; min-height: 80px; }
        
        .array-box { 
            width: 50px; height: 50px; 
            border: 2px solid #475569; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 1.1rem; font-weight: bold; border-radius: 6px; 
            transition: 0.4s ease; position: relative;
            background: #1e293b;
        }

        .array-box.discarded { opacity: 0.15; border-color: #333; transform: scale(0.9); filter: grayscale(100%); }
        .array-box.active-range { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .array-box.mid-point { border-color: #eab308; background: #eab308; color: black; transform: scale(1.15); z-index: 10; box-shadow: 0 0 15px rgba(234, 179, 8, 0.5); }
        .array-box.found { border-color: #22c55e; background: #22c55e; color: white; transform: scale(1.2); z-index: 10; }

        .ptr-label {
            position: absolute; top: -30px; font-size: 0.7rem; font-weight: bold;
            padding: 2px 5px; border-radius: 3px; opacity: 0; transition: 0.3s;
        }
        .ptr-low { background: #3b82f6; color: white; left: -5px; }
        .ptr-high { background: #3b82f6; color: white; right: -5px; }
        .ptr-mid { background: #eab308; color: black; top: 55px; left: 50%; transform: translateX(-50%); }

        .index-label { position: absolute; bottom: -20px; font-size: 0.6rem; color: #64748b; opacity: 0.5; }

        .code-select { background: #2d2d2d; color: #facc15; border: 1px solid #555; padding: 2px 5px; border-radius: 4px; font-family: monospace; cursor: pointer; max-width: 100%; }
        .code-select:focus { outline: none; border-color: var(--primary); }

        .info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
        .modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }

        .status-bar { margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }
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
                <h1 class="gradient-text">Binary Search</h1>
                <p>Divide and Conquer. The fastest way to search.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-book-open" style="font-size: 4rem; color: #3b82f6; margin-bottom: 20px;"></i>
                    <p class="text-muted">Like finding a word in a dictionary. Open the middle, see if the word is before or after, then throw away half the book.</p>
                </div>
                <button class="btn-primary" @click="nextStep(1)" style="border: none; cursor: pointer;">Start Quiz</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Knowledge Check (Hard Mode)</h2>
                <p style="margin-bottom: 20px;">Prove you understand the algorithm deeply.</p>
                
                <div class="question-card">
                    <h4>1. What is the REQUIRED condition for Binary Search?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">The list must be small</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">The list must be SORTED</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">The list must contain numbers only</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. If Target (50) is greater than Mid (30), which pointer moves?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Low = Mid + 1</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">High = Mid - 1</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Mid = Low + 1</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What is the Time Complexity?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N^2)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(log N)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. What happens if the loop condition is (low < high) instead of (low <= high)?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">It works perfectly</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">It might miss the last element</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">It causes an infinite loop</button>
                    </div>
                </div>

                 <div class="question-card">
                    <h4>5. If the list has 16 items, what is the max number of checks?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">16 checks</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">8 checks</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">5 checks (log2(16) + 1)</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/5 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled @click="nextStep(2)" style="border: none; cursor: pointer;">Go to Code Practice</button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <h3 style="margin-bottom: 10px;">Target: <span style="color: #22c55e;">42</span></h3>
                    <div class="array-container" id="visual-array"></div>
                    
                    <div style="display: flex; gap: 20px; font-size: 0.9rem; color: var(--text-muted);">
                        <span><i class="fas fa-square" style="color: #3b82f6;"></i> Active Range</span>
                        <span><i class="fas fa-square" style="color: #eab308;"></i> Middle Page</span>
                        <span><i class="fas fa-square" style="color: #333;"></i> Discarded</span>
                    </div>

                    <div class="status-bar" id="status-msg">Waiting for complete code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Complete the Logic</h4>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 1.8; font-size: 0.9rem;">
                        <div class="code-line"><span style="color:#c586c0">function</span> binarySearch(arr, target) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> low = 0, high = arr.length - 1;</div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">while</span> ( 
                            <select id="code-loop" class="code-select">
                                <option value="" disabled selected>Condition?</option>
                                <option value="correct">low <= high</option>
                                <option value="wrong_strict">low < high</option>
                                <option value="wrong_reverse">low >= high</option>
                            </select> 
                        ) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#569cd6">let</span> mid = Math.floor((low + high) / 2);</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">if</span> (arr[mid] === target) <span style="color:#c586c0">return</span> mid;</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">if</span> (arr[mid] < target) {</div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; <span style="color:#6a9955">// Target is bigger (Go Right)</span></div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; <select id="code-right" class="code-select">
                            <option value="" disabled selected>Update Low?</option>
                            <option value="wrong_dir">high = mid - 1;</option>
                            <option value="correct">low = mid + 1;</option>
                            <option value="wrong_inf">low = mid;</option>
                        </select></div>
                        <div class="code-line"> &nbsp; &nbsp; } <span style="color:#c586c0">else</span> {</div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; <span style="color:#6a9955">// Target is smaller (Go Left)</span></div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; <select id="code-left" class="code-select">
                            <option value="" disabled selected>Update High?</option>
                            <option value="correct">high = mid - 1;</option>
                            <option value="wrong_dir">low = mid + 1;</option>
                            <option value="wrong_inf">high = mid;</option>
                        </select></div>
                        <div class="code-line"> &nbsp; &nbsp; }</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">return</span> -1;</div>
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
            <i class="fas fa-search fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>How Binary Search Works</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                Because the list is <strong>Sorted</strong>, we can eliminate half the possibilities in every step.
                <br><br>
                1. Pick the middle element.<br>
                2. Is it the target? Great!<br>
                3. Too small? Look in the Right half (Update Low).<br>
                4. Too big? Look in the Left half (Update High).
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Level 2 Started!</div>
            <p>You mastered the Binary Search Logic.</p>
            
            <div class="score-circle" id="final-score">0</div>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Total Points Earned</p>

            <button class="btn-primary" style="width: 100%; border: none; cursor: pointer;" @click="saveAndExit()">Start Next Algorithm <i class="fas fa-arrow-right"></i></button>
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