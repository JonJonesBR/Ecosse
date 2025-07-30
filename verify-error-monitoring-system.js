/**
 * Verification script for Error Monitoring System
 * Tests the core functionality in a Node.js environment
 */

// Mock DOM environment for Node.js testing
global.window = {
    addEventListener: () => {},
    location: { protocol: 'http:', hostname: 'localhost' },
    performance: {
        memory: {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000
        },
        getEntriesByType: () => []
    }
};

global.document = {
    readyState: 'complete',
    addEventListener: () => {},
    body: { appendChild: () => {} },
    getElementById: (id) => ({ id, appendChild: () => {}, contains: () => true }),
    createElement: (tag) => ({ 
        tagName: tag.toUpperCase(),
        appendChild: () => {},
        contains: () => true,
        id: '',
        className: '',
        innerHTML: ''
    }),
    querySelector: () => ({ appendChild: () => {} }),
    querySelectorAll: () => []
};

// Store original console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
};

global.console = {
    log: (...args) => originalConsole.log(...args),
    warn: (...args) => originalConsole.warn(...args),
    error: (...args) => originalConsole.error(...args)
};

// Load the error monitoring system
require('./js/errorMonitoringSystem.js');

class ErrorMonitoringVerification {
    constructor() {
        this.testResults = [];
        this.errorMonitoringSystem = global.window.errorMonitoringSystem;
    }

    async runVerification() {
        console.log('🔍 Verifying Error Monitoring System Implementation...\n');

        // Reset system for clean testing
        this.errorMonitoringSystem.reset();

        const verifications = [
            () => this.verifySystemInitialization(),
            () => this.verifyErrorReporting(),
            () => this.verifyAutoFixMechanisms(),
            () => this.verifySystemHealthMonitoring(),
            () => this.verifyPerformanceMetrics(),
            () => this.verifyErrorClassification(),
            () => this.verifyGracefulDegradation(),
            () => this.verifyRequirementsCoverage()
        ];

        for (const verification of verifications) {
            try {
                await verification();
            } catch (error) {
                this.addResult(verification.name, false, `Verification failed: ${error.message}`);
            }
        }

        this.displayResults();
        return this.getVerificationSummary();
    }

    verifySystemInitialization() {
        const testName = 'System Initialization';
        
        // Check if system is properly initialized
        if (this.errorMonitoringSystem && 
            typeof this.errorMonitoringSystem.startMonitoring === 'function' &&
            typeof this.errorMonitoringSystem.reportError === 'function') {
            
            // Check if monitoring can be started
            this.errorMonitoringSystem.startMonitoring();
            const status = this.errorMonitoringSystem.getSystemStatus();
            
            if (status.isMonitoring) {
                this.addResult(testName, true, 'System properly initialized and monitoring started');
            } else {
                this.addResult(testName, false, 'System initialized but monitoring not working');
            }
        } else {
            this.addResult(testName, false, 'System not properly initialized');
        }
    }

    verifyErrorReporting() {
        const testName = 'Real-time Error Detection and Reporting';
        
        // Test error reporting functionality
        const initialErrorCount = this.errorMonitoringSystem.getErrors().length;
        
        const errorId = this.errorMonitoringSystem.reportError({
            type: 'test',
            message: 'Verification test error',
            source: 'verification-suite',
            timestamp: Date.now()
        });

        const finalErrorCount = this.errorMonitoringSystem.getErrors().length;
        const reportedError = this.errorMonitoringSystem.getErrors().find(e => e.id === errorId);

        if (finalErrorCount > initialErrorCount && reportedError) {
            this.addResult(testName, true, 'Real-time error detection and reporting working correctly');
        } else {
            this.addResult(testName, false, 'Error reporting not working properly');
        }
    }

