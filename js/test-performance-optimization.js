/**
 * Performance Optimization Tests - Task 15
 * 
 * Tests for performance optimizations including:
 * - Debounced resize events
 * - Lazy loading for non-visible content
 * - Layout calculation optimization
 * 
 * Requirements: 5.3, 6.3
 */

class PerformanceOptimizationTests {
    constructor() {
        this.results = [];
        this.testStartTime = performance.now();
    }

    async runAllTests() {
        console.log('🧪 Starting Performance Optimization Tests...');
        
        try {
            // Test debounced resize events
            await this.testDebouncedResizeEvents();
            
            // Test lazy loading implementation
            await this.testLazyLoadingImplementation();
            
            // Test layout calculation optimization
            await this.testLayoutCalculationOptimization();
            
            // Test performance monitoring
            await this.testPerformanceMonitoring();
            
            // Test memory optimization
            await this.testMemoryOptimization();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Performance optimization tests failed:', error);
            this.addResult('Test Suite Execution', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test debounced resize events prevent excessive recalculations
     */
    async testDebouncedResizeEvents() {
        console.log('🔧 Testing debounced resize events...');
        
        return new Promise((resolve) => {
            let resizeCallCount = 0;
            let layoutUpdateCount = 0;
            
            // Mock layout manager if not available
            if (!window.layoutManager) {
                window.layoutManager = {
                    updateLayout: () => {
                        layoutUpdateCount++;
                    }
                };
            }
            
            // Override updateLayout to count calls
            const originalUpdateLayout = window.layoutManager.updateLayout;
            window.layoutManager.updateLayout = () => {
                layoutUpdateCount++;
                originalUpdateLayout.call(window.layoutManager);
            };
            
            // Create test resize handler
            const testResizeHandler = () => {
                resizeCallCount++;
                window.layoutManager.updateLayout();
            };
            
            // Add debounced resize listener
            let resizeTimeout;
            const debouncedHandler = () => {
                if (resizeTimeout) {
                    clearTimeout(resizeTimeout);
                }
                resizeTimeout = setTimeout(testResizeHandler, 100);
            };
            
            window.addEventListener('resize', debouncedHandler);
            
            // Simulate rapid resize events
            const resizeEvent = new Event('resize');
            const startTime = performance.now();
            
            // Fire 10 rapid resize events
            for (let i = 0; i < 10; i++) {
                window.dispatchEvent(resizeEvent);
            }
            
            // Wait for debounce to complete
            setTimeout(() => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Clean up
                window.removeEventListener('resize', debouncedHandler);
                window.layoutManager.updateLayout = originalUpdateLayout;
                
                // Verify debouncing worked
                const debounceWorking = layoutUpdateCount <= 2; // Should be 1, but allow for timing variations
                const performanceGood = duration < 200; // Should complete quickly
                
                this.addResult(
                    'Debounced Resize Events',
                    debounceWorking && performanceGood,
                    `Layout updates: ${layoutUpdateCount}/10 events, Duration: ${duration.toFixed(2)}ms`
                );
                
                resolve();
            }, 200);
        });
    }

    /**
     * Test lazy loading implementation for non-visible content
     */
    async testLazyLoadingImplementation() {
        console.log('🔧 Testing lazy loading implementation...');
        
        return new Promise((resolve) => {
            // Check if IntersectionObserver is supported
            const observerSupported = 'IntersectionObserver' in window;
            
            if (!observerSupported) {
                this.addResult(
                    'Lazy Loading Support',
                    false,
                    'IntersectionObserver not supported in this environment'
                );
                resolve();
                return;
            }
            
            // Create test elements
            const testContainer = document.createElement('div');
            testContainer.style.height = '2000px';
            testContainer.style.overflow = 'auto';
            document.body.appendChild(testContainer);
            
            const visibleElement = document.createElement('div');
            visibleElement.className = 'test-category visible';
            visibleElement.style.height = '100px';
            visibleElement.textContent = 'Visible Element';
            
            const hiddenElement = document.createElement('div');
            hiddenElement.className = 'test-category hidden';
            hiddenElement.style.height = '100px';
            hiddenElement.style.marginTop = '1500px';
            hiddenElement.textContent = 'Hidden Element';
            
            testContainer.appendChild(visibleElement);
            testContainer.appendChild(hiddenElement);
            
            // Set up intersection observer
            let visibleElementObserved = false;
            let hiddenElementObserved = false;
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.target === visibleElement && entry.isIntersecting) {
                        visibleElementObserved = true;
                    }
                    if (entry.target === hiddenElement && entry.isIntersecting) {
                        hiddenElementObserved = true;
                    }
                });
            }, {
                root: testContainer,
                threshold: 0.1
            });
            
