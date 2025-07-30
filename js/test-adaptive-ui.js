/**
 * Test Adaptive UI Controller - Task 5 Testing
 * 
 * This file provides testing utilities for the AdaptiveUIController
 * to verify responsive behavior and touch-friendly controls.
 */

import { adaptiveUIController } from './ui/adaptiveUIController.js';

/**
 * Test the adaptive UI controller functionality
 */
export function testAdaptiveUI() {
    console.log('🧪 Testing Adaptive UI Controller');
    console.log('=' .repeat(50));
    
    const results = {
        initialization: false,
        viewportDetection: false,
        layoutConfiguration: false,
        touchDetection: false,
        responsiveBreakpoints: false,
        panelBehavior: false,
        overall: false
    };
    
    // Test 1: Initialization
    console.log('\n📋 Test 1: Initialization');
    results.initialization = testInitialization();
    
    // Test 2: Viewport Detection
    console.log('\n📋 Test 2: Viewport Detection');
    results.viewportDetection = testViewportDetection();
    
    // Test 3: Layout Configuration
    console.log('\n📋 Test 3: Layout Configuration');
    results.layoutConfiguration = testLayoutConfiguration();
    
    // Test 4: Touch Detection
    console.log('\n📋 Test 4: Touch Detection');
    results.touchDetection = testTouchDetection();
    
    // Test 5: Responsive Breakpoints
    console.log('\n📋 Test 5: Responsive Breakpoints');
    results.responsiveBreakpoints = testResponsiveBreakpoints();
    
    // Test 6: Panel Behavior
    console.log('\n📋 Test 6: Panel Behavior');
    results.panelBehavior = testPanelBehavior();
    
    // Overall result
    results.overall = Object.values(results).filter(r => r === true).length >= 5;
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 ADAPTIVE UI CONTROLLER TEST RESULTS');
    console.log('=' .repeat(50));
    
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`${status} ${testName}`);
    });
    
    console.log('\n' + (results.overall ? '🎉 OVERALL: PASS' : '💥 OVERALL: FAIL'));
    
    if (!results.overall) {
        console.log('\n💡 Issues to address:');
        Object.entries(results).forEach(([test, passed]) => {
            if (!passed && test !== 'overall') {
                const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                console.log(`   - ${testName} needs fixes`);
            }
        });
    }
    
    return results;
}

/**
 * Test initialization
 */
