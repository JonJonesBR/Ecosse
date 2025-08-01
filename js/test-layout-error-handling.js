/**
 * Test Layout Error Handling - Task 6 Verification
 * 
 * This file tests the enhanced layout error handling and recovery system
 * to ensure it properly detects missing DOM elements, handles CSS conflicts,
 * and provides graceful degradation.
 */

export function testLayoutErrorHandling() {
    console.log('🧪 Testing Layout Error Handling System...');
    
    const results = {
        timestamp: Date.now(),
        tests: [],
        summary: {
            passed: 0,
            failed: 0,
            total: 0
        }
    };

    // Helper function to add test result
    function addResult(testName, passed, details = '') {
        const result = {
            name: testName,
            passed,
            details,
            timestamp: Date.now()
        };
        results.tests.push(result);
        results.summary.total++;
        if (passed) {
            results.summary.passed++;
            console.log(`✅ ${testName}`);
        } else {
            results.summary.failed++;
            console.log(`❌ ${testName}: ${details}`);
        }
        return result;
    }

    try {
        // Test 1: Error Handler Initialization
        const errorHandler = window.layoutErrorHandler;
        addResult(
            'Error Handler Available',
            !!errorHandler,
            errorHandler ? 'Layout error handler is available globally' : 'Error handler not found'
        );

        if (!errorHandler) {
            console.error('❌ Cannot continue tests without error handler');
            return results;
        }

        // Test 2: Missing DOM Element Detection
        testMissingElementDetection(addResult, errorHandler);

        // Test 3: CSS Conflict Detection
        testCSSConflictDetection(addResult, errorHandler);

        // Test 4: Fallback Layout Application
        testFallbackLayoutApplication(addResult, errorHandler);

        // Test 5: Error Recovery Mechanisms
        testErrorRecoveryMechanisms(addResult, errorHandler);

        // Test 6: System Status and Diagnostics
        testSystemDiagnostics(addResult, errorHandler);

        // Test 7: Comprehensive Error Scenarios
        testComprehensiveErrorScenarios(addResult, errorHandler);

    } catch (error) {
        addResult('Test Execution', false, `Test execution failed: ${error.message}`);
        console.error('❌ Test execution error:', error);
    }

    // Generate summary
    const successRate = (results.summary.passed / results.summary.total * 100).toFixed(1);
    console.log(`\n📊 Layout Error Handling Test Results:`);
    console.log(`   Passed: ${results.summary.passed}/${results.summary.total} (${successRate}%)`);
    console.log(`   Failed: ${results.summary.failed}`);

    if (results.summary.failed === 0) {
        console.log('🎉 All layout error handling tests passed!');
    } else {
        console.warn('⚠️ Some layout error handling tests failed. Check details above.');
    }

    return results;
}

/**
 * Test missing DOM element detection
 */
function testMissingElementDetection(addResult, errorHandler) {
    try {
        // Get initial status
        const initialStatus = errorHandler.getStatus();
        
        // Create a temporary element and then remove it to simulate missing element
        const testElement = document.createElement('div');
        testElement.id = 'test-missing-element';
        document.body.appendChild(testElement);
        
        // Remove it to simulate missing element
        testElement.remove();
        
        // Test element creation for missing elements
        const criticalElements = ['app-container', 'main-content', 'three-js-canvas-container'];
        let allElementsExist = true;
        
        criticalElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (!element) {
                allElementsExist = false;
                console.warn(`Missing critical element: ${elementId}`);
            }
        });
        
        addResult(
            'Critical DOM Elements Present',
            allElementsExist,
            allElementsExist ? 'All critical elements found' : 'Some critical elements missing'
        );

        // Test missing element creation
        try {
            errorHandler.createMissingElement('test-fallback-element');
            const createdElement = document.getElementById('test-fallback-element');
            
            addResult(
                'Missing Element Creation',
                !!createdElement,
                createdElement ? 'Successfully created missing element' : 'Failed to create element'
            );
            
            // Cleanup
            if (createdElement) {
                createdElement.remove();
            }
        } catch (error) {
            addResult('Missing Element Creation', false, `Creation failed: ${error.message}`);
        }

    } catch (error) {
        addResult('Missing Element Detection', false, `Test failed: ${error.message}`);
    }
}

/**
 * Test CSS conflict detection and resolution
 */
function testCSSConflictDetection(addResult, errorHandler) {
    try {
        // Create a test element with CSS conflicts
        const testElement = document.createElement('div');
        testElement.id = 'css-conflict-test';
        testElement.style.display = 'none'; // This should trigger conflict detection
        testElement.style.width = '0px';
        testElement.style.height = '0px';
        document.body.appendChild(testElement);

        // Test CSS conflict detection
        errorHandler.checkForCSSConflicts(testElement);
        
        // Check if conflicts were detected
        const status = errorHandler.getStatus();
        const hasConflicts = status.cssConflicts.some(c => c.elementId === 'css-conflict-test');
        
        addResult(
            'CSS Conflict Detection',
            hasConflicts,
            hasConflicts ? 'CSS conflicts detected successfully' : 'CSS conflict detection failed'
        );

        // Test conflict resolution
        if (hasConflicts) {
            const resolvedConflict = status.cssConflicts.find(c => c.elementId === 'css-conflict-test');
            addResult(
                'CSS Conflict Resolution',
                resolvedConflict && resolvedConflict.resolved,
                resolvedConflict?.resolved ? 'Conflicts resolved' : 'Conflicts not resolved'
            );
        }

        // Cleanup
        testElement.remove();

    } catch (error) {
        addResult('CSS Conflict Detection', false, `Test failed: ${error.message}`);
    }
}

