/**
 * Test DOM Fixes - Task 1 Verification
 * 
 * This module tests the DOM Error Handler fixes to ensure they resolve
 * the critical DOM issues identified in the logs.
 */

import { domErrorHandler } from './utils/domErrorHandler.js';
import { responsiveCanvasContainer } from './responsive-canvas-container.js';

/**
 * Test DOM Error Handler functionality
 */
export function testDOMFixes() {
    console.log('🧪 Testing DOM Error Handler fixes...');
    
    const results = {
        timestamp: Date.now(),
        tests: [],
        passed: 0,
        failed: 0,
        overall: true
    };

    // Test 1: DOM Error Handler initialization
    addTest(results, 'DOM Error Handler Initialization', () => {
        return domErrorHandler.isInitialized === true;
    });

    // Test 2: Panel finding/creation
    addTest(results, 'Left Panel Finding/Creation', () => {
        const leftPanel = domErrorHandler.findOrCreatePanel('left-panel');
        return leftPanel && leftPanel.id === 'left-panel';
    });

    addTest(results, 'Right Panel Finding/Creation', () => {
        const rightPanel = domErrorHandler.findOrCreatePanel('right-panel');
        return rightPanel && rightPanel.id === 'right-panel';
    });

    // Test 3: Safe DOM insertion
    addTest(results, 'Safe DOM Insertion', () => {
        try {
            const parent = document.createElement('div');
            const child = document.createElement('span');
            const reference = document.createElement('p');
            
            parent.appendChild(reference);
            
            const result = domErrorHandler.safeInsertBefore(child, reference, parent);
            return result === child && parent.contains(child);
        } catch (error) {
            console.error('Safe DOM insertion test failed:', error);
            return false;
        }
    });

    // Test 4: Element validation
    addTest(results, 'Element Validation', () => {
        // Create a test element
        const testElement = document.createElement('div');
        testElement.id = 'test-validation-element';
        document.body.appendChild(testElement);
        
        const isValid = domErrorHandler.validateDOMElement('test-validation-element');
        
        // Clean up
        document.body.removeChild(testElement);
        
        return isValid === true;
    });

    // Test 5: AnalysisTools DOM fix
    addTest(results, 'AnalysisTools DOM Structure Fix', () => {
        const rightPanel = domErrorHandler.findOrCreatePanel('right-panel');
        const simInfoPanel = domErrorHandler.fixAnalysisToolsDOM(rightPanel);
        
        return simInfoPanel && 
               simInfoPanel.id === 'simulation-info-panel' &&
               rightPanel.contains(simInfoPanel);
    });

    // Test 6: ResponsiveCanvasContainer setAutoResize method
    addTest(results, 'ResponsiveCanvasContainer setAutoResize Method', () => {
        return typeof responsiveCanvasContainer.setAutoResize === 'function';
    });

    // Test 7: Health check functionality
    addTest(results, 'DOM Health Check', () => {
        const healthResults = domErrorHandler.runHealthCheck();
        return healthResults && typeof healthResults.overall === 'boolean';
    });

    // Test 8: Error logging
    addTest(results, 'Error Logging System', () => {
        const initialErrorCount = domErrorHandler.errorLog.length;
        domErrorHandler.logError('test', 'Test error message', 'testDOMFixes');
        return domErrorHandler.errorLog.length === initialErrorCount + 1;
    });

    // Test 9: Auto-fix functionality
    addTest(results, 'Auto-fix Common Issues', () => {
        try {
            const fixes = domErrorHandler.autoFixCommonIssues();
            return Array.isArray(fixes);
        } catch (error) {
            console.error('Auto-fix test failed:', error);
            return false;
        }
    });

    // Test 10: Safe DOM methods
    addTest(results, 'Safe DOM Methods', () => {
        const safeMethods = domErrorHandler.createSafeDOMMethods();
        return safeMethods &&
               typeof safeMethods.safeQuerySelector === 'function' &&
               typeof safeMethods.safeGetElementById === 'function' &&
               typeof safeMethods.safeAppendChild === 'function';
    });

    // Calculate final results
    results.overall = results.failed === 0;
    
    // Log results
    console.log('📊 DOM Fixes Test Results:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.overall) {
        console.log('🎉 All DOM fixes are working correctly!');
    } else {
        console.warn('⚠️ Some DOM fixes need attention:');
        results.tests.filter(test => !test.passed).forEach(test => {
            console.warn(`  - ${test.name}: ${test.error || 'Failed'}`);
        });
    }

    return results;
}

