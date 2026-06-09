<template>
    <div class="admin-layout" v-if="isAdminVerified">
        
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <nuxt-link :to="{name: 'index'}" class="logo">Algo<span>Master</span> <span class="admin-badge">Admin</span></nuxt-link>
            </div>
            
            <nav class="sidebar-nav">
                <a href="#" :class="{ active: currentTab === 'overview' }" @click.prevent="currentTab = 'overview'"><i class="fas fa-chart-line"></i> Dashboard</a>
                <a href="#" :class="{ active: currentTab === 'algorithms' }" @click.prevent="currentTab = 'algorithms'"><i class="fas fa-cogs"></i> Algorithm Builder</a>
                <a href="#" :class="{ active: currentTab === 'students' }" @click.prevent="currentTab = 'students'"><i class="fas fa-users"></i> Reports & Analytics</a>
                <a href="#" :class="{ active: currentTab === 'competitions' }" @click.prevent="currentTab = 'competitions'"><i class="fas fa-trophy"></i> Competitions</a>
                <a href="#" :class="{ active: currentTab === 'submissions' }" @click.prevent="currentTab = 'submissions'"><i class="fas fa-code-branch"></i> Student Submissions</a>
            </nav>

            <div class="sidebar-footer">
                <button @click="handleLogout" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </aside>

        <main class="admin-main">
            <header class="topbar">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search students, algorithms...">
                </div>
                <div class="admin-profile">
                    <span class="admin-name">Administrator</span>
                    <div class="avatar"><i class="fas fa-user-shield"></i></div>
                </div>
            </header>

            <div class="content-wrapper">
                
                <section v-if="currentTab === 'overview'" class="tab-section animation-fade">
                    <div class="section-header">
                        <h2>Platform Overview & Analytics</h2>
                        <p class="text-muted">Real-time metrics and performance indicators.</p>
                    </div>

                    <div class="stats-grid mb-4">
                        <div class="stat-card">
                            <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;"><i class="fas fa-users"></i></div>
                            <div class="stat-info">
                                <h3>Total Students</h3>
                                <p class="stat-number">{{ dashboardData.totalStudents }}</p>
                                <span class="stat-trend positive">{{ activeStudentsCount }} Active Now</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: rgba(168, 85, 247, 0.1); color: #a855f7;"><i class="fas fa-star"></i></div>
                            <div class="stat-info">
                                <h3>Total XP Generated</h3>
                                <p class="stat-number">{{ totalPlatformXP }}</p>
                                <span class="stat-trend">Across all users</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e;"><i class="fas fa-check-circle"></i></div>
                            <div class="stat-info">
                                <h3>Algorithms Solved</h3>
                                <p class="stat-number">{{ totalAlgorithmsSolved }}</p>
                                <span class="stat-trend positive">Avg Level: {{ averageLevel }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section-header"><h3 class="mb-3"><i class="fas fa-trophy text-warning"></i> Top Performers (Leaderboard)</h3></div>
                    <div class="table-container">
                        <table class="admin-table advanced-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Level</th>
                                    <th>Total Points</th>
                                    <th>Solved</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(student, index) in topPerformers" :key="'top-' + student.id">
                                    <td style="font-weight: bold; color: #3b82f6;">#{{ index + 1 }}</td>
                                    <td>
                                        <div class="user-cell">
                                            <div class="user-avatar" style="width: 30px; height: 30px; font-size: 0.8rem;">{{ student.full_name.charAt(0).toUpperCase() }}</div>
                                            <span class="user-name">{{ student.full_name }}</span>
                                        </div>
                                    </td>
                                    <td>Lvl {{ student.current_level || 1 }}</td>
                                    <td class="text-warning" style="font-weight:bold;">{{ student.total_points }} XP</td>
                                    
                                    <td style="font-weight: 500;">{{ Number(student.solved_count) || 0 }}</td>
                                </tr>
                                <tr v-if="topPerformers.length === 0">
                                    <td colspan="5" class="text-center text-muted">No data available yet.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section v-if="currentTab === 'algorithms'" class="tab-section animation-fade">
                    <div class="section-header flex-between">
                        <div>
                            <h2>Advanced Algorithm Builder</h2>
                            <p class="text-muted">Design theory, quizzes, interactive code, and custom visualizers to match the student experience.</p>
                        </div>
                    </div>

                    <form @submit.prevent="saveAlgorithm" class="admin-form">
                        
                        <div class="form-section">
                            <h3><i class="fas fa-info-circle text-primary"></i> Core Information (Theory)</h3>
                            <div class="form-grid" style="grid-template-columns: repeat(3, 1fr);">
                                <div class="input-group">
                                    <label>Algorithm ID (Unique)</label>
                                    <input v-model="formData.algo_id" type="text" placeholder="e.g., caesar_cipher" required>
                                </div>
                                <div class="input-group">
                                    <label>Display Title</label>
                                    <input v-model="formData.title" type="text" placeholder="e.g., Caesar Cipher" required>
                                </div>
                                <div class="input-group position-relative">
                                    <label>Algorithm Icon</label>
                                    <div style="display: flex; align-items: center; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 8px; padding: 0 10px; transition: 0.3s;">
                                        <i :class="['fas', formData.icon || 'fa-star']" style="color: #3b82f6; font-size: 1.1rem; min-width: 30px; text-align: center;"></i>
                                        <input type="text" v-model="iconSearchQuery" @focus="showIconDropdown = true" @blur="setTimeout(() => showIconDropdown = false, 200)" placeholder="Search (e.g., code, lock)..." style="border: none; background: transparent; padding: 12px 10px; width: 100%; color: white; outline: none; box-shadow: none;">
                                    </div>
                                    <div v-if="showIconDropdown && filteredIcons.length > 0" class="icon-dropdown custom-scrollbar">
                                        <div v-for="icon in filteredIcons" :key="icon" class="icon-option" @click="selectIcon(icon)">
                                            <i :class="['fas', icon]"></i><span>{{ icon.replace('fa-', '') }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="input-group full-width" style="grid-column: span 3;">
                                    <label>Theory & Description</label>
                                    <textarea v-model="formData.description" rows="3" placeholder="Explain the algorithm concept as it appears in the first step..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-layer-group text-primary"></i> Level & Visual Engine</h3>
                            <div class="form-grid">
                                <div class="input-group">
                                    <label>Level Number</label>
                                    <input v-model.number="formData.level_num" type="number" min="1" required>
                                </div>
                                <div class="input-group">
                                    <label>Visualizer Engine (Frontend Layout)</label>
                                    <select v-model="formData.visual_pattern">
                                        <option value="array">Array / List (Pointers, Binary Search)</option>
                                        <option value="maze">Grid / Maze (BFS, DFS, Pathfinding)</option>
                                        <option value="crypto">Cryptography / Strings (Ciphers, Hashing)</option>
                                        <option value="sorting">Sorting Canvas (Bars & Blocks)</option>
                                        <option value="graph">Nodes & Edges (Trees, Graphs)</option>
                                        <option value="stack_queue">Stack / Queue Visualizer</option>
                                        <option value="none">No Visual (Code Only)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-question-circle text-primary"></i> Expert Knowledge Check (Quiz)</h3>
                            <p class="text-muted mb-4" style="font-size: 0.85rem;">Add concept-check questions before students access the code practice.</p>
                            
                            <div v-for="(q, qIndex) in formData.quiz" :key="qIndex" class="quiz-card">
                                <div class="blank-header flex-between">
                                    <h4><i class="fas fa-clipboard-list text-muted mr-2"></i> Question {{ qIndex + 1 }}</h4>
                                    <button type="button" @click="removeQuizQuestion(qIndex)" class="btn-icon text-danger"><i class="fas fa-trash"></i></button>
                                </div>
                                <input v-model="q.question" type="text" placeholder="Enter question text here..." class="quiz-question-input">
                                
                                <div class="options-container mb-3">
                                    <h5 class="text-muted"><i class="fas fa-list-ul"></i> Answer Options</h5>
                                    <div v-for="(opt, oIndex) in q.options" :key="oIndex" class="option-row" :class="{'is-correct': opt.isCorrect}">
                                        <input type="radio" :name="'correct_' + qIndex" :checked="opt.isCorrect" @change="setCorrectOption(qIndex, oIndex)" class="option-radio">
                                        <input v-model="opt.text" type="text" placeholder="Answer option..." class="quiz-option-input">
                                        <button type="button" @click="removeOption(qIndex, oIndex)" class="btn-icon text-danger option-delete-btn"><i class="fas fa-times"></i></button>
                                    </div>
                                    <button type="button" @click="addOption(qIndex)" class="btn-text text-primary mt-2"><i class="fas fa-plus-circle"></i> Add Option</button>
                                </div>
                            </div>
                            <button type="button" @click="addQuizQuestion" class="btn-secondary mt-2"><i class="fas fa-plus"></i> Add New Question</button>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-code text-primary"></i> Interactive Code & Simulation Setup</h3>
                            
                            <div class="form-grid mb-4">
                                <div class="input-group">
                                    <label>Initial State (JSON, Array, or String)</label>
                                    <input v-model="formData.practice.initialState" type="text" placeholder='e.g., "HELLO" or [4, 1, 5]'>
                                </div>
                                <div class="input-group">
                                    <label>Target / Goal (Optional)</label>
                                    <input v-model="formData.practice.targetState" type="text" placeholder='e.g., "KHOOR" or 5'>
                                </div>
                            </div>

                            <div class="logic-row-header">
                                <span>#</span>
                                <span style="flex: 3;">Code Line</span>
                                <span style="flex: 1;">Is Blank?</span>
                                <span style="flex: 1;">Blank Type</span>
                                <span style="flex: 1;">Correct Answer</span>
                                <span>Action</span>
                            </div>

                            <div v-for="(line, index) in formData.practice.codeLines" :key="index" class="logic-row mb-2" style="flex-wrap: wrap;">
                                <div style="display: flex; width: 100%; gap: 10px; align-items: center;">
                                    <span class="line-number">{{ index + 1 }}</span>
                                    
                                    <input v-model="line.text" type="text" placeholder="Code line (e.g., let count = 0;)" style="flex: 3; font-family: monospace;">
                                    
                                    <label class="checkbox-label" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
                                        <input type="checkbox" v-model="line.isBlank"> Blank
                                    </label>
                                    
                                    <div style="flex: 1;" v-if="line.isBlank">
                                        <select v-model="line.blankType" style="width: 100%; padding: 8px;">
                                            <option value="input">Input</option>
                                            <option value="select">Multi-Choice</option>
                                        </select>
                                    </div>
                                    <div style="flex: 1;" v-else></div>

                                    <div style="flex: 1;">
                                        <input v-if="line.isBlank" v-model="line.correctAnswer" type="text" placeholder="Correct Answer" style="width: 100%; border-color: #22c55e;">
                                    </div>
                                    
                                    <button type="button" @click="formData.practice.codeLines.splice(index, 1)" class="btn-icon text-danger" style="width: 30px;"><i class="fas fa-trash"></i></button>
                                </div>

                                <div v-if="line.isBlank && line.blankType === 'select'" style="width: 100%; padding-left: 50px; margin-top: 10px; margin-bottom: 15px;">
                                    <h5 class="text-muted mb-2"><i class="fas fa-list"></i> Options (Including correct one):</h5>
                                    <div v-for="(opt, oIdx) in line.options" :key="oIdx" style="display: flex; gap: 10px; margin-bottom: 5px;">
                                        <input v-model="line.options[oIdx]" type="text" placeholder="e.g., i < arr.length;" style="flex: 1; border-color: #3b82f6; background: #0f172a; padding: 8px; color: white;">
                                        <button type="button" @click="line.options.splice(oIdx, 1)" class="btn-icon text-danger"><i class="fas fa-times"></i></button>
                                    </div>
                                    <button type="button" @click="if(!line.options) line.options = []; line.options.push('')" class="btn-text text-primary mt-1"><i class="fas fa-plus"></i> Add Option</button>
                                </div>
                            </div>
                            <button type="button" @click="formData.practice.codeLines.push({text:'', isBlank:false, blankType: 'input', correctAnswer:'', options: []})" class="btn-secondary mt-3"><i class="fas fa-plus"></i> Add Code Line</button>
                        </div>

                        <div class="form-section">
                            <h3><i class="fas fa-lightbulb text-warning"></i> Hints</h3>
                            <div v-for="(hint, hIndex) in formData.practice.hints" :key="hIndex" class="logic-row mb-2">
                                <span class="hint-tag">Hint {{ hIndex + 1 }}</span>
                                <input v-model="formData.practice.hints[hIndex]" type="text" placeholder="Enter hint text for the student..." class="flex-grow">
                                <button type="button" @click="formData.practice.hints.splice(hIndex, 1)" class="btn-icon text-danger"><i class="fas fa-times"></i></button>
                            </div>
                            <button type="button" @click="formData.practice.hints.push('')" class="btn-secondary mt-3"><i class="fas fa-plus"></i> Add New Hint</button>
                        </div>

                        <div class="form-actions mt-4 text-right">
                            <button type="submit" class="btn-primary btn-lg"><i class="fas fa-rocket"></i> Deploy Algorithm</button>
                        </div>
                    </form>

                    <div class="form-section mt-5">
                        <h3><i class="fas fa-list text-primary"></i> Algorithm Management</h3>
                        <div class="table-container mt-3">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Algorithm Name</th>
                                        <th>Level</th>
                                        <th>Visual Engine</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="algo in algorithmsList" :key="algo.algo_id">
                                        <td><strong>{{ algo.title }}</strong> <span class="text-muted">({{ algo.algo_id }})</span></td>
                                        <td><span class="badge badge-primary">Lvl {{ algo.level ? algo.level.split('_')[1] || algo.level : algo.level_num || 1 }}</span></td>
                                        <td><i class="fas fa-eye text-muted"></i>  {{ (algo.visual_pattern || 'array').replace('_', ' ') }}</td>
                                        <td>
                                            <button @click="deleteAlgorithm(algo.algo_id)" class="btn-action text-danger" title="Delete">
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section v-if="currentTab === 'students'" class="tab-section animation-fade">
                    <div class="section-header flex-between">
                        <div>
                            <h3><i class="fas fa-users-cog text-primary"></i> Students Reports</h3>
                            <p class="text-muted">Comprehensive database view of all registered learners.</p>
                        </div>
                        <div class="export-actions">
                            <select v-model="reportPeriod" class="filter-select">
                                <option value="all">All Time</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="semi">Semi-Annual</option>
                                <option value="annual">This Year</option>
                            </select>
                            <button @click="exportCSV" class="btn-primary2" style="background: #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);"><i class="fas fa-file-excel"></i> Export CSV</button>
                        </div>
                    </div>

                    <div class="table-container custom-scrollbar">
                        <table class="admin-table advanced-table">
                            <thead>
                                <tr>
                                    <th>Student Identity</th>
                                    <th>Progression</th>
                                    <th>Resources</th>
                                    <th>Activity Timeline</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="student in filteredStudents" :key="student.id">
                                    <td>
                                        <div class="user-cell">
                                            <div class="user-avatar" :style="student.profile_image ? `background-image: url(${student.profile_image}); background-size: cover;` : ''">
                                                {{ !student.profile_image ? student.full_name.charAt(0).toUpperCase() : '' }}
                                            </div>
                                            <div class="user-details">
                                                <span class="user-name">{{ student.full_name }}</span>
                                                <span class="user-id">#ALGO-{{ student.id }} | {{ student.email }}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td>
                                        <div class="progression-cell">
                                            <div class="level-badge">Lvl {{ student.current_level || 1 }}</div>
                                            <div class="xp-text"><strong class="text-warning">{{ student.total_points || 0 }}</strong> XP</div>
                                            <div class="solved-text"><i class="fas fa-check-circle text-success"></i> {{ student.solved_count || 0 }} Solved</div>
                                        </div>
                                    </td>

                                    <td>
                                        <div class="resource-badge" title="Help Points Available">
                                            <i class="fas fa-lightbulb text-warning"></i> {{ student.help_points || 0 }}
                                        </div>
                                    </td>

                                    <td>
                                        <div class="timeline-cell">
                                            <span class="badge" :class="getStudentStatus(student) === 'Active' ? 'badge-success' : 'badge-warning'">
                                                {{ getStudentStatus(student) }}
                                            </span>
                                            <div class="time-text mt-1"><i class="fas fa-sign-in-alt text-muted"></i> Joined: {{ formatDate(student.created_at) }}</div>
                                            <div class="time-text"><i class="fas fa-clock text-muted"></i> Last Seen: {{ formatDate(student.last_active) }}</div>
                                        </div>
                                    </td>

                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-action view" title="Full Database Profile" @click="openStudentModal(student)"><i class="fas fa-id-card"></i></button>
                                            <button class="btn-action" :class="student.is_suspended ? 'text-success unban' : 'text-danger ban'" 
                                              :title="student.is_suspended ? 'Lift Suspension' : 'Suspend Account'" @click="toggleBanStatus(student)">
                                              <i class="fas" :class="student.is_suspended ? 'fa-user-check' : 'fa-user-slash'"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="filteredStudents.length === 0">
                                    <td colspan="5" class="empty-state">
                                        <i class="fas fa-ghost fa-3x mb-3"></i>
                                        <p>No records found in the database for the selected period.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="reports-integration-section mt-5">
    <div class="section-header">
        <h3><i class="fas fa-chart-area text-primary"></i> Performance Analytics & Difficulty</h3>
    </div>
    
    <div class="stats-grid mb-4">
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;"><i class="fas fa-fire"></i></div>
            <div class="stat-info">
                <h3>Hardest Algorithm (Avg Time)</h3>
                <p class="stat-number">{{ hardestAlgoName }}</p>
                <span class="stat-trend text-danger"><i class="fas fa-clock"></i> {{ avgExecutionTime }} ms</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;"><i class="fas fa-trophy"></i></div>
            <div class="stat-info">
                <h3>Competitions Engagement</h3>
                <p class="stat-number">{{ activeCompetitionsCount || 0 }} Active</p>
                <span class="stat-trend positive">Total Enrolled: {{ totalEnrollments || 0 }}</span>
            </div>
        </div>
    </div>

    <div class="table-container mt-4">
        <h4 style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); margin: 0;"><i class="fas fa-list-alt text-primary"></i> Comprehensive Algorithms Report</h4>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Algorithm</th>
                    <th>Total Submissions</th>
                    <th>Average Time Spent</th>
                    <th>Difficulty Status</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(rep, idx) in reportsData" :key="rep.algo_id || rep.problem_id || idx">
                    <td>
                        <strong>{{ rep.title || rep.algo_name || 'Algorithm ID: ' + (rep.algo_id || rep.problem_id) }}</strong> 
                    </td>
                    <td>{{ rep.submission_count || rep.completion_count || 0 }} Solved</td>
                    <td>{{ rep.avg_time }} ms</td>
                    <td>
                        <span class="badge" :class="rep.avg_time > 60 ? 'badge-danger' : 'badge-success'">
                            {{ rep.avg_time > 60 ? 'Hard' : (rep.avg_time > 0 ? 'Normal' : 'No Data') }}
                        </span>
                    </td>
                </tr>
                <tr v-if="!reportsData || reportsData.length === 0">
                    <td colspan="4" class="text-center text-muted">No algorithm data available yet.</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

                    <div v-if="selectedStudent" class="modal-overlay" @click.self="closeStudentModal">
                        <div class="modal-content profile-modal animation-pop">
                            <button @click="closeStudentModal" class="close-modal-btn"><i class="fas fa-times"></i></button>
                            
                            <div class="profile-cover">
                                <div class="profile-avatar-large" :style="selectedStudent.profile_image ? `background-image: url(${selectedStudent.profile_image});` : ''">
                                    {{ !selectedStudent.profile_image ? selectedStudent.full_name.charAt(0).toUpperCase() : '' }}
                                </div>
                            </div>

                            <div class="profile-header-info">
                                <h3>{{ selectedStudent.full_name }}</h3>
                                <p class="text-muted"><i class="fas fa-envelope"></i> {{ selectedStudent.email }}</p>
                                <div class="profile-badges">
                                    <span class="badge badge-primary">#ALGO-{{ selectedStudent.id }}</span>
                                    <span class="badge" :class="getStudentStatus(selectedStudent) === 'Active' ? 'badge-success' : 'badge-warning'">
                                        <i class="fas fa-circle" style="font-size:0.6rem; margin-right:4px;"></i> {{ getStudentStatus(selectedStudent) }}
                                    </span>
                                </div>
                            </div>

                            <div class="db-stats-container mt-4">
                                <h4 class="stats-group-title"><i class="fas fa-chart-pie text-primary"></i> Learning Progression</h4>
                                <div class="stats-grid-small mb-3">
                                    <div class="stat-box">
                                        <i class="fas fa-layer-group text-primary"></i>
                                        <div class="val">Level {{ selectedStudent.current_level || 1 }}</div>
                                        <div class="lbl">Current Tier</div>
                                    </div>
                                    <div class="stat-box">
                                        <i class="fas fa-star text-warning"></i>
                                        <div class="val">{{ selectedStudent.total_points || 0 }}</div>
                                        <div class="lbl">Total XP</div>
                                    </div>
                                    <div class="stat-box">
                                        <i class="fas fa-check-circle text-success"></i>
                                        <div class="val">{{ selectedStudent.solved_count || 0 }}</div>
                                        <div class="lbl">Algos Solved</div>
                                    </div>
                                </div>

                                <h4 class="stats-group-title"><i class="fas fa-box-open text-warning"></i> Inventory & Resources</h4>
                                <div class="stats-grid-small mb-3" style="grid-template-columns: 1fr;">
                                    <div class="stat-box flex-row-box">
                                        <div>
                                            <i class="fas fa-lightbulb text-warning fa-2x mb-0"></i>
                                        </div>
                                        <div class="text-left">
                                            <div class="val">{{ selectedStudent.help_points || 0 }} Points Available</div>
                                            <div class="lbl">Unused Help Points (Hints)</div>
                                        </div>
                                    </div>
                                </div>
                                <h4 class="stats-group-title mt-4"><i class="fas fa-route text-success"></i> Real-time Learning Path</h4>
                                
                                <div class="current-focus-card mb-3">
                                    <span class="text-muted">Current Focus:</span>
                                    <strong class="text-primary ml-2" style="font-size: 1.1rem;">
                                        <i class="fas fa-crosshairs"></i> {{ currentAlgorithm }}
                                    </strong>
                                </div>

                                <div v-if="isLoadingProgress" class="text-center p-4 text-muted">
                                    <i class="fas fa-spinner fa-spin fa-2x mb-2"></i>
                                    <p>Loading database progress...</p>
                                </div>
                                
                                <div v-else-if="studentProgress.length === 0" class="text-center p-4 text-muted border-dashed">
                                    <i class="fas fa-code fa-2x mb-2"></i>
                                    <p>No algorithms started yet.</p>
                                </div>

                                <div v-else class="progress-history-container custom-scrollbar">
                                    <table class="progress-table">
                                        <thead>
                                            <tr>
                                                <th>Algorithm ID</th>
                                                <th>Status</th>
                                                <th>Time Spent</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="prog in studentProgress" :key="prog.id">
                                                <td style="font-weight: 500;">
                                                    {{ prog.algo_id }} 
                                                    <span class="mini-lvl-badge" v-if="prog.level_id">Lvl {{ prog.level_id.split('_')[1] }}</span>
                                                </td>
                                                <td>
                                                    <span class="status-dot" :class="prog.is_completed ? 'completed' : 'unlocked'"></span>
                                                    {{ prog.is_completed ? 'Completed' : 'In Progress' }}
                                                </td>
                                                <td style="font-family: monospace; color: #eab308; font-weight: bold;">
                                                    <i class="fas fa-stopwatch"></i> {{ formatTimeSpent(prog.time_spent) }}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4 class="stats-group-title"><i class="fas fa-history text-muted"></i> Timeline & Metadata</h4>
                                <div class="details-list">
                                    <div class="detail-item">
                                        <span class="text-muted"><i class="fas fa-calendar-plus"></i> Account Created:</span>
                                        <span style="font-weight: 500;">{{ formatDate(selectedStudent.created_at) }}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="text-muted"><i class="fas fa-clock"></i> Last Activity:</span>
                                        <span style="font-weight: 500;">{{ formatDate(selectedStudent.last_active) }}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="text-muted"><i class="fas fa-database"></i> Account ID:</span>
                                        <span style="font-family: monospace; color: #3b82f6;">{{ selectedStudent.id }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="modal-footer mt-4">
                                <a :href="'mailto:' + selectedStudent.email" class="btn-primary2" style="text-decoration: none; display:flex; align-items:center; gap:8px;">
                                    <i class="fas fa-envelope"></i> Email Student
                                </a>
                                <button class="btn-danger" @click="deleteUser(selectedStudent.id); closeStudentModal()">
                                    <i class="fas fa-trash-alt"></i> Delete Account
                                </button>
                            </div>
                        </div>

                    </div>
                </section>

<section v-if="currentTab === 'competitions'" class="tab-section animation-fade">
    <div class="section-header flex-between">
        <div>
            <h2><i class="fas fa-trophy text-warning"></i> Arena Management</h2>
            <p class="text-muted">Create high-stakes coding tournaments and theory quizzes.</p>
        </div>
    </div>

    <form @submit.prevent="saveCompetition" class="admin-form">
        <div class="form-section">
            <h3 class="mb-3"><i class="fas fa-info-circle text-primary"></i> Competition Settings</h3>
            <div class="form-grid">
    <div class="input-group">
        <label>Competition Title</label>
        <input v-model="compForm.title" type="text" placeholder="e.g. Winter Algorithm Cup" required>
    </div>
    <div class="input-group">
        <label>Status</label>
        <select v-model="compForm.status" required>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live Now</option>
            <option value="ongoing">Ongoing</option>
        </select>
    </div>
    <div class="input-group">
        <label>Time Limit (Minutes)</label>
        <input v-model="compForm.time_limit" type="number" min="1" required placeholder="e.g. 60">
    </div>
    <div class="input-group">
        <label>Max Reward Points</label>
        <input v-model="compForm.max_points" type="number" min="10" step="10" required placeholder="e.g. 500">
    </div>
    <div class="input-group">
        <label>Required Level</label>
        <input v-model="compForm.level_required" type="number" min="1" max="5">
    </div>
    <div class="input-group">
        <label>Icon (FA Class)</label>
        <input v-model="compForm.icon" type="text" placeholder="fa-fire">
    </div>
    <div class="input-group">
        <label>Start Date</label>
        <input v-model="compForm.start_date" type="datetime-local" required>
    </div>
    <div class="input-group">
        <label>End Date (Optional)</label>
        <input v-model="compForm.end_date" type="datetime-local">
    </div>
</div>
            <div class="input-group mt-3 full-width">
                <label>Description & Rules</label>
                <textarea v-model="compForm.description" rows="3" placeholder="Describe the prize and rules..." required></textarea>
            </div>
        </div>

        <div class="form-section mt-4">
            <h3 class="mb-3 text-warning"><i class="fas fa-list-ol"></i> Part 1: Theory Questions (MCQs)</h3>
            <div v-for="(q, qIdx) in compForm.questions" :key="'q-'+qIdx" class="quiz-card mb-3">
                <div class="blank-header">
                    <h4>Question {{ qIdx + 1 }}</h4>
                    <button type="button" @click="removeCompMCQ(qIdx)" class="btn-icon text-danger"><i class="fas fa-trash"></i></button>
                </div>
                <input v-model="q.question" type="text" placeholder="Enter question text..." class="quiz-question-input mb-3">
                
                <div class="options-container">
                    <div v-for="(opt, oIdx) in q.options" :key="'o-'+oIdx" class="option-row" :class="{'is-correct': opt.isCorrect}">
                        <input type="radio" :name="'comp_correct_'+qIdx" :checked="opt.isCorrect" @change="setCompCorrectOption(qIdx, oIdx)">
                        <input v-model="opt.text" type="text" placeholder="Option text..." class="quiz-option-input">
                        <button type="button" @click="removeCompOption(qIdx, oIdx)" class="btn-icon text-danger"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <button type="button" @click="addCompOption(qIdx)" class="btn-text text-primary mt-2"><i class="fas fa-plus-circle"></i> Add Option</button>
            </div>
            <button type="button" @click="addCompMCQ" class="btn-secondary w-100 mt-2"><i class="fas fa-plus"></i> Add Theory Question</button>
        </div>

        <div class="form-section mt-4">
            <h3 class="mb-3 text-success"><i class="fas fa-code"></i> Part 2: Coding Challenges</h3>
            <div v-for="(p, pIdx) in compForm.coding_problems" :key="'p-'+pIdx" class="quiz-card mb-3" style="border-left: 4px solid #22c55e;">
                <div class="blank-header">
                    <h4>Coding Problem {{ pIdx + 1 }}</h4>
                    <button type="button" @click="removeCompCodingProblem(pIdx)" class="btn-icon text-danger"><i class="fas fa-trash"></i></button>
                </div>
                <div class="input-group mb-3">
                    <label>Problem Prompt (What should they solve?)</label>
                    <textarea v-model="p.prompt" rows="3" placeholder="e.g. Write a function to reverse a linked list..."></textarea>
                </div>
                <div class="input-group">
                    <label>Starter Code (Template)</label>
                    <textarea v-model="p.starter_code" rows="5" style="font-family: monospace; background: #000; color: #22c55e;" placeholder="function solve() { \n\n }"></textarea>
                </div>
            </div>
            <button type="button" @click="addCompCodingProblem" class="btn-secondary w-100 mt-2" style="border-color: #22c55e; color: #22c55e;"><i class="fas fa-plus"></i> Add Coding Challenge</button>
        </div>

        <div class="form-actions mt-4 text-right">
            <button type="submit" class="btn-primary btn-lg" :disabled="isSavingComp">
                <i class="fas fa-rocket"></i> {{ isSavingComp ? 'Deploying Arena...' : 'Deploy Competition' }}
            </button>
        </div>
    </form>
</section>

                <section v-if="currentTab === 'submissions'" class="tab-section animation-fade">
    <div class="section-header">
        <h2><i class="fas fa-code-branch text-primary"></i> Review & Grade Submissions</h2>
        <p class="text-muted">Review submitted code by students, evaluate them, and provide feedback.</p>
    </div>

    <div class="table-container custom-scrollbar">
        <table class="admin-table advanced-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Algorithm</th>
                    <th>Submission Time</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="sub in studentSubmissions" :key="sub.id">
                    <td><strong>{{ sub.student_name }}</strong></td>
                    <td>{{ sub.algo_id }}</td>
                    <td>{{ formatDate(sub.submitted_at) }}</td>
                    <td>
                        <span class="badge" :class="sub.status === 'pending' ? 'badge-warning' : (sub.status === 'approved' ? 'badge-success' : 'badge-danger')">
                            {{ sub.status }}
                        </span>
                    </td>
                    <td>
    <button class="btn-primary2" @click="openReviewModal(sub)">Review</button>
</td>
                </tr>
                <tr v-if="!studentSubmissions || studentSubmissions.length === 0">
                    <td colspan="5" class="text-center text-muted">No submissions pending review.</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>
<div v-if="reviewingSubmission" class="modal-overlay" @click.self="closeReviewModal">
    <div class="modal-content profile-modal animation-pop" style="max-width: 800px; padding: 30px;">
        <div class="modal-header flex-between mb-4">
            <h3><i class="fas fa-clipboard-check text-primary"></i> Review Submission</h3>
            <button @click="closeReviewModal" class="btn-icon text-muted"><i class="fas fa-times"></i></button>
        </div>

        <div class="review-details mb-4" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; border: 1px solid #334155;">
            <p class="mb-2"><strong class="text-muted"><i class="fas fa-user"></i> Student:</strong> {{ reviewingSubmission.student_name }}</p>
            <p class="mb-0"><strong class="text-muted"><i class="fas fa-laptop-code"></i> Task / Algorithm:</strong> {{ reviewingSubmission.algo_id }}</p>
        </div>

        <div class="submission-content custom-scrollbar" style="max-height: 40vh; overflow-y: auto; padding-right: 10px;">
            <div v-if="parsedSubmissionData.type === 'json'">
                <h4 class="text-warning mb-2" style="font-size: 1rem;"><i class="fas fa-list-ol"></i> MCQ Answers</h4>
                <pre class="code-block mb-4">{{ parsedSubmissionData.mcq }}</pre>

                <h4 class="text-success mb-2" style="font-size: 1rem;"><i class="fas fa-code"></i> Coding Solutions</h4>
                <div v-for="(code, idx) in parsedSubmissionData.code" :key="idx" class="mb-3">
                    <h5 class="text-muted" style="font-size: 0.9rem;">Problem {{ idx + 1 }}</h5>
                    <pre class="code-block">{{ code }}</pre>
                </div>
            </div>
            <div v-else>
                <h4 class="text-success mb-2" style="font-size: 1rem;"><i class="fas fa-code"></i> Submitted Code</h4>
                <pre class="code-block">{{ parsedSubmissionData.content }}</pre>
            </div>
        </div>

        <div class="review-actions-section mt-4 pt-4" style="border-top: 1px solid rgba(255,255,255,0.05);">
            <h4 class="mb-3" style="font-size: 1.1rem;"><i class="fas fa-balance-scale"></i> Evaluation</h4>
            
            <div class="action-buttons mb-3" style="display:flex; gap:15px;">
                <button :class="['btn-action-select', reviewAction === 'approved' ? 'selected-approved' : '']" @click="reviewAction = 'approved'">
                    <i class="fas fa-check-circle"></i> Approve Solution
                </button>
                <button :class="['btn-action-select', reviewAction === 'rejected' ? 'selected-rejected' : '']" @click="reviewAction = 'rejected'">
                    <i class="fas fa-times-circle"></i> Reject & Return
                </button>
            </div>

            <textarea v-model="reviewFeedback" rows="3" class="feedback-input" placeholder="Add constructive feedback for the student (Optional)..."></textarea>
        </div>

        <div class="modal-footer mt-4" style="justify-content: flex-end; gap: 10px; padding: 0; background: transparent; border: none;">
            <button class="btn-secondary" @click="closeReviewModal">Cancel</button>
            <button class="btn-primary mb-0" :disabled="!reviewAction" @click="submitReview" :style="!reviewAction ? 'opacity: 0.5; cursor: not-allowed;' : ''">
                <i class="fas fa-paper-plane"></i> Submit Grade
            </button>
        </div>
    </div>
</div>
            </div>
        </main>
    </div>
    
    <div v-else style="height: 100vh; display:flex; align-items:center; justify-content:center; background:#0f172a; color:white;">
        <h2><i class="fas fa-spinner fa-spin"></i> Checking Admin Credentials...</h2>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// --- State Management ---
const isAdminVerified = ref(false)
const currentTab = ref('overview')
const tokenCookie = useCookie('admin_token')
const dashboardData = ref({ totalStudents: 0, students: [] })

// --- Student Modal State & Progress ---
const selectedStudent = ref(null);
const studentProgress = ref([]); 
const isLoadingProgress = ref(false); 

const formatTimeSpent = (seconds) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
};

const currentAlgorithm = computed(() => {
    if (!studentProgress.value || studentProgress.value.length === 0) return 'None (Not Started)';
    const active = studentProgress.value.find(p => !p.is_completed || p.status === 'unlocked');
    if (active) return `${active.algo_id} (Level ${active.level_id ? active.level_id.split('_')[1] : 1})`;
    const last = studentProgress.value[0]; 
    return `Completed All Up To: ${last.algo_id}`;
});

const openStudentModal = async (student) => {
    selectedStudent.value = student;
    studentProgress.value = [];
    isLoadingProgress.value = true;
    
    try {
        const progressData = await $fetch(`http://localhost:5000/api/admin/users/${student.id}/progress`, {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });
        studentProgress.value = progressData;
    } catch (error) {
        console.error("Failed to load progress", error);
    } finally {
        isLoadingProgress.value = false;
    }
};

const closeStudentModal = () => {
    selectedStudent.value = null;
    studentProgress.value = [];
};

// --- Reports State ---
const activereportPeriod = ref('monthly'); 
const reportsData = ref([]);
const avgExecutionTime = ref(0);
const avgMemoryUsage = ref(0);
const totalSubmissionsCount = ref(0);
const hardestAlgoName = ref("N/A");
const activeCompetitionsCount = ref(0);
const totalEnrollments = ref(0);

// --- Reports Methods ---
const fetchReportData = async () => {
    try {
        const analyticsRes = await $fetch(`http://localhost:5000/api/admin/analytics-reports`, {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });

        // Support multiple possible response shapes from the API
        const payload = analyticsRes && analyticsRes.analytics ? analyticsRes.analytics : analyticsRes || {};

        hardestAlgoName.value = payload.hardestAlgoName || payload.hardest_algo_name || "N/A";
        avgExecutionTime.value = payload.avgExecutionTime || payload.avg_execution_time || 0;
        activeCompetitionsCount.value = payload.activeCompetitionsCount || payload.active_competitions_count || 0;
        totalEnrollments.value = payload.totalEnrollments || payload.total_enrollments || 0;

        // If API didn't provide total enrollments, derive it from competitions endpoint
        if (!totalEnrollments.value) {
            try {
                const comps = await $fetch('http://localhost:5000/api/admin/competitions', { headers: { 'Authorization': `Bearer ${tokenCookie.value}` } });
                if (Array.isArray(comps)) {
                    totalEnrollments.value = comps.reduce((s, c) => s + (Number(c.enrolled_count) || 0), 0);
                    // also set activeCompetitionsCount if missing
                    if (!activeCompetitionsCount.value) activeCompetitionsCount.value = comps.filter(c => c.status === 'live' || c.status === 'ongoing').length;
                }
            } catch (e) {
                console.warn('Could not fetch competitions to compute totalEnrollments', e);
            }
        }

        // Comprehensive report may be named differently or be the root array
        reportsData.value = payload.comprehensiveReport || payload.comprehensive_report || (Array.isArray(analyticsRes) ? analyticsRes : []);

        // Merge in any algorithms from algorithmsList that are missing (static/unused algos)
        try {
            const existing = Array.isArray(reportsData.value) ? [...reportsData.value] : [];
            const mapById = new Map();
            existing.forEach(r => {
                const id = r.algo_id || r.problem_id || (r.algo && r.algo.id) || r.id || r.title;
                if (id) mapById.set(String(id), r);
            });

            algorithmsList.value.forEach(alg => {
                const algId = alg.algo_id || alg.id || alg._id || alg.algoId || alg.name || alg.title;
                const key = algId ? String(algId) : null;
                if (!key) return;
                if (!mapById.has(key)) {
                    const rep = {
                        algo_id: alg.algo_id || alg.id || alg._id || null,
                        title: alg.title || alg.name || ('Algorithm: ' + key),
                        submission_count: 0,
                        avg_time: 0
                    };
                    existing.push(rep);
                    mapById.set(key, rep);
                }
            });

            reportsData.value = existing;

            // Recompute hardest algorithm based on combined data if API didn't provide it
            const maxEntry = reportsData.value.reduce((acc, cur) => {
                const t = Number(cur.avg_time || cur.avgTime || cur.avg_execution_time || 0);
                if (t > (acc.val || 0)) return { val: t, entry: cur };
                return acc;
            }, { val: 0, entry: null });
            if (maxEntry.entry) {
                hardestAlgoName.value = maxEntry.entry.title || maxEntry.entry.algo_name || maxEntry.entry.algo_id || 'N/A';
                avgExecutionTime.value = maxEntry.val || 0;
            }
        } catch (mergeErr) {
            console.warn('Failed to merge static algorithms into reports', mergeErr);
        }
    } catch (error) {
        console.error("Report Fetch Error:", error);
    }
};

// --- Initialization & Data Fetching ---
onMounted(async () => {
    if (!tokenCookie.value) {
        navigateTo('/admin/login')
        return
    }
    try {
        const response = await $fetch('http://localhost:5000/api/admin/dashboard-data', {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        })
        dashboardData.value = response;
        isAdminVerified.value = true; 
    } catch (error) {
        console.error("Admin verification failed:", error)
        navigateTo('/') 
    }
    // Ensure algorithms are loaded first so we can include static algorithms in reports
    await fetchAlgorithms();
    await fetchReportData();
    await fetchSubmissions();
})

// ================= 1. DASHBOARD ANALYTICS =================
const totalPlatformXP = computed(() => dashboardData.value.students.reduce((sum, student) => sum + (student.total_points || 0), 0));
const totalAlgorithmsSolved = computed(() => dashboardData.value.students.reduce((sum, student) => sum + (student.solved_count || 0), 0));
const averageLevel = computed(() => {
    if (dashboardData.value.students.length === 0) return 0;
    const sum = dashboardData.value.students.reduce((s, student) => s + (student.current_level || 1), 0);
    return (sum / dashboardData.value.students.length).toFixed(1);
});
const topPerformers = computed(() => {
    return [...dashboardData.value.students].sort((a, b) => (Number(b.total_points) || 0) - (Number(a.total_points) || 0)).slice(0, 5);
});

// ================= 2. ALGORITHM BUILDER =================
const algorithmsList = ref([]); 

const formData = ref({
    level_num: 1, algo_id: '', title: '', description: '', icon: '', visual_pattern: 'array', 
    quiz: [{ question: '', options: [{ text: '', isCorrect: true }] }],
    practice: {
        initialState: '', targetState: '',   
        codeLines: [{ text: '', isBlank: false, blankType: 'input', correctAnswer: '', options: [] }],
        hints: [''] 
    }
});

const iconSearchQuery = ref('');
const showIconDropdown = ref(false);
const iconList = ['fa-code', 'fa-laptop-code', 'fa-cogs', 'fa-database', 'fa-sitemap', 'fa-network-wired', 'fa-layer-group', 'fa-brain', 'fa-bolt', 'fa-fire', 'fa-water', 'fa-wind', 'fa-cube', 'fa-cubes', 'fa-project-diagram', 'fa-server', 'fa-bug', 'fa-shield-alt', 'fa-key', 'fa-lock', 'fa-unlock', 'fa-search', 'fa-sort-amount-up', 'fa-random', 'fa-star', 'fa-trophy', 'fa-gamepad', 'fa-puzzle-piece', 'fa-magic', 'fa-gem', 'fa-map-marker-alt', 'fa-eye', 'fa-rocket', 'fa-calculator', 'fa-compass', 'fa-map', 'fa-chart-line', 'fa-user-secret', 'fa-terminal', 'fa-globe'];

const filteredIcons = computed(() => {
    if (!iconSearchQuery.value) return []; 
    const query = iconSearchQuery.value.trim().toLowerCase();
    return iconList.filter(icon => icon.toLowerCase().includes(query)).slice(0, 6);
});

const selectIcon = (icon) => {
    formData.value.icon = icon;
    iconSearchQuery.value = icon; 
    showIconDropdown.value = false; 
};

watch(iconSearchQuery, (newVal) => {
    if(newVal && !newVal.includes('fa-')) formData.value.icon = `fa-${newVal}`;
    else formData.value.icon = newVal;
});

const deleteAlgorithm = async (algoId) => {
    if (!confirm(`Are you sure you want to delete the algorithm "${algoId}"? This action cannot be undone.`)) return;
    try {
        await $fetch(`http://localhost:5000/api/admin/algorithms/${algoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });
        algorithmsList.value = algorithmsList.value.filter(a => a.algo_id !== algoId);
        alert("Algorithm deleted successfully.");
    } catch (error) { alert("Error deleting algorithm"); }
};

const fetchAlgorithms = async () => {
    try {
        const res = await $fetch('http://localhost:5000/api/algorithms', { headers: { 'Authorization': `Bearer ${tokenCookie.value}` } });
        algorithmsList.value = res;
    } catch (e) { console.error("Error fetching algorithms", e); }
};

const addQuizQuestion = () => formData.value.quiz.push({ question: '', options: [{ text: '', isCorrect: true }] })
const removeQuizQuestion = (idx) => formData.value.quiz.splice(idx, 1)
const addOption = (qIdx) => formData.value.quiz[qIdx].options.push({ text: '', isCorrect: false })
const removeOption = (qIdx, oIdx) => formData.value.quiz[qIdx].options.splice(oIdx, 1)
const setCorrectOption = (qIdx, correctOIdx) => formData.value.quiz[qIdx].options.forEach((opt, idx) => opt.isCorrect = (idx === correctOIdx))

const saveAlgorithm = async () => {
    let payload = JSON.parse(JSON.stringify(formData.value));
    payload.level = `level_${payload.level_num}`;
    try {
        const response = await $fetch('http://localhost:5000/api/admin/algorithms', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` },
            body: payload
        });
        alert(response.message || "Algorithm Deployed Successfully!");
        fetchAlgorithms();
    } catch (error) { alert("Error saving algorithm. Make sure the ID is unique."); }
}

