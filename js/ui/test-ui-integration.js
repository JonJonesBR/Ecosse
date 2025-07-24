// js/ui/test-ui-integration.js
import { uiController } from './uiController.js';
import { menuSystem } from './menuSystem.js';
import { contextualPanels } from './panels.js';
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Integration test for the enhanced UI system
 * This file can be imported in main.js for testing purposes
 */
export function runUIIntegrationTests() {
    console.log('🧪 Running UI Integration Tests...');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    function test(name, testFn) {
        testsTotal++;
        try {
            testFn();
            console.log(`✅ ${name}`);
            testsPassed++;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
        }
    }
    
    // Test 1: UI Controller Initialization
    test('UI Controller initializes correctly', () => {
        if (!uiController.isInitialized) {
            throw new Error('UI Controller not initialized');
        }
    });
    
    // Test 2: Menu System Integration
    test('Menu System is accessible', () => {
        if (!menuSystem || typeof menuSystem.showMenu !== 'function') {
            throw new Error('Menu System not properly integrated');
        }
    });
    
    // Test 3: Contextual Panels Integration
    test('Contextual Panels are accessible', () => {
        if (!contextualPanels || typeof contextualPanels.switchContext !== 'function') {
            throw new Error('Contextual Panels not properly integrated');
        }
    });
    
    // Test 4: Event System Integration
    test('Event System is working', () => {
        let eventReceived = false;
        const unsubscribe = eventSystem.subscribe('testEvent', () => {
            eventReceived = true;
        });
        
        eventSystem.emit('testEvent');
        
        if (!eventReceived) {
            throw new Error('Event System not working');
        }
        
        unsubscribe();
    });
    
    // Test 5: Mode Switching
    test('Mode switching works', () => {
        const initialMode = uiController.currentMode;
        uiController.switchMode('creation');
        
        if (uiController.currentMode !== 'creation') {
            throw new Error('Mode switching failed');
        }
        
        // Restore initial mode
        uiController.switchMode(initialMode);
    });
    
    // Test 6: Panel State Management
    test('Panel state management works', () => {
        const state = uiController.getState();
        
        if (!state || !state.mode || !state.panels) {
            throw new Error('Panel state management not working');
        }
    });
    
    // Test 7: Responsive Handling
    test('Responsive handling is set up', () => {
        // Simulate resize event
        const originalWidth = window.innerWidth;
        
        // This is a basic test - in a real scenario we'd mock window.innerWidth
        if (typeof uiController.handleResize !== 'function') {
            throw new Error('Responsive handling not set up');
        }
    });
    
    // Test 8: Menu Registration
    test('Menu registration works', () => {
        const testMenuId = 'test-menu';
        menuSystem.registerMenu(testMenuId, {
            title: 'Test Menu',
            type: 'overlay',
            content: () => '<p>Test content</p>'
        });
        
        if (!menuSystem.menus.has(testMenuId)) {
            throw new Error('Menu registration failed');
        }
        
        // Clean up
        menuSystem.menus.delete(testMenuId);
    });
    
    // Test 9: Contextual Panel Context Switching
    test('Contextual panel context switching works', () => {
        const initialContext = contextualPanels.currentContext;
        
        contextualPanels.switchContext('test-context', { test: true });
        
        if (contextualPanels.currentContext !== 'test-context') {
            throw new Error('Context switching failed');
        }
        
        // Restore initial context
        contextualPanels.switchContext(initialContext);
    });
    
    // Test 10: UI State Persistence
    test('UI state can be saved and restored', () => {
        const originalState = uiController.getState();
        
        // Change some state
        uiController.switchMode('analysis');
        
        // Restore state
        uiController.restoreState(originalState);
        
        if (uiController.currentMode !== originalState.mode) {
            throw new Error('State restoration failed');
        }
    });
    
    // Summary
    console.log(`\n🧪 UI Integration Tests Complete: ${testsPassed}/${testsTotal} passed`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All UI integration tests passed!');
        return true;
    } else {
        console.log('⚠️ Some UI integration tests failed');
        return false;
    }
}

/**
 * Manual UI testing functions for development
 */
export const manualTests = {
    testMenuSystem() {
        console.log('🔧 Testing Menu System...');
        menuSystem.showMenu('main');
        
        setTimeout(() => {
            menuSystem.showMenu('settings');
        }, 1000);
        
        setTimeout(() => {
            menuSystem.showMenu('graphics');
        }, 2000);
        
        setTimeout(() => {
            menuSystem.closeAllMenus();
        }, 3000);
    },
    
    testContextualPanels() {
        console.log('🔧 Testing Contextual Panels...');
        
        // Test element selection context
        contextualPanels.switchContext('element-selected', {
            element: {
                id: 1,
                type: 'plant',
                health: 85,
                energy: 70,
                age: 15
            }
        });
        
        setTimeout(() => {
            // Test simulation context
            contextualPanels.switchContext('simulation-running', {
                state: 'running',
                speed: 2,
                autoWeather: true,
                autoEvents: false
            });
        }, 2000);
        
        setTimeout(() => {
            // Test analysis context
            contextualPanels.switchContext('analysis-mode', {
                stability: 78,
                biodiversity: 12,
                efficiency: 65
            });
        }, 4000);
    },
    
    testModeTransitions() {
        console.log('🔧 Testing Mode Transitions...');
        
        const modes = ['default', 'creation', 'analysis', 'element-focus'];
        let currentIndex = 0;
        
        const switchMode = () => {
            uiController.switchMode(modes[currentIndex]);
            currentIndex = (currentIndex + 1) % modes.length;
            
            if (currentIndex !== 0) {
                setTimeout(switchMode, 1500);
            }
        };
        
        switchMode();
    },
    
    testPanelToggles() {
        console.log('🔧 Testing Panel Toggles...');
        
        // Test hiding all panels
        uiController.toggleAllPanels(false);
        
        setTimeout(() => {
            // Test showing all panels
            uiController.toggleAllPanels(true);
        }, 1000);
        
        setTimeout(() => {
            // Test individual panel toggle
            uiController.togglePanel('left-panel');
        }, 2000);
        
        setTimeout(() => {
            uiController.togglePanel('left-panel');
        }, 3000);
    }
};

// Export for console access during development
if (typeof window !== 'undefined') {
    window.uiTests = manualTests;
}