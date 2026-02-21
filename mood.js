class MoodTracker {
    constructor() {
        this.storageKey = 'weathermood_moods';
        this.journalKey = 'weathermood_journals';
        this.moods = this.load();
        this.journals = this.loadJournals();
    }

    load() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch {
            return [];
        }
    }

    loadJournals() {
        try {
            return JSON.parse(localStorage.getItem(this.journalKey)) || [];
        } catch {
            return [];
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.moods));
    }

    saveJournals() {
        localStorage.setItem(this.journalKey, JSON.stringify(this.journals));
    }

    logMood(mood, weather) {
        const today = new Date().toISOString().split('T')[0];
        const existing = this.moods.findIndex(m => m.date === today);

        const entry = {
            date: today,
            mood,
            weather: weather || 'unknown',
            timestamp: Date.now()
        };

        if (existing !== -1) {
            this.moods[existing] = entry;
        } else {
            this.moods.push(entry);
        }

        // Keep last 365 days
        const cutoff = Date.now() - (365 * 24 * 60 * 60 * 1000);
        this.moods = this.moods.filter(m => m.timestamp > cutoff);

        this.save();
        return entry;
    }

    saveJournalEntry(text, tags) {
        const today = new Date().toISOString().split('T')[0];
        const existing = this.journals.findIndex(j => j.date === today);

        const entry = {
            date: today,
            text,
            tags,
            timestamp: Date.now()
        };

        if (existing !== -1) {
            this.journals[existing] = entry;
        } else {
            this.journals.push(entry);
        }

        this.saveJournals();
        return entry;
    }

    getTodayMood() {
        const today = new Date().toISOString().split('T')[0];
        return this.moods.find(m => m.date === today);
    }

    getTodayJournal() {
        const today = new Date().toISOString().split('T')[0];
        return this.journals.find(j => j.date === today);
    }

    getLast30Days() {
        const days = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const moodEntry = this.moods.find(m => m.date === dateStr);

            days.push({
                date: dateStr,
                day: date.getDate(),
                mood: moodEntry ? moodEntry.mood : null,
                level: moodEntry ? this.getMoodLevel(moodEntry.mood) : 0
            });
        }

        return days;
    }

    getWeeklyData() {
        const days = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const moodEntry = this.moods.find(m => m.date === dateStr);

            days.push({
                label: dayNames[date.getDay()],
                value: moodEntry ? this.getMoodLevel(moodEntry.mood) : 0,
                mood: moodEntry ? moodEntry.mood : null
            });
        }

        return days;
    }

    getMoodLevel(mood) {
        const levels = { amazing: 5, good: 4, okay: 3, low: 2, stressed: 1, tired: 1 };
        return levels[mood] || 0;
    }

    getMoodResponse(mood) {
        const responses = {
            amazing: [
                "Fantastic! Your positive energy is contagious. Channel it into something amazing! 🌟",
                "What a great day to be alive! Consider sharing your energy with others. 🎉",
                "You're radiating positivity! Use this momentum for your biggest goals! 💫"
            ],
            good: [
                "Nice! A good mood is a great foundation. What will you build today? 🏗️",
                "Steady and positive — you're in a great headspace for productive work! ✨",
                "Keep this vibe going! Maybe tackle that task you've been putting off. 💪"
            ],
            okay: [
                "That's perfectly fine. Some days are just okay, and that's valid. 🌿",
                "Neutral is okay. Try a quick walk or stretch to boost your energy! 🚶",
                "Consider doing something small that brings you joy today. 🎵"
            ],
            low: [
                "I hear you. Be gentle with yourself today. Small wins still count. 💙",
                "It's okay to have low days. Maybe try some deep breathing or a warm drink. ☕",
                "Remember: this feeling is temporary. Take it one moment at a time. 🌤️"
            ],
            stressed: [
                "Stress is your body's signal. Take 5 deep breaths right now. You got this. 🧘",
                "Break your tasks into tiny pieces. One small step at a time. 📋",
                "Consider stepping away for 10 minutes. A reset can work wonders. 🌊"
            ],
            tired: [
                "Your body is asking for rest. Can you take a power nap? Even 15 mins helps. 😴",
                "Hydrate, stretch, and if possible, get some fresh air. 💧",
                "Prioritize only the essentials today. Rest is productive too! 🛋️"
            ]
        };

        const moodResponses = responses[mood] || responses.okay;
        return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }

    getStreak() {
        let streak = 0;
        const now = new Date();

        for (let i = 0; i < 365; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            if (this.moods.find(m => m.date === dateStr)) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    getAverageMood() {
        const recent = this.moods.slice(-7);
        if (recent.length === 0) return 'No data';

        const avg = recent.reduce((sum, m) => sum + this.getMoodLevel(m.mood), 0) / recent.length;

        if (avg >= 4.5) return 'Amazing';
        if (avg >= 3.5) return 'Good';
        if (avg >= 2.5) return 'Okay';
        if (avg >= 1.5) return 'Low';
        return 'Needs Attention';
    }

    getRecommendations(weather) {
        const todayMood = this.getTodayMood();
        const streak = this.getStreak();
        const recs = [];

        if (!todayMood) {
            recs.push({
                icon: '📝',
                title: 'Log your mood',
                desc: 'Start by checking in with yourself. How are you feeling right now?'
            });
        }

        if (weather === 'sunny' || weather === 'cloudy') {
            recs.push({
                icon: '🌳',
                title: 'Get outside',
                desc: 'Even 15 minutes of natural light can boost your mood and vitamin D levels.'
            });
        }

        if (weather === 'rainy' || weather === 'stormy') {
            recs.push({
                icon: '🎧',
                title: 'Focus with ambient sounds',
                desc: 'Rain sounds combined with lo-fi music create the perfect focus environment.'
            });
        }

        if (streak < 3) {
            recs.push({
                icon: '🔥',
                title: 'Build your streak',
                desc: `You're at ${streak} day${streak !== 1 ? 's' : ''}. Aim for 7 days of consistent tracking!`
            });
        } else {
            recs.push({
                icon: '🏆',
                title: `${streak} day streak!`,
                desc: 'Amazing consistency! Regular mood tracking leads to better self-awareness.'
            });
        }

        recs.push({
            icon: '💧',
            title: 'Stay hydrated',
            desc: 'Dehydration affects mood and focus. Aim for 8 glasses of water today.'
        });

        if (todayMood && (todayMood.mood === 'stressed' || todayMood.mood === 'low')) {
            recs.push({
                icon: '🧘',
                title: 'Try box breathing',
                desc: '4 seconds in, 4 seconds hold, 4 seconds out, 4 seconds hold. Repeat 4 times.'
            });
        }

        return recs;
    }

    drawMoodChart(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getWeeklyData();
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        // Get theme colors
        const style = getComputedStyle(document.documentElement);
        const gridColor = style.getPropertyValue('--glass-border').trim() || 'rgba(255,255,255,0.08)';
        const textColor = style.getPropertyValue('--text-tertiary').trim() || '#6b7280';
        const accentStr = style.getPropertyValue('--accent').trim() || '#f59e0b';

        // Grid lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= 5; i++) {
            const y = padding.top + chartH - (i / 5) * chartH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = '10px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(i.toString(), padding.left - 8, y + 4);
        }

        // Points
        const points = data.map((d, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartW,
            y: padding.top + chartH - (d.value / 5) * chartH,
            label: d.label,
            value: d.value,
            mood: d.mood
        }));

        // Area fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, accentStr + '40');
        gradient.addColorStop(1, accentStr + '05');

        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);

        points.forEach((p, i) => {
            if (i === 0) {
                ctx.lineTo(p.x, p.y);
            } else {
                const prevP = points[i - 1];
                const cpx1 = prevP.x + (p.x - prevP.x) * 0.4;
                const cpx2 = prevP.x + (p.x - prevP.x) * 0.6;
                ctx.bezierCurveTo(cpx1, prevP.y, cpx2, p.y, p.x, p.y);
            }
        });

        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        points.forEach((p, i) => {
            if (i === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                const prevP = points[i - 1];
                const cpx1 = prevP.x + (p.x - prevP.x) * 0.4;
                const cpx2 = prevP.x + (p.x - prevP.x) * 0.6;
                ctx.bezierCurveTo(cpx1, prevP.y, cpx2, p.y, p.x, p.y);
            }
        });
        ctx.strokeStyle = accentStr;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Dots and labels
        points.forEach(p => {
            // Outer glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = accentStr + '30';
            ctx.fill();

            // Inner dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = accentStr;
            ctx.fill();

            // White center
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Day label
            ctx.fillStyle = textColor;
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(p.label, p.x, height - padding.bottom + 20);
        });
    }

    clearAll() {
        this.moods = [];
        this.journals = [];
        this.save();
        this.saveJournals();
    }
}

window.moodTracker = new MoodTracker();