// ================= 3. STUDENT ANALYTICS & EXPORT =================
const reportPeriod = ref('all');

const filteredStudents = computed(() => {
    const now = new Date();
    return dashboardData.value.students.filter(student => {
        if (reportPeriod.value === 'all') return true;
        const regDate = new Date(student.created_at);
        if (isNaN(regDate.getTime())) return true; 

        if (reportPeriod.value === 'month') return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
        if (reportPeriod.value === 'quarter') return Math.floor(now.getMonth() / 3) === Math.floor(regDate.getMonth() / 3) && regDate.getFullYear() === now.getFullYear();
        if (reportPeriod.value === 'semi') return Math.floor(now.getMonth() / 6) === Math.floor(regDate.getMonth() / 6) && regDate.getFullYear() === now.getFullYear();
        if (reportPeriod.value === 'annual') return regDate.getFullYear() === now.getFullYear();
        return true;
    });
});

const reviewSubmission = (sub) => {
    let formattedCode = sub.submitted_code;
    
    // محاولة فك تشفير الـ JSON إذا كان الحل قادماً من المسابقات
    try {
        const parsed = JSON.parse(sub.submitted_code);
        formattedCode = `--- MCQ Answers ---\n${JSON.stringify(parsed.mcq_answers, null, 2)}\n\n--- Coding Solutions ---\n${parsed.coding_solutions.join('\n\n/* Next Problem */\n\n')}`;
    } catch (e) {
        // إذا لم يكن JSON (خوارزمية عادية)، نتركه كما هو
    }

    const action = prompt(`Reviewing submission for ${sub.student_name}\nAlgo/Comp: ${sub.algo_id}\n\nSubmission Content:\n${formattedCode}\n\nType 'approved' or 'rejected' to grade:`);
    
    if (action === 'approved' || action === 'rejected') {
        const feedback = prompt('Add optional feedback for the student:');
        $fetch(`http://localhost:5000/api/admin/submissions/${sub.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` },
            body: { status: action, admin_feedback: feedback || '' }
        }).then(() => {
            alert('Graded successfully!');
            sub.status = action;
        }).catch(err => alert('Failed to grade'));
    }
}

