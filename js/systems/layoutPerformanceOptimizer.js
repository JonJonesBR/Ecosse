/**
 * Layout Performance Optimizer - Task 7: Optimize layout performance
 * 
 * This system implements advanced performance optimizations for layout operations:
 * - Debounced resize handling with intelligent throttling
 * - Layout calculation caching with smart invalidation
 * - Optimized DOM manipulation batching with priority queuing
 * 
 * Requirements addressed:
 * - 2.3: Canvas SHALL adjust automatically when screen is resized
 * - 4.4: Layout SHALL reorganize adequately when orientation changes
 * - 5.1: System SHALL apply fallbacks automatically when layout errors occur
 */

class LayoutPerformanceOptimizer {
    constructor() {
        this.isInitialized = false;
        
        // Debounced resize handling
        this.resizeHandlers = new Map();
        this.resizeTimeouts = new Map();
        this.lastResizeTime = 0;
        this.resizeThrottleInterval = 16; // ~60fps
        
        // Layout calculation caching
        this.layoutCache = new Map();
        this.cacheMaxSize = 100;
        this.cacheHitCount = 0;
        this.cacheMissCount = 0;
        
        // DOM manipulation batching
        this.domBatchQueue = [];
        this.highPriorityQueue = [];
        this.isProcessingBatch = false;
        this.batchTimeout = null;
        this.maxBatchSize = 50;
        
        // Performance metrics
        this.metrics = {
            resizeEvents: 0,
            layoutCalculations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            domBatches: 0,
            averageLayoutTime: 0,
            totalLayoutTime: 0
        };
        
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.processDOMBatch = this.processDOMBatch.bind(this);
    }
    
    /**
     * Initialize the performance optimizer
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Layout Performance Optimizer already initialized');
            return;
        }
        
        console.log('🚀 Initializing Layout Performance Optimizer...');
        
        this.setupDebouncedResizeHandling();
        this.setupLayoutCaching();
        this.setupDOMBatching();
        this.setupPerformanceMonitoring();
        
        this.isInitialized = true;
        console.log('✅ Layout Performance Optimizer initialized');
    }
    
    /**
     * Set up advanced debounced resize handling
     */
    setupDebouncedResizeHandling() {
        // Enhanced resize handler with intelligent throttling
        const optimizedResizeHandler = (event) => {
            const now = performance.now();
            this.metrics.resizeEvents++;
            
            // Throttle rapid resize events using requestAnimationFrame
            if (now - this.lastResizeTime < this.resizeThrottleInterval) {
                // Cancel previous frame request if exists
                if (this.resizeRAF) {
                    cancelAnimationFrame(this.resizeRAF);
                }
                
                // Schedule for next frame
                this.resizeRAF = requestAnimationFrame(() => {
                    this.handleResize(event);
                });
                return;
            }
            
            this.lastResizeTime = now;
            this.handleResize(event);
        };
        
        // Use passive listener for better performance
        window.addEventListener('resize', optimizedResizeHandler, { 
            passive: true,
            capture: false 
        });
        
        // Handle orientation changes separately with longer debounce
        window.addEventListener('orientationchange', () => {
            // Orientation changes need longer delay to complete
            setTimeout(() => {
                this.handleResize({ type: 'orientationchange' });
            }, 300);
        }, { passive: true });
        
        console.log('✅ Enhanced debounced resize handling configured');
    }
    
    /**
     * Handle resize events with intelligent debouncing
     */
    handleResize(event) {
        const resizeType = event?.type || 'resize';
        const debounceTime = resizeType === 'orientationchange' ? 200 : 100;
        
        // Clear existing timeout for this resize type
        if (this.resizeTimeouts.has(resizeType)) {
            clearTimeout(this.resizeTimeouts.get(resizeType));
        }
        
        // Set new debounced timeout
        const timeout = setTimeout(() => {
            this.executeResizeHandlers(resizeType);
            this.resizeTimeouts.delete(resizeType);
        }, debounceTime);
        
        this.resizeTimeouts.set(resizeType, timeout);
    }
    
