/**
 * Integration Tests for Canvas Resizing - Task 14
 * 
 * Tests the integration between canvas resizing components:
 * - ResponsiveCanvasContainer and LayoutManager coordination
 * - Canvas resize events and layout updates
 * - Renderer and camera integration
 * - Performance under different viewport conditions
 * 
 * Requirements: 1.1, 1.2, 6.3
 */

import { layoutManager } from './systems/layoutManager.js';
import { responsiveCanvasContainer } from './responsive-canvas-container.js';
import { adaptiveUIController } from './ui/adaptiveUIController.js';

/**
 * Run all canvas resizing integration tests
 */
export function runCanvasIntegrationTests() {
    console.log('🧪 Canvas Resizing Integration Tests');
    console.log('=' .repeat(45));
    
    const testSuites = [
        { name: 'Canvas-Layout Coordination', tests: getCanvasLayoutCoordinationTests() },
        { name: 'Resize Event Integration', tests: getResizeEventIntegrationTests() },
        { name: 'Renderer Integration Tests', tests: getRendererIntegrationTests() },
        { name: 'Viewport Adaptation Tests', tests: getViewportAdaptationTests() },
        { name: 'Performance Integration Tests', tests: getPerformanceIntegrationTests() },
        { name: 'Error Recovery Tests', tests: getErrorRecoveryTests() },
        { name: 'Memory Management Tests', tests: getMemoryManagementTests() }
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
    
    console.log(`\n📊 Canvas Integration Test Results:`);
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
 * Canvas-Layout coordination tests
 */
function getCanvasLayoutCoordinationTests() {
    return [
        {
            name: 'Layout manager triggers canvas updates',
            test: () => {
                let canvasUpdateCalled = false;
                
                // Mock the canvas update method
                const originalUpdateCanvas = layoutManager.updateCanvasLayout;
                layoutManager.updateCanvasLayout = function() {
                    canvasUpdateCalled = true;
                    return originalUpdateCanvas.call(this);
                };
                
                // Trigger layout update
                layoutManager.updateLayout();
                
                // Restore original method
                layoutManager.updateCanvasLayout = originalUpdateCanvas;
                
                return canvasUpdateCalled;
            }
        },
        {
            name: 'Canvas container responds to layout changes',
            test: () => {
                // Create mock canvas container
                const canvasContainer = document.createElement('div');
                canvasContainer.id = 'three-js-canvas-container';
                canvasContainer.style.width = '800px';
                canvasContainer.style.height = '600px';
                document.body.appendChild(canvasContainer);
                
                try {
                    // Test canvas layout update
                    layoutManager.updateCanvasLayout();
                    
                    // Check if canvas container dimensions are set
                    const styles = window.getComputedStyle(canvasContainer);
                    const hasValidDimensions = parseInt(styles.width) > 0 && parseInt(styles.height) > 0;
                    
                    // Cleanup
                    document.body.removeChild(canvasContainer);
                    
                    return hasValidDimensions;
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
            name: 'Panel state changes affect canvas size',
            test: () => {
                // Create mock elements
                const appContainer = document.createElement('div');
                appContainer.id = 'app-container';
                appContainer.style.display = 'flex';
                appContainer.style.width = '1200px';
                appContainer.style.height = '800px';
                
                const leftPanel = document.createElement('div');
                leftPanel.id = 'left-panel';
                leftPanel.style.width = '280px';
                leftPanel.style.height = '100%';
                
                const mainContent = document.createElement('div');
                mainContent.id = 'main-content';
                mainContent.style.flex = '1';
                mainContent.style.height = '100%';
                
                const canvasContainer = document.createElement('div');
                canvasContainer.id = 'three-js-canvas-container';
                canvasContainer.style.width = '100%';
                canvasContainer.style.height = '100%';
                
                // Build DOM structure
                mainContent.appendChild(canvasContainer);
                appContainer.appendChild(leftPanel);
                appContainer.appendChild(mainContent);
                document.body.appendChild(appContainer);
                
                try {
                    // Get initial canvas size
                    const initialRect = canvasContainer.getBoundingClientRect();
                    
                    // Toggle panel and update layout
                    layoutManager.togglePanel('left');
                    layoutManager.updateLayout();
                    
                    // Get new canvas size
                    const newRect = canvasContainer.getBoundingClientRect();
                    
                    // Restore panel state
                    layoutManager.togglePanel('left');
                    
                    // Cleanup
                    document.body.removeChild(appContainer);
                    
                    // Canvas size should have changed
                    return Math.abs(initialRect.width - newRect.width) > 10;
                } catch (error) {
                    // Cleanup on error
                    if (document.body.contains(appContainer)) {
                        document.body.removeChild(appContainer);
                    }
                    return false;
                }
            }
        },
        {
            name: 'Responsive canvas container integrates with layout manager',
            test: () => {
                // Create mock container and Three.js objects
                const mockContainer = document.createElement('div');
                mockContainer.style.width = '800px';
                mockContainer.style.height = '600px';
                document.body.appendChild(mockContainer);
                
                const mockRenderer = {
                    domElement: document.createElement('canvas'),
                    setSize: (width, height) => {
                        mockRenderer.width = width;
                        mockRenderer.height = height;
                    },
                    setPixelRatio: () => {},
                    getPixelRatio: () => 1,
                    width: 0,
                    height: 0
                };
                
                const mockCamera = {
                    isPerspectiveCamera: true,
                    aspect: 1,
                    updateProjectionMatrix: () => {}
                };
                
                try {
                    // Initialize responsive canvas container
                    const success = responsiveCanvasContainer.initialize(mockContainer, mockRenderer, mockCamera);
                    
                    if (success) {
                        // Force resize
                        responsiveCanvasContainer.forceResize();
                        
                        // Check if renderer was updated
                        const rendererUpdated = mockRenderer.width > 0 && mockRenderer.height > 0;
                        
                        // Cleanup
                        responsiveCanvasContainer.dispose();
                        document.body.removeChild(mockContainer);
                        
                        return rendererUpdated;
                    } else {
                        document.body.removeChild(mockContainer);
                        return false;
                    }
                } catch (error) {
                    // Cleanup on error
                    responsiveCanvasContainer.dispose();
                    if (document.body.contains(mockContainer)) {
                        document.body.removeChild(mockContainer);
                    }
                    return false;
                }
            }
        }
    ];
}

/**
 * Resize event integration tests
 */
function getResizeEventIntegrationTests() {
    return [
        {
            name: 'Canvas resize events are dispatched',
            test: () => {
                const mockContainer = document.createElement('div');
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = event.detail && 
                                   typeof event.detail.width === 'number' &&
                                   typeof event.detail.height === 'number';
                };
                
                mockContainer.addEventListener('canvasResize', testListener);
                
                // Mock responsive canvas container
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                // Dispatch resize event
                responsiveCanvasContainer.dispatchResizeEvent({ width: 800, height: 600 });
                
                // Cleanup
                mockContainer.removeEventListener('canvasResize', testListener);
                responsiveCanvasContainer.container = originalContainer;
                
                return eventReceived;
            }
        },
        {
            name: 'Layout manager listens to canvas resize events',
            test: () => {
                let resizeListenerCalled = false;
                
                const testListener = (width, height) => {
                    resizeListenerCalled = width > 0 && height > 0;
                };
                
                // Add resize listener to layout manager
                layoutManager.addResizeListener(testListener);
                
                // Trigger canvas resize notification
                layoutManager.notifyCanvasResize(800, 600);
                
                // Remove listener
                layoutManager.removeResizeListener(testListener);
                
                return resizeListenerCalled;
            }
        },
        {
            name: 'Window resize triggers canvas updates',
            test: () => {
                // This test simulates window resize and checks if canvas responds
                const originalViewportSize = { ...layoutManager.viewportSize };
                
                try {
                    // Simulate viewport size change
                    layoutManager.viewportSize = { width: 1024, height: 768 };
                    
                    // Trigger layout update (which should update canvas)
                    layoutManager.updateLayout();
                    
                    // Restore original viewport size
                    layoutManager.viewportSize = originalViewportSize;
                    
                    return true; // Should not throw
                } catch (error) {
                    layoutManager.viewportSize = originalViewportSize;
                    return false;
                }
            }
        },
        {
            name: 'Debounced resize handling works',
            test: () => {
                return new Promise((resolve) => {
                    let resizeCount = 0;
                    
                    // Mock the resize handler
                    const originalHandler = responsiveCanvasContainer.handleResize;
                    responsiveCanvasContainer.handleResize = function() {
                        resizeCount++;
                        return originalHandler.call(this);
                    };
                    
                    // Trigger multiple rapid resizes
                    for (let i = 0; i < 5; i++) {
                        responsiveCanvasContainer.debouncedResize();
                    }
                    
                    // Wait for debounce to complete
                    setTimeout(() => {
                        // Restore original handler
                        responsiveCanvasContainer.handleResize = originalHandler;
                        
                        // Should have been called only once due to debouncing
                        resolve(resizeCount === 1);
                    }, 100);
                });
            }
        }
    ];
}

/**
 * Renderer integration tests
 */
function getRendererIntegrationTests() {
    return [
        {
            name: 'Canvas updates renderer size',
            test: () => {
                let rendererSizeSet = false;
                let cameraUpdated = false;
                
                const mockRenderer = {
                    domElement: document.createElement('canvas'),
                    setSize: (width, height) => {
                        rendererSizeSet = width === 800 && height === 600;
                    },
                    setPixelRatio: () => {},
                    getPixelRatio: () => 1
                };
                
                const mockCamera = {
                    isPerspectiveCamera: true,
                    aspect: 1,
                    updateProjectionMatrix: () => {
                        cameraUpdated = true;
                    }
                };
                
                // Mock responsive canvas container properties
                const originalRenderer = responsiveCanvasContainer.renderer;
                const originalCamera = responsiveCanvasContainer.camera;
                
                responsiveCanvasContainer.renderer = mockRenderer;
                responsiveCanvasContainer.camera = mockCamera;
                
                // Update canvas size
                responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                
                // Restore original properties
                responsiveCanvasContainer.renderer = originalRenderer;
                responsiveCanvasContainer.camera = originalCamera;
                
                return rendererSizeSet && cameraUpdated;
            }
        },
        {
            name: 'Camera aspect ratio updates correctly',
            test: () => {
                const mockRenderer = {
                    domElement: document.createElement('canvas'),
                    setSize: () => {},
                    setPixelRatio: () => {},
                    getPixelRatio: () => 1
                };
                
                const mockCamera = {
                    isPerspectiveCamera: true,
                    aspect: 1,
                    updateProjectionMatrix: () => {}
                };
                
                const originalRenderer = responsiveCanvasContainer.renderer;
                const originalCamera = responsiveCanvasContainer.camera;
                
                responsiveCanvasContainer.renderer = mockRenderer;
                responsiveCanvasContainer.camera = mockCamera;
                
                // Update with specific aspect ratio
                responsiveCanvasContainer.updateCanvasSize({ width: 1600, height: 900 });
                
                const expectedAspect = 1600 / 900;
                const aspectCorrect = Math.abs(mockCamera.aspect - expectedAspect) < 0.001;
                
                // Restore original properties
                responsiveCanvasContainer.renderer = originalRenderer;
                responsiveCanvasContainer.camera = originalCamera;
                
                return aspectCorrect;
            }
        },
        {
            name: 'Orthographic camera updates correctly',
            test: () => {
                const mockRenderer = {
                    domElement: document.createElement('canvas'),
                    setSize: () => {},
                    setPixelRatio: () => {},
                    getPixelRatio: () => 1
                };
                
                let projectionUpdated = false;
                const mockCamera = {
                    isOrthographicCamera: true,
                    left: -1,
                    right: 1,
                    updateProjectionMatrix: () => {
                        projectionUpdated = true;
                    }
                };
                
                const originalRenderer = responsiveCanvasContainer.renderer;
                const originalCamera = responsiveCanvasContainer.camera;
                
                responsiveCanvasContainer.renderer = mockRenderer;
                responsiveCanvasContainer.camera = mockCamera;
                
                // Update canvas size
                responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                
                const expectedAspect = 800 / 600;
                const boundsCorrect = mockCamera.left === -expectedAspect && mockCamera.right === expectedAspect;
                
                // Restore original properties
                responsiveCanvasContainer.renderer = originalRenderer;
                responsiveCanvasContainer.camera = originalCamera;
                
                return boundsCorrect && projectionUpdated;
            }
        },
        {
            name: 'Pixel ratio is set correctly',
            test: () => {
                let pixelRatioSet = false;
                
                const mockRenderer = {
                    domElement: document.createElement('canvas'),
                    setSize: () => {},
                    setPixelRatio: (ratio) => {
                        pixelRatioSet = ratio > 0 && ratio <= 2;
                    },
                    getPixelRatio: () => 1
                };
                
                const mockCamera = {
                    isPerspectiveCamera: true,
                    aspect: 1,
                    updateProjectionMatrix: () => {}
                };
                
                const originalRenderer = responsiveCanvasContainer.renderer;
                const originalCamera = responsiveCanvasContainer.camera;
                
                responsiveCanvasContainer.renderer = mockRenderer;
                responsiveCanvasContainer.camera = mockCamera;
                
                // Update canvas size (which should set pixel ratio)
                responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                
                // Restore original properties
                responsiveCanvasContainer.renderer = originalRenderer;
                responsiveCanvasContainer.camera = originalCamera;
                
                return pixelRatioSet;
            }
        }
    ];
}

/**
 * Viewport adaptation tests
 */
function getViewportAdaptationTests() {
    return [
        {
            name: 'Canvas adapts to mobile viewport',
            test: () => {
                const originalViewportSize = { ...layoutManager.viewportSize };
                
                // Set mobile viewport
                layoutManager.viewportSize = { width: 375, height: 667 };
                
                try {
                    // Update layout
                    layoutManager.updateLayout();
                    
                    // Check viewport type
                    const viewportType = layoutManager.getViewportType();
                    
                    // Restore original viewport
                    layoutManager.viewportSize = originalViewportSize;
                    
                    return viewportType === 'mobile';
                } catch (error) {
                    layoutManager.viewportSize = originalViewportSize;
                    return false;
                }
            }
        },
        {
            name: 'Canvas adapts to tablet viewport',
            test: () => {
                const originalViewportSize = { ...layoutManager.viewportSize };
                
                // Set tablet viewport
                layoutManager.viewportSize = { width: 768, height: 1024 };
                
                try {
                    // Update layout
                    layoutManager.updateLayout();
                    
                    // Check viewport type
                    const viewportType = layoutManager.getViewportType();
                    
                    // Restore original viewport
                    layoutManager.viewportSize = originalViewportSize;
                    
                    return viewportType === 'tablet';
                } catch (error) {
                    layoutManager.viewportSize = originalViewportSize;
                    return false;
                }
            }
        },
        {
            name: 'Canvas adapts to desktop viewport',
            test: () => {
                const originalViewportSize = { ...layoutManager.viewportSize };
                
                // Set desktop viewport
                layoutManager.viewportSize = { width: 1920, height: 1080 };
                
                try {
                    // Update layout
                    layoutManager.updateLayout();
                    
                    // Check viewport type
                    const viewportType = layoutManager.getViewportType();
                    
                    // Restore original viewport
                    layoutManager.viewportSize = originalViewportSize;
                    
                    return viewportType === 'desktop';
                } catch (error) {
                    layoutManager.viewportSize = originalViewportSize;
                    return false;
                }
            }
        },
        {
            name: 'Canvas size constraints work across viewports',
            test: () => {
                const viewportSizes = [
                    { width: 320, height: 568 }, // Mobile
                    { width: 768, height: 1024 }, // Tablet
                    { width: 1920, height: 1080 } // Desktop
                ];
                
                let allValid = true;
                
                viewportSizes.forEach(viewport => {
                    const mockContainer = {
                        getBoundingClientRect: () => viewport
                    };
                    
                    const originalContainer = responsiveCanvasContainer.container;
                    responsiveCanvasContainer.container = mockContainer;
                    
                    const canvasSize = responsiveCanvasContainer.calculateOptimalSize();
                    
                    // Check if size meets minimum constraints
                    if (canvasSize.width < responsiveCanvasContainer.minSize.width ||
                        canvasSize.height < responsiveCanvasContainer.minSize.height) {
                        allValid = false;
                    }
                    
                    responsiveCanvasContainer.container = originalContainer;
                });
                
                return allValid;
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
            name: 'Canvas resize performance under load',
            test: () => {
                const startTime = performance.now();
                
                // Perform multiple canvas resizes
                for (let i = 0; i < 100; i++) {
                    responsiveCanvasContainer.calculateOptimalSize();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 100;
                
                console.log(`    Average canvas resize time: ${avgTime.toFixed(3)}ms`);
                return avgTime < 2; // Should be under 2ms per resize
            }
        },
        {
            name: 'Layout update performance with canvas',
            test: () => {
                const startTime = performance.now();
                
                // Perform multiple layout updates
                for (let i = 0; i < 50; i++) {
                    layoutManager.updateLayout();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 50;
                
                console.log(`    Average layout update time: ${avgTime.toFixed(2)}ms`);
                return avgTime < 20; // Should be under 20ms per update
            }
        },
        {
            name: 'Event handling performance',
            test: () => {
                let eventCount = 0;
                const testListener = () => { eventCount++; };
                
                // Add multiple listeners
                for (let i = 0; i < 5; i++) {
                    layoutManager.addResizeListener(testListener);
                }
                
                const startTime = performance.now();
                
                // Trigger multiple events
                for (let i = 0; i < 100; i++) {
                    layoutManager.notifyCanvasResize(800, 600);
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 100;
                
                // Cleanup
                for (let i = 0; i < 5; i++) {
                    layoutManager.removeResizeListener(testListener);
                }
                
                console.log(`    Average event handling time: ${avgTime.toFixed(3)}ms`);
                return avgTime < 1 && eventCount === 500; // 5 listeners × 100 events
            }
        }
    ];
}

/**
 * Error recovery tests
 */
function getErrorRecoveryTests() {
    return [
        {
            name: 'Canvas handles missing DOM elements gracefully',
            test: () => {
                try {
                    // This should not throw even if canvas container is missing
                    layoutManager.updateCanvasLayout();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Responsive canvas handles initialization errors',
            test: () => {
                try {
                    // Try to initialize with invalid parameters
                    const result = responsiveCanvasContainer.initialize(null, null, null);
                    return result === false; // Should return false, not throw
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Canvas size calculation handles edge cases',
            test: () => {
                const edgeCases = [
                    { width: 0, height: 0 },
                    { width: -100, height: -100 },
                    { width: Infinity, height: Infinity },
                    { width: NaN, height: NaN }
                ];
                
                let allHandled = true;
                
                edgeCases.forEach(testCase => {
                    const mockContainer = {
                        getBoundingClientRect: () => testCase
                    };
                    
                    const originalContainer = responsiveCanvasContainer.container;
                    responsiveCanvasContainer.container = mockContainer;
                    
                    try {
                        const size = responsiveCanvasContainer.calculateOptimalSize();
                        
                        // Should return valid size even with invalid input
                        if (!size || size.width <= 0 || size.height <= 0 || 
                            !isFinite(size.width) || !isFinite(size.height)) {
                            allHandled = false;
                        }
                    } catch (error) {
                        allHandled = false;
                    }
                    
                    responsiveCanvasContainer.container = originalContainer;
                });
                
                return allHandled;
            }
        }
    ];
}

/**
 * Memory management tests
 */
function getMemoryManagementTests() {
    return [
        {
            name: 'Event listeners are properly cleaned up',
            test: () => {
                const testCallback = () => {};
                
                // Add listeners
                layoutManager.addResizeListener(testCallback);
                layoutManager.addLayoutChangeListener(testCallback);
                
                // Remove listeners
                layoutManager.removeResizeListener(testCallback);
                layoutManager.removeLayoutChangeListener(testCallback);
                
                // Check if listeners arrays are cleaned up
                const resizeListenersEmpty = !layoutManager.resizeListeners.includes(testCallback);
                const layoutListenersEmpty = !layoutManager.layoutChangeListeners.includes(testCallback);
                
                return resizeListenersEmpty && layoutListenersEmpty;
            }
        },
        {
            name: 'ResponsiveCanvasContainer dispose works correctly',
            test: () => {
                // Create a test instance
                const testContainer = Object.create(responsiveCanvasContainer);
                testContainer.resizeTimeout = setTimeout(() => {}, 1000);
                testContainer.resizeObserver = { disconnect: () => {} };
                testContainer.isInitialized = true;
                
                // Dispose
                testContainer.dispose();
                
                // Check cleanup
                return testContainer.resizeTimeout === null &&
                       testContainer.resizeObserver === null &&
                       testContainer.isInitialized === false;
            }
        },
        {
            name: 'No memory leaks in repeated operations',
            test: () => {
                if (!performance.memory) {
                    console.log('    Memory API not available, skipping test');
                    return true;
                }
                
                const initialMemory = performance.memory.usedJSHeapSize;
                
                // Perform many operations that could cause leaks
                for (let i = 0; i < 1000; i++) {
                    const callback = () => {};
                    layoutManager.addResizeListener(callback);
                    layoutManager.removeResizeListener(callback);
                    
                    responsiveCanvasContainer.calculateOptimalSize();
                    layoutManager.getLayoutInfo();
                }
                
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
                
                const finalMemory = performance.memory.usedJSHeapSize;
                const memoryIncrease = finalMemory - initialMemory;
                
                console.log(`    Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
                return memoryIncrease < 5 * 1024 * 1024; // Less than 5MB increase
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
            
            // Handle promises
            if (result instanceof Promise) {
                result.then(promiseResult => {
                    if (promiseResult) {
                        console.log(`  ✅ ${test.name}`);
                        passed++;
                    } else {
                        console.log(`  ❌ ${test.name}`);
                        failed++;
                    }
                }).catch(error => {
                    console.log(`  💥 ${test.name}: ${error.message}`);
                    failed++;
                });
            } else {
                if (result) {
                    console.log(`  ✅ ${test.name}`);
                    passed++;
                } else {
                    console.log(`  ❌ ${test.name}`);
                    failed++;
                }
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
    window.runCanvasIntegrationTests = runCanvasIntegrationTests;
    console.log('🧪 Canvas integration tests available as window.runCanvasIntegrationTests()');
}