/**
 * Unit Tests for ResponsiveCanvasContainer Class - Task 14
 * 
 * Comprehensive unit tests for the ResponsiveCanvasContainer class covering:
 * - Initialization and setup
 * - Size calculations and constraints
 * - Canvas resizing and updates
 * - Event handling and metrics
 * - Error handling and edge cases
 * 
 * Requirements: 1.1, 1.2, 6.3
 */

import { responsiveCanvasContainer } from './responsive-canvas-container.js';

/**
 * Run all ResponsiveCanvasContainer unit tests
 */
export function runResponsiveCanvasUnitTests() {
    console.log('🧪 ResponsiveCanvasContainer Unit Tests');
    console.log('=' .repeat(45));
    
    const testSuites = [
        { name: 'Initialization Tests', tests: getInitializationTests() },
        { name: 'Size Calculation Tests', tests: getSizeCalculationTests() },
        { name: 'Constraint Tests', tests: getConstraintTests() },
        { name: 'Canvas Update Tests', tests: getCanvasUpdateTests() },
        { name: 'Event Handling Tests', tests: getEventHandlingTests() },
        { name: 'Metrics Tests', tests: getMetricsTests() },
        { name: 'Error Handling Tests', tests: getErrorHandlingTests() },
        { name: 'Performance Tests', tests: getPerformanceTests() }
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
    
    console.log(`\n📊 ResponsiveCanvasContainer Unit Test Results:`);
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
            name: 'ResponsiveCanvasContainer exists',
            test: () => {
                return responsiveCanvasContainer !== undefined && responsiveCanvasContainer !== null;
            }
        },
        {
            name: 'Has required methods',
            test: () => {
                const requiredMethods = [
                    'initialize', 'calculateOptimalSize', 'updateCanvasSize',
                    'getMetrics', 'getCurrentSize', 'getContainerSize',
                    'setMinimumSize', 'setMaximumSize', 'forceResize', 'dispose'
                ];
                
                return requiredMethods.every(method => 
                    typeof responsiveCanvasContainer[method] === 'function'
                );
            }
        },
        {
            name: 'Has default properties',
            test: () => {
                return responsiveCanvasContainer.minSize &&
                       responsiveCanvasContainer.maxSize &&
                       typeof responsiveCanvasContainer.minSize.width === 'number' &&
                       typeof responsiveCanvasContainer.minSize.height === 'number' &&
                       typeof responsiveCanvasContainer.maxSize.width === 'number' &&
                       typeof responsiveCanvasContainer.maxSize.height === 'number';
            }
        },
        {
            name: 'Default minimum size is reasonable',
            test: () => {
                return responsiveCanvasContainer.minSize.width >= 300 &&
                       responsiveCanvasContainer.minSize.height >= 200;
            }
        },
        {
            name: 'Default maximum size is reasonable',
            test: () => {
                return responsiveCanvasContainer.maxSize.width >= 1920 &&
                       responsiveCanvasContainer.maxSize.height >= 1080;
            }
        },
        {
            name: 'Initialization with mock objects works',
            test: () => {
                // Create mock objects
                const mockContainer = document.createElement('div');
                mockContainer.style.width = '800px';
                mockContainer.style.height = '600px';
                
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
                
                // Test initialization
                const success = responsiveCanvasContainer.initialize(mockContainer, mockRenderer, mockCamera);
                
                // Cleanup
                responsiveCanvasContainer.dispose();
                
                return success;
            }
        }
    ];
}

/**
 * Size calculation tests
 */
function getSizeCalculationTests() {
    return [
        {
            name: 'calculateOptimalSize returns valid dimensions',
            test: () => {
                const size = responsiveCanvasContainer.calculateOptimalSize();
                return size && 
                       typeof size.width === 'number' && 
                       typeof size.height === 'number' &&
                       size.width > 0 && 
                       size.height > 0;
            }
        },
        {
            name: 'calculateOptimalSize with mock container',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 1024, height: 768 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                
                responsiveCanvasContainer.container = originalContainer;
                
                return size.width === 1024 && size.height === 768;
            }
        },
        {
            name: 'calculateOptimalSize respects minimum constraints',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 100, height: 100 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                
                responsiveCanvasContainer.container = originalContainer;
                
                return size.width >= responsiveCanvasContainer.minSize.width &&
                       size.height >= responsiveCanvasContainer.minSize.height;
            }
        },
        {
            name: 'calculateOptimalSize respects maximum constraints',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 10000, height: 10000 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                
                responsiveCanvasContainer.container = originalContainer;
                
                return size.width <= responsiveCanvasContainer.maxSize.width &&
                       size.height <= responsiveCanvasContainer.maxSize.height;
            }
        },
        {
            name: 'calculateOptimalSize handles very wide containers',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 3000, height: 600 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                const aspectRatio = size.width / size.height;
                
                responsiveCanvasContainer.container = originalContainer;
                
                // Should limit width for very wide containers
                return aspectRatio <= 3;
            }
        },
        {
            name: 'calculateOptimalSize handles very tall containers',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 400, height: 2000 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.calculateOptimalSize();
                const aspectRatio = size.width / size.height;
                
                responsiveCanvasContainer.container = originalContainer;
                
                // Should limit height for very tall containers
                return aspectRatio >= 0.4;
            }
        }
    ];
}