const exportCSV = () => {
    // التحقق من وجود بيانات لتفادي تصدير ملف فارغ
    if (filteredStudents.value.length === 0 && reportsData.value.length === 0) { 
        alert("No data available to export for this period."); 
        return; 
    }

    const csvLines = [];

    // ================= القسم الأول: الملخص العام والمقاييس =================
    csvLines.push(['--- PLATFORM PERFORMANCE SUMMARY ---']);
    csvLines.push(['Metric', 'Value']);
    csvLines.push(['Selected Report Period', reportPeriod.value]);
    csvLines.push(['Hardest Algorithm', `"${hardestAlgoName.value}"`]);
    csvLines.push(['Average Execution Time', `"${avgExecutionTime.value} ms"`]);
    csvLines.push(['Active Competitions', activeCompetitionsCount.value]);
    csvLines.push(['Total Competition Enrollments', totalEnrollments.value]);
    csvLines.push([]); // سطر فارغ للفصل بين الأقسام

    // ================= القسم الثاني: تقرير تقدم الطلاب =================
    csvLines.push(['--- STUDENTS PROGRESSION REPORT ---']);
    const studentsHeaders = [
        'Student ID', 'Student Tag', 'Full Name', 'Email Address', 
        'Account Status', 'Current Tier (Level)', 'Total XP', 
        'Algorithms Solved', 'Unused Help Points', 'Registration Date', 'Last Active Date'
    ];
    csvLines.push(studentsHeaders);

    filteredStudents.value.forEach(s => {
        csvLines.push([
            s.id,
            `"#ALGO-${s.id}"`,
            `"${s.full_name.replace(/"/g, '""')}"`, // حماية من علامات الاقتباس داخل الاسم
            `"${s.email}"`,
            `"${getStudentStatus(s)}"`,
            s.current_level || 1,
            s.total_points || 0,
            s.solved_count || 0,
            s.help_points || 0,
            `"${formatDate(s.created_at)}"`,
            `"${formatDate(s.last_active)}"`
        ]);
    });
    csvLines.push([]); // سطر فارغ للفصل بين الأقسام

    // ================= القسم الثالث: تقرير أداء وصعوبة الخوارزميات =================
    csvLines.push(['--- COMPREHENSIVE ALGORITHMS DIFFICULTY REPORT ---']);
    const algosHeaders = ['Algorithm / Problem Title', 'Total Solved Submissions', 'Average Time Spent', 'Difficulty Status'];
    csvLines.push(algosHeaders);

    reportsData.value.forEach(rep => {
        const title = rep.title || rep.algo_name || 'Algorithm ID: ' + (rep.algo_id || rep.problem_id);
        const solved = rep.submission_count || rep.completion_count || 0;
        const avgTime = `${rep.avg_time || 0} ms`;
        const difficulty = rep.avg_time > 60 ? 'Hard' : (rep.avg_time > 0 ? 'Normal' : 'No Data');

        csvLines.push([
            `"${title.replace(/"/g, '""')}"`,
            solved,
            `"${avgTime}"`,
            `"${difficulty}"`
        ]);
    });

    // ================= بناء الملف وتنزيله تلقائياً =================
    // تحويل المصفوفات البرمجية إلى نص CSV منسق ومتوافق مع Excel
    const csvContent = csvLines.map(line => line.join(',')).join('\n');
    
    // إضافة الـ BOM لدعم اللغة العربية وتجنب ظهور رموز غريبة في Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `AlgoMaster_Comprehensive_Report_${reportPeriod.value}_${new Date().toISOString().split('T')[0]}.csv`;
    link.target = '_blank'; 
    link.style.display = 'none'; 
    
    document.body.appendChild(link); 
    link.click();
    
    // تنظيف الذاكرة بعد انتهاء التحميل
    setTimeout(() => { 
        document.body.removeChild(link); 
        window.URL.revokeObjectURL(url); 
    }, 200);
};

