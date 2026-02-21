class App {
    constructor() {
        this.weather = window.weatherManager;
        this.mood = window.moodTracker;
        this.tasks = window.taskManager;
        this.particles = window.particleSystem;

        this.timerState = {
            hours: 0,
            minutes: 25,
            seconds: 0,
            totalSeconds: 25 * 60,
            remainingSeconds: 25 * 60,
            isRunning: false,
            interval: null,
            sessions: parseInt(localStorage.getItem('weathermood_sessions') || '0')
        };

        this.settings = this.loadSettings();
        this.weatherRefreshInterval = null;
        this.init();
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('weathermood_settings')) || {
                unit: 'celsius',
                sound: true,
                autoRefresh: true
            };
        } catch {
            return { unit: 'celsius', sound: true, autoRefresh: true };
        }
    }

    saveSettings() {
        localStorage.setItem('weathermood_settings', JSON.stringify(this.settings));
    }

    async init() {
        this.updateLoaderStep('location', 'active');
        this.setLoaderProgress(10);
        
        // Check for saved location or API key
        const savedLocation = this.weather.loadSavedLocation();
        const apiKey = this.weather.getApiKey();

        // Restore API key in settings
        if (apiKey) {
            document.getElementById('apiKeyInput').value = apiKey;
        }

        // Restore settings toggles
        this.restoreSettingsUI();

        // If no saved location, show location modal
        if (!savedLocation) {
            this.showLocationModal();
            return;
        }

        // We have a saved location, proceed with weather fetch
        await this.initializeWithLocation(savedLocation);
    }

    restoreSettingsUI() {
        // Temperature unit
        document.querySelectorAll('[data-unit]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === this.settings.unit);
        });

        // Sound
        document.querySelectorAll('[data-sound]').forEach(btn => {
            btn.classList.toggle('active', (btn.dataset.sound === 'on') === this.settings.sound);
        });

        // Auto refresh
        document.querySelectorAll('[data-refresh]').forEach(btn => {
            btn.classList.toggle('active', (btn.dataset.refresh === 'on') === this.settings.autoRefresh);
        });
    }

    updateLoaderStep(step, status) {
        const stepEl = document.querySelector(`.loader-step[data-step="${step}"]`);
        if (stepEl) {
            stepEl.classList.remove('active', 'completed', 'error');
            stepEl.classList.add(status);
        }
    }

    setLoaderProgress(percent) {
        const fill = document.getElementById('loaderBarFill');
        if (fill) {
            fill.style.width = `${percent}%`;
        }
    }

    setLoaderText(text) {
        const textEl = document.getElementById('loaderText');
        if (textEl) {
            textEl.textContent = text;
        }
    }

    showLocationModal() {
        document.getElementById('loadingScreen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('locationModal').classList.remove('hidden');
            this.bindLocationModalEvents();
        }, 500);
    }

    showLocationError(message) {
        const container = document.getElementById('locationSearchResults');
        container.innerHTML = `<div class="location-error">${message}</div>`;
    }

    bindLocationModalEvents() {
        // Allow location button
        document.getElementById('allowLocation').addEventListener('click', async () => {
            const btn = document.getElementById('allowLocation');
            btn.innerHTML = '<span>📍</span> Detecting...';
            btn.disabled = true;

            try {
                const location = await this.weather.getUserLocation();
                this.weather.saveCurrentLocation(location);
                document.getElementById('locationModal').classList.add('hidden');
                
                // Show loading screen again
                document.getElementById('loadingScreen').style.display = 'flex';
                document.getElementById('loadingScreen').classList.remove('fade-out');
                
                await this.initializeWithLocation(location);
            } catch (error) {
                btn.innerHTML = '<span>📍</span> Allow Location Access';
                btn.disabled = false;
                this.showLocationError(error.message);
            }
        });

        // Manual location button
        document.getElementById('manualLocation').addEventListener('click', () => {
            document.getElementById('locationSearchContainer').classList.remove('hidden');
            document.getElementById('locationSearchInput').focus();
        });

        // Search location
        this.bindLocationSearch(
            'locationSearchInput',
            'searchLocationBtn',
            'locationSearchResults',
            async (location) => {
                this.weather.saveCurrentLocation(location);
                document.getElementById('locationModal').classList.add('hidden');
                
                document.getElementById('loadingScreen').style.display = 'flex';
                document.getElementById('loadingScreen').classList.remove('fade-out');
                
                await this.initializeWithLocation(location);
            }
        );
    }

    bindLocationSearch(inputId, btnId, resultsId, onSelect) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);
        const results = document.getElementById(resultsId);
        let searchTimeout;

        const doSearch = async () => {
            const query = input.value.trim();
            if (query.length < 2) {
                results.innerHTML = '';
                return;
            }

            results.innerHTML = '<div class="location-searching">🔍 Searching...</div>';
            
            try {
                const cities = await this.weather.searchCities(query);
                
                if (cities.length === 0) {
                    results.innerHTML = '<div class="location-error">No cities found. Try a different search.</div>';
                    return;
                }

                results.innerHTML = cities.map(city => `
                    <div class="location-result-item" data-lat="${city.lat}" data-lon="${city.lon}" 
                         data-name="${city.name}" data-state="${city.state || ''}" data-country="${city.country}"
                         data-fullname="${city.fullName}">
                        <span class="result-icon">📍</span>
                        <div class="result-info">
                            <div class="result-city">${city.name}</div>
                            <div class="result-country">${city.state ? city.state + ', ' : ''}${this.weather.getCountryName(city.country)}</div>
                        </div>
                    </div>
                `).join('');

                // Bind click events
                results.querySelectorAll('.location-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const location = {
                            lat: parseFloat(item.dataset.lat),
                            lon: parseFloat(item.dataset.lon),
                            name: item.dataset.name,
                            state: item.dataset.state,
                            country: item.dataset.country,
                            fullName: item.dataset.fullname
                        };
                        onSelect(location);
                    });
                });
            } catch (error) {
                results.innerHTML = '<div class="location-error">Search failed. Please try again.</div>';
            }
        };

        // Input event with debounce
        input.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(doSearch, 300);
        });

        // Button click
        btn.addEventListener('click', doSearch);

        // Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
    }

    async initializeWithLocation(location) {
        try {
            // Step 1: Location
            this.updateLoaderStep('location', 'completed');
            this.setLoaderProgress(33);
            this.setLoaderText(`📍 ${location.fullName || location.name}`);

            // Step 2: Weather
            this.updateLoaderStep('weather', 'active');
            this.setLoaderText('Fetching weather data...');
            
            const weather = await this.weather.fetchWeather(location.lat, location.lon);
            const forecast = await this.weather.fetchForecast(location.lat, location.lon);
            
            this.updateLoaderStep('weather', 'completed');
            this.setLoaderProgress(66);

            // Step 3: App setup
            this.updateLoaderStep('app', 'active');
            this.setLoaderText('Preparing your dashboard...');

            // Apply theme based on weather
            this.applyWeatherTheme(weather.type);
            this.updateWeatherUI(weather, location);
            this.renderForecast(forecast);

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
            this.renderSavedLocations();

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

            // Update settings location display
            document.getElementById('settingsLocationText').textContent = location.fullName || location.name;

            this.updateLoaderStep('app', 'completed');
            this.setLoaderProgress(100);
            this.setLoaderText('Ready!');

            // Bind events
            this.bindEvents();

            // Draw mood chart
            setTimeout(() => this.mood.drawMoodChart('moodChart'), 100);

            // Setup auto-refresh
            if (this.settings.autoRefresh) {
                this.startWeatherAutoRefresh();
            }

            // Show app
            setTimeout(() => this.showApp(), 500);

        } catch (error) {
            console.error('Initialization error:', error);
            this.updateLoaderStep('weather', 'error');
            this.setLoaderText('Error loading weather. Using demo mode...');
            
            // Fallback to demo mode
            setTimeout(async () => {
                const demoWeather = this.weather.generateMockWeather(location.lat, location.lon);
                this.applyWeatherTheme(demoWeather.type);
                this.updateWeatherUI(demoWeather, location);
                this.renderForecast(this.weather.generateMockForecast());
                
                this.updateLoaderStep('app', 'active');
                await this.finishInitialization();
            }, 1000);
        }
    }

    async finishInitialization() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        this.updateProductivity();
        this.renderActivities(this.weather.currentWeather.activities);
        this.renderTasks();
        this.renderMoodHeatmap();
        this.updateInsights();
        this.renderRecommendations();
        this.updateTimerDisplay();
        this.renderSavedLocations();
        this.bindEvents();
        setTimeout(() => this.mood.drawMoodChart('moodChart'), 100);
        this.updateLoaderStep('app', 'completed');
        this.setLoaderProgress(100);
        setTimeout(() => this.showApp(), 500);
    }

    startWeatherAutoRefresh() {
        // Refresh weather every 30 minutes
        this.weatherRefreshInterval = setInterval(async () => {
            if (this.weather.location) {
                try {
                    const weather = await this.weather.fetchWeather(
                        this.weather.location.lat,
                        this.weather.location.lon
                    );
                    this.applyWeatherTheme(weather.type);
                    this.updateWeatherUI(weather, this.weather.location);
                    this.updateProductivity();
                    this.renderActivities(weather.activities);
                } catch (e) {
                    console.error('Auto-refresh failed:', e);
                }
            }
        }, 30 * 60 * 1000);
    }

    stopWeatherAutoRefresh() {
        if (this.weatherRefreshInterval) {
            clearInterval(this.weatherRefreshInterval);
            this.weatherRefreshInterval = null;
        }
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
        this.weather.currentThemeIndex = this.weather.weatherTypes.indexOf(type);
    }

    updateWeatherUI(weather, location) {
        document.getElementById('weatherIconLarge').innerHTML = `<span>${weather.icon}</span>`;
        document.getElementById('tempValue').textContent = this.convertTemp(weather.temp);
        document.getElementById('weatherCondition').textContent = weather.condition;
        document.getElementById('humidity').textContent = `${weather.humidity}%`;
        document.getElementById('windSpeed').textContent = `${weather.wind} km/h`;
        document.getElementById('visibility').textContent = `${weather.visibility} km`;
        document.getElementById('feelsLike').textContent = `${this.convertTemp(weather.feelsLike)}°${this.settings.unit === 'celsius' ? 'C' : 'F'}`;
        
        // Extra weather info
        document.getElementById('sunrise').textContent = weather.sunrise || '--:--';
        document.getElementById('sunset').textContent = weather.sunset || '--:--';
        document.getElementById('tempMinMax').textContent = `${this.convertTemp(weather.tempMin)}/${this.convertTemp(weather.tempMax)}°`;
        document.getElementById('pressure').textContent = `${weather.pressure} hPa`;

        // Location
        const locationText = location.fullName || location.name || 'Unknown Location';
        document.getElementById('locationText').textContent = locationText;

        // Weather source indicator
        const sourceEl = document.getElementById('weatherSource');
        const dotEl = sourceEl.querySelector('.source-dot');
        if (weather.isLive) {
            dotEl.className = 'source-dot live';
            sourceEl.querySelector('span:last-child').textContent = 'Live Data';
        } else {
            dotEl.className = 'source-dot demo';
            sourceEl.querySelector('span:last-child').textContent = 'Demo Mode';
        }

        // Last updated
        document.getElementById('weatherUpdated').textContent = this.weather.getTimeAgo(weather.timestamp);
    }

    renderForecast(forecast) {
        const container = document.getElementById('forecastList');
        if (!forecast || forecast.length === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center;">Forecast unavailable</p>';
            return;
        }

        container.innerHTML = forecast.map(day => `
            <div class="forecast-item">
                <div class="forecast-day">${day.day}</div>
                <div class="forecast-icon">${day.icon}</div>
                <div class="forecast-temp">
                    <span class="forecast-high">${this.convertTemp(day.tempHigh)}°</span>
                    <span class="forecast-low">${this.convertTemp(day.tempLow)}°</span>
                </div>
                <div class="forecast-desc">${day.description}</div>
            </div>
        `).join('');
    }

    convertTemp(celsius) {
        if (this.settings.unit === 'fahrenheit') {
            return Math.round(celsius * 9/5 + 32);
        }
        return celsius;
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
            const eased = 1 - Math.pow(1 - progress, 3);
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

        // Weather impact
        if (this.weather.currentWeather) {
            document.getElementById('weatherImpact').textContent = `+${this.weather.currentWeather.prodBoost}%`;
        }

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

    renderSavedLocations() {
        const container = document.getElementById('savedLocationsList');
        const locations = this.weather.savedLocations;
        const currentLocation = this.weather.location;

        if (locations.length === 0) {
            container.innerHTML = '<p style="color: var(--text-tertiary); font-size: 0.85rem;">No saved locations yet.</p>';
            return;
        }

        container.innerHTML = locations.map((loc, index) => {
            const isCurrent = currentLocation && 
                loc.lat === currentLocation.lat && 
                loc.lon === currentLocation.lon;
            
            return `
                <div class="saved-location-item ${isCurrent ? 'current' : ''}" data-index="${index}">
                    <span class="saved-location-icon">${isCurrent ? '📍' : '🏙️'}</span>
                    <span class="saved-location-name">${loc.fullName || loc.name}</span>
                    ${!isCurrent ? `<button class="saved-location-remove" data-index="${index}">✕</button>` : ''}
                </div>
            `;
        }).join('');

        // Bind click events
        container.querySelectorAll('.saved-location-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (e.target.classList.contains('saved-location-remove')) {
                    e.stopPropagation();
                    const index = parseInt(e.target.dataset.index);
                    this.weather.removeSavedLocation(index);
                    this.renderSavedLocations();
                    return;
                }

                const index = parseInt(item.dataset.index);
                const location = this.weather.savedLocations[index];
                
                if (location) {
                    this.weather.saveCurrentLocation(location);
                    document.getElementById('changeLocationModal').classList.add('hidden');
                    await this.refreshWeather();
                    this.renderSavedLocations();
                }
            });
        });
    }

    async refreshWeather() {
        const btn = document.getElementById('refreshWeather');
        btn.classList.add('loading');

        try {
            const location = this.weather.location;
            if (location) {
                const weather = await this.weather.fetchWeather(location.lat, location.lon);
                const forecast = await this.weather.fetchForecast(location.lat, location.lon);
                
                this.applyWeatherTheme(weather.type);
                this.updateWeatherUI(weather, location);
                this.renderForecast(forecast);
                this.updateProductivity();
                this.renderActivities(weather.activities);
                this.renderRecommendations();
                
                this.showToast('🌤️', 'Weather updated!');
            }
        } catch (error) {
            this.showToast('⚠️', 'Failed to refresh weather');
        }

        btn.classList.remove('loading');
    }

    // Timer methods
    updateTimerDisplay() {
        const totalSecs = this.timerState.remainingSeconds;
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        // If hours > 0, show hours:minutes format, otherwise minutes:seconds
        if (this.timerState.totalSeconds >= 3600) {
            document.getElementById('timerMinutes').textContent = hours.toString().padStart(2, '0');
            document.getElementById('timerSeconds').textContent = mins.toString().padStart(2, '0');
        } else {
            document.getElementById('timerMinutes').textContent = mins.toString().padStart(2, '0');
            document.getElementById('timerSeconds').textContent = secs.toString().padStart(2, '0');
        }

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
        this.timerState.totalSeconds = minutes * 60;
        this.timerState.remainingSeconds = minutes * 60;
        document.getElementById('timerToggle').textContent = 'Start';
        
        // Hide custom timer container
        document.getElementById('customTimerContainer').classList.add('hidden');
        
        this.updateTimerDisplay();
    }

    setCustomTimerDuration(hours, minutes, seconds) {
        this.pauseTimer();
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        if (totalSeconds <= 0) {
            this.showToast('⚠️', 'Please set a duration greater than 0');
            return;
        }

        if (totalSeconds > 24 * 3600) {
            this.showToast('⚠️', 'Maximum duration is 24 hours');
            return;
        }

        this.timerState.totalSeconds = totalSeconds;
        this.timerState.remainingSeconds = totalSeconds;
        document.getElementById('timerToggle').textContent = 'Start';

        // Clear preset active states
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));

        // Hide custom timer container
        document.getElementById('customTimerContainer').classList.add('hidden');

        this.updateTimerDisplay();
        this.showToast('⏱️', `Timer set for ${this.formatDuration(totalSeconds)}`);
    }

    formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 && h === 0) parts.push(`${s}s`);

        return parts.join(' ') || '0s';
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
                    el.offsetHeight;
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

        // Refresh weather
        document.getElementById('refreshWeather').addEventListener('click', () => {
            this.refreshWeather();
        });

        // Location button
        document.getElementById('locationBtn').addEventListener('click', () => {
            document.getElementById('changeLocationModal').classList.remove('hidden');
            this.renderSavedLocations();
        });

        // Change location from weather card
        document.getElementById('changeLocationBtn').addEventListener('click', () => {
            document.getElementById('changeLocationModal').classList.remove('hidden');
            this.renderSavedLocations();
        });

        // Close change location modal
        document.getElementById('closeChangeLocation').addEventListener('click', () => {
            document.getElementById('changeLocationModal').classList.add('hidden');
        });

        // Use GPS location
        document.getElementById('useGPSLocation').addEventListener('click', async () => {
            const btn = document.getElementById('useGPSLocation');
            btn.querySelector('strong').textContent = 'Detecting...';
            btn.disabled = true;

            try {
                const location = await this.weather.getUserLocation();
                this.weather.saveCurrentLocation(location);
                document.getElementById('changeLocationModal').classList.add('hidden');
                await this.refreshWeather();
                document.getElementById('settingsLocationText').textContent = location.fullName || location.name;
                this.renderSavedLocations();
                this.showToast('📍', `Location set to ${location.name}`);
            } catch (error) {
                this.showToast('⚠️', error.message);
            }

            btn.querySelector('strong').textContent = 'Use GPS';
            btn.disabled = false;
        });

        // Search location in change modal
        this.bindLocationSearch(
            'changeLocationInput',
            'changeSearchBtn',
            'changeLocationResults',
            async (location) => {
                this.weather.saveCurrentLocation(location);
                document.getElementById('changeLocationModal').classList.add('hidden');
                await this.refreshWeather();
                document.getElementById('settingsLocationText').textContent = location.fullName || location.name;
                this.renderSavedLocations();
                this.showToast('📍', `Location set to ${location.name}`);
            }
        );

        // Theme toggle (demo mode)
        document.getElementById('themeToggle').addEventListener('click', () => {
            const weather = this.weather.cycleTheme();
            this.applyWeatherTheme(weather.type);
            this.updateWeatherUI(weather, this.weather.location || { name: 'Demo Location', fullName: 'Demo Location' });
            this.renderActivities(weather.activities);
            this.updateProductivity();
            this.renderRecommendations();
            this.showToast(weather.icon, `Theme: ${weather.condition} (Demo)`);
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
        document.querySelectorAll('.preset-btn:not(.custom-preset)').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTimerDuration(parseInt(btn.dataset.minutes));
            });
        });

        // Custom timer button
        document.getElementById('customTimerBtn').addEventListener('click', () => {
            const container = document.getElementById('customTimerContainer');
            container.classList.toggle('hidden');
            
            if (!container.classList.contains('hidden')) {
                document.getElementById('customMinutes').focus();
            }
        });

        // Set custom timer
        document.getElementById('setCustomTimer').addEventListener('click', () => {
            const hours = parseInt(document.getElementById('customHours').value) || 0;
            const minutes = parseInt(document.getElementById('customMinutes').value) || 0;
            const seconds = parseInt(document.getElementById('customSeconds').value) || 0;
            
            this.setCustomTimerDuration(hours, minutes, seconds);
        });

        // Enter key in custom timer inputs
        ['customHours', 'customMinutes', 'customSeconds'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('setCustomTimer').click();
                }
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
            document.getElementById('settingsLocationText').textContent = 
                this.weather.location?.fullName || this.weather.location?.name || 'Not set';
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
        });

        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                document.getElementById('settingsModal').classList.add('hidden');
            }
        });

        document.getElementById('changeLocationModal').addEventListener('click', (e) => {
            if (e.target.id === 'changeLocationModal') {
                document.getElementById('changeLocationModal').classList.add('hidden');
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
                        if (this.weather.currentWeather && this.weather.location) {
                            this.updateWeatherUI(this.weather.currentWeather, this.weather.location);
                            this.renderForecast(this.weather.forecast);
                        }
                    }
                    if (btn.dataset.sound) {
                        this.settings.sound = btn.dataset.sound === 'on';
                    }
                    if (btn.dataset.refresh) {
                        this.settings.autoRefresh = btn.dataset.refresh === 'on';
                        if (this.settings.autoRefresh) {
                            this.startWeatherAutoRefresh();
                        } else {
                            this.stopWeatherAutoRefresh();
                        }
                    }

                    this.saveSettings();
                });
            });
        });

        // API Key
        document.getElementById('apiKeyInput').addEventListener('change', (e) => {
            this.weather.setApiKey(e.target.value.trim());
            this.showToast('🔑', 'API key saved!');
        });

        document.getElementById('toggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('apiKeyInput');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // Change location from settings
        document.getElementById('settingsChangeLocation').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('hidden');
            document.getElementById('changeLocationModal').classList.remove('hidden');
            this.renderSavedLocations();
        });

        // Clear data
        document.getElementById('clearData').addEventListener('click', () => {
            if (confirm('This will delete all your data including tasks, moods, and settings. Are you sure?')) {
                localStorage.clear();
                this.mood.clearAll();
                this.tasks.clearAll();
                this.timerState.sessions = 0;
                this.weather.savedLocations = [];

                this.showToast('🗑️', 'All data cleared. Reloading...');
                
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('settingsModal').classList.add('hidden');
                document.getElementById('changeLocationModal').classList.add('hidden');
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