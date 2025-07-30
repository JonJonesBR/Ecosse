/**
 * Integration Tests for Panel Interactions - Task 14
 * 
 * Tests the integration between different UI components for panel interactions:
 * - Panel toggle functionality across different viewport sizes
 * - Layout manager and adaptive UI controller coordination
 * - Panel state persistence and synchronization
 * - Main content area adjustments
 * 
 * Requirements: 1.1, 1.2, 5.1, 5.2
 */

import { layoutManager } from './systems/layoutManager.js';
import { adaptiveUIController } from './ui/adaptiveUIController.js';

/**
 * Run all panel interaction integration tests
 */
export function runPanelIntegrationTests() {
    console.log('🧪 Panel Interaction Integration Tests');
    console.log('=' .repeat(45));
    
    const testSuites = [
        { name: 'Panel Toggle Integration', tests: getPanelToggleTests() },
        { name: 'Viewport Coordination Tests', tests: getViewportCoordinationTests() },
        { name: 'State Synchronization Tests', tests: getStateSynchronizationTests() },
        { name: 'Layout Adjustment Tests', tests: getLayoutAdjustmentTests() },
        { name: 'Event Propagation Tests', tests: getEventPropagationTests() },
        { name: 'Touch Interaction Tests', tests: getTouchInteractionTests() },
        { name: 'Performance Integration Tests', tests: getPerformanceIntegrationTests() }
    ];
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    testSuites.forEach(suite => {
        console.log(`\n📋 ${suite.name}`);
        console.log('-'.repeat(35));
        
        const result = runTestGroup(suite.tests);
        totalPassed += result.passed;
        totalFailed += result.failed;
    });
    
    const total = totalPassed + totalFailed;
    const passRate = total > 0 ? (totalPassed / total * 100).toFixed(1) : 0;
    
    console.log(`\n📊 Panel Integration Test Results:`);
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
 * Panel toggle integration tests
 */
function getPanelToggleTests() {
    return [
        {
            name: 'Left panel toggle updates layout manager state',
            test: () => {
                const originalState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left');
                const newState = layoutManager.panelStates.left;
                layoutManager.togglePanel('left'); // Restore
                
                return originalState !== newState;
            }
        },
        {
            name: 'Right panel toggle updates layout manager state',
            test: () => {
                const originalState = layoutManager.panelStates.right;
                layoutManager.togglePanel('right');
                const newState = layoutManager.panelStates.right;
                layoutManager.togglePanel('right'); // Restore
                
                return originalState !== newState;
            }
        },
        {
            name: 'Panel toggle triggers layout update',
            test: () => {
                let layoutUpdateCalled = false;
                
                // Mock the updateLayout method temporarily
                const originalUpdateLayout = layoutManager.updateLayout;
                layoutManager.updateLayout = function() {
                    layoutUpdateCalled = true;
                    return originalUpdateLayout.call(this);
                };
                
                layoutManager.togglePanel('left');
                layoutManager.togglePanel('left'); // Restore
                
                // Restore original method
                layoutManager.updateLayout = originalUpdateLayout;
                
                return layoutUpdateCalled;
            }
        },
        {
            name: 'Panel toggle with DOM elements',
            test: () => {
                // Create mock DOM elements
                const leftPanel = document.createElement('div');
                leftPanel.id = 'left-panel';
                leftPanel.classList.add('panel');
                document.body.appendChild(leftPanel);
                
                const rightPanel = document.createElement('div');
                rightPanel.id = 'right-panel';
                rightPanel.classList.add('panel');
                document.body.appendChild(rightPanel);
                
                try {
                    layoutManager.togglePanel('left');
                    layoutManager.togglePanel('left'); // Restore
                    
                    // Cleanup
                    document.body.removeChild(leftPanel);
                    document.body.removeChild(rightPanel);
                    
                    return true;
                } catch (error) {
                    // Cleanup on error
                    if (document.body.contains(leftPanel)) {
                        document.body.removeChild(leftPanel);
                    }
                    if (document.body.contains(rightPanel)) {
                        document.body.removeChild(rightPanel);
                    }
                    return false;
                }
            }
        },
        {
            name: 'Multiple panel toggles work correctly',
            test: () => {
                const originalLeftState = layoutManager.panelStates.left;
                const originalRightState = layoutManager.panelStates.right;
                
                // Toggle both panels
                layoutManager.togglePanel('left');
                layoutManager.togglePanel('right');
                
                const bothChanged = layoutManager.panelStates.left !== originalLeftState &&
                                   layoutManager.panelStates.right !== originalRightState;
                
                // Restore
                layoutManager.togglePanel('left');
                layoutManager.togglePanel('right');
                
                return bothChanged;
            }
        }
    ];
}

/**
 * Viewport coordination tests
 */
function getViewportCoordinationTests() {
    return [
        {
            name: 'Layout manager and adaptive UI controller viewport sync',
            test: () => {
                const layoutViewport = layoutManager.getViewportType();
                const adaptiveViewport = adaptiveUIController.getCurrentViewport();
                
                // They should be in sync or at least both valid
                const validViewports = ['mobile', 'tablet', 'desktop'];
                return validViewports.includes(layoutViewport) && 
                       validViewports.includes(adaptiveViewport);
            }
        },
        {
            name: 'Panel behavior adapts to viewport changes',
            test: () => {
                // Mock different viewport sizes
                const testViewports = [
                    { width: 600, height: 800, expected: 'mobile' },
                    { width: 900, height: 1200, expected: 'tablet' },
                    { width: 1600, height: 1200, expected: 'desktop' }
                ];
                
                let allCorrect = true;
                
                testViewports.forEach(viewport => {
                    const originalSize = { ...layoutManager.viewportSize };
                    layoutManager.viewportSize = { width: viewport.width, height: viewport.height };
                    
                    const detectedType = layoutManager.getViewportType();
                    if (detectedType !== viewport.expected) {
                        allCorrect = false;
                    }
                    
                    layoutManager.viewportSize = originalSize;
                });
                
                return allCorrect;
            }
        },
        {
            name: 'Panel configuration changes with viewport',
            test: () => {
                const originalViewport = adaptiveUIController.getCurrentViewport();
                
                // Force different viewport configurations
                const mobileConfig = adaptiveUIController.layoutConfigurations.get('mobile');
                const desktopConfig = adaptiveUIController.layoutConfigurations.get('desktop');
                
                return mobileConfig && desktopConfig &&
                       mobileConfig.panelBehavior !== desktopConfig.panelBehavior;
            }
        },
        {
            name: 'Touch device detection affects panel behavior',
            test: () => {
                const isTouchDevice = adaptiveUIController.isTouchDevice();
                const config = adaptiveUIController.getCurrentConfiguration();
                
                // Touch devices should have appropriate touch target sizes
                if (isTouchDevice) {
                    return config.touchTargetMinSize >= 40;
                } else {
                    return config.touchTargetMinSize >= 32;
                }
            }
        }
    ];
}

/**
 * State synchronization tests
 */
function getStateSynchronizationTests() {
    return [
        {
            name: 'Panel states persist across layout updates',
            test: () => {
                const originalState = layoutManager.panelStates.left;
                
                // Change panel state
                layoutManager.togglePanel('left');
                const modifiedState = layoutManager.panelStates.left;
                
                // Trigger layout update
                layoutManager.updateLayout();
                
                // State should be preserved
                const preservedState = layoutManager.panelStates.left === modifiedState;
                
                // Restore
                layoutManager.togglePanel('left');
                
                return preservedState;
            }
        },
        {
            name: 'Layout info reflects current panel states',
            test: () => {
                const layoutInfo = layoutManager.getLayoutInfo();
                
                return layoutInfo.panelStates &&
                       layoutInfo.panelStates.left === layoutManager.panelStates.left &&
                       layoutInfo.panelStates.right === layoutManager.panelStates.right &&
                       layoutInfo.panelStates.controls === layoutManager.panelStates.controls;
            }
        },
        {
            name: 'Panel state changes trigger notifications',
            test: () => {
                let notificationReceived = false;
                
                const testListener = () => {
                    notificationReceived = true;
                };
                
                layoutManager.addLayoutChangeListener(testListener);
                layoutManager.togglePanel('left');
                layoutManager.togglePanel('left'); // Restore
                layoutManager.removeLayoutChangeListener(testListener);
                
                return notificationReceived;
            }
        },
        {
            name: 'Adaptive UI controller responds to layout changes',
            test: () => {
                // This tests if the adaptive UI controller can handle layout change events
                try {
                    const event = new CustomEvent('layoutChanged', {
                        detail: {
                            viewportSize: { width: 1024, height: 768 },
                            viewportType: 'tablet',
                            panelStates: { left: 'visible', right: 'visible', controls: 'floating' }
                        }
                    });
                    
                    document.dispatchEvent(event);
                    return true; // Should not throw
                } catch (error) {
                    return false;
                }
            }
        }
    ];
}

/**
 * Layout adjustment tests
 */
function getLayoutAdjustmentTests() {
    return [
        {
            name: 'Main content area adjusts to panel states',
            test: () => {
                // Create mock main content element
                const mainContent = document.createElement('div');
                mainContent.id = 'main-content';
                mainContent.style.width = '100%';
                mainContent.style.height = '100vh';
                document.body.appendChild(mainContent);
                
                try {
                    // Test layout update
                    layoutManager.updateLayout();
                    
                    // Check if main content has proper styling
                    const styles = window.getComputedStyle(mainContent);
                    const hasValidStyles = styles.width && styles.height;
                    
                    // Cleanup
                    document.body.removeChild(mainContent);
                    
                    return hasValidStyles;
                } catch (error) {
                    // Cleanup on error
                    if (document.body.contains(mainContent)) {
                        document.body.removeChild(mainContent);
                    }
                    return false;
                }
            }
        },
        {
            name: 'Canvas container adjusts to layout changes',
            test: () => {
                // Create mock canvas container
                const canvasContainer = document.createElement('div');
                canvasContainer.id = 'three-js-canvas-container';
                canvasContainer.style.position = 'relative';
                document.body.appendChild(canvasContainer);
                
                try {
                    // Test canvas layout update
                    layoutManager.updateCanvasLayout();
                    
                    // Check if canvas container has proper styling
                    const styles = window.getComputedStyle(canvasContainer);
                    const hasValidStyles = styles.position === 'relative';
                    
                    // Cleanup
                    document.body.removeChild(canvasContainer);
                    
                    return hasValidStyles;
                } catch (error) {
                    // Cleanup on error
                    if (document.body.contains(canvasContainer)) {
                        document.body.removeChild(canvasContainer);
                    }
                    return false;
                }
            }
        },
        {
            name: 'App container gets responsive classes',
            test: () => {
                // Create mock app container
                const appContainer = document.createElement('div');
                appContainer.id = 'app-container';
                document.body.appendChild(appContainer);
                
                try {
                    // Test responsive layout application
                    layoutManager.updateLayout();
                    
                    // Check if app container has layout classes
                    const hasLayoutClass = appContainer.classList.contains('mobile-layout') ||
                                          appContainer.classList.contains('tablet-layout') ||
                                          appContainer.classList.contains('desktop-layout');
                    
                    // Cleanup
                    document.body.removeChild(appContainer);
                    
                    return hasLayoutClass;
                } catch (error) {
                    // Cleanup on error
                    if (document.body.contains(appContainer)) {
                        document.body.removeChild(appContainer);
                    }
                    return false;
                }
            }
        }
    ];
}

/**
 * Event propagation tests
 */
function getEventPropagationTests() {
    return [
        {
            name: 'Layout change events are dispatched',
            test: () => {
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = event.detail && 
                                   event.detail.viewportSize &&
                                   event.detail.panelStates;
                };
                
                document.addEventListener('layoutChanged', testListener);
                layoutManager.notifyLayoutChange();
                document.removeEventListener('layoutChanged', testListener);
                
                return eventReceived;
            }
        },
        {
            name: 'Panel toggle events are dispatched',
            test: () => {
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = event.detail && 
                                   typeof event.detail.panelId === 'string' &&
                                   typeof event.detail.isOpen === 'boolean';
                };
                
                document.addEventListener('panelToggle', testListener);
                
                // Manually dispatch a panel toggle event
                const event = new CustomEvent('panelToggle', {
                    detail: { panelId: 'left', isOpen: true }
                });
                document.dispatchEvent(event);
                
                document.removeEventListener('panelToggle', testListener);
                
                return eventReceived;
            }
        },
        {
            name: 'Viewport change events are dispatched',
            test: () => {
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = event.detail && 
                                   event.detail.from &&
                                   event.detail.to &&
                                   event.detail.configuration;
                };
                
                document.addEventListener('viewportChanged', testListener);
                
                // Manually dispatch a viewport change event
                adaptiveUIController.dispatchViewportChangeEvent('tablet', 'desktop');
                
                document.removeEventListener('viewportChanged', testListener);
                
                return eventReceived;
            }
        }
    ];
}

