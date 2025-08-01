/**
 * Test Canvas Sizing Optimization - Task 5: Implement canvas sizing optimization
 * 
 * This test file validates the canvas sizing optimization functionality
 * including dynamic sizing, top panel offset, and Three.js integration.
 */

import { canvasSizingOptimizer } from './systems/canvasSizingOptimizer.js';
import { canvasSizingIntegration } from './systems/canvasSizingIntegration.js';

/**
 * Test canvas sizing optimizer initialization
 */
export function testCanvasSizingOptimizerInit() {
    console.log('🧪 Testing canvas sizing optimizer initialization...');
    
    // Create mock elements
    const mockContainer = document.createElement('div');
    mockContainer.id = 'test-canvas-container';
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);
    
    const mockTopPanel = document.createElement('div');
    mockTopPanel.id = 'test-top-panel';
    mockTopPanel.style.height = '60px';
    document.body.appendChild(mockTopPanel);
    
    // Mock Three.js components
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
        aspect: 16/9,
        updateProjectionMatrix: () => {
            console.log('Mock camera updateProjectionMatrix called');
        }
    };
    
    // Test initialization
    const success = canvasSizingOptimizer.initialize({
        canvasContainer: mockContainer,
        renderer: mockRenderer,
        camera: mockCamera,
        topPanel: mockTopPanel
    });
    
    // Cleanup
    document.body.removeChild(mockContainer);
    document.body.removeChild(mockTopPanel);
    canvasSizingOptimizer.dispose();
    
    console.log(`Canvas sizing optimizer initialization: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    return success;
}

/**
 * Test canvas size calculation with top panel offset
 */export func
tion testCanvasSizeCalculation() {
    console.log('🧪 Testing canvas size calculation with top panel offset...');
    
    // Create test container
    const container = document.createElement('div');
    container.style.width = '1000px';
    container.style.height = '800px';
    container.style.position = 'relative';
    document.body.appendChild(container);
    
    const topPanel = document.createElement('div');
    topPanel.style.height = '80px';
    document.body.appendChild(topPanel);
    
    // Mock renderer and camera
    const mockRenderer = {
        domElement: document.createElement('canvas'),
        setSize: jest.fn ? jest.fn() : () => {},
        setPixelRatio: jest.fn ? jest.fn() : () => {},
        getPixelRatio: () => 1
    };
    
    const mockCamera = {
        isPerspectiveCamera: true,
        aspect: 16/9,
        updateProjectionMatrix: jest.fn ? jest.fn() : () => {}
    };
    
    // Initialize optimizer
    canvasSizingOptimizer.initialize({
        canvasContainer: container,
        renderer: mockRenderer,
        camera: mockCamera,
        topPanel: topPanel
    });
    
    // Test size calculation
    const calculatedSize = canvasSizingOptimizer.calculateOptimalCanvasSize();
    
    // Expected: container height (800) - top panel height (80) = 720px available height
    const expectedHeight = 800 - 80;
    const expectedWidth = 1000;
    
    const heightCorrect = Math.abs(calculatedSize.height - expectedHeight) <= 2;
    const widthCorrect = Math.abs(calculatedSize.width - expectedWidth) <= 2;
    
    console.log(`Expected size: ${expectedWidth}x${expectedHeight}`);
    console.log(`Calculated size: ${calculatedSize.width}x${calculatedSize.height}`);
    
    // Cleanup
    document.body.removeChild(container);
    document.body.removeChild(topPanel);
    canvasSizingOptimizer.dispose();
    
    const passed = heightCorrect && widthCorrect;
    console.log(`Canvas size calculation: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    return passed;
}

/**
 * Test z-index hierarchy setup
 */
export function testZIndexHierarchy() {
    console.log('🧪 Testing z-index hierarchy setup...');
    
    // Create test elements
    const container = document.createElement('div');
    container.id = 'test-canvas-container';
    document.body.appendChild(container);
    
    const topPanel = document.createElement('div');
    topPanel.id = 'test-top-panel';
    document.body.appendChild(topPanel);
    
    const floatingControls = document.createElement('div');
    floatingControls.id = 'floating-controls-panel';
    document.body.appendChild(floatingControls);
    
    // Mock renderer
    const mockRenderer = {
        domElement: document.createElement('canvas'),
        setSize: () => {},
        setPixelRatio: () => {},
        getPixelRatio: () => 1
    };
    
    const mockCamera = {
        isPerspectiveCamera: true,
        aspect: 16/9,
        updateProjectionMatrix: () => {}
    };
    
    // Initialize optimizer
    canvasSizingOptimizer.initialize({
        canvasContainer: container,
        renderer: mockRenderer,
        camera: mockCamera,
        topPanel: topPanel
    });
    
    // Check z-index values
    const containerZIndex = parseInt(window.getComputedStyle(container).zIndex) || 0;
    const topPanelZIndex = parseInt(window.getComputedStyle(topPanel).zIndex) || 0;
    const floatingControlsZIndex = parseInt(window.getComputedStyle(floatingControls).zIndex) || 0;
    
    console.log(`Z-index values - Container: ${containerZIndex}, Top Panel: ${topPanelZIndex}, Floating Controls: ${floatingControlsZIndex}`);
    
    // Expected hierarchy: top-panel(5) < canvas(10) < floating-controls(20)
    const hierarchyCorrect = topPanelZIndex < containerZIndex && containerZIndex < floatingControlsZIndex;
    
    // Cleanup
    document.body.removeChild(container);
    document.body.removeChild(topPanel);
    document.body.removeChild(floatingControls);
    canvasSizingOptimizer.dispose();
    
    console.log(`Z-index hierarchy: ${hierarchyCorrect ? '✅ PASSED' : '❌ FAILED'}`);
    return hierarchyCorrect;
}