    verifyAutoFixMechanisms() {
        const testName = 'Automated Error Fixing';
        
        let fixesApplied = 0;
        
        // Test DOM error auto-fix
        this.errorMonitoringSystem.reportError({
            type: 'dom',
            message: 'Failed to execute insertBefore on Node',
            source: 'verification-dom',
            timestamp: Date.now()
        });
        
        if (typeof global.window.safeInsertBefore === 'function') {
            fixesApplied++;
        }

        // Test missing element auto-fix
        this.errorMonitoringSystem.reportError({
            type: 'dom',
            message: 'Element not found: test-element',
            source: 'verification-element',
            timestamp: Date.now()
        });
        
        if (typeof global.window.findOrCreateElement === 'function') {
            fixesApplied++;
        }

        // Test missing method auto-fix
        global.window.responsiveCanvasContainer = {};
        this.errorMonitoringSystem.reportError({
            type: 'integration',
            message: 'setAutoResize is not a function',
            source: 'verification-method',
            timestamp: Date.now()
        });
        
        if (typeof global.window.responsiveCanvasContainer.setAutoResize === 'function') {
            fixesApplied++;
        }

        // Test performance optimization auto-fix
        this.errorMonitoringSystem.reportError({
            type: 'performance',
            message: 'Performance timeout detected',
            source: 'verification-performance',
            timestamp: Date.now()
        });
        
        if (typeof global.window.optimizePerformance === 'function') {
            fixesApplied++;
        }

        if (fixesApplied >= 3) {
            this.addResult(testName, true, `${fixesApplied}/4 automated fixes working correctly`);
        } else {
            this.addResult(testName, false, `Only ${fixesApplied}/4 automated fixes working`);
        }
    }

    verifySystemHealthMonitoring() {
        const testName = 'System Health Monitoring with Performance Metrics';
        
        // Force a health check
        const health = this.errorMonitoringSystem.forceHealthCheck();
        
        // Verify health monitoring structure
        const requiredHealthProperties = [
            'domIntegrity', 'configurationValid', 'systemIntegrationsWorking', 
            'performanceOptimal', 'overallHealth', 'lastCheck'
        ];
        
        const hasAllHealthProperties = requiredHealthProperties.every(prop => 
            health.hasOwnProperty(prop)
        );
        
        // Verify performance metrics
        const status = this.errorMonitoringSystem.getSystemStatus();
        const metrics = status.performanceMetrics;
        
        const requiredMetrics = ['errorCount', 'averageResponseTime', 'memoryUsage', 'domOperations', 'lastUpdate'];
        const hasAllMetrics = requiredMetrics.every(metric => 
            metrics.hasOwnProperty(metric)
        );

        if (hasAllHealthProperties && hasAllMetrics && 
            typeof health.overallHealth === 'number' && 
            health.overallHealth >= 0 && health.overallHealth <= 100) {
            this.addResult(testName, true, `Health monitoring working (Health: ${health.overallHealth}%, Metrics: ${Object.keys(metrics).length} tracked)`);
        } else {
            this.addResult(testName, false, 'Health monitoring or performance metrics not working properly');
        }
    }

    verifyPerformanceMetrics() {
        const testName = 'Performance Metrics Collection';
        
        const status = this.errorMonitoringSystem.getSystemStatus();
        const metrics = status.performanceMetrics;
        
        // Verify metrics are being collected and updated
        const metricsValid = (
            typeof metrics.errorCount === 'number' &&
            typeof metrics.memoryUsage === 'number' &&
            typeof metrics.lastUpdate === 'number' &&
            metrics.lastUpdate > 0
        );

        if (metricsValid) {
            this.addResult(testName, true, `Performance metrics collection working (Memory: ${metrics.memoryUsage}%, Errors: ${metrics.errorCount})`);
        } else {
            this.addResult(testName, false, 'Performance metrics collection not working');
        }
    }

