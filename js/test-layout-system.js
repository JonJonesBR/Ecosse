/**
 * Test Suite for Core Layout Management System
 * Verifies that all components are working correctly
 */

export function testLayoutSystem() {
    console.log('🧪 Testing Core Layout Management System...');
    
    const tests = [];
    
    // Test 1: Check if systems are initialized
    tests.push({
        name: 'Systems Initialization',
        test: () => {
            const hasLayoutManager = window.layoutManager && typeof window.layoutManager.getLayoutInfo === 'function';
            const hasResponsiveBreakpoints = window.responsiveBreakpoints && typeof window.responsiveBreakpoints.getCurrentBreakpoint === 'function';
            const hasViewportMonitor = window.viewportMonitor && typeof window.viewportMonitor.getViewportDimensions === 'function';
            const hasCoreLayoutSystem = window.coreLayoutSystem && typeof window.coreLayoutSystem.getCurrentLayout === 'function';
            
            return hasLayoutManager && hasResponsiveBreakpoints && hasViewportMonitor && hasCoreLayoutSystem;
        }
    });
    
    // Test 2: Check viewport detection
    tests.push({
        name: 'Viewport Detection',
        test: () => {
            const viewport = window.viewportMonitor.getViewportDimensions();
            return viewport && viewport.width > 0 && viewport.height > 0;
        }
    });
    
    // Test 3: Check breakpoint detection
    tests.push({
        name: 'Breakpoint Detection',
        test: () => {
            const breakpoint = window.responsiveBreakpoints.getCurrentBreakpoint();
            const validBreakpoints = ['mobile', 'tablet', 'desktop', 'ultrawide'];
            return validBreakpoints.includes(breakpoint);
        }
    });
    
    // Test 4: Check layout manager functionality
    tests.push({
        name: 'Layout Manager Functionality',
        test: () => {
            const layoutInfo = window.layoutManager.getLayoutInfo();
            return layoutInfo && layoutInfo.viewportSize && layoutInfo.panelStates;
        }
    });
    
    // Test 5: Check panel toggle functionality
    tests.push({
        name: 'Panel Toggle Functionality',
        test: () => {
            try {
                const originalState = window.layoutManager.panelStates.left;
                window.layoutManager.togglePanel('left');
                const newState = window.layoutManager.panelStates.left;
                window.layoutManager.togglePanel('left'); // Restore original state
                return originalState !== newState;
            } catch (error) {
                return false;
            }
        }
    });
    
    // Test 6: Check responsive layout application
    tests.push({
        name: 'Responsive Layout Application',
        test: () => {
            const appContainer = document.getElementById('app-container');
            return appContainer && (
                appContainer.classList.contains('mobile-layout') ||
                appContainer.classList.contains('tablet-layout') ||
                appContainer.classList.contains('desktop-layout')
            );
        }
    });
    
    // Test 7: Check canvas container exists and has proper styling
    tests.push({
        name: 'Canvas Container Setup',
        test: () => {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            return canvasContainer && canvasContainer.style.position === 'relative';
        }
    });
    
    // Run all tests
    let passedTests = 0;
    const results = tests.map(test => {
        try {
            const passed = test.test();
            if (passed) passedTests++;
            
            console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
            
            return {
                name: test.name,
                passed,
                error: null
            };
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED (${error.message})`);
            
            return {
                name: test.name,
                passed: false,
                error: error.message
            };
        }
    });
    
    // Summary
    const totalTests = tests.length;
    const passRate = (passedTests / totalTests * 100).toFixed(1);
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed (${passRate}%)`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All layout system tests passed!');
    } else {
        console.log('⚠️ Some layout system tests failed. Check the implementation.');
    }
    
    return {
        totalTests,
        passedTests,
        passRate: parseFloat(passRate),
        results,
        allPassed: passedTests === totalTests
    };
}

// Test individual components
export function testLayoutManager() {
    console.log('🧪 Testing Layout Manager...');
    
    if (!window.layoutManager) {
        console.error('❌ Layout Manager not found');
        return false;
    }
    
    try {
        const layoutInfo = window.layoutManager.getLayoutInfo();
        console.log('📐 Layout Info:', layoutInfo);
        
        const debugInfo = window.layoutManager.getDebugInfo ? window.layoutManager.getDebugInfo() : null;
        if (debugInfo) {
            console.log('🔍 Debug Info:', debugInfo);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Layout Manager test failed:', error);
        return false;
    }
}

export function testResponsiveBreakpoints() {
    console.log('🧪 Testing Responsive Breakpoints...');
    
    if (!window.responsiveBreakpoints) {
        console.error('❌ Responsive Breakpoints not found');
        return false;
    }
    
    try {
        const currentBreakpoint = window.responsiveBreakpoints.getCurrentBreakpoint();
        const debugInfo = window.responsiveBreakpoints.getDebugInfo();
        
        console.log('📱 Current Breakpoint:', currentBreakpoint);
        console.log('🔍 Debug Info:', debugInfo);
        
        return true;
    } catch (error) {
        console.error('❌ Responsive Breakpoints test failed:', error);
        return false;
    }
}

export function testViewportMonitor() {
    console.log('🧪 Testing Viewport Monitor...');
    
    if (!window.viewportMonitor) {
        console.error('❌ Viewport Monitor not found');
        return false;
    }
    
    try {
        const viewport = window.viewportMonitor.getViewportDimensions();
        const debugInfo = window.viewportMonitor.getDebugInfo();
        
        console.log('👁️ Viewport Dimensions:', viewport);
        console.log('🔍 Debug Info:', debugInfo);
        
        return true;
    } catch (error) {
        console.error('❌ Viewport Monitor test failed:', error);
        return false;
    }
}

export function testCoreLayoutSystem() {
    console.log('🧪 Testing Core Layout System...');
    
    if (!window.coreLayoutSystem) {
        console.error('❌ Core Layout System not found');
        return false;
    }
    
    try {
        const currentLayout = window.coreLayoutSystem.getCurrentLayout();
        const debugInfo = window.coreLayoutSystem.getDebugInfo();
        const performanceMetrics = window.coreLayoutSystem.getPerformanceMetrics();
        
        console.log('🎯 Current Layout:', currentLayout);
        console.log('📊 Performance Metrics:', performanceMetrics);
        console.log('🔍 Debug Info:', debugInfo);
        
        return true;
    } catch (error) {
        console.error('❌ Core Layout System test failed:', error);
        return false;
    }
}

// Make test functions available globally
if (typeof window !== 'undefined') {
    window.testLayoutSystem = testLayoutSystem;
    window.testLayoutManager = testLayoutManager;
    window.testResponsiveBreakpoints = testResponsiveBreakpoints;
    window.testViewportMonitor = testViewportMonitor;
    window.testCoreLayoutSystem = testCoreLayoutSystem;
    
    console.log('🧪 Layout system tests available:');
    console.log('  - testLayoutSystem() - Run all tests');
    console.log('  - testLayoutManager() - Test layout manager');
    console.log('  - testResponsiveBreakpoints() - Test breakpoint system');
    console.log('  - testViewportMonitor() - Test viewport monitoring');
    console.log('  - testCoreLayoutSystem() - Test core integration');
}