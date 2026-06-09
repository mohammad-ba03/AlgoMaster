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
        let hintsUsed = { 'q-init': false, 'while': false, 'deq': false };
        let isRunning = false;
        
        // Maze Data: 5 rows, 6 cols. 0=Empty, 1=Wall, 2=Start, 3=End
        const mazeLayout = [
            [2, 0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0],
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
                    if(b.textContent.includes('Queue') || b.textContent.includes('Yes') || b.textContent.includes('O(V + E)') || b.textContent.includes('Visited') || b.textContent.includes('Up, Down') || b.textContent.includes('very wide')) {
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
            document.getElementById('queue-viz').innerHTML = '';
        }

        function updateQueueViz(queue) {
            const qContainer = document.getElementById('queue-viz');
            qContainer.innerHTML = '';
            queue.forEach(node => {
                const div = document.createElement('div');
                div.className = 'q-node';
                div.innerText = `[${node.r},${node.c}]`;
                qContainer.appendChild(div);
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
                algoId: 'bfs_graph',
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
                navigateTo('/learn/dfs');
            }, 2000);
           
        } else{
        navigateTo('/learn/dfs'); }// استخدام دالة Nuxt للتوجيه بدلاً من window.location
            
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
            
            const valInit = document.getElementById('inp-q-init').value.replace(/\s/g, ''); 
            const valWhile = document.getElementById('inp-while').value.replace(/\s/g, '');
            const valDeq = document.getElementById('inp-deq').value.replace(/\s/g, '');

            let errors = false;

            // Validate [start]
            if (valInit !== 'start' && valInit !== '[start]') {
                document.getElementById('inp-q-init').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-q-init').classList.add('success');
            }

            // Validate queue.length > 0
            if (!valWhile.includes('length>0') && !valWhile.includes('length!==0')) {
                document.getElementById('inp-while').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-while').classList.add('success');
            }

            // Validate queue.shift()
            if (!valDeq.includes('shift()')) {
                document.getElementById('inp-deq').classList.add('error');
                errors = true;
            } else {
                document.getElementById('inp-deq').classList.add('success');
            }

            if(errors) {
                document.getElementById('status-msg').innerHTML = `<span style="color:#ef4444">Syntax Error! Review Queue operations.</span>`;
                return;
            }

            // BFS Logic
            isRunning = true;
            const status = document.getElementById('status-msg');
            
            let queue = [{...startPos, dist: 0}];
            let visited = new Set();
            visited.add(`${startPos.r},${startPos.c}`);
            let parentMap = new Map(); // To trace path back

            updateQueueViz(queue);
            status.innerText = "Starting BFS Wave...";
            await new Promise(r => setTimeout(r, 1000));

            while(queue.length > 0) {
                if(!isRunning) break;

                let curr = queue.shift();
                updateQueueViz(queue);
                
                // Highlight Current
                const cellId = `cell-${curr.r}-${curr.c}`;
                const cellDiv = document.getElementById(cellId);
                // Don't overwrite Start color completely, just add water effect logic
                if(mazeLayout[curr.r][curr.c] !== 2 && mazeLayout[curr.r][curr.c] !== 3) {
                    cellDiv.classList.add('water');
                }

                // Check Target
                if(curr.r === endPos.r && curr.c === endPos.c) {
                    status.innerHTML = `<span style="color:#22c55e">Target Found! Reconstructing Path...</span>`;
                    
                    // Trace Back
                    let pathNode = `${curr.r},${curr.c}`;
                    while(parentMap.has(pathNode)) {
                        pathNode = parentMap.get(pathNode);
                        let [pr, pc] = pathNode.split(',');
                        if (mazeLayout[pr][pc] !== 2) { // Don't color start
                            document.getElementById(`cell-${pr}-${pc}`).classList.remove('water');
                            document.getElementById(`cell-${pr}-${pc}`).classList.add('path');
                            await new Promise(r => setTimeout(r, 100));
                        }
                    }

                    sessionPoints += 30; 
                    setTimeout(showSuccess, 1000);
                    isRunning = false;
                    return;
                }

                // Explore Neighbors
                const dirs = [[0,1], [1,0], [0,-1], [-1,0]]; // Right, Down, Left, Up
                for(let d of dirs) {
                    let nr = curr.r + d[0];
                    let nc = curr.c + d[1];
                    let key = `${nr},${nc}`;

                    // Check Bounds
                    if(nr >= 0 && nr < 5 && nc >= 0 && nc < 6) {
                        // Check Wall & Visited
                        if(mazeLayout[nr][nc] !== 1 && !visited.has(key)) {
                            visited.add(key);
                            parentMap.set(key, `${curr.r},${curr.c}`);
                            queue.push({r: nr, c: nc});
                            
                            // Visual: Mark as "Seen"/In Queue? Maybe distinct color?
                            // For simplicity, we just show them in Queue bar.
                        }
                    }
                }
                updateQueueViz(queue);
                await new Promise(r => setTimeout(r, 400)); // Speed of wave
            }
            
            if(isRunning) status.innerHTML = "Queue Empty. Target Unreachable.";
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
        
        /* --- MAZE VISUALIZER STYLES --- */
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
        }

        .cell.wall { background: #475569; border-color: #64748b; background-image: repeating-linear-gradient(45deg, #334155 0, #334155 5px, #475569 5px, #475569 10px); }
        .cell.start { background: #22c55e; color: white; box-shadow: 0 0 15px rgba(34, 197, 94, 0.5); z-index: 2; }
        .cell.end { background: #ef4444; color: white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); z-index: 2; }
        
        /* Water Wave Animation */
        .cell.water { 
            background: #3b82f6; border-color: #60a5fa; 
            animation: ripple 0.6s ease-out; 
            color: rgba(255,255,255,0.8);
        }
        .cell.path { background: #eab308; border-color: #facc15; animation: popIn 0.4s; z-index: 3; color: black; font-weight: bold; }

        .queue-display {
            width: 100%; height: 40px;
            border: 2px dashed #475569; border-radius: 6px;
            display: flex; align-items: center; padding: 5px; gap: 5px;
            overflow-x: auto; background: rgba(0,0,0,0.2);
        }
        .q-node { 
            min-width: 40px; height: 30px; background: #3b82f6; 
            color: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; 
            animation: slideLeft 0.3s;
        }

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
        
        @keyframes ripple { from { transform: scale(0.8); opacity: 0.5; background: white; } to { transform: scale(1); opacity: 1; background: #3b82f6; } }
        @keyframes slideLeft { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
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
                <h1 class="gradient-text">Breadth-First Search (BFS)</h1>
                <p>Exploring the world, layer by layer.</p>
                <div style="margin: 40px 0;">
                    <i class="fas fa-water" style="font-size: 4rem; color: #3b82f6; margin-bottom: 20px;"></i>
                    <p class="text-muted">Like a water ripple. BFS explores all immediate neighbors first before moving deeper. It guarantees the shortest path in unweighted graphs.</p>
                </div>
                <button class="btn-primary" @click="nextStep(1)" style="border: none; cursor: pointer;">Start Challenge (Hard)</button>
            </div>
        </div>

        <div id="step-1" class="section-view">
            <div class="quiz-container">
                <h2>Expert Knowledge Check</h2>
                <p style="margin-bottom: 20px;">6 Questions. Graph Theory.</p>
                
                <div class="question-card">
                    <h4>1. Which Data Structure does BFS use?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Stack (LIFO)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Queue (FIFO)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Hash Table</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>2. Does BFS guarantee the shortest path?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Yes (Unweighted Graphs)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">No, DFS is better</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Only in Trees</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>3. What is the Time Complexity? (V=Vertices, E=Edges)</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">O(V^2)</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">O(V + E)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">O(E log V)</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>4. How do we prevent infinite loops in graphs?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">Limit recursion depth</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">Keep a 'Visited' set</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Use a Stack</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>5. In a grid, what are the 'Neighbors' of a cell?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, true)">Up, Down, Left, Right</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">Only Right and Down</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">All unvisited cells</button>
                    </div>
                </div>

                <div class="question-card">
                    <h4>6. When is BFS memory usage bad?</h4>
                    <div class="options-grid">
                        <button class="option-btn" @click="checkAnswer($event, false)">When the graph is very deep</button>
                        <button class="option-btn" @click="checkAnswer($event, true)">When the graph is very wide (High branching)</button>
                        <button class="option-btn" @click="checkAnswer($event, false)">It is always memory efficient</button>
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
                    <h3 style="margin-bottom: 10px;">Find Path to <span style="color:#ef4444">Red</span></h3>
                    <div class="maze-grid" id="maze-container"></div>
                    
                    <div style="width:100%; text-align:left; margin-bottom:5px; font-size:0.8rem; color:#94a3b8;">Queue (FIFO):</div>
                    <div class="queue-display" id="queue-viz"></div>

                    <div class="status-bar" id="status-msg">Waiting for code...</div>
                </div>

                <div class="code-panel" style="background: #1e1e1e; padding: 20px; border-radius: 12px; border: 1px solid #333;">
                    <h4 style="margin-bottom: 15px;"><i class="fas fa-laptop-code"></i> Implement The Wave</h4>
                    <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">Hint usage: <span style="color:#ef4444">-5 XP</span></p>
                    
                    <div class="code-editor" style="font-family: 'Consolas', monospace; color: #d4d4d4; line-height: 2;">
                        <div class="code-line"><span style="color:#c586c0">function</span> bfs(start) {</div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 1. Initialize Queue with Start Node</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> queue = [ 
                            <div class="input-wrapper">
                                <input type="text" id="inp-q-init" class="code-input" placeholder="value?" autocomplete="off">
                                <button class="hint-btn" id="q-init" @click="toggleHint('q-init')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-q-init">start</span>
                            </div> 
                        ];</div>
                        <div class="code-line"> &nbsp; <span style="color:#569cd6">let</span> visited = <span style="color:#c586c0">new</span> Set([start]);</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; <span style="color:#6a9955">// 2. Loop while queue is not empty</span></div>
                        <div class="code-line"> &nbsp; <span style="color:#c586c0">while</span> ( 
                            <div class="input-wrapper">
                                <input type="text" id="inp-while" class="code-input" placeholder="condition?" autocomplete="off">
                                <button class="hint-btn" id="while" @click="toggleHint('while')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-while">queue.length > 0</span>
                            </div>
                        ) {</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#6a9955">// 3. Dequeue (Get first item)</span></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#569cd6">let</span> current = 
                            <div class="input-wrapper">
                                <input type="text" id="inp-deq" class="code-input" placeholder="method?" autocomplete="off">
                                <button class="hint-btn" id="deq" @click="toggleHint('deq')" title="Show Hint"><i class="fas fa-lightbulb"></i></button>
                                <span class="hint-text" id="hint-deq">queue.shift()</span>
                            </div>
                        ;</div>
                        <div class="code-line"></div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#c586c0">if</span> (current === target) <span style="color:#c586c0">return</span> <span style="color:#dcdcaa">buildPath</span>();</div>
                        <div class="code-line"> &nbsp; &nbsp; <span style="color:#6a9955">// Add unvisited neighbors to queue...</span></div>
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
            <i class="fas fa-wave-square fa-3x" style="color:var(--primary); margin-bottom: 15px;"></i>
            <h3>BFS Strategy</h3>
            <p style="color:var(--text-muted); margin: 15px 0;">
                1. <strong>Queue:</strong> Start by putting the start node in a Queue.<br>
                2. <strong>Loop:</strong> While the queue isn't empty, pull out the first node.<br>
                3. <strong>Expand:</strong> Add all its unvisited neighbors to the back of the queue.<br>
                This ensures we check all nodes at "Distance 1" before "Distance 2".
            </p>
            <button class="btn-primary" @click="closeInfo()" style="border: none; cursor: pointer;">Got it!</button>
        </div>
    </div>

    <div class="modal-overlay" id="success-modal">
        <div class="modal-content">
            <div class="modal-header gradient-text">Target Reached!</div>
            <p>You flooded the maze and found the shortest path.</p>
            
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