// --- Helper Functions ---
const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never'; 
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const toggleBanStatus = async (student) => {
    const actionText = student.is_suspended ? 'UNBAN' : 'SUSPEND';
    if (!confirm(`Are you sure you want to ${actionText} ${student.full_name}?`)) return;
    try {
        const res = await $fetch(`http://localhost:5000/api/admin/users/${student.id}/toggle-ban`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });
        student.is_suspended = res.is_suspended; alert(res.message);
    } catch (error) { alert('Failed to change user status.'); }
};

const getStudentStatus = (student) => {
    if (student.is_suspended) return 'Suspended'; 
    if (!student.last_active) return 'Inactive';
    const lastActive = new Date(student.last_active);
    const now = new Date();
    const diffTime = Math.abs(now - lastActive);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 1 ? 'Inactive' : 'Active';
}

const activeStudentsCount = computed(() => dashboardData.value.students.filter(s => getStudentStatus(s) === 'Active').length)

const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
        await $fetch(`http://localhost:5000/api/admin/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenCookie.value}` } });
        dashboardData.value.students = dashboardData.value.students.filter(s => s.id !== userId);
        dashboardData.value.totalStudents--;
        alert('User deleted successfully.');
    } catch (error) { alert(error.data?.error || 'Failed to delete user.'); }
};