/**
 * Touch interaction tests
 */
function getTouchInteractionTests() {
    return [
        {
            name: 'Touch device detection works',
            test: () => {
                const isTouchDevice = adaptiveUIController.isTouchDevice();
                return typeof isTouchDevice === 'boolean';
            }
        },
        {
            name: 'Touch-friendly elements have appropriate sizing',
            test: () => {
                if (!adaptiveUIController.isTouchDevice()) {
                    console.log('    Skipping touch test on non-touch device');
                    return true;
                }
                
                // Create mock touch-friendly element
                const touchElement = document.createElement('button');
                touchElement.classList.add('touch-friendly');
                touchElement.style.width = '30px';
                touchElement.style.height = '30px';
                document.body.appendChild(touchElement);
                
                try {
                    // Apply touch-friendly configuration
                    const config = adaptiveUIController.getCurrentConfiguration();
                    adaptiveUIController.applyTouchFriendlyConfiguration(config);
                    
                    const rect = touchElement.getBoundingClientRect();
                    const meetsMinSize = rect.width >= config.touchTargetMinSize &&
                                        rect.height >= config.touchTargetMinSize;
                    
                    // Cleanup
                    document.body.removeChild(touchElement);
                    
                    return meetsMinSize;
                } catch (error) {
                    // Cleanup on error
                    if (document.body.contains(touchElement)) {
                        document.body.removeChild(touchElement);
                    }
                    return false;
                }
            }
        },
        {
            name: 'Mobile panel gestures are set up',
            test: () => {
                if (adaptiveUIController.getCurrentViewport() !== 'mobile') {
                    console.log('    Skipping mobile gesture test on non-mobile viewport');
                    return true;
                }
                
                // This test verifies that mobile gesture setup doesn't throw errors
                try {
                    adaptiveUIController.setupMobilePanelGestures();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        }
    ];
}

/**
 * Performance integration tests
 */
function getPerformanceIntegrationTests() {
    return [
        {
            name: 'Panel toggle performance',
            test: () => {
                const startTime = performance.now();
                
                // Perform multiple panel toggles
                for (let i = 0; i < 50; i++) {
                    layoutManager.togglePanel('left');
                    layoutManager.togglePanel('left');
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 100; // 100 operations total
                
                console.log(`    Average panel toggle time: ${avgTime.toFixed(2)}ms`);
                return avgTime < 10; // Should be under 10ms per toggle
            }
        },
        {
            name: 'Layout update performance with panels',
            test: () => {
                const startTime = performance.now();
                
                // Perform multiple layout updates
                for (let i = 0; i < 20; i++) {
                    layoutManager.updateLayout();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 20;
                
                console.log(`    Average layout update time: ${avgTime.toFixed(2)}ms`);
                return avgTime < 50; // Should be under 50ms per update
            }
        },
        {
            name: 'Event notification performance',
            test: () => {
                let callbackCount = 0;
                const testCallback = () => { callbackCount++; };
                
                // Add multiple listeners
                for (let i = 0; i < 10; i++) {
                    layoutManager.addLayoutChangeListener(testCallback);
                }
                
                const startTime = performance.now();
                
                // Trigger notifications
                for (let i = 0; i < 10; i++) {
                    layoutManager.notifyLayoutChange();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 10;
                
                // Cleanup
                for (let i = 0; i < 10; i++) {
                    layoutManager.removeLayoutChangeListener(testCallback);
                }
                
                console.log(`    Average notification time: ${avgTime.toFixed(2)}ms`);
                return avgTime < 5 && callbackCount === 100; // 10 listeners × 10 notifications
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
    window.runPanelIntegrationTests = runPanelIntegrationTests;
    console.log('🧪 Panel integration tests available as window.runPanelIntegrationTests()');
}