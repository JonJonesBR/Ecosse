// js/ui/test-controls-integration.js
import { controlsManager } from './controlsManager.js';
import { gestureSystem } from './gestureSystem.js';
import { selectionModes } from './selectionModes.js';
import { shortcutsPanel } from './shortcutsPanel.js';
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Integration tests for the enhanced controls system
 */
export function runControlsIntegrationTests() {
    console.log('🧪 Running Controls Integration Tests...');
    
    const tests = [
        testControlsManagerInitialization,
        testGestureSystemInitialization,
        testSelectionModesInitialization,
        testShortcutsPanelInitialization,
        testKeyboardShortcuts,
        testSelectionModeSwitch,
        testGestureRecognition,
        testShortcutCustomization
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            test();
            console.log(`✅ ${test.name} - PASSED`);
            passed++;
        } catch (error) {
            console.error(`❌ ${test.name} - FAILED:`, error);
            failed++;
        }
    });
    
    console.log(`\n📊 Controls Integration Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    return { passed, failed, total: tests.length };
}

/**
 * Test controls manager initialization
 */
function testControlsManagerInitialization() {
    // Test initialization
    controlsManager.initialize();
    
    if (!controlsManager.isInitialized) {
        throw new Error('Controls manager failed to initialize');
    }
    
    // Test shortcuts registration
    const shortcuts = controlsManager.getAllShortcuts();
    if (shortcuts.length === 0) {
        throw new Error('No shortcuts were registered');
    }
    
    // Test default shortcuts exist
    const hasSpaceShortcut = shortcuts.some(s => s.key === 'Space');
    if (!hasSpaceShortcut) {
        throw new Error('Default Space shortcut not found');
    }
    
    console.log(`📋 Registered ${shortcuts.length} keyboard shortcuts`);
}

/**
 * Test gesture system initialization
 */
function testGestureSystemInitialization() {
    // Test initialization
    gestureSystem.initialize();
    
    if (!gestureSystem.isInitialized) {
        throw new Error('Gesture system failed to initialize');
    }
    
    // Test gesture registration
    const stats = gestureSystem.getGestureStats();
    if (stats.registeredGestures === 0) {
        throw new Error('No gestures were registered');
    }
    
    console.log(`👆 Registered ${stats.registeredGestures} gesture types`);
}

/**
 * Test selection modes initialization
 */
function testSelectionModesInitialization() {
    // Test initialization
    selectionModes.initialize();
    
    // Test default mode
    const currentMode = selectionModes.getCurrentMode();
    if (currentMode !== 'single') {
        throw new Error(`Expected default mode 'single', got '${currentMode}'`);
    }
    
    // Test mode configuration
    const modeConfig = selectionModes.getModeConfig();
    if (!modeConfig || !modeConfig.name) {
        throw new Error('Mode configuration is invalid');
    }
    
    console.log(`🎯 Selection mode initialized: ${modeConfig.name}`);
}

/**
 * Test shortcuts panel initialization
 */
function testShortcutsPanelInitialization() {
    // Test initialization
    shortcutsPanel.initialize();
    
    // Test panel creation
    const panel = document.getElementById('shortcuts-panel');
    if (!panel) {
        throw new Error('Shortcuts panel was not created');
    }
    
    // Test panel is hidden by default
    if (!panel.classList.contains('hidden')) {
        throw new Error('Shortcuts panel should be hidden by default');
    }
    
    console.log('⌨️ Shortcuts panel created and ready');
}

/**
 * Test keyboard shortcuts functionality
 */
function testKeyboardShortcuts() {
    let eventReceived = false;
    
    // Listen for toggle simulation event
    const unsubscribe = eventSystem.subscribe('toggleSimulation', () => {
        eventReceived = true;
    });
    
    // Simulate Space key press
    const spaceEvent = new KeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        bubbles: true
    });
    
    document.dispatchEvent(spaceEvent);
    
    // Clean up
    unsubscribe();
    
    if (!eventReceived) {
        throw new Error('Space shortcut did not trigger toggleSimulation event');
    }
    
    console.log('⌨️ Keyboard shortcut test passed');
}

/**
 * Test selection mode switching
 */
function testSelectionModeSwitch() {
    // Test mode switching
    selectionModes.setMode('area');
    
    const currentMode = selectionModes.getCurrentMode();
    if (currentMode !== 'area') {
        throw new Error(`Expected mode 'area', got '${currentMode}'`);
    }
    
    // Test mode indicator update
    const modeButtons = document.querySelectorAll('.mode-btn');
    const activeButton = document.querySelector('.mode-btn.active');
    
    if (!activeButton || activeButton.dataset.mode !== 'area') {
        throw new Error('Mode indicator was not updated correctly');
    }
    
    // Reset to single mode
    selectionModes.setMode('single');
    
    console.log('🔄 Selection mode switching test passed');
}

/**
 * Test gesture recognition
 */
function testGestureRecognition() {
    let gestureReceived = false;
    
    // Listen for tap gesture
    const unsubscribe = eventSystem.subscribe('tap', () => {
        gestureReceived = true;
    });
    
    // Simulate tap gesture by triggering the handler directly
    gestureSystem.handleTap({
        type: 'tap',
        duration: 100,
        touchPoints: [{
            x: 100,
            y: 100
        }]
    });
    
    // Clean up
    unsubscribe();
    
    if (!gestureReceived) {
        throw new Error('Tap gesture was not recognized');
    }
    
    console.log('👆 Gesture recognition test passed');
}

/**
 * Test shortcut customization
 */
function testShortcutCustomization() {
    // Test customizing a shortcut
    const originalShortcuts = controlsManager.getAllShortcuts();
    const testAction = 'toggleSimulation';
    
    // Customize shortcut
    controlsManager.customizeShortcut(testAction, 'KeyP');
    
    // Verify customization
    const updatedShortcuts = controlsManager.getAllShortcuts();
    const customizedShortcut = updatedShortcuts.find(s => s.action === testAction);
    
    if (!customizedShortcut || customizedShortcut.key !== 'KeyP') {
        throw new Error('Shortcut customization failed');
    }
    
    // Reset to default
    controlsManager.resetShortcutsToDefaults();
    
    console.log('🔧 Shortcut customization test passed');
}

/**
 * Test element selection functionality
 */
function testElementSelection() {
    // Create mock element
    const mockElement = {
        id: 'test-element',
        type: 'plant',
        health: 80,
        energy: 60,
        age: 100
    };
    
    // Test single selection
    selectionModes.setMode('single');
    selectionModes.handleElementInteraction({
        element: mockElement,
        event: { ctrlKey: false }
    });
    
    const selectedElements = selectionModes.getSelectedElements();
    if (selectedElements.length !== 1 || selectedElements[0] !== mockElement) {
        throw new Error('Single selection failed');
    }
    
    // Test selection clearing
    selectionModes.clearSelection();
    const clearedSelection = selectionModes.getSelectedElements();
    if (clearedSelection.length !== 0) {
        throw new Error('Selection clearing failed');
    }
    
    console.log('🎯 Element selection test passed');
}

/**
 * Test property filters
 */
function testPropertyFilters() {
    // Create mock elements with different properties
    const elements = [
        { id: 1, type: 'plant', health: 90, energy: 80 },
        { id: 2, type: 'plant', health: 50, energy: 40 },
        { id: 3, type: 'creature', health: 70, energy: 60 }
    ];
    
    // Test filter functionality
    selectionModes.propertyFilters.health.enabled = true;
    selectionModes.propertyFilters.health.min = 60;
    selectionModes.propertyFilters.health.max = 100;
    
    const filteredElements = elements.filter(element => 
        selectionModes.passesPropertyFilters(element)
    );
    
    if (filteredElements.length !== 2) {
        throw new Error('Property filtering failed');
    }
    
    // Reset filters
    selectionModes.propertyFilters.health.enabled = false;
    
    console.log('🔍 Property filters test passed');
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
    // Run tests after DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runControlsIntegrationTests, 1000);
        });
    } else {
        setTimeout(runControlsIntegrationTests, 1000);
    }
}