// ================= 4. COMPETITIONS =================
const compForm = ref({ 
    title: '', 
    description: '', 
    status: 'upcoming', 
    icon: 'fa-trophy', 
    color: '#3b82f6', 
    level_required: 1, 
    start_date: '', 
    end_date: '', 
    time_limit: 60,
    max_points: 500,
    questions: [], 
    coding_problems: [] 
});
const isSavingComp = ref(false);

// دوال إدارة الأسئلة الاختيارية للمسابقات
const addCompMCQ = () => {
    compForm.value.questions.push({ 
        question: '', 
        options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] 
    });
};
const removeCompMCQ = (i) => compForm.value.questions.splice(i, 1);

const addCompOption = (qIdx) => {
    compForm.value.questions[qIdx].options.push({ text: '', isCorrect: false });
};
const removeCompOption = (qIdx, oIdx) => compForm.value.questions[qIdx].options.splice(oIdx, 1);

const setCompCorrectOption = (qIdx, oIdx) => {
    compForm.value.questions[qIdx].options.forEach((opt, idx) => {
        opt.isCorrect = (idx === oIdx);
    });
};

// دوال إدارة التحديات البرمجية للمسابقات
const addCompCodingProblem = () => {
    compForm.value.coding_problems.push({ prompt: '', starter_code: '', language: 'javascript' });
};
const removeCompCodingProblem = (i) => compForm.value.coding_problems.splice(i, 1);

