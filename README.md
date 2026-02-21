# 🌤️ WeatherMood — Weather-Based Productivity Dashboard

<div align="center">

![WeatherMood Banner](https://img.shields.io/badge/WeatherMood-v2.0-orange?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNSIvPjxsaW5lIHgxPSIxMiIgeTE9IjEiIHgyPSIxMiIgeTI9IjMiLz48bGluZSB4MT0iMTIiIHkxPSIyMSIgeDI9IjEyIiB5Mj0iMjMiLz48bGluZSB4MT0iNC4yMiIgeTE9IjQuMjIiIHgyPSI1LjY0IiB5Mj0iNS42NCIvPjxsaW5lIHgxPSIxOC4zNiIgeTE9IjE4LjM2IiB4Mj0iMTkuNzgiIHkyPSIxOS43OCIvPjxsaW5lIHgxPSIxIiB5MT0iMTIiIHgyPSIzIiB5Mj0iMTIiLz48bGluZSB4MT0iMjEiIHkxPSIxMiIgeDI9IjIzIiB5Mj0iMTIiLz48bGluZSB4MT0iNC4yMiIgeTE9IjE5Ljc4IiB4Mj0iNS42NCIgeTI9IjE4LjM2Ii8+PGxpbmUgeDE9IjE4LjM2IiB5MT0iNS42NCIgeDI9IjE5Ljc4IiB5Mj0iNC4yMiIvPjwvc3ZnPg==)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![OpenWeatherMap](https://img.shields.io/badge/OpenWeatherMap-API-orange?style=flat-square)](https://openweathermap.org/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A beautiful, feature-rich productivity dashboard that adapts to real-time weather conditions at your location.**

[Live Demo](#demo) • [Features](#features) • [Installation](#installation) • [Configuration](#configuration) • [Usage](#usage)

</div>

---

## 📸 Preview
┌─────────────────────────────────────────────────────────────────────────┐
│ ☀ WeatherMood [Dashboard] [Tasks] [Mood] [Insights] 🔄 📍 ⚙️│
├─────────────────────────────────────────────────────────────────────────┤
│ │
│ ☀️ 24°C 12:45 │
│ Clear Sky Monday, Jan 15 │
│ 📍 New Delhi, Delhi, India Updated just now │
│ │
│ 💧 Humidity: 65% 💨 Wind: 12 km/h 👁 Visibility: 10 km │
│ 🌅 Sunrise: 06:45 🌇 Sunset: 18:22 🌡️ Min/Max: 18/28° │
│ │
├─────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Productivity │ │ Activities │ │ Focus Timer │ │
│ │ 78% │ │ 🏃 Go for a run │ │ 25:00 │ │
│ │ Great momentum! │ │ 🌳 Park walk │ │ [Start] │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────┘

text


---

## ✨ Features

### 🌍 Real-Time Location & Weather
- **GPS Auto-Detection** — Uses browser Geolocation API (like Blinkit, Zepto, etc.)
- **Manual City Search** — Search any city worldwide with autocomplete
- **Precise Location** — Shows exact city, state, and country (e.g., "New Delhi, Delhi, India")
- **Live Weather Data** — Fetches real-time weather from OpenWeatherMap API
- **5-Day Forecast** — See upcoming weather conditions
- **Detailed Metrics** — Temperature, humidity, wind speed, visibility, pressure, sunrise/sunset

### 🎨 Dynamic Theming
- **5 Weather Themes** — Sunny, Cloudy, Rainy, Stormy, Snowy
- **Auto Theme Switching** — UI adapts based on actual weather conditions
- **Animated Particles** — Canvas-based particle system changes per weather (rain drops, snowflakes, sun rays)
- **Glassmorphism UI** — Modern frosted glass aesthetic with smooth animations

### ✅ Task Management
- **Add/Complete/Delete Tasks** — Full CRUD functionality
- **Priority Levels** — High, Medium, Low with color coding
- **Categories** — Work, Personal, Health, Learning, Outdoor
- **Weather-Based Suggestions** — Recommends outdoor tasks on sunny days
- **Filters** — View All, Active, Completed, Outdoor, High Priority
- **Persistent Storage** — Tasks saved in localStorage

### 😊 Mood Tracking
- **Quick Mood Check** — 6 mood options with emoji selection
- **Personalized Responses** — AI-like suggestions based on your mood
- **30-Day Heatmap** — Visual history of your mood patterns
- **Weekly Trend Chart** — Canvas-drawn mood visualization
- **Journal Entries** — Write daily reflections with tags

### ⏱️ Focus Timer (Pomodoro)
- **Preset Durations** — 5, 15, 25, 45, 60 minutes
- **Custom Timer** — Set any duration (hours, minutes, seconds)
- **Visual Progress Ring** — Animated SVG countdown
- **Session Tracking** — Counts completed focus sessions
- **Completion Sound** — Web Audio API notification

### 📊 Insights Dashboard
- **Productivity Score** — Calculated from weather, tasks, and mood
- **Weather Impact** — How weather affects your productivity
- **Streak Tracking** — Consecutive days of mood logging
- **Completion Rate** — Task completion statistics
- **AI Recommendations** — Personalized suggestions

### 🔧 Settings & Preferences
- **Temperature Unit** — Toggle Celsius/Fahrenheit
- **Sound Controls** — Enable/disable timer sounds
- **Auto-Refresh Weather** — Keep weather data updated
- **Custom API Key** — Use your own OpenWeatherMap key
- **Location Management** — Save and switch between locations
- **Data Reset** — Clear all stored data

---
