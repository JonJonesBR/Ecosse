/**
 * Animation Controller - Task 9: Add CSS transitions and animations
 * 
 * This class manages enhanced animations, loading states, and visual feedback
 * for the UI components, providing smooth transitions and engaging user interactions.
 * 
 * Requirements addressed:
 * - 5.3: Smooth transitions for layout changes
 * - 6.2: Visual feedback during panel interactions
 * - 6.3: Smooth animations for panel state changes
 */

export class AnimationController {
    constructor() {
        this.isInitialized = false;
        this.animationQueue = [];
        this.loadingStates = new Map();
        this.transitionCallbacks = new Map();
        
        // Animation settings
        this.defaultDuration = 300;
        this.defaultEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Performance monitoring
        this.performanceMode = 'auto'; // 'auto', 'high', 'low'
        this.reducedMotion = false;
        
        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePrefersReducedMotion = this.handlePrefersReducedMotion.bind(this);
    }

    /**
     * Initialize the animation controller
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('AnimationController already initialized');
            return;
        }

        console.log('🎬 Initializing Animation Controller...');

        // Check for reduced motion preference
        this.checkReducedMotionPreference();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize enhanced button animations
        this.initializeButtonAnimations();
        
        // Initialize panel animations
        this.initializePanelAnimations();
        
        // Initialize element animations
        this.initializeElementAnimations();
        
        this.isInitialized = true;
        console.log('✅ Animation Controller initialized');
    }

    /**
     * Check for user's reduced motion preference
     */
    checkReducedMotionPreference() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.reducedMotion = mediaQuery.matches;
            
            if (this.reducedMotion) {
                console.log('🎬 Reduced motion preference detected');
                document.body.classList.add('reduced-motion');
            }
            