// دالة الحفظ والإرسال للسيرفر
const saveCompetition = async () => {
    isSavingComp.value = true;
    try {
        const payload = JSON.parse(JSON.stringify(compForm.value));
        if (!payload.start_date) delete payload.start_date;
        if (!payload.end_date) delete payload.end_date;

        // تنظيف وحفظ البيانات
        payload.questions = (payload.questions || []).map(q => ({
            question: q.question || '',
            options: (q.options || []).filter(o => o.text && o.text.trim()).map(o => ({ text: o.text, isCorrect: !!o.isCorrect }))
        }));

        payload.coding_problems = (payload.coding_problems || []).map(p => ({
            prompt: p.prompt || '',
            starter_code: p.starter_code || '',
            language: 'javascript'
        }));

        await $fetch('http://localhost:5000/api/admin/competitions', {
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }, 
            body: payload
        });
        
        alert('Competition Deployed Successfully!');
        
        // إعادة تهيئة النموذج بعد النجاح
        compForm.value = { title: '', description: '', status: 'upcoming', icon: 'fa-trophy', color: '#3b82f6', level_required: 1, start_date: '', end_date: '', questions: [], coding_problems: [] };
        
        try { await fetchReportData(); } catch (e) { console.warn(e); }
    } catch (error) { 
        console.error('Error deploying competition:', error);
        alert(error?.data?.error || error?.message || 'Error deploying competition'); 
    } finally { isSavingComp.value = false; }
};

const handleLogout = () => { tokenCookie.value = null; navigateTo('/admin/login'); }

