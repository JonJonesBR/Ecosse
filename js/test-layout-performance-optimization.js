/**
 * Layout Performance Optimization Tests - Task 7
 * 
 * Tests for the layout performance optimization system including:
 * - Debounced resize handling
 * - Layout calculation caching
 * - DOM manipulation batching
 */

class LayoutPerformanceOptimizationTests {
    constructor() {
        this.testResults = [];
        this.testStartTime = 0;
    }
    
    /**
     * Run all layout performance optimization tests
     */
    async runAllTests() {
        console.log('🧪 Starting Layout Performance Optimization Tests...');
        this.testStartTime = performance.now();
        
        const tests = [
            () => this.testDebouncedResizeHandling(),
            () => this.testLayoutCalculationCaching(),
            () => this.testDOMManipulationBatching(),
            () => this.testPerformanceMetrics(),
            () => this.testCacheInvalidation(),
            () => this.testResizeHandlerRegistration(),
            () => this.testBatchPriorityQueuing(),
            () => this.testMemoryLeakPrevention()
        ];
        
        for (const test of tests) {
            try {
                await test();
            } catch (error) {
                console.error('❌ Test failed:', error);
                this.addResult('Test Execution', false, `Test failed: ${error.message}`);
            }
        }
        
        this.generateTestReport();
        return this.testResults;
    }
    
