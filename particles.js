class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 120 };
        this.animationId = null;
        this.weatherType = 'sunny';

        this.resize();
        this.bindEvents();
        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    getParticleConfig() {
        const configs = {
            sunny: {
                count: 50,
                sizeRange: [1, 3],
                speedRange: [0.2, 0.8],
                colors: ['rgba(245,158,11,0.4)', 'rgba(249,115,22,0.3)', 'rgba(251,191,36,0.3)'],
                glow: true,
                drift: true
            },
            cloudy: {
                count: 40,
                sizeRange: [1, 4],
                speedRange: [0.1, 0.5],
                colors: ['rgba(96,165,250,0.3)', 'rgba(129,140,248,0.2)', 'rgba(147,197,253,0.25)'],
                glow: false,
                drift: true
            },
            rainy: {
                count: 80,
                sizeRange: [1, 2],
                speedRange: [3, 7],
                colors: ['rgba(99,102,241,0.3)', 'rgba(139,92,246,0.2)'],
                glow: false,
                drift: false,
                rain: true
            },
            stormy: {
                count: 60,
                sizeRange: [1, 3],
                speedRange: [2, 5],
                colors: ['rgba(168,85,247,0.3)', 'rgba(236,72,153,0.2)'],
                glow: true,
                drift: false,
                rain: true
            },
            snowy: {
                count: 70,
                sizeRange: [2, 5],
                speedRange: [0.3, 1.2],
                colors: ['rgba(255,255,255,0.5)', 'rgba(56,189,248,0.3)', 'rgba(125,211,252,0.3)'],
                glow: true,
                drift: true,
                snow: true
            }
        };

        return configs[this.weatherType] || configs.sunny;
    }

    init() {
        this.particles = [];
        const config = this.getParticleConfig();

        for (let i = 0; i < config.count; i++) {
            this.particles.push(this.createParticle(config));
        }
    }

    createParticle(config) {
        const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
        const speed = config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]);

        return {
            x: Math.random() * this.canvas.width,
            y: config.rain || config.snow ? Math.random() * this.canvas.height - this.canvas.height : Math.random() * this.canvas.height,
            size: size,
            baseSize: size,
            speedX: config.drift ? (Math.random() - 0.5) * speed : (Math.random() - 0.5) * 0.3,
            speedY: config.rain ? speed : config.snow ? speed * 0.5 : (Math.random() - 0.5) * speed,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            opacity: 0.3 + Math.random() * 0.5,
            glow: config.glow,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.02,
            wobble: config.snow ? Math.random() * 2 : 0,
            wobbleSpeed: config.snow ? 0.01 + Math.random() * 0.02 : 0
        };
    }

    updateParticle(p) {
        const config = this.getParticleConfig();

        p.angle += p.angleSpeed;

        if (config.snow) {
            p.x += Math.sin(p.angle) * p.wobble + p.speedX;
            p.y += p.speedY;
        } else if (config.rain) {
            p.x += p.speedX;
            p.y += p.speedY;
        } else {
            p.x += p.speedX + Math.sin(p.angle) * 0.3;
            p.y += p.speedY + Math.cos(p.angle) * 0.3;
        }

        // Mouse interaction
        if (this.mouse.x !== null && !config.rain) {
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.mouse.radius) {
                const force = (this.mouse.radius - dist) / this.mouse.radius;
                p.x += (dx / dist) * force * 2;
                p.y += (dy / dist) * force * 2;
                p.size = p.baseSize * (1 + force * 0.5);
            } else {
                p.size += (p.baseSize - p.size) * 0.05;
            }
        }

        // Bounds
        if (config.rain || config.snow) {
            if (p.y > this.canvas.height + 10) {
                p.y = -10;
                p.x = Math.random() * this.canvas.width;
            }
        } else {
            if (p.x < -50) p.x = this.canvas.width + 50;
            if (p.x > this.canvas.width + 50) p.x = -50;
            if (p.y < -50) p.y = this.canvas.height + 50;
            if (p.y > this.canvas.height + 50) p.y = -50;
        }
    }

    drawParticle(p) {
        this.ctx.save();
        this.ctx.globalAlpha = p.opacity;

        if (p.glow) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = p.color;
        }

        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();

        const config = this.getParticleConfig();

        if (config.rain) {
            // Draw as line for rain
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.size * 5);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = p.size * 0.5;
            this.ctx.stroke();
        } else {
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawConnections() {
        const config = this.getParticleConfig();
        if (config.rain || config.snow) return;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (1 - dist / 150) * 0.15;
                    this.ctx.strokeStyle = this.particles[i].color;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            this.updateParticle(p);
            this.drawParticle(p);
        });

        this.drawConnections();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    setWeather(type) {
        this.weatherType = type;
        this.init();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize globally
window.particleSystem = new ParticleSystem('particleCanvas');