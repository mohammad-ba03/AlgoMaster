<script setup>
import { onMounted } from 'vue'
import { initTheme } from '~/assets/script'

// استخدام أداة Nuxt لجلب التوكن بشكل آمن وموثوق
const tokenCookie = useCookie('auth_token');
// --- State Management ---
        let answeredCount = 0;
        let correctQuizCount = 0;
        let sessionPoints = 0; // Starts at 0, builds up
        const totalQuizQuestions = 6; 
        let hintsUsed = { base: false, mid: false, merge: false };
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
                    if(b.textContent.includes('O(N log N)') || b.textContent.includes('O(N)') || b.textContent.includes('Divide') || b.textContent.includes('<= 1') || b.textContent.includes('Yes') || b.textContent.includes('merging step')) {
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

        // --- Hint Logic (New) ---

function toggleHint(key) {
  if (hintsUsed[key]) return; // إذا كان مفتوحاً مسبقاً، لا تفعل شيئاً
  
    // 1. التحقق من الرصيد
    if (helpPoints.value - hintsUsedInSession.value <= 0) {
        alert('You do not have enough Help Points! 💡 Solve more algorithms to earn them.');
        return;
    }
    // 2. تفعيل التلميح
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
        function createArrayGroup(nums, isSorted=false) {
            const group = document.createElement('div');
            group.className = `array-group ${isSorted ? 'sorted-group' : ''}`;
            nums.forEach(n => {
                const box = document.createElement('div');
                box.className = 'num-box';
                box.innerText = n;
                group.appendChild(box);
            });
            return group;
        }

        function initVisual() {
            const container = document.getElementById('tree-container');
            container.innerHTML = '';
            
            const level1 = document.createElement('div');
            level1.className = 'tree-level active-level';
            level1.id = 'level-1';
            level1.appendChild(createArrayGroup([38, 27, 43, 3]));
            container.appendChild(level1);
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
                algoId: 'merge_sort',
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
                navigateTo('/learn/quick-sort');
            }, 2000);
           
        } else{
        navigateTo('/learn/quick-sort'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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
            
            const valBase = document.getElementById('inp-base').value.replace(/\s/g, ''); 
            const valMid = document.getElementById('inp-mid').value.replace(/\s/g, '');
            const valMerge = document.getElementById('inp-merge').value.replace(/\s/g, '');

            let errors = false;

            // Validate Base Case
            if (!valBase.includes('length<=1') && !valBase.includes('length<2')) {
                document.getElementById('inp-base').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-base').classList.add('success');
            }

            // Validate Mid
            if (!valMid.includes('length/2')) {
                document.getElementById('inp-mid').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-mid').classList.add('success');
            }

            // Validate Merge
            if (valMerge !== 'merge') {
                document.getElementById('inp-merge').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-merge').classList.add('success');
            }

            if(errors) {
                document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Syntax Error! Check your logic.</span>`;
                return;
            }

            isRunning = true;
            const container = document.getElementById('tree-container');
            const status = document.getElementById('status-msg');
            
            status.innerText = "Splitting array...";
            
            // --- Level 2 (Split) ---
            await new Promise(r => setTimeout(r, 1000));
            const level2 = document.createElement('div');
            level2.className = 'tree-level';
            level2.innerHTML = '';
            level2.appendChild(createArrayGroup([38, 27]));
            level2.appendChild(createArrayGroup([43, 3]));
            container.appendChild(level2);
            setTimeout(() => level2.classList.add('active-level'), 50);

            // --- Level 3 (Split again) ---
            await new Promise(r => setTimeout(r, 1000));
            const level3 = document.createElement('div');
            level3.className = 'tree-level';
            level3.innerHTML = '';
            level3.appendChild(createArrayGroup([38]));
            level3.appendChild(createArrayGroup([27]));
            level3.appendChild(createArrayGroup([43]));
            level3.appendChild(createArrayGroup([3]));
            container.appendChild(level3);
            setTimeout(() => level3.classList.add('active-level'), 50);
            
            status.innerHTML = `<span style="color:#eab308">Base Case Reached! Merging back up...</span>`;

            // --- Merge Step 1 ---
            await new Promise(r => setTimeout(r, 1500));
            level2.innerHTML = ''; 
            const g1 = createArrayGroup([27, 38], true); 
            const g2 = createArrayGroup([3, 43], true);  
            g1.classList.add('merging'); g2.classList.add('merging');
            level2.appendChild(g1);
            level2.appendChild(g2);
            level3.style.opacity = '0.2'; 

            // --- Merge Step 2 ---
            await new Promise(r => setTimeout(r, 1500));
            const level1 = document.getElementById('level-1');
            level1.innerHTML = '';
            const gFinal = createArrayGroup([3, 27, 38, 43], true);
            gFinal.classList.add('merging');
            level1.appendChild(gFinal);
            level2.style.opacity = '0.2';

            status.innerHTML = `<span style="color:#22c55e"><i class="fas fa-check"></i> Array Sorted Successfully!</span>`;
            sessionPoints += 50; 
            setTimeout(showSuccess, 1000);
            
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
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 500px; border: 1px solid var(--border-light); position: relative; overflow-y: auto; }
        
        /* --- VISUALIZER STYLES (Tree) --- */
        .tree-level { display: flex; gap: 40px; margin-bottom: 30px; transition: 0.5s; opacity: 0.3; justify-content: center; width: 100%; }
        .tree-level.active-level { opacity: 1; transform: scale(1.05); }
        
        .array-group { display: flex; gap: 2px; border: 1px solid #475569; padding: 3px; border-radius: 4px; background: rgba(255,255,255,0.05); transition: 0.5s; }
        .array-group.merging { border-color: #eab308; box-shadow: 0 0 10px rgba(234, 179, 8, 0.3); }
        .array-group.sorted-group { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }

        .num-box { 
            width: 30px; height: 30px; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 0.9rem; font-weight: bold; color: white; background: #334155; 
            border-radius: 2px;
        }

        /* --- CODE INPUT & HINTS STYLES --- */
        .input-wrapper { display: inline-flex; align-items: center; gap: 5px; position: relative; }
        
        .code-input {
            background: transparent; border: none; border-bottom: 1px solid #777;
            color: #eab308; font-family: 'Consolas', monospace; font-size: 1rem;
            width: 100px; text-align: center; outline: none; transition: 0.3s;
        }
        .code-input:focus { border-bottom-color: var(--primary); }
        .code-input.error { border-bottom-color: #ef4444; color: #ef4444; }
        .code-input.success { border-bottom-color: #22c55e; color: #22c55e; }

        .hint-btn {
            background: transparent; border: none; color: #64748b;
            cursor: pointer; font-size: 0.9rem; transition: 0.3s;
            padding: 2px;
        }
        .hint-btn:hover { color: #fff; }
        .hint-btn.active { color: #eab308; text-shadow: 0 0 10px rgba(234, 179, 8, 0.5); pointer-events: none; }

        .hint-text {
            display: none; font-size: 0.75rem; color: #94a3b8;
            background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px;
            border: 1px solid #334155; margin-left: 5px;
            animation: fadeIn 0.3s ease; font-family: sans-serif;
        }

        .info-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 2000; display: none; align-items: center; justify-content: center; }
        .info-content { background: #1e293b; padding: 30px; border-radius: 16px; max-width: 500px; text-align: center; border: 1px solid var(--primary); animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 2000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .modal-content { background: #1e293b; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center; border: 1px solid var(--border-light); animation: popIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); position: relative; }
        .modal-header { font-size: 1.8rem; margin-bottom: 15px; font-weight: bold; }
        .score-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--gradient-main); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; margin: 20px auto; box-shadow: 0 0 30px var(--primary-glow); }

        .status-bar { margin-top: 15px; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2); width: 100%; text-align: center; font-size: 0.9rem; min-height: 40px; display: flex; align-items: center; justify-content: center; }
        @keyframes popIn { from {transform: scale(0.8); opacity: 0;} to {transform: scale(1); opacity: 1;} }
        @keyframes fadeIn { from {opacity: 0;} to {opacity: 1;} }
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
                <h1 class="gradient-text">Merge Sort</h1>
                <p>Divide. Conquer. Combine.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-columns" style="font-size: 4rem; color: #a855f7; margin-bottom: 20px;"></i>
                    <p class="text-muted">A highly efficient, stable sorting algorithm. It splits the list into individual elements and merges them back in order.</p>
                </div>
                <button class="btn-primary" @click="nextStep(1)" style="border: none; cursor: pointer;">Start Challenge (Hard)</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Expert Knowledge Check</h2>
                <p style="margin-bottom: 20px;">6 Questions. No easy way out.</p>
                
                <div class="question-card">
                    <h4>1. What is the Time Complexity of Merge Sort?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N^2)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(N log N)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(log N)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. What is the Space Complexity? (Auxiliary Space)</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(1) - In place</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(N) - Needs extra array</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What is the fundamental strategy used?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Greedy Approach</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Backtracking</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Divide and Conquer</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Dynamic Programming</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. What is the "Base Case" for the recursion?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Array length <= 1</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Array length == 0</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Array is sorted</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>5. Is Merge Sort "Stable"? (Preserves original order of equals)</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Yes</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">No</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>6. Which step does the actual sorting?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">The splitting step</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">The merging step</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/6 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled @click="nextStep(2)" style="border: none; cursor: pointer;">Go to Code Practice</button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <h3 style="margin-bottom: 20px;">Division & Merger</h3>
                    <div id="tree-container" style="display:flex; flex-direction:column; width:100%; align-items:center;"></div>
                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Type the Logic</h4>
                    <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Hint usage cost: <span style="color:#ef4444">-5 XP</span></p>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 2;">
                        <div class="code-line"><span style="color:#c586c0">function</span> mergeSort(arr) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 1. Base Case: Stop if single item</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">if</span> ( 
                            <div class="input-wrapper">
                                <input type="text" id="inp-base" class="code-input" placeholder="condition?" autocomplete="off">
                                <button class="hint-btn" id="base" @click="toggleHint('base')" title="Show Hint (-5 XP)"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-base">arr.length <= 1</span>
                            </div> 
                        ) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">return</span> arr;</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 2. Find Middle</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">const</span> mid = Math.floor( 
                            <div class="input-wrapper">
                                <input type="text" id="inp-mid" class="code-input" placeholder="calculation?" autocomplete="off">
                                <button class="hint-btn" id="mid" @click="toggleHint('mid')" title="Show Hint (-5 XP)"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-mid">arr.length / 2</span>
                            </div>
                        );</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">const</span> left = mergeSort(arr.slice(0, mid));</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">const</span> right = mergeSort(arr.slice(mid));</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 3. Combine sorted halves</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">return</span> 
                            <div class="input-wrapper">
                                <input type="text" id="inp-merge" class="code-input" placeholder="function?" autocomplete="off">
                                <button class="hint-btn" id="merge" @click="toggleHint('merge')" title="Show Hint (-5 XP)"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-merge">merge</span>
                            </div> 
                        (left, right);</div>
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
            <i class="fas fa-columns fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>Merge Sort Strategy</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                <strong>Step 1 (Divide):</strong> Recursively split the array in half until you have subarrays of size 1.
                <br>
                <strong>Step 2 (Conquer):</strong> Merge the small sorted arrays back together. Compare the first elements of each list and pick the smaller one.
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Level 3 Started!</div>
            <p>You conquered Merge Sort!</p>
            
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