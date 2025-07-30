/**
 * Test suite for Error Monitoring System
 * Tests real-time error detection, system health monitoring, and automated error recovery
 */

class ErrorMonitoringSystemTest {
    constructor() {
        this.testResults = [];
        this.errorMonitoringSystem = window.errorMonitoringSystem;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Error Monitoring System Tests...');
        
        // Reset system before testing
        this.errorMonitoringSystem.reset();
        
        const tests = [
            () => this.testErrorReporting(),
            () => this.testAutoFixDOMErrors(),
            () => this.testAutoFixMissingElements(),
            () => this.testAutoFixMissingMethods(),
            () => this.testPerformanceOptimization(),
            () => this.testSystemHealthMonitoring(),
            () => this.testErrorClassification(),
            () => this.testGracefulDegradation(),
            () => this.testPerformanceMetrics(),
            () => this.testErrorFiltering()
        ];

        for (const test of tests) {
            try {
                await test();
            } catch (error) {
                this.addTestResult(test.name, false, `Test failed: ${error.message}`);
            }
        }

        this.displayResults();
        return this.getTestSummary();
    }

    /**
     * Test error reporting functionality
     */
    testErrorReporting() {
        const testName = 'Error Reporting';
        
        // Report a test error
        const errorId = this.errorMonitoringSystem.reportError({
            type: 'test',
            message: 'Test error message',
            source: 'test-suite',
            timestamp: Date.now()
        });

        // Verify error was recorded
        const errors = this.errorMonitoringSystem.getErrors();
        const reportedError = errors.find(e => e.id === errorId);

        if (reportedError && reportedError.message === 'Test error message') {
            this.addTestResult(testName, true, 'Error successfully reported and recorded');
        } else {
            this.addTestResult(testName, false, 'Error was not properly reported');
        }
    }

    /**
     * Test automatic DOM error fixing
     */
    testAutoFixDOMErrors() {
        const testName = 'Auto-fix DOM Errors';
        
        // Simulate DOM insertion error
        const errorId = this.errorMonitoringSystem.reportError({
            type: 'dom',
            message: 'Failed to execute insertBefore on Node',
            source: 'dom-test',
            timestamp: Date.now()
        });

        // Check if safeInsertBefore utility was created
        if (typeof window.safeInsertBefore === 'function') {
            // Test the safe insertion utility
            const testDiv = document.createElement('div');
            const parentDiv = document.createElement('div');
            const result = window.safeInsertBefore(testDiv, null, parentDiv);
            
            if (result && parentDiv.contains(testDiv)) {
                this.addTestResult(testName, true, 'DOM error auto-fix working correctly');
            } else {
                this.addTestResult(testName, false, 'DOM error auto-fix created but not working');
            }
        } else {
            this.addTestResult(testName, false, 'DOM error auto-fix not created');
        }
    }

    /**
     * Test automatic missing element fixing
     */
    testAutoFixMissingElements() {
        const testName = 'Auto-fix Missing Elements';
        
        // Simulate missing element error
        this.errorMonitoringSystem.reportError({
            type: 'dom',
            message: 'Element not found: test-element',
            source: 'element-test',
            timestamp: Date.now()
        });

        // Check if findOrCreateElement utility was created
        if (typeof window.findOrCreateElement === 'function') {
            // Test the utility
            const element = window.findOrCreateElement('test-missing-element', {
                tagName: 'div',
                className: 'test-class'
            });
            
            if (element && element.id === 'test-missing-element' && element.className === 'test-class') {
                this.addTestResult(testName, true, 'Missing element auto-fix working correctly');
            } else {
                this.addTestResult(testName, false, 'Missing element auto-fix created but not working');
            }
        } else {
            this.addTestResult(testName, false, 'Missing element auto-fix not created');
        }
    }

    /**
     * Test automatic missing method fixing
     */
    testAutoFixMissingMethods() {
        const testName = 'Auto-fix Missing Methods';
        
        // Create a test object to simulate responsiveCanvasContainer
        window.responsiveCanvasContainer = {};
        
        // Simulate missing method error
        this.errorMonitoringSystem.reportError({
            type: 'integration',
            message: 'setAutoResize is not a function',
            source: 'method-test',
            timestamp: Date.now()
        });

        // Check if method was added
        if (typeof window.responsiveCanvasContainer.setAutoResize === 'function') {
            // Test the stub method
            const result = window.responsiveCanvasContainer.setAutoResize();
            
            if (result === true) {
                this.addTestResult(testName, true, 'Missing method auto-fix working correctly');
            } else {
                this.addTestResult(testName, false, 'Missing method auto-fix created but not working');
            }
        } else {
            this.addTestResult(testName, false, 'Missing method auto-fix not created');
        }
    }

    /**
     * Test performance optimization
     */
    testPerformanceOptimization() {
        const testName = 'Performance Optimization';
        
        // Simulate performance timeout error
        this.errorMonitoringSystem.reportError({
            type: 'performance',
            message: 'Performance timeout detected',
            source: 'performance-test',
            timestamp: Date.now()
        });

        // Check if optimization utility was created
        if (typeof window.optimizePerformance === 'function') {
            this.addTestResult(testName, true, 'Performance optimization auto-fix created');
        } else {
            this.addTestResult(testName, false, 'Performance optimization auto-fix not created');
        }
    }