/**
 * Constraint tests
 */
function getConstraintTests() {
    return [
        {
            name: 'setMinimumSize updates constraints',
            test: () => {
                const originalMinSize = { ...responsiveCanvasContainer.minSize };
                const testMinSize = { width: 500, height: 400 };
                
                responsiveCanvasContainer.setMinimumSize(testMinSize);
                const updated = responsiveCanvasContainer.minSize.width === testMinSize.width &&
                               responsiveCanvasContainer.minSize.height === testMinSize.height;
                
                // Restore original
                responsiveCanvasContainer.setMinimumSize(originalMinSize);
                
                return updated;
            }
        },
        {
            name: 'setMaximumSize updates constraints',
            test: () => {
                const originalMaxSize = { ...responsiveCanvasContainer.maxSize };
                const testMaxSize = { width: 2000, height: 1500 };
                
                responsiveCanvasContainer.setMaximumSize(testMaxSize);
                const updated = responsiveCanvasContainer.maxSize.width === testMaxSize.width &&
                               responsiveCanvasContainer.maxSize.height === testMaxSize.height;
                
                // Restore original
                responsiveCanvasContainer.setMaximumSize(originalMaxSize);
                
                return updated;
            }
        },
        {
            name: 'setMinimumSize triggers resize',
            test: () => {
                const originalMinSize = { ...responsiveCanvasContainer.minSize };
                
                try {
                    responsiveCanvasContainer.setMinimumSize({ width: 600, height: 500 });
                    responsiveCanvasContainer.setMinimumSize(originalMinSize);
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.setMinimumSize(originalMinSize);
                    return false;
                }
            }
        },
        {
            name: 'setMaximumSize triggers resize',
            test: () => {
                const originalMaxSize = { ...responsiveCanvasContainer.maxSize };
                
                try {
                    responsiveCanvasContainer.setMaximumSize({ width: 1800, height: 1200 });
                    responsiveCanvasContainer.setMaximumSize(originalMaxSize);
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.setMaximumSize(originalMaxSize);
                    return false;
                }
            }
        },
        {
            name: 'Invalid minimum size is handled gracefully',
            test: () => {
                const originalMinSize = { ...responsiveCanvasContainer.minSize };
                
                try {
                    responsiveCanvasContainer.setMinimumSize({ width: -100, height: -100 });
                    responsiveCanvasContainer.setMinimumSize(originalMinSize);
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.setMinimumSize(originalMinSize);
                    return false;
                }
            }
        },
        {
            name: 'Invalid maximum size is handled gracefully',
            test: () => {
                const originalMaxSize = { ...responsiveCanvasContainer.maxSize };
                
                try {
                    responsiveCanvasContainer.setMaximumSize({ width: 0, height: 0 });
                    responsiveCanvasContainer.setMaximumSize(originalMaxSize);
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.setMaximumSize(originalMaxSize);
                    return false;
                }
            }
        }
    ];
}

/**
 * Canvas update tests
 */
