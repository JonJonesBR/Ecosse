/**
 * Visual Indicators System
 * Provides immediate visual feedback for user actions and system events
 */

class VisualIndicators {
    constructor() {
        this.activeIndicators = new Map();
        this.indicatorTypes = {
            // Element placement indicators
            placement: {
                success: { color: '#10b981', animation: 'pulse', duration: 800 },
                error: { color: '#ef4444', animation: 'shake', duration: 600 },
                preview: { color: '#6366f1', animation: 'glow', duration: 0 } // Persistent until removed
            },
            
            // Action feedback indicators
            action: {
                boost: { color: '#f59e0b', animation: 'spark', duration: 1000 },
                heal: { color: '#10b981', animation: 'ripple', duration: 1200 },
                damage: { color: '#ef4444', animation: 'flash', duration: 800 },
                energy: { color: '#3b82f6', animation: 'flow', duration: 1000 }
            },
            
            // System event indicators
            event: {
                achievement: { color: '#8b5cf6', animation: 'burst', duration: 2000 },
                warning: { color: '#f59e0b', animation: 'pulse', duration: 1500 },
                info: { color: '#3b82f6', animation: 'fade', duration: 1000 }
            },
            
            // Interaction indicators
            interaction: {
                hover: { color: '#6366f1', animation: 'glow', duration: 0 },
                select: { color: '#10b981', animation: 'outline', duration: 0 },
                target: { color: '#f59e0b', animation: 'crosshair', duration: 0 }
            }
        };
        
        this.initialized = false;
    }

    /**
     * Initialize the visual indicators system
     */
    initialize() {
        if (this.initialized) return;
        
        this.createIndicatorStyles();
        this.createIndicatorContainer();
        this.setupCanvasOverlay();
        this.initialized = true;
        
        console.log('Visual indicators system initialized');
    }

    /**
     * Create CSS styles for indicators
     */
    createIndicatorStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .visual-indicator {
                position: absolute;
                pointer-events: none;
                z-index: 1500;
                transform-origin: center;
            }
            
            /* Pulse animation */
            .indicator-pulse {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: var(--indicator-color);
                opacity: 0.8;
                animation: indicatorPulse var(--duration, 1s) ease-out;
            }
            
            /* Ripple animation */
            .indicator-ripple {
                width: 20px;
                height: 20px;
                border: 3px solid var(--indicator-color);
                border-radius: 50%;
                animation: indicatorRipple var(--duration, 1s) ease-out;
            }
            
            /* Spark animation */
            .indicator-spark {
                width: 12px;
                height: 12px;
                background-color: var(--indicator-color);
                border-radius: 50%;
                box-shadow: 0 0 15px var(--indicator-color);
                animation: indicatorSpark var(--duration, 1s) ease-out;
            }
            
            /* Glow animation */
            .indicator-glow {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: radial-gradient(circle, var(--indicator-color) 0%, transparent 70%);
                animation: indicatorGlow var(--duration, 1s) ease-in-out infinite;
            }
            
