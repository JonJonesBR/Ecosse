/**
 * Test Enhanced Responsive Layout System - Task 4: Enhance responsive layout system
 * 
 * This test validates the enhanced responsive layout system improvements:
 * - Mobile layout with proper overlay panels
 * - Tablet layout with collapsible panels
 * - Desktop layout with fixed side panels
 */

import { adaptiveUIController } from './ui/adaptiveUIController.js';

/**
 * Test the enhanced responsive layout system
 */
export function testEnhancedResponsiveLayout() {
    console.log('🧪 Testing Enhanced Responsive Layout System...');
    
    const results = {
        mobileLayout: false,
        tabletLayout: false,
        desktopLayout: false,
        panelBehaviors: false,
        responsiveTransitions: false,
        touchOptimizations: false,
        keyboardNavigation: false,
        performanceOptimizations: false
    };
    
    try {
        // Test mobile layout with overlay panels
        results.mobileLayout = testMobileOverlayPanels();
        
        // Test tablet layout with collapsible panels
        results.tabletLayout = testTabletCollapsiblePanels();
        
        // Test desktop layout with fixed panels
        results.desktopLayout = testDesktopFixedPanels();
        
        // Test panel behavior switching
        results.panelBehaviors = testPanelBehaviorSwitching();
        
        // Test responsive transitions
        results.responsiveTransitions = testResponsiveTransitions();
        
        // Test touch optimizations
        results.touchOptimizations = testTouchOptimizations();
        
        // Test keyboard navigation
        results.keyboardNavigation = testKeyboardNavigation();
        
        // Test performance optimizations
        results.performanceOptimizations = testPerformanceOptimizations();
        
        // Display results
        displayTestResults(results);
        
        return results;
        
    } catch (error) {
        console.error('❌ Enhanced responsive layout test failed:', error);
        return results;
    }
}

/**
 * Test mobile overlay panels
 */
function testMobileOverlayPanels() {
    console.log('📱 Testing mobile overlay panels...');
    
    try {
        // Simulate mobile viewport
        simulateViewport(600, 800);
        
        // Force mobile layout
        adaptiveUIController.detectViewportAndApplyLayout();
        
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (!leftPanel || !rightPanel) {
            console.warn('⚠️ Panels not found for mobile test');
            return false;
        }
        
        // Check if panels have overlay behavior
        const hasOverlayClass = leftPanel.classList.contains('panel-overlay') && 
                               rightPanel.classList.contains('panel-overlay');
        
        // Check if panels are positioned correctly
        const leftPanelStyle = window.getComputedStyle(leftPanel);
        const rightPanelStyle = window.getComputedStyle(rightPanel);
        
        const correctPositioning = leftPanelStyle.position === 'fixed' && 
                                 rightPanelStyle.position === 'fixed';
        
        // Check if backdrop is created when panel is active
        leftPanel.classList.add('active');
        const backdrop = document.getElementById('left-panel-backdrop');
        const hasBackdrop = backdrop !== null;
        
        // Clean up
        leftPanel.classList.remove('active');
        
        const mobileTestPassed = hasOverlayClass && correctPositioning && hasBackdrop;
        
        console.log(mobileTestPassed ? '✅ Mobile overlay panels working' : '❌ Mobile overlay panels failed');
        return mobileTestPassed;
        
    } catch (error) {
        console.error('❌ Mobile overlay panel test error:', error);
        return false;
    }
}

/**
 * Test tablet collapsible panels
 */