function getCanvasUpdateTests() {
    return [
        {
            name: 'updateCanvasSize with valid size',
            test: () => {
                const mockRenderer = {
                    setSize: (width, height) => {
                        return width > 0 && height > 0;
                    },
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
                
                try {
                    responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                    
                    responsiveCanvasContainer.renderer = originalRenderer;
                    responsiveCanvasContainer.camera = originalCamera;
                    
                    return true;
                } catch (error) {
                    responsiveCanvasContainer.renderer = originalRenderer;
                    responsiveCanvasContainer.camera = originalCamera;
                    return false;
                }
            }
        },
        {
            name: 'updateCanvasSize handles perspective camera',
            test: () => {
                const mockRenderer = {
                    setSize: () => {},
                    setPixelRatio: () => {},
                    getPixelRatio: () => 1
                };
                
                let aspectUpdated = false;
                let projectionUpdated = false;
                
                const mockCamera = {
                    isPerspectiveCamera: true,
                    aspect: 1,
                    updateProjectionMatrix: () => { projectionUpdated = true; }
                };
                
                const originalRenderer = responsiveCanvasContainer.renderer;
                const originalCamera = responsiveCanvasContainer.camera;
                
                responsiveCanvasContainer.renderer = mockRenderer;
                responsiveCanvasContainer.camera = mockCamera;
                
                responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                
                aspectUpdated = mockCamera.aspect === (800 / 600);
                
                responsiveCanvasContainer.renderer = originalRenderer;
                responsiveCanvasContainer.camera = originalCamera;
                
                return aspectUpdated && projectionUpdated;
            }
        },
        {
            name: 'updateCanvasSize handles orthographic camera',
            test: () => {
                const mockRenderer = {
                    setSize: () => {},
                    setPixelRatio: () => {},
                    getPixelRatio: () => 1
                };
                
                let projectionUpdated = false;
                
                const mockCamera = {
                    isOrthographicCamera: true,
                    left: -1,
                    right: 1,
                    updateProjectionMatrix: () => { projectionUpdated = true; }
                };
                
                const originalRenderer = responsiveCanvasContainer.renderer;
                const originalCamera = responsiveCanvasContainer.camera;
                
                responsiveCanvasContainer.renderer = mockRenderer;
                responsiveCanvasContainer.camera = mockCamera;
                
                responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                
                const aspect = 800 / 600;
                const aspectUpdated = mockCamera.left === -aspect && mockCamera.right === aspect;
                
                responsiveCanvasContainer.renderer = originalRenderer;
                responsiveCanvasContainer.camera = originalCamera;
                
                return aspectUpdated && projectionUpdated;
            }
        },
        {
            name: 'forceResize executes without errors',
            test: () => {
                try {
                    responsiveCanvasContainer.forceResize();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'calculateAndApplyOptimalSize executes without errors',
            test: () => {
                try {
                    responsiveCanvasContainer.calculateAndApplyOptimalSize();
                    return true;
                } catch (error) {
                    return false;
                }
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
            name: 'dispatchResizeEvent creates custom event',
            test: () => {
                const mockContainer = document.createElement('div');
                let eventReceived = false;
                
                const testListener = (event) => {
                    eventReceived = event.detail && 
                                   event.detail.width === 800 && 
                                   event.detail.height === 600;
                };
                
                mockContainer.addEventListener('canvasResize', testListener);
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                responsiveCanvasContainer.dispatchResizeEvent({ width: 800, height: 600 });
                
                mockContainer.removeEventListener('canvasResize', testListener);
                responsiveCanvasContainer.container = originalContainer;
                
                return eventReceived;
            }
        },
        {
            name: 'Event dispatching handles missing container gracefully',
            test: () => {
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = null;
                
                try {
                    responsiveCanvasContainer.dispatchResizeEvent({ width: 800, height: 600 });
                    responsiveCanvasContainer.container = originalContainer;
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.container = originalContainer;
                    return false;
                }
            }
        }
    ];
}

/**
 * Metrics tests
 */
function getMetricsTests() {
    return [
        {
            name: 'getMetrics returns complete metrics object',
            test: () => {
                const metrics = responsiveCanvasContainer.getMetrics();
                return metrics &&
                       metrics.containerSize &&
                       metrics.canvasSize &&
                       typeof metrics.pixelRatio === 'number' &&
                       typeof metrics.totalPixels === 'number' &&
                       typeof metrics.aspectRatio === 'number' &&
                       typeof metrics.isProperlyResized === 'boolean';
            }
        },
        {
            name: 'getCurrentSize returns valid size',
            test: () => {
                const size = responsiveCanvasContainer.getCurrentSize();
                return size &&
                       typeof size.width === 'number' &&
                       typeof size.height === 'number' &&
                       size.width >= 0 &&
                       size.height >= 0;
            }
        },
        {
            name: 'getContainerSize returns valid size',
            test: () => {
                const size = responsiveCanvasContainer.getContainerSize();
                return size &&
                       typeof size.width === 'number' &&
                       typeof size.height === 'number' &&
                       size.width >= 0 &&
                       size.height >= 0;
            }
        },
        {
            name: 'getContainerSize with mock container',
            test: () => {
                const mockContainer = {
                    getBoundingClientRect: () => ({ width: 1200, height: 900 })
                };
                
                const originalContainer = responsiveCanvasContainer.container;
                responsiveCanvasContainer.container = mockContainer;
                
                const size = responsiveCanvasContainer.getContainerSize();
                
                responsiveCanvasContainer.container = originalContainer;
                
                return size.width === 1200 && size.height === 900;
            }
        },
        {
            name: 'isProperlyResized returns boolean',
            test: () => {
                const result = responsiveCanvasContainer.isProperlyResized();
                return typeof result === 'boolean';
            }
        },
        {
            name: 'Metrics calculation handles missing canvas gracefully',
            test: () => {
                const originalCanvas = responsiveCanvasContainer.canvas;
                responsiveCanvasContainer.canvas = null;
                
                try {
                    const metrics = responsiveCanvasContainer.getMetrics();
                    responsiveCanvasContainer.canvas = originalCanvas;
                    return metrics !== null;
                } catch (error) {
                    responsiveCanvasContainer.canvas = originalCanvas;
                    return false;
                }
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
            name: 'calculateOptimalSize handles null container',
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
            name: 'updateCanvasSize handles missing renderer gracefully',
            test: () => {
                const originalRenderer = responsiveCanvasContainer.renderer;
                responsiveCanvasContainer.renderer = null;
                
                try {
                    responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                    responsiveCanvasContainer.renderer = originalRenderer;
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.renderer = originalRenderer;
                    return false;
                }
            }
        },
        {
            name: 'updateCanvasSize handles missing camera gracefully',
            test: () => {
                const originalCamera = responsiveCanvasContainer.camera;
                responsiveCanvasContainer.camera = null;
                
                try {
                    responsiveCanvasContainer.updateCanvasSize({ width: 800, height: 600 });
                    responsiveCanvasContainer.camera = originalCamera;
                    return true; // Should not throw
                } catch (error) {
                    responsiveCanvasContainer.camera = originalCamera;
                    return false;
                }
            }
        },
        {
            name: 'applyFallbackSize works correctly',
            test: () => {
                try {
                    responsiveCanvasContainer.applyFallbackSize();
                    return true;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'dispose cleans up resources',
            test: () => {
                // Create a temporary instance for testing disposal
                const testContainer = Object.create(responsiveCanvasContainer);
                testContainer.resizeTimeout = setTimeout(() => {}, 1000);
                testContainer.isInitialized = true;
                
                try {
                    testContainer.dispose();
                    return testContainer.resizeTimeout === null &&
                           testContainer.isInitialized === false;
                } catch (error) {
                    return false;
                }
            }
        },
        {
            name: 'Multiple initialization attempts are handled gracefully',
            test: () => {
                const mockContainer = document.createElement('div');
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
                
                // First initialization
                const success1 = responsiveCanvasContainer.initialize(mockContainer, mockRenderer, mockCamera);
                
                // Second initialization should be handled gracefully
                const success2 = responsiveCanvasContainer.initialize(mockContainer, mockRenderer, mockCamera);
                
                responsiveCanvasContainer.dispose();
                
                return success1 && !success2; // Second should return false or handle gracefully
            }
        }
    ];
}

/**
 * Performance tests
 */
function getPerformanceTests() {
    return [
        {
            name: 'Size calculation performance',
            test: () => {
                const startTime = performance.now();
                
                for (let i = 0; i < 1000; i++) {
                    responsiveCanvasContainer.calculateOptimalSize();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 1000;
                
                console.log(`    Average calculation time: ${avgTime.toFixed(3)}ms`);
                return avgTime < 1; // Should be under 1ms per calculation
            }
        },
        {
            name: 'Metrics generation performance',
            test: () => {
                const startTime = performance.now();
                
                for (let i = 0; i < 1000; i++) {
                    responsiveCanvasContainer.getMetrics();
                }
                
                const endTime = performance.now();
                const avgTime = (endTime - startTime) / 1000;
                
                console.log(`    Average metrics time: ${avgTime.toFixed(3)}ms`);
                return avgTime < 0.5; // Should be under 0.5ms per call
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
    window.runResponsiveCanvasUnitTests = runResponsiveCanvasUnitTests;
    console.log('🧪 ResponsiveCanvasContainer unit tests available as window.runResponsiveCanvasUnitTests()');
}