// ================= SUBMISSIONS STATE & FETCH =================
const studentSubmissions = ref([]);
const reviewingSubmission = ref(null);
const parsedSubmissionData = ref({ type: 'text', content: '', mcq: '', code: [] });
const reviewAction = ref(''); // 'approved' or 'rejected'
const reviewFeedback = ref('');

const openReviewModal = (sub) => {
    reviewingSubmission.value = sub;
    reviewAction.value = '';
    reviewFeedback.value = '';

    // محاولة فك تشفير البيانات لو كانت قادمة من مسابقة (MCQ و Code)
    try {
        const parsed = JSON.parse(sub.submitted_code);
        // ندعم كلتا التسميتين حسب طريقة إرسالك من الفرونت
        const mcqData = parsed.mcq_answers || parsed.mcq_results;
        const codeData = parsed.coding_solutions || parsed.code_results;

        if (mcqData || codeData) {
            parsedSubmissionData.value = {
                type: 'json',
                mcq: JSON.stringify(mcqData, null, 2),
                code: codeData || []
            };
        } else {
             parsedSubmissionData.value = { type: 'text', content: sub.submitted_code };
        }
    } catch (e) {
        // إذا لم تكن JSON (خوارزمية عادية)
        parsedSubmissionData.value = { type: 'text', content: sub.submitted_code };
    }
};

const closeReviewModal = () => {
    reviewingSubmission.value = null;
};

const submitReview = async () => {
    if (!reviewAction.value) return;

    try {
        await $fetch(`http://localhost:5000/api/admin/submissions/${reviewingSubmission.value.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` },
            body: { status: reviewAction.value, admin_feedback: reviewFeedback.value }
        });
        
        // تحديث الحالة في الجدول المحلي ليظهر التغيير فوراً
        reviewingSubmission.value.status = reviewAction.value;
        closeReviewModal();
    } catch (err) {
        alert('Failed to grade submission. Please check the connection.');
        console.error(err);
    }
};
const fetchSubmissions = async () => {
    try {
        const res = await $fetch('http://localhost:5000/api/admin/submissions', {
            headers: { 'Authorization': `Bearer ${tokenCookie.value}` }
        });
        // نقوم بفلترة الحلول لإخفاء الطلاب الذين "بدأوا" المسابقة (started) ولم يرسلوا حلاً بعد
        studentSubmissions.value = res.filter(sub => sub.status !== 'started');
    } catch (error) {
        console.error('Error fetching submissions:', error);
    }
};
</script>

<style scoped>

/* القسم العلوي من جدول التقارير */

/* تنسيق المربع الواحد */
.stat-card1 {
    background: #1e293b; /* أو لون خلفية موقعك */
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    align-items: center; /* توسيط المحتوى أفقياً */
    justify-content: center; /* توسيط المحتوى عمودياً */
    text-align: center;
    min-height: 140px; /* يضمن أن المربعات الثلاثة بنفس الطول تماماً */
    transition: transform 0.3s ease;
}

.stat-card1:hover {
    transform: translateY(-5px);
}

/* تنسيق الأيقونة */
.stat-card1 i {
    font-size: 1.8rem;
    color: #4f46e5; /* لون الأيقونات */
    margin-bottom: 10px;
}

/* تنسيق القيمة (الرقم أو الـ ID) */
.stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #dce1e7;
    display: flex;
    align-items: baseline;
    gap: 4px;
}

/* تنسيق الوحدات (ms, KB) لتبدو أصغر قليلاً بجانب الرقم */
.unit {
    font-size: 0.9rem;
    font-weight: 500;
    color: #6b7280;
}

/* تنسيق العنوان السفلي */
.stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 5px;
}

/* حالة مثالي (أخضر) */
.status-optimal {
    background-color: rgba(16, 185, 129, 0.15); /* خلفية خضراء شفافة */
    color: #10b981; /* نص أخضر فاقع */
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    padding: 10px;
}

/* حالة يحتاج تحسين (برتقالي) */
.status-warning {
    background-color: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 20px;
    padding: 10px;
}

/* حالة حرج (أحمر) */
.status-critical {
    background-color: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 20px;
    padding: 10px;
}

/* ================= FIX SELECT DROPDOWN BACKGROUND ================= */
select option {
    background-color: #1e293b; /* لون الخلفية الداكن */
    color: white; /* لون النص */
    padding: 10px;
}

/* ================= QUIZ BUILDER STYLES ================= */
.quiz-card {
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid #334155;
    padding: 25px 30px;
    border-radius: 16px;
    margin-bottom: 25px;
    transition: all 0.3s ease;
}

.quiz-card:hover {
    border-color: #475569;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.blank-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 15px;
}

.blank-header h4 {
    color: white;
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
}

/* تنسيق حقل السؤال (كبير وواضح) */
.quiz-question-input {
    width: 100%;
    padding: 16px 20px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #0f172a;
    color: white;
    font-size: 1.05rem;
    margin-bottom: 25px;
    transition: 0.3s;
    outline: none;
}

.quiz-question-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* تنسيق صف الخيارات */
.options-container {
    display: flex;
    flex-direction: column;
    gap: 12px; /* التباعد بين الخيارات */
}

.option-row {
    display: flex;
    align-items: center;
    gap: 15px;
    background: #0f172a;
    padding: 10px 15px;
    border-radius: 8px;
    border: 1px solid #334155;
    transition: 0.3s;
}

/* تمييز الخيار الصحيح بحدود خضراء خفيفة */
.option-row.is-correct {
    border-color: rgba(34, 197, 94, 0.5);
    background: rgba(34, 197, 94, 0.05);
}

.option-radio {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #22c55e; /* يجعل زر الراديو أخضر عند التحديد */
    flex-shrink: 0;
}

.quiz-option-input {
    flex: 1;
    background: transparent;
    border: none;
    color: white;
    font-size: 0.95rem;
    outline: none;
    padding: 5px 0;
}

.quiz-option-input::placeholder {
    color: #64748b;
}

.option-delete-btn {
    opacity: 0.5;
}