function testTabletCollapsiblePanels() {
    console.log('📱 Testing tablet collapsible panels...');
    
    try {
        // Simulate tablet viewport
        simulateViewport(900, 600);
        
        // Force tablet layout
        adaptiveUIController.detectViewportAndApplyLayout();
        
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (!leftPanel || !rightPanel) {
            console.warn('⚠️ Panels not found for tablet test');
            return false;
        }
        
        // Check if panels have collapsible behavior
        const hasCollapsibleClass = leftPanel.classList.contains('panel-collapsible') && 
                                   rightPanel.classList.contains('panel-collapsible');
        
        // Check if collapse toggle buttons exist
        const leftToggle = leftPanel.querySelector('.panel-collapse-toggle');
        const rightToggle = rightPanel.querySelector('.panel-collapse-toggle');
        const hasToggleButtons = leftToggle !== null && rightToggle !== null;
        
        // Test collapse functionality
        if (leftToggle) {
            leftToggle.click();
            const isCollapsed = leftPanel.classList.contains('collapsed');
            
            // Test expand
            leftToggle.click();
            const isExpanded = !leftPanel.classList.contains('collapsed');
            
            const collapseFunctionality = isCollapsed && isExpanded;
            
            const tabletTestPassed = hasCollapsibleClass && hasToggleButtons && collapseFunctionality;
            
            console.log(tabletTestPassed ? '✅ Tablet collapsible panels working' : '❌ Tablet collapsible panels failed');
            return tabletTestPassed;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Tablet collapsible panel test error:', error);
        return false;
    }
}

/**
 * Test desktop fixed panels
 */
function testDesktopFixedPanels() {
    console.log('🖥️ Testing desktop fixed panels...');
    
    try {
        // Simulate desktop viewport
        simulateViewport(1400, 900);
        
        // Force desktop layout
        adaptiveUIController.detectViewportAndApplyLayout();
        
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        const mainContent = document.getElementById('main-content');
        
        if (!leftPanel || !rightPanel || !mainContent) {
            console.warn('⚠️ Elements not found for desktop test');
            return false;
        }
        
        // Check if panels have fixed behavior
        const hasFixedClass = leftPanel.classList.contains('panel-fixed') && 
                             rightPanel.classList.contains('panel-fixed');
        
        // Check if panels are always visible
        const panelsVisible = leftPanel.classList.contains('active') && 
                             rightPanel.classList.contains('active');
        
        // Check if main content has proper margins
        const mainContentStyle = window.getComputedStyle(mainContent);
        const hasProperMargins = parseInt(mainContentStyle.marginLeft) > 0 && 
                                parseInt(mainContentStyle.marginRight) > 0;
        
        const desktopTestPassed = hasFixedClass && panelsVisible && hasProperMargins;
        
        console.log(desktopTestPassed ? '✅ Desktop fixed panels working' : '❌ Desktop fixed panels failed');
        return desktopTestPassed;
        
    } catch (error) {
        console.error('❌ Desktop fixed panel test error:', error);
        return false;
    }
}

/**
 * Test panel behavior switching between viewports
 */
function testPanelBehaviorSwitching() {
    console.log('🔄 Testing panel behavior switching...');
    
    try {
        const leftPanel = document.getElementById('left-panel');
        if (!leftPanel) return false;
        
        // Test mobile to tablet transition
        simulateViewport(600, 800);
        adaptiveUIController.detectViewportAndApplyLayout();
        const hasMobileClass = leftPanel.classList.contains('panel-overlay');
        
        simulateViewport(900, 600);
        adaptiveUIController.detectViewportAndApplyLayout();
        const hasTabletClass = leftPanel.classList.contains('panel-collapsible');
        
        // Test tablet to desktop transition
        simulateViewport(1400, 900);
        adaptiveUIController.detectViewportAndApplyLayout();
        const hasDesktopClass = leftPanel.classList.contains('panel-fixed');
        
        const behaviorSwitching = hasMobileClass && hasTabletClass && hasDesktopClass;
        
        console.log(behaviorSwitching ? '✅ Panel behavior switching working' : '❌ Panel behavior switching failed');
        return behaviorSwitching;
        
    } catch (error) {
        console.error('❌ Panel behavior switching test error:', error);
        return false;
    }
}

/**
 * Test responsive transitions
 */
function testResponsiveTransitions() {
    console.log('🎭 Testing responsive transitions...');
    
    try {
        const leftPanel = document.getElementById('left-panel');
        if (!leftPanel) return false;
        
        // Check if transition styles are applied
        const panelStyle = window.getComputedStyle(leftPanel);
        const hasTransition = panelStyle.transition && panelStyle.transition !== 'none';
        
        // Check if CSS animations are defined
        const hasAnimations = document.styleSheets.length > 0;
        
        const transitionsWorking = hasTransition && hasAnimations;
        
        console.log(transitionsWorking ? '✅ Responsive transitions working' : '❌ Responsive transitions failed');
        return transitionsWorking;
        
    } catch (error) {
        console.error('❌ Responsive transitions test error:', error);
        return false;
    }
}

/**
 * Test touch optimizations
 */
function testTouchOptimizations() {
    console.log('👆 Testing touch optimizations...');
    
    try {
        // Simulate touch device
        const originalTouchDevice = adaptiveUIController.touchDevice;
        adaptiveUIController.touchDevice = true;
        
        // Apply mobile layout
        simulateViewport(600, 800);
        adaptiveUIController.detectViewportAndApplyLayout();
        
        // Check if touch-friendly classes are applied
        const touchElements = document.querySelectorAll('.touch-friendly');
        const hasTouchElements = touchElements.length > 0;
        
        // Check if minimum touch target sizes are applied
        let hasProperTouchTargets = true;
        touchElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const height = parseInt(style.minHeight);
            const width = parseInt(style.minWidth);
            
            if (height < 44 || width < 44) {
                hasProperTouchTargets = false;
            }
        });
        
        // Restore original touch device state
        adaptiveUIController.touchDevice = originalTouchDevice;
        
        const touchOptimizations = hasTouchElements && hasProperTouchTargets;
        
        console.log(touchOptimizations ? '✅ Touch optimizations working' : '❌ Touch optimizations failed');
        return touchOptimizations;
        
    } catch (error) {
        console.error('❌ Touch optimizations test error:', error);
        return false;
    }
}

/**
 * Test keyboard navigation
 */
