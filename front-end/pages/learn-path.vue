<script setup>
import { onMounted, ref, computed } from 'vue'
import { initTheme } from '~/assets/script'

const token = useCookie('auth_token')
const totalPoints = ref(0)
const progressData = ref([])
const dynamicAlgorithms = ref([])

// 1. الخوارزميات الأساسية
const baseAlgorithms = {
    level_1: [
        { algo_id: 'linear_search', path: '/learn/linear-search', title: 'Linear Search', description: 'The simplest search. Iterate through elements one by one.', icon: 'fa-search', tagClass: 'tag-visual', tagText: 'Visualizer' },
        { algo_id: 'find_max', path: '/learn/find-max', title: 'Find Maximum', description: 'Scan the list to identify the largest number.', icon: 'fa-trophy', tagClass: 'tag-code', tagText: 'Logic Puzzle' },
        { algo_id: 'array_reverse', path: '/learn/array-reverse', title: 'Array Reversal', description: 'Flip the list using the Two Pointers technique.', icon: 'fa-exchange-alt', tagClass: 'tag-visual', tagText: 'Pointers' },
        { algo_id: 'bubble_sort', path: '/learn/bubble-sort', title: 'Bubble Sort', description: 'Bubble largest elements to the top via swapping.', icon: 'fa-sort', tagClass: 'tag-game', tagText: 'Sorting Race' },
        { algo_id: 'selection_sort', path: '/learn/selection-sort', title: 'Selection Sort', description: 'Select the smallest item and move it to the front.', icon: 'fa-list-ol', tagClass: 'tag-visual', tagText: 'Order' }
    ],
    level_2: [
        { algo_id: 'binary_search', path: '/learn/binary-search', title: 'Binary Search', description: 'Divide and conquer! Search sorted lists instantly.', icon: 'fa-search-plus', tagClass: 'tag-visual', tagText: 'Split Visual' },
        { algo_id: 'valid_parens', path: '/learn/valid-parentheses', title: 'Valid Parentheses', description: 'Use a Stack to check if brackets are balanced.', icon: 'fa-layer-group', tagClass: 'tag-code', tagText: 'Stack Logic' },
        { algo_id: 'simple_queue', path: '/learn/simple-queue', title: 'Simple Queue', description: 'FIFO (First-In, First-Out). Manage tasks in order.', icon: 'fa-people-arrows', tagClass: 'tag-visual', tagText: 'Queue Line' },
        { algo_id: 'insertion_sort', path: '/learn/insertion-sort', title: 'Insertion Sort', description: 'Build the sorted list one item at a time.', icon: 'fa-hand-paper', tagClass: 'tag-game', tagText: 'Card Game' },
        { algo_id: 'recursion_basic', path: '/learn/recursion', title: 'Recursion Basics', description: 'Functions calling themselves. Solving Factorials.', icon: 'fa-infinity', tagClass: 'tag-code', tagText: 'Mirror Logic' }
    ],
    level_3: [
        { algo_id: 'merge_sort', path: '/learn/merge-sort', title: 'Merge Sort', description: 'Efficient sorting using the divide and conquer strategy.', icon: 'fa-object-group', tagClass: 'tag-visual', tagText: 'Merge Visual' },
        { algo_id: 'quick_sort', path: '/learn/quick-sort', title: 'Quick Sort', description: 'Partitioning logic and optimized in-place sorting.', icon: 'fa-bolt', tagClass: 'tag-code', tagText: 'Pivot Logic' },
        { algo_id: 'linked_list', path: '/learn/linked-list', title: 'Linked List Insertion', description: 'Inserting nodes in the middle of a chain.', icon: 'fa-link', tagClass: 'tag-visual', tagText: 'Chain Links' },
        { algo_id: 'bfs_graph', path: '/learn/bfs', title: 'Graph BFS', description: 'Breadth-First Search. Exploring neighbors layer by layer.', icon: 'fa-water', tagClass: 'tag-game', tagText: 'Flood Fill' },
        { algo_id: 'dfs_graph', path: '/learn/dfs', title: 'Graph DFS', description: 'Depth-First Search. Going as deep as possible into the maze.', icon: 'fa-route', tagClass: 'tag-code', tagText: 'Maze Path' }
    ]
};

