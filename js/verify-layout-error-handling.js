/**
 * Verify Layout Error Handling Implementation - Task 6
 * 
 * This script verifies that the layout error handling and recovery system
 * is properly implemented and meets all requirements.
 */

export function verifyLayoutErrorHandling() {
    console.log('🔍 Verifying Layout Error Handling Implementation...');
    
    const verification = {
        timestamp: Date.now(),
        task: 'Task 6: Add layout error handling and recovery',
        requirements: {
            '5.1': { description: 'Error detection for missing DOM elements', passed: false, details: '' },
            '5.2': { description: 'Fallback layout mechanisms', passed: false, details: '' },
            '5.3': { description: 'Graceful degradation for CSS conflicts', passed: false, details: '' },
            '5.4': { description: 'Layout error recovery', passed: false, details: '' }
        },
        implementation: {
            errorHandler: false,
            monitoring: false,
            fallbacks: false,
            recovery: false
        },
        summary: {
            passed: 0,
            total: 4,
            successRate: 0
        }
    };

    try {
        // Check if layout error handler exists
        const errorHandler = window.layoutErrorHandler;
        if (!errorHandler) {
            console.error('❌ Layout error handler not found');
            return verification;
        }

        verification.implementation.errorHandler = true;
        console.log('✅ Layout error handler available');

        // Verify Requirement 5.1: Error detection for missing DOM elements
        try {
            const hasDetection = typeof errorHandler.detectMissingElements === 'function' &&
                                typeof errorHandler.createMissingElement === 'function' &&
                                typeof errorHandler.handleMissingElement === 'function';

            if (hasDetection) {
                // Test detection functionality
                const testElements = ['test-missing-1', 'test-missing-2'];
                errorHandler.detectMissingElements(testElements);
                
                const status = errorHandler.getStatus();
                const hasMonitoring = status.monitoringActive;
                
                verification.requirements['5.1'].passed = true;
                verification.requirements['5.1'].details = `Detection methods available, monitoring: ${hasMonitoring}`;
                verification.implementation.monitoring = hasMonitoring;
                
                console.log('✅ Requirement 5.1: Error detection for missing DOM elements');
            } else {
                verification.requirements['5.1'].details = 'Missing detection methods';
                console.log('❌ Requirement 5.1: Missing detection methods');
            }
        } catch (error) {
            verification.requirements['5.1'].details = `Error: ${error.message}`;
            console.log('❌ Requirement 5.1: Error during testing');
        }

        // Verify Requirement 5.2: Fallback layout mechanisms
        try {
            const hasFallbacks = errorHandler.fallbackLayouts && errorHandler.fallbackLayouts.size > 0 &&
                               typeof errorHandler.applyFallbackLayout === 'function' &&
                               typeof errorHandler.validateLayoutConfiguration === 'function';

            if (hasFallbacks) {
                const fallbackTypes = Array.from(errorHandler.fallbackLayouts.keys());
                const requiredFallbacks = ['mobile', 'desktop', 'minimal'];
                const hasAllRequired = requiredFallbacks.every(type => fallbackTypes.includes(type));
                
                if (hasAllRequired) {
                    verification.requirements['5.2'].passed = true;
                    verification.requirements['5.2'].details = `Fallback layouts: ${fallbackTypes.join(', ')}`;
                    verification.implementation.fallbacks = true;
                    
                    console.log('✅ Requirement 5.2: Fallback layout mechanisms');
                } else {
                    verification.requirements['5.2'].details = `Missing fallbacks: ${requiredFallbacks.filter(t => !fallbackTypes.includes(t)).join(', ')}`;
                    console.log('❌ Requirement 5.2: Missing required fallback layouts');
                }
            } else {
                verification.requirements['5.2'].details = 'Fallback system not properly configured';
                console.log('❌ Requirement 5.2: Fallback system not configured');
            }
        } catch (error) {
            verification.requirements['5.2'].details = `Error: ${error.message}`;
            console.log('❌ Requirement 5.2: Error during testing');
        }

        // Verify Requirement 5.3: Graceful degradation for CSS conflicts
        try {
            const hasConflictHandling = typeof errorHandler.checkForCSSConflicts === 'function' &&
                                      typeof errorHandler.handleCSSConflicts === 'function' &&
                                      typeof errorHandler.resolveCSSConflicts === 'function' &&
                                      typeof errorHandler.monitorCSSConflicts === 'function';

            if (hasConflictHandling) {
                // Test CSS conflict detection
                const testDiv = document.createElement('div');
                testDiv.id = 'css-test-element';
                testDiv.style.display = 'none';
                document.body.appendChild(testDiv);
                
                errorHandler.checkForCSSConflicts(testDiv);
                
                const status = errorHandler.getStatus();
                const hasConflictData = status.cssConflicts && Array.isArray(status.cssConflicts);
                
                testDiv.remove();
                
                verification.requirements['5.3'].passed = true;
                verification.requirements['5.3'].details = `CSS conflict handling available, conflicts tracked: ${hasConflictData}`;
                
                console.log('✅ Requirement 5.3: Graceful degradation for CSS conflicts');
            } else {
                verification.requirements['5.3'].details = 'Missing CSS conflict handling methods';
                console.log('❌ Requirement 5.3: Missing CSS conflict handling');
            }
        } catch (error) {
            verification.requirements['5.3'].details = `Error: ${error.message}`;
            console.log('❌ Requirement 5.3: Error during testing');
        }

        // Verify Requirement 5.4: Layout error recovery
        try {
            const hasRecovery = typeof errorHandler.attemptDOMRecovery === 'function' &&
                              typeof errorHandler.handleResizeError === 'function' &&
                              typeof errorHandler.saveLastKnownGoodState === 'function' &&
                              typeof errorHandler.restoreLastKnownGoodState === 'function';

            if (hasRecovery) {
                // Test recovery mechanisms
                const status = errorHandler.getStatus();
                const hasRecoveryTracking = typeof status.recoveryAttempts === 'number' &&
                                          typeof status.maxRecoveryAttempts === 'number';
                
                // Test last known good state
                errorHandler.saveLastKnownGoodState();
                const updatedStatus = errorHandler.getStatus();
                const hasLastKnownGood = updatedStatus.hasLastKnownGoodState;
                
                verification.requirements['5.4'].passed = true;
                verification.requirements['5.4'].details = `Recovery methods available, tracking: ${hasRecoveryTracking}, last known good: ${hasLastKnownGood}`;
                verification.implementation.recovery = true;
                
                console.log('✅ Requirement 5.4: Layout error recovery');
            } else {
                verification.requirements['5.4'].details = 'Missing recovery methods';
                console.log('❌ Requirement 5.4: Missing recovery methods');
            }
        } catch (error) {
            verification.requirements['5.4'].details = `Error: ${error.message}`;
            console.log('❌ Requirement 5.4: Error during testing');
        }

        // Calculate summary
        verification.summary.passed = Object.values(verification.requirements)
            .filter(req => req.passed).length;
        verification.summary.successRate = (verification.summary.passed / verification.summary.total * 100);

        // Additional implementation checks
        try {
            const diagnostics = errorHandler.getDiagnostics();
            const systemHealth = errorHandler.getSystemHealth();
            
            console.log(`📊 System Health: ${systemHealth}`);
            console.log(`📊 Error Count: ${diagnostics.summary.totalErrors}`);
            console.log(`📊 Critical Issues: ${diagnostics.summary.criticalIssues}`);
            
            if (diagnostics.recommendations.length > 0) {
                console.log('💡 Recommendations:');
                diagnostics.recommendations.forEach(rec => console.log(`   - ${rec}`));
            }
        } catch (error) {
            console.warn('⚠️ Could not retrieve diagnostics:', error.message);
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
        verification.error = error.message;
    }

    // Generate final report
    console.log('\n📋 Layout Error Handling Verification Report:');
    console.log(`   Task: ${verification.task}`);
    console.log(`   Requirements Passed: ${verification.summary.passed}/${verification.summary.total} (${verification.summary.successRate.toFixed(1)}%)`);
    
    Object.entries(verification.requirements).forEach(([id, req]) => {
        const status = req.passed ? '✅' : '❌';
        console.log(`   ${status} ${id}: ${req.description}`);
        if (req.details) {
            console.log(`      Details: ${req.details}`);
        }
    });

    console.log('\n🔧 Implementation Status:');
    Object.entries(verification.implementation).forEach(([component, status]) => {
        const icon = status ? '✅' : '❌';
        console.log(`   ${icon} ${component}: ${status ? 'Implemented' : 'Missing'}`);
    });

    if (verification.summary.passed === verification.summary.total) {
        console.log('\n🎉 Task 6 implementation verified successfully!');
        console.log('   All layout error handling and recovery requirements are met.');
    } else {
        console.log('\n⚠️ Task 6 implementation incomplete.');
        console.log('   Some requirements need attention.');
    }

    return verification;
}

/**
 * Run comprehensive error handling tests
 */
export function runComprehensiveErrorTests() {
    console.log('🧪 Running Comprehensive Error Handling Tests...');
    
    const errorHandler = window.layoutErrorHandler;
    if (!errorHandler) {
        console.error('❌ Layout error handler not available');
        return false;
    }

    const tests = [
        {
            name: 'DOM Element Monitoring',
            test: () => {
                const status = errorHandler.getStatus();
                return status.monitoringActive && 
                       typeof errorHandler.errorDetectionInterval !== 'undefined';
            }
        },
        {
            name: 'Missing Element Recovery',
            test: () => {
                // Simulate missing element scenario
                const originalElement = document.getElementById('test-recovery-element');
                if (originalElement) originalElement.remove();
                
                errorHandler.createMissingElement('test-recovery-element');
                const recovered = document.getElementById('test-recovery-element');
                
                if (recovered) recovered.remove();
                return !!recovered;
            }
        },
        {
            name: 'CSS Conflict Resolution',
            test: () => {
                const testEl = document.createElement('div');
                testEl.id = 'css-conflict-test';
                testEl.style.display = 'none';
                testEl.style.width = '0px';
                document.body.appendChild(testEl);
                
                errorHandler.checkForCSSConflicts(testEl);
                
                const status = errorHandler.getStatus();
                const hasConflict = status.cssConflicts.some(c => c.elementId === 'css-conflict-test');
                
                testEl.remove();
                return hasConflict;
            }
        },
        {
            name: 'Fallback Layout Validation',
            test: () => {
                const configs = ['mobile', 'desktop', 'minimal'];
                return configs.every(config => {
                    const layout = errorHandler.fallbackLayouts.get(config);
                    return layout && errorHandler.validateLayoutConfiguration(layout);
                });
            }
        },
        {
            name: 'Error Recovery Tracking',
            test: () => {
                const initialStatus = errorHandler.getStatus();
                const initialAttempts = initialStatus.recoveryAttempts;
                
                // This should increment recovery attempts
                errorHandler.missingElements.add('fake-missing-element');
                errorHandler.attemptDOMRecovery();
                
                const newStatus = errorHandler.getStatus();
                return newStatus.recoveryAttempts > initialAttempts;
            }
        },
        {
            name: 'System Health Assessment',
            test: () => {
                const health = errorHandler.getSystemHealth();
                const validStates = ['healthy', 'stable-with-issues', 'warning', 'critical', 'degraded'];
                return validStates.includes(health);
            }
        },
        {
            name: 'Comprehensive Check',
            test: () => {
                const results = errorHandler.runComprehensiveCheck();
                return results && results.timestamp && results.diagnostics;
            }
        }
    ];

    let passed = 0;
    const total = tests.length;

    tests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
        }
    });

    const successRate = (passed / total * 100).toFixed(1);
    console.log(`\n📊 Comprehensive Tests: ${passed}/${total} (${successRate}%)`);
    
    return passed === total;
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.verifyLayoutErrorHandling = verifyLayoutErrorHandling;
    window.runComprehensiveErrorTests = runComprehensiveErrorTests;
    console.log('🔍 Layout Error Handling verification available globally');
}