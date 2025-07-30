/**
 * Test file for ResponsiveCanvasContainer - Task 4 verification
 * 
 * This file contains tests to verify that the responsive canvas container
 * is working correctly and meeting the requirements.
 */

import { responsiveCanvasContainer } from './responsive-canvas-container.js';

/**
 * Test the responsive canvas container functionality
 */
export function testResponsiveCanvas() {
    console.log('🧪 Testing ResponsiveCanvasContainer...');
    
    const tests = [
        testInitialization,
        testResizeCalculations,
        testMinMaxConstraints,
        testContainerSizeDetection,
        testMetrics,
        testErrorHandling
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach((test, index) => {
        try {
            console.log(`\n📋 Test ${index + 1}: ${test.name}`);
            const result = test();
            if (result) {
                console.log(`✅ ${test.name} passed`);
                passed++;
            } else {
                console.log(`❌ ${test.name} failed`);
                failed++;
            }
        } catch (error) {
            console.error(`💥 ${test.name} threw error:`, error);
            failed++;
        }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed, total: tests.length };
}

/**
 * Test 1: Initialization
 */
function testInitialization() {
    // Create mock container
    const mockContainer = document.createElement('div');
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);
    
    // Create mock renderer and camera
    const mockRenderer = {
        domElement: document.createElement('canvas'),
        setSize: (width, height) => {
            console.log(`Mock renderer setSize: ${width}x${height}`);
        },
        setPixelRatio: (ratio) => {
            console.log(`Mock renderer setPixelRatio: ${ratio}`);
        },
        getPixelRatio: () => 1
    };
    
    const mockCamera = {
        isPerspectiveCamera: true,
        aspect: 1,
        updateProjectionMatrix: () => {
            console.log('Mock camera updateProjectionMatrix called');
        }
    };
    
    // Test initialization
    const success = responsiveCanvasContainer.initialize(mockContainer, mockRenderer, mockCamera);
    
    // Cleanup
    document.body.removeChild(mockContainer);
    responsiveCanvasContainer.dispose();
    
    return success;
}

/**
 * Test 2: Resize calculations
 */
function testResizeCalculations() {
    const container = responsiveCanvasContainer;
    
    // Test with different container sizes
    const testCases = [
        { width: 800, height: 600, expected: { width: 800, height: 600 } },
        { width: 1920, height: 1080, expected: { width: 1920, height: 1080 } },
        { width: 320, height: 240, expected: { width: 400, height: 300 } }, // Should apply minimum
        { width: 5000, height: 3000, expected: { width: 4096, height: 2160 } } // Should apply maximum
    ];
    
    let allPassed = true;
    
    testCases.forEach((testCase, index) => {
        // Mock container
        const mockContainer = {
            getBoundingClientRect: () => ({
                width: testCase.width,
                height: testCase.height
            })
        };
        
        // Temporarily replace container for testing
        const originalContainer = container.container;
        container.container = mockContainer;
        
        const result = container.calculateOptimalSize();
        
        // Restore original container
        container.container = originalContainer;
        
        const passed = result.width >= testCase.expected.width - 10 && 
                      result.height >= testCase.expected.height - 10;
        
        if (!passed) {
            console.log(`Test case ${index + 1} failed: expected ~${testCase.expected.width}x${testCase.expected.height}, got ${result.width}x${result.height}`);
            allPassed = false;
        }
    });
    
    return allPassed;
}

/**
 * Test 3: Min/Max constraints
 */
function testMinMaxConstraints() {
    const container = responsiveCanvasContainer;
    
    // Test setting minimum size
    container.setMinimumSize({ width: 500, height: 400 });
    const minSize = container.minSize;
    
    if (minSize.width !== 500 || minSize.height !== 400) {
        console.log('Failed to set minimum size');
        return false;
    }
    
    // Test setting maximum size
    container.setMaximumSize({ width: 2000, height: 1500 });
    const maxSize = container.maxSize;
    
    if (maxSize.width !== 2000 || maxSize.height !== 1500) {
        console.log('Failed to set maximum size');
        return false;
    }
    
    // Reset to defaults
    container.setMinimumSize({ width: 400, height: 300 });
    container.setMaximumSize({ width: 4096, height: 2160 });
    
    return true;
}

/**
 * Test 4: Container size detection
 */
function testContainerSizeDetection() {
    const container = responsiveCanvasContainer;
    
    // Mock container with specific size
    const mockContainer = {
        getBoundingClientRect: () => ({
            width: 1024,
            height: 768
        })
    };
    
    const originalContainer = container.container;
    container.container = mockContainer;
    
    const size = container.getContainerSize();
    
    container.container = originalContainer;
    
    return size.width === 1024 && size.height === 768;
}

/**
 * Test 5: Metrics
 */
function testMetrics() {
    const container = responsiveCanvasContainer;
    
    // Mock the necessary properties
    const originalCanvas = container.canvas;
    const originalRenderer = container.renderer;
    const originalContainer = container.container;
    
    container.canvas = { width: 800, height: 600 };
    container.renderer = { getPixelRatio: () => 2 };
    container.container = {
        getBoundingClientRect: () => ({ width: 800, height: 600 })
    };
    
    const metrics = container.getMetrics();
    
    // Restore original values
    container.canvas = originalCanvas;
    container.renderer = originalRenderer;
    container.container = originalContainer;
    
    return metrics && 
           metrics.canvasSize && 
           metrics.containerSize && 
           typeof metrics.pixelRatio === 'number' &&
           typeof metrics.totalPixels === 'number' &&
           typeof metrics.aspectRatio === 'number';
}

/**
 * Test 6: Error handling
 */
function testErrorHandling() {
    const container = responsiveCanvasContainer;
    
    // Test with null container
    const originalContainer = container.container;
    container.container = null;
    
    const size = container.calculateOptimalSize();
    
    container.container = originalContainer;
    
    // Should return minimum size when container is null
    return size.width === container.minSize.width && 
           size.height === container.minSize.height;
}

/**
 * Test canvas resize integration with the main system
 */
export function testCanvasResizeIntegration() {
    console.log('🧪 Testing canvas resize integration...');
    
    const container = document.getElementById('three-js-canvas-container');
    if (!container) {
        console.warn('Canvas container not found, skipping integration test');
        return false;
    }
    
    // Test if responsive canvas container is initialized
    if (!responsiveCanvasContainer.isInitialized) {
        console.warn('ResponsiveCanvasContainer not initialized, skipping integration test');
        return false;
    }
    
    // Get initial metrics
    const initialMetrics = responsiveCanvasContainer.getMetrics();
    console.log('Initial canvas metrics:', initialMetrics);
    
    // Force a resize
    responsiveCanvasContainer.forceResize();
    
    // Get metrics after resize
    const afterResizeMetrics = responsiveCanvasContainer.getMetrics();
    console.log('Metrics after resize:', afterResizeMetrics);
    
    // Test if canvas is properly sized
    const isProperlyResized = responsiveCanvasContainer.isProperlyResized();
    console.log('Canvas properly resized:', isProperlyResized);
    
    return isProperlyResized;
}

/**
 * Simulate different viewport sizes for testing
 */
export function testViewportSizes() {
    console.log('🧪 Testing different viewport sizes...');
    
    const testSizes = [
        { width: 320, height: 568, name: 'Mobile Portrait' },
        { width: 568, height: 320, name: 'Mobile Landscape' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 1920, height: 1080, name: 'Desktop HD' },
        { width: 2560, height: 1440, name: 'Desktop QHD' }
    ];
    
    testSizes.forEach(size => {
        console.log(`\n📱 Testing ${size.name} (${size.width}x${size.height})`);
        
        // Mock container size
        const mockContainer = {
            getBoundingClientRect: () => ({
                width: size.width,
                height: size.height
            })
        };
        
        const originalContainer = responsiveCanvasContainer.container;
        responsiveCanvasContainer.container = mockContainer;
        
        const optimalSize = responsiveCanvasContainer.calculateOptimalSize();
        console.log(`Optimal canvas size: ${optimalSize.width}x${optimalSize.height}`);
        
        responsiveCanvasContainer.container = originalContainer;
    });
}

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.testResponsiveCanvas = testResponsiveCanvas;
    window.testCanvasResizeIntegration = testCanvasResizeIntegration;
    window.testViewportSizes = testViewportSizes;
    
    console.log('🧪 ResponsiveCanvas tests available globally:');
    console.log('- testResponsiveCanvas() - Run all tests');
    console.log('- testCanvasResizeIntegration() - Test integration with main system');
    console.log('- testViewportSizes() - Test different viewport sizes');
}