const mergedAlgorithms = computed(() => {
    const groups = JSON.parse(JSON.stringify(baseAlgorithms));
    if (dynamicAlgorithms.value && dynamicAlgorithms.value.length > 0) {
        dynamicAlgorithms.value.forEach(algo => {
            if (!groups[algo.level]) groups[algo.level] = [];
            groups[algo.level].push({
                algo_id: algo.algo_id, path: `/learn/${algo.algo_id}`, title: algo.title,
                description: algo.description, icon: algo.icon || 'fa-gem',
                tagClass: 'tag-game', tagText: 'New Quest',
                // نحتفظ ببيانات المستوى للاستفادة منها
                level_name: algo.level_name, 
                level_number: algo.level_number
            });
        });
    }
    return groups;
});

// 2. تحديث المستويات لدعم الاسم والرقم القادمين من الآدمن وتغيير كلمة Zone لـ Level
const definedLevels = computed(() => {
    const baseLevelNames = {
        level_1: "Level 1: The Foundation",
        level_2: "Level 2: Core Concepts",
        level_3: "Level 3: Advanced Master"
    };

    return Object.keys(mergedAlgorithms.value).sort((a, b) => {
        // ترتيب المستويات تصاعدياً حسب الرقم
        return parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]);
    }).map(key => {
        const fallbackLevelNum = key.split('_')[1];
        
        // البحث هل أرسل الآدمن اسماً لهذا المستوى مع إحدى الخوارزميات الديناميكية؟
        const adminAddedAlgo = mergedAlgorithms.value[key].find(a => a.level_name);

        let finalTitle = baseLevelNames[key]; // حاول أخذ الاسم الافتراضي

        // إذا كان مستوى جديد غير موجود في الأساسيات
        if (!finalTitle) {
            if (adminAddedAlgo && adminAddedAlgo.level_name) {
                // استخدم الرقم والاسم الذين حددهما الآدمن
                const num = adminAddedAlgo.level_number || fallbackLevelNum;
                finalTitle = `Level ${num}: ${adminAddedAlgo.level_name}`;
            } else {
                // اسم احتياطي في حال لم يرسل الآدمن اسماً
                finalTitle = `Level ${fallbackLevelNum}: New Challenges`;
            }
        }

        return {
            id: key, 
            title: finalTitle, 
            class: `game-level-${fallbackLevelNum}`
        };
    });
});

const isCompleted = (levelId, algoId) => {
    const item = progressData.value.find(p => p.level_id === levelId && p.algo_id === algoId);
    return item && item.status === 'completed';
}

const isLevelFullyCompleted = (levelId) => {
    const algos = mergedAlgorithms.value[levelId];
    if (!algos || algos.length === 0) return true;
    return algos.every(algo => isCompleted(levelId, algo.algo_id));
}

const currentLevel = computed(() => {
    const allLevels = definedLevels.value;
    if (allLevels.length === 0) return null;
    for (let i = 0; i < allLevels.length; i++) {
        if (!isLevelFullyCompleted(allLevels[i].id)) return allLevels[i];
    }
    return allLevels[allLevels.length - 1]; 
});

const trackerLevels = computed(() => {
    if (!currentLevel.value) return [];
    const currentIndex = definedLevels.value.findIndex(l => l.id === currentLevel.value.id);
    return definedLevels.value.filter((_, idx) => idx <= currentIndex);
});

const selectedLevelId = ref(null);

const activeLevel = computed(() => {
    if (selectedLevelId.value) {
        return definedLevels.value.find(l => l.id === selectedLevelId.value) || currentLevel.value;
    }
    return currentLevel.value;
});

const selectLevel = (levelId) => {
    selectedLevelId.value = levelId;
}

const isLocked = (levelId, algoId, index) => {
    const levelKeys = Object.keys(mergedAlgorithms.value).sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1])); 
    if (levelId === levelKeys[0] && index === 0) return false;
    
    const item = progressData.value.find(p => p.level_id === levelId && p.algo_id === algoId);
    if (item && (item.status === 'completed' || item.status === 'unlocked')) return false;

    if (index > 0) {
        const prevAlgo = mergedAlgorithms.value[levelId][index - 1];
        return !isCompleted(levelId, prevAlgo.algo_id);
    } else {
        const currentLevelIndex = levelKeys.indexOf(levelId);
        if (currentLevelIndex > 0) {
            const prevLevelId = levelKeys[currentLevelIndex - 1];
            const prevLevelAlgos = mergedAlgorithms.value[prevLevelId];
            if (prevLevelAlgos && prevLevelAlgos.length > 0) {
                return !isCompleted(prevLevelId, prevLevelAlgos[prevLevelAlgos.length - 1].algo_id);
            }
        }
        return false;
    }
}