            /* Flash animation */
            .indicator-flash {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--indicator-color);
                animation: indicatorFlash var(--duration, 1s) ease-out;
            }
            
            /* Shake animation */
            .indicator-shake {
                width: 30px;
                height: 30px;
                background-color: var(--indicator-color);
                border-radius: 4px;
                animation: indicatorShake var(--duration, 0.6s) ease-out;
            }
            
            /* Burst animation */
            .indicator-burst {
                width: 80px;
                height: 80px;
                border: 4px solid var(--indicator-color);
                border-radius: 50%;
                animation: indicatorBurst var(--duration, 2s) ease-out;
            }
            
            /* Flow animation */
            .indicator-flow {
                width: 6px;
                height: 40px;
                background: linear-gradient(to top, transparent, var(--indicator-color), transparent);
                border-radius: 3px;
                animation: indicatorFlow var(--duration, 1s) ease-out;
            }
            
            /* Fade animation */
            .indicator-fade {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background-color: var(--indicator-color);
                animation: indicatorFade var(--duration, 1s) ease-out;
            }
            
            /* Outline animation */
            .indicator-outline {
                border: 2px solid var(--indicator-color);
                border-radius: 4px;
                background: transparent;
                animation: indicatorOutline var(--duration, 1s) ease-in-out infinite;
            }
            
            /* Crosshair animation */
            .indicator-crosshair {
                width: 30px;
                height: 30px;
                position: relative;
                animation: indicatorCrosshair var(--duration, 1s) ease-in-out infinite;
            }
            
            .indicator-crosshair::before,
            .indicator-crosshair::after {
                content: '';
                position: absolute;
                background-color: var(--indicator-color);
            }
            
            .indicator-crosshair::before {
                width: 2px;
                height: 100%;
                left: 50%;
                top: 0;
                transform: translateX(-50%);
            }
            
            .indicator-crosshair::after {
                width: 100%;
                height: 2px;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
            }
            
            /* Keyframe animations */
            @keyframes indicatorPulse {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
            
            @keyframes indicatorRipple {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(3); opacity: 0; }
            }
            
            @keyframes indicatorSpark {
                0% { transform: scale(1) rotate(0deg); opacity: 1; }
                50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
                100% { transform: scale(0.3) rotate(360deg); opacity: 0; }
            }
            
            @keyframes indicatorGlow {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.2); opacity: 0.9; }
            }
            
            @keyframes indicatorFlash {
                0%, 50%, 100% { opacity: 1; }
                25%, 75% { opacity: 0.3; }
            }
            
            @keyframes indicatorShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            
            @keyframes indicatorBurst {
                0% { transform: scale(0.3); opacity: 1; border-width: 8px; }
                50% { transform: scale(1.2); opacity: 0.7; border-width: 2px; }
                100% { transform: scale(2); opacity: 0; border-width: 1px; }
            }
            
            @keyframes indicatorFlow {
                0% { transform: translateY(20px) scaleY(0.5); opacity: 0; }
                50% { transform: translateY(0) scaleY(1); opacity: 1; }
                100% { transform: translateY(-20px) scaleY(0.5); opacity: 0; }
            }
            
            @keyframes indicatorFade {
                0% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.5); }
            }
            
            @keyframes indicatorOutline {
                0%, 100% { border-width: 2px; opacity: 0.8; }
                50% { border-width: 4px; opacity: 1; }
            }
            
            @keyframes indicatorCrosshair {
                0%, 100% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.1); }
            }
            
            /* Particle effects */
            .indicator-particles {
                position: absolute;
                pointer-events: none;
            }
            
            .particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background-color: var(--particle-color);
                border-radius: 50%;
                animation: particleFloat 1.5s ease-out forwards;
            }
            
            @keyframes particleFloat {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--particle-x), var(--particle-y)) scale(0);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Create indicator container
     */
    createIndicatorContainer() {
        const container = document.createElement('div');
        container.id = 'visual-indicators-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1500;
        `;
        
        document.body.appendChild(container);
        this.container = container;
    }

    /**
     * Setup canvas overlay for 3D world indicators
     */
    setupCanvasOverlay() {
        const canvas = document.querySelector('#three-js-canvas-container canvas');
        if (canvas) {
            this.canvas = canvas;
            this.canvasRect = canvas.getBoundingClientRect();
            
            // Update canvas rect on resize
            window.addEventListener('resize', () => {
                this.canvasRect = canvas.getBoundingClientRect();
            });
        }
    }

    /**
     * Show visual indicator
     */
    show(type, subtype, x, y, options = {}) {
        const config = this.indicatorTypes[type]?.[subtype];
        if (!config) {
            console.warn(`Unknown indicator type: ${type}.${subtype}`);
            return null;
        }

        const {
            color = config.color,
            animation = config.animation,
            duration = config.duration,
            size = 1,
            data = {}
        } = { ...config, ...options };

        const indicator = document.createElement('div');
        const id = Date.now() + Math.random();
        
        indicator.className = `visual-indicator indicator-${animation}`;
        indicator.style.cssText = `
            left: ${x - (this.getIndicatorSize(animation) * size / 2)}px;
            top: ${y - (this.getIndicatorSize(animation) * size / 2)}px;
            --indicator-color: ${color};
            --duration: ${duration}ms;
            transform: scale(${size});
        `;
        
        // Add custom sizing for outline and crosshair
        if (animation === 'outline' && data.width && data.height) {
            indicator.style.width = `${data.width}px`;
            indicator.style.height = `${data.height}px`;
        }
        
        this.container.appendChild(indicator);
        this.activeIndicators.set(id, indicator);

        // Auto-remove after duration (if not persistent)
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        // Add particle effects for certain animations
        if (['burst', 'spark'].includes(animation)) {
            this.addParticleEffect(x, y, color, animation);
        }

        return id;
    }

    /**
     * Remove visual indicator
     */
    remove(id) {
        const indicator = this.activeIndicators.get(id);
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
            this.activeIndicators.delete(id);
        }
    }

    /**
     * Update indicator position (for moving elements)
     */
    updatePosition(id, x, y) {
        const indicator = this.activeIndicators.get(id);
        if (indicator) {
            const size = parseFloat(indicator.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
            const indicatorSize = this.getIndicatorSize(indicator.className.split(' ')[1].replace('indicator-', ''));
            
            indicator.style.left = `${x - (indicatorSize * size / 2)}px`;
            indicator.style.top = `${y - (indicatorSize * size / 2)}px`;
        }
    }

    /**
     * Get indicator size based on animation type
     */
    getIndicatorSize(animation) {
        const sizes = {
            pulse: 40, ripple: 20, spark: 12, glow: 60, flash: 50,
            shake: 30, burst: 80, flow: 40, fade: 35, outline: 0, crosshair: 30
        };
        return sizes[animation] || 30;
    }

    /**
     * Add particle effect
     */
    addParticleEffect(x, y, color, type) {
        const particleCount = type === 'burst' ? 12 : 6;
        const container = document.createElement('div');
        container.className = 'indicator-particles';
        container.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            --particle-color: ${color};
        `;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const particleX = Math.cos(angle) * distance;
            const particleY = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                --particle-x: ${particleX}px;
                --particle-y: ${particleY}px;
                animation-delay: ${Math.random() * 0.3}s;
            `;
            
            container.appendChild(particle);
        }

        this.container.appendChild(container);
        
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 2000);
    }

    /**
     * Show element placement preview
     */
    showPlacementPreview(x, y, elementType) {
        // Remove existing preview
        this.removePlacementPreview();
        
        const color = this.getElementColor(elementType);
        this.placementPreviewId = this.show('placement', 'preview', x, y, { color });
        
        return this.placementPreviewId;
    }

    /**
     * Remove placement preview
     */
    removePlacementPreview() {
        if (this.placementPreviewId) {
            this.remove(this.placementPreviewId);
            this.placementPreviewId = null;
        }
    }

    /**
     * Show element placement result
     */
    showPlacementResult(x, y, success, elementType) {
        const subtype = success ? 'success' : 'error';
        const color = success ? this.getElementColor(elementType) : '#ef4444';
        
        return this.show('placement', subtype, x, y, { color });
    }

    /**
     * Show action feedback
     */
    showActionFeedback(x, y, actionType, intensity = 1) {
        return this.show('action', actionType, x, y, { size: intensity });
    }

    /**
     * Show hover indicator
     */
    showHoverIndicator(x, y, width, height) {
        this.removeHoverIndicator();
        
        this.hoverIndicatorId = this.show('interaction', 'hover', x, y, {
            data: { width, height }
        });
        
        return this.hoverIndicatorId;
    }

    /**
     * Remove hover indicator
     */
    removeHoverIndicator() {
        if (this.hoverIndicatorId) {
            this.remove(this.hoverIndicatorId);
            this.hoverIndicatorId = null;
        }
    }

    /**
     * Show selection indicator
     */
    showSelectionIndicator(x, y, width, height) {
        this.removeSelectionIndicator();
        
        this.selectionIndicatorId = this.show('interaction', 'select', x, y, {
            data: { width, height }
        });
        
        return this.selectionIndicatorId;
    }

    /**
     * Remove selection indicator
     */
    removeSelectionIndicator() {
        if (this.selectionIndicatorId) {
            this.remove(this.selectionIndicatorId);
            this.selectionIndicatorId = null;
        }
    }

    /**
     * Convert 3D world position to screen position
     */
    worldToScreen(worldX, worldY, worldZ = 0) {
        // This would need to integrate with the 3D renderer
        // For now, return a simple conversion
        if (this.canvasRect) {
            return {
                x: this.canvasRect.left + (worldX / 1000) * this.canvasRect.width,
                y: this.canvasRect.top + (worldY / 1000) * this.canvasRect.height
            };
        }
        return { x: worldX, y: worldY };
    }

    /**
     * Get element color for indicators
     */
    getElementColor(elementType) {
        const colors = {
            water: '#00bfff',
            rock: '#8b7355',
            plant: '#22c55e',
            creature: '#f97316',
            sun: '#fbbf24',
            rain: '#3b82f6',
            fungus: '#a855f7',
            meteor: '#ef4444',
            volcano: '#dc2626',
            predator: '#7c2d12',
            tribe: '#92400e'
        };
        
        return colors[elementType] || '#6366f1';
    }

    /**
     * Clear all indicators
     */
    clearAll() {
        this.activeIndicators.forEach((indicator, id) => {
            this.remove(id);
        });
    }

    /**
     * Show system event indicator
     */
    showSystemEvent(type, x, y, message) {
        const id = this.show('event', type, x, y);
        
        // Also show a notification if feedback system is available
        if (window.feedbackSystem) {
            window.feedbackSystem.showNotification({
                type: type === 'achievement' ? 'achievement' : type,
                title: type.charAt(0).toUpperCase() + type.slice(1),
                message,
                duration: 3000
            });
        }
        
        return id;
    }
}

// Create and export singleton instance
export const visualIndicators = new VisualIndicators();
export default visualIndicators;