.option-row:hover .option-delete-btn {
    opacity: 1; /* يظهر زر الحذف بوضوح عند تمرير الماوس */
}
/* ================= PROGRESS HISTORY STYLES ================= */
.current-focus-card { background: rgba(59, 130, 246, 0.1); border: 1px dashed rgba(59, 130, 246, 0.4); padding: 12px 15px; border-radius: 8px; display: flex; align-items: center; }
.ml-2 { margin-left: 10px; }
.border-dashed { border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; }
.progress-history-container { max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 8px; }
.progress-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.progress-table th { background: rgba(0,0,0,0.4); padding: 10px 15px; color: #94a3b8; position: sticky; top: 0; z-index: 1; }
.progress-table td { padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); color: white; }
.progress-table tbody tr:hover { background: rgba(255,255,255,0.03); }
.mini-lvl-badge { background: #1e293b; border: 1px solid #334155; color: #94a3b8; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.status-dot.completed { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
.status-dot.unlocked { background: #3b82f6; box-shadow: 0 0 8px rgba(59, 130, 246, 0.6); animation: pulse 2s infinite; }

/* ================= ADMIN LAYOUT ================= */
.admin-layout { display: flex; min-height: 100vh; background-color: #0f172a; color: #f8fafc; font-family: 'Outfit', sans-serif; }
.admin-sidebar { width: 260px; background-color: #1e293b; border-right: 1px solid #334155; display: flex; flex-direction: column; flex-shrink: 0;}
.sidebar-header { padding: 25px 20px; border-bottom: 1px solid #334155; }
.logo { font-size: 1.5rem; font-weight: bold; color: white; text-decoration: none; display: flex; align-items: center; gap: 8px;}
.logo span { color: #3b82f6; }
.admin-badge { background: rgba(239, 68, 68, 0.2); color: #ef4444; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #ef4444;}
.sidebar-nav { flex: 1; padding: 20px 0; }
.sidebar-nav a { display: flex; align-items: center; gap: 15px; padding: 15px 25px; color: #94a3b8; text-decoration: none; font-size: 1.05rem; transition: 0.3s; border-left: 3px solid transparent;}
.sidebar-nav a i { width: 20px; text-align: center; }
.sidebar-nav a:hover, .sidebar-nav a.active { color: white; background: rgba(255,255,255,0.03); }
.sidebar-nav a.active { border-left-color: #3b82f6; color: #3b82f6;}
.sidebar-footer { padding: 20px; border-top: 1px solid #334155; }
.btn-logout { width: 100%; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: bold;}
.btn-logout:hover { background: rgba(239, 68, 68, 0.2); }
.admin-main { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
.topbar { height: 70px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; }
.search-bar { display: flex; align-items: center; background: #0f172a; padding: 8px 15px; border-radius: 8px; width: 300px; border: 1px solid #334155;}
.search-bar i { color: #64748b; margin-right: 10px; }
.search-bar input { background: transparent; border: none; color: white; width: 100%; outline: none; }
.admin-profile { display: flex; align-items: center; gap: 15px; }
.admin-name { font-weight: 500; }
.avatar { width: 40px; height: 40px; background: var(--gradient-main, linear-gradient(135deg, #3b82f6, #8b5cf6)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.content-wrapper { padding: 30px; overflow-y: auto; flex: 1; }
.section-header { margin-bottom: 25px; }
.section-header h2 { font-size: 1.8rem; margin-bottom: 5px; color: white;}
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.text-muted { color: #94a3b8; }
.text-primary { color: #3b82f6; }
.text-danger { color: #ef4444; }
.text-right { text-align: right; }
.mt-4 { margin-top: 20px; }
.animation-fade { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ================= STATS & TABLES ================= */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 25px; display: flex; align-items: center; gap: 20px; }
.stat-icon { width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.stat-info h3 { font-size: 0.9rem; color: #94a3b8; font-weight: normal; margin-bottom: 5px;}
.stat-number { font-size: 1.8rem; font-weight: bold; color: white; margin-bottom: 5px;}
.stat-trend { font-size: 0.8rem; color: #64748b; }
.stat-trend.positive { color: #22c55e; }

.table-container {  background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; text-align: left; }
.admin-table th { padding: 15px 20px; border-bottom: 1px solid #334155; color: #94a3b8; font-weight: 500; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;}
.admin-table td { padding: 15px 20px; border-bottom: 1px solid rgba(51, 65, 85, 0.5); vertical-align: middle; }
.admin-table tbody tr:hover { background: rgba(255,255,255,0.02); }
.user-cell { display: flex; align-items: center; gap: 12px; }
.user-avatar { width: 35px; height: 35px; background: #334155; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
.user-name { font-weight: 500; color: white; }
.badge { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
.badge-success { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
.badge-primary { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); font-family: monospace;}
.btn-action { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 5px 8px; font-size: 1.1rem; transition: 0.2s;}

/* ================= BUILDER FORM ================= */
.form-section { background: #1e293b; border: 1px solid #334155; padding: 25px; border-radius: 12px; margin-bottom: 25px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.input-group { display: flex; flex-direction: column; margin-bottom: 15px; }
.input-group label { margin-bottom: 8px; font-size: 0.9rem; color: #94a3b8; }
.input-group input, .input-group textarea, select { padding: 12px 15px; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 8px; color: white; outline:none; transition: 0.3s;}
.input-group input:focus, .input-group textarea:focus, select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
.full-width { grid-column: span 2; }
.mb-4 { margin-bottom: 20px; }

.quiz-card, .blank-card { background: rgba(0,0,0,0.15); border: 1px solid #334155; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
.blank-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;}
.option-row, .logic-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.option-row input[type="text"], .logic-row input[type="text"] { flex: 1; padding: 10px 15px; border-radius: 6px; background: #0f172a; border: 1px solid #334155; color: white;}
.logic-row-header { display: flex; align-items: center; gap: 10px; padding: 10px; color: #94a3b8; font-size: 0.85rem; font-weight: bold; border-bottom: 1px solid #334155; margin-bottom: 10px;}

/* Buttons */
.btn-primary { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; margin-bottom: 20px;}
.btn-primary2 { background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s;}
.btn-primary:hover ,.btn-primary2:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);}
.btn-secondary { background: #334155; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; transition: 0.3s;}
.btn-secondary:hover { background: #475569; }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-icon { background: none; border: none; font-size: 1.1rem; cursor: pointer; transition: 0.2s;}
.btn-icon:hover { transform: scale(1.1); }
.btn-text { background: none; border: none; cursor: pointer; font-weight: bold; padding: 0;}

.line-number, .hint-tag { background: #0f172a; color: #94a3b8; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; min-width: 40px; text-align: center; border: 1px solid #334155;}
.hint-tag { min-width: 80px; color: #eab308; background: rgba(234, 179, 8, 0.1); border-color: rgba(234, 179, 8, 0.3);}
.flex-grow { flex-grow: 1; }
.checkbox-label { cursor: pointer; user-select: none; background: rgba(0,0,0,0.2); padding: 8px 15px; border-radius: 6px; border: 1px solid #334155; transition: 0.3s;}
.checkbox-label:hover { background: rgba(255,255,255,0.05); }

/* ================= MODAL STYLES ================= */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal-header { border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; margin-bottom: 20px; }
.modal-header h3 { margin: 0; font-size: 1.4rem; color: white; }
.animation-pop { animation: popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
.close-modal-btn { position: absolute; top: 15px; right: 15px; z-index: 100; background: rgba(15, 23, 42, 0.6); border: 2px solid rgba(255, 255, 255, 0.1); color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.close-modal-btn:hover { background: #ef4444; border-color: #ef4444; transform: rotate(90deg) scale(1.1); }
.profile-modal { padding: 0; max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto; overflow-x: hidden; border-radius: 20px; position: relative; background: #1e293b;}
.profile-modal::-webkit-scrollbar { width: 8px; }
.profile-modal::-webkit-scrollbar-track { background: #0f172a; border-radius: 0 20px 20px 0; }
.profile-modal::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 8px; }

.profile-cover { height: 120px; background: var(--gradient-main, linear-gradient(135deg, #3b82f6, #8b5cf6)); position: relative; }
.profile-avatar-large { width: 90px; height: 90px; background-color: #0f172a; border: 4px solid #1e293b; border-radius: 50%; position: absolute; bottom: -45px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; color: white; background-size: cover; background-position: center; box-shadow: 0 10px 20px rgba(0,0,0,0.3);}

.profile-header-info { text-align: center; margin-top: 55px; padding: 0 20px; }
.profile-header-info h3 { font-size: 1.6rem; color: white; margin-bottom: 5px; }
.profile-badges { display: flex; justify-content: center; gap: 10px; margin-top: 10px; }

.db-stats-container { padding: 0 30px 20px; }
.stats-group-title { font-size: 0.95rem; color: white; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;}
.stats-grid-small { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.stat-box { background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 8px; padding: 15px; text-align: center; }
.stat-box i { font-size: 1.5rem; margin-bottom: 10px; }
.stat-box .val { font-size: 1.3rem; font-weight: bold; color: white; }
.stat-box .lbl { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-top: 5px; }
.text-warning { color: #f59e0b; }
.text-success { color: #22c55e; }
.flex-row-box { display: flex; align-items: center; justify-content: center; gap: 20px; text-align: left !important; padding: 20px !important; }
.text-left { text-align: left; }
.details-list { background: rgba(0,0,0,0.1); border-radius: 8px; padding: 15px; border: 1px solid #334155; }
.detail-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed rgba(255,255,255,0.05); font-size: 0.95rem; }
.detail-item:last-child { border-bottom: none; }
.modal-footer { display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; padding: 20px 30px; background: rgba(0,0,0,0.2); }

/* Advanced table specific classes */
.advanced-table th { background: rgba(0,0,0,0.2); padding: 18px 20px; font-size: 0.85rem; letter-spacing: 1px; }
.user-details { display: flex; flex-direction: column; }
.user-id { font-size: 0.75rem; color: #64748b; font-family: monospace; margin-top: 4px; }
.progression-cell { display: flex; flex-direction: column; gap: 4px; }
.level-badge { display: inline-block; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; width: fit-content;}
.xp-text, .solved-text { font-size: 0.85rem; }
.resource-badge { background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); color: white; font-weight: bold; padding: 6px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem;}
.timeline-cell { display: flex; flex-direction: column; gap: 4px; }
.time-text { font-size: 0.75rem; color: #94a3b8; }
.action-buttons { display: flex; gap: 10px; }
.btn-action { width: 35px; height: 35px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: 0.3s; background: rgba(255,255,255,0.05); }
.btn-action.view:hover { background: #3b82f6; color: white; transform: translateY(-2px);}
.btn-action.ban:hover { background: #ef4444; color: white; transform: translateY(-2px);}
.empty-state { text-align: center; padding: 50px !important; color: #64748b; }

.export-actions { display: flex; gap: 15px; align-items: center; }
.filter-select { padding: 10px 15px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: white; outline: none; cursor: pointer; }

/* Custom Scrollbar for tables */
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

@keyframes popIn { from {transform: scale(0.8); opacity: 0;} to {transform: scale(1); opacity: 1;} }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }

/* ================= ICON SMART DROPDOWN ================= */
.position-relative { position: relative; }
.icon-dropdown { 
    position: absolute; top: 100%; left: 0; width: 100%; 
    background: #1e293b; border: 1px solid #3b82f6; border-radius: 8px; 
    margin-top: 5px; max-height: 250px; overflow-y: auto; z-index: 1000;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
.icon-option { 
    padding: 12px 15px; cursor: pointer; display: flex; align-items: center; gap: 15px;
    border-bottom: 1px solid #334155; transition: 0.2s; color: white;
}
.icon-option:last-child { border-bottom: none; }
.icon-option:hover { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.icon-option i { width: 25px; text-align: center; font-size: 1.2rem; }

/* ================= REVIEW MODAL STYLES ================= */
.code-block {
    background: #020617; /* لون داكن للكود */
    color: #a78bfa; /* لون النص ليتناسب مع الأكواد */
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #334155;
    font-family: monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-break: break-all;
}

.btn-action-select {
    flex: 1;
    padding: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid #334155;
    border-radius: 8px;
    color: #94a3b8;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.btn-action-select:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}

.selected-approved {
    background: rgba(34, 197, 94, 0.1) !important;
    border-color: #22c55e !important;
    color: #22c55e !important;
    box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
}

.selected-rejected {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: #ef4444 !important;
    color: #ef4444 !important;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

.feedback-input {
    width: 100%;
    padding: 15px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: white;
    font-size: 0.95rem;
    resize: vertical;
    outline: none;
    transition: border-color 0.3s ease;
}

.feedback-input:focus {
    border-color: #3b82f6;
}
</style>