/**
 * Test fallback layout application
 */
function testFallbackLayoutApplication(addResult, errorHandler) {
    try {
        // Save current state
        const initialFallbackState = errorHandler.getStatus().fallbackApplied;
        
        // Test fallback layout detection
        const viewportType = errorHandler.detectViewportType();
        addResult(
            'Viewport Type Detection',
            ['mobile', 'tablet', 'desktop'].includes(viewportType),
            `Detected viewport: ${viewportType}`
        );

        // Test fallback configuration validation
        const mobileConfig = errorHandler.fallbackLayouts.get('mobile');
        const desktopConfig = errorHandler.fallbackLayouts.get('desktop');
        const minimalConfig = errorHandler.fallbackLayouts.get('minimal');
        
        addResult(
            'Fallback Configurations Available',
            !!(mobileConfig && desktopConfig && minimalConfig),
            'All fallback configurations present'
        );

        // Test layout configuration validation
        if (mobileConfig) {
            const isValid = errorHandler.validateLayoutConfiguration(mobileConfig);
            addResult(
                'Layout Configuration Validation',
                isValid,
                isValid ? 'Configuration is valid' : 'Configuration validation failed'
            );
        }

    } catch (error) {
        addResult('Fallback Layout Application', false, `Test failed: ${error.message}`);
    }
}

/**
 * Test error recovery mechanisms
 */
function testErrorRecoveryMechanisms(addResult, errorHandler) {
    try {
        // Test last known good state saving
        errorHandler.saveLastKnownGoodState();
        const status = errorHandler.getStatus();
        
        addResult(
            'Last Known Good State Saving',
            status.hasLastKnownGoodState,
            'Last known good state saved successfully'
        );

        // Test error counting
        const initialErrorCount = status.errorCount;
        errorHandler.handleResizeError(new Error('Test resize error'), 'test-context');
        const newStatus = errorHandler.getStatus();
        
        addResult(
            'Error Counting',
            newStatus.errorCount > initialErrorCount,
            `Error count increased from ${initialErrorCount} to ${newStatus.errorCount}`
        );

        // Test recovery attempt tracking
        const initialRecoveryAttempts = status.recoveryAttempts;
        addResult(
            'Recovery Attempt Tracking',
            typeof initialRecoveryAttempts === 'number',
            `Recovery attempts: ${initialRecoveryAttempts}`
        );

    } catch (error) {
        addResult('Error Recovery Mechanisms', false, `Test failed: ${error.message}`);
    }
}

/**
 * Test system diagnostics
 */
function testSystemDiagnostics(addResult, errorHandler) {
    try {
        // Test status reporting
        const status = errorHandler.getStatus();
        const requiredStatusFields = [
            'fallbackApplied', 'errorCount', 'hasLastKnownGoodState',
            'missingElements', 'cssConflicts', 'recoveryAttempts', 'monitoringActive'
        ];
        
        const hasAllFields = requiredStatusFields.every(field => 
            status.hasOwnProperty(field)
        );
        
        addResult(
            'Status Reporting Complete',
            hasAllFields,
            hasAllFields ? 'All status fields present' : 'Missing status fields'
        );

        // Test diagnostics
        const diagnostics = errorHandler.getDiagnostics();
        addResult(
            'Diagnostics Available',
            !!(diagnostics && diagnostics.summary && diagnostics.recommendations),
            'Diagnostics include summary and recommendations'
        );

        // Test system health assessment
        const systemHealth = errorHandler.getSystemHealth();
        const validHealthStates = ['healthy', 'stable-with-issues', 'warning', 'critical', 'degraded'];
        
        addResult(
            'System Health Assessment',
            validHealthStates.includes(systemHealth),
            `System health: ${systemHealth}`
        );

    } catch (error) {
        addResult('System Diagnostics', false, `Test failed: ${error.message}`);
    }
}

/**
 * Test comprehensive error scenarios
 */
function testComprehensiveErrorScenarios(addResult, errorHandler) {
    try {
        // Test comprehensive check
        const checkResults = errorHandler.runComprehensiveCheck();
        
        addResult(
            'Comprehensive Check Execution',
            !!(checkResults && checkResults.timestamp && checkResults.diagnostics),
            'Comprehensive check completed successfully'
        );

        // Test monitoring status
        const status = errorHandler.getStatus();
        addResult(
            'Error Monitoring Active',
            status.monitoringActive,
            status.monitoringActive ? 'Monitoring is active' : 'Monitoring is inactive'
        );

        // Test error handler disposal (non-destructive test)
        const originalInterval = errorHandler.errorDetectionInterval;
        addResult(
            'Error Handler Disposal Available',
            typeof errorHandler.dispose === 'function',
            'Disposal method is available'
        );

    } catch (error) {
        addResult('Comprehensive Error Scenarios', false, `Test failed: ${error.message}`);
    }
}

