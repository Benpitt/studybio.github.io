/**
 * Dynamic Gradient System
 * Creates fluid, time-of-day based gradient animations
 */

class DynamicGradient {
    constructor() {
        // Time-of-day color palettes - Dark theme
        this.palettes = {
            dawn: {
                name: 'Dawn',
                time: [5, 8],
                colors: ['#0a0a1a', '#1e1b4b', '#312e81', '#134e4a', '#1e40af', '#164e63']
            },
            morning: {
                name: 'Morning',
                time: [8, 12],
                colors: ['#0a0a1a', '#1e1b4b', '#0f766e', '#134e4a', '#0e7490', '#1e40af']
            },
            afternoon: {
                name: 'Afternoon',
                time: [12, 17],
                colors: ['#0a0a1a', '#1e1b4b', '#134e4a', '#0f766e', '#115e59', '#14532d']
            },
            evening: {
                name: 'Evening',
                time: [17, 20],
                colors: ['#0a0a1a', '#1e1b4b', '#312e81', '#4c1d95', '#5b21b6', '#6b21a8']
            },
            night: {
                name: 'Night',
                time: [20, 24],
                colors: ['#0a0a1a', '#1e1b4b', '#312e81', '#4c1d95', '#581c87', '#6b21a8']
            },
            lateNight: {
                name: 'Late Night',
                time: [0, 5],
                colors: ['#0a0a1a', '#0f172a', '#1e1b4b', '#312e81', '#1e293b', '#0f172a']
            }
        };

        this.currentPalette = null;
        this.nextPalette = null;
        this.transitionProgress = 0;
        this.init();
    }

    init() {
        // Set initial palette based on current time
        this.updatePalette();

        // Apply the gradient to elements
        this.applyGradient();

        // Update palette every minute
        setInterval(() => this.updatePalette(), 60000);

        // Smoothly animate color transitions
        this.animateColorTransition();
    }

    getCurrentPalette() {
        const now = new Date();
        const hour = now.getHours();

        for (const [key, palette] of Object.entries(this.palettes)) {
            const [start, end] = palette.time;
            if (start <= end) {
                if (hour >= start && hour < end) return palette;
            } else {
                // Handle overnight ranges (like lateNight: 0-5)
                if (hour >= start || hour < end) return palette;
            }
        }

        return this.palettes.afternoon; // Default fallback
    }

    getNextPalette() {
        const now = new Date();
        const currentHour = now.getHours();

        // Find the next time period
        const periods = Object.values(this.palettes).sort((a, b) => {
            const aStart = a.time[0];
            const bStart = b.time[0];

            // Calculate hours until start
            const hoursToA = (aStart - currentHour + 24) % 24;
            const hoursToB = (bStart - currentHour + 24) % 24;

            return hoursToA - hoursToB;
        });

        return periods[1] || periods[0]; // Next period or wrap around
    }

    updatePalette() {
        const newPalette = this.getCurrentPalette();

        if (!this.currentPalette || this.currentPalette.name !== newPalette.name) {
            console.log(`🎨 Gradient transitioning to ${newPalette.name} palette`);
            this.nextPalette = newPalette;
            this.currentPalette = this.currentPalette || newPalette;
        }
    }

    interpolateColor(color1, color2, factor) {
        // Convert hex to RGB
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    getBlendedColors() {
        if (!this.nextPalette || this.transitionProgress >= 1) {
            this.transitionProgress = 0;
            if (this.nextPalette) {
                this.currentPalette = this.nextPalette;
                this.nextPalette = null;
            }
            return this.currentPalette.colors;
        }

        // Smoothly blend between current and next palette
        const blended = this.currentPalette.colors.map((color, i) => {
            const nextColor = this.nextPalette.colors[i] || this.nextPalette.colors[0];
            return this.interpolateColor(color, nextColor, this.transitionProgress);
        });

        return blended;
    }

    applyGradient() {
        const colors = this.getBlendedColors();

        // Update main animated gradient element if it exists (index page)
        const animatedElement = document.querySelector('.bg-animated-gradient');
        if (animatedElement) {
            const gradient = `linear-gradient(-45deg, ${colors.join(', ')})`;
            animatedElement.style.background = gradient;
            animatedElement.style.backgroundSize = '400% 400%';
        }

        // Update global background for all pages
        const backgroundGradient = `linear-gradient(to bottom right, ${colors[0]}, ${colors[3]}, ${colors[4]})`;

        // Update html and body elements
        if (document.documentElement) {
            document.documentElement.style.background = `${backgroundGradient} fixed`;
        }
        if (document.body) {
            document.body.style.background = `${backgroundGradient} fixed`;
        }

        // Update body::before pseudo-element via CSS custom properties
        document.documentElement.style.setProperty('--gradient-color-1', colors[0]);
        document.documentElement.style.setProperty('--gradient-color-2', colors[3]);
        document.documentElement.style.setProperty('--gradient-color-3', colors[4]);

        // Update glowing orbs with palette colors
        this.updateGlowingOrbs(colors);
    }

    updateGlowingOrbs(colors) {
        const orbs = document.querySelectorAll('.glow-orb');
        orbs.forEach((orb, index) => {
            if (colors[index]) {
                orb.style.background = colors[index];
            }
        });
    }

    animateColorTransition() {
        // Very slow, subtle color transitions
        const animate = () => {
            if (this.nextPalette) {
                // Transition over 2 minutes for very smooth, subtle changes
                this.transitionProgress += 0.0001;
                if (this.transitionProgress >= 1) {
                    this.transitionProgress = 1;
                }
            }

            this.applyGradient();
            requestAnimationFrame(animate);
        };

        animate();
    }

    // Public method to manually set a palette (useful for testing)
    setPalette(paletteName) {
        if (this.palettes[paletteName]) {
            this.nextPalette = this.palettes[paletteName];
            this.transitionProgress = 0;
            console.log(`🎨 Manually switching to ${paletteName} palette`);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dynamicGradient = new DynamicGradient();
    });
} else {
    window.dynamicGradient = new DynamicGradient();
}