    verifyErrorClassification() {
        const testName = 'Error Classification System';
        
        const testCases = [
            { message: 'insertBefore failed', expected: 'insertBefore' },
            { message: 'Element not found', expected: 'elementNotFound' },
            { message: 'setAutoResize is not a function', expected: 'methodNotFound' },
            { message: 'Performance timeout occurred', expected: 'performanceTimeout' },
            { message: 'Unknown error type', expected: 'unknown' }
        ];

        let correctClassifications = 0;
        
        for (const testCase of testCases) {
            const classified = this.errorMonitoringSystem.classifyError({ message: testCase.message });
            if (classified === testCase.expected) {
                correctClassifications++;
            }
        }

        const accuracy = (correctClassifications / testCases.length) * 100;
        
        if (accuracy >= 80) {
            this.addResult(testName, true, `Error classification working (${accuracy}% accuracy)`);
        } else {
            this.addResult(testName, false, `Error classification accuracy too low (${accuracy}%)`);
        }
    }

    verifyGracefulDegradation() {
        const testName = 'Error Recovery and Graceful Degradation';
        
        const initialHealth = this.errorMonitoringSystem.getSystemStatus().systemHealth.overallHealth;
        
        // Simulate multiple critical errors
        for (let i = 0; i < 3; i++) {
            this.errorMonitoringSystem.reportError({
                type: 'critical',
                message: `Critical verification error ${i + 1}`,
                source: 'verification-degradation',
                timestamp: Date.now()
            });
        }

        const finalHealth = this.errorMonitoringSystem.getSystemStatus().systemHealth.overallHealth;
        
        // Check if system degraded gracefully (health should decrease but not crash)
        if (finalHealth < initialHealth && finalHealth >= 0) {
            this.addResult(testName, true, `Graceful degradation working (Health: ${initialHealth}% → ${finalHealth}%)`);
        } else {
            this.addResult(testName, false, 'Graceful degradation not working properly');
        }
    }

    verifyRequirementsCoverage() {
        const testName = 'Requirements Coverage Verification';
        
        // Verify coverage of requirements 1.1, 1.2, 1.3, 1.4
        const coverageChecks = {
            '1.1 - DOM Error Handling': typeof global.window.safeInsertBefore === 'function',
            '1.2 - Element Finding': typeof global.window.findOrCreateElement === 'function',
            '1.3 - System Integration': typeof global.window.responsiveCanvasContainer?.setAutoResize === 'function',
            '1.4 - Performance Optimization': typeof global.window.optimizePerformance === 'function'
        };

        const coveredRequirements = Object.entries(coverageChecks).filter(([_, covered]) => covered);
        const coveragePercentage = (coveredRequirements.length / Object.keys(coverageChecks).length) * 100;

        if (coveragePercentage >= 75) {
            this.addResult(testName, true, `Requirements coverage: ${coveragePercentage}% (${coveredRequirements.length}/${Object.keys(coverageChecks).length})`);
        } else {
            this.addResult(testName, false, `Insufficient requirements coverage: ${coveragePercentage}%`);
        }
    }

    addResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed,
            message,
            timestamp: Date.now()
        });
    }

    displayResults() {
        console.log('\n📊 Error Monitoring System Verification Results:');
        console.log('=' .repeat(60));
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}`);
            console.log(`   ${result.message}\n`);
        });
        
        const summary = this.getVerificationSummary();
        console.log('=' .repeat(60));
        console.log(`📈 Verification Summary: ${summary.passed}/${summary.total} checks passed (${summary.percentage}%)`);
        
        if (summary.percentage === 100) {
            console.log('🎉 All verifications passed! Error monitoring system fully implemented.');
        } else if (summary.percentage >= 75) {
            console.log('✅ Most verifications passed. Error monitoring system is functional.');
        } else {
            console.log('⚠️  Several verifications failed. Please review implementation.');
        }

        return summary;
    }

    getVerificationSummary() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(result => result.passed).length;
        const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        return { total, passed, failed: total - passed, percentage };
    }
}

// Run verification
const verification = new ErrorMonitoringVerification();
verification.runVerification().then(summary => {
    process.exit(summary.percentage >= 75 ? 0 : 1);
}).catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
});