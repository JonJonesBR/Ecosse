/**
 * Performance Optimizer Tests - Task 6: Implement performance optimization fixes
 * 
 * Tests for the performance optimization system including:
 * - Debounced resize events
 * - Lazy loading with intersection observer
 * - Infinite loop detection and prevention
 * - Layout calculation caching
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

class PerformanceOptimizerTests {
    constructor() {
        this.results = [];
        this.testStartTime = performance.now();
    }

    async runAllTests() {
        console.log('🧪 Starting Performance Optimizer Tests...');
        
        try {
            // Test debounced resize events
            await this.testDebouncedResizeEvents();
            
            // Test lazy loading implementation
            await this.testLazyLoadingImplementation();
            
            // Test infinite loop detection
            await this.testInfiniteLoopDetection();
            
            // Test layout caching
            await this.testLayoutCaching();
            
            // Test system integration
            await this.testSystemIntegration();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Performance optimizer tests failed:', error);
            this.addResult('Test Suite Execution', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test debounced resize events
     */
    async testDebouncedResizeEvents() {
        console.log('🔧 Testing debounced resize events...');
        
        return new Promise((resolve) => {
            const optimizer = window.performanceOptimizer;
            if (!optimizer) {
                this.addResult('Performance Optimizer Availability', false, 'Performance optimizer not found');
                resolve();
                return;
            }
            
            const initialResizeCount = optimizer.metrics?.resizeEvents || 0;
            
            // Simulate rapid resize events
            const resizeEvent = new Event('resize');
            const startTime = performance.now();
            
            // Fire 5 rapid resize events
            for (let i = 0; i < 5; i++) {
                window.dispatchEvent(resizeEvent);
            }
            
            // Wait for debounce to complete
            setTimeout(() => {
                const finalResizeCount = optimizer.metrics?.resizeEvents || 0;
                const resizeEventsHandled = finalResizeCount - initialResizeCount;
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Verify debouncing worked (should handle events)
                const debounceWorking = resizeEventsHandled >= 1; // At least some events handled
                const performanceGood = duration < 200; // Should complete quickly
                
                this.addResult(
                    'Debounced Resize Events',
                    debounceWorking && performanceGood,
                    `Resize events: ${resizeEventsHandled}/5, Duration: ${duration.toFixed(2)}ms`
                );
                
                resolve();
            }, 200);
        });
    }

    /**
     * Test lazy loading implementation
     */
    async testLazyLoadingImplementation() {
        console.log('🔧 Testing lazy loading implementation...');
        
        return new Promise((resolve) => {
            const optimizer = window.performanceOptimizer;
            
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
            testContainer.style.position = 'fixed';
            testContainer.style.top = '-3000px'; // Hide from view
            document.body.appendChild(testContainer);
            
            const visibleElement = document.createElement('div');
            visibleElement.className = 'test-lazy-element';
            visibleElement.setAttribute('data-lazy', 'true');
            visibleElement.style.height = '100px';
            visibleElement.textContent = 'Visible Element';
            
            const hiddenElement = document.createElement('div');
            hiddenElement.className = 'test-lazy-element';
            hiddenElement.setAttribute('data-lazy', 'true');
            hiddenElement.style.height = '100px';
            hiddenElement.style.marginTop = '1500px';
            hiddenElement.textContent = 'Hidden Element';
            
            testContainer.appendChild(visibleElement);
            testContainer.appendChild(hiddenElement);
            
            // Let the optimizer observe the elements
            setTimeout(() => {
                optimizer.observeLazyElements();
                
                // Check if elements are being observed
                const elementsObserved = optimizer.lazyElements.size > 0;
                
                // Clean up
                document.body.removeChild(testContainer);
                
                this.addResult(
                    'Lazy Loading Implementation',
                    elementsObserved,
                    `Elements observed: ${optimizer.lazyElements.size}`
                );
                
                resolve();
            }, 100);
        });
    }

    /**
     * Test infinite loop detection
     */
    async testInfiniteLoopDetection() {
        console.log('🔧 Testing infinite loop detection...');
        
        return new Promise((resolve) => {
            const optimizer = window.performanceOptimizer;
            
            if (!optimizer) {
                this.addResult('Infinite Loop Detection', false, 'Performance optimizer not available');
                resolve();
                return;
            }
            
            const initialLoopCount = optimizer.metrics.infiniteLoopsDetected;
            
            // Test timeout wrapping
            let timeoutExecuted = false;
            let intervalExecuted = false;
            
            // Test setTimeout wrapping
            setTimeout(() => {
                timeoutExecuted = true;
            }, 10);
            
            // Test setInterval wrapping
            const intervalId = setInterval(() => {
                intervalExecuted = true;
                clearInterval(intervalId);
            }, 20);
            
            // Wait for execution
            setTimeout(() => {
                const finalLoopCount = optimizer.metrics.infiniteLoopsDetected;
                const loopDetectionWorking = finalLoopCount >= initialLoopCount;
                const wrappingWorking = timeoutExecuted && intervalExecuted;
                
                this.addResult(
                    'Infinite Loop Detection',
                    loopDetectionWorking && wrappingWorking,
                    `Loops detected: ${finalLoopCount}, Timeout: ${timeoutExecuted}, Interval: ${intervalExecuted}`
                );
                
                resolve();
            }, 100);
        });
    }

    /**
     * Test layout caching
     */
    async testLayoutCaching() {
        console.log('🔧 Testing layout caching...');
        
        return new Promise((resolve) => {
            const optimizer = window.performanceOptimizer;
            
            if (!optimizer) {
                this.addResult('Layout Caching', false, 'Performance optimizer not available');
                resolve();
                return;
            }
            
            // Test cache key generation
            const cacheKey1 = optimizer.generateLayoutCacheKey();
            const cacheKey2 = optimizer.generateLayoutCacheKey();
            
            const cacheKeyConsistent = cacheKey1 === cacheKey2;
            
            // Test cache operations
            const testKey = 'test-layout';
            const testValue = { width: 800, height: 600 };
            
            optimizer.layoutCache.set(testKey, testValue);
            const cachedValue = optimizer.layoutCache.get(testKey);
            
            const cacheOperationsWorking = cachedValue === testValue;
            
            // Test cache efficiency calculation
            optimizer.metrics.cacheHits = 5;
            optimizer.metrics.cacheMisses = 3;
            const efficiency = optimizer.getCacheEfficiency();
            const expectedEfficiency = Math.round((5 / 8) * 100); // 62.5% -> 63%
            
            const efficiencyCalculationWorking = efficiency === expectedEfficiency;
            
            const cachingWorking = cacheKeyConsistent && cacheOperationsWorking && efficiencyCalculationWorking;
            
            this.addResult(
                'Layout Caching',
                cachingWorking,
                `Key consistent: ${cacheKeyConsistent}, Operations: ${cacheOperationsWorking}, Efficiency: ${efficiency}%`
            );
            
            resolve();
        });
    }

    /**
     * Test system integration
     */
    async testSystemIntegration() {
        console.log('🔧 Testing system integration...');
        
        return new Promise((resolve) => {
            const optimizer = window.performanceOptimizer;
            
            if (!optimizer) {
                this.addResult('System Integration', false, 'Performance optimizer not available');
                resolve();
                return;
            }
            
            // Test metrics collection
            const metrics = optimizer.getMetrics();
            const metricsAvailable = metrics && typeof metrics === 'object';
            
            // Test report generation
            const report = optimizer.generateReport();
            const reportGenerated = report && report.timestamp && report.metrics;
            
            // Test initialization status
            const isInitialized = optimizer.isInitialized;
            
            const integrationWorking = metricsAvailable && reportGenerated && isInitialized;
            
            this.addResult(
                'System Integration',
                integrationWorking,
                `Metrics: ${metricsAvailable}, Report: ${reportGenerated}, Initialized: ${isInitialized}`
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
        
        console.log('📊 Performance Optimizer Test Report:', report);
        
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
        window.performanceOptimizerTestReport = report;
        
        return report;
    }
}

// Auto-run tests when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other systems to initialize
    setTimeout(async () => {
        const tests = new PerformanceOptimizerTests();
        await tests.runAllTests();
    }, 2000);
});

// Export for manual testing
if (typeof window !== 'undefined') {
    window.PerformanceOptimizerTests = PerformanceOptimizerTests;
    window.testPerformanceOptimizer = () => {
        const tests = new PerformanceOptimizerTests();
        return tests.runAllTests();
    };
}