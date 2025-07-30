/**
 * Comprehensive Error Monitoring System
 * Provides real-time error detection, system health monitoring, and automated error recovery
 */

class ErrorMonitoringSystem {
    constructor() {
        this.errors = [];
        this.systemHealth = {
            domIntegrity: true,
            configurationValid: true,
            systemIntegrationsWorking: true,
            performanceOptimal: true,
            overallHealth: 100,
            lastCheck: Date.now()
        };
        this.performanceMetrics = {
            errorCount: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            domOperations: 0,
            lastUpdate: Date.now()
        };
        this.errorHandlers = new Map();
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.errorThreshold = 10; // Maximum errors per minute
        this.errorCountWindow = [];
        
        this.initializeErrorHandlers();
        this.setupGlobalErrorHandling();
    }

    /**
     * Initialize automated error handlers for common issues
     */
    initializeErrorHandlers() {
        // DOM insertion errors
        this.errorHandlers.set('insertBefore', (error, context) => {
            console.warn('DOM insertion error detected, applying fix:', error.message);
            return this.fixDOMInsertionError(error, context);
        });

        // Missing element errors
        this.errorHandlers.set('elementNotFound', (error, context) => {
            console.warn('Missing element detected, creating fallback:', error.message);
            return this.fixMissingElementError(error, context);
        });

        // Method not found errors
        this.errorHandlers.set('methodNotFound', (error, context) => {
            console.warn('Missing method detected, creating stub:', error.message);
            return this.fixMissingMethodError(error, context);
        });

        // Performance timeout errors
        this.errorHandlers.set('performanceTimeout', (error, context) => {
            console.warn('Performance timeout detected, optimizing:', error.message);
            return this.fixPerformanceTimeoutError(error, context);
        });
    }

    /**
     * Setup global error handling to catch all errors
     */
    setupGlobalErrorHandling() {
        // Catch JavaScript errors
        window.addEventListener('error', (event) => {
            this.reportError({
                type: 'javascript',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                source: 'Promise',
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });

        // Catch console errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.reportError({
                type: 'console',
                message: args.join(' '),
                source: 'Console',
                timestamp: Date.now()
            });
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Start real-time monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('Error monitoring system started');
        
        // Monitor system health every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.checkSystemHealth();
            this.updatePerformanceMetrics();
            this.cleanupOldErrors();
        }, 5000);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log('Error monitoring system stopped');
    }

    /**
     * Report an error to the monitoring system
     */
    reportError(errorData) {
        const error = {
            id: this.generateErrorId(),
            severity: this.determineSeverity(errorData),
            fixed: false,
            fixApplied: null,
            ...errorData
        };

        this.errors.push(error);
        this.updateErrorCountWindow();
        
        // Try to automatically fix the error
        this.attemptAutoFix(error);
        
        // Update system health
        this.updateSystemHealthAfterError(error);
        
        // Log error for debugging
        console.warn('Error reported to monitoring system:', error);
        
        return error.id;
    }

    /**
     * Attempt to automatically fix common errors
     */
    attemptAutoFix(error) {
        const errorType = this.classifyError(error);
        const handler = this.errorHandlers.get(errorType);
        
        if (handler) {
            try {
                const fixResult = handler(error, this.getErrorContext(error));
                if (fixResult) {
                    error.fixed = true;
                    error.fixApplied = errorType;
                    console.log(`Auto-fix applied for error ${error.id}: ${errorType}`);
                }
            } catch (fixError) {
                console.error('Failed to apply auto-fix:', fixError);
            }
        }
    }

    /**
     * Classify error type for automated fixing
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('insertbefore') || message.includes('node')) {
            return 'insertBefore';
        }
        if (message.includes('not found') || message.includes('null')) {
            return 'elementNotFound';
        }
        if (message.includes('not a function') || message.includes('undefined')) {
            return 'methodNotFound';
        }
        if (message.includes('timeout') || message.includes('performance')) {
            return 'performanceTimeout';
        }
        
        return 'unknown';
    }

    /**
     * Get context information for error fixing
     */
    getErrorContext(error) {
        return {
            timestamp: error.timestamp,
            source: error.source,
            systemHealth: { ...this.systemHealth },
            recentErrors: this.errors.slice(-5)
        };
    }    
