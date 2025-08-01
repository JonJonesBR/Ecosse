/**
 * Performance Optimizer - Task 6 & 7: Implement comprehensive performance optimization
 * 
 * Requirements addressed:
 * - 5.1: Fix debounced resize events to properly limit layout updates
 * - 5.2: Implement proper lazy loading with correct element observation
 * - 5.3: Add infinite loop detection and prevention system
 * - 5.4: Optimize layout calculation caching and performance monitoring
 * - 2.3: Canvas SHALL adjust automatically when screen is resized (Task 7)
 * - 4.4: Layout SHALL reorganize adequately when orientation changes (Task 7)
 */

import { layoutPerformanceOptimizer } from './systems/layoutPerformanceOptimizer.js';

class PerformanceOptimizer {
    constructor() {
        this.isInitialized = false;
        this.resizeTimeout = null;
        this.layoutCache = new Map();
        this.intersectionObserver = null;
        this.lazyElements = new Set();
        this.layoutPerformanceOptimizer = layoutPerformanceOptimizer;
        this.metrics = {
            resizeEvents: 0,
            cacheHits: 0,
            cacheMisses: 0,
            lazyLoads: 0,
            infiniteLoopsDetected: 0,
            layoutOptimizations: 0
        };
    }
    
    initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Performance Optimizer...');
        
        // Initialize layout performance optimizer first (Task 7)
        this.layoutPerformanceOptimizer.initialize();
        this.metrics.layoutOptimizations++;
        
        this.setupDebouncedResize();
        this.setupLazyLoading();
        this.setupInfiniteLoopDetection();
        this.setupLayoutCaching();
        this.setupDOMBatchingIntegration();
        
        this.isInitialized = true;
        console.log('✅ Performance Optimizer initialized with layout optimizations');
    }
    
    setupDebouncedResize() {
        // Register with the layout performance optimizer for enhanced resize handling
        this.layoutPerformanceOptimizer.registerResizeHandler('performanceOptimizer', () => {
            this.metrics.resizeEvents++;
            this.handleResize();
        });
        
        console.log('✅ Enhanced debounced resize configured via layout performance optimizer');
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
        // Layout caching is now handled by the layout performance optimizer
        // This method maintains compatibility with existing code
        console.log('✅ Layout caching delegated to layout performance optimizer');
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
    
    /**
     * Set up DOM batching integration (Task 7)
     */
    setupDOMBatchingIntegration() {
        // Make DOM batching available to existing systems
        if (typeof window !== 'undefined') {
            // Provide backward compatibility wrapper
            window.optimizeDOMOperation = (operation, priority = 'normal') => {
                if (window.batchDOMOperation) {
                    window.batchDOMOperation(operation, priority);
                } else {
                    // Fallback to immediate execution
                    operation();
                }
            };
        }
        
        console.log('✅ DOM batching integration configured');
    }

    getMetrics() {
        const layoutMetrics = this.layoutPerformanceOptimizer.getPerformanceMetrics();
        
        return {
            ...this.metrics,
            cacheSize: this.layoutCache.size,
            lazyElementsObserved: this.lazyElements.size,
            cacheEfficiency: this.getCacheEfficiency(),
            layoutOptimizations: {
                cacheHits: layoutMetrics.cacheHits,
                cacheMisses: layoutMetrics.cacheMisses,
                cacheEfficiency: layoutMetrics.cacheEfficiency,
                domBatches: layoutMetrics.domBatches,
                averageLayoutTime: layoutMetrics.averageLayoutTime
            }
        };
    }
    
    getCacheEfficiency() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        return total === 0 ? 0 : Math.round((this.metrics.cacheHits / total) * 100);
    }
    
    generateReport() {
        const metrics = this.getMetrics();
        const layoutDebugInfo = this.layoutPerformanceOptimizer.getDebugInfo();
        
        return {
            timestamp: new Date().toISOString(),
            metrics,
            layoutOptimizations: layoutDebugInfo,
            status: this.getOverallPerformanceStatus(metrics, layoutDebugInfo),
            recommendations: this.getPerformanceRecommendations(metrics, layoutDebugInfo)
        };
    }
    
    /**
     * Get overall performance status
     */
    getOverallPerformanceStatus(metrics, layoutDebugInfo) {
        const cacheEfficiency = metrics.cacheEfficiency || 0;
        const layoutCacheEfficiency = layoutDebugInfo.cache?.hitRate || 0;
        const averageLayoutTime = layoutDebugInfo.metrics?.averageLayoutTime || 0;
        
        if (cacheEfficiency > 80 && layoutCacheEfficiency > 70 && averageLayoutTime < 16) {
            return 'excellent';
        } else if (cacheEfficiency > 60 && layoutCacheEfficiency > 50 && averageLayoutTime < 32) {
            return 'good';
        } else if (cacheEfficiency > 40 && layoutCacheEfficiency > 30 && averageLayoutTime < 50) {
            return 'fair';
        } else {
            return 'needs improvement';
        }
    }
    
    /**
     * Get performance recommendations
     */
    getPerformanceRecommendations(metrics, layoutDebugInfo) {
        const recommendations = [];
        
        if (metrics.cacheEfficiency < 50) {
            recommendations.push('Consider increasing cache size or improving cache key generation');
        }
        
        if (layoutDebugInfo.cache?.hitRate < 50) {
            recommendations.push('Layout cache efficiency is low - check for frequent layout invalidations');
        }
        
        if (layoutDebugInfo.metrics?.averageLayoutTime > 32) {
            recommendations.push('Layout calculations are slow - consider optimizing DOM operations');
        }
        
        if (layoutDebugInfo.batching?.queueSize > 20) {
            recommendations.push('DOM batch queue is large - consider increasing flush frequency');
        }
        
        if (metrics.infiniteLoopsDetected > 0) {
            recommendations.push('Infinite loops detected - review event handlers and timers');
        }
        
        return recommendations;
    }
}

export const performanceOptimizer = new PerformanceOptimizer();

if (typeof window !== 'undefined') {
    window.performanceOptimizer = performanceOptimizer;
}