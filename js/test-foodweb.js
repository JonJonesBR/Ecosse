/**
 * Test file for the Food Web System
 * This file contains tests to verify the food web functionality
 */

import { 
    initFoodWebSystem, 
    calculatePredationSuccess, 
    isPredatorPreyRelationship,
    processPredatorPreyInteraction,
    getTrophicLevel,
    calculateEnergyTransfer,
    getPopulationCounts,
    registerElementType,
    TrophicLevels
} from './systems/foodWebSystem.js';

import { elementClasses } from './utils.js';

// Test function to run all food web tests
export function runFoodWebTests() {
    console.log('🧪 Starting Food Web System Tests...');
    
    try {
        testTrophicLevels();
        testPredatorPreyRelationships();
        testPredationSuccess();
        testEnergyTransfer();
        testPopulationTracking();
        testCascadeEffects();
        
        console.log('✅ All Food Web System tests passed!');
        return true;
    } catch (error) {
        console.error('❌ Food Web System tests failed:', error);
        return false;
    }
}

function testTrophicLevels() {
    console.log('Testing trophic levels...');
    
    // Test basic trophic level assignments
    assert(getTrophicLevel('plant') === TrophicLevels.PRODUCER, 'Plants should be producers');
    assert(getTrophicLevel('creature') === TrophicLevels.PRIMARY, 'Creatures should be primary consumers');
    assert(getTrophicLevel('predator') === TrophicLevels.SECONDARY, 'Predators should be secondary consumers');
    assert(getTrophicLevel('tribe') === TrophicLevels.TERTIARY, 'Tribes should be tertiary consumers');
    assert(getTrophicLevel('fungus') === TrophicLevels.DECOMPOSER, 'Fungi should be decomposers');
    
    console.log('✓ Trophic levels test passed');
}

function testPredatorPreyRelationships() {
    console.log('Testing predator-prey relationships...');
    
    // Test valid relationships
    assert(isPredatorPreyRelationship('creature', 'plant'), 'Creatures should eat plants');
    assert(isPredatorPreyRelationship('predator', 'creature'), 'Predators should eat creatures');
    assert(isPredatorPreyRelationship('tribe', 'creature'), 'Tribes should eat creatures');
    assert(isPredatorPreyRelationship('tribe', 'plant'), 'Tribes should eat plants');
    
    // Test invalid relationships
    assert(!isPredatorPreyRelationship('plant', 'creature'), 'Plants should not eat creatures');
    assert(!isPredatorPreyRelationship('creature', 'predator'), 'Creatures should not eat predators');
    assert(!isPredatorPreyRelationship('predator', 'tribe'), 'Predators should not eat tribes');
    
    console.log('✓ Predator-prey relationships test passed');
}

function testPredationSuccess() {
    console.log('Testing predation success calculation...');
    
    // Create mock predator and prey
    const mockPredator = {
        type: 'predator',
        speed: 3,
        size: 25,
        health: 100,
        genome: {
            expressTraits: () => ({ intelligence: 0.7 })
        }
    };
    
    const mockPrey = {
        type: 'creature',
        speed: 2,
        size: 18,
        health: 80,
        genome: {
            expressTraits: () => ({ intelligence: 0.4 })
        }
    };
    
    // Test predation success calculation
    const successChance = calculatePredationSuccess(mockPredator, mockPrey);
    assert(successChance > 0 && successChance < 1, 'Success chance should be between 0 and 1');
    assert(successChance > 0.5, 'Predator should have advantage over prey');
    
    // Test with invalid relationship
    const invalidSuccessChance = calculatePredationSuccess(mockPrey, mockPredator);
    assert(invalidSuccessChance === 0, 'Invalid predator-prey relationship should return 0');
    
    console.log('✓ Predation success calculation test passed');
}

function testEnergyTransfer() {
    console.log('Testing energy transfer...');
    
    // Test energy transfer between trophic levels
    const plantEnergy = 100;
    const transferToHerbivore = calculateEnergyTransfer(plantEnergy, TrophicLevels.PRODUCER, TrophicLevels.PRIMARY);
    assert(transferToHerbivore === 10, 'Energy transfer should be 10% efficient');
    
    const herbivoreEnergy = 50;
    const transferToCarnivore = calculateEnergyTransfer(herbivoreEnergy, TrophicLevels.PRIMARY, TrophicLevels.SECONDARY);
    assert(transferToCarnivore === 5, 'Energy transfer should be 10% efficient');
    
    // Test invalid energy transfer (downward)
    const invalidTransfer = calculateEnergyTransfer(100, TrophicLevels.SECONDARY, TrophicLevels.PRIMARY);
    assert(invalidTransfer === 0, 'Energy should not flow down the food chain');
    
    console.log('✓ Energy transfer test passed');
}

function testPopulationTracking() {
    console.log('Testing population tracking...');
    
    // Initialize food web system
    const mockElements = [
        { type: 'plant', id: 1 },
        { type: 'plant', id: 2 },
        { type: 'creature', id: 3 },
        { type: 'predator', id: 4 }
    ];
    
    initFoodWebSystem(mockElements);
    
    // Check population counts
    const populations = getPopulationCounts();
    assert(populations.plant === 2, 'Should count 2 plants');
    assert(populations.creature === 1, 'Should count 1 creature');
    assert(populations.predator === 1, 'Should count 1 predator');
    
    console.log('✓ Population tracking test passed');
}

function testCascadeEffects() {
    console.log('Testing cascade effects...');
    
    // This test would require more complex setup with event listeners
    // For now, we'll just test that the system doesn't crash
    initFoodWebSystem([]);
    
    console.log('✓ Cascade effects test passed');
}

function testPredatorPreyInteraction() {
    console.log('Testing predator-prey interaction processing...');
    
    // Create mock elements
    const mockPredator = {
        id: 1,
        type: 'predator',
        speed: 3,
        size: 25,
        health: 100,
        energy: 80
    };
    
    const mockPrey = {
        id: 2,
        type: 'creature',
        speed: 2,
        size: 18,
        health: 80,
        energy: 60
    };
    
    // Test interaction processing
    const result = processPredatorPreyInteraction(mockPredator, mockPrey);
    
    assert(typeof result.success === 'boolean', 'Result should have success boolean');
    assert(typeof result.energyGained === 'number', 'Result should have energy gained number');
    assert(result.predator.id === mockPredator.id, 'Result should include predator info');
    assert(result.prey.id === mockPrey.id, 'Result should include prey info');
    
    console.log('✓ Predator-prey interaction test passed');
}

function testElementRegistration() {
    console.log('Testing element type registration...');
    
    // Register a new element type
    registerElementType('newPredator', TrophicLevels.SECONDARY, ['creature', 'plant']);
    
    // Test that it was registered correctly
    assert(getTrophicLevel('newPredator') === TrophicLevels.SECONDARY, 'New element should have correct trophic level');
    assert(isPredatorPreyRelationship('newPredator', 'creature'), 'New predator should eat creatures');
    assert(isPredatorPreyRelationship('newPredator', 'plant'), 'New predator should eat plants');
    
    console.log('✓ Element registration test passed');
}

// Simple assertion function
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment - add to window for manual testing
    window.runFoodWebTests = runFoodWebTests;
    console.log('Food web tests available. Run window.runFoodWebTests() to execute.');
} else {
    // Node.js environment - run tests immediately
    runFoodWebTests();
}