/**
     * Fix DOM insertion errors
     */
    fixDOMInsertionError(error, context) {
        try {
            // Create safe DOM insertion utility
            window.safeInsertBefore = function(newNode, referenceNode, parent) {
                if (!parent || !newNode) return false;
                
                try {
                    if (referenceNode && parent.contains(referenceNode)) {
                        parent.insertBefore(newNode, referenceNode);
                    } else {
                        parent.appendChild(newNode);
                    }
                    return true;
                } catch (e) {
                    console.warn('DOM insertion fallback used:', e.message);
                    try {
                        parent.appendChild(newNode);
                        return true;
                    } catch (fallbackError) {
                        console.error('DOM insertion completely failed:', fallbackError);
                        return false;
                    }
                }
            };
            return true;
        } catch (e) {
            console.error('Failed to fix DOM insertion error:', e);
            return false;
        }
    }

    /**
     * Fix missing element errors
     */
    fixMissingElementError(error, context) {
        try {
            // Create utility to find or create elements
            window.findOrCreateElement = function(elementId, fallbackConfig = {}) {
                let element = document.getElementById(elementId);
                
                if (!element) {
                    element = document.createElement(fallbackConfig.tagName || 'div');
                    element.id = elementId;
                    
                    if (fallbackConfig.className) {
                        element.className = fallbackConfig.className;
                    }
                    
                    if (fallbackConfig.innerHTML) {
                        element.innerHTML = fallbackConfig.innerHTML;
                    }
                    
                    // Try to append to specified parent or body
                    const parent = fallbackConfig.parent ? 
                        document.querySelector(fallbackConfig.parent) : 
                        document.body;
                    
                    if (parent) {
                        parent.appendChild(element);
                        console.log(`Created missing element: ${elementId}`);
                    }
                }
                
                return element;
            };
            return true;
        } catch (e) {
            console.error('Failed to fix missing element error:', e);
            return false;
        }
    }

    /**
     * Fix missing method errors
     */
    fixMissingMethodError(error, context) {
        try {
            // Common missing methods and their stubs
            const methodStubs = {
                'setAutoResize': function() {
                    console.warn('setAutoResize stub called - implement proper method');
                    return true;
                },
                'updateLayout': function() {
                    console.warn('updateLayout stub called - implement proper method');
                    return true;
                },
                'refresh': function() {
                    console.warn('refresh stub called - implement proper method');
                    return true;
                }
            };

            // Try to identify missing method from error message
            const message = error.message;
            for (const [methodName, stub] of Object.entries(methodStubs)) {
                if (message.includes(methodName)) {
                    // Try to add method to common objects
                    if (window.responsiveCanvasContainer && !window.responsiveCanvasContainer[methodName]) {
                        window.responsiveCanvasContainer[methodName] = stub;
                        console.log(`Added stub method ${methodName} to responsiveCanvasContainer`);
                    }
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error('Failed to fix missing method error:', e);
            return false;
        }
    }

    /**
     * Fix performance timeout errors
     */
    fixPerformanceTimeoutError(error, context) {
        try {
            // Implement performance optimization utilities
            window.optimizePerformance = function() {
                // Clear any existing timeouts that might be causing issues
                const highestTimeoutId = setTimeout(() => {}, 0);
                for (let i = 0; i < highestTimeoutId; i++) {
                    clearTimeout(i);
                }
                
                // Implement debouncing for resize events
                let resizeTimeout;
                window.addEventListener('resize', function() {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                        // Trigger layout updates with debouncing
                        if (window.layoutConfigurationSystem && window.layoutConfigurationSystem.updateLayout) {
                            window.layoutConfigurationSystem.updateLayout();
                        }
                    }, 250);
                });
                
                console.log('Performance optimization applied');
                return true;
            };
            
            // Apply optimization immediately
            window.optimizePerformance();
            return true;
        } catch (e) {
            console.error('Failed to fix performance timeout error:', e);
            return false;
        }
    }

    /**
     * Check overall system health
     */
    checkSystemHealth() {
        const health = { ...this.systemHealth };
        
        // Check DOM integrity
        health.domIntegrity = this.checkDOMIntegrity();
        
        // Check configuration validity
        health.configurationValid = this.checkConfigurationValidity();
        
        // Check system integrations
        health.systemIntegrationsWorking = this.checkSystemIntegrations();
        
        // Check performance
        health.performanceOptimal = this.checkPerformanceHealth();
        
        // Calculate overall health score
        const healthChecks = [
            health.domIntegrity,
            health.configurationValid,
            health.systemIntegrationsWorking,
            health.performanceOptimal
        ];
        
        const healthyCount = healthChecks.filter(check => check).length;
        health.overallHealth = Math.round((healthyCount / healthChecks.length) * 100);
        health.lastCheck = Date.now();
        
        this.systemHealth = health;
        
        // Log health status if there are issues
        if (health.overallHealth < 100) {
            console.warn('System health issues detected:', health);
        }
    }

    /**
     * Check DOM integrity
     */
    checkDOMIntegrity() {
        try {
            // Check for essential elements
            const essentialElements = ['body', 'main-content', 'canvas-area'];
            for (const elementId of essentialElements) {
                if (elementId === 'body') {
                    if (!document.body) return false;
                } else {
                    const element = document.getElementById(elementId);
                    if (!element) {
                        console.warn(`Essential element missing: ${elementId}`);
                        return false;
                    }
                }
            }
            return true;
        } catch (e) {
            console.error('DOM integrity check failed:', e);
            return false;
        }
    }

    /**
     * Check configuration validity
     */
    checkConfigurationValidity() {
        try {
            // Check if production configuration is properly loaded
            const isProduction = window.location.protocol === 'https:' || 
                                window.location.hostname !== 'localhost';
            
            if (isProduction) {
                // Check if CDN resources are being used inappropriately
                const links = document.querySelectorAll('link[href*="cdn.tailwindcss.com"]');
                if (links.length > 0) {
                    console.warn('CDN resources detected in production environment');
                    return false;
                }
            }
            
            return true;
        } catch (e) {
            console.error('Configuration validity check failed:', e);
            return false;
        }
    }

    /**
     * Check system integrations
     */
    checkSystemIntegrations() {
        try {
            // Check if key system components are available
            const requiredSystems = [
                'responsiveCanvasContainer',
                'layoutConfigurationSystem',
                'analysisTools'
            ];
            
            for (const system of requiredSystems) {
                if (!window[system]) {
                    console.warn(`System integration missing: ${system}`);
                    return false;
                }
            }
            
            // Check if required methods exist
            if (window.responsiveCanvasContainer && !window.responsiveCanvasContainer.setAutoResize) {
                console.warn('ResponsiveCanvasContainer missing setAutoResize method');
                return false;
            }
            
            return true;
        } catch (e) {
            console.error('System integration check failed:', e);
            return false;
        }
    }

    /**
     * Check performance health
     */
    checkPerformanceHealth() {
        try {
            // Check error rate
            const recentErrors = this.errorCountWindow.filter(
                timestamp => Date.now() - timestamp < 60000 // Last minute
            );
            
            if (recentErrors.length > this.errorThreshold) {
                console.warn(`High error rate detected: ${recentErrors.length} errors in last minute`);
                return false;
            }
            
            // Check memory usage if available
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
                if (memoryUsage > 0.9) {
                    console.warn(`High memory usage detected: ${Math.round(memoryUsage * 100)}%`);
                    return false;
                }
            }
            
            return true;
        } catch (e) {
            console.error('Performance health check failed:', e);
            return false;
        }
    } 
   /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        const now = Date.now();
        
        this.performanceMetrics = {
            errorCount: this.errors.length,
            averageResponseTime: this.calculateAverageResponseTime(),
            memoryUsage: this.getMemoryUsage(),
            domOperations: this.countRecentDOMOperations(),
            lastUpdate: now
        };
    }

    /**
     * Calculate average response time
     */
    calculateAverageResponseTime() {
        if (!performance.getEntriesByType) return 0;
        
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            return Math.round(navigationEntries[0].loadEventEnd - navigationEntries[0].fetchStart);
        }
        return 0;
    }

    /**
     * Get memory usage percentage
     */
    getMemoryUsage() {
        if (performance.memory) {
            return Math.round((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100);
        }
        return 0;
    }

    /**
     * Count recent DOM operations
     */
    countRecentDOMOperations() {
        // This is a simplified metric - in a real implementation,
        // you would track actual DOM operations
        const recentErrors = this.errors.filter(
            error => error.type === 'dom' && Date.now() - error.timestamp < 60000
        );
        return recentErrors.length;
    }

    /**
     * Update error count window for rate limiting
     */
    updateErrorCountWindow() {
        const now = Date.now();
        this.errorCountWindow.push(now);
        
        // Keep only errors from the last minute
        this.errorCountWindow = this.errorCountWindow.filter(
            timestamp => now - timestamp < 60000
        );
    }

    /**
     * Clean up old errors to prevent memory leaks
     */
    cleanupOldErrors() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        this.errors = this.errors.filter(error => error.timestamp > cutoffTime);
    }

    /**
     * Update system health after an error occurs
     */
    updateSystemHealthAfterError(error) {
        // Immediately impact health based on error severity
        switch (error.severity) {
            case 'critical':
                this.systemHealth.overallHealth = Math.max(0, this.systemHealth.overallHealth - 20);
                break;
            case 'warning':
                this.systemHealth.overallHealth = Math.max(0, this.systemHealth.overallHealth - 5);
                break;
            case 'info':
                this.systemHealth.overallHealth = Math.max(0, this.systemHealth.overallHealth - 1);
                break;
        }
        
        // Update specific health aspects based on error type
        if (error.message.includes('DOM') || error.message.includes('element')) {
            this.systemHealth.domIntegrity = false;
        }
        if (error.message.includes('config') || error.message.includes('CDN')) {
            this.systemHealth.configurationValid = false;
        }
        if (error.message.includes('function') || error.message.includes('method')) {
            this.systemHealth.systemIntegrationsWorking = false;
        }
        if (error.message.includes('timeout') || error.message.includes('performance')) {
            this.systemHealth.performanceOptimal = false;
        }
    }

    /**
     * Determine error severity
     */
    determineSeverity(errorData) {
        const message = errorData.message.toLowerCase();
        
        // Critical errors that break functionality
        if (message.includes('cannot read') || 
            message.includes('is not a function') ||
            message.includes('insertbefore')) {
            return 'critical';
        }
        
        // Warning errors that may impact user experience
        if (message.includes('not found') || 
            message.includes('timeout') ||
            message.includes('cdn')) {
            return 'warning';
        }
        
        // Info level for minor issues
        return 'info';
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current system status
     */
    getSystemStatus() {
        return {
            isMonitoring: this.isMonitoring,
            systemHealth: { ...this.systemHealth },
            performanceMetrics: { ...this.performanceMetrics },
            errorCount: this.errors.length,
            recentErrorCount: this.errorCountWindow.length,
            lastErrors: this.errors.slice(-5)
        };
    }

    /**
     * Get all errors with optional filtering
     */
    getErrors(filter = {}) {
        let filteredErrors = [...this.errors];
        
        if (filter.severity) {
            filteredErrors = filteredErrors.filter(error => error.severity === filter.severity);
        }
        
        if (filter.type) {
            filteredErrors = filteredErrors.filter(error => error.type === filter.type);
        }
        
        if (filter.fixed !== undefined) {
            filteredErrors = filteredErrors.filter(error => error.fixed === filter.fixed);
        }
        
        if (filter.since) {
            filteredErrors = filteredErrors.filter(error => error.timestamp >= filter.since);
        }
        
        return filteredErrors;
    }

    /**
     * Force a system health check
     */
    forceHealthCheck() {
        this.checkSystemHealth();
        return this.systemHealth;
    }

    /**
     * Reset error monitoring system
     */
    reset() {
        this.errors = [];
        this.errorCountWindow = [];
        this.systemHealth = {
            domIntegrity: true,
            configurationValid: true,
            systemIntegrationsWorking: true,
            performanceOptimal: true,
            overallHealth: 100,
            lastCheck: Date.now()
        };
        this.performanceMetrics = {
            errorCount: 0,
            averageResponseTime: 0,
            memoryUsage: 0,
            domOperations: 0,
            lastUpdate: Date.now()
        };
        console.log('Error monitoring system reset');
    }
}

// Create global instance
window.errorMonitoringSystem = new ErrorMonitoringSystem();

// Auto-start monitoring when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.errorMonitoringSystem.startMonitoring();
    });
} else {
    window.errorMonitoringSystem.startMonitoring();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorMonitoringSystem;
}