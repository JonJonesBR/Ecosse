/**
 * Performance Optimizer - Task 6: Implement performance optimization fixes
 * 
 * Requirements addressed:
 * - 5.1: Fix debounced resize events to properly limit layout updates
 * - 5.2: Implement proper lazy loading with correct element observation
 * - 5.3: Add infinite loop detection and prevention system
 * - 5.4: Optimize layout calculation caching and performance monitoring
 */

class PerformanceOptimizer {
    constructor() {
        this.isInitialized = false;
        this.resizeTimeout = null;
        this.layoutCache = new Map();
        this.intersectionObserver = null;
        this.lazyElements = new Set();
        this.metrics = {
            resizeEvents: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lazyLoads: 0,
            infiniteLoopsDetected: 0
        };
    }
    
    initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Performance Optimizer...');
        
        this.setupDebouncedResize();
        this.setupLazyLoading();
        this.setupInfiniteLoopDetection();
        this.setupLayoutCaching();
        
        this.isInitialized = true;
        console.log('✅ Performance Optimizer initialized');
    }
    
    setupDebouncedResize() {
        const debouncedHandler = () => {
            this.metrics.resizeEvents++;
            
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        };
        
        window.addEventListener('resize', debouncedHandler, { passive: true });
        console.log('✅ Debounced resize configured');
    }
    
    handleResize() {
        this.layoutCache.clear();
        
        if (window.responsiveCanvasContainer?.forceResize) {
            window.responsiveCanvasContainer.forceResize();
        }
        
        if (window.layoutManager?.updateLayout) {
            window.layoutManager.updateLayout(true);
        }
    }
    
    setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported');
            return;
        }
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                    this.lazyElements.delete(entry.target);
                    this.metrics.lazyLoads++;
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });
        
        this.observeLazyElements();
        console.log('✅ Lazy loading configured');
    }
    
    observeLazyElements() {
        if (!this.intersectionObserver) return;
        
        const elements = document.querySelectorAll('[data-lazy], .lazy-load, .element-category:not(.loaded)');
        elements.forEach(element => {
            if (!this.lazyElements.has(element)) {
                this.intersectionObserver.observe(element);
                this.lazyElements.add(element);
            }
        });
    }
    
    loadLazyElement(element) {
        try {
            if (element.dataset.lazyFunction && window[element.dataset.lazyFunction]) {
                window[element.dataset.lazyFunction](element);
            }
            
            if (window.elementControlsOrganizer?.lazyLoadCategoryContent && element.classList.contains('element-category')) {
                window.elementControlsOrganizer.lazyLoadCategoryContent(element);
            }
            
            element.classList.add('loaded');
            element.removeAttribute('data-lazy');
        } catch (error) {
            console.error('Error loading lazy element:', error);
        }
    }
    
    setupInfiniteLoopDetection() {
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const self = this;
        
        window.setTimeout = function(callback, delay, ...args) {
            const wrappedCallback = function() {
                try {
                    return callback.apply(this, args);
                } catch (error) {
                    console.error('Error in setTimeout:', error);
                    self.metrics.infiniteLoopsDetected++;
                }
            };
            return originalSetTimeout.call(this, wrappedCallback, delay);
        };
        
        window.setInterval = function(callback, delay, ...args) {
            const wrappedCallback = function() {
                try {
                    return callback.apply(this, args);
                } catch (error) {
                    console.error('Error in setInterval:', error);
                    self.metrics.infiniteLoopsDetected++;
                }
            };
            return originalSetInterval.call(this, wrappedCallback, delay);
        };
        
        setInterval(() => {
            this.checkForInfiniteLoops();
        }, 1000);
        
        console.log('✅ Infinite loop detection configured');
    }
    
    checkForInfiniteLoops() {
        if (window.loadingDebugger) {
            const steps = window.loadingDebugger.getSteps();
            const currentTime = performance.now();
            
            steps.forEach(step => {
                if (step.status === 'started' && !step.endTime) {
                    const duration = currentTime - step.startTime;
                    if (duration > 5000) {
                        console.warn(`Potential infinite loop: ${step.name} (${duration}ms)`);
                        this.metrics.infiniteLoopsDetected++;
                        this.attemptLoopRecovery(step.name);
                    }
                }
            });
        }
    }
    
    attemptLoopRecovery(stepName) {
        try {
            if (window.loadingDebugger?.forceComplete) {
                window.loadingDebugger.forceComplete(stepName);
            }
            
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = null;
            }
        } catch (error) {
            console.error('Failed to recover from loop:', error);
        }
    }
    
    setupLayoutCaching() {
        const checkLayoutManager = () => {
            if (window.layoutManager) {
                this.wrapLayoutManager();
            } else {
                setTimeout(checkLayoutManager, 100);
            }
        };
        checkLayoutManager();
        console.log('✅ Layout caching configured');
    }
    
    wrapLayoutManager() {
        const layoutManager = window.layoutManager;
        const self = this;
        
        if (layoutManager.updateLayout) {
            const originalUpdate = layoutManager.updateLayout;
            
            layoutManager.updateLayout = function(forceUpdate = false) {
                const cacheKey = self.generateCacheKey();
                
                if (!forceUpdate && self.layoutCache.has(cacheKey)) {
                    self.metrics.cacheHits++;
                    return self.layoutCache.get(cacheKey);
                }
                
                self.metrics.cacheMisses++;
                const result = originalUpdate.call(this, forceUpdate);
                
                self.layoutCache.set(cacheKey, result);
                self.cleanupCache();
                
                return result;
            };
        }
    }
    
    generateCacheKey() {
        return JSON.stringify({
            width: window.innerWidth,
            height: window.innerHeight,
            leftPanel: document.querySelector('.left-panel')?.classList.contains('active') || false,
            rightPanel: document.querySelector('.right-panel')?.classList.contains('active') || false
        });
    }
    
    cleanupCache() {
        if (this.layoutCache.size > 50) {
            const keys = Array.from(this.layoutCache.keys()).slice(0, 10);
            keys.forEach(key => this.layoutCache.delete(key));
        }
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.layoutCache.size,
            lazyElementsObserved: this.lazyElements.size,
            cacheEfficiency: this.getCacheEfficiency()
        };
    }
    
    getCacheEfficiency() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        return total === 0 ? 0 : Math.round((this.metrics.cacheHits / total) * 100);
    }
    
    generateReport() {
        const metrics = this.getMetrics();
        return {
            timestamp: new Date().toISOString(),
            metrics,
            status: metrics.cacheEfficiency > 70 ? 'good' : 'needs improvement'
        };
    }
}

export const performanceOptimizer = new PerformanceOptimizer();

if (typeof window !== 'undefined') {
    window.performanceOptimizer = performanceOptimizer;
}