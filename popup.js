document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        totalSites: document.getElementById('totalSites'),
        todayTime: document.getElementById('todayTime'),
        focusScore: document.getElementById('focusScore'),
        streakBadge: document.getElementById('streakBadge'),
        productiveTime: document.getElementById('productiveTime'),
        neutralTime: document.getElementById('neutralTime'),
        distractingTime: document.getElementById('distractingTime'),
        sitesList: document.getElementById('sitesList'),
        goalsList: document.getElementById('goalsList'),
        achievementsList: document.getElementById('achievementsList'),
        resetData: document.getElementById('resetData'),
        refreshData: document.getElementById('refreshData'),
        pauseTracking: document.getElementById('pauseTracking'),
        themeToggle: document.getElementById('themeToggle'),
        navTabs: document.querySelectorAll('.nav-tab'),
        tabPanes: document.querySelectorAll('.tab-pane')
    };

    // State
    let domainTimes = {};
    let isTrackingPaused = false;
    let focusTimer = {
        time: 25 * 60,
        running: false,
        interval: null
    };

    // Initialize
    init();

    // Functions
    async function init() {
        loadData();
        setupEventListeners();
        setupTimer();
        updateUI();
        setInterval(updateUI, 5000); // Update every 5 seconds
    }

    function loadData() {
        chrome.storage.local.get(['domainTimes', 'goals', 'achievements'], (result) => {
            domainTimes = result.domainTimes || {};
            updateStats();
            updateSitesList();
            updateGoalsList(result.goals || []);
            updateAchievementsList(result.achievements || getDefaultAchievements());
        });
    }

    function updateStats() {
        const sites = Object.keys(domainTimes);
        elements.totalSites.textContent = sites.length;
        
        let totalToday = 0;
        let productive = 0;
        let neutral = 0;
        let distracting = 0;
        
        const today = new Date().setHours(0, 0, 0, 0);
        
        sites.forEach(site => {
            const data = domainTimes[site];
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
    }

    function formatTime(seconds) {
        if (!seconds) return "0:00";
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function formatTimeDetailed(seconds) {
        if (seconds < 60) return `${seconds} sec`;
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            return `${mins} min${mins !== 1 ? 's' : ''}`;
        }
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hrs}h ${mins}m`;
    }

    function updateSitesList() {
        const sites = Object.entries(domainTimes)
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

    function getDomainIcon(domain) {
        if (domain.includes('github')) return 'code';
        if (domain.includes('youtube')) return 'video';
        if (domain.includes('twitter') || domain.includes('x.com')) return 'comment-alt';
        if (domain.includes('linkedin')) return 'briefcase';
        if (domain.includes('mail') || domain.includes('gmail')) return 'envelope';
        if (domain.includes('drive.google')) return 'cloud';
        if (domain.includes('docs.google')) return 'file-alt';
        if (domain.includes('chat.openai') || domain.includes('chatgpt')) return 'robot';
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

    function updateGoalsList(goals) {
        elements.goalsList.innerHTML = '';
        
        if (goals.length === 0) {
            elements.goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye icon"></i>
                    <h4>No goals set</h4>
                    <p>Set goals to improve your productivity!</p>
                </div>
            `;
            return;
        }
        
        goals.forEach((goal, index) => {
            const goalItem = document.createElement('div');
            goalItem.className = 'goal-item';
            
            const progress = calculateGoalProgress(goal);
            const percentage = Math.min((progress / goal.target) * 100, 100);
            
            goalItem.innerHTML = `
                <div class="goal-checkbox ${goal.completed ? 'checked' : ''}">
                    ${goal.completed ? '✓' : ''}
                </div>
                <div class="goal-content">
                    <div class="goal-title">
                        ${goal.title}
                        <span class="goal-category">${goal.type}</span>
                    </div>
                    <div class="goal-meta">
                        <span>${progress}/${goal.target} ${goal.type === 'time' ? 'hours' : 'visits'}</span>
                        <span>Due: ${formatDate(goal.dueDate)}</span>
                    </div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="goal-percentage">${Math.round(percentage)}%</div>
                    </div>
                </div>
                <div class="goal-actions">
                    <button class="icon-btn small" data-goal-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn small" data-goal-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            elements.goalsList.appendChild(goalItem);
        });
    }

    function updateAchievementsList(achievements) {
        elements.achievementsList.innerHTML = '';
        
        let unlocked = 0;
        achievements.forEach(achievement => {
            if (achievement.unlocked) unlocked++;
            
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <h4 class="achievement-title">${achievement.title}</h4>
                <p class="achievement-desc">${achievement.description}</p>
                <div class="achievement-status ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    ${achievement.unlocked ? 'Unlocked!' : 'Locked'}
                </div>
            `;
            
            elements.achievementsList.appendChild(achievementCard);
        });
        
        elements.unlockedCount.textContent = unlocked;
        elements.totalAchievements.textContent = achievements.length;
    }

    function getDefaultAchievements() {
        return [
            { title: 'First Steps', description: 'Track your first website', icon: 'compass', unlocked: false },
            { title: 'Productivity Master', description: 'Spend 10 productive hours', icon: 'brain', unlocked: false },
            { title: 'Focus Warrior', description: 'Complete 5 focus sessions', icon: 'medal', unlocked: false },
            { title: 'Explorer', description: 'Visit 20 different websites', icon: 'map', unlocked: false },
            { title: 'Early Bird', description: 'Track time for 7 consecutive days', icon: 'sun', unlocked: false },
            { title: 'Night Owl', description: 'Track time after 10 PM', icon: 'moon', unlocked: false }
        ];
    }

    function setupTimer() {
        const timerDisplay = document.getElementById('focusTimer');
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        
        updateTimerDisplay();
        
        startBtn.addEventListener('click', () => {
            if (!focusTimer.running) {
                focusTimer.running = true;
                focusTimer.interval = setInterval(() => {
                    if (focusTimer.time > 0) {
                        focusTimer.time--;
                        updateTimerDisplay();
                    } else {
                        clearInterval(focusTimer.interval);
                        focusTimer.running = false;
                        showNotification('Focus session completed!');
                    }
                }, 1000);
                
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-play"></i> Running';
            }
        });
        
        pauseBtn.addEventListener('click', () => {
            if (focusTimer.running) {
                clearInterval(focusTimer.interval);
                focusTimer.running = false;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                startBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            }
        });
        
        resetBtn.addEventListener('click', () => {
            clearInterval(focusTimer.interval);
            focusTimer = {
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
        const mins = Math.floor(focusTimer.time / 60);
        const secs = focusTimer.time % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function setupEventListeners() {
        // Navigation tabs
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Update active tab
                elements.navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding pane
                elements.tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === tabId) {
                        pane.classList.add('active');
                    }
                });
            });
        });
        
        // Reset data
        elements.resetData.addEventListener('click', () => {
            document.getElementById('resetModal').classList.add('active');
        });
        
        // Confirm reset
        document.getElementById('confirmReset').addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'reset' }, (response) => {
                if (response && response.success) {
                    domainTimes = {};
                    updateUI();
                    showNotification('All data has been reset');
                }
            });
            document.getElementById('resetModal').classList.remove('active');
        });
        
        // Cancel reset
        document.getElementById('cancelReset').addEventListener('click', () => {
            document.getElementById('resetModal').classList.remove('active');
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('resetModal').classList.remove('active');
        });
        
        // Refresh data
        elements.refreshData.addEventListener('click', () => {
            loadData();
            showNotification('Data refreshed');
        });
        
        // Pause tracking
        elements.pauseTracking.addEventListener('click', () => {
            isTrackingPaused = !isTrackingPaused;
            elements.pauseTracking.innerHTML = isTrackingPaused ? 
                '<i class="fas fa-play"></i> Resume Tracking' : 
                '<i class="fas fa-pause"></i> Pause Tracking';
            
            chrome.storage.local.set({ trackingPaused: isTrackingPaused });
            showNotification(isTrackingPaused ? 'Tracking paused' : 'Tracking resumed');
        });
        
        // Theme toggle
        elements.themeToggle.addEventListener('click', () => {
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            elements.themeToggle.innerHTML = isDark ? 
                '<i class="fas fa-moon"></i>' : 
                '<i class="fas fa-sun"></i>';
            
            chrome.storage.local.set({ theme: isDark ? 'light' : 'dark' });
        });
        
        // Load saved theme
        chrome.storage.local.get(['theme'], (result) => {
            if (result.theme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        });
        
        // Export data
        document.getElementById('exportData').addEventListener('click', exportData);
        
        // Set daily goal
        document.getElementById('setDailyGoal').addEventListener('click', () => {
            document.querySelector('[data-tab="goals"]').click();
            document.getElementById('goalForm').style.display = 'block';
        });
        
        // Close modal on background click
        document.getElementById('resetModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('resetModal')) {
                document.getElementById('resetModal').classList.remove('active');
            }
        });
    }
    
    function exportData() {
        const dataStr = JSON.stringify(domainTimes, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'time-tracker-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Data exported successfully');
    }
    
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-md);
            padding: 12px 20px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function updateUI() {
        updateStats();
        updateSitesList();
    }
    
    // Helper functions
    function calculateGoalProgress(goal) {
        // This would calculate progress based on domainTimes
        return 0; // Placeholder
    }
    
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }
});
