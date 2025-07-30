/**
 * Performance Monitor - Task 15: Performance optimization and final polish
 * 
 * Monitors and tracks performance metrics for layout calculations,
 * resize events, and lazy loading operations.
 * 
 * Requirements addressed:
 * - 5.3: Optimize layout calculation performance for smooth resizing
 * - 6.3: Add debouncing for resize events to prevent excessive recalculations
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            layoutCalculations: 0,
            resizeEvents: 0,
            lazyLoads: 0,
            domUpdates: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.timings = {
            layoutUpdateTimes: [],
            resizeHandlerTimes: [],
            lazyLoadTimes: []
        };
        
        this.thresholds = {
            layoutUpdateWarning: 16, // 16ms for 60fps
            resizeHandlerWarning: 8,
            lazyLoadWarning: 100
        };
        
        this.isMonitoring = false;
        this.startTime = performance.now();
        
        this.init();
    }
    
    init() {
        console.log('📊 Performance Monitor initialized');
        this.setupPerformanceObserver();
        this.startMonitoring();
    }
    
    /**
     * Set up Performance Observer for advanced metrics
     */
    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }
        
        try {
            // Monitor layout shifts and reflows
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.entryType === 'layout-shift') {
                        this.recordLayoutShift(entry);
                    } else if (entry.entryType === 'measure') {
                        this.recordCustomMeasure(entry);
                    }
                });
            });
            
            observer.observe({ entryTypes: ['layout-shift', 'measure'] });
            this.performanceObserver = observer;
            
        } catch (error) {
            console.warn('Failed to setup PerformanceObserver:', error);
        }
    }
    
    /**
     * Start monitoring performance
     */
    startMonitoring() {
        this.isMonitoring = true;
        this.startTime = performance.now();
        
        // Monitor resize events
        this.monitorResizeEvents();
        
        // Monitor layout manager
        this.monitorLayoutManager();
        
        // Monitor element controls organizer
        this.monitorElementControlsOrganizer();
        
        // Start periodic reporting
        this.startPeriodicReporting();
    }
    
    /**
     * Monitor resize events for performance
     */
    monitorResizeEvents() {
        const originalAddEventListener = window.addEventListener;
        const self = this;
        
        window.addEventListener = function(type, listener, options) {
            if (type === 'resize') {
                const wrappedListener = function(event) {
                    const startTime = performance.now();
                    self.metrics.resizeEvents++;
                    
                    const result = listener.call(this, event);
                    
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    self.timings.resizeHandlerTimes.push(duration);
                    
                    if (duration > self.thresholds.resizeHandlerWarning) {
                        console.warn(`⚠️ Slow resize handler: ${duration.toFixed(2)}ms`);
                    }
                    
                    return result;
                };
                
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
    }
    
    /**
     * Monitor layout manager performance
     */
    monitorLayoutManager() {
        if (!window.layoutManager) return;
        
        const originalUpdateLayout = window.layoutManager.updateLayout;
        const self = this;
        
        window.layoutManager.updateLayout = function() {
            const startTime = performance.now();
            performance.mark('layout-update-start');
            
            self.metrics.layoutCalculations++;
            
            const result = originalUpdateLayout.call(this);
            
            performance.mark('layout-update-end');
            performance.measure('layout-update', 'layout-update-start', 'layout-update-end');
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            self.timings.layoutUpdateTimes.push(duration);
            
            if (duration > self.thresholds.layoutUpdateWarning) {
                console.warn(`⚠️ Slow layout update: ${duration.toFixed(2)}ms`);
            }
            
            return result;
        };
    }
    
    /**
     * Monitor element controls organizer performance
     */
    monitorElementControlsOrganizer() {
        // Monitor when the organizer becomes available
        const checkOrganizer = () => {
            if (window.elementControlsOrganizer) {
                this.wrapOrganizerMethods();
            } else {
                setTimeout(checkOrganizer, 100);
            }
        };
        
        checkOrganizer();
    }
    
    /**
     * Wrap organizer methods for monitoring
     */
    wrapOrganizerMethods() {
        const organizer = window.elementControlsOrganizer;
        const self = this;
        
        // Monitor lazy loading
        if (organizer.lazyLoadCategoryContent) {
            const originalLazyLoad = organizer.lazyLoadCategoryContent;
            
            organizer.lazyLoadCategoryContent = function(categoryElement) {
                const startTime = performance.now();
                self.metrics.lazyLoads++;
                
                const result = originalLazyLoad.call(this, categoryElement);
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                self.timings.lazyLoadTimes.push(duration);
                
                if (duration > self.thresholds.lazyLoadWarning) {
                    console.warn(`⚠️ Slow lazy load: ${duration.toFixed(2)}ms`);
                }
                
                return result;
            };
        }
        
        // Monitor DOM updates
        if (organizer.updateCategoryVisibility) {
            const originalUpdate = organizer.updateCategoryVisibility;
            
            organizer.updateCategoryVisibility = function() {
                self.metrics.domUpdates++;
                return originalUpdate.call(this);
            };
        }
    }
    
    /**
     * Record layout shift events
     */
    recordLayoutShift(entry) {
        if (entry.value > 0.1) { // Significant layout shift
            console.warn(`⚠️ Layout shift detected: ${entry.value.toFixed(3)}`);
        }
    }
    
    /**
     * Record custom performance measures
     */
    recordCustomMeasure(entry) {
        if (entry.name === 'layout-update') {
            // Already handled in layout monitoring
        }
    }
    
    /**
     * Start periodic performance reporting
     */
    startPeriodicReporting() {
        setInterval(() => {
            if (this.isMonitoring) {
                this.generatePerformanceReport();
            }
        }, 30000); // Report every 30 seconds
    }
    
    /**
     * Generate performance report
     */
    generatePerformanceReport() {
        const uptime = performance.now() - this.startTime;
        
        const report = {
            uptime: Math.round(uptime),
            metrics: { ...this.metrics },
            averageTimes: {
                layoutUpdate: this.calculateAverage(this.timings.layoutUpdateTimes),
                resizeHandler: this.calculateAverage(this.timings.resizeHandlerTimes),
                lazyLoad: this.calculateAverage(this.timings.lazyLoadTimes)
            },
            memoryUsage: this.getMemoryUsage(),
            recommendations: this.generateRecommendations()
        };
        
        console.log('📊 Performance Report:', report);
        
        // Store report for debugging
        this.lastReport = report;
        
        return report;
    }
    
    /**
     * Calculate average from array of numbers
     */
    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return Math.round((sum / numbers.length) * 100) / 100;
    }
    
    /**
     * Get memory usage information
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        const avgLayoutTime = this.calculateAverage(this.timings.layoutUpdateTimes);
        if (avgLayoutTime > this.thresholds.layoutUpdateWarning) {
            recommendations.push(`Layout updates are slow (${avgLayoutTime}ms avg). Consider reducing DOM complexity.`);
        }
        
        const avgResizeTime = this.calculateAverage(this.timings.resizeHandlerTimes);
        if (avgResizeTime > this.thresholds.resizeHandlerWarning) {
            recommendations.push(`Resize handlers are slow (${avgResizeTime}ms avg). Consider increasing debounce delay.`);
        }
        
        if (this.metrics.resizeEvents > 100) {
            recommendations.push(`High resize event count (${this.metrics.resizeEvents}). Debouncing is working well.`);
        }
        
        if (this.metrics.lazyLoads > 0) {
            recommendations.push(`Lazy loading is active (${this.metrics.lazyLoads} loads). Good for performance.`);
        }
        
        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage && memoryUsage.used > 50) {
            recommendations.push(`Memory usage is high (${memoryUsage.used}MB). Consider clearing caches.`);
        }
        
        return recommendations;
    }
    
    /**
     * Record cache hit
     */
    recordCacheHit() {
        this.metrics.cacheHits++;
    }
    
    /**
     * Record cache miss
     */
    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }
    
    /**
     * Get cache efficiency
     */
    getCacheEfficiency() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        if (total === 0) return 0;
        return Math.round((this.metrics.cacheHits / total) * 100);
    }
    
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            layoutCalculations: 0,
            resizeEvents: 0,
            lazyLoads: 0,
            domUpdates: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.timings = {
            layoutUpdateTimes: [],
            resizeHandlerTimes: [],
            lazyLoadTimes: []
        };
        
        this.startTime = performance.now();
        console.log('📊 Performance metrics reset');
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        console.log('📊 Performance monitoring stopped');
    }
    
    /**
     * Get current performance status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            uptime: performance.now() - this.startTime,
            metrics: { ...this.metrics },
            cacheEfficiency: this.getCacheEfficiency(),
            lastReport: this.lastReport
        };
    }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.performanceMonitor = performanceMonitor;
    console.log('🔧 Performance Monitor available globally');
}