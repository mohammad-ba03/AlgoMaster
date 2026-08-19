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
        let hintsUsed = { step1: false, step2: false };
        let isRunning = false;
        
        // Train Data
        const nodes = [5, 10, 20, 30]; // We insert 15 after 10
        const insertVal = 15;
        const targetIndex = 1; // Index of '10'
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

        // --- Init ---
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
                    if(b.textContent.includes('O(1)') || b.textContent.includes('O(K)') || b.textContent.includes('lose the rest') || b.textContent.includes('placeholder') || b.textContent.includes('Cheap insertions') || b.textContent.includes('2 pointers')) {
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
            const container = document.getElementById('train-container');
            container.innerHTML = '';
            
            nodes.forEach((val, i) => {
                const car = document.createElement('div');
                car.className = 'train-car';
                car.id = `car-${i}`;
                car.innerHTML = `
                    <span class="node-label">${i === 0 ? 'HEAD' : ''}</span>
                    ${val}
                `;
                
                // Add chain unless last
                if (i < nodes.length - 1) {
                    const chain = document.createElement('div');
                    chain.className = 'chain-link';
                    chain.id = `chain-${i}`;
                    car.appendChild(chain);
                }

                container.appendChild(car);
            });

            // Create invisible new node floating above
            const newCar = document.createElement('div');
            newCar.className = 'train-car new-node';
            newCar.id = 'car-new';
            newCar.innerHTML = `<span class="node-label">newNode</span>${insertVal}`;
            
            // Initial chain for new node (pointing nowhere initially)
            const newChain = document.createElement('div');
            newChain.className = 'chain-link';
            newChain.id = 'chain-new';
            newChain.style.opacity = '0';
            newCar.appendChild(newChain);

            // Append it near the target (Index 1)
            // Ideally we place it inside the container but absolute positioned relative to car-1
            // For simplicity, let's append it to car-1 but style it to float up
            document.getElementById(`car-${targetIndex}`).appendChild(newCar);
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
                algoId: 'linked_list',
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
                navigateTo('/learn/bfs');
            }, 2000);
           
        } else{
        navigateTo('/learn/bfs'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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
            
            const step1 = document.getElementById('inp-step1').value.replace(/\s/g, ''); 
            const step2 = document.getElementById('inp-step2').value.replace(/\s/g, '');

            let errors = false;

            // Validate Step 1: newNode.next = current.next
            if (step1 !== 'current.next') {
                document.getElementById('inp-step1').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-step1').classList.add('success');
            }

            // Validate Step 2: current.next = newNode
            if (step2 !== 'newNode') {
                document.getElementById('inp-step2').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-step2').classList.add('success');
            }

            if(errors) {
                document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Syntax Error! Check pointers.</span>`;
                return;
            }

            // Start Animation
            isRunning = true;
            const status = document.getElementById('status-msg');
            const targetCar = document.getElementById(`car-${targetIndex}`);
            const nextCar = document.getElementById(`car-${targetIndex+1}`);
            const newCar = document.getElementById('car-new');
            const oldChain = document.getElementById(`chain-${targetIndex}`);
            const newChain = document.getElementById('chain-new');

            status.innerText = "Creating newNode(15)...";
            newCar.style.opacity = '1'; // Show node
            await new Promise(r => setTimeout(r, 1000));

            // Step 1: Connect New -> Next
            status.innerHTML = `Executing: newNode.next = current.next`;
            newChain.style.opacity = '1';
            // CSS Transform to make it look like it connects to next car
            // We use hardcoded visuals for this specific scenario
            newChain.style.transform = 'rotate(25deg)'; 
            newChain.style.width = '60px';
            // Visually it points somewhat to the next car
            await new Promise(r => setTimeout(r, 1000));

            // Step 2: Break Old, Connect Current -> New
            status.innerHTML = `Executing: current.next = newNode`;
            oldChain.style.opacity = '0'; // Break old
            
            // Create a temporary chain for Current -> New because the DOM structure is tricky
            const tempChain = document.createElement('div');
            tempChain.className = 'chain-link chain-new-2'; // Angled up
            targetCar.appendChild(tempChain);
            
            await new Promise(r => setTimeout(r, 1000));

            // Final: Re-arrange DOM to show linear list
            status.innerHTML = `<span style="color:#22c55e">Insertion Complete! Re-aligning train...</span>`;
            
            // Remove helper chains
            tempChain.remove();
            newChain.style.transform = 'translateY(-50%)'; // Reset
            newChain.style.width = '40px';
            
            // Move newCar in DOM
            targetCar.after(newCar); // Place actual DOM element
            
            // Reset styles to make it look like a normal car
            newCar.classList.remove('new-node');
            newCar.classList.add('inserted');
            newCar.style.position = 'relative';
            newCar.style.top = '0';
            newCar.style.left = '0';
            
            // Restore old chain visuals (now belongs to newCar)
            oldChain.style.opacity = '1'; // Actually we need a chain on the new car now
            // The old chain is on targetCar. targetCar should point to newCar.
            // We need a chain on newCar to point to nextCar.
            
            // Simply: Re-render list cleanly might be easier, but let's just patch visually
            const freshChain = document.createElement('div');
            freshChain.className = 'chain-link';
            targetCar.appendChild(freshChain); // Add chain back to 10

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
        .visual-panel { background: #0f172a; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 500px; border: 1px solid var(--border-light); position: relative; overflow-x: auto; }
        
        /* --- TRAIN VISUALIZER STYLES --- */
        .train-track {
            display: flex; align-items: center; gap: 40px; /* Gap for chains */
            padding: 60px 20px;
            width: 100%;
            overflow-x: auto;
            position: relative;
        }

        .train-car {
            min-width: 80px; height: 60px;
            background: #1e293b;
            border: 2px solid #64748b;
            border-radius: 8px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-weight: bold; color: white;
            position: relative;
            transition: all 0.5s ease;
        }
        
        /* Wheels */
        .train-car::before { content: ''; position: absolute; bottom: -8px; left: 10px; width: 12px; height: 12px; background: #94a3b8; border-radius: 50%; }
        .train-car::after { content: ''; position: absolute; bottom: -8px; right: 10px; width: 12px; height: 12px; background: #94a3b8; border-radius: 50%; }

        /* The Chain (Pointer) */
        .chain-link {
            position: absolute; right: -42px; top: 50%; width: 40px; height: 4px;
            background: #64748b; transform: translateY(-50%);
            transition: 0.5s;
        }
        .chain-link::after { content: '►'; position: absolute; right: -5px; top: -7px; color: #64748b; font-size: 14px; }

        /* States */
        .train-car.current { border-color: #eab308; box-shadow: 0 0 15px rgba(234, 179, 8, 0.4); }
        .train-car.new-node { 
            border-color: #22c55e; background: rgba(34, 197, 94, 0.1); 
            position: absolute; top: -50px; left: 0; opacity: 0;
        }
        .train-car.inserted { position: relative; top: 0; left: 0; opacity: 1; }

        /* Dynamic Lines (Canvas simulation via CSS for simplicity) */
        .chain-broken { width: 0 !important; opacity: 0; }
        .chain-new-1 { transform: rotate(25deg); width: 50px; top: 80%; right: -30px; background: #22c55e; } /* NewNode -> Next */
        .chain-new-2 { transform: rotate(-25deg); width: 50px; top: 20%; right: -30px; background: #22c55e; } /* Current -> NewNode */

        .node-label { position: absolute; top: -25px; font-size: 0.7rem; color: #94a3b8; }

        /* Code Input */
        .input-wrapper { display: inline-flex; align-items: center; gap: 5px; position: relative; width: 100%;}
        .code-input {
            background: transparent; border: none; border-bottom: 1px solid #777;
            color: #eab308; font-family: 'Consolas', monospace; font-size: 0.9rem;
            width: 100%; text-align: left; outline: none; transition: 0.3s;
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
                <div id="score-display" class="badge">Total XP: 0</div>
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
                <h1 class="gradient-text">Linked List Insertion</h1>
                <p>Don't break the chain!</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-link" style="font-size: 4rem; color: #a855f7; margin-bottom: 20px;"></i>
                    <p class="text-muted">Inserting a node into a Linked List requires careful pointer management. If you disconnect the wrong link first, you lose the rest of the list.</p>
                </div>
                <button class="btn-primary" style="border: none; cursor: pointer;" @click="nextStep(1)">Start Challenge (Hard)</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Expert Knowledge Check</h2>
                <p style="margin-bottom: 20px;">6 Questions. Precision required.</p>
                
                <div class="question-card">
                    <h4>1. What is the time complexity to insert at the START (Head)?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">O(1)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(log N)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. What is the time complexity to insert at Index K?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(K) to find, O(1) to insert</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(N^2)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What happens if you do: `curr.next = new` BEFORE `new.next = curr.next`?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">It works fine</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">You lose the rest of the list</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">It creates a cycle</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. What is a "Sentinel" or "Dummy" node?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">The last node (Tail)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">A placeholder node to simplify edge cases</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">A node with null value</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>5. Why use Linked List over Array?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Cheap insertions/deletions (No shifting)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Faster random access (Index)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Less memory usage</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>6. How many pointers do you update to insert in a Singly Linked List?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">1 pointer</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">2 pointers (NewNode's next & Previous's next)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">4 pointers</button>
                    </div>
                </div>

                <div id="quiz-status" style="margin-top:20px; text-align:right;">
                    <span id="quiz-progress-text" style="margin-right: 15px; color: var(--text-muted);">0/6 Correct</span>
                    <button class="btn-primary" id="btn-to-practice" disabled style="border: none; cursor: pointer;" @click="handleUnlockPractice()">Next-></button>
                </div>
            </div>
        </div>

        <div id="step-2" class="section-view">
            <div class="practice-layout">
                <button @click="showInfo()" style="position: absolute; top: 10px; right: 10px; z-index: 10; background:none; border:none; color:white; cursor:pointer;"><i class="fas fa-info-circle fa-2x"></i></button>

                <div class="visual-panel">
                    <h3 style="margin-bottom: 20px;">Insert '15' after '10'</h3>
                    
                    <div class="train-track" id="train-container">
                        </div>

                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Connect the Chains</h4>
                    <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Hint cost: <span style="color:#ef4444">-5 XP</span></p>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 2;">
                        <div class="code-line"><span style="color:#c586c0">function</span> insertAfter(current, val) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> newNode = <span style="color:#c586c0">new</span> Node(val);</div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 1. Connect newNode to the train (Safe Step)</span></div>
                        <div class="code-line"> &nbsp; 
                            <div class="input-wrapper">
                                <input type="text" id="inp-step1" class="code-input" placeholder="newNode.next = ?" autocomplete="off">
                                <button class="hint-btn" id="step1" @click="toggleHint('step1')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-step1">current.next</span>
                            </div>
                        ;</div>
                        
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 2. Connect current node to newNode</span></div>
                        <div class="code-line"> &nbsp; 
                            <div class="input-wrapper">
                                <input type="text" id="inp-step2" class="code-input" placeholder="current.next = ?" autocomplete="off">
                                <button class="hint-btn" id="step2" @click="toggleHint('step2')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-step2">newNode</span>
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
            <i class="fas fa-link fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>Insertion Logic</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                Imagine you are holding a new carriage.
                <br>
                <strong>Step 1:</strong> Hook the <em>back</em> of your new carriage to the rest of the train first.
                <br>
                <strong>Step 2:</strong> Hook the carriage <em>in front</em> of you to your new carriage.
                <br><br>
                Order matters! If you do Step 2 first, the rest of the train floats away.
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Chain Linked!</div>
            <p>You successfully inserted the node without breaking the list.</p>
            
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