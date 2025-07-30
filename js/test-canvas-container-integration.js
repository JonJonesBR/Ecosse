/**
 * Test Canvas Container Integration - Task 2: Fix ResponsiveCanvasContainer integration issues
 * 
 * This test validates the integration between ResponsiveCanvasContainer and layoutConfigurationSystem,
 * ensuring all required methods exist and work properly with error handling.
 */

import { responsiveCanvasContainer } from './responsive-canvas-container.js';
import { layoutConfigurationSystem } from './ui/layoutConfigurationSystem.js';

/**
 * Test canvas container integration
 */
export function testCanvasContainerIntegration() {
    console.log('🧪 Testing Canvas Container Integration...');
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };

    // Test 1: Verify setAutoResize method exists
    addTest(results, 'ResponsiveCanvasContainer setAutoResize method exists', () => {
        return typeof responsiveCanvasContainer.setAutoResize === 'function';
    });

    // Test 2: Verify setMaintainAspectRatio method exists
    addTest(results, 'ResponsiveCanvasContainer setMaintainAspectRatio method exists', () => {
        return typeof responsiveCanvasContainer.setMaintainAspectRatio === 'function';
    });

    // Test 3: Test setAutoResize functionality
    addTest(results, 'setAutoResize method works correctly', () => {
        try {
            // Test enabling auto-resize
            responsiveCanvasContainer.setAutoResize(true);
            const enabledState = responsiveCanvasContainer.isAutoResizeEnabled();
            
            // Test disabling auto-resize
            responsiveCanvasContainer.setAutoResize(false);
            const disabledState = !responsiveCanvasContainer.isAutoResizeEnabled();
            
            // Restore default state
            responsiveCanvasContainer.setAutoResize(true);
            
            return enabledState && disabledState;
        } catch (error) {
            console.error('setAutoResize test failed:', error);
            return false;
        }
    });

    // Test 4: Test setMaintainAspectRatio functionality
    addTest(results, 'setMaintainAspectRatio method works correctly', () => {
        try {
            // Test enabling aspect ratio maintenance
            responsiveCanvasContainer.setMaintainAspectRatio(true);
            const enabledState = responsiveCanvasContainer.isMaintainAspectRatioEnabled();
            
            // Test disabling aspect ratio maintenance
            responsiveCanvasContainer.setMaintainAspectRatio(false);
            const disabledState = !responsiveCanvasContainer.isMaintainAspectRatioEnabled();
            
            // Restore default state
            responsiveCanvasContainer.setMaintainAspectRatio(true);
            
            return enabledState && disabledState;
        } catch (error) {
            console.error('setMaintainAspectRatio test failed:', error);
            return false;
        }
    });

    // Test 5: Test method validation in layout configuration system
    addTest(results, 'Layout configuration system validates canvas methods', () => {
        try {
            // Test valid method validation
            const validMethod = layoutConfigurationSystem.validateCanvasMethod('setAutoResize');
            
            // Test invalid method validation
            const invalidMethod = !layoutConfigurationSystem.validateCanvasMethod('nonExistentMethod');
            
            return validMethod && invalidMethod;
        } catch (error) {
            console.error('Method validation test failed:', error);
            return false;
        }
    });

    // Test 6: Test error handling for missing methods
    addTest(results, 'Error handling works for missing canvas methods', () => {
        try {
            // Temporarily remove a method to test error handling
            const originalMethod = responsiveCanvasContainer.setAutoResize;
            delete responsiveCanvasContainer.setAutoResize;
            
            // Test that validation correctly identifies missing method
            const validationResult = !layoutConfigurationSystem.validateCanvasMethod('setAutoResize');
            
            // Restore the method
            responsiveCanvasContainer.setAutoResize = originalMethod;
            
            return validationResult;
        } catch (error) {
            console.error('Error handling test failed:', error);
            return false;
        }
    });

    // Test 7: Test canvas configuration application
    addTest(results, 'Canvas configuration applies correctly', () => {
        try {
            // Save original configuration
            const originalConfig = JSON.parse(JSON.stringify(layoutConfigurationSystem.currentConfig));
            
            // Test configuration with auto-resize enabled
            layoutConfigurationSystem.currentConfig.canvas.autoResize = true;
            layoutConfigurationSystem.currentConfig.canvas.maintainAspectRatio = true;
            
            // Apply configuration (should not throw errors)
            layoutConfigurationSystem.applyCanvasConfiguration();
            
            // Test configuration with auto-resize disabled
            layoutConfigurationSystem.currentConfig.canvas.autoResize = false;
            layoutConfigurationSystem.currentConfig.canvas.maintainAspectRatio = false;
            
            // Apply configuration (should not throw errors)
            layoutConfigurationSystem.applyCanvasConfiguration();
            
            // Restore original configuration
            layoutConfigurationSystem.currentConfig = originalConfig;
            layoutConfigurationSystem.applyCanvasConfiguration();
            
            return true;
        } catch (error) {
            console.error('Canvas configuration application test failed:', error);
            return false;
        }
    });

    // Test 8: Test integration with missing canvas container
    addTest(results, 'Handles missing canvas container gracefully', () => {
        try {
            // Temporarily remove canvas container
            const originalContainer = window.responsiveCanvasContainer;
            window.responsiveCanvasContainer = null;
            
            // Test that validation handles missing container
            const validationResult = !layoutConfigurationSystem.validateCanvasMethod('setAutoResize');
            
            // Restore canvas container
            window.responsiveCanvasContainer = originalContainer;
            
            return validationResult;
        } catch (error) {
            console.error('Missing canvas container test failed:', error);
            return false;
        }
    });

    // Test 9: Test manual canvas resize fallback
    addTest(results, 'Manual canvas resize fallback works', () => {
        try {
            // Test manual resize fallback
            layoutConfigurationSystem.triggerManualCanvasResize();
            
            // If no error is thrown, the fallback works
            return true;
        } catch (error) {
            console.error('Manual canvas resize fallback test failed:', error);
            return false;
        }
    });

    // Test 10: Test required methods exist
    addTest(results, 'All required canvas container methods exist', () => {
        const requiredMethods = [
            'setAutoResize',
            'setMaintainAspectRatio',
            'isAutoResizeEnabled',
            'isMaintainAspectRatioEnabled',
            'forceResize',
            'updateCanvasSize',
            'calculateOptimalSize',
            'getCurrentSize',
            'getContainerSize'
        ];

        const missingMethods = requiredMethods.filter(method => 
            typeof responsiveCanvasContainer[method] !== 'function'
        );

        if (missingMethods.length > 0) {
            console.error('Missing methods:', missingMethods);
            return false;
        }

        return true;
    });

    // Print results
    printTestResults(results);
    
    return results;
}