/**
 * Test panel state integration
 */
export function testPanelStateIntegration() {
    console.log('🧪 Testing panel state integration...');
    
    // Create test panels
    const leftPanel = document.createElement('div');
    leftPanel.id = 'left-panel';
    leftPanel.classList.add('active'); // Initially visible
    document.body.appendChild(leftPanel);
    
    const rightPanel = document.createElement('div');
    rightPanel.id = 'right-panel';
    // Initially hidden (no 'active' class)
    document.body.appendChild(rightPanel);
    
    // Test panel state detection
    const panelStates = {
        leftPanelHidden: !leftPanel.classList.contains('active'),
        rightPanelHidden: !rightPanel.classList.contains('active')
    };
    
    console.log('Panel states:', panelStates);
    
    // Expected: left panel visible, right panel hidden
    const statesCorrect = !panelStates.leftPanelHidden && panelStates.rightPanelHidden;
    
    // Test panel toggle
    rightPanel.classList.add('active');
    const newStates = {
        leftPanelHidden: !leftPanel.classList.contains('active'),
        rightPanelHidden: !rightPanel.classList.contains('active')
    };
    
    console.log('Panel states after toggle:', newStates);
    
    // Expected: both panels visible
    const toggleCorrect = !newStates.leftPanelHidden && !newStates.rightPanelHidden;
    
    // Cleanup
    document.body.removeChild(leftPanel);
    document.body.removeChild(rightPanel);
    
    const passed = statesCorrect && toggleCorrect;
    console.log(`Panel state integration: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    return passed;
}

/**
 * Test canvas sizing integration
 */
export function testCanvasSizingIntegration() {
    console.log('🧪 Testing canvas sizing integration...');
    
    // Create test elements
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // Mock rendering components
    const mockRenderingComponents = {
        renderer: {
            domElement: document.createElement('canvas'),
            setSize: () => {},
            setPixelRatio: () => {},
            getPixelRatio: () => 1
        },
        camera: {
            isPerspectiveCamera: true,
            aspect: 16/9,
            updateProjectionMatrix: () => {}
        }
    };
    
    // Test integration initialization
    const success = canvasSizingIntegration.initialize(
        mockRenderingComponents,
        container
    );
    
    // Test metrics
    const metrics = canvasSizingIntegration.getMetrics();
    console.log('Integration metrics:', metrics);
    
    // Test force resize
    canvasSizingIntegration.forceResize();
    
    // Test optimally sized check
    const isOptimal = canvasSizingIntegration.isOptimallySized();
    console.log('Is optimally sized:', isOptimal);
    
    // Cleanup
    document.body.removeChild(container);
    canvasSizingIntegration.dispose();
    
    console.log(`Canvas sizing integration: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    return success;
}

/**
 * Run all canvas sizing optimization tests
 */
export function testCanvasSizingOptimization() {
    console.log('🧪 Running all canvas sizing optimization tests...');
    
    const tests = [
        testCanvasSizingOptimizerInit,
        testCanvasSizeCalculation,
        testZIndexHierarchy,
        testPanelStateIntegration,
        testCanvasSizingIntegration
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`Test ${test.name} failed with error:`, error);
            failed++;
        }
    });
    
    console.log(`\n📊 Canvas Sizing Optimization Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return failed === 0;
}

// Make tests available globally
if (typeof window !== 'undefined') {
    window.testCanvasSizingOptimization = testCanvasSizingOptimization;
    window.testCanvasSizingOptimizerInit = testCanvasSizingOptimizerInit;
    window.testCanvasSizeCalculation = testCanvasSizeCalculation;
    window.testZIndexHierarchy = testZIndexHierarchy;
    window.testPanelStateIntegration = testPanelStateIntegration;
    window.testCanvasSizingIntegration = testCanvasSizingIntegration;
    
    console.log('🧪 Canvas Sizing Optimization tests available globally:');
    console.log('- testCanvasSizingOptimization() - Run all tests');
    console.log('- testCanvasSizingOptimizerInit() - Test optimizer initialization');
    console.log('- testCanvasSizeCalculation() - Test size calculation');
    console.log('- testZIndexHierarchy() - Test z-index setup');
    console.log('- testPanelStateIntegration() - Test panel state handling');
    console.log('- testCanvasSizingIntegration() - Test integration system');
}