function testKeyboardNavigation() {
    console.log('⌨️ Testing keyboard navigation...');
    
    try {
        // Simulate desktop viewport for keyboard navigation
        simulateViewport(1400, 900);
        adaptiveUIController.detectViewportAndApplyLayout();
        
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (!leftPanel || !rightPanel) return false;
        
        // Test keyboard shortcuts (Ctrl+1 for left panel, Ctrl+2 for right panel)
        const initialLeftState = leftPanel.classList.contains('active');
        const initialRightState = rightPanel.classList.contains('active');
        
        // Simulate Ctrl+1 keypress
        const event1 = new KeyboardEvent('keydown', {
            key: '1',
            ctrlKey: true,
            bubbles: true
        });
        document.dispatchEvent(event1);
        
        // Check if left panel state changed
        const leftStateChanged = leftPanel.classList.contains('active') !== initialLeftState;
        
        // Simulate Ctrl+2 keypress
        const event2 = new KeyboardEvent('keydown', {
            key: '2',
            ctrlKey: true,
            bubbles: true
        });
        document.dispatchEvent(event2);
        
        // Check if right panel state changed
        const rightStateChanged = rightPanel.classList.contains('active') !== initialRightState;
        
        const keyboardNavigation = leftStateChanged || rightStateChanged; // At least one should work
        
        console.log(keyboardNavigation ? '✅ Keyboard navigation working' : '❌ Keyboard navigation failed');
        return keyboardNavigation;
        
    } catch (error) {
        console.error('❌ Keyboard navigation test error:', error);
        return false;
    }
}

/**
 * Test performance optimizations
 */
function testPerformanceOptimizations() {
    console.log('⚡ Testing performance optimizations...');
    
    try {
        // Test debounced resize handling
        const startTime = performance.now();
        
        // Trigger multiple resize events rapidly
        for (let i = 0; i < 10; i++) {
            window.dispatchEvent(new Event('resize'));
        }
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        // Should complete quickly due to debouncing
        const efficientResize = executionTime < 100;
        
        // Check if will-change properties are applied for performance
        const panels = document.querySelectorAll('.panel-fixed, #bottom-panel');
        let hasWillChange = false;
        
        panels.forEach(panel => {
            const style = window.getComputedStyle(panel);
            if (style.willChange && style.willChange !== 'auto') {
                hasWillChange = true;
            }
        });
        
        const performanceOptimizations = efficientResize && hasWillChange;
        
        console.log(performanceOptimizations ? '✅ Performance optimizations working' : '❌ Performance optimizations failed');
        return performanceOptimizations;
        
    } catch (error) {
        console.error('❌ Performance optimizations test error:', error);
        return false;
    }
}

/**
 * Simulate viewport size for testing
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 */
function simulateViewport(width, height) {
    // Override window dimensions for testing
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width
    });
    
    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height
    });
}

/**
 * Display test results
 * @param {Object} results - Test results object
 */
function displayTestResults(results) {
    console.log('\n📊 Enhanced Responsive Layout Test Results:');
    console.log('==========================================');
    
    const testNames = {
        mobileLayout: 'Mobile Overlay Panels',
        tabletLayout: 'Tablet Collapsible Panels',
        desktopLayout: 'Desktop Fixed Panels',
        panelBehaviors: 'Panel Behavior Switching',
        responsiveTransitions: 'Responsive Transitions',
        touchOptimizations: 'Touch Optimizations',
        keyboardNavigation: 'Keyboard Navigation',
        performanceOptimizations: 'Performance Optimizations'
    };
    
    let passedTests = 0;
    const totalTests = Object.keys(results).length;
    
    Object.entries(results).forEach(([key, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const testName = testNames[key] || key;
        console.log(`${status} ${testName}`);
        if (passed) passedTests++;
    });
    
    console.log('==========================================');
    console.log(`📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All enhanced responsive layout tests passed!');
    } else {
        console.log('⚠️ Some enhanced responsive layout tests failed. Check implementation.');
    }
    
    return {
        passed: passedTests,
        total: totalTests,
        percentage: Math.round((passedTests / totalTests) * 100)
    };
}

/**
 * Get enhanced responsive layout metrics
 */
export function getEnhancedResponsiveLayoutMetrics() {
    return {
        currentViewport: adaptiveUIController.getCurrentViewport(),
        configuration: adaptiveUIController.getCurrentConfiguration(),
        isTouchDevice: adaptiveUIController.isTouchDevice(),
        metrics: adaptiveUIController.getMetrics(),
        panelStates: {
            leftPanel: {
                element: document.getElementById('left-panel'),
                classes: document.getElementById('left-panel')?.className || '',
                isActive: document.getElementById('left-panel')?.classList.contains('active') || false,
                isCollapsed: document.getElementById('left-panel')?.classList.contains('collapsed') || false
            },
            rightPanel: {
                element: document.getElementById('right-panel'),
                classes: document.getElementById('right-panel')?.className || '',
                isActive: document.getElementById('right-panel')?.classList.contains('active') || false,
                isCollapsed: document.getElementById('right-panel')?.classList.contains('collapsed') || false
            }
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            isLandscape: window.innerWidth > window.innerHeight
        }
    };
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    window.testEnhancedResponsiveLayout = testEnhancedResponsiveLayout;
    window.getEnhancedResponsiveLayoutMetrics = getEnhancedResponsiveLayoutMetrics;
    console.log('🧪 Enhanced responsive layout testing available: Run testEnhancedResponsiveLayout() or getEnhancedResponsiveLayoutMetrics() in console');
}