onMounted(async () => {
    initTheme()
    try {
        const [progressResponse, algosResponse] = await Promise.all([
            $fetch('http://localhost:5000/api/progress', { headers: { 'Authorization': `Bearer ${token.value}` } }).catch(() => ({ totalPoints: 0, progress: [] })),
            $fetch('http://localhost:5000/api/algorithms', { headers: { 'Authorization': `Bearer ${token.value}` } }).catch(() => [])
        ]);
        totalPoints.value = progressResponse.totalPoints || 0;
        progressData.value = progressResponse.progress || [];
        dynamicAlgorithms.value = algosResponse || [];
    } catch (error) {
        console.error('Error fetching learning path data:', error);
    }
})
</script>

<style scoped>
/* --- Page Layout --- */
.page-header {
    background: linear-gradient(to bottom, rgba(0,0,0,0.2), transparent);
    padding-top: 30px;
    padding-bottom: 20px;
    text-align: center;
}
.page-header h1 {
    font-size: 3.5rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow: 0 5px 15px rgba(86, 88, 245, 0.4);
}

/* --- ✨ Simple Minimalist Tracker Bar ✨ --- */
.level-tracker-simple {
    display: flex;
    justify-content: center;
    margin-bottom: 60px;
}
.tracker-steps {
    display: inline-flex;
    align-items: center;
    gap: 30px;
    position: relative;
}
.tracker-line {
    position: absolute;
    top: 16px; /* النصف ليتوسط الأيقونات التي حجمها 28px */
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255,255,255,0.15);
    z-index: 1;
}
.tracker-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    position: relative;
    z-index: 2;
    transition: transform 0.3s ease;
}
.tracker-step:hover {
    transform: translateY(-3px);
}
.step-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #18181b;
    border: 2px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    color: var(--text-muted);
    transition: all 0.3s ease;
}
.step-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
}