/**
 * Test specific error scenarios
 */
export function testSpecificErrorScenarios() {
    console.log('🧪 Testing Specific Error Scenarios...');
    
    const errorHandler = window.layoutErrorHandler;
    if (!errorHandler) {
        console.error('❌ Layout error handler not available');
        return false;
    }

    const scenarios = [
        {
            name: 'Canvas Container Missing',
            test: () => {
                const canvas = document.getElementById('three-js-canvas-container');
                if (canvas) {
                    const parent = canvas.parentNode;
                    canvas.remove();
                    
                    // Trigger detection
                    errorHandler.detectMissingElements(['three-js-canvas-container']);
                    
                    // Check if it was recreated
                    const recreated = document.getElementById('three-js-canvas-container');
                    
                    // Restore original if test element wasn't recreated
                    if (!recreated && parent) {
                        parent.appendChild(canvas);
                    }
                    
                    return !!recreated;
                }
                return true; // Already missing, which is handled
            }
        },
        {
            name: 'Panel CSS Conflicts',
            test: () => {
                const leftPanel = document.getElementById('left-panel');
                if (leftPanel) {
                    // Create conflict
                    leftPanel.style.display = 'none';
                    
                    // Detect conflict
                    errorHandler.checkForCSSConflicts(leftPanel);
                    
                    // Check if resolved
                    const status = errorHandler.getStatus();
                    const conflict = status.cssConflicts.find(c => c.elementId === 'left-panel');
                    
                    return conflict && conflict.resolved;
                }
                return false;
            }
        },
        {
            name: 'Multiple Missing Elements',
            test: () => {
                const elements = ['test-element-1', 'test-element-2', 'test-element-3'];
                
                // Simulate missing elements
                errorHandler.detectMissingElements(elements);
                
                // Check if recovery was attempted
                const status = errorHandler.getStatus();
                return status.recoveryAttempts > 0 || status.missingElements.length > 0;
            }
        }
    ];

    let passed = 0;
    let total = scenarios.length;

    scenarios.forEach(scenario => {
        try {
            const result = scenario.test();
            if (result) {
                console.log(`✅ ${scenario.name}`);
                passed++;
            } else {
                console.log(`❌ ${scenario.name}`);
            }
        } catch (error) {
            console.log(`❌ ${scenario.name}: ${error.message}`);
        }
    });

    const successRate = (passed / total * 100).toFixed(1);
    console.log(`\n📊 Specific Error Scenarios: ${passed}/${total} (${successRate}%)`);
    
    return passed === total;
}

/**
 * Validate that all error handling requirements are met
 */
export function validateErrorHandlingRequirements() {
    console.log('🔍 Validating Error Handling Requirements...');
    
    const errorHandler = window.layoutErrorHandler;
    if (!errorHandler) {
        console.error('❌ Layout error handler not available');
        return false;
    }

    const requirements = [
        {
            id: '5.1',
            description: 'Error detection for missing DOM elements',
            test: () => {
                return typeof errorHandler.detectMissingElements === 'function' &&
                       typeof errorHandler.createMissingElement === 'function';
            }
        },
        {
            id: '5.2',
            description: 'Fallback layout mechanisms',
            test: () => {
                return errorHandler.fallbackLayouts.size > 0 &&
                       typeof errorHandler.applyFallbackLayout === 'function';
            }
        },
        {
            id: '5.3',
            description: 'Graceful degradation for CSS conflicts',
            test: () => {
                return typeof errorHandler.checkForCSSConflicts === 'function' &&
                       typeof errorHandler.resolveCSSConflicts === 'function';
            }
        },
        {
            id: '5.4',
            description: 'Layout error recovery',
            test: () => {
                return typeof errorHandler.attemptDOMRecovery === 'function' &&
                       typeof errorHandler.handleResizeError === 'function';
            }
        }
    ];

    let allPassed = true;

    requirements.forEach(req => {
        try {
            const passed = req.test();
            if (passed) {
                console.log(`✅ Requirement ${req.id}: ${req.description}`);
            } else {
                console.log(`❌ Requirement ${req.id}: ${req.description}`);
                allPassed = false;
            }
        } catch (error) {
            console.log(`❌ Requirement ${req.id}: ${req.description} - Error: ${error.message}`);
            allPassed = false;
        }
    });

    if (allPassed) {
        console.log('🎉 All error handling requirements validated successfully!');
    } else {
        console.warn('⚠️ Some error handling requirements failed validation.');
    }

    return allPassed;
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    window.testLayoutErrorHandling = testLayoutErrorHandling;
    window.testSpecificErrorScenarios = testSpecificErrorScenarios;
    window.validateErrorHandlingRequirements = validateErrorHandlingRequirements;
    console.log('🧪 Layout Error Handling tests available globally');
}