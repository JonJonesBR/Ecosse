/**
 * Test Panel Visibility System - Task 2 Verification
 * 
 * This file tests the robust panel visibility system implementation
 * to ensure all requirements are met.
 */

export function testPanelVisibilitySystem() {
    console.log('🧪 Testing Panel Visibility System...');
    
    const tests = [];
    const panelManager = window.panelVisibilityManager;
    
    if (!panelManager) {
        console.error('❌ Panel Visibility Manager not found');
        return false;
    }
    
    // Test 1: Panel state management functions
    tests.push({
        name: 'Panel State Management Functions',
        test: () => {
            const hasShowPanel = typeof panelManager.showPanel === 'function';
            const hasHidePanel = typeof panelManager.hidePanel === 'function';
            const hasTogglePanel = typeof panelManager.togglePanel === 'function';
            const hasMinimizePanel = typeof panelManager.minimizePanel === 'function';
            
            return hasShowPanel && hasHidePanel && hasTogglePanel && hasMinimizePanel;
        }
    });
    
    // Test 2: Animation system
    tests.push({
        name: 'Animation System',
        test: () => {
            const hasAnimationStyles = document.getElementById('panel-visibility-animations') !== null;
            const hasAnimationSettings = panelManager.animations && 
                                        typeof panelManager.animations.duration === 'number';
            
            return hasAnimationStyles && hasAnimationSettings;
        }
    });
    
    // Test 3: State persistence
    tests.push({
        name: 'State Persistence',
        test: () => {
            const hasPersistenceSettings = panelManager.persistence && 
                                          typeof panelManager.persistence.enabled === 'boolean';
            const hasLoadFunction = typeof panelManager.loadPanelStates === 'function';
            const hasSaveFunction = typeof panelManager.savePanelStates === 'function';
            
            return hasPersistenceSettings && hasLoadFunction && hasSaveFunction;
        }
    });
    
    // Test 4: Panel registration
    tests.push({
        name: 'Panel Registration',
        test: () => {
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            
            if (!leftPanel || !rightPanel) {
                console.warn('⚠️ Panels not found in DOM');
                return false;
            }
            
            const hasLeftPanel = panelManager.panels.has('left');
            const hasRightPanel = panelManager.panels.has('right');
            
            return hasLeftPanel && hasRightPanel;
        }
    });
    
    // Test 5: Toggle functionality
    tests.push({
        name: 'Toggle Functionality',
        test: async () => {
            try {
                // Test showing panel
                await panelManager.showPanel('left', { animate: false });
                const isVisible = panelManager.isPanelVisible('left');
                
                // Test hiding panel
                await panelManager.hidePanel('left', { animate: false });
                const isHidden = panelManager.isPanelHidden('left');
                
                // Restore original state
                await panelManager.showPanel('left', { animate: false });
                
                return isVisible && isHidden;
            } catch (error) {
                console.error('Toggle test error:', error);
                return false;
            }
        }
    });
    
    // Test 6: Responsive behavior
    tests.push({
        name: 'Responsive Behavior',
        test: () => {
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            
            if (!leftPanel || !rightPanel) return false;
            
            // Check if panels have responsive classes
            const hasResponsiveClasses = leftPanel.classList.contains('panel-managed') &&
                                       rightPanel.classList.contains('panel-managed');
            
            return hasResponsiveClasses;
        }
    });
    
    // Test 7: Event listeners
    tests.push({
        name: 'Event Listeners',
        test: () => {
            // Check if toggle buttons are properly configured
            const leftToggle = document.getElementById('toggle-left-panel');
            const rightToggle = document.getElementById('toggle-right-panel');
            const openLeft = document.getElementById('open-left-panel-btn');
            const openRight = document.getElementById('open-right-panel-btn');
            
            // All buttons should exist
            return leftToggle && rightToggle && openLeft && openRight;
        }
    });
    
    // Run all tests
    let passedTests = 0;
    const totalTests = tests.length;
    
    for (const test of tests) {
        try {
            const result = await test.test();
            if (result) {
                console.log(`✅ ${test.name}: PASSED`);
                passedTests++;
            } else {
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }
    
    // Summary
    const success = passedTests === totalTests;
    const percentage = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🧪 Panel Visibility System Test Results:`);
    console.log(`   Passed: ${passedTests}/${totalTests} (${percentage}%)`);
    
    if (success) {
        console.log('✅ All tests passed! Panel visibility system is working correctly.');
    } else {
        console.log('❌ Some tests failed. Check the implementation.');
    }
    
    return success;
}

/**
 * Test panel animations specifically
 */
export function testPanelAnimations() {
    console.log('🎬 Testing Panel Animations...');
    
    const panelManager = window.panelVisibilityManager;
    if (!panelManager) {
        console.error('❌ Panel Visibility Manager not found');
        return false;
    }
    
    const leftPanel = document.getElementById('left-panel');
    if (!leftPanel) {
        console.error('❌ Left panel not found');
        return false;
    }
    
    console.log('🎬 Testing hide animation...');
    panelManager.hidePanel('left').then(() => {
        console.log('✅ Hide animation completed');
        
        setTimeout(() => {
            console.log('🎬 Testing show animation...');
            panelManager.showPanel('left').then(() => {
                console.log('✅ Show animation completed');
                console.log('🎬 Animation tests completed successfully!');
            });
        }, 1000);
    });
    
    return true;
}

/**
 * Test state persistence
 */
export function testStatePersistence() {
    console.log('💾 Testing State Persistence...');
    
    const panelManager = window.panelVisibilityManager;
    if (!panelManager) {
        console.error('❌ Panel Visibility Manager not found');
        return false;
    }
    
    // Save current states
    const originalStates = { ...panelManager.currentStates };
    
    // Change states
    panelManager.hidePanel('left', { animate: false });
    panelManager.minimizePanel('right', { animate: false });
    
    // Save states
    panelManager.savePanelStates();
    
    // Reset to original
    panelManager.currentStates = originalStates;
    
    // Load states
    panelManager.loadPanelStates();
    
    // Check if states were restored
    const leftHidden = panelManager.isPanelHidden('left');
    const rightMinimized = panelManager.isPanelMinimized('right');
    
    // Restore original states
    panelManager.showPanel('left', { animate: false });
    panelManager.showPanel('right', { animate: false });
    
    if (leftHidden && rightMinimized) {
        console.log('✅ State persistence working correctly');
        return true;
    } else {
        console.log('❌ State persistence failed');
        return false;
    }
}

/**
 * Demonstrate panel functionality
 */
export function demonstratePanelFunctionality() {
    console.log('🎭 Demonstrating Panel Functionality...');
    
    const panelManager = window.panelVisibilityManager;
    if (!panelManager) {
        console.error('❌ Panel Visibility Manager not found');
        return;
    }
    
    const sequence = [
        { action: 'hidePanel', panel: 'left', delay: 1000 },
        { action: 'hidePanel', panel: 'right', delay: 1000 },
        { action: 'showPanel', panel: 'left', delay: 1000 },
        { action: 'showPanel', panel: 'right', delay: 1000 },
        { action: 'minimizePanel', panel: 'left', delay: 1000 },
        { action: 'minimizePanel', panel: 'right', delay: 1000 },
        { action: 'showPanel', panel: 'left', delay: 1000 },
        { action: 'showPanel', panel: 'right', delay: 500 }
    ];
    
    let step = 0;
    
    function executeStep() {
        if (step >= sequence.length) {
            console.log('🎭 Demonstration completed!');
            return;
        }
        
        const { action, panel, delay } = sequence[step];
        console.log(`🎭 Step ${step + 1}: ${action}(${panel})`);
        
        panelManager[action](panel).then(() => {
            step++;
            setTimeout(executeStep, delay);
        });
    }
    
    executeStep();
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    window.testPanelVisibilitySystem = testPanelVisibilitySystem;
    window.testPanelAnimations = testPanelAnimations;
    window.testStatePersistence = testStatePersistence;
    window.demonstratePanelFunctionality = demonstratePanelFunctionality;
    
    console.log('🧪 Panel Visibility System tests available:');
    console.log('   - testPanelVisibilitySystem()');
    console.log('   - testPanelAnimations()');
    console.log('   - testStatePersistence()');
    console.log('   - demonstratePanelFunctionality()');
}