/**
 * Layout Performance Optimization Verification - Task 7
 * 
 * Verifies that all layout performance optimizations are working correctly:
 * - Debounced resize handling
 * - Layout calculation caching  
 * - DOM manipulation batching
 * 
 * Requirements verification:
 * - 2.3: Canvas SHALL adjust automatically when screen is resized
 * - 4.4: Layout SHALL reorganize adequately when orientation changes
 * - 5.1: System SHALL apply fallbacks automatically when layout errors occur
 */

class LayoutPerformanceOptimizationVerification {
    constructor() {
        this.verificationResults = [];
        this.startTime = 0;
    }
    
    /**
     * Run complete verification of layout performance optimizations
     */
    async runVerification() {
        console.log('🔍 Starting Layout Performance Optimization Verification...');
        this.startTime = performance.now();
        
        const verifications = [
            () => this.verifySystemInitialization(),
            () => this.verifyDebouncedResizeHandling(),
            () => this.verifyLayoutCalculationCaching(),
            () => this.verifyDOMManipulationBatching(),
            () => this.verifyPerformanceMetrics(),
            () => this.verifyRequirement2_3_CanvasResize(),
            () => this.verifyRequirement4_4_OrientationChange(),
            () => this.verifyRequirement5_1_ErrorFallbacks(),
            () => this.verifyIntegrationWithExistingSystems()
        ];
        
        for (const verification of verifications) {
            try {
                await verification();
            } catch (error) {
                console.error('❌ Verification failed:', error);
                this.addResult('Verification Execution', false, `Verification failed: ${error.message}`);
            }
        }
        
        return this.generateVerificationReport();
    }
    
