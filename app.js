class App {
    constructor() {
        this.weather = window.weatherManager;
        this.mood = window.moodTracker;
        this.tasks = window.taskManager;
        this.particles = window.particleSystem;

        this.timerState = {
            minutes: 25,
            seconds: 0,
            totalSeconds: 25 * 60,
            remainingSeconds: 25 * 60,
            isRunning: false,
            interval: null,
            sessions: parseInt(localStorage.getItem('weathermood_sessions') || '0')
        };

        this.settings = this.loadSettings();
        this.init();
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('weathermood_settings')) || {
                unit: 'celsius',
                sound: true,
                notifications: true
            };
        } catch {
            return { unit: 'celsius', sound: true, notifications: true };
        }
    }

    saveSettings() {
        localStorage.setItem('weathermood_settings', JSON.stringify(this.settings));
    }

    async init() {
        // Show loading screen
        await this.simulateLoading();

        // Initialize weather
        const weather = this.weather.detectWeather();
        this.applyWeatherTheme(weather.type);
        this.updateWeatherUI(weather);

        // Initialize other components
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        this.updateProductivity();
        this.renderActivities(weather.activities);
        this.renderTasks();
        this.renderMoodHeatmap();
        this.updateInsights();
        this.renderRecommendations();
        this.updateTimerDisplay();

        // Restore today's mood
        const todayMood = this.mood.getTodayMood();
        if (todayMood) {
            this.highlightMoodButton(todayMood.mood);
        }

        // Restore journal
        const todayJournal = this.mood.getTodayJournal();
        if (todayJournal) {
            document.getElementById('journalEntry').value = todayJournal.text;
            todayJournal.tags.forEach(tag => {
                const btn = document.querySelector(`.tag-btn[data-tag="${tag}"]`);
                if (btn) btn.classList.add('active');
            });
        }

        // Bind events
        this.bindEvents();

        // Draw mood chart after section becomes visible
        setTimeout(() => this.mood.drawMoodChart('moodChart'), 100);

        // Show app
        this.showApp();
    }

    async simulateLoading() {
        return new Promise(resolve => {
            setTimeout(resolve, 2200);
        });
    }

    showApp() {
        const loading = document.getElementById('loadingScreen');
        const app = document.getElementById('app');

        loading.classList.add('fade-out');

        setTimeout(() => {
            loading.style.display = 'none';
            app.classList.remove('hidden');
        }, 500);
    }

    applyWeatherTheme(type) {
        document.documentElement.setAttribute('data-theme', type);
        this.particles.setWeather(type);

        // Update theme index for cycling
        this.weather.currentThemeIndex = this.weather.weatherTypes.indexOf(type);
    }

    updateWeatherUI(weather) {
        document.getElementById('weatherIconLarge').innerHTML = `<span>${weather.icon}</span>`;
        document.getElementById('tempValue').textContent = this.convertTemp(weather.temp);
        document.getElementById('weatherCondition').textContent = weather.condition;
        document.getElementById('humidity').textContent = `${weather.humidity}%`;
        document.getElementById('windSpeed').textContent = `${weather.wind} km/h`;
        document.getElementById('visibility').textContent = `${weather.visibility} km`;
        document.getElementById('feelsLike').textContent = `${this.convertTemp(weather.feelsLike)}°${this.settings.unit === 'celsius' ? 'C' : 'F'}`;

        // Location
        document.getElementById('locationText').textContent = this.getLocation();
    }

    convertTemp(celsius) {
        if (this.settings.unit === 'fahrenheit') {
            return Math.round(celsius * 9/5 + 32);
        }
        return celsius;
    }

    getLocation() {
        const cities = [
            'New York, US', 'London, UK', 'Tokyo, JP', 'Paris, FR',
            'Sydney, AU', 'Toronto, CA', 'Berlin, DE', 'Amsterdam, NL',
            'San Francisco, US', 'Singapore, SG'
        ];
        const saved = localStorage.getItem('weathermood_location');
        if (saved) return saved;
        const city = cities[Math.floor(Math.random() * cities.length)];
        localStorage.setItem('weathermood_location', city);
        return city;
    }

    updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        document.getElementById('currentTime').textContent = time;
        document.getElementById('currentDate').textContent = date;
    }

    updateProductivity() {
        const score = this.weather.getProductivityScore();
        const ring = document.getElementById('prodRing');
        const scoreEl = document.getElementById('prodScore');
        const messageEl = document.getElementById('prodMessage');
        const trendEl = document.getElementById('prodTrend');

        // Animate ring
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (score / 100) * circumference;

        setTimeout(() => {
            ring.style.strokeDashoffset = offset;
        }, 300);

        // Animate counter
        this.animateCounter(scoreEl, score, 1500);

        messageEl.textContent = this.weather.getProductivityMessage(score);

        const trend = Math.floor(Math.random() * 20) - 5;
        trendEl.textContent = `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%`;
        trendEl.style.color = trend >= 0 ? '#22c55e' : '#ef4444';
    }

    animateCounter(element, target, duration) {
        const start = 0;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const current = Math.round(start + (target - start) * eased);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }

    renderActivities(activities) {
        const container = document.getElementById('activitiesList');
        container.innerHTML = '';
        container.classList.add('stagger-in');

        activities.forEach(act => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">${act.icon}</div>
                <div class="activity-info">
                    <div class="activity-name">${act.name}</div>
                    <div class="activity-reason">${act.reason}</div>
                </div>
                <span class="activity-tag">${act.tag}</span>
            `;

            item.addEventListener('click', () => {
                this.tasks.add(act.name, 'medium', act.tag === 'fitness' || act.tag === 'outdoor' ? 'outdoor' : 'personal');
                this.renderTasks();
                this.showToast('✅', `"${act.name}" added to your tasks!`);
            });

            container.appendChild(item);
        });
    }

    renderTasks() {
        const container = document.getElementById('taskList');
        const filtered = this.tasks.getFiltered(this.tasks.currentFilter);
        const stats = this.tasks.getStats();
        const empty = document.getElementById('emptyTasks');

        // Update stats
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('pendingCount').textContent = stats.pending;

        // Clear non-empty-state content
        Array.from(container.children).forEach(child => {
            if (child.id !== 'emptyTasks') child.remove();
        });

        if (filtered.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        empty.classList.add('hidden');

        filtered.forEach(task => {
            const item = document.createElement('div');
            item.className = `task-item ${task.completed ? 'completed' : ''}`;
            item.dataset.id = task.id;

            const categoryIcons = {
                work: '💼', personal: '🏠', health: '💪', learning: '📚', outdoor: '🌳'
            };

            item.innerHTML = `
                <button class="task-checkbox">${task.completed ? '✓' : ''}</button>
                <div class="task-info">
                    <div class="task-name">${task.name}</div>
                    <div class="task-meta">
                        <span class="task-tag priority-${task.priority}">${task.priority}</span>
                        <span class="task-tag category">${categoryIcons[task.category] || '📋'} ${task.category}</span>
                    </div>
                </div>
                <button class="task-delete">✕</button>
            `;

            // Toggle completion
            item.querySelector('.task-checkbox').addEventListener('click', () => {
                const updated = this.tasks.toggle(task.id);
                if (updated.completed) {
                    item.querySelector('.task-checkbox').innerHTML = '✓';
                    item.querySelector('.task-checkbox').classList.add('check-animate');
                    item.classList.add('completed');
                    this.showToast('🎉', 'Task completed! Great job!');
                } else {
                    item.querySelector('.task-checkbox').innerHTML = '';
                    item.classList.remove('completed');
                }
                this.updateProductivity();
                this.updateTaskStats();
            });

            // Delete
            item.querySelector('.task-delete').addEventListener('click', () => {
                item.classList.add('removing');
                setTimeout(() => {
                    this.tasks.delete(task.id);
                    this.renderTasks();
                    this.updateProductivity();
                }, 300);
            });

            container.appendChild(item);
        });
    }

    updateTaskStats() {
        const stats = this.tasks.getStats();
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('taskCompletionRate').textContent = `${stats.completionRate}%`;
    }

    renderMoodHeatmap() {
        const container = document.getElementById('moodHeatmap');
        container.innerHTML = '';

        const days = this.mood.getLast30Days();

        days.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.dataset.level = day.level;
            cell.textContent = day.day;
            cell.title = `${day.date}: ${day.mood || 'No data'}`;

            container.appendChild(cell);
        });
    }

    updateInsights() {
        const stats = this.tasks.getStats();
        const streak = this.mood.getStreak();
        const avg = this.mood.getAverageMood();
        const sessions = this.timerState.sessions;

        document.getElementById('streakDays').textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
        document.getElementById('taskCompletionRate').textContent = `${stats.completionRate}%`;
        document.getElementById('moodAverage').textContent = avg;
        document.getElementById('timerSessionCount').textContent = `${sessions} session${sessions !== 1 ? 's' : ''}`;

        const focusMinutes = sessions * 25;
        const hours = Math.floor(focusMinutes / 60);
        const mins = focusMinutes % 60;
        document.getElementById('totalFocus').textContent = `${hours}h ${mins}m`;

        // Animate insight bars when visible
        setTimeout(() => {
            document.querySelectorAll('.insight-card').forEach(card => {
                card.classList.add('visible');
            });
        }, 500);
    }

    renderRecommendations() {
        const container = document.getElementById('recommendationsList');
        const weatherType = this.weather.currentWeather ? this.weather.currentWeather.type : 'sunny';
        const recs = this.mood.getRecommendations(weatherType);

        container.innerHTML = '';

        recs.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <span class="rec-icon">${rec.icon}</span>
                <div class="rec-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.desc}</p>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // Timer methods
    updateTimerDisplay() {
        const mins = Math.floor(this.timerState.remainingSeconds / 60);
        const secs = this.timerState.remainingSeconds % 60;

        document.getElementById('timerMinutes').textContent = mins.toString().padStart(2, '0');
        document.getElementById('timerSeconds').textContent = secs.toString().padStart(2, '0');

        // Update progress ring
        const progress = document.getElementById('timerProgress');
        const circumference = 2 * Math.PI * 88;
        const elapsed = this.timerState.totalSeconds - this.timerState.remainingSeconds;
        const offset = (elapsed / this.timerState.totalSeconds) * circumference;
        progress.style.strokeDashoffset = circumference - offset;
    }

    startTimer() {
        if (this.timerState.isRunning) return;

        this.timerState.isRunning = true;
        document.getElementById('timerToggle').textContent = 'Pause';
        document.querySelector('.card-timer').classList.add('timer-active');

        this.timerState.interval = setInterval(() => {
            this.timerState.remainingSeconds--;
            this.updateTimerDisplay();

            if (this.timerState.remainingSeconds <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        if (!this.timerState.isRunning) return;

        this.timerState.isRunning = false;
        clearInterval(this.timerState.interval);
        document.getElementById('timerToggle').textContent = 'Resume';
        document.querySelector('.card-timer').classList.remove('timer-active');
    }

    resetTimer() {
        this.pauseTimer();
        this.timerState.remainingSeconds = this.timerState.totalSeconds;
        document.getElementById('timerToggle').textContent = 'Start';
        this.updateTimerDisplay();
    }

    completeTimer() {
        this.pauseTimer();
        this.timerState.sessions++;
        localStorage.setItem('weathermood_sessions', this.timerState.sessions.toString());

        document.getElementById('timerSessionCount').textContent = `${this.timerState.sessions} session${this.timerState.sessions !== 1 ? 's' : ''}`;

        this.showToast('🎯', `Focus session complete! (${this.timerState.sessions} total)`);
        this.resetTimer();
        this.updateProductivity();
        this.updateInsights();

        // Play sound
        if (this.settings.sound) {
            this.playCompletionSound();
        }
    }

    setTimerDuration(minutes) {
        this.pauseTimer();
        this.timerState.minutes = minutes;
        this.timerState.totalSeconds = minutes * 60;
        this.timerState.remainingSeconds = minutes * 60;
        document.getElementById('timerToggle').textContent = 'Start';
        this.updateTimerDisplay();
    }

    playCompletionSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.4);
                osc.start(audioCtx.currentTime + i * 0.15);
                osc.stop(audioCtx.currentTime + i * 0.15 + 0.4);
            });
        } catch (e) {
            // Audio not available
        }
    }

    // Toast
    showToast(icon, message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    highlightMoodButton(mood) {
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
        const btn = document.querySelector(`.mood-btn[data-mood="${mood}"]`);
        if (btn) btn.classList.add('selected');
    }

    // Event bindings
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const section = link.dataset.section;

                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById(section).classList.add('active');

                // Re-trigger animations
                document.querySelectorAll(`#${section} .animate-in`).forEach(el => {
                    el.style.animation = 'none';
                    el.offsetHeight; // force reflow
                    el.style.animation = '';
                });

                // Redraw chart when mood section shown
                if (section === 'mood') {
                    setTimeout(() => this.mood.drawMoodChart('moodChart'), 100);
                }

                if (section === 'insights') {
                    this.updateInsights();
                    this.renderRecommendations();
                }
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const weather = this.weather.cycleTheme();
            this.applyWeatherTheme(weather.type);
            this.updateWeatherUI(weather);
            this.renderActivities(weather.activities);
            this.updateProductivity();
            this.renderRecommendations();
            this.showToast(weather.icon, `Weather changed to ${weather.condition}`);
        });

        // Mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = btn.dataset.mood;
                const weatherType = this.weather.currentWeather ? this.weather.currentWeather.type : 'sunny';

                this.mood.logMood(mood, weatherType);
                this.highlightMoodButton(mood);

                // Show response
                const response = this.mood.getMoodResponse(mood);
                const responseEl = document.getElementById('moodResponse');
                const responseText = document.getElementById('moodResponseText');

                responseText.textContent = response;
                responseEl.classList.remove('hidden');
                responseEl.style.animation = 'none';
                responseEl.offsetHeight;
                responseEl.style.animation = '';

                this.renderMoodHeatmap();
                this.updateProductivity();
                this.updateInsights();

                this.showToast(btn.dataset.emoji, `Mood logged: ${mood}`);
            });
        });

        // Refresh activities
        document.getElementById('refreshActivities').addEventListener('click', () => {
            const activities = this.weather.getActivities();
            this.renderActivities(activities);
        });

        // Timer controls
        document.getElementById('timerToggle').addEventListener('click', () => {
            if (this.timerState.isRunning) {
                this.pauseTimer();
            } else {
                this.startTimer();
            }
        });

        document.getElementById('timerReset').addEventListener('click', () => this.resetTimer());

        document.getElementById('timerSkip').addEventListener('click', () => {
            if (confirm('Skip this session?')) {
                this.completeTimer();
            }
        });

        // Timer presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTimerDuration(parseInt(btn.dataset.minutes));
            });
        });

        // Add task
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('taskInput');
            const priority = document.getElementById('taskPriority').value;
            const category = document.getElementById('taskCategory').value;

            if (input.value.trim()) {
                this.tasks.add(input.value.trim(), priority, category);
                input.value = '';
                this.renderTasks();
                this.updateProductivity();
                this.showToast('✅', 'Task added!');
            }
        });

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.tasks.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });

        // Journal tags
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        // Save journal
        document.getElementById('saveJournal').addEventListener('click', () => {
            const text = document.getElementById('journalEntry').value;
            const tags = Array.from(document.querySelectorAll('.tag-btn.active')).map(b => b.dataset.tag);

            if (text.trim() || tags.length > 0) {
                this.mood.saveJournalEntry(text, tags);
                this.showToast('📝', 'Journal entry saved!');
            } else {
                this.showToast('⚠️', 'Please write something or select tags.');
            }
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.remove('hidden');
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                document.getElementById('settingsModal').classList.add('hidden');
            }
        });

        // Settings toggles
        document.querySelectorAll('.toggle-group').forEach(group => {
            group.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    if (btn.dataset.unit) {
                        this.settings.unit = btn.dataset.unit;
                        this.updateWeatherUI(this.weather.currentWeather);
                    }
                    if (btn.dataset.sound) {
                        this.settings.sound = btn.dataset.sound === 'on';
                    }
                    if (btn.dataset.notif) {
                        this.settings.notifications = btn.dataset.notif === 'on';
                    }

                    this.saveSettings();
                });
            });
        });

        // Clear data
        document.getElementById('clearData').addEventListener('click', () => {
            if (confirm('This will delete all your data. Are you sure?')) {
                localStorage.clear();
                this.mood.clearAll();
                this.tasks.clearAll();
                this.timerState.sessions = 0;

                this.renderTasks();
                this.renderMoodHeatmap();
                this.updateProductivity();
                this.updateInsights();
                this.renderRecommendations();

                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                document.getElementById('moodResponse').classList.add('hidden');
                document.getElementById('journalEntry').value = '';
                document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));

                this.showToast('🗑️', 'All data cleared.');
                document.getElementById('settingsModal').classList.add('hidden');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('settingsModal').classList.add('hidden');
            }
        });

        // Window resize for chart
        window.addEventListener('resize', () => {
            if (document.getElementById('mood').classList.contains('active')) {
                this.mood.drawMoodChart('moodChart');
            }
        });
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});