/**
 * Add a test to the results
 */
function addTest(results, name, testFn) {
    results.total++;
    
    try {
        const passed = testFn();
        if (passed) {
            results.passed++;
            results.details.push({ name, status: 'PASSED' });
            console.log(`✅ ${name}`);
        } else {
            results.failed++;
            results.details.push({ name, status: 'FAILED', reason: 'Test returned false' });
            console.log(`❌ ${name}`);
        }
    } catch (error) {
        results.failed++;
        results.details.push({ name, status: 'ERROR', reason: error.message });
        console.log(`💥 ${name} - Error: ${error.message}`);
    }
}

/**
 * Print test results summary
 */
function printTestResults(results) {
    console.log('\n📊 Canvas Container Integration Test Results:');
    console.log(`Total: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.details
            .filter(test => test.status !== 'PASSED')
            .forEach(test => {
                console.log(`  - ${test.name}: ${test.status}${test.reason ? ` (${test.reason})` : ''}`);
            });
    }
    
    console.log('\n' + '='.repeat(50));
}

/**
 * Run integration scenarios to test real-world usage
 */
export function testCanvasIntegrationScenarios() {
    console.log('🎭 Testing Canvas Integration Scenarios...');
    
    const scenarios = [];

    // Scenario 1: Layout configuration changes
    scenarios.push({
        name: 'Layout Configuration Changes',
        description: 'Test that layout configuration changes are applied correctly to canvas',
        test: () => {
            try {
                // Initialize if needed
                if (!layoutConfigurationSystem.isInitialized) {
                    layoutConfigurationSystem.initialize();
                }

                // Apply different presets and verify no errors
                const presets = ['default', 'compact', 'full', 'presentation'];
                
                for (const preset of presets) {
                    layoutConfigurationSystem.applyPreset(preset);
                    
                    // Verify canvas configuration was applied
                    const config = layoutConfigurationSystem.getCurrentConfiguration();
                    if (!config || !config.canvas) {
                        return false;
                    }
                }
                
                return true;
            } catch (error) {
                console.error('Layout configuration scenario failed:', error);
                return false;
            }
        }
    });

    // Scenario 2: Canvas method error recovery
    scenarios.push({
        name: 'Canvas Method Error Recovery',
        description: 'Test that system recovers gracefully from canvas method errors',
        test: () => {
            try {
                // Temporarily break a method
                const originalMethod = responsiveCanvasContainer.setAutoResize;
                responsiveCanvasContainer.setAutoResize = null;
                
                // Try to apply configuration (should not crash)
                layoutConfigurationSystem.applyCanvasConfiguration();
                
                // Restore method
                responsiveCanvasContainer.setAutoResize = originalMethod;
                
                return true;
            } catch (error) {
                console.error('Canvas method error recovery scenario failed:', error);
                return false;
            }
        }
    });

    // Scenario 3: Canvas container missing
    scenarios.push({
        name: 'Missing Canvas Container Handling',
        description: 'Test that system handles missing canvas container gracefully',
        test: () => {
            try {
                // Temporarily remove canvas container
                const originalContainer = window.responsiveCanvasContainer;
                window.responsiveCanvasContainer = null;
                
                // Try to apply configuration (should not crash)
                layoutConfigurationSystem.applyCanvasConfiguration();
                
                // Restore container
                window.responsiveCanvasContainer = originalContainer;
                
                return true;
            } catch (error) {
                console.error('Missing canvas container scenario failed:', error);
                return false;
            }
        }
    });

    // Run scenarios
    let passedScenarios = 0;
    scenarios.forEach((scenario, index) => {
        console.log(`\n🎬 Scenario ${index + 1}: ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        
        const result = scenario.test();
        if (result) {
            console.log('   ✅ PASSED');
            passedScenarios++;
        } else {
            console.log('   ❌ FAILED');
        }
    });

    console.log(`\n📈 Scenarios Results: ${passedScenarios}/${scenarios.length} passed`);
    
    return {
        total: scenarios.length,
        passed: passedScenarios,
        failed: scenarios.length - passedScenarios
    };
}

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.testCanvasContainerIntegration = testCanvasContainerIntegration;
    window.testCanvasIntegrationScenarios = testCanvasIntegrationScenarios;
}