    /**
     * Execute registered resize handlers
     */
    executeResizeHandlers(resizeType) {
        const startTime = performance.now();
        
        try {
            // Invalidate layout cache on resize
            this.invalidateLayoutCache();
            
            // Execute layout manager resize if available
            if (window.layoutManager?.updateViewportSize) {
                window.layoutManager.updateViewportSize();
            }
            
            // Execute responsive canvas container resize if available
            if (window.responsiveCanvasContainer?.forceResize) {
                window.responsiveCanvasContainer.forceResize();
            }
            
            // Execute core layout system resize if available
            if (window.coreLayoutSystem?.forceUpdate) {
                window.coreLayoutSystem.forceUpdate();
            }
            
            // Execute custom resize handlers
            this.resizeHandlers.forEach((handler, name) => {
                try {
                    handler(resizeType);
                } catch (error) {
                    console.warn(`⚠️ Resize handler '${name}' failed:`, error);
                }
            });
            
        } catch (error) {
            console.error('❌ Error executing resize handlers:', error);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`🔄 Resize handled (${resizeType}): ${duration.toFixed(2)}ms`);
        
        // Update performance metrics
        this.updateLayoutTimeMetrics(duration);
    }
    
    /**
     * Register a custom resize handler
     */
    registerResizeHandler(name, handler) {
        if (typeof handler !== 'function') {
            console.warn('⚠️ Resize handler must be a function');
            return;
        }
        
        this.resizeHandlers.set(name, handler);
        console.log(`✅ Resize handler '${name}' registered`);
    }
    
    /**
     * Unregister a resize handler
     */
    unregisterResizeHandler(name) {
        if (this.resizeHandlers.delete(name)) {
            console.log(`✅ Resize handler '${name}' unregistered`);
        }
    }
    
    /**
     * Set up layout calculation caching
     */
    setupLayoutCaching() {
        // Wrap layout manager's updateLayout method if available
        if (window.layoutManager?.updateLayout) {
            this.wrapLayoutManagerWithCaching();
        } else {
            // Wait for layout manager to be available
            const checkLayoutManager = () => {
                if (window.layoutManager?.updateLayout) {
                    this.wrapLayoutManagerWithCaching();
                } else {
                    setTimeout(checkLayoutManager, 100);
                }
            };
            checkLayoutManager();
        }
        
        console.log('✅ Layout calculation caching configured');
    }
    
    /**
     * Wrap layout manager with caching functionality
     */
    wrapLayoutManagerWithCaching() {
        const layoutManager = window.layoutManager;
        const originalUpdateLayout = layoutManager.updateLayout.bind(layoutManager);
        
        layoutManager.updateLayout = (forceUpdate = false) => {
            const startTime = performance.now();
            
            // Generate cache key based on current layout state
            const cacheKey = this.generateLayoutCacheKey();
            
            // Check cache if not forcing update
            if (!forceUpdate && this.layoutCache.has(cacheKey)) {
                this.cacheHitCount++;
                this.metrics.cacheHits++;
                
                const cachedResult = this.layoutCache.get(cacheKey);
                console.log('💾 Layout cache hit:', cacheKey);
                return cachedResult;
            }
            
            // Cache miss - perform actual layout calculation
            this.cacheMissCount++;
            this.metrics.cacheMisses++;
            this.metrics.layoutCalculations++;
            
            const result = originalUpdateLayout(forceUpdate);
            
            // Cache the result
            this.layoutCache.set(cacheKey, result);
            this.cleanupLayoutCache();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`🧮 Layout calculated and cached: ${duration.toFixed(2)}ms`);
            this.updateLayoutTimeMetrics(duration);
            
            return result;
        };
        