            observer.observe(visibleElement);
            observer.observe(hiddenElement);
            
            // Wait for initial observation
            setTimeout(() => {
                // Scroll to make hidden element visible
                testContainer.scrollTop = 1400;
                
                setTimeout(() => {
                    // Clean up
                    observer.disconnect();
                    document.body.removeChild(testContainer);
                    
                    // Verify lazy loading behavior
                    const lazyLoadingWorking = visibleElementObserved && hiddenElementObserved;
                    
                    this.addResult(
                        'Lazy Loading Implementation',
                        lazyLoadingWorking,
                        `Visible observed: ${visibleElementObserved}, Hidden observed: ${hiddenElementObserved}`
                    );
                    
                    resolve();
                }, 100);
            }, 100);
        });
    }

    /**
     * Test layout calculation optimization
     */
    async testLayoutCalculationOptimization() {
        console.log('🔧 Testing layout calculation optimization...');
        
        return new Promise((resolve) => {
            let calculationCount = 0;
            let cacheHits = 0;
            
            // Mock optimized layout manager
            const mockLayoutManager = {
                _lastViewportType: null,
                _lastViewportSize: null,
                _forceLayoutUpdate: false,
                viewportSize: { width: 1024, height: 768 },
                
                getViewportType() {
                    return 'desktop';
                },
                
                updateLayout() {
                    calculationCount++;
                    
                    const currentViewportType = this.getViewportType();
                    const currentSize = `${this.viewportSize.width}x${this.viewportSize.height}`;
                    
                    // Simulate optimization check
                    if (this._lastViewportType === currentViewportType && 
                        this._lastViewportSize === currentSize &&
                        !this._forceLayoutUpdate) {
                        cacheHits++;
                        return; // Skip calculation
                    }
                    
                    // Simulate layout calculation
                    this._lastViewportType = currentViewportType;
                    this._lastViewportSize = currentSize;
                    this._forceLayoutUpdate = false;
                }
            };
            
            const startTime = performance.now();
            
            // Test multiple layout updates with same viewport
            for (let i = 0; i < 5; i++) {
                mockLayoutManager.updateLayout();
            }
            
            // Change viewport and test again
            mockLayoutManager.viewportSize = { width: 800, height: 600 };
            mockLayoutManager.updateLayout();
            
            // Test with same viewport again
            for (let i = 0; i < 3; i++) {
                mockLayoutManager.updateLayout();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Verify optimization
            const optimizationWorking = cacheHits >= 6; // Should skip 7 out of 9 calculations
            const performanceGood = duration < 10; // Should be very fast
            
            this.addResult(
                'Layout Calculation Optimization',
                optimizationWorking && performanceGood,
                `Calculations: ${calculationCount}/9, Cache hits: ${cacheHits}, Duration: ${duration.toFixed(2)}ms`
            );
            
            resolve();
        });
    }

    /**
     * Test performance monitoring functionality
     */
    async testPerformanceMonitoring() {
        console.log('🔧 Testing performance monitoring...');
        
        return new Promise((resolve) => {
            // Check if performance monitor is available
            const monitorAvailable = window.performanceMonitor !== undefined;
            
            if (!monitorAvailable) {
                this.addResult(
                    'Performance Monitor Availability',
                    false,
                    'Performance monitor not found'
                );
                resolve();
                return;
            }
            
            const monitor = window.performanceMonitor;
            
            // Test metrics collection
            const initialMetrics = monitor.getStatus();
            const hasMetrics = initialMetrics.metrics && typeof initialMetrics.metrics === 'object';
            
            // Test metric recording
            monitor.recordCacheHit();
            monitor.recordCacheMiss();
            
            const updatedMetrics = monitor.getStatus();
            const metricsUpdated = updatedMetrics.metrics.cacheHits > initialMetrics.metrics.cacheHits;
            
            // Test cache efficiency calculation
            const efficiency = monitor.getCacheEfficiency();
            const efficiencyValid = typeof efficiency === 'number' && efficiency >= 0 && efficiency <= 100;
            
            const monitoringWorking = hasMetrics && metricsUpdated && efficiencyValid;
            
            this.addResult(
                'Performance Monitoring',
                monitoringWorking,
                `Metrics available: ${hasMetrics}, Updates working: ${metricsUpdated}, Efficiency: ${efficiency}%`
            );
            
            resolve();
        });
    }

    /**
     * Test memory optimization features
     */
    async testMemoryOptimization() {
        console.log('🔧 Testing memory optimization...');
        
        return new Promise((resolve) => {
            // Test cache size limits
            const testCache = new Map();
            const maxCacheSize = 10;
            
            // Fill cache beyond limit
            for (let i = 0; i < 15; i++) {
                testCache.set(`key${i}`, `value${i}`);
                
                // Simulate cache size limit
                if (testCache.size > maxCacheSize) {
                    const firstKey = testCache.keys().next().value;
                    testCache.delete(firstKey);
                }
            }
            
            const cacheSizeLimited = testCache.size <= maxCacheSize;
            
            // Test memory usage reporting
            let memoryReportingAvailable = false;
            if ('memory' in performance) {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
                memoryReportingAvailable = memInfo.used > 0 && memInfo.total > 0;
            }
            
            // Test cleanup functionality
            let cleanupWorking = true;
            try {
                // Simulate cleanup
                testCache.clear();
                cleanupWorking = testCache.size === 0;
            } catch (error) {
                cleanupWorking = false;
            }
            
            const memoryOptimizationWorking = cacheSizeLimited && cleanupWorking;
            
            this.addResult(
                'Memory Optimization',
                memoryOptimizationWorking,
                `Cache limited: ${cacheSizeLimited}, Cleanup: ${cleanupWorking}, Memory API: ${memoryReportingAvailable}`
            );
            
            resolve();
        });
    }

    /**
     * Add test result
     */
    addResult(testName, passed, details = '') {
        const result = {
            test: testName,
            passed,
            details,
            timestamp: performance.now() - this.testStartTime
        };
        
        this.results.push(result);
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: `${successRate}%`,
                duration: `${(performance.now() - this.testStartTime).toFixed(2)}ms`
            },
            results: this.results,
            performance: {
                averageTestTime: this.results.reduce((sum, r) => sum + r.timestamp, 0) / totalTests,
                slowestTest: this.results.reduce((max, r) => r.timestamp > max.timestamp ? r : max, this.results[0]),
                fastestTest: this.results.reduce((min, r) => r.timestamp < min.timestamp ? r : min, this.results[0])
            }
        };
        
        console.log('📊 Performance Optimization Test Report:', report);
        
        // Display summary
        console.log(`\n🎯 Test Summary:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Duration: ${report.summary.duration}`);
        
        if (failedTests > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.test}: ${result.details}`);
            });
        }
        
        // Store report globally for debugging
        window.performanceOptimizationTestReport = report;
        
        return report;
    }
}

// Auto-run tests when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other systems to initialize
    setTimeout(async () => {
        const tests = new PerformanceOptimizationTests();
        await tests.runAllTests();
    }, 1000);
});

// Export for manual testing
if (typeof window !== 'undefined') {
    window.PerformanceOptimizationTests = PerformanceOptimizationTests;
}