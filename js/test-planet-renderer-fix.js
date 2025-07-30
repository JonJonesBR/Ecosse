/**
 * Test file for planet renderer fixes
 * This file tests the planet renderer fixes to ensure they work correctly
 */

import { applyPlanetRendererFixes, updatePlanetAppearance, resetCamera } from './planetRenderer-fix.js';

/**
 * Test the planet renderer fixes
 */
export function testPlanetRendererFixes() {
    console.log('Starting planet renderer fix tests...');
    
    // Test configuration
    const testConfig = {
        planetType: 'terrestrial',
        ecosystemSize: 'medium',
        atmosphere: 'oxygen',
        luminosity: 1.0
    };
    
    // Get the container element (assuming it exists in the DOM)
    const container = document.getElementById('planet-container');
    
    if (!container) {
        console.error('Test failed: Container element not found');
        return false;
    }
    
    try {
        // Test 1: Apply planet renderer fixes
        console.log('Test 1: Applying planet renderer fixes...');
        const rendererElement = applyPlanetRendererFixes(container, testConfig);
        
        if (!rendererElement) {
            console.error('Test 1 failed: Could not apply planet renderer fixes');
            return false;
        }
        
        console.log('Test 1 passed: Planet renderer fixes applied successfully');
        
        // Test 2: Update planet appearance
        console.log('Test 2: Testing planet appearance update...');
        const newConfig = {
            ...testConfig,
            planetType: 'desert'
        };
        
        updatePlanetAppearance(newConfig);
        console.log('Test 2 passed: Planet appearance updated successfully');
        
        // Test 3: Reset camera
        console.log('Test 3: Testing camera reset...');
        resetCamera(testConfig);
        console.log('Test 3 passed: Camera reset successfully');
        
        // Test 4: Test different planet types
        console.log('Test 4: Testing different planet types...');
        const planetTypes = ['terrestrial', 'desert', 'aquatic', 'volcanic', 'gas'];
        
        for (const planetType of planetTypes) {
            const config = { ...testConfig, planetType };
            updatePlanetAppearance(config);
            console.log(`Test 4.${planetTypes.indexOf(planetType) + 1} passed: ${planetType} planet rendered`);
        }
        
        console.log('All planet renderer fix tests passed!');
        return true;
        
    } catch (error) {
        console.error('Test failed with error:', error);
        return false;
    }
}

/**
 * Test container initialization specifically
 */
export function testContainerInitialization() {
    console.log('Testing container initialization...');
    
    // Create a test container
    const testContainer = document.createElement('div');
    testContainer.id = 'test-planet-container';
    testContainer.style.width = '800px';
    testContainer.style.height = '600px';
    document.body.appendChild(testContainer);
    
    const testConfig = {
        planetType: 'terrestrial',
        ecosystemSize: 'medium',
        atmosphere: 'oxygen',
        luminosity: 1.0
    };
    
    try {
        const rendererElement = applyPlanetRendererFixes(testContainer, testConfig);
        
        if (rendererElement) {
            console.log('Container initialization test passed');
            
            // Clean up
            document.body.removeChild(testContainer);
            return true;
        } else {
            console.error('Container initialization test failed');
            document.body.removeChild(testContainer);
            return false;
        }
    } catch (error) {
        console.error('Container initialization test failed with error:', error);
        document.body.removeChild(testContainer);
        return false;
    }
}

/**
 * Run all tests
 */
export function runAllTests() {
    console.log('Running all planet renderer fix tests...');
    
    const results = {
        containerInitialization: testContainerInitialization(),
        planetRendererFixes: testPlanetRendererFixes()
    };
    
    const allPassed = Object.values(results).every(result => result === true);
    
    console.log('Test Results:', results);
    console.log(allPassed ? 'All tests passed!' : 'Some tests failed!');
    
    return results;
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.testPlanetRendererFixes = testPlanetRendererFixes;
    window.testContainerInitialization = testContainerInitialization;
    window.runAllTests = runAllTests;
}