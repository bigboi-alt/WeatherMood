class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
        this.currentThemeIndex = 0;

        this.weatherData = {
            sunny: {
                icon: '☀️',
                condition: 'Clear Sky',
                tempRange: [22, 35],
                humidity: [30, 55],
                wind: [5, 15],
                visibility: [8, 15],
                feelsLikeDiff: [-2, 3],
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
                tempRange: [15, 25],
                humidity: [50, 70],
                wind: [10, 25],
                visibility: [5, 10],
                feelsLikeDiff: [-3, 0],
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
                tempRange: [10, 20],
                humidity: [70, 95],
                wind: [15, 35],
                visibility: [2, 6],
                feelsLikeDiff: [-5, -2],
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
                tempRange: [8, 18],
                humidity: [80, 98],
                wind: [30, 60],
                visibility: [1, 4],
                feelsLikeDiff: [-7, -3],
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
                tempRange: [-5, 5],
                humidity: [60, 85],
                wind: [5, 20],
                visibility: [2, 7],
                feelsLikeDiff: [-8, -4],
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

    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    detectWeather() {
        // Simulate weather based on time of day and randomness
        const hour = new Date().getHours();
        let weights;

        if (hour >= 6 && hour < 12) {
            weights = { sunny: 40, cloudy: 30, rainy: 15, stormy: 5, snowy: 10 };
        } else if (hour >= 12 && hour < 18) {
            weights = { sunny: 35, cloudy: 25, rainy: 20, stormy: 10, snowy: 10 };
        } else {
            weights = { sunny: 15, cloudy: 30, rainy: 25, stormy: 15, snowy: 15 };
        }

        // Check saved preference or use random
        const saved = localStorage.getItem('weathermood_weather');
        if (saved && this.weatherData[saved]) {
            return this.generateWeatherData(saved);
        }

        const rand = Math.random() * 100;
        let cumulative = 0;
        let selected = 'sunny';

        for (const [type, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
                selected = type;
                break;
            }
        }

        return this.generateWeatherData(selected);
    }

    generateWeatherData(type) {
        const data = this.weatherData[type];
        const temp = this.randomInRange(data.tempRange[0], data.tempRange[1]);
        const feelsLikeDiff = this.randomInRange(data.feelsLikeDiff[0], data.feelsLikeDiff[1]);

        this.currentWeather = {
            type,
            icon: data.icon,
            condition: data.condition,
            temp,
            feelsLike: temp + feelsLikeDiff,
            humidity: this.randomInRange(data.humidity[0], data.humidity[1]),
            wind: this.randomInRange(data.wind[0], data.wind[1]),
            visibility: this.randomInRange(data.visibility[0], data.visibility[1]),
            activities: this.shuffleArray([...data.activities]).slice(0, 4),
            prodBoost: data.prodBoost,
            moodBoost: data.moodBoost
        };

        return this.currentWeather;
    }

    getActivities() {
        if (!this.currentWeather) return [];
        const data = this.weatherData[this.currentWeather.type];
        return this.shuffleArray([...data.activities]).slice(0, 4);
    }

    cycleTheme() {
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.weatherTypes.length;
        const newType = this.weatherTypes[this.currentThemeIndex];
        const weather = this.generateWeatherData(newType);
        return weather;
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
}

window.weatherManager = new WeatherManager();