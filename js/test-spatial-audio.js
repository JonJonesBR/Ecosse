/**
 * Spatial Audio System Integration Test
 * This file tests the spatial audio system functionality
 */

import { spatialAudioSystem } from './systems/spatialAudioSystem.js';
import { eventSystem, EventTypes } from './systems/eventSystem.js';

/**
 * Test spatial audio system initialization and basic functionality
 */
export async function testSpatialAudioSystem() {
    console.log('🔊 Testing Spatial Audio System...');
    
    const results = {
        initialization: false,
        eventListening: false,
        spatialPositioning: false,
        environmentalEffects: false,
        cameraTracking: false,
        overall: false
    };
    
    try {
        // Test 1: Initialization
        console.log('Testing initialization...');
        await spatialAudioSystem.initialize();
        const status = spatialAudioSystem.getStatus();
        results.initialization = status.initialized && status.enabled;
        console.log(`✅ Initialization: ${results.initialization ? 'PASS' : 'FAIL'}`);
        
        // Test 2: Event listening
        console.log('Testing event listening...');
        let eventReceived = false;
        const testSubscription = eventSystem.subscribe(EventTypes.ELEMENT_CREATED, () => {
            eventReceived = true;
        });
        
        // Simulate element creation event
        eventSystem.publish(EventTypes.ELEMENT_CREATED, {
            element: { type: 'Planta', x: 100, y: 100 }
        });
        
        // Wait a bit for event processing
        await new Promise(resolve => setTimeout(resolve, 100));
        results.eventListening = eventReceived;
        testSubscription.unsubscribe();
        console.log(`✅ Event listening: ${results.eventListening ? 'PASS' : 'FAIL'}`);
        
        // Test 3: Spatial positioning
        console.log('Testing spatial positioning...');
        const testPosition = { x: 50, y: 25, z: -30 };
        const sourceId = spatialAudioSystem.playSpatialSound('plantGrow', testPosition, {
            volume: 0.1, // Low volume for testing
            category: 'elements',
            maxDistance: 100
        });
        results.spatialPositioning = sourceId !== null;
        console.log(`✅ Spatial positioning: ${results.spatialPositioning ? 'PASS' : 'FAIL'}`);
        
        // Test 4: Environmental effects
        console.log('Testing environmental effects...');
        const config = spatialAudioSystem.getConfig();
        results.environmentalEffects = config.enableReverb && status.reverbNodes > 0;
        console.log(`✅ Environmental effects: ${results.environmentalEffects ? 'PASS' : 'FAIL'}`);
        
        // Test 5: Camera tracking
        console.log('Testing camera tracking...');
        let cameraEventReceived = false;
        const cameraSubscription = eventSystem.subscribe(EventTypes.CAMERA_MOVED, () => {
            cameraEventReceived = true;
        });
        
        // Simulate camera movement
        eventSystem.publish(EventTypes.CAMERA_MOVED, {
            position: [10, 20, 30],
            target: [0, 0, 0]
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        results.cameraTracking = cameraEventReceived;
        cameraSubscription.unsubscribe();
        console.log(`✅ Camera tracking: ${results.cameraTracking ? 'PASS' : 'FAIL'}`);
        
        // Overall result
        results.overall = Object.values(results).every(result => result === true);
        
        console.log('\n🔊 Spatial Audio System Test Results:');
        console.log(`Initialization: ${results.initialization ? '✅' : '❌'}`);
        console.log(`Event Listening: ${results.eventListening ? '✅' : '❌'}`);
        console.log(`Spatial Positioning: ${results.spatialPositioning ? '✅' : '❌'}`);
        console.log(`Environmental Effects: ${results.environmentalEffects ? '✅' : '❌'}`);
        console.log(`Camera Tracking: ${results.cameraTracking ? '✅' : '❌'}`);
        console.log(`Overall: ${results.overall ? '✅ PASS' : '❌ FAIL'}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Spatial Audio System test failed:', error);
        return { ...results, overall: false, error: error.message };
    }
}

/**
 * Test spatial audio with simulated ecosystem elements
 */
export function testSpatialAudioWithElements() {
    console.log('🌍 Testing spatial audio with simulated ecosystem elements...');
    
    // Simulate various ecosystem elements at different positions
    const testElements = [
        { type: 'Planta', x: 50, y: 50, sound: 'plantRustle' },
        { type: 'Criatura', x: -30, y: 80, sound: 'creatureCall' },
        { type: 'Água', x: 0, y: -40, sound: 'waterFlow' },
        { type: 'Predador', x: 100, y: -20, sound: 'predatorRoar' },
        { type: 'Tribo', x: -50, y: -50, sound: 'tribeChant' }
    ];
    
    testElements.forEach((element, index) => {
        setTimeout(() => {
            console.log(`Playing spatial sound for ${element.type} at (${element.x}, ${element.y})`);
            
            // Convert 2D coordinates to 3D (simplified)
            const position3D = {
                x: element.x,
                y: 0, // Ground level
                z: element.y
            };
            
            spatialAudioSystem.playSpatialSound(element.sound, position3D, {
                volume: 0.2,
                category: 'elements',
                elementType: element.type,
                maxDistance: 150
            });
        }, index * 1000); // Stagger the sounds
    });
    
    console.log('✅ Spatial audio test with elements started. Listen for positioned sounds!');
}

/**
 * Test environmental reverb effects
 */
export function testEnvironmentalReverb() {
    console.log('🏔️ Testing environmental reverb effects...');
    
    const environments = ['forest', 'cave', 'mountain', 'desert', 'ocean'];
    const testSound = 'creatureCall';
    
    environments.forEach((env, index) => {
        setTimeout(() => {
            console.log(`Testing reverb in ${env} environment`);
            
            // Position sounds in different locations to simulate different environments
            const position = {
                x: index * 50 - 100,
                y: env === 'cave' ? -60 : (env === 'mountain' ? 120 : 0),
                z: index * 30 - 60
            };
            
            spatialAudioSystem.playSpatialSound(testSound, position, {
                volume: 0.3,
                category: 'elements',
                maxDistance: 200,
                reverb: true,
                reverbWetness: 0.5
            });
        }, index * 2000);
    });
    
    console.log('✅ Environmental reverb test started. Listen for different acoustic environments!');
}

/**
 * Make test functions available globally for console testing
 */
if (typeof window !== 'undefined') {
    window.testSpatialAudio = testSpatialAudioSystem;
    window.testSpatialAudioWithElements = testSpatialAudioWithElements;
    window.testEnvironmentalReverb = testEnvironmentalReverb;
    
    console.log('🔊 Spatial Audio Tests available:');
    console.log('- testSpatialAudio() - Run full system test');
    console.log('- testSpatialAudioWithElements() - Test with simulated elements');
    console.log('- testEnvironmentalReverb() - Test reverb effects');
}

export default {
    testSpatialAudioSystem,
    testSpatialAudioWithElements,
    testEnvironmentalReverb
};