/**
 * Add a test to the results
 * @param {Object} results - Test results object
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
function addTest(results, name, testFn) {
    try {
        const passed = testFn();
        results.tests.push({ name, passed, error: null });
        
        if (passed) {
            results.passed++;
            console.log(`✅ ${name}: Passed`);
        } else {
            results.failed++;
            console.log(`❌ ${name}: Failed`);
        }
    } catch (error) {
        results.tests.push({ name, passed: false, error: error.message });
        results.failed++;
        console.log(`❌ ${name}: Error - ${error.message}`);
    }
}

/**
 * Test specific error scenarios that were reported in logs
 */
export function testSpecificErrorScenarios() {
    console.log('🔍 Testing specific error scenarios from logs...');
    
    const scenarios = [];

    // Scenario 1: AnalysisTools insertBefore error
    scenarios.push({
        name: 'AnalysisTools insertBefore Error',
        test: () => {
            try {
                // Simulate the error condition
                const rightPanel = domErrorHandler.findOrCreatePanel('right-panel');
                const analysisSection = document.createElement('div');
                analysisSection.id = 'test-analysis-section';
                
                const simInfoPanel = domErrorHandler.fixAnalysisToolsDOM(rightPanel);
                const panelContent = rightPanel.querySelector('.panel-content');
                
                // This should not throw an error now
                domErrorHandler.safeInsertBefore(analysisSection, simInfoPanel, panelContent);
                
                // Clean up
                if (analysisSection.parentNode) {
                    analysisSection.parentNode.removeChild(analysisSection);
                }
                
                return true;
            } catch (error) {
                console.error('AnalysisTools insertBefore test failed:', error);
                return false;
            }
        }
    });

    // Scenario 2: Panel not found errors
    scenarios.push({
        name: 'Panel Not Found Errors',
        test: () => {
            try {
                // These should not return null or throw errors
                const leftPanel = domErrorHandler.findOrCreatePanel('left-panel');
                const rightPanel = domErrorHandler.findOrCreatePanel('right-panel');
                
                return leftPanel && rightPanel && 
                       leftPanel.id === 'left-panel' && 
                       rightPanel.id === 'right-panel';
            } catch (error) {
                console.error('Panel finding test failed:', error);
                return false;
            }
        }
    });

    // Scenario 3: ResponsiveCanvasContainer setAutoResize error
    scenarios.push({
        name: 'ResponsiveCanvasContainer setAutoResize Error',
        test: () => {
            try {
                // This should not throw "setAutoResize is not a function" error
                responsiveCanvasContainer.setAutoResize(true);
                responsiveCanvasContainer.setAutoResize(false);
                return true;
            } catch (error) {
                console.error('setAutoResize test failed:', error);
                return false;
            }
        }
    });

    // Run scenarios
    let passed = 0;
    let failed = 0;

    scenarios.forEach(scenario => {
        try {
            if (scenario.test()) {
                console.log(`✅ ${scenario.name}: Resolved`);
                passed++;
            } else {
                console.log(`❌ ${scenario.name}: Still failing`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${scenario.name}: Error - ${error.message}`);
            failed++;
        }
    });

    console.log(`📊 Error Scenario Results: ${passed} resolved, ${failed} still failing`);
    
    return {
        total: scenarios.length,
        passed,
        failed,
        resolved: failed === 0
    };
}

/**
 * Run comprehensive DOM fix validation
 */
export function validateDOMFixes() {
    console.log('🔍 Running comprehensive DOM fix validation...');
    
    const results = {
        timestamp: Date.now(),
        domTests: null,
        errorScenarios: null,
        healthCheck: null,
        overall: false
    };

    // Run all tests
    results.domTests = testDOMFixes();
    results.errorScenarios = testSpecificErrorScenarios();
    results.healthCheck = domErrorHandler.runHealthCheck();

    // Determine overall success
    results.overall = results.domTests.overall && 
                     results.errorScenarios.resolved && 
                     results.healthCheck.overall;

    // Final report
    console.log('📋 DOM Fix Validation Summary:');
    console.log(`  DOM Tests: ${results.domTests.overall ? 'PASSED' : 'FAILED'}`);
    console.log(`  Error Scenarios: ${results.errorScenarios.resolved ? 'RESOLVED' : 'UNRESOLVED'}`);
    console.log(`  Health Check: ${results.healthCheck.overall ? 'HEALTHY' : 'ISSUES FOUND'}`);
    console.log(`  Overall Status: ${results.overall ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);

    return results;
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    window.testDOMFixes = testDOMFixes;
    window.testSpecificErrorScenarios = testSpecificErrorScenarios;
    window.validateDOMFixes = validateDOMFixes;
    console.log('🧪 DOM fix tests available: testDOMFixes(), testSpecificErrorScenarios(), validateDOMFixes()');
}