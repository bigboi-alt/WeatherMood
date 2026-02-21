class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.forecast = null;
        this.location = null;
        this.weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
        this.currentThemeIndex = 0;
        
        // OpenWeatherMap API - Free tier
        // Users can get their own key at https://openweathermap.org/api
        this.apiKey = localStorage.getItem('weathermood_apikey') || '';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.geoUrl = 'https://api.openweathermap.org/geo/1.0';

        this.savedLocations = this.loadSavedLocations();

        this.weatherData = {
            sunny: {
                icon: '☀️',
                condition: 'Clear Sky',
                activities: [
                    { icon: '🏃', name: 'Go for a run', reason: 'Perfect weather for outdoor exercise', tag: 'fitness' },
                    { icon: '🌳', name: 'Park walk', reason: 'Enjoy the sunshine and fresh air', tag: 'outdoor' },
                    { icon: '📸', name: 'Photography', reason: 'Great natural lighting conditions', tag: 'creative' },
                    { icon: '🧘', name: 'Outdoor yoga', reason: 'Warm and calm conditions', tag: 'wellness' },
                    { icon: '🚴', name: 'Cycling', reason: 'Clear roads and good visibility', tag: 'fitness' },
                    { icon: '🏖️', name: 'Beach time', reason: 'Sunny and warm — hit the beach!', tag: 'leisure' }
                ],
                prodBoost: 15,
                moodBoost: 'Sunny days boost serotonin. Great day to tackle challenging tasks!'
            },
            cloudy: {
                icon: '⛅',
                condition: 'Partly Cloudy',
                activities: [
                    { icon: '📚', name: 'Read a book', reason: 'Soft light, perfect for reading', tag: 'learning' },
                    { icon: '☕', name: 'Coffee & planning', reason: 'Cozy atmosphere for deep thinking', tag: 'productivity' },
                    { icon: '🎨', name: 'Art & creativity', reason: 'Overcast skies inspire creativity', tag: 'creative' },
                    { icon: '🚶', name: 'Gentle walk', reason: 'Comfortable temperature for walking', tag: 'outdoor' },
                    { icon: '🎵', name: 'Music session', reason: 'Great vibe for playing or listening', tag: 'leisure' },
                    { icon: '📝', name: 'Journaling', reason: 'Reflective weather for introspection', tag: 'wellness' }
                ],
                prodBoost: 10,
                moodBoost: 'Cloudy days are great for focused, creative work. Less screen glare too!'
            },
            rainy: {
                icon: '🌧️',
                condition: 'Rainy',
                activities: [
                    { icon: '💻', name: 'Deep work session', reason: 'Rain creates perfect focus ambiance', tag: 'productivity' },
                    { icon: '🎮', name: 'Indoor gaming', reason: 'Stay cozy and entertained', tag: 'leisure' },
                    { icon: '🍳', name: 'Cook a meal', reason: 'Perfect day for comfort food', tag: 'self-care' },
                    { icon: '📚', name: 'Online course', reason: 'Great day to learn something new', tag: 'learning' },
                    { icon: '🎬', name: 'Movie marathon', reason: 'Rainy day classic activity', tag: 'leisure' },
                    { icon: '🧹', name: 'Organize space', reason: 'Productive indoor activity', tag: 'productivity' }
                ],
                prodBoost: 20,
                moodBoost: 'Rain sound is nature\'s white noise. Perfect for deep concentration!'
            },
            stormy: {
                icon: '⛈️',
                condition: 'Thunderstorm',
                activities: [
                    { icon: '🛡️', name: 'Stay safe indoors', reason: 'Safety first during storms', tag: 'safety' },
                    { icon: '📖', name: 'Deep reading', reason: 'Storm sounds enhance focus', tag: 'learning' },
                    { icon: '🧘', name: 'Meditation', reason: 'Find calm within the storm', tag: 'wellness' },
                    { icon: '✍️', name: 'Creative writing', reason: 'Storms inspire dramatic writing', tag: 'creative' },
                    { icon: '🏋️', name: 'Home workout', reason: 'Burn energy without going out', tag: 'fitness' },
                    { icon: '📱', name: 'Catch up with friends', reason: 'Connect while staying in', tag: 'social' }
                ],
                prodBoost: 5,
                moodBoost: 'Storms can be cozy. Embrace the dramatic atmosphere for creative work!'
            },
            snowy: {
                icon: '🌨️',
                condition: 'Snowy',
                activities: [
                    { icon: '⛷️', name: 'Winter sports', reason: 'Fresh snow on the ground!', tag: 'fitness' },
                    { icon: '☕', name: 'Hot chocolate time', reason: 'Warm up with a cozy drink', tag: 'self-care' },
                    { icon: '📸', name: 'Snow photography', reason: 'Beautiful winter landscapes', tag: 'creative' },
                    { icon: '🎯', name: 'Goal planning', reason: 'Quiet winter day for reflection', tag: 'productivity' },
                    { icon: '🍲', name: 'Make soup', reason: 'Warm comfort food for cold days', tag: 'self-care' },
                    { icon: '⛄', name: 'Build a snowman', reason: 'Classic snow day activity', tag: 'leisure' }
                ],
                prodBoost: 8,
                moodBoost: 'Snow creates a magical atmosphere. Perfect for mindful activities!'
            }
        };
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('weathermood_apikey', key);
    }

    getApiKey() {
        return this.apiKey;
    }

    loadSavedLocations() {
        try {
            return JSON.parse(localStorage.getItem('weathermood_saved_locations')) || [];
        } catch {
            return [];
        }
    }

    saveSavedLocations() {
        localStorage.setItem('weathermood_saved_locations', JSON.stringify(this.savedLocations));
    }

    addSavedLocation(location) {
        // Don't duplicate
        const exists = this.savedLocations.find(l => 
            l.lat === location.lat && l.lon === location.lon
        );
        if (!exists) {
            this.savedLocations.unshift(location);
            // Keep only last 5
            this.savedLocations = this.savedLocations.slice(0, 5);
            this.saveSavedLocations();
        }
    }

    removeSavedLocation(index) {
        this.savedLocations.splice(index, 1);
        this.saveSavedLocations();
    }

    // Get user's location via browser Geolocation API
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const locationInfo = await this.reverseGeocode(latitude, longitude);
                        resolve(locationInfo);
                    } catch (error) {
                        // If reverse geocoding fails, still return coordinates
                        resolve({
                            lat: latitude,
                            lon: longitude,
                            name: 'Current Location',
                            country: '',
                            state: '',
                            fullName: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
                        });
                    }
                },
                (error) => {
                    let message = 'Unable to get your location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Location permission denied. Please enable location access or enter your city manually.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Location information unavailable. Please enter your city manually.';
                            break;
                        case error.TIMEOUT:
                            message = 'Location request timed out. Please try again or enter your city manually.';
                            break;
                    }
                    reject(new Error(message));
                },
                options
            );
        });
    }

    // Reverse geocode coordinates to get city name
    async reverseGeocode(lat, lon) {
        if (!this.apiKey) {
            throw new Error('API key required for reverse geocoding');
        }

        const url = `${this.geoUrl}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to get location name');
        }

        const data = await response.json();
        if (data.length === 0) {
            throw new Error('Location not found');
        }

        const place = data[0];
        return {
            lat: place.lat,
            lon: place.lon,
            name: place.name,
            state: place.state || '',
            country: place.country,
            fullName: this.formatLocationName(place)
        };
    }

    // Search for cities by name
    async searchCities(query) {
        if (!query || query.length < 2) return [];
        
        if (!this.apiKey) {
            // Demo mode - return mock results
            return this.getMockCities(query);
        }

        const url = `${this.geoUrl}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            return data.map(place => ({
                lat: place.lat,
                lon: place.lon,
                name: place.name,
                state: place.state || '',
                country: place.country,
                fullName: this.formatLocationName(place)
            }));
        } catch (error) {
            console.error('City search error:', error);
            return this.getMockCities(query);
        }
    }

    getMockCities(query) {
        const cities = [
            { name: 'New Delhi', state: 'Delhi', country: 'IN', lat: 28.6139, lon: 77.2090 },
            { name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0760, lon: 72.8777 },
            { name: 'Bangalore', state: 'Karnataka', country: 'IN', lat: 12.9716, lon: 77.5946 },
            { name: 'London', state: 'England', country: 'GB', lat: 51.5074, lon: -0.1278 },
            { name: 'New York', state: 'NY', country: 'US', lat: 40.7128, lon: -74.0060 },
            { name: 'Tokyo', state: '', country: 'JP', lat: 35.6762, lon: 139.6503 },
            { name: 'Paris', state: '', country: 'FR', lat: 48.8566, lon: 2.3522 },
            { name: 'Sydney', state: 'NSW', country: 'AU', lat: -33.8688, lon: 151.2093 },
            { name: 'Dubai', state: '', country: 'AE', lat: 25.2048, lon: 55.2708 },
            { name: 'Singapore', state: '', country: 'SG', lat: 1.3521, lon: 103.8198 },
            { name: 'Chennai', state: 'Tamil Nadu', country: 'IN', lat: 13.0827, lon: 80.2707 },
            { name: 'Kolkata', state: 'West Bengal', country: 'IN', lat: 22.5726, lon: 88.3639 },
            { name: 'Hyderabad', state: 'Telangana', country: 'IN', lat: 17.3850, lon: 78.4867 },
            { name: 'Pune', state: 'Maharashtra', country: 'IN', lat: 18.5204, lon: 73.8567 },
            { name: 'Jaipur', state: 'Rajasthan', country: 'IN', lat: 26.9124, lon: 75.7873 },
        ];

        const lowerQuery = query.toLowerCase();
        return cities
            .filter(c => c.name.toLowerCase().includes(lowerQuery))
            .map(c => ({
                ...c,
                fullName: this.formatLocationName(c)
            }));
    }

    formatLocationName(place) {
        let parts = [place.name];
        if (place.state) parts.push(place.state);
        parts.push(this.getCountryName(place.country));
        return parts.join(', ');
    }

    getCountryName(code) {
        const countries = {
            'IN': 'India', 'US': 'USA', 'GB': 'UK', 'JP': 'Japan',
            'FR': 'France', 'AU': 'Australia', 'AE': 'UAE', 'SG': 'Singapore',
            'DE': 'Germany', 'CA': 'Canada', 'CN': 'China', 'BR': 'Brazil',
            'RU': 'Russia', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands'
        };
        return countries[code] || code;
    }

    // Fetch current weather from API
    async fetchWeather(lat, lon) {
        if (!this.apiKey) {
            // Demo mode - generate realistic mock data
            return this.generateMockWeather(lat, lon);
        }

        const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
                }
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();
            return this.parseWeatherData(data);
        } catch (error) {
            console.error('Weather fetch error:', error);
            // Fallback to mock data
            return this.generateMockWeather(lat, lon);
        }
    }

    // Fetch 5-day forecast
    async fetchForecast(lat, lon) {
        if (!this.apiKey) {
            return this.generateMockForecast();
        }

        const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch forecast');
            }

            const data = await response.json();
            return this.parseForecastData(data);
        } catch (error) {
            console.error('Forecast fetch error:', error);
            return this.generateMockForecast();
        }
    }

    parseWeatherData(data) {
        const weatherId = data.weather[0].id;
        const weatherType = this.mapWeatherIdToType(weatherId);
        const typeData = this.weatherData[weatherType];

        this.currentWeather = {
            type: weatherType,
            icon: this.getWeatherIcon(weatherId, data.weather[0].icon),
            condition: data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1),
            temp: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
            visibility: data.visibility ? Math.round(data.visibility / 1000) : 10,
            pressure: data.main.pressure,
            tempMin: Math.round(data.main.temp_min),
            tempMax: Math.round(data.main.temp_max),
            sunrise: this.formatTime(data.sys.sunrise * 1000),
            sunset: this.formatTime(data.sys.sunset * 1000),
            activities: this.shuffleArray([...typeData.activities]).slice(0, 4),
            prodBoost: typeData.prodBoost,
            moodBoost: typeData.moodBoost,
            isLive: true,
            timestamp: Date.now()
        };

        return this.currentWeather;
    }

    parseForecastData(data) {
        // Get one forecast per day (noon)
        const dailyForecasts = [];
        const seenDates = new Set();
        const today = new Date().toDateString();

        for (const item of data.list) {
            const date = new Date(item.dt * 1000);
            const dateStr = date.toDateString();
            
            // Skip today and duplicates
            if (dateStr === today || seenDates.has(dateStr)) continue;
            
            // Prefer mid-day forecasts
            const hour = date.getHours();
            if (hour >= 11 && hour <= 14) {
                seenDates.add(dateStr);
                dailyForecasts.push({
                    date: date,
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    icon: this.getWeatherIcon(item.weather[0].id, item.weather[0].icon),
                    tempHigh: Math.round(item.main.temp_max),
                    tempLow: Math.round(item.main.temp_min),
                    description: item.weather[0].main
                });
            }

            if (dailyForecasts.length >= 5) break;
        }

        // If we didn't get enough mid-day forecasts, fill in gaps
        if (dailyForecasts.length < 5) {
            for (const item of data.list) {
                const date = new Date(item.dt * 1000);
                const dateStr = date.toDateString();
                
                if (dateStr === today || seenDates.has(dateStr)) continue;
                
                seenDates.add(dateStr);
                dailyForecasts.push({
                    date: date,
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    icon: this.getWeatherIcon(item.weather[0].id, item.weather[0].icon),
                    tempHigh: Math.round(item.main.temp_max),
                    tempLow: Math.round(item.main.temp_min),
                    description: item.weather[0].main
                });

                if (dailyForecasts.length >= 5) break;
            }
        }

        this.forecast = dailyForecasts;
        return this.forecast;
    }

    mapWeatherIdToType(id) {
        // OpenWeatherMap weather condition codes
        // https://openweathermap.org/weather-conditions
        if (id >= 200 && id < 300) return 'stormy';      // Thunderstorm
        if (id >= 300 && id < 400) return 'rainy';       // Drizzle
        if (id >= 500 && id < 600) return 'rainy';       // Rain
        if (id >= 600 && id < 700) return 'snowy';       // Snow
        if (id >= 700 && id < 800) return 'cloudy';      // Atmosphere (fog, mist, etc.)
        if (id === 800) return 'sunny';                   // Clear
        if (id > 800 && id < 900) return 'cloudy';       // Clouds
        return 'cloudy';
    }

    getWeatherIcon(id, iconCode) {
        // Map weather codes to emoji
        const isNight = iconCode && iconCode.includes('n');
        
        if (id >= 200 && id < 300) return '⛈️';
        if (id >= 300 && id < 400) return '🌧️';
        if (id >= 500 && id < 511) return '🌧️';
        if (id === 511) return '🌨️';
        if (id >= 520 && id < 600) return '🌧️';
        if (id >= 600 && id < 700) return '🌨️';
        if (id >= 700 && id < 800) return '🌫️';
        if (id === 800) return isNight ? '🌙' : '☀️';
        if (id === 801) return isNight ? '🌙' : '🌤️';
        if (id === 802) return '⛅';
        if (id >= 803) return '☁️';
        return '🌤️';
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    generateMockWeather(lat, lon) {
        // Generate realistic weather based on latitude and time
        const hour = new Date().getHours();
        const month = new Date().getMonth();
        
        // Base temperature on latitude (rough approximation)
        let baseTemp = 25 - Math.abs(lat) * 0.5;
        
        // Seasonal adjustment (Northern hemisphere)
        if (lat > 0) {
            if (month >= 5 && month <= 8) baseTemp += 10; // Summer
            if (month >= 11 || month <= 2) baseTemp -= 10; // Winter
        } else {
            if (month >= 5 && month <= 8) baseTemp -= 10;
            if (month >= 11 || month <= 2) baseTemp += 10;
        }

        // Time of day adjustment
        if (hour >= 6 && hour < 12) baseTemp -= 3;
        if (hour >= 12 && hour < 18) baseTemp += 3;
        if (hour >= 18 || hour < 6) baseTemp -= 5;

        // Add some randomness
        baseTemp += (Math.random() - 0.5) * 8;
        baseTemp = Math.round(baseTemp);

        // Determine weather type based on temperature and randomness
        let weatherType;
        const rand = Math.random();
        
        if (baseTemp < 0) {
            weatherType = rand < 0.7 ? 'snowy' : 'cloudy';
        } else if (baseTemp < 10) {
            weatherType = rand < 0.4 ? 'rainy' : rand < 0.7 ? 'cloudy' : 'sunny';
        } else if (baseTemp < 25) {
            weatherType = rand < 0.5 ? 'sunny' : rand < 0.8 ? 'cloudy' : 'rainy';
        } else {
            weatherType = rand < 0.6 ? 'sunny' : rand < 0.9 ? 'cloudy' : 'stormy';
        }

        const typeData = this.weatherData[weatherType];
        
        // Calculate sunrise/sunset based on rough estimate
        const sunrise = `${6 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
        const sunset = `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;

        this.currentWeather = {
            type: weatherType,
            icon: typeData.icon,
            condition: typeData.condition,
            temp: baseTemp,
            feelsLike: baseTemp + Math.floor(Math.random() * 5) - 2,
            humidity: 40 + Math.floor(Math.random() * 40),
            wind: 5 + Math.floor(Math.random() * 25),
            visibility: 5 + Math.floor(Math.random() * 10),
            pressure: 1000 + Math.floor(Math.random() * 30),
            tempMin: baseTemp - Math.floor(Math.random() * 5),
            tempMax: baseTemp + Math.floor(Math.random() * 5),
            sunrise,
            sunset,
            activities: this.shuffleArray([...typeData.activities]).slice(0, 4),
            prodBoost: typeData.prodBoost,
            moodBoost: typeData.moodBoost,
            isLive: false,
            timestamp: Date.now()
        };

        return this.currentWeather;
    }

    generateMockForecast() {
        const forecast = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        
        for (let i = 1; i <= 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            const types = Object.keys(this.weatherData);
            const randomType = types[Math.floor(Math.random() * types.length)];
            const baseTemp = this.currentWeather ? this.currentWeather.temp : 20;
            
            forecast.push({
                date: date,
                day: days[date.getDay()],
                icon: this.weatherData[randomType].icon,
                tempHigh: baseTemp + Math.floor(Math.random() * 6) - 2,
                tempLow: baseTemp - Math.floor(Math.random() * 8) - 2,
                description: this.weatherData[randomType].condition
            });
        }

        this.forecast = forecast;
        return forecast;
    }

    getActivities() {
        if (!this.currentWeather) return [];
        const data = this.weatherData[this.currentWeather.type];
        return this.shuffleArray([...data.activities]).slice(0, 4);
    }

    cycleTheme() {
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.weatherTypes.length;
        const newType = this.weatherTypes[this.currentThemeIndex];
        const typeData = this.weatherData[newType];

        // Create demo weather with the new type
        this.currentWeather = {
            ...this.currentWeather,
            type: newType,
            icon: typeData.icon,
            condition: typeData.condition,
            activities: this.shuffleArray([...typeData.activities]).slice(0, 4),
            prodBoost: typeData.prodBoost,
            moodBoost: typeData.moodBoost,
            isLive: false
        };

        return this.currentWeather;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getProductivityScore() {
        const base = 60;
        const weatherBoost = this.currentWeather ? this.currentWeather.prodBoost : 0;
        const tasks = JSON.parse(localStorage.getItem('weathermood_tasks') || '[]');
        const completed = tasks.filter(t => t.completed).length;
        const taskBoost = Math.min(completed * 3, 20);
        const moodData = JSON.parse(localStorage.getItem('weathermood_moods') || '[]');
        const todayMood = moodData.find(m => m.date === new Date().toISOString().split('T')[0]);
        const moodBoost = todayMood ? this.getMoodScore(todayMood.mood) * 2 : 0;

        return Math.min(base + weatherBoost + taskBoost + moodBoost, 100);
    }

    getMoodScore(mood) {
        const scores = { amazing: 5, good: 4, okay: 3, low: 2, stressed: 1, tired: 1 };
        return scores[mood] || 3;
    }

    getProductivityMessage(score) {
        if (score >= 90) return "🔥 You're on fire! Peak performance day!";
        if (score >= 75) return "💪 Great momentum! Keep it going!";
        if (score >= 60) return "👍 Solid progress. Stay focused!";
        if (score >= 40) return "🌱 Building up. Take it one task at a time.";
        return "😌 Slow start? That's okay. Small steps count!";
    }

    saveCurrentLocation(location) {
        this.location = location;
        localStorage.setItem('weathermood_location', JSON.stringify(location));
        this.addSavedLocation(location);
    }

    loadSavedLocation() {
        try {
            const saved = localStorage.getItem('weathermood_location');
            if (saved) {
                this.location = JSON.parse(saved);
                return this.location;
            }
        } catch (e) {
            console.error('Error loading saved location:', e);
        }
        return null;
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Updated just now';
        if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `Updated ${Math.floor(seconds / 3600)} hours ago`;
        return `Updated ${Math.floor(seconds / 86400)} days ago`;
    }
}

window.weatherManager = new WeatherManager();