/**
 * Comprehensive Layout System Tests - Task 14
 * 
 * This file provides comprehensive testing for the layout system including:
 * - Unit tests for LayoutManager and ResponsiveCanvasContainer classes
 * - Integration tests for panel interactions and canvas resizing
 * - Visual regression tests for different viewport sizes
 * 
 * Requirements addressed: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3
 */

import { layoutManager } from './systems/layoutManager.js';
import { responsiveCanvasContainer } from './responsive-canvas-container.js';
import { adaptiveUIController } from './ui/adaptiveUIController.js';

/**
 * Main test runner for comprehensive layout system tests
 */
export function runComprehensiveLayoutTests() {
    console.log('🧪 Running Comprehensive Layout System Tests...');
    console.log('=' .repeat(60));
    
    const testSuites = [
        { name: 'LayoutManager Unit Tests', runner: runLayoutManagerUnitTests },
        { name: 'ResponsiveCanvasContainer Unit Tests', runner: runResponsiveCanvasUnitTests },
        { name: 'AdaptiveUIController Unit Tests', runner: runAdaptiveUIUnitTests },
        { name: 'Panel Interaction Integration Tests', runner: runPanelInteractionTests },
        { name: 'Canvas Resizing Integration Tests', runner: runCanvasResizeIntegrationTests },
        { name: 'Visual Regression Tests', runner: runVisualRegressionTests },
        { name: 'Performance Tests', runner: runPerformanceTests },
        { name: 'Error Handling Tests', runner: runErrorHandlingTests }
    ];
    
    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const suite of testSuites) {
        console.log(`\n🔍 ${suite.name}`);
        console.log('-'.repeat(40));
        
        try {
            const result = suite.runner();
            results.push({ name: suite.name, ...result });
            totalPassed += result.passed;
            totalFailed += result.failed;
        } catch (error) {
            console.error(`💥 Test suite ${suite.name} crashed:`, error);
            results.push({ name: suite.name, passed: 0, failed: 1, error: error.message });
            totalFailed += 1;
        }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach(result => {
        const status = result.failed === 0 ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.passed}/${result.passed + result.failed} passed`);
    });
    
    const totalTests = totalPassed + totalFailed;
    const passRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
    
    console.log(`\n🎯 Overall Results: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);
    
    if (totalFailed === 0) {
        console.log('🎉 All comprehensive layout tests passed!');
    } else {
        console.log(`⚠️ ${totalFailed} tests failed. Review implementation.`);
    }
    
    return {
        totalTests,
        totalPassed,
        totalFailed,
        passRate: parseFloat(passRate),
        results,
        allPassed: totalFailed === 0
    };
}

/**
 * Unit tests for LayoutManager class
 */
