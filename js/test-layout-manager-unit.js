/**
 * Unit Tests for LayoutManager Class - Task 14
 * 
 * Comprehensive unit tests for the LayoutManager class covering:
 * - Initialization and configuration
 * - Viewport detection and classification
 * - Panel state management
 * - Layout calculations and updates
 * - Event handling and notifications
 * 
 * Requirements: 1.1, 1.2, 5.1, 5.2
 */

import { layoutManager } from './systems/layoutManager.js';

/**
 * Run all LayoutManager unit tests
 */
export function runLayoutManagerUnitTests() {
    console.log('🧪 LayoutManager Unit Tests');
    console.log('=' .repeat(40));
    
    const testSuites = [
        { name: 'Initialization Tests', tests: getInitializationTests() },
        { name: 'Viewport Detection Tests', tests: getViewportDetectionTests() },
        { name: 'Panel Management Tests', tests: getPanelManagementTests() },
        { name: 'Layout Calculation Tests', tests: getLayoutCalculationTests() },
        { name: 'Event Handling Tests', tests: getEventHandlingTests() },
        { name: 'Configuration Tests', tests: getConfigurationTests() },
        { name: 'Error Handling Tests', tests: getErrorHandlingTests() }
    ];
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    testSuites.forEach(suite => {
        console.log(`\n📋 ${suite.name}`);
        console.log('-'.repeat(30));
        
        const result = runTestGroup(suite.tests);
        totalPassed += result.passed;
        totalFailed += result.failed;
    });
    
    const total = totalPassed + totalFailed;
    const passRate = total > 0 ? (totalPassed / total * 100).toFixed(1) : 0;
    
    console.log(`\n📊 LayoutManager Unit Test Results:`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Pass Rate: ${passRate}%`);
    
    return {
        passed: totalPassed,
        failed: totalFailed,
        total,
        passRate: parseFloat(passRate),
        success: totalFailed === 0
    };
}

/**
 * Initialization tests
 */
function getInitializationTests() {
    return [
        {
            name: 'LayoutManager exists and is initialized',
            test: () => {
                return layoutManager !== undefined && layoutManager !== null;
            }
        },
        {
            name: 'Has required methods',
            test: () => {
                const requiredMethods = [
                    'getLayoutInfo', 'updateLayout', 'togglePanel',
                    'getViewportType', 'optimizeForPlanetRendering',
                    'addLayoutChangeListener', 'removeLayoutChangeListener'
                ];
                
                return requiredMethods.every(method => 
                    typeof layoutManager[method] === 'function'
                );
            }
        },
        {
            name: 'Has initial viewport size',
            test: () => {
                return layoutManager.viewportSize &&
                       typeof layoutManager.viewportSize.width === 'number' &&
                       typeof layoutManager.viewportSize.height === 'number' &&
                       layoutManager.viewportSize.width > 0 &&
                       layoutManager.viewportSize.height > 0;
            }
        },
        {
            name: 'Has initial panel states',
            test: () => {
                return layoutManager.panelStates &&
                       typeof layoutManager.panelStates.left === 'string' &&
                       typeof layoutManager.panelStates.right === 'string' &&
                       typeof layoutManager.panelStates.controls === 'string';
            }
        },
        {
            name: 'Has breakpoint configuration',
            test: () => {
                return layoutManager.breakpoints &&
                       typeof layoutManager.breakpoints.mobile === 'number' &&
                       typeof layoutManager.breakpoints.tablet === 'number' &&
                       typeof layoutManager.breakpoints.desktop === 'number' &&
                       layoutManager.breakpoints.mobile < layoutManager.breakpoints.tablet &&
                       layoutManager.breakpoints.tablet < layoutManager.breakpoints.desktop;
            }
        },
        {
            name: 'Has layout configuration',
            test: () => {
                return layoutManager.layoutConfig &&
                       layoutManager.layoutConfig.panels &&
                       layoutManager.layoutConfig.canvas &&
                       layoutManager.layoutConfig.panels.left &&
                       layoutManager.layoutConfig.panels.right &&
                       layoutManager.layoutConfig.panels.controls;
            }
        }
    ];
}

/**
 * Viewport detection tests
 */
function getViewportDetectionTests() {
    return [
        {
            name: 'Detects mobile viewport correctly',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                layoutManager.viewportSize = { width: 600, height: 800 };
                
                const viewportType = layoutManager.getViewportType();
                layoutManager.viewportSize = originalSize;
                
                return viewportType === 'mobile';
            }
        },
        {
            name: 'Detects tablet viewport correctly',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                layoutManager.viewportSize = { width: 900, height: 1200 };
                
                const viewportType = layoutManager.getViewportType();
                layoutManager.viewportSize = originalSize;
                
                return viewportType === 'tablet';
            }
        },
        {
            name: 'Detects desktop viewport correctly',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                layoutManager.viewportSize = { width: 1600, height: 1200 };
                
                const viewportType = layoutManager.getViewportType();
                layoutManager.viewportSize = originalSize;
                
                return viewportType === 'desktop';
            }
        },
        {
            name: 'Viewport type is always valid',
            test: () => {
                const viewportType = layoutManager.getViewportType();
                const validTypes = ['mobile', 'tablet', 'desktop'];
                return validTypes.includes(viewportType);
            }
        },
        {
            name: 'Updates viewport size correctly',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                const testSize = { width: 1024, height: 768 };
                
                // Mock window dimensions
                const originalInnerWidth = window.innerWidth;
                const originalInnerHeight = window.innerHeight;
                
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: testSize.width
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: testSize.height
                });
                
                layoutManager.updateViewportSize();
                
                const updated = layoutManager.viewportSize.width === testSize.width &&
                               layoutManager.viewportSize.height === testSize.height;
                
                // Restore original values
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: originalInnerWidth
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: originalInnerHeight
                });
                
                layoutManager.viewportSize = originalSize;
                
                return updated;
            }
        }
    ];
}

/**
 * Panel management tests
 */
function getPanelManagementTests() {
    return [
        {
            name: 'Toggle left panel changes state',
            test: () => {
                const originalState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left');
                const newState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left'); // Restore
                
                return originalState !== newState;
            }
        },
        {
            name: 'Toggle right panel changes state',
            test: () => {
                const originalState = layoutManager.panelStates.right;
                layoutManager.togglePanel('right');
                const newState = layoutManager.panelStates.right;
                layoutManager.togglePanel('right'); // Restore
                
                return originalState !== newState;
            }
        },
        {
            name: 'Toggle controls panel changes state',
            test: () => {
                const originalState = layoutManager.panelStates.controls;
                layoutManager.togglePanel('controls');
                const newState = layoutManager.panelStates.controls;
                layoutManager.togglePanel('controls'); // Restore
                
                return originalState !== newState;
            }
        },
        {
            name: 'Invalid panel name is handled gracefully',
            test: () => {
                try {
                    layoutManager.togglePanel('invalid-panel');
                    return true; // Should not throw
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Panel states are preserved during viewport changes',
            test: () => {
                const originalStates = { ...layoutManager.panelStates };
                const originalSize = { ...layoutManager.viewportSize };
                
                // Change panel state
                layoutManager.togglePanel('left');
                const modifiedState = layoutManager.panelStates.left;
                
                // Change viewport
                layoutManager.viewportSize = { width: 600, height: 800 };
                layoutManager.updateLayout();
                
                // Check if state is preserved
                const statePreserved = layoutManager.panelStates.left === modifiedState;
                
                // Restore
                layoutManager.panelStates = originalStates;
                layoutManager.viewportSize = originalSize;
                
                return statePreserved;
            }
        }
    ];
}

/**
 * Layout calculation tests
 */
function getLayoutCalculationTests() {
    return [
        {
            name: 'Layout update executes without errors',
            test: () => {
                try {
                    layoutManager.updateLayout();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Canvas layout update executes without errors',
            test: () => {
                try {
                    layoutManager.updateCanvasLayout();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Responsive layout application works for mobile',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                layoutManager.viewportSize = { width: 600, height: 800 };
                
                try {
                    layoutManager.applyResponsiveLayout('mobile');
                    layoutManager.viewportSize = originalSize;
                    return true;
                } catch (error) {
                    layoutManager.viewportSize = originalSize;
                    return false;
                }
            }
        },
        {
            name: 'Responsive layout application works for tablet',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                layoutManager.viewportSize = { width: 900, height: 1200 };
                
                try {
                    layoutManager.applyResponsiveLayout('tablet');
                    layoutManager.viewportSize = originalSize;
                    return true;
                } catch (error) {
                    layoutManager.viewportSize = originalSize;
                    return false;
                }
            }
        },
        {
            name: 'Responsive layout application works for desktop',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                layoutManager.viewportSize = { width: 1600, height: 1200 };
                
                try {
                    layoutManager.applyResponsiveLayout('desktop');
                    layoutManager.viewportSize = originalSize;
                    return true;
                } catch (error) {
                    layoutManager.viewportSize = originalSize;
                    return false;
                }
            }
        },
        {
            name: 'Planet rendering optimization returns restore function',
            test: () => {
                const restoreFunction = layoutManager.optimizeForPlanetRendering();
                const isFunction = typeof restoreFunction === 'function';
                
                if (isFunction) {
                    restoreFunction(); // Restore state
                }
                
                return isFunction;
            }
        }
    ];
}

/**
 * Event handling tests
 */
function getEventHandlingTests() {
    return [
        {
            name: 'Can add layout change listener',
            test: () => {
                const testCallback = () => {};
                try {
                    layoutManager.addLayoutChangeListener(testCallback);
                    layoutManager.removeLayoutChangeListener(testCallback);
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Layout change listener is called',
            test: () => {
                let callbackCalled = false;
                const testCallback = () => { callbackCalled = true; };
                
                layoutManager.addLayoutChangeListener(testCallback);
                layoutManager.notifyLayoutChange();
                layoutManager.removeLayoutChangeListener(testCallback);
                
                return callbackCalled;
            }
        },
        {
            name: 'Can add resize listener',
            test: () => {
                const testCallback = () => {};
                try {
                    layoutManager.addResizeListener(testCallback);
                    layoutManager.removeResizeListener(testCallback);
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Resize listener is called',
            test: () => {
                let callbackCalled = false;
                const testCallback = () => { callbackCalled = true; };
                
                layoutManager.addResizeListener(testCallback);
                layoutManager.notifyCanvasResize(800, 600);
                layoutManager.removeResizeListener(testCallback);
                
                return callbackCalled;
            }
        },
        {
            name: 'Layout change event is dispatched',
            test: () => {
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = true;
                };
                
                document.addEventListener('layoutChanged', testListener);
                layoutManager.notifyLayoutChange();
                document.removeEventListener('layoutChanged', testListener);
                
                return eventReceived;
            }
        },
        {
            name: 'Event listeners handle errors gracefully',
            test: () => {
                const errorCallback = () => { throw new Error('Test error'); };
                
                try {
                    layoutManager.addLayoutChangeListener(errorCallback);
                    layoutManager.notifyLayoutChange(); // Should not throw
                    layoutManager.removeLayoutChangeListener(errorCallback);
                    return true;
                } catch (error) {
                    return false;
                }
            }
        }
    ];
}

/**
 * Configuration tests
 */
function getConfigurationTests() {
    return [
        {
            name: 'getLayoutInfo returns complete information',
            test: () => {
                const layoutInfo = layoutManager.getLayoutInfo();
                return layoutInfo &&
                       layoutInfo.viewportSize &&
                       layoutInfo.viewportType &&
                       layoutInfo.panelStates &&
                       layoutInfo.layoutConfig;
            }
        },
        {
            name: 'Layout configuration can be updated',
            test: () => {
                const originalConfig = { ...layoutManager.layoutConfig };
                const testConfig = { testProperty: 'testValue' };
                
                try {
                    layoutManager.updateLayoutConfig(testConfig);
                    const hasTestProperty = layoutManager.layoutConfig.testProperty === 'testValue';
                    
                    // Restore original config
                    layoutManager.layoutConfig = originalConfig;
                    
                    return hasTestProperty;
                } catch (error) {
                    layoutManager.layoutConfig = originalConfig;
                    return false;
                }
            }
        },
        {
            name: 'Panel configuration has required properties',
            test: () => {
                const panelConfig = layoutManager.layoutConfig.panels;
                return panelConfig.left &&
                       panelConfig.right &&
                       panelConfig.controls &&
                       typeof panelConfig.left.width === 'number' &&
                       typeof panelConfig.right.width === 'number';
            }
        },
        {
            name: 'Canvas configuration has required properties',
            test: () => {
                const canvasConfig = layoutManager.layoutConfig.canvas;
                return canvasConfig &&
                       typeof canvasConfig.minWidth === 'number' &&
                       typeof canvasConfig.minHeight === 'number' &&
                       canvasConfig.minWidth > 0 &&
                       canvasConfig.minHeight > 0;
            }
        }
    ];
}

/**
 * Error handling tests
 */
function getErrorHandlingTests() {
    return [
        {
            name: 'Handles missing DOM elements gracefully',
            test: () => {
                try {
                    // This should not throw even if DOM elements are missing
                    layoutManager.updateLayout();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Handles invalid viewport size gracefully',
            test: () => {
                const originalSize = { ...layoutManager.viewportSize };
                
                try {
                    layoutManager.viewportSize = { width: -100, height: -100 };
                    const viewportType = layoutManager.getViewportType();
                    
                    layoutManager.viewportSize = originalSize;
                    
                    // Should still return a valid viewport type
                    const validTypes = ['mobile', 'tablet', 'desktop'];
                    return validTypes.includes(viewportType);
                } catch (error) {
                    layoutManager.viewportSize = originalSize;
                    return false;
                }
            }
        },
        {
            name: 'Basic fallback works when error handler is not available',
            test: () => {
                const originalErrorHandler = window.layoutErrorHandler;
                window.layoutErrorHandler = null;
                
                try {
                    layoutManager.applyBasicFallback();
                    window.layoutErrorHandler = originalErrorHandler;
                    return true;
                } catch (error) {
                    window.layoutErrorHandler = originalErrorHandler;
                    return false;
                }
            }
        },
        {
            name: 'Handles null panel states gracefully',
            test: () => {
                const originalStates = { ...layoutManager.panelStates };
                
                try {
                    layoutManager.panelStates = null;
                    layoutManager.updateLayout(); // Should not throw
                    
                    layoutManager.panelStates = originalStates;
                    return true;
                } catch (error) {
                    layoutManager.panelStates = originalStates;
                    return false;
                }
            }
        }
    ];
}

/**
 * Run a group of tests
 */
function runTestGroup(tests) {
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            const result = test.test();
            if (result) {
                console.log(`  ✅ ${test.name}`);
                passed++;
            } else {
                console.log(`  ❌ ${test.name}`);
                failed++;
            }
        } catch (error) {
            console.log(`  💥 ${test.name}: ${error.message}`);
            failed++;
        }
    });
    
    return { passed, failed };
}

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.runLayoutManagerUnitTests = runLayoutManagerUnitTests;
    console.log('🧪 LayoutManager unit tests available as window.runLayoutManagerUnitTests()');
}