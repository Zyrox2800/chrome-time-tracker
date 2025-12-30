document.addEventListener('DOMContentLoaded', function() {
    // State Management
    let state = {
        domainTimes: {},
        goals: [],
        achievements: [],
        user: null,
        isTrackingPaused: false,
        theme: 'light',
        focusTimer: {
            time: 25 * 60,
            running: false,
            interval: null
        }
    };

    // DOM Elements
    const elements = {
        // Header
        totalSites: document.getElementById('totalSites'),
        todayTime: document.getElementById('todayTime'),
        focusScore: document.getElementById('focusScore'),
        streakBadge: document.getElementById('streakBadge'),
        
        // Dashboard
        productiveTime: document.getElementById('productiveTime'),
        neutralTime: document.getElementById('neutralTime'),
        distractingTime: document.getElementById('distractingTime'),
        
        // Lists
        sitesList: document.getElementById('sitesList'),
        goalsList: document.getElementById('goalsList'),
        achievementsList: document.getElementById('achievementsList'),
        
        // Buttons
        resetData: document.getElementById('resetData'),
        refreshData: document.getElementById('refreshData'),
        pauseTracking: document.getElementById('pauseTracking'),
        themeToggle: document.getElementById('themeToggle'),
        exportData: document.getElementById('exportData'),
        setDailyGoal: document.getElementById('setDailyGoal'),
        
        // Tabs
        navTabs: document.querySelectorAll('.nav-tab'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        
        // Modals
        resetModal: document.getElementById('resetModal'),
        loginModal: document.getElementById('loginModal'),
        exportModal: document.getElementById('exportModal'),
        
        // Achievement counters
        unlockedCount: document.getElementById('unlockedCount'),
        totalAchievements: document.getElementById('totalAchievements')
    };

    // Achievement System
    const ACHIEVEMENTS = [
        {
            id: 'first_steps',
            title: 'First Steps',
            description: 'Track your first website',
            icon: 'compass',
            requirement: (data) => Object.keys(data.domainTimes || {}).length >= 1,
            points: 10
        },
        {
            id: 'productivity_master',
            title: 'Productivity Master',
            description: 'Spend 10 productive hours',
            icon: 'brain',
            requirement: (data) => {
                let productiveTime = 0;
                Object.values(data.domainTimes || {}).forEach(site => {
                    if (site.productivity === 2) productiveTime += site.total;
                });
                return productiveTime >= 36000; // 10 hours in seconds
            },
            points: 50
        },
        {
            id: 'focus_warrior',
            title: 'Focus Warrior',
            description: 'Complete 5 focus sessions',
            icon: 'medal',
            requirement: (data) => (data.focusSessions || 0) >= 5,
            points: 30
        },
        {
            id: 'explorer',
            title: 'Explorer',
            description: 'Visit 20 different websites',
            icon: 'map',
            requirement: (data) => Object.keys(data.domainTimes || {}).length >= 20,
            points: 40
        },
        {
            id: 'early_bird',
            title: 'Early Bird',
            description: 'Track time for 7 consecutive days',
            icon: 'sun',
            requirement: (data) => (data.streak || 0) >= 7,
            points: 60
        },
        {
            id: 'night_owl',
            title: 'Night Owl',
            description: 'Track time after 10 PM',
            icon: 'moon',
            requirement: (data) => data.nightSessions >= 1,
            points: 25
        },
        {
            id: 'time_traveler',
            title: 'Time Traveler',
            description: 'Track over 24 hours total',
            icon: 'clock',
            requirement: (data) => {
                let total = 0;
                Object.values(data.domainTimes || {}).forEach(site => {
                    total += site.total;
                });
                return total >= 86400; // 24 hours
            },
            points: 75
        },
        {
            id: 'goal_crusher',
            title: 'Goal Crusher',
            description: 'Complete 5 goals',
            icon: 'trophy',
            requirement: (data) => (data.completedGoals || 0) >= 5,
            points: 45
        },
        {
            id: 'balanced_life',
            title: 'Balanced Life',
            description: 'Balance productive and leisure time',
            icon: 'balance-scale',
            requirement: (data) => {
                let productive = 0, distracting = 0;
                Object.values(data.domainTimes || {}).forEach(site => {
                    if (site.productivity === 2) productive += site.total;
                    if (site.productivity === 0) distracting += site.total;
                });
                return productive > 0 && distracting > 0 && 
                       Math.abs(productive - distracting) < Math.max(productive, distracting) * 0.3;
            },
            points: 35
        },
        {
            id: 'weekend_warrior',
            title: 'Weekend Warrior',
            description: 'Track time on both weekend days',
            icon: 'calendar-week',
            requirement: (data) => data.weekendTracking === true,
            points: 20
        },
        {
            id: 'social_butterfly',
            title: 'Social Butterfly',
            description: 'Visit 5 different social media sites',
            icon: 'users',
            requirement: (data) => {
                const socialDomains = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'youtube'];
                let count = 0;
                Object.keys(data.domainTimes || {}).forEach(domain => {
                    if (socialDomains.some(social => domain.includes(social))) count++;
                });
                return count >= 5;
            },
            points: 30
        },
        {
            id: 'learning_champion',
            title: 'Learning Champion',
            description: 'Spend 5 hours on educational sites',
            icon: 'graduation-cap',
            requirement: (data) => {
                const educationalDomains = ['coursera', 'udemy', 'khanacademy', 'edx', 'codecademy'];
                let time = 0;
                Object.entries(data.domainTimes || {}).forEach(([domain, site]) => {
                    if (educationalDomains.some(edu => domain.includes(edu))) {
                        time += site.total;
                    }
                });
                return time >= 18000; // 5 hours
            },
            points: 55
        }
    ];

    // Initialize
    init();

    async function init() {
        await loadState();
        setupEventListeners();
        setupTimer();
        updateUI();
        
        // Auto-save every 30 seconds
        setInterval(saveState, 30000);
        // Update UI every 5 seconds
        setInterval(updateUI, 5000);
    }

    async function loadState() {
        return new Promise((resolve) => {
            chrome.storage.local.get([
                'domainTimes', 
                'goals', 
                'achievements', 
                'user', 
                'trackingPaused', 
                'theme',
                'focusSessions',
                'streak',
                'nightSessions',
                'completedGoals',
                'weekendTracking'
            ], (result) => {
                state.domainTimes = result.domainTimes || {};
                state.goals = result.goals || getDefaultGoals();
                state.achievements = result.achievements || ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));
                state.user = result.user || null;
                state.isTrackingPaused = result.trackingPaused || false;
                state.theme = result.theme || 'light';
                state.focusSessions = result.focusSessions || 0;
                state.streak = result.streak || 0;
                state.nightSessions = result.nightSessions || 0;
                state.completedGoals = result.completedGoals || 0;
                state.weekendTracking = result.weekendTracking || false;
                
                // Check and update achievements
                checkAchievements();
                resolve();
            });
        });
    }

    function saveState() {
        chrome.storage.local.set({
            goals: state.goals,
            achievements: state.achievements,
            user: state.user,
            trackingPaused: state.isTrackingPaused,
            theme: state.theme,
            focusSessions: state.focusSessions,
            streak: state.streak,
            nightSessions: state.nightSessions,
            completedGoals: state.completedGoals,
            weekendTracking: state.weekendTracking
        });
    }

    function checkAchievements() {
        let unlockedCount = 0;
        state.achievements.forEach((achievement, index) => {
            if (!achievement.unlocked && ACHIEVEMENTS[index].requirement(state)) {
                achievement.unlocked = true;
                unlockedCount++;
                showAchievementNotification(achievement);
            }
        });
        
        if (unlockedCount > 0) {
            updateAchievementsList();
            saveState();
        }
    }

    function showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-notification-icon">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <div class="achievement-notification-text">
                    <h4>Achievement Unlocked!</h4>
                    <h3>${achievement.title}</h3>
                    <p>${achievement.description}</p>
                    <div class="achievement-points">+${achievement.points} points</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    function updateUI() {
        updateStats();
        updateSitesList();
        updateGoalsList();
        updateAchievementsList();
        updateUserStatus();
    }

    function updateStats() {
        const sites = Object.keys(state.domainTimes);
        elements.totalSites.textContent = sites.length;
        
        let totalToday = 0;
        let productive = 0;
        let neutral = 0;
        let distracting = 0;
        
        const today = new Date().setHours(0, 0, 0, 0);
        
        sites.forEach(site => {
            const data = state.domainTimes[site];
            totalToday += data.total;
            
            switch(data.productivity) {
                case 2: productive += data.total; break;
                case 1: neutral += data.total; break;
                case 0: distracting += data.total; break;
            }
        });
        
        elements.todayTime.textContent = formatTime(totalToday);
        elements.productiveTime.textContent = formatTime(productive);
        elements.neutralTime.textContent = formatTime(neutral);
        elements.distractingTime.textContent = formatTime(distracting);
        
        // Calculate focus score
        const totalTime = productive + neutral + distracting;
        const score = totalTime > 0 ? Math.round((productive / totalTime) * 100) : 0;
        elements.focusScore.textContent = `${score}%`;
        
        // Update progress circle
        const circle = document.querySelector('.score-circle-fill');
        if (circle) {
            const circumference = 2 * Math.PI * 54;
            const offset = circumference - (score / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = offset;
            document.querySelector('.score-text').textContent = `${score}%`;
        }
        
        // Update streak
        elements.streakBadge.textContent = state.streak;
    }

    function formatTime(seconds) {
        if (!seconds) return "0:00";
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        
        if (hrs > 0) {
            return `${hrs}h ${mins}m`;
        }
        return `${mins}m`;
    }

    function updateSitesList() {
        const sites = Object.entries(state.domainTimes)
            .sort((a, b) => b[1].total - a[1].total);
        
        elements.sitesList.innerHTML = '';
        
        if (sites.length === 0) {
            elements.sitesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-globe icon"></i>
                    <h4>No sites tracked yet</h4>
                    <p>Start browsing to track your time!</p>
                </div>
            `;
            return;
        }
        
        sites.forEach(([domain, data]) => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            
            // Get productivity class
            let productivityClass = 'neutral';
            if (data.productivity === 2) productivityClass = 'productive';
            if (data.productivity === 0) productivityClass = 'distracting';
            
            // Calculate percentage for progress bar
            const maxSeconds = 8 * 3600; // 8 hours
            const percentage = Math.min((data.total / maxSeconds) * 100, 100);
            
            siteItem.innerHTML = `
                <div class="site-favicon ${productivityClass}">
                    <i class="fas fa-${getDomainIcon(domain)}"></i>
                </div>
                <div class="site-info">
                    <div class="site-domain" title="${domain}">
                        ${domain.length > 25 ? domain.substring(0, 25) + '...' : domain}
                    </div>
                    <div class="site-category">
                        <span class="badge badge-${productivityClass}">${getProductivityLabel(data.productivity)}</span>
                        <span>${data.sessions} sessions</span>
                    </div>
                </div>
                <div class="site-stats">
                    <div class="site-time">${formatTime(data.total)}</div>
                    <div class="site-progress">
                        <div class="site-progress-bar" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
            
            elements.sitesList.appendChild(siteItem);
        });
    }

    function updateGoalsList() {
        elements.goalsList.innerHTML = '';
        
        if (state.goals.length === 0) {
            elements.goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye icon"></i>
                    <h4>No goals set</h4>
                    <p>Set goals to improve your productivity!</p>
                    <button class="btn-primary" id="createFirstGoal">
                        <i class="fas fa-plus"></i> Create First Goal
                    </button>
                </div>
            `;
            
            document.getElementById('createFirstGoal')?.addEventListener('click', () => {
                showGoalForm();
            });
            return;
        }
        
        state.goals.forEach((goal, index) => {
            const goalItem = document.createElement('div');
            goalItem.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            
            const progress = calculateGoalProgress(goal);
            const percentage = Math.min((progress / goal.target) * 100, 100);
            
            goalItem.innerHTML = `
                <div class="goal-checkbox ${goal.completed ? 'checked' : ''}" data-index="${index}">
                    ${goal.completed ? '✓' : ''}
                </div>
                <div class="goal-content">
                    <div class="goal-title">
                        ${goal.title}
                        <span class="goal-category ${goal.category}">${goal.category}</span>
                    </div>
                    <div class="goal-meta">
                        <span><i class="fas fa-calendar"></i> Due: ${formatDate(goal.dueDate)}</span>
                        <span><i class="fas fa-${goal.type === 'time' ? 'clock' : 'bullseye'}"></i> ${goal.target} ${goal.type === 'time' ? 'hours' : 'visits'}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="goal-percentage">${Math.round(percentage)}% (${progress}/${goal.target})</div>
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="icon-btn small edit-goal" data-index="${index}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn small delete-goal" data-index="${index}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            elements.goalsList.appendChild(goalItem);
        });
        
        // Add event listeners for goal actions
        document.querySelectorAll('.goal-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                toggleGoalCompletion(index);
            });
        });
        
        document.querySelectorAll('.edit-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                editGoal(index);
            });
        });
        
        document.querySelectorAll('.delete-goal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                deleteGoal(index);
            });
        });
    }

    function updateAchievementsList() {
        elements.achievementsList.innerHTML = '';
        
        let unlockedCount = 0;
        state.achievements.forEach(achievement => {
            if (achievement.unlocked) unlockedCount++;
            
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            achievementCard.innerHTML = `
                <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <h4 class="achievement-title">${achievement.title}</h4>
                <p class="achievement-desc">${achievement.description}</p>
                <div class="achievement-meta">
                    <span class="achievement-points">${achievement.points} points</span>
                    <div class="achievement-status ${achievement.unlocked ? 'unlocked' : 'locked'}">
                        ${achievement.unlocked ? 'Unlocked!' : 'Locked'}
                    </div>
                </div>
            `;
            
            elements.achievementsList.appendChild(achievementCard);
        });
        
        // Update counter elements
        if (elements.unlockedCount) {
            elements.unlockedCount.textContent = unlockedCount;
        }
        if (elements.totalAchievements) {
            elements.totalAchievements.textContent = state.achievements.length;
        }
        
        // Update total points
        const totalPoints = state.achievements
            .filter(a => a.unlocked)
            .reduce((sum, a) => sum + a.points, 0);
        document.getElementById('totalPoints')?.textContent = totalPoints;
    }

    function updateUserStatus() {
        const userStatus = document.getElementById('userStatus');
        const loginBtn = document.getElementById('loginBtn');
        const userAvatar = document.querySelector('.user-avatar');
        
        if (state.user) {
            userStatus.textContent = state.user.name || 'User';
            userAvatar.textContent = (state.user.name || 'U').charAt(0).toUpperCase();
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            loginBtn.dataset.action = 'logout';
            
            // Enable export button
            elements.exportData.disabled = false;
            elements.exportData.title = 'Export your data';
        } else {
            userStatus.textContent = 'Guest';
            userAvatar.textContent = 'G';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginBtn.dataset.action = 'login';
            
            // Disable export button
            elements.exportData.disabled = true;
            elements.exportData.title = 'Please login to export data';
        }
    }

    function setupEventListeners() {
        // Navigation tabs
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                elements.navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                elements.tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === tabId) {
                        pane.classList.add('active');
                    }
                });
            });
        });
        
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);
        
        // Login/logout
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        
        // Export data
        elements.exportData.addEventListener('click', handleExport);
        
        // Set daily goal
        elements.setDailyGoal.addEventListener('click', () => {
            showGoalForm();
            document.querySelector('[data-tab="goals"]').click();
        });
        
        // Reset data
        elements.resetData.addEventListener('click', () => {
            showModal('resetModal');
        });
        
        // Confirm reset
        document.getElementById('confirmReset').addEventListener('click', resetData);
        
        // Cancel reset
        document.getElementById('cancelReset').addEventListener('click', () => {
            hideModal('resetModal');
        });
        
        // Refresh data
        elements.refreshData.addEventListener('click', refreshData);
        
        // Pause tracking
        elements.pauseTracking.addEventListener('click', toggleTracking);
        
        // Goal form
        document.getElementById('saveGoal')?.addEventListener('click', saveGoal);
        document.getElementById('cancelGoal')?.addEventListener('click', hideGoalForm);
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    function setupTimer() {
        const timerDisplay = document.getElementById('focusTimer');
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        
        updateTimerDisplay();
        
        startBtn.addEventListener('click', () => {
            if (!state.focusTimer.running) {
                state.focusTimer.running = true;
                state.focusTimer.interval = setInterval(() => {
                    if (state.focusTimer.time > 0) {
                        state.focusTimer.time--;
                        updateTimerDisplay();
                    } else {
                        clearInterval(state.focusTimer.interval);
                        state.focusTimer.running = false;
                        state.focusSessions++;
                        saveState();
                        showNotification('🎉 Focus session completed!', 'success');
                        checkAchievements();
                    }
                }, 1000);
                
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-play"></i> Running';
            }
        });
        
        pauseBtn.addEventListener('click', () => {
            if (state.focusTimer.running) {
                clearInterval(state.focusTimer.interval);
                state.focusTimer.running = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            }
        });
        
        resetBtn.addEventListener('click', () => {
            clearInterval(state.focusTimer.interval);
            state.focusTimer = {
                time: 25 * 60,
                running: false,
                interval: null
            };
            updateTimerDisplay();
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        });
    }

    function updateTimerDisplay() {
        const timerDisplay = document.getElementById('focusTimer');
        const mins = Math.floor(state.focusTimer.time / 60);
        const secs = state.focusTimer.time % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Helper Functions
    function getDomainIcon(domain) {
        const icons = {
            'github': 'code',
            'youtube': 'video',
            'twitter': 'comment-alt',
            'linkedin': 'briefcase',
            'gmail': 'envelope',
            'google': 'search',
            'stackoverflow': 'code-branch',
            'reddit': 'reddit',
            'facebook': 'facebook',
            'instagram': 'instagram',
            'notion': 'sticky-note',
            'figma': 'figma',
            'vscode': 'code',
            'chatgpt': 'robot',
            'openai': 'robot',
            'netflix': 'film',
            'spotify': 'music',
            'discord': 'discord',
            'zoom': 'video',
            'teams': 'users'
        };
        
        for (const [key, icon] of Object.entries(icons)) {
            if (domain.includes(key)) return icon;
        }
        return 'globe';
    }

    function getProductivityLabel(score) {
        switch(score) {
            case 2: return 'Productive';
            case 1: return 'Neutral';
            case 0: return 'Distracting';
            default: return 'Unknown';
        }
    }

    function calculateGoalProgress(goal) {
        // Implement based on goal type
        return 0;
    }

    function formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', state.theme);
        elements.themeToggle.innerHTML = state.theme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        saveState();
    }

    async function handleLogin() {
        const btn = document.getElementById('loginBtn');
        
        if (btn.dataset.action === 'login') {
            showModal('loginModal');
        } else {
            state.user = null;
            updateUserStatus();
            saveState();
            showNotification('Logged out successfully', 'info');
        }
    }

    function handleExport() {
        if (!state.user) {
            showNotification('Please login to export data', 'warning');
            showModal('loginModal');
            return;
        }
        
        const data = {
            domainTimes: state.domainTimes,
            goals: state.goals,
            achievements: state.achievements.filter(a => a.unlocked),
            user: state.user,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `time-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(dataUrl);
        
        showNotification('Data exported successfully!', 'success');
    }

    function resetData() {
        chrome.runtime.sendMessage({ action: 'reset' }, () => {
            state.domainTimes = {};
            updateUI();
            hideModal('resetModal');
            showNotification('All data has been reset', 'success');
        });
    }

    function refreshData() {
        chrome.storage.local.get(['domainTimes'], (result) => {
            state.domainTimes = result.domainTimes || {};
            updateUI();
            showNotification('Data refreshed', 'info');
        });
    }

    function toggleTracking() {
        state.isTrackingPaused = !state.isTrackingPaused;
        elements.pauseTracking.innerHTML = state.isTrackingPaused ? 
            '<i class="fas fa-play"></i> Resume Tracking' : 
            '<i class="fas fa-pause"></i> Pause Tracking';
        saveState();
        showNotification(state.isTrackingPaused ? 'Tracking paused' : 'Tracking resumed', 'info');
    }

    function showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    function hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    function showGoalForm(goal = null) {
        const form = document.getElementById('goalForm');
        form.style.display = 'block';
        
        if (goal) {
            // Edit existing goal
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalType').value = goal.type;
            document.getElementById('goalTarget').value = goal.target;
            document.getElementById('goalCategory').value = goal.category;
            document.getElementById('goalDueDate').value = goal.dueDate;
        } else {
            // New goal
            document.getElementById('goalForm').reset();
            document.getElementById('goalDueDate').value = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
    }

    function hideGoalForm() {
        document.getElementById('goalForm').style.display = 'none';
    }

    function saveGoal() {
        const title = document.getElementById('goalTitle').value.trim();
        const type = document.getElementById('goalType').value;
        const target = parseFloat(document.getElementById('goalTarget').value);
        const category = document.getElementById('goalCategory').value;
        const dueDate = new Date(document.getElementById('goalDueDate').value).getTime();
        
        if (!title || !target || target <= 0) {
            showNotification('Please fill all required fields', 'warning');
            return;
        }
        
        const newGoal = {
            id: Date.now(),
            title,
            type,
            target,
            category,
            dueDate,
            completed: false,
            progress: 0,
            createdAt: Date.now()
        };
        
        state.goals.push(newGoal);
        updateGoalsList();
        saveState();
        hideGoalForm();
        showNotification('Goal saved successfully!', 'success');
    }

    function toggleGoalCompletion(index) {
        state.goals[index].completed = !state.goals[index].completed;
        if (state.goals[index].completed) {
            state.completedGoals++;
        }
        updateGoalsList();
        saveState();
        checkAchievements();
    }

    function editGoal(index) {
        showGoalForm(state.goals[index]);
    }

    function deleteGoal(index) {
        if (confirm('Are you sure you want to delete this goal?')) {
            state.goals.splice(index, 1);
            updateGoalsList();
            saveState();
            showNotification('Goal deleted', 'info');
        }
    }

    function getDefaultGoals() {
        return [
            {
                id: 1,
                title: 'Complete 4 productive hours daily',
                type: 'time',
                target: 4,
                category: 'productivity',
                dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
                completed: false,
                progress: 0
            },
            {
                id: 2,
                title: 'Limit social media to 1 hour',
                type: 'time',
                target: 1,
                category: 'limitation',
                dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
                completed: false,
                progress: 0
            }
        ];
    }
});
