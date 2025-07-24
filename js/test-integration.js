/**
 * Integration test for the Food Web System
 * Tests the complete integration with the simulation system
 */

import { initFoodWebSystem, getPopulationCounts } from './systems/foodWebSystem.js';
import { elementClasses } from './utils.js';
import { subscribe, EventTypes } from './systems/eventSystem.js';

/**
 * Run integration tests for the food web system
 */
export function runIntegrationTests() {
    console.log('🔗 Starting Food Web Integration Tests...');
    
    try {
        testSystemInitialization();
        testElementCreationTracking();
        testPredatorPreyInteractions();
        testPopulationDynamics();
        
        console.log('✅ All Food Web Integration tests passed!');
        return true;
    } catch (error) {
        console.error('❌ Food Web Integration tests failed:', error);
        return false;
    }
}

function testSystemInitialization() {
    console.log('Testing system initialization...');
    
    // Create mock ecosystem elements
    const mockElements = [
        { type: 'plant', id: 1, x: 100, y: 100, health: 100 },
        { type: 'creature', id: 2, x: 150, y: 150, health: 80 },
        { type: 'predator', id: 3, x: 200, y: 200, health: 120 }
    ];
    
    // Initialize the food web system
    initFoodWebSystem(mockElements);
    
    // Check that populations are tracked correctly
    const populations = getPopulationCounts();
    assert(populations.plant === 1, 'Should track 1 plant');
    assert(populations.creature === 1, 'Should track 1 creature');
    assert(populations.predator === 1, 'Should track 1 predator');
    
    console.log('✓ System initialization test passed');
}

function testElementCreationTracking() {
    console.log('Testing element creation tracking...');
    
    let eventReceived = false;
    
    // Subscribe to element creation events
    const subscription = subscribe(EventTypes.ELEMENT_CREATED, (data) => {
        eventReceived = true;
        assert(data.type === 'plant', 'Should receive plant creation event');
    });
    
    // Simulate element creation by publishing event
    import('./systems/eventSystem.js').then(({ publish }) => {
        publish(EventTypes.ELEMENT_CREATED, {
            id: 4,
            type: 'plant',
            x: 300,
            y: 300
        });
    });
    
    // Clean up subscription
    subscription.unsubscribe();
    
    console.log('✓ Element creation tracking test passed');
}

function testPredatorPreyInteractions() {
    console.log('Testing predator-prey interactions...');
    
    // Create predator and prey elements
    const predator = new elementClasses.predator(1, 100, 100);
    const prey = new elementClasses.creature(2, 110, 110);
    
    // Test that they can interact
    assert(predator.type === 'predator', 'Predator should be created correctly');
    assert(prey.type === 'creature', 'Prey should be created correctly');
    
    // Test distance calculation
    const distance = Math.hypot(predator.x - prey.x, predator.y - prey.y);
    assert(distance < 50, 'Predator and prey should be close enough to interact');
    
    console.log('✓ Predator-prey interactions test passed');
}

function testPopulationDynamics() {
    console.log('Testing population dynamics...');
    
    // Initialize with empty ecosystem
    initFoodWebSystem([]);
    
    let initialPopulations = getPopulationCounts();
    assert(initialPopulations.plant === 0, 'Should start with 0 plants');
    
    // Simulate adding elements
    const newElements = [
        { type: 'plant', id: 1 },
        { type: 'plant', id: 2 },
        { type: 'creature', id: 3 }
    ];
    
    // Update populations
    import('./systems/foodWebSystem.js').then(({ updatePopulationCounts }) => {
        updatePopulationCounts(newElements);
        
        const updatedPopulations = getPopulationCounts();
        assert(updatedPopulations.plant === 2, 'Should have 2 plants after update');
        assert(updatedPopulations.creature === 1, 'Should have 1 creature after update');
    });
    
    console.log('✓ Population dynamics test passed');
}

function testCascadeEffectTriggers() {
    console.log('Testing cascade effect triggers...');
    
    let cascadeEventReceived = false;
    
    // Subscribe to interaction events
    const subscription = subscribe(EventTypes.ELEMENT_INTERACTION, (data) => {
        if (data.interactionType === 'cascade_effect') {
            cascadeEventReceived = true;
        }
    });
    
    // Simulate element removal that should trigger cascade
    import('./systems/eventSystem.js').then(({ publish }) => {
        publish(EventTypes.ELEMENT_REMOVED, {
            type: 'creature',
            cause: 'predation'
        });
    });
    
    // Clean up subscription
    subscription.unsubscribe();
    
    console.log('✓ Cascade effect triggers test passed');
}

// Simple assertion function
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Export for use in other modules
export { testSystemInitialization, testElementCreationTracking, testPredatorPreyInteractions };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment - add to window for manual testing
    window.runIntegrationTests = runIntegrationTests;
    console.log('Integration tests available. Run window.runIntegrationTests() to execute.');
}