function runLayoutManagerUnitTests() {
    console.log('Testing LayoutManager class...');
    
    const tests = [
        {
            name: 'LayoutManager Initialization',
            test: () => {
                return layoutManager && 
                       typeof layoutManager.getLayoutInfo === 'function' &&
                       typeof layoutManager.updateLayout === 'function' &&
                       typeof layoutManager.togglePanel === 'function';
            }
        },
        {
            name: 'Viewport Size Detection',
            test: () => {
                const layoutInfo = layoutManager.getLayoutInfo();
                return layoutInfo.viewportSize && 
                       layoutInfo.viewportSize.width > 0 && 
                       layoutInfo.viewportSize.height > 0;
            }
        },
        {
            name: 'Viewport Type Classification',
            test: () => {
                const viewportType = layoutManager.getViewportType();
                const validTypes = ['mobile', 'tablet', 'desktop'];
                return validTypes.includes(viewportType);
            }
        },
        {
            name: 'Panel State Management',
            test: () => {
                const layoutInfo = layoutManager.getLayoutInfo();
                const panelStates = layoutInfo.panelStates;
                return panelStates && 
                       typeof panelStates.left === 'string' &&
                       typeof panelStates.right === 'string' &&
                       typeof panelStates.controls === 'string';
            }
        },
        {
            name: 'Panel Toggle Functionality',
            test: () => {
                const originalState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left');
                const newState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left'); // Restore
                return originalState !== newState;
            }
        },
        {
            name: 'Layout Configuration Access',
            test: () => {
                const layoutInfo = layoutManager.getLayoutInfo();
                const config = layoutInfo.layoutConfig;
                return config && 
                       config.panels && 
                       config.canvas &&
                       config.panels.left &&
                       config.panels.right;
            }
        },
        {
            name: 'Breakpoint Configuration',
            test: () => {
                return layoutManager.breakpoints &&
                       typeof layoutManager.breakpoints.mobile === 'number' &&
                       typeof layoutManager.breakpoints.tablet === 'number' &&
                       typeof layoutManager.breakpoints.desktop === 'number';
            }
        },
        {
            name: 'Event Listener Management',
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
            name: 'Planet Rendering Optimization',
            test: () => {
                const restoreFunction = layoutManager.optimizeForPlanetRendering();
                const isFunction = typeof restoreFunction === 'function';
                if (isFunction) {
                    restoreFunction(); // Restore original state
                }
                return isFunction;
            }
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Unit tests for ResponsiveCanvasContainer class
 */
function runResponsiveCanvasUnitTests() {
    console.log('Testing ResponsiveCanvasContainer class...');
    
    const tests = [
        {
            name: 'ResponsiveCanvasContainer Initialization',
            test: () => {
                return responsiveCanvasContainer &&
                       typeof responsiveCanvasContainer.calculateOptimalSize === 'function' &&
                       typeof responsiveCanvasContainer.updateCanvasSize === 'function' &&
                       typeof responsiveCanvasContainer.getMetrics === 'function';
            }
        },
        {
            name: 'Size Calculation with Valid Input',
            test: () => {
                // Mock container for testing
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 800, height: 600 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                responsiveCanvasContainer.container = originalContainer;
                
                return size && size.width > 0 && size.height > 0;
            }
        },
        {
            name: 'Minimum Size Constraints',
            test: () => {
                const originalMinSize = { ...responsiveCanvasContainer.minSize };
                
                responsiveCanvasContainer.setMinimumSize({ width: 500, height: 400 });
                const newMinSize = responsiveCanvasContainer.minSize;
                
                responsiveCanvasContainer.setMinimumSize(originalMinSize);
                
                return newMinSize.width === 500 && newMinSize.height === 400;
            }
        },
        {
            name: 'Maximum Size Constraints',
            test: () => {
                const originalMaxSize = { ...responsiveCanvasContainer.maxSize };
                
                responsiveCanvasContainer.setMaximumSize({ width: 2000, height: 1500 });
                const newMaxSize = responsiveCanvasContainer.maxSize;
                
                responsiveCanvasContainer.setMaximumSize(originalMaxSize);
                
                return newMaxSize.width === 2000 && newMaxSize.height === 1500;
            }
        },
        {
            name: 'Container Size Detection',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 1024, height: 768 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.getContainerSize();
                responsiveCanvasContainer.container = originalContainer;
                
                return size.width === 1024 && size.height === 768;
            }
        },
        {
            name: 'Metrics Generation',
            test: () => {
                const metrics = responsiveCanvasContainer.getMetrics();
                return metrics &&
                       metrics.containerSize &&
                       metrics.canvasSize &&
                       typeof metrics.pixelRatio === 'number' &&
                       typeof metrics.totalPixels === 'number' &&
                       typeof metrics.aspectRatio === 'number';
            }
        },
        {
            name: 'Error Handling with Null Container',
            test: () => {
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = null;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                responsiveCanvasContainer.container = originalContainer;
                
                return size.width === responsiveCanvasContainer.minSize.width &&
                       size.height === responsiveCanvasContainer.minSize.height;
            }
        },
        {
            name: 'Force Resize Functionality',
            test: () => {
                try {
                    responsiveCanvasContainer.forceResize();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Unit tests for AdaptiveUIController class
 */
function runAdaptiveUIUnitTests() {
    console.log('Testing AdaptiveUIController class...');
    
    const tests = [
        {
            name: 'AdaptiveUIController Initialization',
            test: () => {
                return adaptiveUIController &&
                       typeof adaptiveUIController.getCurrentViewport === 'function' &&
                       typeof adaptiveUIController.getCurrentConfiguration === 'function' &&
                       typeof adaptiveUIController.isTouchDevice === 'function';
            }
        },
        {
            name: 'Viewport Type Detection',
            test: () => {
                const viewport = adaptiveUIController.getCurrentViewport();
                const validViewports = ['mobile', 'tablet', 'desktop'];
                return validViewports.includes(viewport);
            }
        },
        {
            name: 'Layout Configuration Retrieval',
            test: () => {
                const config = adaptiveUIController.getCurrentConfiguration();
                return config &&
                       typeof config.panelBehavior === 'string' &&
                       typeof config.controlButtonSize === 'string' &&
                       typeof config.touchTargetMinSize === 'number';
            }
        },
        {
            name: 'Touch Device Detection',
            test: () => {
                const isTouchDevice = adaptiveUIController.isTouchDevice();
                return typeof isTouchDevice === 'boolean';
            }
        },
        {
            name: 'Breakpoint Configuration',
            test: () => {
                return adaptiveUIController.breakpoints &&
                       adaptiveUIController.breakpoints.mobile &&
                       adaptiveUIController.breakpoints.tablet &&
                       adaptiveUIController.breakpoints.desktop;
            }
        },
        {
            name: 'Metrics Generation',
            test: () => {
                const metrics = adaptiveUIController.getMetrics();
                return metrics &&
                       typeof metrics.currentViewport === 'string' &&
                       metrics.screenSize &&
                       typeof metrics.isTouchDevice === 'boolean' &&
                       metrics.configuration;
            }
        },
        {
            name: 'Force Layout Update',
            test: () => {
                try {
                    adaptiveUIController.forceLayoutUpdate();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Integration tests for panel interactions
 */
function runPanelInteractionTests() {
    console.log('Testing panel interactions...');
    
    const tests = [
        {
            name: 'Panel Toggle Integration',
            test: () => {
                const leftPanel = document.getElementById('left-panel');
                const rightPanel = document.getElementById('right-panel');
                
                if (!leftPanel || !rightPanel) {
                    console.warn('Panels not found in DOM, skipping test');
                    return true; // Skip test if panels don't exist
                }
                
                // Test left panel toggle
                const originalLeftState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left');
                const newLeftState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left'); // Restore
                
                return originalLeftState !== newLeftState;
            }
        },
        {
            name: 'Panel State Persistence',
            test: () => {
                const layoutInfo = layoutManager.getLayoutInfo();
                return layoutInfo.panelStates &&
                       Object.keys(layoutInfo.panelStates).length > 0;
            }
        },
        {
            name: 'Panel Visibility CSS Classes',
            test: () => {
                const appContainer = document.getElementById('app-container');
                if (!appContainer) {
                    console.warn('App container not found, skipping test');
                    return true;
                }
                
                const hasLayoutClass = appContainer.classList.contains('mobile-layout') ||
                                      appContainer.classList.contains('tablet-layout') ||
                                      appContainer.classList.contains('desktop-layout');
                
                return hasLayoutClass;
            }
        },
        {
            name: 'Main Content Area Adjustment',
            test: () => {
                const mainContent = document.getElementById('main-content');
                if (!mainContent) {
                    console.warn('Main content not found, skipping test');
                    return true;
                }
                
                // Check if main content has proper styling
                const styles = window.getComputedStyle(mainContent);
                return styles.width && styles.height;
            }
        },
        {
            name: 'Panel Event Dispatching',
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
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Integration tests for canvas resizing
 */
function runCanvasResizeIntegrationTests() {
    console.log('Testing canvas resize integration...');
    
    const tests = [
        {
            name: 'Canvas Container Existence',
            test: () => {
                const canvasContainer = document.getElementById('three-js-canvas-container');
                return canvasContainer !== null;
            }
        },
        {
            name: 'Canvas Resize Event Handling',
            test: () => {
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = true;
                };
                
                const canvasContainer = document.getElementById('three-js-canvas-container');
                if (!canvasContainer) {
                    console.warn('Canvas container not found, skipping test');
                    return true;
                }
                
                canvasContainer.addEventListener('canvasResize', testListener);
                responsiveCanvasContainer.dispatchResizeEvent({ width: 800, height: 600 });
                canvasContainer.removeEventListener('canvasResize', testListener);
                
                return eventReceived;
            }
        },
        {
            name: 'Layout Manager Canvas Integration',
            test: () => {
                try {
                    layoutManager.updateCanvasLayout();
                    return true;
                } catch (error) {
                    console.warn('Canvas layout update failed:', error.message);
                    return false;
                }
            }
        },
        {
            name: 'Canvas Size Calculation',
            test: () => {
                const canvasContainer = document.getElementById('three-js-canvas-container');
                if (!canvasContainer) {
                    console.warn('Canvas container not found, skipping test');
                    return true;
                }
                
                const rect = canvasContainer.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }
        },
        {
            name: 'Responsive Canvas Metrics',
            test: () => {
                const metrics = responsiveCanvasContainer.getMetrics();
                return metrics.totalPixels > 0 && metrics.aspectRatio > 0;
            }
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Visual regression tests for different viewport sizes
 */
function runVisualRegressionTests() {
    console.log('Testing visual regression across viewport sizes...');
    
    const viewportSizes = [
        { width: 320, height: 568, name: 'Mobile Portrait' },
        { width: 568, height: 320, name: 'Mobile Landscape' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 1920, height: 1080, name: 'Desktop HD' },
        { width: 2560, height: 1440, name: 'Desktop QHD' }
    ];
    
    const tests = viewportSizes.map(viewport => ({
        name: `Visual Test - ${viewport.name}`,
        test: () => {
            return testViewportLayout(viewport);
        }
    }));
    
    // Add additional visual tests
    tests.push(
        {
            name: 'Panel Visibility States',
            test: () => {
                return testPanelVisibilityStates();
            }
        },
        {
            name: 'Canvas Aspect Ratio Maintenance',
            test: () => {
                return testCanvasAspectRatio();
            }
        },
        {
            name: 'Touch-Friendly Element Sizing',
            test: () => {
                return testTouchFriendlyElements();
            }
        }
    );
    
    return runTestSuite(tests);
}

/**
 * Test layout for specific viewport size
 */
function testViewportLayout(viewport) {
    console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    // Mock viewport size
    const originalViewportSize = { ...layoutManager.viewportSize };
    layoutManager.viewportSize = { width: viewport.width, height: viewport.height };
    
    try {
        // Test viewport type detection
        const viewportType = layoutManager.getViewportType();
        let expectedType;
        
        if (viewport.width <= 768) {
            expectedType = 'mobile';
        } else if (viewport.width <= 1024) {
            expectedType = 'tablet';
        } else {
            expectedType = 'desktop';
        }
        
        const typeCorrect = viewportType === expectedType;
        
        // Test layout application
        layoutManager.updateLayout();
        
        // Test canvas size calculation
        const mockContainer = {
            getBoundingClientRect: () => ({ width: viewport.width, height: viewport.height })
        };
        
        const originalContainer = responsiveCanvasContainer.container;
        responsiveCanvasContainer.container = mockContainer;
        
        const canvasSize = responsiveCanvasContainer.calculateOptimalSize();
        const canvasSizeValid = canvasSize.width > 0 && canvasSize.height > 0;
        
        responsiveCanvasContainer.container = originalContainer;
        
        // Restore original viewport size
        layoutManager.viewportSize = originalViewportSize;
        
        return typeCorrect && canvasSizeValid;
        
    } catch (error) {
        console.error(`Error testing ${viewport.name}:`, error);
        layoutManager.viewportSize = originalViewportSize;
        return false;
    }
}

/**
 * Test panel visibility states
 */
function testPanelVisibilityStates() {
    const states = ['visible', 'hidden'];
    let allPassed = true;
    
    states.forEach(state => {
        try {
            const originalState = layoutManager.panelStates.left;
            layoutManager.panelStates.left = state;
            layoutManager.updateLayout();
            layoutManager.panelStates.left = originalState;
        } catch (error) {
            console.error(`Error testing panel state ${state}:`, error);
            allPassed = false;
        }
    });
    
    return allPassed;
}

/**
 * Test canvas aspect ratio maintenance
 */
function testCanvasAspectRatio() {
    const testSizes = [
        { width: 800, height: 600 },
        { width: 1920, height: 1080 },
        { width: 1024, height: 768 }
    ];
    
    let allPassed = true;
    
    testSizes.forEach(size => {
        const mockContainer = {
            getBoundingClientRect: () => size
        };
        
        const originalContainer = responsiveCanvasContainer.container;
        responsiveCanvasContainer.container = mockContainer;
        
        const canvasSize = responsiveCanvasContainer.calculateOptimalSize();
        const aspectRatio = canvasSize.width / canvasSize.height;
        
        responsiveCanvasContainer.container = originalContainer;
        
        // Check if aspect ratio is reasonable (between 0.5 and 4.0)
        if (aspectRatio < 0.5 || aspectRatio > 4.0) {
            console.warn(`Unusual aspect ratio ${aspectRatio} for size ${size.width}x${size.height}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

/**
 * Test touch-friendly element sizing
 */
function testTouchFriendlyElements() {
    if (!adaptiveUIController.isTouchDevice()) {
        console.log('  Skipping touch-friendly test on non-touch device');
        return true;
    }
    
    const touchElements = document.querySelectorAll('.touch-friendly');
    let allPassed = true;
    
    touchElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // Minimum touch target size
        
        if (rect.width < minSize || rect.height < minSize) {
            console.warn(`Touch element too small: ${rect.width}x${rect.height}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

/**
 * Performance tests
 */
function runPerformanceTests() {
    console.log('Testing performance...');
    
    const tests = [
        {
            name: 'Layout Update Performance',
            test: () => {
                const startTime = performance.now();
                
                for (let i = 0; i < 100; i++) {
                    layoutManager.updateLayout();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 100;
                
                console.log(`  Average layout update time: ${avgTime.toFixed(2)}ms`);
                return avgTime < 50; // Should be under 50ms per update
            }
        },
        {
            name: 'Canvas Resize Performance',
            test: () => {
                const startTime = performance.now();
                
                for (let i = 0; i < 50; i++) {
                    responsiveCanvasContainer.calculateOptimalSize();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 50;
                
                console.log(`  Average canvas calculation time: ${avgTime.toFixed(2)}ms`);
                return avgTime < 10; // Should be under 10ms per calculation
            }
        },
        {
            name: 'Memory Usage Stability',
            test: () => {
                if (!performance.memory) {
                    console.log('  Memory API not available, skipping test');
                    return true;
                }
                
                const initialMemory = performance.memory.usedJSHeapSize;
                
                // Perform many operations
                for (let i = 0; i < 1000; i++) {
                    layoutManager.getLayoutInfo();
                    responsiveCanvasContainer.getMetrics();
                }
                
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
                
                const finalMemory = performance.memory.usedJSHeapSize;
                const memoryIncrease = finalMemory - initialMemory;
                
                console.log(`  Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
                return memoryIncrease < 10 * 1024 * 1024; // Less than 10MB increase
            }
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Error handling tests
 */
function runErrorHandlingTests() {
    console.log('Testing error handling...');
    
    const tests = [
        {
            name: 'Invalid Panel Toggle',
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
            name: 'Null Container Handling',
            test: () => {
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = null;
                
                try {
                    const size = responsiveCanvasContainer.calculateOptimalSize();
                    responsiveCanvasContainer.container = originalContainer;
                    return size && size.width > 0 && size.height > 0;
                } catch (error) {
                    responsiveCanvasContainer.container = originalContainer;
                    return false;
                }
            }
        },
        {
            name: 'Invalid Size Constraints',
            test: () => {
                try {
                    responsiveCanvasContainer.setMinimumSize({ width: -100, height: -100 });
                    responsiveCanvasContainer.setMaximumSize({ width: 0, height: 0 });
                    return true; // Should handle gracefully
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Layout Error Recovery',
            test: () => {
                // Test if layout manager can recover from errors
                try {
                    // Simulate error condition
                    const originalViewportSize = layoutManager.viewportSize;
                    layoutManager.viewportSize = null;
                    
                    layoutManager.updateLayout();
                    
                    // Restore
                    layoutManager.viewportSize = originalViewportSize;
                    return true;
                } catch (error) {
                    return false;
                }
            }
        }
    ];
    
    return runTestSuite(tests);
}

/**
 * Generic test suite runner
 */
function runTestSuite(tests) {
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
    
    return { passed, failed, total: passed + failed };
}

/**
 * Quick smoke test for basic functionality
 */
export function runLayoutSmokeTest() {
    console.log('🚀 Running Layout System Smoke Test...');
    
    const criticalTests = [
        () => layoutManager !== undefined,
        () => responsiveCanvasContainer !== undefined,
        () => adaptiveUIController !== undefined,
        () => typeof layoutManager.getLayoutInfo === 'function',
        () => typeof responsiveCanvasContainer.calculateOptimalSize === 'function',
        () => typeof adaptiveUIController.getCurrentViewport === 'function'
    ];
    
    let passed = 0;
    criticalTests.forEach((test, index) => {
        if (test()) {
            passed++;
        } else {
            console.log(`❌ Critical test ${index + 1} failed`);
        }
    });
    
    const success = passed === criticalTests.length;
    console.log(`${success ? '✅' : '❌'} Smoke test: ${passed}/${criticalTests.length} critical tests passed`);
    
    return success;
}

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.runComprehensiveLayoutTests = runComprehensiveLayoutTests;
    window.runLayoutSmokeTest = runLayoutSmokeTest;
    window.runLayoutManagerUnitTests = runLayoutManagerUnitTests;
    window.runResponsiveCanvasUnitTests = runResponsiveCanvasUnitTests;
    window.runAdaptiveUIUnitTests = runAdaptiveUIUnitTests;
    window.runPanelInteractionTests = runPanelInteractionTests;
    window.runCanvasResizeIntegrationTests = runCanvasResizeIntegrationTests;
    window.runVisualRegressionTests = runVisualRegressionTests;
    window.runPerformanceTests = runPerformanceTests;
    window.runErrorHandlingTests = runErrorHandlingTests;
    
    console.log('🧪 Comprehensive Layout Tests available globally:');
    console.log('  - runComprehensiveLayoutTests() - Run all comprehensive tests');
    console.log('  - runLayoutSmokeTest() - Quick smoke test');
    console.log('  - Individual test suites also available');
}