    /**
     * Test debounced resize handling
     */
    async testDebouncedResizeHandling() {
        const testName = 'Debounced Resize Handling';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            // Check if layout performance optimizer is available
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            const initialMetrics = optimizer.getPerformanceMetrics();
            
            // Simulate rapid resize events
            const resizeEventCount = 10;
            const resizePromises = [];
            
            for (let i = 0; i < resizeEventCount; i++) {
                resizePromises.push(new Promise(resolve => {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                        resolve();
                    }, i * 10); // 10ms intervals
                }));
            }
            
            await Promise.all(resizePromises);
            
            // Wait for debouncing to complete
            await this.wait(300);
            
            const finalMetrics = optimizer.getPerformanceMetrics();
            const resizeEventsHandled = finalMetrics.resizeEvents - initialMetrics.resizeEvents;
            
            // Should handle fewer events than triggered due to debouncing
            if (resizeEventsHandled > 0 && resizeEventsHandled < resizeEventCount) {
                this.addResult(testName, true, `Debouncing working: ${resizeEventsHandled}/${resizeEventCount} events processed`);
            } else {
                this.addResult(testName, false, `Debouncing not working properly: ${resizeEventsHandled}/${resizeEventCount} events processed`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test layout calculation caching
     */
    async testLayoutCalculationCaching() {
        const testName = 'Layout Calculation Caching';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            
            // Clear cache to start fresh
            optimizer.invalidateLayoutCache();
            
            // Trigger layout calculation multiple times with same conditions
            if (window.layoutManager?.updateLayout) {
                const startTime = performance.now();
                
                // First call - should be cache miss
                window.layoutManager.updateLayout();
                const firstCallTime = performance.now() - startTime;
                
                // Second call - should be cache hit (if conditions haven't changed)
                const secondStartTime = performance.now();
                window.layoutManager.updateLayout();
                const secondCallTime = performance.now() - secondStartTime;
                
                const metrics = optimizer.getPerformanceMetrics();
                
                if (metrics.cacheHits > 0) {
                    this.addResult(testName, true, `Caching working: ${metrics.cacheHits} hits, ${metrics.cacheMisses} misses, efficiency: ${metrics.cacheEfficiency}%`);
                } else {
                    this.addResult(testName, false, `No cache hits detected: ${metrics.cacheHits} hits, ${metrics.cacheMisses} misses`);
                }
            } else {
                this.addResult(testName, false, 'Layout manager not available for testing');
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test DOM manipulation batching
     */
    async testDOMManipulationBatching() {
        const testName = 'DOM Manipulation Batching';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.batchDOMOperation) {
                this.addResult(testName, false, 'DOM batching not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            const initialMetrics = optimizer.getPerformanceMetrics();
            
            // Create test element
            const testContainer = document.createElement('div');
            testContainer.id = 'batch-test-container';
            document.body.appendChild(testContainer);
            
            let operationsExecuted = 0;
            const totalOperations = 20;
            
            // Queue multiple DOM operations
            for (let i = 0; i < totalOperations; i++) {
                const priority = i < 5 ? 'high' : 'normal';
                
                window.batchDOMOperation(() => {
                    const element = document.createElement('div');
                    element.textContent = `Batch operation ${i}`;
                    element.className = 'batch-test-item';
                    testContainer.appendChild(element);
                    operationsExecuted++;
                }, priority);
            }
            
            // Wait for batch processing
            await this.wait(100);
            
            const finalMetrics = optimizer.getPerformanceMetrics();
            const batchesProcessed = finalMetrics.domBatches - initialMetrics.domBatches;
            
            // Clean up
            document.body.removeChild(testContainer);
            
            if (operationsExecuted === totalOperations && batchesProcessed > 0) {
                this.addResult(testName, true, `Batching working: ${operationsExecuted} operations in ${batchesProcessed} batches`);
            } else {
                this.addResult(testName, false, `Batching issues: ${operationsExecuted}/${totalOperations} operations, ${batchesProcessed} batches`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test performance metrics collection
     */
    async testPerformanceMetrics() {
        const testName = 'Performance Metrics Collection';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            const metrics = optimizer.getPerformanceMetrics();
            
            const requiredMetrics = [
                'resizeEvents', 'layoutCalculations', 'cacheHits', 'cacheMisses',
                'domBatches', 'averageLayoutTime', 'cacheSize', 'cacheEfficiency'
            ];
            
            const missingMetrics = requiredMetrics.filter(metric => 
                metrics[metric] === undefined && metrics[metric] !== 0
            );
            
            if (missingMetrics.length === 0) {
                this.addResult(testName, true, `All metrics available: ${Object.keys(metrics).length} metrics tracked`);
            } else {
                this.addResult(testName, false, `Missing metrics: ${missingMetrics.join(', ')}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test cache invalidation
     */
    async testCacheInvalidation() {
        const testName = 'Cache Invalidation';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            
            // Build up cache
            if (window.layoutManager?.updateLayout) {
                window.layoutManager.updateLayout();
                window.layoutManager.updateLayout(); // Should hit cache
            }
            
            const metricsBeforeInvalidation = optimizer.getPerformanceMetrics();
            const cacheSizeBefore = metricsBeforeInvalidation.cacheSize;
            
            // Invalidate cache
            optimizer.invalidateLayoutCache();
            
            const metricsAfterInvalidation = optimizer.getPerformanceMetrics();
            const cacheSizeAfter = metricsAfterInvalidation.cacheSize;
            
            if (cacheSizeBefore > 0 && cacheSizeAfter === 0) {
                this.addResult(testName, true, `Cache invalidation working: ${cacheSizeBefore} → ${cacheSizeAfter} entries`);
            } else {
                this.addResult(testName, false, `Cache invalidation issues: ${cacheSizeBefore} → ${cacheSizeAfter} entries`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test resize handler registration
     */
    async testResizeHandlerRegistration() {
        const testName = 'Resize Handler Registration';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            let handlerCalled = false;
            
            // Register test handler
            const testHandler = () => {
                handlerCalled = true;
            };
            
            optimizer.registerResizeHandler('test-handler', testHandler);
            
            // Trigger resize
            window.dispatchEvent(new Event('resize'));
            
            // Wait for handler execution
            await this.wait(200);
            
            // Unregister handler
            optimizer.unregisterResizeHandler('test-handler');
            
            if (handlerCalled) {
                this.addResult(testName, true, 'Resize handler registration and execution working');
            } else {
                this.addResult(testName, false, 'Resize handler was not called');
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test batch priority queuing
     */
    async testBatchPriorityQueuing() {
        const testName = 'Batch Priority Queuing';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.batchDOMOperation) {
                this.addResult(testName, false, 'DOM batching not available');
                return;
            }
            
            const executionOrder = [];
            
            // Queue operations with different priorities
            window.batchDOMOperation(() => {
                executionOrder.push('normal-1');
            }, 'normal');
            
            window.batchDOMOperation(() => {
                executionOrder.push('high-1');
            }, 'high');
            
            window.batchDOMOperation(() => {
                executionOrder.push('normal-2');
            }, 'normal');
            
            window.batchDOMOperation(() => {
                executionOrder.push('high-2');
            }, 'high');
            
            // Force batch flush
            if (window.flushDOMBatch) {
                window.flushDOMBatch();
            }
            
            // Wait for execution
            await this.wait(50);
            
            // High priority operations should execute first
            const highPriorityFirst = executionOrder[0]?.startsWith('high') && executionOrder[1]?.startsWith('high');
            
            if (executionOrder.length === 4 && highPriorityFirst) {
                this.addResult(testName, true, `Priority queuing working: ${executionOrder.join(' → ')}`);
            } else {
                this.addResult(testName, false, `Priority queuing issues: ${executionOrder.join(' → ')}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Test memory leak prevention
     */
    async testMemoryLeakPrevention() {
        const testName = 'Memory Leak Prevention';
        console.log(`🔍 Testing ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            
            // Build up cache beyond max size
            const initialCacheSize = optimizer.getPerformanceMetrics().cacheSize;
            
            // Simulate many layout calculations with different cache keys
            for (let i = 0; i < 150; i++) {
                // Simulate different viewport sizes to create unique cache keys
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: 1000 + i
                });
                
                if (window.layoutManager?.updateLayout) {
                    window.layoutManager.updateLayout(true); // Force update to create cache entry
                }
            }
            
            const finalCacheSize = optimizer.getPerformanceMetrics().cacheSize;
            
            // Restore original window size
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: window.screen.width
            });
            
            // Cache should be limited to prevent memory leaks
            if (finalCacheSize < 150 && finalCacheSize > initialCacheSize) {
                this.addResult(testName, true, `Memory leak prevention working: cache limited to ${finalCacheSize} entries`);
            } else {
                this.addResult(testName, false, `Memory leak prevention issues: cache size ${finalCacheSize}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Add test result
     */
    addResult(testName, passed, details) {
        const result = {
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${details}`);
    }
    
    /**
     * Wait for specified milliseconds
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const testDuration = performance.now() - this.testStartTime;
        
        console.log('\n📊 Layout Performance Optimization Test Report');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log(`Test Duration: ${testDuration.toFixed(2)}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.test}: ${r.details}`));
        }
        
        // Performance metrics
        if (window.layoutPerformanceOptimizer) {
            const metrics = window.layoutPerformanceOptimizer.getPerformanceMetrics();
            console.log('\n📈 Performance Metrics:');
            console.log(`  Cache Efficiency: ${metrics.cacheEfficiency}%`);
            console.log(`  Average Layout Time: ${metrics.averageLayoutTime.toFixed(2)}ms`);
            console.log(`  DOM Batches: ${metrics.domBatches}`);
            console.log(`  Resize Events: ${metrics.resizeEvents}`);
        }
        
        console.log('='.repeat(50));
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: (passedTests / totalTests) * 100,
                duration: testDuration
            },
            results: this.testResults,
            metrics: window.layoutPerformanceOptimizer?.getPerformanceMetrics() || {}
        };
    }
}

// Create and export test instance
export const layoutPerformanceOptimizationTests = new LayoutPerformanceOptimizationTests();

// Make available globally for console testing
if (typeof window !== 'undefined') {
    window.testLayoutPerformanceOptimization = () => layoutPerformanceOptimizationTests.runAllTests();
    console.log('🧪 Layout Performance Optimization tests available: Run testLayoutPerformanceOptimization() in console');
}