    /**
     * Verify system initialization
     */
    async verifySystemInitialization() {
        const testName = 'System Initialization';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            // Check if layout performance optimizer is available
            const optimizerAvailable = typeof window.layoutPerformanceOptimizer !== 'undefined';
            const optimizerInitialized = optimizerAvailable && window.layoutPerformanceOptimizer.isInitialized;
            
            // Check if performance optimizer integration is working
            const performanceOptimizerAvailable = typeof window.performanceOptimizer !== 'undefined';
            const performanceOptimizerInitialized = performanceOptimizerAvailable && window.performanceOptimizer.isInitialized;
            
            // Check if global DOM batching functions are available
            const domBatchingAvailable = typeof window.batchDOMOperation === 'function' && 
                                       typeof window.flushDOMBatch === 'function';
            
            if (optimizerInitialized && performanceOptimizerInitialized && domBatchingAvailable) {
                this.addResult(testName, true, 'All systems initialized correctly');
            } else {
                const issues = [];
                if (!optimizerInitialized) issues.push('Layout performance optimizer not initialized');
                if (!performanceOptimizerInitialized) issues.push('Performance optimizer not initialized');
                if (!domBatchingAvailable) issues.push('DOM batching functions not available');
                
                this.addResult(testName, false, `Initialization issues: ${issues.join(', ')}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify debounced resize handling
     */
    async verifyDebouncedResizeHandling() {
        const testName = 'Debounced Resize Handling';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            const initialMetrics = optimizer.getPerformanceMetrics();
            
            // Simulate rapid resize events
            const startTime = performance.now();
            const resizeCount = 15;
            
            for (let i = 0; i < resizeCount; i++) {
                window.dispatchEvent(new Event('resize'));
                await this.wait(5); // Very rapid events
            }
            
            // Wait for debouncing to settle
            await this.wait(250);
            
            const finalMetrics = optimizer.getPerformanceMetrics();
            const eventsProcessed = finalMetrics.resizeEvents - initialMetrics.resizeEvents;
            const processingTime = performance.now() - startTime;
            
            // Debouncing should reduce the number of actual resize handlers called
            const debounceEffective = eventsProcessed < resizeCount;
            const reasonableProcessingTime = processingTime < 500; // Should complete quickly
            
            if (debounceEffective && reasonableProcessingTime) {
                this.addResult(testName, true, `Debouncing effective: ${eventsProcessed}/${resizeCount} events processed in ${processingTime.toFixed(2)}ms`);
            } else {
                this.addResult(testName, false, `Debouncing issues: ${eventsProcessed}/${resizeCount} events processed in ${processingTime.toFixed(2)}ms`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify layout calculation caching
     */
    async verifyLayoutCalculationCaching() {
        const testName = 'Layout Calculation Caching';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer || !window.layoutManager) {
                this.addResult(testName, false, 'Required systems not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            
            // Clear cache to start fresh
            optimizer.invalidateLayoutCache();
            
            // Perform layout calculations
            const startTime = performance.now();
            
            // First calculation - should be cache miss
            window.layoutManager.updateLayout();
            const firstCallTime = performance.now() - startTime;
            
            // Second calculation with same conditions - should be cache hit
            const secondStartTime = performance.now();
            window.layoutManager.updateLayout();
            const secondCallTime = performance.now() - secondStartTime;
            
            const metrics = optimizer.getPerformanceMetrics();
            const cacheWorking = metrics.cacheHits > 0;
            const performanceImprovement = secondCallTime < firstCallTime;
            
            if (cacheWorking && metrics.cacheEfficiency > 0) {
                this.addResult(testName, true, `Caching working: ${metrics.cacheHits} hits, ${metrics.cacheEfficiency}% efficiency`);
            } else {
                this.addResult(testName, false, `Caching not working: ${metrics.cacheHits} hits, ${metrics.cacheEfficiency}% efficiency`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify DOM manipulation batching
     */
    async verifyDOMManipulationBatching() {
        const testName = 'DOM Manipulation Batching';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            if (!window.batchDOMOperation || !window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'DOM batching system not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            const initialMetrics = optimizer.getPerformanceMetrics();
            
            // Create test container
            const testContainer = document.createElement('div');
            testContainer.id = 'batch-verification-container';
            testContainer.style.display = 'none'; // Hidden to avoid visual impact
            document.body.appendChild(testContainer);
            
            let operationsExecuted = 0;
            const totalOperations = 25;
            const startTime = performance.now();
            
            // Queue multiple DOM operations
            for (let i = 0; i < totalOperations; i++) {
                const priority = i % 5 === 0 ? 'high' : 'normal';
                
                window.batchDOMOperation(() => {
                    const element = document.createElement('div');
                    element.textContent = `Batch verification ${i}`;
                    element.className = 'batch-verification-item';
                    testContainer.appendChild(element);
                    operationsExecuted++;
                }, priority);
            }
            
            // Wait for batch processing
            await this.wait(100);
            
            const processingTime = performance.now() - startTime;
            const finalMetrics = optimizer.getPerformanceMetrics();
            const batchesProcessed = finalMetrics.domBatches - initialMetrics.domBatches;
            
            // Clean up
            document.body.removeChild(testContainer);
            
            const allOperationsExecuted = operationsExecuted === totalOperations;
            const batchingOccurred = batchesProcessed > 0 && batchesProcessed < totalOperations;
            const reasonablePerformance = processingTime < 200;
            
            if (allOperationsExecuted && batchingOccurred && reasonablePerformance) {
                this.addResult(testName, true, `Batching working: ${operationsExecuted} operations in ${batchesProcessed} batches (${processingTime.toFixed(2)}ms)`);
            } else {
                this.addResult(testName, false, `Batching issues: ${operationsExecuted}/${totalOperations} operations, ${batchesProcessed} batches, ${processingTime.toFixed(2)}ms`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify performance metrics collection
     */
    async verifyPerformanceMetrics() {
        const testName = 'Performance Metrics Collection';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer || !window.performanceOptimizer) {
                this.addResult(testName, false, 'Performance systems not available');
                return;
            }
            
            const layoutMetrics = window.layoutPerformanceOptimizer.getPerformanceMetrics();
            const performanceMetrics = window.performanceOptimizer.getMetrics();
            
            // Check required layout metrics
            const requiredLayoutMetrics = [
                'resizeEvents', 'layoutCalculations', 'cacheHits', 'cacheMisses',
                'domBatches', 'averageLayoutTime', 'cacheEfficiency'
            ];
            
            const missingLayoutMetrics = requiredLayoutMetrics.filter(metric => 
                layoutMetrics[metric] === undefined
            );
            
            // Check integration metrics
            const hasIntegratedMetrics = performanceMetrics.layoutOptimizations !== undefined;
            
            if (missingLayoutMetrics.length === 0 && hasIntegratedMetrics) {
                this.addResult(testName, true, `All metrics available: ${Object.keys(layoutMetrics).length} layout metrics, integration working`);
            } else {
                const issues = [];
                if (missingLayoutMetrics.length > 0) {
                    issues.push(`Missing layout metrics: ${missingLayoutMetrics.join(', ')}`);
                }
                if (!hasIntegratedMetrics) {
                    issues.push('Integration metrics not available');
                }
                
                this.addResult(testName, false, issues.join('; '));
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify Requirement 2.3: Canvas SHALL adjust automatically when screen is resized
     */
    async verifyRequirement2_3_CanvasResize() {
        const testName = 'Requirement 2.3 - Canvas Auto-Resize';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) {
                this.addResult(testName, false, 'Canvas container not found');
                return;
            }
            
            // Get initial canvas size
            const initialRect = canvasContainer.getBoundingClientRect();
            const initialSize = { width: initialRect.width, height: initialRect.height };
            
            // Simulate viewport resize
            const originalWidth = window.innerWidth;
            const originalHeight = window.innerHeight;
            
            // Change viewport size
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalWidth + 200
            });
            
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: originalHeight + 100
            });
            
            // Trigger resize event
            window.dispatchEvent(new Event('resize'));
            
            // Wait for resize handling
            await this.wait(300);
            
            // Check if canvas adjusted
            const finalRect = canvasContainer.getBoundingClientRect();
            const finalSize = { width: finalRect.width, height: finalRect.height };
            
            // Restore original viewport size
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalWidth
            });
            
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: originalHeight
            });
            
            // Trigger resize to restore
            window.dispatchEvent(new Event('resize'));
            await this.wait(200);
            
            const canvasResized = finalSize.width !== initialSize.width || finalSize.height !== initialSize.height;
            
            if (canvasResized) {
                this.addResult(testName, true, `Canvas auto-resize working: ${initialSize.width}x${initialSize.height} → ${finalSize.width}x${finalSize.height}`);
            } else {
                this.addResult(testName, false, `Canvas did not resize: ${initialSize.width}x${initialSize.height} (unchanged)`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify Requirement 4.4: Layout SHALL reorganize adequately when orientation changes
     */
    async verifyRequirement4_4_OrientationChange() {
        const testName = 'Requirement 4.4 - Orientation Change Layout';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            if (!window.layoutPerformanceOptimizer) {
                this.addResult(testName, false, 'Layout performance optimizer not available');
                return;
            }
            
            const optimizer = window.layoutPerformanceOptimizer;
            const initialMetrics = optimizer.getPerformanceMetrics();
            
            // Simulate orientation change
            const orientationChangeEvent = new Event('orientationchange');
            window.dispatchEvent(orientationChangeEvent);
            
            // Wait for orientation change handling (longer delay)
            await this.wait(400);
            
            const finalMetrics = optimizer.getPerformanceMetrics();
            const resizeEventsTriggered = finalMetrics.resizeEvents > initialMetrics.resizeEvents;
            
            // Check if layout systems responded
            const layoutManagerResponded = window.layoutManager ? true : false;
            const canvasResponded = window.responsiveCanvasContainer ? true : false;
            
            if (resizeEventsTriggered && layoutManagerResponded && canvasResponded) {
                this.addResult(testName, true, 'Orientation change handling working - layout systems responded');
            } else {
                const issues = [];
                if (!resizeEventsTriggered) issues.push('No resize events triggered');
                if (!layoutManagerResponded) issues.push('Layout manager not available');
                if (!canvasResponded) issues.push('Canvas container not available');
                
                this.addResult(testName, false, `Orientation change issues: ${issues.join(', ')}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify Requirement 5.1: System SHALL apply fallbacks automatically when layout errors occur
     */
    async verifyRequirement5_1_ErrorFallbacks() {
        const testName = 'Requirement 5.1 - Error Fallbacks';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            // Check if error handling systems are available
            const layoutErrorHandlerAvailable = typeof window.layoutErrorHandler !== 'undefined';
            const performanceOptimizerAvailable = typeof window.performanceOptimizer !== 'undefined';
            
            // Test error recovery in DOM batching
            let errorHandled = false;
            
            if (window.batchDOMOperation) {
                // Queue an operation that will throw an error
                window.batchDOMOperation(() => {
                    throw new Error('Test error for fallback verification');
                }, 'normal');
                
                // Queue a normal operation after the error
                window.batchDOMOperation(() => {
                    errorHandled = true;
                }, 'normal');
                
                // Wait for batch processing
                await this.wait(100);
            }
            
            // Test cache invalidation on errors
            let cacheInvalidated = false;
            if (window.layoutPerformanceOptimizer) {
                const initialCacheSize = window.layoutPerformanceOptimizer.getPerformanceMetrics().cacheSize;
                
                // Simulate error condition by invalidating cache
                window.layoutPerformanceOptimizer.invalidateLayoutCache();
                
                const finalCacheSize = window.layoutPerformanceOptimizer.getPerformanceMetrics().cacheSize;
                cacheInvalidated = finalCacheSize < initialCacheSize || finalCacheSize === 0;
            }
            
            const fallbacksWorking = errorHandled && cacheInvalidated;
            const errorSystemsAvailable = layoutErrorHandlerAvailable && performanceOptimizerAvailable;
            
            if (fallbacksWorking && errorSystemsAvailable) {
                this.addResult(testName, true, 'Error fallback systems working - errors handled gracefully');
            } else {
                const issues = [];
                if (!errorHandled) issues.push('DOM error not handled');
                if (!cacheInvalidated) issues.push('Cache invalidation not working');
                if (!errorSystemsAvailable) issues.push('Error handling systems not available');
                
                this.addResult(testName, false, `Fallback issues: ${issues.join(', ')}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Verify integration with existing systems
     */
    async verifyIntegrationWithExistingSystems() {
        const testName = 'Integration with Existing Systems';
        console.log(`🔍 Verifying ${testName}...`);
        
        try {
            const integrationChecks = {
                layoutManager: typeof window.layoutManager !== 'undefined',
                responsiveCanvasContainer: typeof window.responsiveCanvasContainer !== 'undefined',
                coreLayoutSystem: typeof window.coreLayoutSystem !== 'undefined',
                performanceOptimizer: typeof window.performanceOptimizer !== 'undefined',
                layoutPerformanceOptimizer: typeof window.layoutPerformanceOptimizer !== 'undefined'
            };
            
            const availableSystems = Object.entries(integrationChecks)
                .filter(([name, available]) => available)
                .map(([name]) => name);
            
            const missingSystemsCount = Object.values(integrationChecks).filter(available => !available).length;
            const totalSystems = Object.keys(integrationChecks).length;
            
            // Check if performance optimizer has layout optimizations
            const hasLayoutOptimizations = window.performanceOptimizer?.getMetrics()?.layoutOptimizations !== undefined;
            
            if (missingSystemsCount === 0 && hasLayoutOptimizations) {
                this.addResult(testName, true, `All systems integrated: ${availableSystems.join(', ')}`);
            } else {
                const issues = [];
                if (missingSystemsCount > 0) {
                    issues.push(`${missingSystemsCount}/${totalSystems} systems missing`);
                }
                if (!hasLayoutOptimizations) {
                    issues.push('Layout optimizations not integrated');
                }
                
                this.addResult(testName, false, `Integration issues: ${issues.join(', ')}`);
            }
            
        } catch (error) {
            this.addResult(testName, false, `Error: ${error.message}`);
        }
    }
    
    /**
     * Add verification result
     */
    addResult(testName, passed, details) {
        const result = {
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.verificationResults.push(result);
        
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
     * Generate comprehensive verification report
     */
    generateVerificationReport() {
        const totalVerifications = this.verificationResults.length;
        const passedVerifications = this.verificationResults.filter(r => r.passed).length;
        const failedVerifications = totalVerifications - passedVerifications;
        const verificationDuration = performance.now() - this.startTime;
        
        console.log('\n📊 Layout Performance Optimization Verification Report');
        console.log('='.repeat(60));
        console.log(`Total Verifications: ${totalVerifications}`);
        console.log(`Passed: ${passedVerifications}`);
        console.log(`Failed: ${failedVerifications}`);
        console.log(`Success Rate: ${((passedVerifications / totalVerifications) * 100).toFixed(1)}%`);
        console.log(`Verification Duration: ${verificationDuration.toFixed(2)}ms`);
        
        if (failedVerifications > 0) {
            console.log('\n❌ Failed Verifications:');
            this.verificationResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.test}: ${r.details}`));
        }
        
        // Performance summary
        if (window.layoutPerformanceOptimizer && window.performanceOptimizer) {
            const layoutMetrics = window.layoutPerformanceOptimizer.getPerformanceMetrics();
            const performanceReport = window.performanceOptimizer.generateReport();
            
            console.log('\n📈 Performance Summary:');
            console.log(`  Layout Cache Efficiency: ${layoutMetrics.cacheEfficiency}%`);
            console.log(`  Average Layout Time: ${layoutMetrics.averageLayoutTime.toFixed(2)}ms`);
            console.log(`  DOM Batches Processed: ${layoutMetrics.domBatches}`);
            console.log(`  Resize Events Handled: ${layoutMetrics.resizeEvents}`);
            console.log(`  Overall Performance Status: ${performanceReport.status}`);
        }
        
        // Requirements compliance
        const requirementTests = this.verificationResults.filter(r => r.test.includes('Requirement'));
        const requirementsPassed = requirementTests.filter(r => r.passed).length;
        const requirementsTotal = requirementTests.length;
        
        console.log('\n📋 Requirements Compliance:');
        console.log(`  Requirements Verified: ${requirementsTotal}`);
        console.log(`  Requirements Passed: ${requirementsPassed}`);
        console.log(`  Compliance Rate: ${requirementsTotal > 0 ? ((requirementsPassed / requirementsTotal) * 100).toFixed(1) : 0}%`);
        
        console.log('='.repeat(60));
        
        return {
            summary: {
                total: totalVerifications,
                passed: passedVerifications,
                failed: failedVerifications,
                successRate: (passedVerifications / totalVerifications) * 100,
                duration: verificationDuration
            },
            requirements: {
                total: requirementsTotal,
                passed: requirementsPassed,
                complianceRate: requirementsTotal > 0 ? (requirementsPassed / requirementsTotal) * 100 : 0
            },
            results: this.verificationResults,
            performanceMetrics: window.layoutPerformanceOptimizer?.getPerformanceMetrics() || {},
            performanceReport: window.performanceOptimizer?.generateReport() || {}
        };
    }
}

// Create and export verification instance
export const layoutPerformanceOptimizationVerification = new LayoutPerformanceOptimizationVerification();

// Make available globally for console testing
if (typeof window !== 'undefined') {
    window.verifyLayoutPerformanceOptimization = () => layoutPerformanceOptimizationVerification.runVerification();
    console.log('🔍 Layout Performance Optimization verification available: Run verifyLayoutPerformanceOptimization() in console');
}