    /**
     * Test system health monitoring
     */
    testSystemHealthMonitoring() {
        const testName = 'System Health Monitoring';
        
        // Force a health check
        const health = this.errorMonitoringSystem.forceHealthCheck();
        
        // Verify health object structure
        const requiredProperties = ['domIntegrity', 'configurationValid', 'systemIntegrationsWorking', 'performanceOptimal', 'overallHealth', 'lastCheck'];
        const hasAllProperties = requiredProperties.every(prop => health.hasOwnProperty(prop));
        
        if (hasAllProperties && typeof health.overallHealth === 'number' && health.overallHealth >= 0 && health.overallHealth <= 100) {
            this.addTestResult(testName, true, `System health monitoring working (Health: ${health.overallHealth}%)`);
        } else {
            this.addTestResult(testName, false, 'System health monitoring not working properly');
        }
    }

    /**
     * Test error classification
     */
    testErrorClassification() {
        const testName = 'Error Classification';
        
        const testCases = [
            { message: 'insertBefore failed', expectedType: 'insertBefore' },
            { message: 'Element not found', expectedType: 'elementNotFound' },
            { message: 'setAutoResize is not a function', expectedType: 'methodNotFound' },
            { message: 'Performance timeout occurred', expectedType: 'performanceTimeout' }
        ];

        let correctClassifications = 0;
        
        for (const testCase of testCases) {
            const classified = this.errorMonitoringSystem.classifyError({ message: testCase.message });
            if (classified === testCase.expectedType) {
                correctClassifications++;
            }
        }

        if (correctClassifications === testCases.length) {
            this.addTestResult(testName, true, 'All error classifications correct');
        } else {
            this.addTestResult(testName, false, `${correctClassifications}/${testCases.length} classifications correct`);
        }
    }

    /**
     * Test graceful degradation
     */
    testGracefulDegradation() {
        const testName = 'Graceful Degradation';
        
        // Simulate multiple critical errors
        for (let i = 0; i < 3; i++) {
            this.errorMonitoringSystem.reportError({
                type: 'critical',
                message: `Critical error ${i + 1}`,
                source: 'degradation-test',
                timestamp: Date.now()
            });
        }

        // Check if system health degraded gracefully
        const health = this.errorMonitoringSystem.getSystemStatus().systemHealth;
        
        if (health.overallHealth < 100 && health.overallHealth >= 0) {
            this.addTestResult(testName, true, `System degraded gracefully (Health: ${health.overallHealth}%)`);
        } else {
            this.addTestResult(testName, false, 'System did not degrade gracefully');
        }
    }

    /**
     * Test performance metrics
     */
    testPerformanceMetrics() {
        const testName = 'Performance Metrics';
        
        const status = this.errorMonitoringSystem.getSystemStatus();
        const metrics = status.performanceMetrics;
        
        const requiredMetrics = ['errorCount', 'averageResponseTime', 'memoryUsage', 'domOperations', 'lastUpdate'];
        const hasAllMetrics = requiredMetrics.every(metric => metrics.hasOwnProperty(metric));
        
        if (hasAllMetrics && typeof metrics.errorCount === 'number') {
            this.addTestResult(testName, true, 'Performance metrics collection working');
        } else {
            this.addTestResult(testName, false, 'Performance metrics collection not working');
        }
    }

    /**
     * Test error filtering
     */
    testErrorFiltering() {
        const testName = 'Error Filtering';
        
        // Add errors with different severities
        this.errorMonitoringSystem.reportError({
            type: 'test',
            message: 'Critical test error',
            source: 'filter-test',
            timestamp: Date.now()
        });

        // Test filtering by severity
        const criticalErrors = this.errorMonitoringSystem.getErrors({ severity: 'critical' });
        const allErrors = this.errorMonitoringSystem.getErrors();
        
        if (criticalErrors.length > 0 && allErrors.length >= criticalErrors.length) {
            this.addTestResult(testName, true, 'Error filtering working correctly');
        } else {
            this.addTestResult(testName, false, 'Error filtering not working');
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed,
            message,
            timestamp: Date.now()
        });
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n📊 Error Monitoring System Test Results:');
        console.log('=' .repeat(50));
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}: ${result.message}`);
        });
        
        const summary = this.getTestSummary();
        console.log('=' .repeat(50));
        console.log(`📈 Summary: ${summary.passed}/${summary.total} tests passed (${summary.percentage}%)`);
        
        if (summary.percentage === 100) {
            console.log('🎉 All tests passed! Error monitoring system is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the error monitoring system implementation.');
        }
    }

    /**
     * Get test summary
     */
    getTestSummary() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(result => result.passed).length;
        const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        return { total, passed, failed: total - passed, percentage };
    }
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
    window.errorMonitoringSystemTest = new ErrorMonitoringSystemTest();
    
    // Run tests after a short delay to ensure error monitoring system is initialized
    setTimeout(() => {
        window.errorMonitoringSystemTest.runAllTests();
    }, 1000);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorMonitoringSystemTest;
}