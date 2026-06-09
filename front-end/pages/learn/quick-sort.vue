<script setup>
import { onMounted } from 'vue'
import { initTheme } from '~/assets/script'

// استخدام أداة Nuxt لجلب التوكن بشكل آمن وموثوق
const tokenCookie = useCookie('auth_token');

        // --- State Management ---
        let answeredCount = 0;
        let correctQuizCount = 0;
        let sessionPoints = 0;
        const totalQuizQuestions = 6; 
        let hintsUsed = { cond: false, swap: false, ret: false };
        let isRunning = false;
        
        // Initial Data
        const initialArray = [10, 80, 30, 90, 40, 50, 70];
        let currentArray = [...initialArray];
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
                    if(b.textContent.includes('O(N log N)') || b.textContent.includes('Sorted array') || b.textContent.includes('No') || b.textContent.includes('Place pivot') || b.textContent.includes('O(log N)') || b.textContent.includes('Random')) {
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

        // --- Hint Logic ---
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
        function initVisual() {
            const container = document.getElementById('visual-array');
            container.innerHTML = '';
            currentArray = [...initialArray];
            
            currentArray.forEach((num, index) => {
                const box = document.createElement('div');
                box.className = 'array-box';
                box.id = `box-${index}`;
                box.innerHTML = `${num} <span class="index-label">${index}</span>`;
                container.appendChild(box);
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
                algoId: 'quick_sort',
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
                navigateTo('/learn/linked-list');
            }, 2000);
           
        } else{
        navigateTo('/learn/linked-list'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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

        // --- The Core: Run Simulation (Partitioning) ---
        async function runSimulation() {
            if(isRunning) return;
            
            const valCond = document.getElementById('inp-cond').value.replace(/\s/g, ''); 
            const valSwap = document.getElementById('inp-swap').value.replace(/\s/g, '').toLowerCase();
            const valRet = document.getElementById('inp-ret').value.replace(/\s/g, '');

            let errors = false;

            // Validate Condition: arr[j] < pivot
            if (!valCond.includes('arr[j]<pivot') && !valCond.includes('pivot>arr[j]')) {
                document.getElementById('inp-cond').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-cond').classList.add('success');
            }

            // Validate Swap: swap(arr, i, j)
            if (!valSwap.includes('swap(arr,i,j)')) {
                document.getElementById('inp-swap').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-swap').classList.add('success');
            }

            // Validate Return: i + 1
            if (valRet !== 'i+1') {
                document.getElementById('inp-ret').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-ret').classList.add('success');
            }

            if(errors) {
                document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Syntax Error! Check your logic.</span>`;
                return;
            }

            // Start Animation
            isRunning = true;
            const status = document.getElementById('status-msg');
            
            let high = currentArray.length - 1;
            let low = 0;
            let pivot = currentArray[high];
            let i = low - 1;

            // Mark Pivot
            const pivotBox = document.getElementById(`box-${high}`);
            pivotBox.classList.add('pivot');
            status.innerText = `Pivot chosen: ${pivot} (Index ${high})`;
            await new Promise(r => setTimeout(r, 1000));

            // Partition Loop
            for (let j = low; j < high; j++) {
                if(!isRunning) break;

                const boxJ = document.getElementById(`box-${j}`);
                
                // Add j Pointer visual
                let ptrJ = document.createElement('div');
                ptrJ.className = 'ptr-marker ptr-j'; ptrJ.innerText = 'j';
                boxJ.appendChild(ptrJ);

                status.innerHTML = `Comparing: <span style="color:#fff">${currentArray[j]}</span> < <span style="color:#eab308">${pivot}</span> ?`;
                await new Promise(r => setTimeout(r, 800));

                if (currentArray[j] < pivot) {
                    i++;
                    status.innerText = "Smaller! Moving to Left Region.";
                    
                    // Visual i Pointer
                    // Remove old i if exists (visually tricky, let's just highlight region)
                    // Or move an 'i' marker. For simplicity, we color the boxes.
                    
                    if (i !== j) {
                        const boxI = document.getElementById(`box-${i}`);
                        boxI.classList.add('swapping');
                        boxJ.classList.add('swapping');
                        
                        // Swap Logic
                        let temp = currentArray[i];
                        currentArray[i] = currentArray[j];
                        currentArray[j] = temp;

                        await new Promise(r => setTimeout(r, 500));
                        boxI.innerHTML = `${currentArray[i]} <span class="index-label">${i}</span>`;
                        boxJ.innerHTML = `${currentArray[j]} <span class="index-label">${j}</span>`;
                        
                        // Re-append pointer j to new content
                        boxJ.appendChild(ptrJ);
                        
                        boxI.classList.remove('swapping');
                        boxJ.classList.remove('swapping');
                    }
                    
                    // Mark as Left Part
                    document.getElementById(`box-${i}`).classList.add('left-part');
                    document.getElementById(`box-${i}`).classList.remove('right-part');

                } else {
                    status.innerText = "Larger. Stays in Right Region.";
                    boxJ.classList.add('right-part');
                }
                
                await new Promise(r => setTimeout(r, 400));
                ptrJ.remove();
            }

            if(!isRunning) return;

            // Final Swap
            status.innerText = "Loop done. Placing Pivot in correct position (i+1).";
            await new Promise(r => setTimeout(r, 1000));
            
            const boxPivotFinal = document.getElementById(`box-${i+1}`);
            const boxHigh = document.getElementById(`box-${high}`);
            
            boxPivotFinal.classList.add('swapping');
            boxHigh.classList.add('swapping');
            
            let temp = currentArray[i+1];
            currentArray[i+1] = currentArray[high];
            currentArray[high] = temp;
            
            await new Promise(r => setTimeout(r, 600));
            boxPivotFinal.innerHTML = `${currentArray[i+1]} <span class="index-label">${i+1}</span>`;
            boxHigh.innerHTML = `${currentArray[high]} <span class="index-label">${high}</span>`;
            
            // Re-add Pivot style to the new home
            boxHigh.classList.remove('pivot'); // Remove crown from old
            boxPivotFinal.classList.remove('swapping', 'right-part', 'left-part');
            boxHigh.classList.remove('swapping');
            
            boxPivotFinal.classList.add('pivot', 'sorted'); // King takes his throne
            status.innerHTML = `<span style="color:#22c55e"><i class="fas fa-check"></i> Partition Complete! Pivot is at index ${i+1}.</span>`;
            
            sessionPoints += 60; 
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
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 500px; border: 1px solid var(--border-light); position: relative; }
        
        /* --- QUICK SORT VISUALS --- */
        .array-container { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center; padding-top: 40px; }
        
        .array-box { 
            width: 55px; height: 55px; 
            border: 2px solid #475569; border-radius: 8px;
            background: #1e293b; color: white;
            display: flex; align-items: center; justify-content: center; 
            font-size: 1.2rem; font-weight: bold; 
            position: relative; transition: 0.4s ease;
        }

        /* States */
        .array-box.pivot { 
            border-color: #eab308; background: rgba(234, 179, 8, 0.2); 
            box-shadow: 0 0 20px rgba(234, 179, 8, 0.4); 
            transform: scale(1.1); z-index: 10;
        }
        .array-box.pivot::after { content: '👑'; position: absolute; top: -25px; font-size: 1.2rem; }

        .array-box.left-part { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); } /* Smaller than pivot */
        .array-box.right-part { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); } /* Larger than pivot */
        
        .array-box.swapping { animation: swapSpin 0.6s ease; border-color: #fff; background: rgba(255,255,255,0.1); }
        .array-box.sorted { border-color: #22c55e; background: #22c55e; color: white; opacity: 1; }

        /* Pointers i and j */
        .ptr-marker { position: absolute; bottom: -30px; font-size: 0.8rem; font-weight: bold; transition: 0.3s; padding: 2px 6px; border-radius: 4px; }
        .ptr-j { background: #64748b; color: white; right: 0; }
        .ptr-i { background: #3b82f6; color: white; left: 0; }

        /* Code Input & Hints */
        .input-wrapper { display: inline-flex; align-items: center; gap: 5px; position: relative; }
        .code-input {
            background: transparent; border: none; border-bottom: 1px solid #777;
            color: #eab308; font-family: 'Consolas', monospace; font-size: 1rem;
            width: 130px; text-align: center; outline: none; transition: 0.3s;
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
        
        @keyframes swapSpin { 0% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(180deg); } 100% { transform: translateY(0) rotate(360deg); } }
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
                <h1 class="gradient-text">Quick Sort</h1>
                <p>Pick a Pivot. Partition. Repeat.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-bolt" style="font-size: 4rem; color: #eab308; margin-bottom: 20px;"></i>
                    <p class="text-muted">The speed demon of sorting. It organizes elements around a "Leader" (Pivot) so that everyone smaller is on the left.</p>
                </div>
                <button class="btn-primary" style="border: none; cursor: pointer;" @click="nextStep(1)">Start Challenge (Hard)</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Expert Knowledge Check</h2>
                <p style="margin-bottom: 20px;">6 Questions. Precision required.</p>
                
                <div class="question-card">
                    <h4>1. What is the Average Time Complexity?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N^2)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(N log N)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(log N)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. What triggers the Worst Case O(N^2)?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Sorted array & bad pivot (e.g. last element)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Random array</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Array with negative numbers</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. Is Quick Sort "Stable"?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Yes</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">No (Swapping jumps over elements)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. What is the goal of the "Partition" step?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Sort the whole array</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Place pivot in correct spot & separate values</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Find the maximum value</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>5. What is the Space Complexity (In-Place version)?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(log N) (Recursion Stack)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(1)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>6. Which Pivot strategy is generally safer?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Always first element</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Random or Median-of-3</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Always last element</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/6 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" style="border: none; cursor: pointer;" disabled @click="nextStep(2)">Go to Code Practice</button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <h3 style="margin-bottom: 20px;">Partition Logic</h3>
                    <div class="array-container" id="visual-array"></div>
                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Implement Partition</h4>
                    <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Hint usage cost: <span style="color:#ef4444">-5 XP</span></p>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 2;">
                        <div class="code-line"><span style="color:#c586c0">function</span> partition(arr, low, high) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> pivot = arr[high]; <span style="color:#6a9955">// Last Element</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> i = low - 1; <span style="color:#6a9955">// Boundary of small elements</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">for</span> (<span style="color:#569cd6">let</span> j = low; j < high; j++) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#6a9955">// If current element is smaller than pivot</span></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">if</span> ( 
                            <div class="input-wrapper">
                                <input type="text" id="inp-cond" class="code-input" placeholder="condition?" autocomplete="off">
                                <button class="hint-btn" id="cond" @click="toggleHint('cond')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-cond">arr[j] < pivot</span>
                            </div> 
                        ) {</div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; i++;</div>
                        <div class="code-line"> &nbsp; &nbsp; &nbsp; 
                            <div class="input-wrapper">
                                <input type="text" id="inp-swap" class="code-input" placeholder="action?" autocomplete="off">
                                <button class="hint-btn" id="swap" @click="toggleHint('swap')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-swap">swap(arr, i, j)</span>
                            </div>
                        ;</div>
                        <div class="code-line"> &nbsp; &nbsp; }</div>
                        <div class="code-line"> &nbsp; }</div>
                        <div class="code-line"> &nbsp; <span style="color:#dcdcaa">swap</span>(arr, i + 1, high); <span style="color:#6a9955">// Place Pivot</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">return</span> 
                            <div class="input-wrapper">
                                <input type="text" id="inp-ret" class="code-input" placeholder="index?" autocomplete="off">
                                <button class="hint-btn" id="ret" @click="toggleHint('ret')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-ret">i + 1</span>
                            </div>
                        ;</div>
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
            <i class="fas fa-bolt fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>The Pivot Strategy</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                1. Choose a Pivot (we'll use the last element).<br>
                2. Use two pointers. Loop 'j' scans the array.<br>
                3. If arr[j] < Pivot, swap it to the left (increment 'i').<br>
                4. Finally, place Pivot at 'i + 1'.<br>
                Now, everything left of Pivot is smaller, right is larger.
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Lightning Fast!</div>
            <p>You mastered the Partition Logic.</p>
            
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