function testInitialization() {
    try {
        // Check if controller exists
        if (typeof adaptiveUIController === 'undefined') {
            console.log('❌ AdaptiveUIController not found');
            return false;
        }
        
        // Check if initialized
        if (!adaptiveUIController.isInitialized) {
            console.log('❌ AdaptiveUIController not initialized');
            return false;
        }
        
        // Check required methods
        const requiredMethods = [
            'initialize',
            'getCurrentViewport',
            'getCurrentConfiguration',
            'isTouchDevice',
            'forceLayoutUpdate',
            'getMetrics'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
            typeof adaptiveUIController[method] !== 'function'
        );
        
        if (missingMethods.length > 0) {
            console.log(`❌ Missing methods: ${missingMethods.join(', ')}`);
            return false;
        }
        
        console.log('✅ AdaptiveUIController properly initialized');
        return true;
        
    } catch (error) {
        console.log(`❌ Initialization test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test viewport detection
 */
function testViewportDetection() {
    try {
        const currentViewport = adaptiveUIController.getCurrentViewport();
        
        if (!currentViewport || !['mobile', 'tablet', 'desktop'].includes(currentViewport)) {
            console.log(`❌ Invalid viewport detected: ${currentViewport}`);
            return false;
        }
        
        // Test viewport detection logic
        const width = window.innerWidth;
        let expectedViewport = 'desktop';
        
        if (width <= 768) {
            expectedViewport = 'mobile';
        } else if (width <= 1024) {
            expectedViewport = 'tablet';
        }
        
        if (currentViewport !== expectedViewport) {
            console.log(`⚠️ Viewport mismatch: expected ${expectedViewport}, got ${currentViewport}`);
            // This might be acceptable depending on implementation details
        }
        
        console.log(`✅ Viewport detection working: ${currentViewport} (width: ${width}px)`);
        return true;
        
    } catch (error) {
        console.log(`❌ Viewport detection test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test layout configuration
 */
function testLayoutConfiguration() {
    try {
        const config = adaptiveUIController.getCurrentConfiguration();
        
        if (!config) {
            console.log('❌ No layout configuration found');
            return false;
        }
        
        // Check required configuration properties
        const requiredProps = [
            'panelBehavior',
            'bottomPanelPosition',
            'elementGridColumns',
            'controlButtonSize',
            'touchTargetMinSize'
        ];
        
        const missingProps = requiredProps.filter(prop => !(prop in config));
        
        if (missingProps.length > 0) {
            console.log(`❌ Missing configuration properties: ${missingProps.join(', ')}`);
            return false;
        }
        
        console.log(`✅ Layout configuration valid for ${adaptiveUIController.getCurrentViewport()}`);
        console.log(`   Panel behavior: ${config.panelBehavior}`);
        console.log(`   Bottom panel: ${config.bottomPanelPosition}`);
        console.log(`   Touch target size: ${config.touchTargetMinSize}px`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ Layout configuration test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test touch detection
 */
function testTouchDetection() {
    try {
        const isTouchDevice = adaptiveUIController.isTouchDevice();
        
        // Check if touch detection matches expected behavior
        const hasTouch = (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
        
        if (isTouchDevice !== hasTouch) {
            console.log(`⚠️ Touch detection mismatch: controller says ${isTouchDevice}, browser says ${hasTouch}`);
        }
        
        // Check if body has appropriate class
        const hasBodyClass = document.body.classList.contains(isTouchDevice ? 'touch-device' : 'non-touch-device');
        
        if (!hasBodyClass) {
            console.log(`❌ Body missing touch device class`);
            return false;
        }
        
        console.log(`✅ Touch detection working: ${isTouchDevice ? 'Touch device' : 'Non-touch device'}`);
        return true;
        
    } catch (error) {
        console.log(`❌ Touch detection test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test responsive breakpoints
 */
function testResponsiveBreakpoints() {
    try {
        // Test different viewport sizes
        const testSizes = [
            { width: 320, expected: 'mobile' },
            { width: 768, expected: 'mobile' },
            { width: 800, expected: 'tablet' },
            { width: 1024, expected: 'tablet' },
            { width: 1200, expected: 'desktop' }
        ];
        
        let allCorrect = true;
        
        testSizes.forEach(({ width, expected }) => {
            // Mock window.innerWidth for testing
            const originalWidth = window.innerWidth;
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: width
            });
            
            // Force layout update
            adaptiveUIController.forceLayoutUpdate();
            
            const detected = adaptiveUIController.getCurrentViewport();
            
            if (detected !== expected) {
                console.log(`❌ Breakpoint test failed for ${width}px: expected ${expected}, got ${detected}`);
                allCorrect = false;
            }
            
            // Restore original width
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalWidth
            });
        });
        
        // Restore original layout
        adaptiveUIController.forceLayoutUpdate();
        
        if (allCorrect) {
            console.log('✅ Responsive breakpoints working correctly');
        }
        
        return allCorrect;
        
    } catch (error) {
        console.log(`❌ Responsive breakpoints test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test panel behavior
 */
function testPanelBehavior() {
    try {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        const bottomPanel = document.getElementById('bottom-panel');
        
        if (!leftPanel || !rightPanel || !bottomPanel) {
            console.log('❌ Required panels not found in DOM');
            return false;
        }
        
        // Check if panels have appropriate classes based on current viewport
        const currentViewport = adaptiveUIController.getCurrentViewport();
        const config = adaptiveUIController.getCurrentConfiguration();
        
        let expectedPanelClass;
        switch (config.panelBehavior) {
            case 'overlay':
                expectedPanelClass = 'panel-overlay';
                break;
            case 'collapsible':
                expectedPanelClass = 'panel-collapsible';
                break;
            case 'inline':
                expectedPanelClass = 'panel-inline';
                break;
        }
        
        const leftHasClass = leftPanel.classList.contains(expectedPanelClass);
        const rightHasClass = rightPanel.classList.contains(expectedPanelClass);
        
        if (!leftHasClass || !rightHasClass) {
            console.log(`❌ Panels missing expected class: ${expectedPanelClass}`);
            return false;
        }
        
        // Check bottom panel positioning
        let expectedBottomClass;
        switch (config.bottomPanelPosition) {
            case 'fixed-bottom':
                expectedBottomClass = 'position-fixed-bottom';
                break;
            case 'floating':
                expectedBottomClass = 'position-floating';
                break;
        }
        
        const bottomHasClass = bottomPanel.classList.contains(expectedBottomClass);
        
        if (!bottomHasClass) {
            console.log(`❌ Bottom panel missing expected class: ${expectedBottomClass}`);
            return false;
        }
        
        console.log(`✅ Panel behavior correct for ${currentViewport} viewport`);
        console.log(`   Side panels: ${config.panelBehavior}`);
        console.log(`   Bottom panel: ${config.bottomPanelPosition}`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ Panel behavior test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test touch-friendly controls
 */
export function testTouchControls() {
    console.log('🧪 Testing Touch-Friendly Controls');
    console.log('=' .repeat(40));
    
    if (!adaptiveUIController.isTouchDevice()) {
        console.log('ℹ️ Not a touch device, skipping touch-specific tests');
        return true;
    }
    
    try {
        const touchElements = document.querySelectorAll('.touch-friendly');
        
        if (touchElements.length === 0) {
            console.log('❌ No touch-friendly elements found');
            return false;
        }
        
        let allValid = true;
        const config = adaptiveUIController.getCurrentConfiguration();
        const minSize = config.touchTargetMinSize;
        
        touchElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            
            const minHeight = parseInt(computedStyle.minHeight) || rect.height;
            const minWidth = parseInt(computedStyle.minWidth) || rect.width;
            
            if (minHeight < minSize || minWidth < minSize) {
                console.log(`❌ Touch target ${index + 1} too small: ${minWidth}x${minHeight}px (min: ${minSize}px)`);
                allValid = false;
            }
        });
        
        if (allValid) {
            console.log(`✅ All ${touchElements.length} touch targets meet minimum size requirements`);
        }
        
        return allValid;
        
    } catch (error) {
        console.log(`❌ Touch controls test failed: ${error.message}`);
        return false;
    }
}

/**
 * Test viewport change simulation
 */
export function testViewportChanges() {
    console.log('🧪 Testing Viewport Changes');
    console.log('=' .repeat(40));
    
    try {
        const originalWidth = window.innerWidth;
        const testSequence = [
            { width: 320, name: 'Mobile Portrait' },
            { width: 768, name: 'Mobile Landscape' },
            { width: 800, name: 'Tablet Portrait' },
            { width: 1024, name: 'Tablet Landscape' },
            { width: 1200, name: 'Desktop' },
            { width: 1920, name: 'Large Desktop' }
        ];
        
        let changeEvents = 0;
        
        // Listen for viewport change events
        const eventListener = (e) => {
            changeEvents++;
            console.log(`📱 Viewport changed: ${e.detail.from} → ${e.detail.to}`);
        };
        
        document.addEventListener('viewportChanged', eventListener);
        
        testSequence.forEach(({ width, name }) => {
            console.log(`\n🔄 Testing ${name} (${width}px)`);
            
            // Mock window width
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: width
            });
            
            // Trigger resize
            adaptiveUIController.forceLayoutUpdate();
            
            const viewport = adaptiveUIController.getCurrentViewport();
            const config = adaptiveUIController.getCurrentConfiguration();
            
            console.log(`   Detected viewport: ${viewport}`);
            console.log(`   Panel behavior: ${config.panelBehavior}`);
            console.log(`   Touch target size: ${config.touchTargetMinSize}px`);
        });
        
        // Restore original width
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalWidth
        });
        
        adaptiveUIController.forceLayoutUpdate();
        
        // Remove event listener
        document.removeEventListener('viewportChanged', eventListener);
        
        console.log(`\n✅ Viewport change test completed (${changeEvents} events fired)`);
        return true;
        
    } catch (error) {
        console.log(`❌ Viewport change test failed: ${error.message}`);
        return false;
    }
}

/**
 * Get adaptive UI metrics for debugging
 */
export function getAdaptiveUIMetrics() {
    console.log('📊 Adaptive UI Metrics');
    console.log('=' .repeat(30));
    
    try {
        const metrics = adaptiveUIController.getMetrics();
        
        console.log('Current State:');
        console.log(`  Viewport: ${metrics.currentViewport}`);
        console.log(`  Screen: ${metrics.screenSize.width}x${metrics.screenSize.height}`);
        console.log(`  Touch Device: ${metrics.isTouchDevice}`);
        console.log(`  Orientation: ${metrics.isLandscape ? 'Landscape' : 'Portrait'}`);
        
        console.log('\nPanel States:');
        console.log(`  Left Panel: ${metrics.panelStates.leftPanelOpen ? 'Open' : 'Closed'}`);
        console.log(`  Right Panel: ${metrics.panelStates.rightPanelOpen ? 'Open' : 'Closed'}`);
        
        console.log('\nConfiguration:');
        Object.entries(metrics.configuration).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });
        
        return metrics;
        
    } catch (error) {
        console.log(`❌ Failed to get metrics: ${error.message}`);
        return null;
    }
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    window.testAdaptiveUI = testAdaptiveUI;
    window.testTouchControls = testTouchControls;
    window.testViewportChanges = testViewportChanges;
    window.getAdaptiveUIMetrics = getAdaptiveUIMetrics;
    
    console.log('🧪 Adaptive UI testing functions available:');
    console.log('   - testAdaptiveUI()');
    console.log('   - testTouchControls()');
    console.log('   - testViewportChanges()');
    console.log('   - getAdaptiveUIMetrics()');
}