        console.log('✅ Layout manager wrapped with caching');
    }
    
    /**
     * Generate cache key for current layout state
     */
    generateLayoutCacheKey() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            orientation: window.screen?.orientation?.angle || 0
        };
        
        const panelStates = {};
        if (window.layoutManager?.panelStates) {
            panelStates = { ...window.layoutManager.panelStates };
        }
        
        // Include panel visibility states
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        const uiState = {
            leftPanelActive: leftPanel?.classList.contains('active') || false,
            rightPanelActive: rightPanel?.classList.contains('active') || false,
            devicePixelRatio: window.devicePixelRatio || 1
        };
        
        return JSON.stringify({
            viewport,
            panelStates,
            uiState,
            timestamp: Math.floor(Date.now() / 1000) // Round to seconds for cache efficiency
        });
    }
    
    /**
     * Invalidate layout cache
     */
    invalidateLayoutCache() {
        const cacheSize = this.layoutCache.size;
        this.layoutCache.clear();
        
        if (cacheSize > 0) {
            console.log(`🗑️ Layout cache invalidated (${cacheSize} entries cleared)`);
        }
    }
    
    /**
     * Clean up layout cache to prevent memory leaks
     */
    cleanupLayoutCache() {
        if (this.layoutCache.size > this.cacheMaxSize) {
            // Remove oldest entries (LRU-style cleanup)
            const entries = Array.from(this.layoutCache.entries());
            const entriesToRemove = entries.slice(0, Math.floor(this.cacheMaxSize * 0.3));
            
            entriesToRemove.forEach(([key]) => {
                this.layoutCache.delete(key);
            });
            
            console.log(`🧹 Layout cache cleaned up (removed ${entriesToRemove.length} entries)`);
        }
    }
    
    /**
     * Set up DOM manipulation batching
     */
    setupDOMBatching() {
        // Create global DOM batching functions
        window.batchDOMOperation = (operation, priority = 'normal') => {
            this.addToBatch(operation, priority);
        };
        
        window.flushDOMBatch = () => {
            this.flushBatch();
        };
        
        // Auto-flush batch periodically
        setInterval(() => {
            if (this.domBatchQueue.length > 0 || this.highPriorityQueue.length > 0) {
                this.flushBatch();
            }
        }, 50); // Flush every 50ms if there are pending operations
        
        console.log('✅ DOM manipulation batching configured');
    }
    
    /**
     * Add operation to DOM batch queue
     */
    addToBatch(operation, priority = 'normal') {
        if (typeof operation !== 'function') {
            console.warn('⚠️ DOM operation must be a function');
            return;
        }
        
        const batchItem = {
            operation,
            priority,
            timestamp: performance.now()
        };
        
        if (priority === 'high') {
            this.highPriorityQueue.push(batchItem);
        } else {
            this.domBatchQueue.push(batchItem);
        }
        
        // Auto-flush if batch is getting large
        if (this.getTotalBatchSize() >= this.maxBatchSize) {
            this.flushBatch();
        }
        
        // Schedule flush if not already scheduled
        if (!this.batchTimeout) {
            this.batchTimeout = setTimeout(() => {
                this.flushBatch();
            }, 16); // Flush within one frame
        }
    }
    
    /**
     * Get total batch size
     */
    getTotalBatchSize() {
        return this.domBatchQueue.length + this.highPriorityQueue.length;
    }
    
    /**
     * Flush DOM batch queue
     */
    flushBatch() {
        if (this.isProcessingBatch) {
            return; // Already processing
        }
        
        if (this.getTotalBatchSize() === 0) {
            return; // Nothing to process
        }
        
        this.isProcessingBatch = true;
        
        // Clear timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        
        // Use requestAnimationFrame for optimal timing
        requestAnimationFrame(() => {
            this.processDOMBatch();
        });
    }
    
    /**
     * Process DOM batch operations
     */
    processDOMBatch() {
        const startTime = performance.now();
        let operationsExecuted = 0;
        
        try {
            // Process high priority operations first
            while (this.highPriorityQueue.length > 0) {
                const batchItem = this.highPriorityQueue.shift();
                try {
                    batchItem.operation();
                    operationsExecuted++;
                } catch (error) {
                    console.warn('⚠️ High priority DOM operation failed:', error);
                }
            }
            
            // Process normal priority operations
            while (this.domBatchQueue.length > 0) {
                const batchItem = this.domBatchQueue.shift();
                try {
                    batchItem.operation();
                    operationsExecuted++;
                } catch (error) {
                    console.warn('⚠️ DOM operation failed:', error);
                }
            }
            
        } catch (error) {
            console.error('❌ Error processing DOM batch:', error);
        } finally {
            this.isProcessingBatch = false;
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.metrics.domBatches++;
            
            if (operationsExecuted > 0) {
                console.log(`⚡ DOM batch processed: ${operationsExecuted} operations in ${duration.toFixed(2)}ms`);
            }
        }
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor layout performance
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name.includes('layout') || entry.name.includes('resize')) {
                    this.updateLayoutTimeMetrics(entry.duration);
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['measure'] });
        } catch (error) {
            console.warn('⚠️ Performance observer not supported:', error);
        }
        
        // Periodic performance reporting
        setInterval(() => {
            this.reportPerformanceMetrics();
        }, 30000); // Report every 30 seconds
        
        console.log('✅ Performance monitoring configured');
    }
    
    /**
     * Update layout time metrics
     */
    updateLayoutTimeMetrics(duration) {
        this.metrics.totalLayoutTime += duration;
        this.metrics.averageLayoutTime = this.metrics.totalLayoutTime / Math.max(this.metrics.layoutCalculations, 1);
    }
    
    /**
     * Report performance metrics
     */
    reportPerformanceMetrics() {
        const cacheEfficiency = this.getCacheEfficiency();
        const metrics = this.getPerformanceMetrics();
        
        if (metrics.resizeEvents > 0 || metrics.layoutCalculations > 0) {
            console.log('📊 Layout Performance Metrics:', {
                resizeEvents: metrics.resizeEvents,
                layoutCalculations: metrics.layoutCalculations,
                cacheEfficiency: `${cacheEfficiency}%`,
                averageLayoutTime: `${metrics.averageLayoutTime.toFixed(2)}ms`,
                domBatches: metrics.domBatches,
                cacheSize: this.layoutCache.size
            });
        }
    }
    
    /**
     * Get cache efficiency percentage
     */
    getCacheEfficiency() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        return total === 0 ? 0 : Math.round((this.metrics.cacheHits / total) * 100);
    }
    
    /**
     * Get comprehensive performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.layoutCache.size,
            cacheEfficiency: this.getCacheEfficiency(),
            batchQueueSize: this.getTotalBatchSize(),
            isProcessingBatch: this.isProcessingBatch,
            registeredResizeHandlers: this.resizeHandlers.size
        };
    }
    
    /**
     * Force cache invalidation and cleanup
     */
    optimizeCache() {
        const oldSize = this.layoutCache.size;
        this.cleanupLayoutCache();
        const newSize = this.layoutCache.size;
        
        console.log(`🧹 Cache optimized: ${oldSize} → ${newSize} entries`);
        
        return {
            before: oldSize,
            after: newSize,
            freed: oldSize - newSize
        };
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            metrics: this.getPerformanceMetrics(),
            cache: {
                size: this.layoutCache.size,
                maxSize: this.cacheMaxSize,
                hitRate: this.getCacheEfficiency()
            },
            batching: {
                queueSize: this.getTotalBatchSize(),
                isProcessing: this.isProcessingBatch,
                maxBatchSize: this.maxBatchSize
            },
            resizeHandlers: Array.from(this.resizeHandlers.keys())
        };
    }
    
    /**
     * Dispose of resources and cleanup
     */
    dispose() {
        // Clear timeouts
        this.resizeTimeouts.forEach(timeout => clearTimeout(timeout));
        this.resizeTimeouts.clear();
        
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        if (this.resizeRAF) {
            cancelAnimationFrame(this.resizeRAF);
        }
        
        // Clear caches and queues
        this.layoutCache.clear();
        this.domBatchQueue.length = 0;
        this.highPriorityQueue.length = 0;
        this.resizeHandlers.clear();
        
        // Remove global functions
        if (typeof window !== 'undefined') {
            delete window.batchDOMOperation;
            delete window.flushDOMBatch;
        }
        
        this.isInitialized = false;
        console.log('🧹 Layout Performance Optimizer disposed');
    }
}

// Create and export singleton instance
export const layoutPerformanceOptimizer = new LayoutPerformanceOptimizer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.layoutPerformanceOptimizer = layoutPerformanceOptimizer;
    console.log('🔧 Layout Performance Optimizer available globally');
}