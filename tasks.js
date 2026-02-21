class TaskManager {
    constructor() {
        this.storageKey = 'weathermood_tasks';
        this.tasks = this.load();
        this.currentFilter = 'all';
    }

    load() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch {
            return [];
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    add(name, priority = 'medium', category = 'work') {
        const task = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            name,
            priority,
            category,
            completed: false,
            createdAt: Date.now(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.save();
        return task;
    }

    toggle(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? Date.now() : null;
            this.save();
        }
        return task;
    }

    delete(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
    }

    getFiltered(filter) {
        this.currentFilter = filter;

        switch (filter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'outdoor':
                return this.tasks.filter(t => t.category === 'outdoor');
            case 'high':
                return this.tasks.filter(t => t.priority === 'high');
            default:
                return [...this.tasks];
        }
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Today's stats
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(t => {
            const taskDate = new Date(t.createdAt).toISOString().split('T')[0];
            return taskDate === today;
        });
        const todayCompleted = todayTasks.filter(t => t.completed).length;

        return {
            total,
            completed,
            pending,
            completionRate,
            todayTotal: todayTasks.length,
            todayCompleted
        };
    }

    getSuggestedForWeather(weatherType) {
        const suggestions = {
            sunny: ['outdoor', 'health'],
            cloudy: ['personal', 'learning'],
            rainy: ['work', 'learning'],
            stormy: ['work', 'personal'],
            snowy: ['personal', 'health']
        };

        const categories = suggestions[weatherType] || ['work'];
        return this.tasks
            .filter(t => !t.completed && categories.includes(t.category))
            .slice(0, 3);
    }

    clearAll() {
        this.tasks = [];
        this.save();
    }
}

window.taskManager = new TaskManager();