/* Tracker States */
.tracker-step.completed .step-icon {
    background: #22c55e;
    border-color: #4ade80;
    color: #fff;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
}
.tracker-step.completed .step-label { color: #22c55e; }

.tracker-step.active .step-icon {
    background: #5658f5;
    border-color: #7b7df8;
    color: #fff;
    box-shadow: 0 0 15px rgba(86, 88, 245, 0.6);
    transform: scale(1.4);
}
.tracker-step.active .step-label { color: #7b7df8; }

/* --- Horizontal Game Map Container --- */
.roadmap-section { padding-bottom: 80px; }

.zone-title {
    text-align: center;
    margin-bottom: 50px;
    font-size: 2.2rem;
    font-weight: 900;
    color: #fff;
    background: linear-gradient(135deg, #5658f5, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 10px 30px rgba(86, 88, 245, 0.3);
    text-transform: uppercase;
    letter-spacing: 2px;
}

.horizontal-scroll-wrapper {
    width: 100%;
    overflow-x: auto;
    padding: 60px 20px 120px 20px;
    display: flex;
    justify-content: center;
}
.horizontal-scroll-wrapper::-webkit-scrollbar { height: 8px; }
.horizontal-scroll-wrapper::-webkit-scrollbar-thumb { background: #5658f5; border-radius: 10px; }

.level-row { display: flex; flex-direction: row; align-items: center; min-width: max-content; }
.map-node { position: relative; width: 220px; height: 260px; }

/* SVG Wavy Connection Line */
.h-connection-line {
    position: absolute;
    top: 0; left: 50%; width: 100%; height: 100%;
    z-index: 1; pointer-events: none; overflow: visible;
}
.h-connection-line path {
    stroke: var(--line-color);
    transition: stroke 0.5s ease;
    filter: drop-shadow(0 0 8px var(--line-color));
}

/* --- ✨ 3D Colored Diamonds ✨ --- */
.diamond-link {
    position: absolute;
    width: 86px;
    height: 86px;
    left: calc(50% - 43px);
    z-index: 3;
}

.node-up .diamond-link { top: 0; }
.node-down .diamond-link { top: 174px; }

.diamond-wrapper { width: 100%; height: 100%; position: relative; cursor: pointer; }

.diamond-shape {
    width: 90%; height: 90%;
    background: oklch(27.9% 0.041 260.031);
    border: 2px solid rgba(255,255,255,0.2);
    transform: rotate(45deg);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: inset 0 0 15px rgba(255,255,255,0.1), 0 10px 20px rgba(0,0,0,0.4);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
}
.diamond-shape::after {
    content: ''; position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: linear-gradient(to bottom right, rgba(255,255,255,0.3) 0%, transparent 40%, transparent 100%);
    transform: rotate(-45deg);
    pointer-events: none;
}

.diamond-icon {
    position: absolute;
    top: 45%; left: 45%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    color: #ffffff;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    z-index: 2;
}

.diamond-wrapper:hover .diamond-shape { transform: rotate(45deg) scale(1.15); border-color: rgba(255,255,255,0.6); }

/* ✨ حالة المكتمل ✨ */
.status-completed .diamond-shape {
    border-color: #4ade80; /* حواف خضراء */
    box-shadow: inset 0 0 15px rgba(74, 222, 128, 0.3), 0 0 25px rgba(34, 197, 94, 0.5);
}
.status-completed .diamond-icon { color: #4ade80; }

/* ✨ حالة الحالي/التالي (قلب أزرق وحواف ذهبية متوهجة) ✨ */
.status-next .diamond-shape {
    border-color: #fde047; /* حواف ذهبية */
    box-shadow: inset 0 0 20px rgba(253, 224, 71, 0.4), 0 0 35px rgba(234, 179, 8, 0.7);
    animation: pulse-magic 2s infinite;
}
.status-next .diamond-icon { color: #fde047; }

/* حالة المقفل (رمادي/أزرق باهت) */
.status-locked .diamond-shape {
    background: #2a2a35; 
    border-color: #3f3f46; 
    box-shadow: none; 
    opacity: 0.8;
}
.status-locked .diamond-icon { color: #52525b; }

@keyframes pulse-magic {
    0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.6), inset 0 0 15px rgba(253, 224, 71, 0.4); }
    70% { box-shadow: 0 0 0 25px rgba(234, 179, 8, 0), inset 0 0 15px rgba(253, 224, 71, 0.4); }
    100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0), inset 0 0 15px rgba(253, 224, 71, 0.4); }
}

/* --- HOVER TOOLTIP --- */
.details-tooltip {
    position: absolute;
    left: 50%; transform: translateX(-50%); width: 280px;
    background: rgba(24, 24, 27, 0.85); backdrop-filter: blur(15px);
    border: 1px solid rgba(86, 88, 245, 0.4); border-radius: 16px; padding: 20px;
    opacity: 0; visibility: hidden; transition: all 0.3s ease; box-shadow: 0 15px 40px rgba(0,0,0,0.8);
    pointer-events: none; z-index: 10;
}
.diamond-wrapper:hover .details-tooltip { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
.node-up .details-tooltip { top: 110px; transform: translateX(-50%) translateY(-10px); }
.node-down .details-tooltip { bottom: 110px; transform: translateX(-50%) translateY(10px); }

.details-tooltip::before { content: ''; position: absolute; left: 50%; transform: translateX(-50%); border-width: 10px; border-style: solid; }
.node-up .details-tooltip::before { top: -20px; border-color: transparent transparent rgba(86, 88, 245, 0.4) transparent; }
.node-down .details-tooltip::before { bottom: -20px; border-color: rgba(86, 88, 245, 0.4) transparent transparent transparent; }

.tooltip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px; }
.tooltip-header h3 { font-size: 1.1rem; margin: 0; font-weight: bold; color: #fff; }
.level-badge { font-size: 0.7rem; background: rgba(86, 88, 245, 0.2); padding: 4px 8px; border-radius: 8px; color: #fff; }
.module-tags { display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap; }
.tag { font-size: 0.75rem; padding: 5px 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; font-weight: 600; background: rgba(255,255,255,0.05); }
.tag-game i { color: #a855f7; }
.tag-code i { color: #22d3ee; }
.tag-visual i { color: #ec4899; }
.locked-link { pointer-events: none; cursor: default; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-enter-from { opacity: 0; transform: translateY(20px); }
.fade-leave-to { opacity: 0; transform: translateY(-20px); }
.completed-link {
    pointer-events: none; /* يمنع الضغط نهائياً */
    cursor: not-allowed !important;
}
</style>

<template>
    <nav class="navbar">
        <div class="container">
            <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span></nuxt-link>
            
            <ul class="nav-links">
                <li><nuxt-link :to="{name: 'index'}">Home</nuxt-link></li>
                <li><nuxt-link :to="{name: 'learn-path'}" class="active">Learn</nuxt-link></li>
                <li v-if="token"><nuxt-link :to="{name: 'profile'}">Profile</nuxt-link></li>
                <li><nuxt-link :to="{name: 'about'}">About</nuxt-link></li>
            </ul>
            <div class="nav-actions">
                <button id="theme-toggle" class="icon-btn"><i class="fas fa-sun"></i></button>
                <div class="badge">Score : {{ totalPoints }}
                </div>
            </div>
        </div>
    </nav>

    <header class="page-header">
        <div class="container">
            <h1>Your Algorithm <span class="gradient-text">Journey</span></h1>
            <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto; font-size: 1.1rem; line-height: 1.6;">
                From basic logic to advanced dynamic programming
            </p>
        </div>
    </header>

    <div class="level-tracker-simple" v-if="trackerLevels.length > 0">
        <div class="tracker-steps">
            <div class="tracker-line"></div>
            <div v-for="lvl in trackerLevels" :key="'track-' + lvl.id"
                 class="tracker-step"
                 :class="{
                     'completed': isLevelFullyCompleted(lvl.id) && activeLevel.id !== lvl.id,
                     'active': activeLevel && activeLevel.id === lvl.id
                 }"
                 @click="selectLevel(lvl.id)">
                
                <div class="step-icon">
                    <i v-if="isLevelFullyCompleted(lvl.id) && activeLevel.id !== lvl.id" class="fas fa-check"></i>
                    <i v-else class="fas fa-map-marker-alt"></i>
                </div>
                <span class="step-label">{{ lvl.title.split(':')[0] }}</span>
            </div>
        </div>
    </div>

    <section class="roadmap-section">
        <div class="container">
            
            <transition name="fade" mode="out-in">
                <div v-if="activeLevel" :key="activeLevel.id" class="game-zone">
                    
                    <div class="horizontal-scroll-wrapper">
                        <div class="level-row">
                            
                            <div v-for="(algo, index) in mergedAlgorithms[activeLevel.id]" :key="algo.algo_id"
                                 class="map-node" 
                                 :class="index % 2 === 0 ? 'node-up' : 'node-down'"
                                 :style="{ '--line-color': isCompleted(activeLevel.id, algo.algo_id) ? '#4ade80' : 'rgba(255,255,255,0.1)' }">
                                
                                <svg v-if="index < mergedAlgorithms[activeLevel.id].length - 1" class="h-connection-line" viewBox="0 0 100 260" preserveAspectRatio="none">
                                    <path v-if="index % 2 === 0" d="M 0 43 C 50 43, 50 217, 100 217" stroke-width="3" fill="none" stroke-dasharray="8 6" />
                                    <path v-else d="M 0 217 C 50 217, 50 43, 100 43" stroke-width="3" fill="none" stroke-dasharray="8 6" />
                                </svg>

                                <nuxt-link :to="isLocked(activeLevel.id, algo.algo_id, index) || isCompleted(activeLevel.id, algo.algo_id) ? undefined : { path: algo.path }"
                                           :class="['diamond-link', { 'locked-link': isLocked(activeLevel.id, algo.algo_id, index),'completed-link': isCompleted(activeLevel.id, algo.algo_id) }]">
                                    
                                    <div class="diamond-wrapper"
                                         :class="{
                                             'status-locked': isLocked(activeLevel.id, algo.algo_id, index),
                                             'status-completed': isCompleted(activeLevel.id, algo.algo_id),
                                             'status-next': !isLocked(activeLevel.id, algo.algo_id, index) && !isCompleted(activeLevel.id, algo.algo_id)
                                         }">
                                        
                                        <div class="diamond-shape"></div>
                                        <div class="diamond-icon">
                                            <i v-if="isLocked(activeLevel.id, algo.algo_id, index)" class="fas fa-lock"></i>
                                            <i v-else :class="['fas', algo.icon]"></i>
                                        </div>

                                        <div class="details-tooltip">
                                            <div class="tooltip-header">
                                                <h3>{{ algo.title }}</h3>
                                                <span class="level-badge">Lvl {{ activeLevel.id.split('_')[1] }}</span>
                                            </div>
                                            <p style="font-size: 0.85rem; color: #a1a1aa; margin: 0; line-height: 1.5;">
                                                <i v-if="isLocked(activeLevel.id, algo.algo_id, index)" class="fas fa-lock" style="color: #ef4444; margin-right: 5px;"></i>
                                                {{ isLocked(activeLevel.id, algo.algo_id, index) ? 'Unlock previous algorithms to access this challenge.' : algo.description }}
                                            </p>
                                            <div class="module-tags" v-if="!isLocked(activeLevel.id, algo.algo_id, index)">
                                                <span class="tag" :class="algo.tagClass"><i class="fas" :class="algo.icon"></i> {{ algo.tagText }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </nuxt-link>
                                
                            </div>

                        </div>
                    </div>
                </div>
            </transition>

        </div>
    </section>
</template>