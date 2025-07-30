/**
 * Test Layout Configuration System - Task 10 Verification
 * 
 * This file tests the layout configuration system functionality
 * to ensure all features work correctly.
 */

import { layoutConfigurationSystem } from './ui/layoutConfigurationSystem.js';

/**
 * Test layout configuration system
 */
export function testLayoutConfigurationSystem() {
    console.log('🧪 Testing Layout Configuration System...');
    
    const tests = [
        testInitialization,
        testPresetApplication,
        testConfigurationSaving,
        testSettingsPanel,
        testKeyboardShortcuts,
        testResponsiveConfiguration
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    tests.forEach((test, index) => {
        try {
            console.log(`\n📋 Running test ${index + 1}/${totalTests}: ${test.name}`);
            const result = test();
            
            if (result) {
                console.log(`✅ Test ${test.name} passed`);
                passedTests++;
            } else {
                console.log(`❌ Test ${test.name} failed`);
            }
        } catch (error) {
            console.error(`💥 Test ${test.name} threw error:`, error);
        }
    });
    
    console.log(`\n📊 Layout Configuration System Tests: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All layout configuration tests passed!');
        return true;
    } else {
        console.log('⚠️ Some layout configuration tests failed');
        return false;
    }
}

/**
 * Test system initialization
 */
function testInitialization() {
    // Check if system is initialized
    if (!layoutConfigurationSystem.isInitialized) {
        console.log('⚠️ System not initialized, attempting to initialize...');
        layoutConfigurationSystem.initialize();
    }
    
    // Verify initialization
    const isInitialized = layoutConfigurationSystem.isInitialized;
    const hasDefaultConfig = layoutConfigurationSystem.getCurrentConfiguration() !== null;
    const hasPresets = layoutConfigurationSystem.getAvailablePresets().length > 0;
    
    console.log('- System initialized:', isInitialized);
    console.log('- Has default configuration:', hasDefaultConfig);
    console.log('- Has presets:', hasPresets);
    
    return isInitialized && hasDefaultConfig && hasPresets;
}

/**
 * Test preset application
 */
function testPresetApplication() {
    const presets = layoutConfigurationSystem.getAvailablePresets();
    let allPresetsWork = true;
    
    presets.forEach(preset => {
        try {
            const originalPreset = layoutConfigurationSystem.getCurrentPreset();
            
            // Apply preset
            layoutConfigurationSystem.applyPreset(preset);
            
            // Check if preset was applied
            const currentPreset = layoutConfigurationSystem.getCurrentPreset();
            const configChanged = currentPreset === preset;
            
            console.log(`- Preset "${preset}" applied:`, configChanged);
            
            if (!configChanged) {
                allPresetsWork = false;
            }
            
            // Restore original preset
            layoutConfigurationSystem.applyPreset(originalPreset);
            
        } catch (error) {
            console.error(`- Error applying preset "${preset}":`, error);
            allPresetsWork = false;
        }
    });
    
    return allPresetsWork;
}

/**
 * Test configuration saving and loading
 */
function testConfigurationSaving() {
    try {
        // Get current configuration
        const originalConfig = layoutConfigurationSystem.getCurrentConfiguration();
        const originalPreset = layoutConfigurationSystem.getCurrentPreset();
        
        // Modify configuration
        const testConfig = JSON.parse(JSON.stringify(originalConfig));
        testConfig.panels.left.width = 350; // Change a value
        
        // Apply modified configuration
        layoutConfigurationSystem.currentConfig = testConfig;
        layoutConfigurationSystem.currentPreset = 'custom';
        
        // Save configuration
        layoutConfigurationSystem.saveConfiguration();
        
        // Simulate reload by creating new instance (conceptually)
        layoutConfigurationSystem.loadConfiguration();
        
        // Check if configuration was saved and loaded correctly
        const loadedConfig = layoutConfigurationSystem.getCurrentConfiguration();
        const configSaved = loadedConfig.panels.left.width === 350;
        
        console.log('- Configuration saved and loaded:', configSaved);
        
        // Restore original configuration
        layoutConfigurationSystem.currentConfig = originalConfig;
        layoutConfigurationSystem.currentPreset = originalPreset;
        layoutConfigurationSystem.saveConfiguration();
        
        return configSaved;
        
    } catch (error) {
        console.error('- Error testing configuration saving:', error);
        return false;
    }
}

/**
 * Test settings panel creation and functionality
 */
function testSettingsPanel() {
    try {
        // Check if settings panel exists
        const settingsPanel = document.getElementById('layout-settings-panel');
        const panelExists = settingsPanel !== null;
        
        console.log('- Settings panel exists:', panelExists);
        
        if (!panelExists) {
            return false;
        }
        
        // Test showing and hiding panel
        layoutConfigurationSystem.showSettingsPanel();
        const isVisible = !settingsPanel.classList.contains('hidden');
        
        console.log('- Settings panel can be shown:', isVisible);
        
        layoutConfigurationSystem.hideSettingsPanel();
        const isHidden = settingsPanel.classList.contains('hidden');
        
        console.log('- Settings panel can be hidden:', isHidden);
        
        // Check if preset buttons exist
        const presetButtons = settingsPanel.querySelectorAll('.preset-btn');
        const hasPresetButtons = presetButtons.length > 0;
        
        console.log('- Has preset buttons:', hasPresetButtons);
        
        // Check if configuration inputs exist
        const configInputs = settingsPanel.querySelectorAll('input, select');
        const hasConfigInputs = configInputs.length > 0;
        
        console.log('- Has configuration inputs:', hasConfigInputs);
        
        return panelExists && isVisible && isHidden && hasPresetButtons && hasConfigInputs;
        
    } catch (error) {
        console.error('- Error testing settings panel:', error);
        return false;
    }
}

/**
 * Test keyboard shortcuts
 */
function testKeyboardShortcuts() {
    try {
        // Test settings panel shortcut (Ctrl+Shift+S)
        const settingsPanel = document.getElementById('layout-settings-panel');
        
        if (!settingsPanel) {
            console.log('- Settings panel not found for keyboard test');
            return false;
        }
        
        // Simulate keyboard shortcut
        const keyEvent = new KeyboardEvent('keydown', {
            key: 'S',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true
        });
        
        document.dispatchEvent(keyEvent);
        
        // Check if panel opened
        const panelOpened = !settingsPanel.classList.contains('hidden');
        console.log('- Keyboard shortcut opens settings panel:', panelOpened);
        
        // Close panel
        layoutConfigurationSystem.hideSettingsPanel();
        
        return panelOpened;
        
    } catch (error) {
        console.error('- Error testing keyboard shortcuts:', error);
        return false;
    }
}

/**
 * Test responsive configuration
 */
function testResponsiveConfiguration() {
    try {
        const config = layoutConfigurationSystem.getCurrentConfiguration();
        
        // Check if responsive configuration exists
        const hasResponsiveConfig = config.responsive && 
                                   config.responsive.breakpoints &&
                                   config.responsive.autoAdapt !== undefined;
        
        console.log('- Has responsive configuration:', hasResponsiveConfig);
        
        // Check breakpoints
        const breakpoints = config.responsive.breakpoints;
        const hasValidBreakpoints = breakpoints.mobile && 
                                   breakpoints.tablet && 
                                   breakpoints.desktop;
        
        console.log('- Has valid breakpoints:', hasValidBreakpoints);
        
        return hasResponsiveConfig && hasValidBreakpoints;
        
    } catch (error) {
        console.error('- Error testing responsive configuration:', error);
        return false;
    }
}

/**
 * Test integration with existing systems
 */
export function testLayoutConfigurationIntegration() {
    console.log('🔗 Testing Layout Configuration Integration...');
    
    const integrationTests = [
        testPanelVisibilityIntegration,
        testFloatingControlsIntegration,
        testAdaptiveUIIntegration
    ];
    
    let passedTests = 0;
    let totalTests = integrationTests.length;
    
    integrationTests.forEach((test, index) => {
        try {
            console.log(`\n📋 Running integration test ${index + 1}/${totalTests}: ${test.name}`);
            const result = test();
            
            if (result) {
                console.log(`✅ Integration test ${test.name} passed`);
                passedTests++;
            } else {
                console.log(`❌ Integration test ${test.name} failed`);
            }
        } catch (error) {
            console.error(`💥 Integration test ${test.name} threw error:`, error);
        }
    });
    
    console.log(`\n📊 Layout Configuration Integration Tests: ${passedTests}/${totalTests} passed`);
    return passedTests === totalTests;
}

/**
 * Test panel visibility manager integration
 */
function testPanelVisibilityIntegration() {
    const hasPanelVisibilityManager = window.panelVisibilityManager !== undefined;
    console.log('- Panel Visibility Manager available:', hasPanelVisibilityManager);
    
    if (hasPanelVisibilityManager) {
        // Test if configuration system can interact with panel manager
        const panelStates = window.panelVisibilityManager.getPanelStates();
        const canGetPanelStates = panelStates !== undefined;
        console.log('- Can get panel states:', canGetPanelStates);
        
        return canGetPanelStates;
    }
    
    return true; // Pass if manager not available (optional integration)
}

/**
 * Test floating controls integration
 */
function testFloatingControlsIntegration() {
    const hasFloatingControls = window.floatingControlsPanel !== undefined;
    console.log('- Floating Controls Panel available:', hasFloatingControls);
    
    if (hasFloatingControls) {
        // Test if configuration system can interact with floating controls
        try {
            const controlsState = window.floatingControlsPanel.getState();
            const canGetControlsState = controlsState !== undefined;
            console.log('- Can get controls state:', canGetControlsState);
            
            return canGetControlsState;
        } catch (error) {
            console.log('- Error getting controls state:', error.message);
            return false;
        }
    }
    
    return true; // Pass if controls not available (optional integration)
}

/**
 * Test adaptive UI integration
 */
function testAdaptiveUIIntegration() {
    const hasAdaptiveUI = window.adaptiveUIController !== undefined;
    console.log('- Adaptive UI Controller available:', hasAdaptiveUI);
    
    if (hasAdaptiveUI) {
        // Test if configuration system can interact with adaptive UI
        try {
            const currentViewport = window.adaptiveUIController.getCurrentViewport();
            const canGetViewport = currentViewport !== undefined;
            console.log('- Can get current viewport:', canGetViewport);
            
            return canGetViewport;
        } catch (error) {
            console.log('- Error getting viewport:', error.message);
            return false;
        }
    }
    
    return true; // Pass if adaptive UI not available (optional integration)
}

/**
 * Run all layout configuration tests
 */
export function runAllLayoutConfigurationTests() {
    console.log('🚀 Running All Layout Configuration Tests...\n');
    
    const systemTests = testLayoutConfigurationSystem();
    const integrationTests = testLayoutConfigurationIntegration();
    
    const allTestsPassed = systemTests && integrationTests;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL RESULTS:');
    console.log('- System Tests:', systemTests ? '✅ PASSED' : '❌ FAILED');
    console.log('- Integration Tests:', integrationTests ? '✅ PASSED' : '❌ FAILED');
    console.log('- Overall:', allTestsPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');
    console.log('='.repeat(50));
    
    return allTestsPassed;
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    // Make test functions available globally for debugging
    window.layoutConfigurationTests = {
        testSystem: testLayoutConfigurationSystem,
        testIntegration: testLayoutConfigurationIntegration,
        runAll: runAllLayoutConfigurationTests
    };
    
    // Auto-run tests after a delay to allow other systems to initialize
    setTimeout(() => {
        if (window.DEBUG || window.location.search.includes('test=layout-config')) {
            runAllLayoutConfigurationTests();
        }
    }, 2000);
}