            // Listen for changes
            mediaQuery.addEventListener('change', this.handlePrefersReducedMotion);
        }
    }

    /**
     * Handle changes to reduced motion preference
     */
    handlePrefersReducedMotion(e) {
        this.reducedMotion = e.matches;
        
        if (this.reducedMotion) {
            document.body.classList.add('reduced-motion');
            console.log('🎬 Reduced motion enabled');
        } else {
            document.body.classList.remove('reduced-motion');
            console.log('🎬 Reduced motion disabled');
        }
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor frame rate and adjust animations accordingly
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkPerformance = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30 && this.performanceMode === 'auto') {
                    this.setPerformanceMode('low');
                } else if (fps > 50 && this.performanceMode === 'low') {
                    this.setPerformanceMode('high');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkPerformance);
        };
        
        requestAnimationFrame(checkPerformance);
    }

    /**
     * Set performance mode
     */
    setPerformanceMode(mode) {
        this.performanceMode = mode;
        document.body.classList.remove('performance-high', 'performance-low');
        
        if (mode === 'low') {
            document.body.classList.add('performance-low');
            console.log('🎬 Performance mode: LOW (reduced animations)');
        } else if (mode === 'high') {
            document.body.classList.add('performance-high');
            console.log('🎬 Performance mode: HIGH (enhanced animations)');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for visibility changes to pause animations when tab is hidden
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Listen for panel state changes
        document.addEventListener('panelStateChanged', (e) => {
            this.handlePanelStateAnimation(e.detail);
        });
        
        // Listen for layout changes
        document.addEventListener('layoutChanged', (e) => {
            this.handleLayoutChangeAnimation(e.detail);
        });
    }

    /**
     * Handle visibility change (pause animations when tab is hidden)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            document.body.classList.add('animations-paused');
        } else {
            document.body.classList.remove('animations-paused');
        }
    }

    /**
     * Initialize enhanced button animations
     */
    initializeButtonAnimations() {
        const buttons = document.querySelectorAll('.btn, .element-item, .panel-toggle-btn');
        
        buttons.forEach(button => {
            this.addRippleEffect(button);
            this.addHoverAnimation(button);
        });
    }

    /**
     * Add ripple effect to button
     */
    addRippleEffect(element) {
        element.addEventListener('click', (e) => {
            if (this.reducedMotion) return;
            
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(59, 130, 246, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1;
            `;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    /**
     * Add hover animation to element
     */
    addHoverAnimation(element) {
        if (this.reducedMotion) return;
        
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
        });
    }

    /**
     * Initialize panel animations
     */
    initializePanelAnimations() {
        const panels = document.querySelectorAll('.panel');
        
        panels.forEach(panel => {
            this.setupPanelTransitions(panel);
        });
    }

    /**
     * Set up panel transitions
     */
    setupPanelTransitions(panel) {
        // Add transition end listener
        panel.addEventListener('transitionend', (e) => {
            if (e.target === panel) {
                this.handlePanelTransitionEnd(panel, e.propertyName);
            }
        });
        
        // Add animation end listener
        panel.addEventListener('animationend', (e) => {
            if (e.target === panel) {
                this.handlePanelAnimationEnd(panel, e.animationName);
            }
        });
    }

    /**
     * Handle panel state animation
     */
    handlePanelStateAnimation(detail) {
        const { panelName, newState, previousState } = detail;
        const panel = document.getElementById(`${panelName}-panel`);
        
        if (!panel) return;
        
        console.log(`🎬 Animating ${panelName} panel: ${previousState} → ${newState}`);
        
        // Remove existing animation classes
        panel.classList.remove('expanding', 'collapsing');
        
        // Add appropriate animation class
        if (newState === 'visible' && previousState !== 'visible') {
            this.animatePanelShow(panel);
        } else if (newState === 'hidden' && previousState !== 'hidden') {
            this.animatePanelHide(panel);
        } else if (newState === 'minimized' && previousState !== 'minimized') {
            this.animatePanelMinimize(panel);
        }
    }

    /**
     * Animate panel show
     */
    animatePanelShow(panel) {
        if (this.reducedMotion) {
            panel.classList.add('panel-visible');
            return;
        }
        
        panel.classList.add('expanding');
        panel.classList.add('panel-visible');
        
        // Stagger content animation
        const content = panel.querySelectorAll('.panel-content > *');
        content.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('content-fade-in');
        });
    }

    /**
     * Animate panel hide
     */
    animatePanelHide(panel) {
        if (this.reducedMotion) {
            panel.classList.add('panel-hidden');
            return;
        }
        
        panel.classList.add('collapsing');
        
        setTimeout(() => {
            panel.classList.add('panel-hidden');
        }, this.defaultDuration);
    }

    /**
     * Animate panel minimize
     */
    animatePanelMinimize(panel) {
        if (this.reducedMotion) {
            panel.classList.add('panel-minimized');
            return;
        }
        
        panel.classList.add('panel-minimized');
        
        // Animate content fade out
        const content = panel.querySelector('.panel-content');
        if (content) {
            content.style.transition = `all ${this.defaultDuration}ms ${this.defaultEasing}`;
        }
    }

    /**
     * Handle panel transition end
     */
    handlePanelTransitionEnd(panel, propertyName) {
        if (propertyName === 'transform' || propertyName === 'opacity') {
            // Clean up animation classes
            panel.classList.remove('expanding', 'collapsing');
            
            // Trigger callback if exists
            const panelId = panel.id;
            if (this.transitionCallbacks.has(panelId)) {
                this.transitionCallbacks.get(panelId)();
                this.transitionCallbacks.delete(panelId);
            }
        }
    }

    /**
     * Handle panel animation end
     */
    handlePanelAnimationEnd(panel, animationName) {
        console.log(`🎬 Animation ended: ${animationName} on ${panel.id}`);
        
        // Clean up animation classes
        if (animationName.includes('slideIn') || animationName.includes('slideOut')) {
            panel.classList.remove('expanding', 'collapsing');
        }
    }

    /**
     * Initialize element animations
     */
    initializeElementAnimations() {
        const elementGrid = document.querySelector('.element-grid');
        if (!elementGrid) return;
        
        // Stagger element entrance animations
        const elements = elementGrid.querySelectorAll('.element-item');
        elements.forEach((element, index) => {
            if (!this.reducedMotion) {
                element.style.animationDelay = `${index * 0.05}s`;
                element.classList.add('element-entrance');
            }
        });
    }

    /**
     * Handle layout change animation
     */
    handleLayoutChangeAnimation(layoutInfo) {
        console.log('🎬 Animating layout change:', layoutInfo);
        
        if (this.reducedMotion) return;
        
        // Add layout transition class to body
        document.body.classList.add('layout-transitioning');
        
        setTimeout(() => {
            document.body.classList.remove('layout-transitioning');
        }, this.defaultDuration * 2);
    }

    /**
     * Show loading state for element
     */
    showLoadingState(elementId, message = 'Loading...') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.loadingStates.set(elementId, true);
        element.classList.add('loading');
        
        if (message && !element.querySelector('.loading-message')) {
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'loading-message';
            loadingMessage.textContent = message;
            element.appendChild(loadingMessage);
        }
        
        console.log(`🎬 Loading state shown for: ${elementId}`);
    }

    /**
     * Hide loading state for element
     */
    hideLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.loadingStates.delete(elementId);
        element.classList.remove('loading');
        
        const loadingMessage = element.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        console.log(`🎬 Loading state hidden for: ${elementId}`);
    }

    /**
     * Animate element entrance
     */
    animateElementEntrance(element, delay = 0) {
        if (this.reducedMotion) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px) scale(0.9)';
        
        setTimeout(() => {
            element.style.transition = `all ${this.defaultDuration}ms ${this.defaultEasing}`;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0) scale(1)';
        }, delay);
    }

    /**
     * Animate element exit
     */
    animateElementExit(element, callback) {
        if (this.reducedMotion) {
            if (callback) callback();
            return;
        }
        
        element.style.transition = `all ${this.defaultDuration}ms ${this.defaultEasing}`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px) scale(0.9)';
        
        setTimeout(() => {
            if (callback) callback();
        }, this.defaultDuration);
    }

    /**
     * Add transition callback
     */
    addTransitionCallback(elementId, callback) {
        this.transitionCallbacks.set(elementId, callback);
    }

    /**
     * Get animation status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            performanceMode: this.performanceMode,
            reducedMotion: this.reducedMotion,
            activeLoadingStates: Array.from(this.loadingStates.keys()),
            pendingCallbacks: Array.from(this.transitionCallbacks.keys())
        };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            mediaQuery.removeEventListener('change', this.handlePrefersReducedMotion);
        }
        
        // Clear loading states
        this.loadingStates.clear();
        this.transitionCallbacks.clear();
        this.animationQueue = [];
        
        this.isInitialized = false;
        console.log('AnimationController disposed');
    }
}

// Create and export singleton instance
export const animationController = new AnimationController();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.animationController = animationController;
    console.log('🔧 Animation Controller available globally');
}